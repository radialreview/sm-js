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
export declare class OptimisticUpdatesOrchestrator {
    private DOsById;
    private lastKnownPersistedDataById;
    private inFlightRequestsById;
    onDOConstructed: (DO: NodeDO) => void;
    onDODeleted: (DO: NodeDO) => void;
    onPersistedDataReceived: (opts: {
        data: {
            id: string;
            version: number;
            lastUpdatedBy: string;
        } & Record<string, any>;
        applyUpdateToDO: () => void;
    }) => void;
    onUpdateRequested: (update: {
        id: string;
        payload: Record<string, any>;
    }) => {
        onUpdateSuccessful: () => void;
        onUpdateFailed: () => void;
    };
    private handleUpdateFailed;
    private handleUpdateSuccessful;
    private getDOById;
    private cleanupIfNoInFlightRequests;
}
