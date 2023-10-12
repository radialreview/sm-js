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
  if ('captureStackTrace' in Error) {
    Error.captureStackTrace(obj, useSubscription);
  } else {
    obj.stack = Error().stack || '';
  }
  if (obj.stack === '') {
    // Error.captureStackTrace or Error().stack should be supported in all browsers, but better safe than sorry
    throw Error(
      `${
        'captureStackTrace' in Error
          ? `Error.captureStackTrace`
          : `Error().stack`
      } not supported`
    );
  }

  function removeStartingNumbersFromString(string: string) {
    return string.replace(/^\d+/, '');
  }

  const subscriptionId =
    opts?.subscriptionId ||
    removeStartingNumbersFromString(obj.stack.split('\n')[1]);

  const queryState = getQueryState({
    subscriptionId,
    context,
    queryDefinitions,
  });

  // the state for this query is actually persisted using react context
  // this is to enable support for react suspense, where components are unmounted when they throw a promise
  // to ensure that a change in that context causes a re-render, we use a state variable that is incremented on each query state change
  const [, setRenderIdx] = React.useState<number>(0);
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
      queryState,
      onQueryStateChange: () => {
        setRenderIdx(current => current + 1);
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

  if (queryState.error || qdError) throw queryState.error || qdError;

  return qdStateManager as UseSubscriptionReturn<TQueryDefinitions> & {
    onHookMount(): void;
    onHookUnmount(): void;
  };
}

function getQueryState<
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
  const stateForThisSubscription =
    opts.context.ongoingSubscriptionRecord[opts.subscriptionId];

  const data =
    stateForThisSubscription?.data ||
    Object.keys(opts.queryDefinitions).reduce(
      (acc, key: keyof TQueryDefinitions) => {
        acc[key] = null;
        return acc;
      },
      {} as { [key in keyof TQueryDefinitions]: null }
    );
  const error = stateForThisSubscription?.error;
  const querying =
    stateForThisSubscription?.querying != null
      ? stateForThisSubscription.querying
      : true;

  return { data, error, querying };
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
  queryState: {
    data: QueryDataReturn<TQueryDefinitions>;
    error: any;
    querying: boolean;
  };
  onQueryStateChange: () => void;
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
    onQueryStateChange: opts.onQueryStateChange,
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

    const stateForThisSubscription =
      opts.context.ongoingSubscriptionRecord[subscriptionId];

    let latestQueryDefinitionsUpdate: Maybe<QueryDefinitions<
      unknown,
      unknown,
      unknown
    >> = null;
    if (!stateForThisSubscription) {
      opts.context.ongoingSubscriptionRecord[subscriptionId] = {
        // we can only deal with query definitions being updated
        // once the querymanager has been initialized
        // however, the querymanager is initialized within the asynchronous subscribe method
        // keep track of any attempts to update the querydefinitions by a component
        // and notify the querymanager once it's initialized below
        onQueryDefinitionsUpdated: queryDefinitions => {
          latestQueryDefinitionsUpdate = queryDefinitions;
        },
      };
    } else {
      if (!stateForThisSubscription.onQueryDefinitionsUpdated) {
        throw Error('onQueryDefinitionsUpdated is not defined');
      }
      stateForThisSubscription.onQueryDefinitionsUpdated(queryDefinitions);

      return stateForThisSubscription.suspendPromise;
    }

    opts.context.updateSubscriptionInfo(subscriptionId, {
      querying: true,
    });
    opts.context.updateSubscriptionInfo(parentSubscriptionId, {
      querying: true,
    });
    opts.context.ongoingSubscriptionRecord[
      parentSubscriptionId
    ]?.onQueryStateChange?.();

    function onError(error: any) {
      opts.context.updateSubscriptionInfo(parentSubscriptionId, {
        error,
      });
      opts.context.ongoingSubscriptionRecord[
        parentSubscriptionId
      ]?.onQueryStateChange?.();
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
        });
        opts.context.updateSubscriptionInfo(parentSubscriptionId, {
          querying: true,
          lastQueryIdx: queryStateChangeOpts.queryIdx,
        });
        opts.context.ongoingSubscriptionRecord[
          parentSubscriptionId
        ]?.onQueryStateChange?.();
      } else if (queryStateChangeOpts.queryState === QueryState.IDLE) {
        // only set querying back to false once the last performed query has resolved
        if (queryStateChangeOpts.queryIdx === lastQueryIdx) {
          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            querying: false,
          });
          opts.context.ongoingSubscriptionRecord[
            parentSubscriptionId
          ]?.onQueryStateChange?.();
        }
      } else if (queryStateChangeOpts.queryState === QueryState.ERROR) {
        onError(queryStateChangeOpts.error);
      } else {
        throw new UnreachableCaseError(queryStateChangeOpts.queryState);
      }
    }

    const suspendPromise = opts.context.mmGQLInstance
      .subscribe(queryDefinitions, {
        queryId: subscriptionId,
        onQueryManagerQueryStateChange: onQueryManagerQueryStateChange,
        batchKey: suspend ? 'suspended' : 'non-suspended',
        onData: ({ results: newResults }) => {
          const contextForThisParentSub =
            opts.context.ongoingSubscriptionRecord[parentSubscriptionId];

          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            data: {
              ...contextForThisParentSub.data,
              ...newResults,
            },
          });

          contextForThisParentSub.onQueryStateChange?.();
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
      .then(subscription => {
        // if there was a query definition update while the subscription was initializing
        // we need to notify the now initialized query manager of this update
        if (latestQueryDefinitionsUpdate) {
          subscription
            .onQueryDefinitionsUpdated(latestQueryDefinitionsUpdate)
            .catch(onError);
        }

        opts.context.updateSubscriptionInfo(subscriptionId, {
          onQueryDefinitionsUpdated: newQueryDefinitions => {
            subscription
              .onQueryDefinitionsUpdated(newQueryDefinitions)
              .catch(onError);
          },
        });
        return subscription;
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
          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            querying: false,
          });
          opts.context.ongoingSubscriptionRecord[
            parentSubscriptionId
          ]?.onQueryStateChange?.();
        }
      });

    if (!stateForThisSubscription && suspend) {
      opts.context.updateSubscriptionInfo(subscriptionId, {
        suspendPromise,
      });

      return suspendPromise;
    }
  }

  if (opts.queryState.error) throw opts.queryState.error;

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
      opts.context.updateSubscriptionInfo(parentSubscriptionId, {
        error: e,
      });
      opts.context.ongoingSubscriptionRecord[
        parentSubscriptionId
      ].onQueryStateChange?.();
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
      opts.context.updateSubscriptionInfo(parentSubscriptionId, {
        error: e,
      });
      opts.context.ongoingSubscriptionRecord[
        parentSubscriptionId
      ].onQueryStateChange?.();
      throw e;
    }
  }

  if (suspendPromise) throw suspendPromise;

  return {
    ...opts.queryState,
    onHookUnmount,
    onHookMount,
  } as TReturn;
}
