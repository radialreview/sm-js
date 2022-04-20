import React from 'react';
import { convertQueryDefinitionToQueryInfo } from '../queryDefinitionAdapters';
import {
  QueryDataReturn,
  UseSubscriptionReturn,
  Maybe,
  UseSubscriptionQueryDefinitions,
} from '../types';

import { ISMContext, ISMContextSubscription, SMContext } from './context';

export function useSubscription<
  TQueryDefinitions extends UseSubscriptionQueryDefinitions
>(
  queryDefinitions: TQueryDefinitions,
  opts?: { subscriptionId: string }
): UseSubscriptionReturn<TQueryDefinitions> {
  const smContext = React.useContext(SMContext);

  if (!smContext) {
    throw Error(
      'You must wrap your app with an SMProvider before using useSubscription.'
    );
  }

  const obj = { stack: '' };
  Error.captureStackTrace(obj, useSubscription);
  if (obj.stack === '') {
    // Should be supported in all browsers, but better safe than sorry
    throw Error('Error.captureStackTrace not supported');
  }
  const subscriptionId = opts?.subscriptionId || obj.stack.split('\n')[1];

  const preExistingState = getPreexistingState({
    subscriptionId,
    smContext,
    queryDefinitions,
  });

  const [results, setResults] = React.useState<
    QueryDataReturn<TQueryDefinitions>
  >(preExistingState.results);
  const [error, setError] = React.useState<any>(preExistingState.error);
  const [querying, setQuerying] = React.useState<boolean>(
    preExistingState.querying
  );

  let qdStateManager: Maybe<UseSubscriptionReturn<TQueryDefinitions> & {
    cancelCleanup(): void;
    scheduleCleanup(): void;
  }> = null;
  let qdError: Maybe<any> = null;
  try {
    // buildQueryDefinitionStateManager throws a promise if a query is suspending rendering
    // we catch that promise here and re-throw it further down, so that we can manage cleanup
    // if this function throws and it is not caught, then the number of hooks produced by this hook changes, causing a react error
    qdStateManager = buildQueryDefinitionStateManager({
      smContext,
      subscriptionId,
      queryDefinitions,
      data: {
        results: results,
        error: error,
        querying: querying,
      },
      handlers: {
        onResults: setResults,
        onError: setError,
        setQuerying,
      },
    });
  } catch (e) {
    qdError = e;
    qdStateManager = null;
  }

  React.useEffect(() => {
    qdStateManager?.cancelCleanup();
    return () => {
      qdStateManager?.scheduleCleanup();
    };
  }, [smContext, subscriptionId]);

  if (qdError) throw qdError;

  return qdStateManager as UseSubscriptionReturn<TQueryDefinitions> & {
    cancelCleanup(): void;
    scheduleCleanup(): void;
  };
}

function getPreexistingState<
  TQueryDefinitions extends UseSubscriptionQueryDefinitions
>(opts: {
  smContext: ISMContext;
  subscriptionId: string;
  queryDefinitions: TQueryDefinitions;
}) {
  const subscriptionId = opts.subscriptionId;
  const preExistingContextForThisSubscription =
    opts.smContext.ongoingSubscriptionRecord[subscriptionId];

  const results =
    preExistingContextForThisSubscription?.results ||
    Object.keys(opts.queryDefinitions).reduce(
      (acc, key: keyof TQueryDefinitions) => {
        acc[key] = null;
        return acc;
      },
      {} as { [key in keyof TQueryDefinitions]: null }
    );
  const error = preExistingContextForThisSubscription?.error;
  const querying =
    preExistingContextForThisSubscription?.querying != null
      ? preExistingContextForThisSubscription?.querying
      : true;

  return { results, error, querying };
}

/**
 * useSubscription accepts query definitions that optionally disable suspense rendering
 * to facilitate that, this method splits all query definitions into 2 groups
 * @param queryDefinitions
 * @returns {suspendEnabled: UseSubscriptionQueryDefinitions, suspendDisabled: UseSubscriptionQueryDefinitions}
 */
function splitQueryDefinitions(
  queryDefinitions: UseSubscriptionQueryDefinitions
): {
  suspendEnabled: UseSubscriptionQueryDefinitions;
  suspendDisabled: UseSubscriptionQueryDefinitions;
} {
  return Object.entries(queryDefinitions).reduce(
    (split, [alias, queryDefinition]) => {
      const suspend =
        queryDefinition.useSubOpts?.doNotSuspend != null
          ? !queryDefinition.useSubOpts.doNotSuspend
          : true;

      split[
        suspend
          ? subscriptionIds.suspendEnabled
          : subscriptionIds.suspendDisabled
      ][alias] = queryDefinition;
      return split;
    },
    {
      [subscriptionIds.suspendEnabled]: {},
      [subscriptionIds.suspendDisabled]: {},
    } as {
      suspendEnabled: UseSubscriptionQueryDefinitions;
      suspendDisabled: UseSubscriptionQueryDefinitions;
    }
  );
}

const subscriptionIds = {
  suspendEnabled: 'suspendEnabled' as 'suspendEnabled',
  suspendDisabled: 'suspendDisabled' as 'suspendDisabled',
};

function buildQueryDefinitionStateManager<
  TQueryDefinitions extends UseSubscriptionQueryDefinitions
>(opts: {
  smContext: ISMContext;
  subscriptionId: string;
  queryDefinitions: TQueryDefinitions;
  data: {
    results: QueryDataReturn<TQueryDefinitions> | undefined;
    error: any;
    querying: boolean;
  };
  handlers: {
    onResults(results: any): void;
    onError(error: any): void;
    setQuerying(querying: boolean): void;
  };
}): UseSubscriptionReturn<TQueryDefinitions> & {
  cancelCleanup(): void;
  scheduleCleanup(): void;
} {
  type TReturn = UseSubscriptionReturn<TQueryDefinitions> & {
    cancelCleanup(): void;
    scheduleCleanup(): void;
  };

  // When a subscription is initialized, the state of the subscription is split
  // suspended subscriptions and non suspended subscriptions are initialized separately,
  // so that rendering can continue as soon as possible.
  // To maintain shared state (like results, which are an aggregate of the results from both suspended and non suspended queries)
  // separately from subscription specific state (like the previously generated gql fragments to compare previous and next state and discover if we need to reinitialize subscriptions)
  // we have a parentSubscriptionId we use for storing shared state, and a subscriptionId for storing subscription specific state
  const parentSubscriptionId = opts.subscriptionId;
  const preExistingContextForThisParentSubscription =
    opts.smContext.ongoingSubscriptionRecord[parentSubscriptionId];
  if (!preExistingContextForThisParentSubscription) {
    opts.smContext.ongoingSubscriptionRecord[parentSubscriptionId] = {};
  }

  function cancelCleanup() {
    opts.smContext.cancelCleanup(parentSubscriptionId);
  }

  function scheduleCleanup() {
    opts.smContext.scheduleCleanup(parentSubscriptionId);
  }

  // We can not directly call "onResults" from this function's arguments within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling onResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.
  opts.smContext.updateSubscriptionInfo(parentSubscriptionId, {
    onResults: opts.handlers.onResults,
    onError: opts.handlers.onError,
    setQuerying: opts.handlers.setQuerying,
  });

  const { suspendDisabled, suspendEnabled } = splitQueryDefinitions(
    opts.queryDefinitions
  );

  const allSubscriptionIds = Object.values(subscriptionIds).map(
    subscriptionId => parentSubscriptionId + subscriptionId
  );
  function getAllSubscriptionStates(): Array<
    ISMContextSubscription | undefined
  > {
    return allSubscriptionIds.map(
      subscriptionId => opts.smContext.ongoingSubscriptionRecord[subscriptionId]
    );
  }

  // From the received queried definitions
  // and a static parentSubscriptionId+subscriptionSuffix identifier
  // initializes subscriptions and updates the useSubscription state on the hook
  // Also maintains a copy of that state at the context level, such that the component rendering the hook
  // can unmount and remount without losing its state. This is key for suspense to work, since components unmount when a promise is thrown
  //
  // returns a promise if there's an unresolved request and "suspend" is set to true
  function handleNewQueryDefitions(subOpts: {
    queryDefinitions: UseSubscriptionQueryDefinitions;
    parentSubscriptionId: string;
    subscriptionSuffix: string;
    suspend: boolean;
  }): Promise<any> | undefined {
    const {
      queryDefinitions,
      parentSubscriptionId,
      subscriptionSuffix,
      suspend,
    } = subOpts;
    const subscriptionId = parentSubscriptionId + subscriptionSuffix;

    const preExistingContextForThisSubscription =
      opts.smContext.ongoingSubscriptionRecord[subscriptionId];

    if (!preExistingContextForThisSubscription) {
      opts.smContext.ongoingSubscriptionRecord[subscriptionId] = {};
    }

    let newQueryInfo;
    if (preExistingContextForThisSubscription?.queryInfo) {
      newQueryInfo = convertQueryDefinitionToQueryInfo({
        queryDefinitions: subOpts.queryDefinitions,
        queryId: preExistingContextForThisSubscription.queryInfo.queryId,
      });
    }

    const queryDefinitionHasBeenUpdated =
      newQueryInfo &&
      preExistingContextForThisSubscription?.queryInfo &&
      preExistingContextForThisSubscription.queryInfo.queryGQL !==
        newQueryInfo.queryGQL;

    if (
      preExistingContextForThisSubscription &&
      !queryDefinitionHasBeenUpdated
    ) {
      return preExistingContextForThisSubscription.suspendPromise;
    }

    if (queryDefinitionHasBeenUpdated) {
      preExistingContextForThisSubscription.unsub &&
        preExistingContextForThisSubscription.unsub();
    }

    const queryTimestamp = new Date().valueOf();
    opts.smContext.updateSubscriptionInfo(parentSubscriptionId, {
      querying: true,
    });
    opts.smContext.updateSubscriptionInfo(subscriptionId, {
      querying: true,
      lastQueryTimestamp: queryTimestamp,
    });
    console.log('querying');
    opts.handlers.setQuerying(true);
    const suspendPromise = opts.smContext.smJSInstance
      .subscribe(queryDefinitions, {
        onData: ({ results: newResults }) => {
          const contextforThisSub =
            opts.smContext.ongoingSubscriptionRecord[subscriptionId];
          const thisQueryIsMostRecent =
            contextforThisSub.lastQueryTimestamp === queryTimestamp;
          if (thisQueryIsMostRecent) {
            const contextForThisParentSub =
              opts.smContext.ongoingSubscriptionRecord[parentSubscriptionId];
            contextForThisParentSub.onResults &&
              contextForThisParentSub.onResults({
                ...opts.data.results,
                ...newResults,
              });
            opts.smContext.updateSubscriptionInfo(
              subOpts.parentSubscriptionId,
              {
                results: { ...opts.data.results, ...newResults },
              }
            );
          }
        },
        onError: error => {
          const contextForThisParentSub =
            opts.smContext.ongoingSubscriptionRecord[parentSubscriptionId];
          contextForThisParentSub.onError &&
            contextForThisParentSub.onError(error);
          opts.smContext.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
            error,
          });
        },
        onSubscriptionInitialized: subscriptionCanceller => {
          opts.smContext.updateSubscriptionInfo(subscriptionId, {
            unsub: () => subscriptionCanceller(),
          });
          opts.smContext.updateSubscriptionInfo(parentSubscriptionId, {
            unsub: () => {
              getAllSubscriptionStates().map(
                subscriptionState =>
                  subscriptionState?.unsub && subscriptionState?.unsub()
              );
            },
          });
        },
        onQueryInfoConstructed: queryInfo => {
          opts.smContext.updateSubscriptionInfo(subscriptionId, {
            queryInfo,
          });
        },
      })
      .finally(() => {
        const contextForThisSub =
          opts.smContext.ongoingSubscriptionRecord[subscriptionId];
        const thisQueryIsMostRecent =
          contextForThisSub?.lastQueryTimestamp === queryTimestamp;
        if (thisQueryIsMostRecent) {
          contextForThisSub.setQuerying && contextForThisSub.setQuerying(false);
          opts.smContext.updateSubscriptionInfo(subscriptionId, {
            suspendPromise: undefined,
            querying: false,
          });

          // if all the queries have resolved, we can set "querying" to false for the parent subscription state
          const allQueriesHaveResolved = !getAllSubscriptionStates().some(
            state => state && state.querying
          );
          if (allQueriesHaveResolved) {
            opts.handlers.setQuerying(false);
            opts.smContext.updateSubscriptionInfo(parentSubscriptionId, {
              querying: false,
            });
            console.log('set querying false');
          }
        }
      });

    if (!preExistingContextForThisSubscription && suspend) {
      opts.smContext.updateSubscriptionInfo(subscriptionId, {
        suspendPromise,
      });
    }

    if (suspend) return suspendPromise;

    return undefined;
  }

  if (
    opts.data.error ||
    opts.smContext.ongoingSubscriptionRecord[parentSubscriptionId].error
  )
    throw opts.data.error ||
      opts.smContext.ongoingSubscriptionRecord[parentSubscriptionId].error;

  if (Object.keys(suspendDisabled).length) {
    handleNewQueryDefitions({
      queryDefinitions: suspendDisabled,
      parentSubscriptionId,
      subscriptionSuffix: subscriptionIds.suspendDisabled,
      suspend: false,
    });
  }

  if (Object.keys(suspendEnabled).length) {
    const suspendPromise = handleNewQueryDefitions({
      queryDefinitions: suspendEnabled,
      parentSubscriptionId,
      subscriptionSuffix: subscriptionIds.suspendEnabled,
      suspend: true,
    });

    if (suspendPromise) throw suspendPromise;
  }

  return {
    data: opts.data.results,
    error: opts.data.error,
    querying: opts.data.querying,
    scheduleCleanup,
    cancelCleanup,
  } as TReturn;
}
