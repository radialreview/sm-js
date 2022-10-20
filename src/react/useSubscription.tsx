import React from 'react';
import { UnreachableCaseError } from '../exceptions';

import {
  QueryDataReturn,
  UseSubscriptionReturn,
  Maybe,
  UseSubscriptionQueryDefinitions,
  UseSubscriptionQueryDefinitionOpts,
  SubscriptionMeta,
  EPaginationFilteringSortingInstance,
  QueryDefinitions,
  QueryState,
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
    // getQueryDefinitionStateManager throws a promise if a query is suspending rendering
    // we catch that promise here and re-throw it further down, so that we can manage cleanup
    // if this function throws and it is not caught, then the number of hooks produced by this hook changes, causing a react error
    qdStateManager = getQueryDefinitionStateManager({
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
      useServerSidePaginationFilteringSorting:
        context.mmGQLInstance.paginationFilteringSortingInstance ===
        EPaginationFilteringSortingInstance.SERVER,
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
  suspendEnabled: 'suspendEnabled' as const,
  suspendDisabled: 'suspendDisabled' as const,
};

function getQueryDefinitionStateManager<
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
  useServerSidePaginationFilteringSorting: boolean;
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

    let latestQueryDefinitionsUpdate: Maybe<QueryDefinitions<
      unknown,
      unknown,
      unknown
    >> = null;
    if (!preExistingContextForThisSubscription) {
      opts.context.ongoingSubscriptionRecord[subscriptionId] = {
        onQueryDefinitionsUpdated: queryDefinitions => {
          latestQueryDefinitionsUpdate = queryDefinitions;
        },
      };
    } else {
      if (!preExistingContextForThisSubscription.onQueryDefinitionsUpdated) {
        throw Error('onQueryDefinitionsUpdated is not defined');
      }
      preExistingContextForThisSubscription.onQueryDefinitionsUpdated(
        subOpts.queryDefinitions
      );

      return preExistingContextForThisSubscription.suspendPromise;
    }

    opts.context.updateSubscriptionInfo(subscriptionId, {
      querying: true,
    });
    opts.context.updateSubscriptionInfo(parentSubscriptionId, {
      querying: true,
    });
    opts.context.ongoingSubscriptionRecord[parentSubscriptionId]?.setQuerying?.(
      true
    );

    function onError(error: any) {
      const contextForThisParentSub =
        opts.context.ongoingSubscriptionRecord[parentSubscriptionId];

      const onError = contextForThisParentSub?.onError;
      if (!onError) {
        console.error('onError is not defined');
        return;
      }

      onError(error);
      opts.context.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
        error,
      });
    }

    function onQueryManagerQueryStateChange(queryStateChangeOpts: {
      queryIdx: number;
      queryState: QueryState;
      error?: any;
    }) {
      const lastQueryIdx =
        opts.context.ongoingSubscriptionRecord[parentSubscriptionId]
          ?.lastQueryIdx;

      if (queryStateChangeOpts.queryState === QueryState.LOADING) {
        // No need to update the state, we're already loading by default for the initial query
        if (queryStateChangeOpts.queryIdx === 0) return;

        opts.context.updateSubscriptionInfo(subscriptionId, {
          querying: true,
          lastQueryIdx: queryStateChangeOpts.queryIdx,
        });
        opts.context.updateSubscriptionInfo(parentSubscriptionId, {
          querying: true,
          lastQueryIdx: queryStateChangeOpts.queryIdx,
        });
        opts.context.ongoingSubscriptionRecord[
          parentSubscriptionId
        ]?.setQuerying?.(true);
      } else if (queryStateChangeOpts.queryState === QueryState.IDLE) {
        // only set querying back to false once the last performed query has resolved
        if (queryStateChangeOpts.queryIdx === lastQueryIdx) {
          const contextForThisParentSub =
            opts.context.ongoingSubscriptionRecord[parentSubscriptionId];

          const setQuerying = contextForThisParentSub?.setQuerying;
          if (!setQuerying) {
            onError(Error('setQuerying is not defined'));
            return;
          }
          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            querying: false,
          });
          setQuerying(false);
        }
      } else if (queryStateChangeOpts.queryState === QueryState.ERROR) {
        onError(queryStateChangeOpts.error);
      } else {
        throw new UnreachableCaseError(queryStateChangeOpts.queryState);
      }
    }

    const suspendPromise = opts.context.mmGQLInstance
      .subscribe(queryDefinitions, {
        onQueryManagerQueryStateChange: onQueryManagerQueryStateChange,
        batchKey: subOpts.suspend ? 'suspended' : 'non-suspended',
        onData: ({ results: newResults }) => {
          const contextForThisParentSub =
            opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
          const onResults = contextForThisParentSub?.onResults;

          if (!onResults) {
            onError(Error('onResults is not defined'));
            return;
          }

          onResults({
            ...contextForThisParentSub.results,
            ...newResults,
          });
          opts.context.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
            results: { ...contextForThisParentSub.results, ...newResults },
          });
        },
        onError,
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
      })
      .then(queryManager => {
        // if there was a query definition update while the subscription was initializing
        // we need to notify the now initialized query manager of this update
        if (latestQueryDefinitionsUpdate) {
          queryManager
            .onQueryDefinitionsUpdated(latestQueryDefinitionsUpdate)
            .catch(onError);
        }

        opts.context.updateSubscriptionInfo(subscriptionId, {
          onQueryDefinitionsUpdated: newQueryDefinitions => {
            queryManager
              .onQueryDefinitionsUpdated(newQueryDefinitions)
              .catch(onError);
          },
        });
        return queryManager;
      })
      .finally(() => {
        opts.context.updateSubscriptionInfo(subscriptionId, {
          suspendPromise: undefined,
          querying: false,
        });

        // if all the queries have resolved, we can set "querying" to false for the parent subscription state
        const allQueriesHaveResolved = !getAllSubscriptionStates().some(
          state => state && state.querying
        );
        if (allQueriesHaveResolved) {
          const contextForThisParentSub =
            opts.context.ongoingSubscriptionRecord[parentSubscriptionId];

          const setQuerying = contextForThisParentSub?.setQuerying;
          if (!setQuerying) {
            onError(Error('setQuerying is not defined'));
            return;
          }

          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            querying: false,
          });
          setQuerying(false);
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
