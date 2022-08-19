import React from 'react';
import { convertQueryDefinitionToQueryInfo } from '../queryDefinitionAdapters';
import { removeNullishQueryDefinitions } from '../queriers';
import {
  QueryDataReturn,
  UseSubscriptionReturn,
  Maybe,
  UseSubscriptionQueryDefinitions,
  UseSubscriptionQueryDefinitionOpts,
  SubscriptionMeta,
} from '../types';

import {
  IContext,
  IContextSubscription,
  LoggingContext,
  MMGQLContext,
} from './context';

export function useSubscription<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts,
  TQueryDefinitions extends UseSubscriptionQueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts
  >
>(
  queryDefinitions: TQueryDefinitions,
  opts?: { subscriptionId?: string }
): UseSubscriptionReturn<TQueryDefinitions> {
  const context = React.useContext(MMGQLContext);

  if (!context) {
    throw Error(
      'You must wrap your app with an MMGQLProvider before using useSubscription.'
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
    context,
    queryDefinitions,
  });

  const [results, setResults] = React.useState<
    QueryDataReturn<TQueryDefinitions>
  >(preExistingState.results);
  const [error, setError] = React.useState<any>(preExistingState.error);
  const [querying, setQuerying] = React.useState<boolean>(
    preExistingState.querying
  );
  const loggingContext = React.useContext(LoggingContext);

  let qdStateManager: Maybe<UseSubscriptionReturn<TQueryDefinitions> & {
    onHookMount(): void;
    onHookUnmount(): void;
  }> = null;
  let qdError: Maybe<any> = null;
  try {
    // buildQueryDefinitionStateManager throws a promise if a query is suspending rendering
    // we catch that promise here and re-throw it further down, so that we can manage cleanup
    // if this function throws and it is not caught, then the number of hooks produced by this hook changes, causing a react error
    qdStateManager = buildQueryDefinitionStateManager({
      context,
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
      silenceDuplicateSubIdErrors:
        loggingContext.unsafe__silenceDuplicateSubIdErrors,
    });
  } catch (e) {
    qdError = e;
    qdStateManager = null;
  }

  React.useEffect(() => {
    qdStateManager?.onHookMount();
    return () => {
      qdStateManager?.onHookUnmount();
    };
    // can't add qdStateManager to the dependencies here, as this would cause this useEffect to run with every re-render
    // memoizing qdStateManager can be done, but then we'd have to silence the exhaustive-deps check for queryDefinitions, unless we forced devs
    // to memoize all of their query definitions, which seems overkill
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, subscriptionId]);

  if (error || qdError) throw error || qdError;

  return qdStateManager as UseSubscriptionReturn<TQueryDefinitions> & {
    onHookMount(): void;
    onHookUnmount(): void;
  };
}

function getPreexistingState<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts,
  TQueryDefinitions extends UseSubscriptionQueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts
  >
>(opts: {
  context: IContext;
  subscriptionId: string;
  queryDefinitions: TQueryDefinitions;
}) {
  const preExistingContextForThisSubscription =
    opts.context.ongoingSubscriptionRecord[opts.subscriptionId];

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
      ? preExistingContextForThisSubscription.querying
      : true;

  return { results, error, querying };
}

/**
 * useSubscription accepts query definitions that optionally disable suspense rendering
 * to facilitate that, this method splits all query definitions into 2 groups
 * @param queryDefinitions
 * @returns {suspendEnabled: UseSubscriptionQueryDefinitions, suspendDisabled: UseSubscriptionQueryDefinitions}
 */
function splitQueryDefinitions<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts,
  TQueryDefinitions extends UseSubscriptionQueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts
  >
>(
  queryDefinitions: TQueryDefinitions
): {
  suspendEnabled: TQueryDefinitions;
  suspendDisabled: TQueryDefinitions;
} {
  return Object.entries(queryDefinitions).reduce(
    (split, [alias, queryDefinition]) => {
      const suspend =
        queryDefinition &&
        'useSubOpts' in queryDefinition &&
        queryDefinition.useSubOpts?.doNotSuspend != null
          ? !queryDefinition.useSubOpts.doNotSuspend
          : true;

      split[
        suspend
          ? subscriptionIds.suspendEnabled
          : subscriptionIds.suspendDisabled
      ][
        alias as keyof TQueryDefinitions
      ] = queryDefinition as TQueryDefinitions[string];
      return split;
    },
    {
      [subscriptionIds.suspendEnabled]: {},
      [subscriptionIds.suspendDisabled]: {},
    } as {
      suspendEnabled: TQueryDefinitions;
      suspendDisabled: TQueryDefinitions;
    }
  );
}

const subscriptionIds = {
  suspendEnabled: 'suspendEnabled' as 'suspendEnabled',
  suspendDisabled: 'suspendDisabled' as 'suspendDisabled',
};

function buildQueryDefinitionStateManager<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts,
  TQueryDefinitions extends UseSubscriptionQueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts
  >
>(opts: {
  context: IContext;
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
  silenceDuplicateSubIdErrors: boolean;
}): UseSubscriptionReturn<TQueryDefinitions> & {
  onHookMount(): void;
  onHookUnmount(): void;
} {
  type TReturn = UseSubscriptionReturn<TQueryDefinitions> & {
    onHookMount(): void;
    onHookUnmount(): void;
  };

  // When a subscription is initialized, the state of the subscription is split
  // suspended subscriptions and non suspended subscriptions are initialized separately,
  // so that rendering can continue as soon as possible.
  // To maintain shared state (like results, which are an aggregate of the results from both suspended and non suspended queries)
  // separately from subscription specific state (like the previously generated gql fragments to compare previous and next state and discover if we need to reinitialize subscriptions)
  // we have a parentSubscriptionId we use for storing shared state, and a subscriptionId for storing subscription specific state
  const parentSubscriptionId = opts.subscriptionId;
  const preExistingContextForThisParentSubscription =
    opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
  if (!preExistingContextForThisParentSubscription) {
    opts.context.ongoingSubscriptionRecord[parentSubscriptionId] = {};
  }

  function onHookMount() {
    opts.context.onHookMount(parentSubscriptionId, {
      silenceDuplicateSubIdErrors: opts.silenceDuplicateSubIdErrors,
    });
    opts.context.cancelCleanup(parentSubscriptionId);
    allSubscriptionIds.forEach(subId => opts.context.cancelCleanup(subId));
  }

  function onHookUnmount() {
    opts.context.onHookUnmount(parentSubscriptionId);
    opts.context.scheduleCleanup(parentSubscriptionId);
    allSubscriptionIds.forEach(subId => opts.context.scheduleCleanup(subId));
  }

  // We can not directly call "onResults" from this function's arguments within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling onResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.
  opts.context.updateSubscriptionInfo(parentSubscriptionId, {
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
  function getAllSubscriptionStates(): Array<IContextSubscription | undefined> {
    return allSubscriptionIds.map(
      subscriptionId => opts.context.ongoingSubscriptionRecord[subscriptionId]
    );
  }

  // From the received queried definitions
  // and a static parentSubscriptionId+subscriptionSuffix identifier
  // initializes subscriptions and updates the useSubscription state on the hook
  // Also maintains a copy of that state at the context level, such that the component rendering the hook
  // can unmount and remount without losing its state. This is key for suspense to work, since components unmount when a promise is thrown
  //
  // returns a promise if there's an unresolved request and "suspend" is set to true
  function handleNewQueryDefitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts,
    TQueryDefinitions extends UseSubscriptionQueryDefinitions<
      TNode,
      TMapFn,
      TQueryDefinitionTarget,
      TUseSubscriptionQueryDefinitionOpts
    >
  >(subOpts: {
    queryDefinitions: TQueryDefinitions;
    parentSubscriptionId: string;
    subscriptionSuffix: string;
    suspend: boolean;
  }): Promise<
    {
      data: QueryDataReturn<TQueryDefinitions>;
    } & SubscriptionMeta
  > | void {
    const {
      queryDefinitions,
      parentSubscriptionId,
      subscriptionSuffix,
      suspend,
    } = subOpts;
    const subscriptionId = parentSubscriptionId + subscriptionSuffix;

    const preExistingContextForThisSubscription =
      opts.context.ongoingSubscriptionRecord[subscriptionId];

    if (!preExistingContextForThisSubscription) {
      opts.context.ongoingSubscriptionRecord[subscriptionId] = {};
    }

    let newQueryInfo;
    let newQueryDefinitionsAreAllNull;
    const preExistingQueryInfo =
      preExistingContextForThisSubscription?.queryInfo;
    if (preExistingQueryInfo) {
      const nonNullishQueryDefinitions = removeNullishQueryDefinitions(
        subOpts.queryDefinitions
      );

      if (Object.keys(nonNullishQueryDefinitions).length) {
        newQueryInfo = convertQueryDefinitionToQueryInfo({
          queryDefinitions: nonNullishQueryDefinitions,
          queryId: preExistingQueryInfo.queryId,
        });
      } else {
        newQueryDefinitionsAreAllNull = true;
        opts.context.updateSubscriptionInfo(subscriptionId, {
          queryInfo: null,
        });
      }
    }

    const queryDefinitionHasBeenUpdated =
      newQueryDefinitionsAreAllNull ||
      (newQueryInfo &&
        (!preExistingQueryInfo ||
          preExistingQueryInfo.queryGQL !== newQueryInfo.queryGQL)) ||
      (newQueryInfo &&
        (!preExistingQueryInfo ||
          /**
           * @TODO_REMOVE_QUERY_PARAMS_STRING
           * Remove this condition. Comparing 'queryParamsString' is just temporary unitl backend supports filter and sorting
           * once that is ready comparing 'queryGQL' should be enough.
           */
          preExistingQueryInfo.queryParamsString !==
            newQueryInfo.queryParamsString));

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
    opts.context.updateSubscriptionInfo(subscriptionId, {
      querying: true,
      lastQueryTimestamp: queryTimestamp,
    });
    opts.context.updateSubscriptionInfo(parentSubscriptionId, {
      querying: true,
    });
    const setQuerying =
      opts.context.ongoingSubscriptionRecord[parentSubscriptionId]?.setQuerying;
    setQuerying && setQuerying(true);
    opts.handlers.setQuerying(true);

    const suspendPromise = opts.context.mmGQLInstance
      .subscribe(queryDefinitions, {
        batchKey: subOpts.suspend ? 'suspended' : 'non-suspended',
        // Make sure to re-render the component on paginate
        onPaginate: () => {
          const contextForThisParentSub =
            opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
          contextForThisParentSub.onResults &&
            contextForThisParentSub.onResults({
              ...contextForThisParentSub.results,
            });
        },
        onData: ({ results: newResults }) => {
          const contextforThisSub =
            opts.context.ongoingSubscriptionRecord[subscriptionId];
          const thisQueryIsMostRecent =
            contextforThisSub?.lastQueryTimestamp === queryTimestamp;
          if (thisQueryIsMostRecent) {
            const contextForThisParentSub =
              opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
            contextForThisParentSub.onResults &&
              contextForThisParentSub.onResults({
                ...contextForThisParentSub.results,
                ...newResults,
              });
            opts.context.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
              results: { ...contextForThisParentSub.results, ...newResults },
            });
          }
        },
        onError: error => {
          const contextForThisParentSub =
            opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
          contextForThisParentSub.onError &&
            contextForThisParentSub.onError(error);
          opts.context.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
            error,
          });
        },
        onSubscriptionInitialized: subscriptionCanceller => {
          opts.context.updateSubscriptionInfo(subscriptionId, {
            unsub: () => subscriptionCanceller(),
          });
          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            unsub: () => {
              getAllSubscriptionStates().forEach(
                subscriptionState =>
                  subscriptionState?.unsub && subscriptionState.unsub()
              );
            },
          });
        },
        onQueryInfoConstructed: queryInfo => {
          opts.context.updateSubscriptionInfo(subscriptionId, {
            queryInfo,
          });
        },
      })
      .finally(() => {
        const contextForThisSub =
          opts.context.ongoingSubscriptionRecord[subscriptionId];
        const thisQueryIsMostRecent =
          contextForThisSub?.lastQueryTimestamp === queryTimestamp;
        if (thisQueryIsMostRecent) {
          opts.context.updateSubscriptionInfo(subscriptionId, {
            suspendPromise: undefined,
            querying: false,
          });

          // if all the queries have resolved, we can set "querying" to false for the parent subscription state
          const allQueriesHaveResolved = !getAllSubscriptionStates().some(
            state => state && state.querying
          );
          if (allQueriesHaveResolved) {
            opts.context.updateSubscriptionInfo(parentSubscriptionId, {
              querying: false,
            });
            const setQuerying =
              opts.context.ongoingSubscriptionRecord[parentSubscriptionId]
                ?.setQuerying;
            setQuerying && setQuerying(false);
            opts.handlers.setQuerying(false);
          }
        }
      });

    if (!preExistingContextForThisSubscription && suspend) {
      opts.context.updateSubscriptionInfo(subscriptionId, {
        suspendPromise,
      });

      return suspendPromise;
    }
  }

  if (opts.data.error) throw opts.data.error;

  let suspendPromise: Promise<any> | void;

  if (Object.keys(suspendDisabled).length) {
    try {
      handleNewQueryDefitions({
        queryDefinitions: suspendDisabled,
        parentSubscriptionId,
        subscriptionSuffix: subscriptionIds.suspendDisabled,
        suspend: false,
      });
    } catch (e) {
      opts.handlers.onError(e);
      throw e;
    }
  }

  if (Object.keys(suspendEnabled).length) {
    try {
      suspendPromise = handleNewQueryDefitions({
        queryDefinitions: suspendEnabled,
        parentSubscriptionId,
        subscriptionSuffix: subscriptionIds.suspendEnabled,
        suspend: true,
      });
    } catch (e) {
      opts.handlers.onError(e);
      throw e;
    }
  }

  if (suspendPromise) throw suspendPromise;

  return {
    data: opts.data.results,
    error: opts.data.error,
    querying: opts.data.querying,
    onHookUnmount,
    onHookMount,
  } as TReturn;
}
