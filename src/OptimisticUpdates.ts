import { deepClone } from './dataUtilities';
import { Id, Maybe, NodeDO } from './types';

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
  private inFlightRequestsById: Record<
    string,
    Array<{ rollbackState: Record<string, any> }>
  > = {};

  public onDOConstructed = (DO: NodeDO) => {
    if (!DO.id) throw Error('No id found in DO');
    this.DOsById[DO.id] = DO;
  };

  public onDODeleted = (DO: NodeDO) => {
    if (!DO.id) throw Error('No id found in DO');
    delete this.DOsById[DO.id];
    delete this.lastKnownPersistedDataById[DO.id];
  };

  public onPersistedDataReceived = (opts: {
    data: {
      id: Id;
      version: number;
      lastUpdatedBy: string;
    } & Record<string, any>;
    applyUpdateToDO: () => void;
  }) => {
    const nodeId = opts.data.id;

    // this is how we short circuit ths repository
    // read comment above this class to understand why
    if (this.inFlightRequestsById[nodeId]) {
      this.lastKnownPersistedDataById[nodeId] = opts.data;
    } else {
      opts.applyUpdateToDO();
    }
  };

  public onUpdateRequested = (update: {
    id: Id;
    payload: Record<string, any>;
  }) => {
    const DO = this.getDOById(update.id);
    // No DO found in cache means we're likely in a unit test, or possible the node was dropped right as the update was request
    // Better to simply do nothing than to throw an error here.
    if (!DO)
      return {
        onUpdateSuccessful: () => {},
        onUpdateFailed: () => {},
      };

    const rollbackState = {
      // persisted data gets extended on the node, so cloning it here so it doesn't get mutated by an incoming update
      ...deepClone(DO.persistedData),
      version: DO.version,
      lastUpdatedBy: DO.lastUpdatedBy,
    };

    if (!this.inFlightRequestsById[update.id]) {
      // before any in flight requests go out, we know that the persisted data on a DO is truly persisted
      this.lastKnownPersistedDataById[update.id] = rollbackState;
      this.inFlightRequestsById[update.id] = [{ rollbackState }];
    } else {
      // if requests are in flight, the "persisted" data on a DO may actually originate from an optimistic update
      // this is simply to avoid introducing optimistic update logic in the DO class.
      // in that case, the true persisted state will be intercepted from the repository by "onPersistedDataReceived" above
      this.inFlightRequestsById[update.id].push({ rollbackState });
    }

    const updateIdx = this.inFlightRequestsById[update.id].length - 1;

    const currentVersion = Number(DO.version);
    const newVersion = currentVersion + 1;

    DO.onDataReceived({ ...update.payload, version: newVersion });

    return {
      onUpdateFailed: () => {
        this.handleUpdateFailed({ updateIdx, id: update.id });
      },
      onUpdateSuccessful: () => {
        this.handleUpdateSuccessful({ updateIdx, id: update.id });
      },
    };
  };

  private handleUpdateFailed(opts: { updateIdx: number; id: Id }) {
    const inFlightRequestsForThisNode = this.inFlightRequestsById[opts.id];
    const wasLastTriggeredUpdate =
      inFlightRequestsForThisNode.length === opts.updateIdx + 1;
    if (wasLastTriggeredUpdate) {
      const DO = this.getDOById(opts.id);
      if (!DO) return;
      const hasPreviousInFlightUpdate = inFlightRequestsForThisNode.length > 1;
      if (hasPreviousInFlightUpdate) {
        const previousInFlightRollbackState =
          inFlightRequestsForThisNode[inFlightRequestsForThisNode.length - 1]
            .rollbackState;
        DO.onDataReceived(previousInFlightRollbackState, {
          // __unsafeIgnoreVersion should used by OptimisticUpdatesOrchestrator ONLY
          // it allows setting the data on the DO to a version older than the last optimistic update
          // so that we can revert on a failed request
          __unsafeIgnoreVersion: true,
        });
      } else {
        DO.onDataReceived(this.lastKnownPersistedDataById[opts.id], {
          // __unsafeIgnoreVersion should used by OptimisticUpdatesOrchestrator ONLY
          // it allows setting the data on the DO to a version older than the last optimistic update
          // so that we can revert on a failed request
          __unsafeIgnoreVersion: true,
        });
        inFlightRequestsForThisNode.splice(opts.updateIdx, 1);
      }
    }

    inFlightRequestsForThisNode.splice(opts.updateIdx, 1);

    this.cleanupIfNoInFlightRequests(opts.id);
  }

  private handleUpdateSuccessful(opts: { updateIdx: number; id: Id }) {
    const inFlightRequestsForThisNode = this.inFlightRequestsById[opts.id];
    inFlightRequestsForThisNode.splice(opts.updateIdx, 1);
    this.cleanupIfNoInFlightRequests(opts.id);
  }

  private getDOById(id: Id): Maybe<NodeDO> {
    const DO = this.DOsById[id];
    return DO;
  }

  private cleanupIfNoInFlightRequests(id: Id) {
    if (!this.inFlightRequestsById[id].length) {
      delete this.lastKnownPersistedDataById[id];
      delete this.inFlightRequestsById[id];
    }
  }
}
