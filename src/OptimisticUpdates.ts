import { update } from 'lodash';
import { deepClone } from './dataUtilities';
import { NodeDO } from './types';

/**
 * This class is responsible for handling all logic pertaining optimistic updates.
 *
 * It works by intercepting all incoming messages about nodes that the user queries or is subscribed to
 * Then, it also intercepts requests to updateNode and updateNodes within a transaction
 *
 * It optimistically updates the state at the DO level, while also keeping track of known persisted states
 * (the ones that derived from messages received by the node repository)
 *
 * You might wonder, why keep track of all persisted states, rather than just the persisted state at the time of the last update request?
 *
 * I'll answer that with a question:
 * If we call updateNode/updateNodes several times with the same node id, and get a message about a version older than the last update, how do we deal with that?
 *   We could ignore it, since it will likely be overwritten by the update in flight, but this seems risky because we can't assume that the update will be successful. Ignoring that incoming update could lead to stale states if the request does fail.
 *   We could also apply it, since we know it's data that's been persisted in SM. This would likely lead to UX feeling janky. For example, if a user is typing into an input and we're sending debounced updates to SM
 *      and with each update optimistically updating our in memory cache (the DO), but also applying incoming persisted states, the value being displayed for that field would change erratically.
 *
 * I believe a fix for this is to keep applying only optimistic updates to in memory cache if there is any in flight request, while keeping track of all received persisted states
 * We short circuit the repository's onDataReceived so it no longer updates the DO, if any updates are in flight. Instead, it only tells the OptimisticUpdatesOrchestrator that there is a new persisted state.
 * If a single update request fails, and there are no other updates in flight, revert to the last persisted state. Decrease number of in flight requests.
 * If an update request in a group of update requests fails, and there are other updates in flight to SM, decrease number of in flight requests. Don't revert to last persisted state, since this would cause the erratic behavior described above.
 * If an update request succeeds (solo or in a group), simply decrease number of in flight requests.
 *
 * Once the number of in flight requests reaches 0, the repository would no longer get short circuited.
 *
 * Then, we can decide how to update the state on the DO, by leaving it at the newest optimistic update state
 *
 * We would stop capturing persisted data in OptimisticUpdatesOrchestrator for this particular node (which we identify by its id),
 * and delete any persisted data for that node that is currently cached in the OptimisticUpdatesOrchestrator to avoid memory leaks.
 */
export class OptimisticUpdatesOrchestrator {
  private DOsById: Record<string, NodeDO> = {};
  private lastKnownPersistedDataById: Record<string, Record<string, any>> = {};
  private inFlightRequestsById: Record<string, number> = {};

  public onDOConstructed(DO: NodeDO) {
    if (!DO.id) throw Error('No id found in DO');
    if (this.DOsById[DO.id])
      throw Error(
        `The DO with the id "${DO.id}" was previously constructed and it is unexpected that this is happening a second time.
        There may be 2 instances of the same node type being initialized.`
      );
    this.DOsById[DO.id] = DO;
  }

  public onDODeleted(DO: NodeDO) {
    if (!DO.id) throw Error('No id found in DO');
    delete this.DOsById[DO.id];
    delete this.lastKnownPersistedDataById[DO.id];
  }

  public onPersistedDataReceived(opts: {
    data: { id: string; version: number } & Record<string, any>;
    applyUpdateToDO: () => void;
  }) {
    const nodeId = opts.data.id;
    const version = Number(opts.data.version);
    const userId = opts.data.lastUpdatedBy;
    if (!userId || !version || !nodeId) {
      throw Error(
        'For optimistic updates to work, all persisted updates must contain "id", "lastUpdatedBy" and "version" properties.'
      );
    }

    // this is how we short circuit ths repository
    // read comment above this class to understand why
    if (this.inFlightRequestsById[nodeId]) {
      this.lastKnownPersistedDataById[nodeId] = opts.data;
    } else {
      opts.applyUpdateToDO();
    }
  }

  public onUpdateRequested(update: {
    id: string;
    payload: Record<string, any>;
  }) {
    const DO = this.getDOById(update.id);
    const userId = update.payload.lastUpdatedBy;
    if (!userId) {
      throw Error(
        'For optimistic update reverts (in case of update failure) to work, all incoming updates must contain a "lastUpdatedBy" property containing the id of the user triggering the update.'
      );
    }

    if (!this.inFlightRequestsById[update.id]) {
      // before any in flight requests go out, we know that the persisted data on a DO is truly persisted
      this.lastKnownPersistedDataById[update.id] = deepClone(DO.persistedData); // persisted data gets extended on the node, so cloning it here so it doesn't get mutated by an incoming update
      this.inFlightRequestsById[update.id] = 1;
    } else {
      // if requests are in flight, the "persisted" data on a DO may actually originate from an optimistic update
      // this is simply to avoid introducing optimistic update logic in the DO class.
      // in that case, the true persisted state will be intercepted from the repository by "onPersistedDataReceived" above
      this.inFlightRequestsById[update.id]++;
    }

    const currentVersion = DO.persistedData.version;
    const newVersion = currentVersion + 1;

    DO.onDataReceived({ ...update.payload, version: newVersion });

    return {
      onUpdateFailed: () => {
        this.inFlightRequestsById[update.id]--;
        this.revertIfNoInFlightRequests(update.id);
        this.cleanupIfNoInFlightRequests(update.id);
      },
      onUpdateSuccessful: () => {
        this.inFlightRequestsById[update.id]--;
        this.cleanupIfNoInFlightRequests(update.id);
      },
    };
  }

  private revertIfNoInFlightRequests(id: string) {
    if (!this.inFlightRequestsById[id]) {
      if (!this.lastKnownPersistedDataById[id]) {
        throw Error(
          'A revert was attempted but no known persisted data state was found.'
        );
      }
      const DO = this.getDOById(id);
      DO.onDataReceived(this.lastKnownPersistedDataById[id]);
    }
  }

  private getDOById(id: string) {
    const DO = this.DOsById[id];
    if (!this.DOsById[id]) {
      throw Error(
        `The DO with the id ${id} was not found in the OptimisticUpdatesOrchestrator's cache. Ensure you're calling "onDOConstructed".`
      );
    }
    return DO;
  }

  private cleanupIfNoInFlightRequests(id: string) {
    if (!this.inFlightRequestsById[id]) {
      delete this.lastKnownPersistedDataById[id];
      delete this.inFlightRequestsById[id];
    }
  }
}

// Test cases
// 1) happy path simple update should make the DO return new data for any properties updated
// 2) if the update fails, DO should return to the previously persisted state
// 3) if updates about new persisted states are received between update being requested and that update failing, the DO should return to the last persisted state
