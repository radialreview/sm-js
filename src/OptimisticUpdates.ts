import { deepClone } from './dataUtilities';
import { NodeDO } from './types';

export class OptimisticUpdatesOrchestrator {
  private DOsById: Record<string, NodeDO> = {};
  private rollbackStateById: Record<
    string,
    {
      persistedData: Record<string, any>;
      updateTriggerInfo: {
        userId: string;
        currentVersion: number;
        newVersion: number;
      };
    }
  > = {};
  private lastKnownPersistedVersionById: Record<string, number> = {};

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
  }

  public onPersistedDataReceived(
    data: { id: string; version: number } & Record<string, any>
  ) {
    if (!data.id) throw Error('No id fround in data');
    if (!data.version) throw Error('No version found in data');

    this.lastKnownPersistedVersionById[data.id] = Number(data.version);

    const userId = data.lastUpdatedBy;
    if (!userId) {
      throw Error(
        'For optimistic update reverts (in case of update failure) to work, all incoming updates must contain a "lastUpdatedBy" property containing the id of the user triggering the update.'
      );
    }

    const storedRollbackState = this.rollbackStateById[data.id];

    const updateWasTriggeredByOtherUser =
      storedRollbackState.updateTriggerInfo.userId !== userId;
    const isSameVersionAsLastOptimisticUpdate =
      storedRollbackState.updateTriggerInfo.newVersion ===
      this.lastKnownPersistedVersionById[data.id];
    const updateWasTriggeredByUserWhichHasReceivedOptimisticUpdates =
      isSameVersionAsLastOptimisticUpdate && !updateWasTriggeredByOtherUser;
    const isSameOrNewerVersionAsLastOptimisticUpdate =
      this.lastKnownPersistedVersionById[data.id] >=
      storedRollbackState.updateTriggerInfo.newVersion;

    // if we receive data about a node for which there is a stored rollback state
    // update that rollback state's data to the data received
    if (
      storedRollbackState &&
      // if it's a message containing the data last applied in an optimistic update, ignore that message
      !updateWasTriggeredByUserWhichHasReceivedOptimisticUpdates &&
      // also ignore if it's a message about a version older than the last optimistic update
      // which could happen if the user has applied several optimistic updates which are still being processed
      isSameOrNewerVersionAsLastOptimisticUpdate
    ) {
      const DO = this.DOsById[data.id];
      if (!DO) {
        throw Error(
          `The DO with the id ${data.id} was not found in the OptimisticUpdatesOrchestrator's cache. Ensure you're calling "onDOConstructed".`
        );
      }
      const currentVersion = DO.persistedData.version;
      const newVersion = currentVersion + 1;
      this.rollbackStateById[data.id] = {
        persistedData: data,
        updateTriggerInfo: {
          userId,
          currentVersion,
          newVersion,
        },
      };
    }
  }

  public onUpdateRequested(update: {
    id: string;
    payload: Record<string, any>;
  }) {
    const DO = this.DOsById[update.id];
    if (!this.DOsById[update.id]) {
      throw Error(
        `The DO with the id ${update.id} was not found in the OptimisticUpdatesOrchestrator's cache. Ensure you're calling "onDOConstructed".`
      );
    }

    const userId = update.payload.lastUpdatedBy;
    if (!userId) {
      throw Error(
        'For optimistic update reverts (in case of update failure) to work, all incoming updates must contain a "lastUpdatedBy" property containing the id of the user triggering the update.'
      );
    }
    const currentVersion = DO.persistedData.version;
    const newVersion = currentVersion + 1;

    this.rollbackStateById[DO.id] = {
      persistedData: deepClone(DO.persistedData), // persisted data gets extended on the node, so cloning it here so it doesn't get mutated by an incoming update
      updateTriggerInfo: {
        userId,
        currentVersion,
        newVersion,
      },
    };

    DO.onDataReceived({ ...update.payload, version: newVersion });

    return {
      onUpdateFailed: () => {
        const rollbackState = this.rollbackStateById[DO.id];

        if (
          rollbackState &&
          rollbackState.updateTriggerInfo.userId === userId &&
          rollbackState.updateTriggerInfo.newVersion === newVersion
        ) {
          // apply rollback
          DO.onDataReceived(rollbackState.persistedData);
        }
      },
      onUpdateSuccessful: () => {
        const lastStoredRollbackState = this.rollbackStateById[DO.id];
        if (
          lastStoredRollbackState.updateTriggerInfo.timestamp === timestamp &&
          lastStoredRollbackState.updateTriggerInfo.userId === userId
        ) {
          delete this.rollbackStateById[DO.id];
        }
      },
    };
  }
}

// When data is queried and received by the SMJS instanceof, OptimisticUpdatesOrchestrator keeps an up to date record of DOs constructed, indexed by their id.
// Then, when sm.transaction is called with one or more update operations, the OptimisticUpdatesOrchestrator's "onUpdateRequested" function is called by that transaction context builder (one time per each update operation).
// This onUpdateRequested function returns onUpdateFailed and onUpdateSuccessful hooks that the transaction must then execute when it completes.

// onUpdateFailed will rollback the state of the DO to the last persisted state
// both onUpdateFailed and onUpdateSuccessful will cleanup rollback states stored within the OptimisticUpdatesOrchestrator

//     edge case 1: if the update fails fails, but there were other received updates between the time of update requested and the update failing, we cannot revert to the state
//             stored when the optimistic update was requested. We need to revert to the last known persisted state.
//
//     edge case 2: for easier form auto-save integration, the optimistic update should be applied to the node's data before any async operations.
//                This means that we cannot make any network requests between when the user types a letter into the form and when the "updateNode" operation is executed.
//
//                I don't think there's any way we can fully prevent this from happening, so this may be an arguments towards having an intermediate/proxy
//                state for form inputs
//

// Test cases
// 1) happy path simple update should make the DO return new data for any properties updated
// 2) if the update fails, DO should return to the previously persisted state
// 3) if updates about new persisted states are received between update being requested and that update failing, the DO should return to the last persisted state

// if we call updateNode several times with the same node id, and get a message about a version older than the last update, how do we deal with that?
//   ignore it, since it will likely be overwritten by the update in flight?
//     risky because we can't assume that update will be successful
