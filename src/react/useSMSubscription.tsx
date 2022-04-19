import React from 'react';
import { convertQueryDefinitionToQueryInfo } from '../queryDefinitionAdapters';
import {
  QueryDefinitions,
  QueryDataReturn,
  UseSubscriptionReturn,
  Maybe,
} from '../types';

import { ISMContext, SMContext } from './context';

type UseSubscriptionOpts = {
  tokenName?: string;
  doNotSuspend?: boolean;
  subscriptionId?: string;
};

export function useSubscription<
  TQueryDefinitions extends QueryDefinitions,
  TOpts extends UseSubscriptionOpts
>(
  queryDefinitions: TQueryDefinitions,
  opts?: TOpts
): UseSubscriptionReturn<TQueryDefinitions, TOpts> {
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

  const state = getStateForQuery({
    subscriptionId,
    smContext,
  });

  const [results, setResults] = React.useState<
    QueryDataReturn<TQueryDefinitions> | undefined
  >(state.results);
  const [error, setError] = React.useState<any>(state.error);
  const [querying, setQuerying] = React.useState<boolean>(state.querying);

  let qdReturn: Maybe<UseSubscriptionReturn<TQueryDefinitions, TOpts> & {
    cancelCleanup(): void;
    scheduleCleanup(): void;
  }> = null;
  let qdError: Maybe<any> = null;
  try {
    // handleQueryDefinitions throws a promise if a query is suspending rendering
    // we catch that promise here and re-throw it further down, so that we can manage cleanup
    // if this function throws and it is not caught, then the number of hooks produced by this hook changes, causing a react error
    qdReturn = handleQueryDefitions({
      smContext,
      queryDefinitions,
      subscriptionOpts: { ...opts, subscriptionId },
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
    qdReturn = null;
  }

  React.useEffect(() => {
    qdReturn?.cancelCleanup();
    return () => {
      qdReturn?.scheduleCleanup();
    };
  }, [smContext, subscriptionId]);

  if (qdError) throw qdError;

  return qdReturn as UseSubscriptionReturn<TQueryDefinitions, TOpts> & {
    cancelCleanup(): void;
    scheduleCleanup(): void;
  };
}

export function useSubscriptions<
  TQueryDefinitionGroups extends Record<string, QueryDefinitions>,
  TUseSubscriptionsOpts extends {
    [key in keyof TQueryDefinitionGroups]?: UseSubscriptionOpts;
  }
>(
  queryDefintionGroups: TQueryDefinitionGroups,
  opts?: TUseSubscriptionsOpts
): {
  [key in keyof TQueryDefinitionGroups]: UseSubscriptionReturn<
    TQueryDefinitionGroups[key],
    TUseSubscriptionsOpts[key]
  >;
} {
  let promises: Array<Promise<any>> = [];
  const obj = { stack: '' };
  Error.captureStackTrace(obj, useSubscription);
  if (obj.stack === '') {
    // Should be supported in all browsers, but better safe than sorry
    throw Error('Error.captureStackTrace not supported');
  }
  const subscriptionId = obj.stack.split('\n')[1];

  return Object.keys(queryDefintionGroups).reduce(
    (acc, queryDefinitionGroupKey: keyof TQueryDefinitionGroups, idx, keys) => {
      // wrap these in a try catch to allow queuing all subscriptions in parallel
      try {
        acc[queryDefinitionGroupKey] = useSubscription(
          queryDefintionGroups[queryDefinitionGroupKey],
          opts
            ? {
                ...opts[queryDefinitionGroupKey],
                subscriptionId: subscriptionId + idx,
              }
            : { subscriptionId: subscriptionId + idx }
        );
      } catch (e) {
        if (e instanceof Promise) promises.push(e);
        else throw e;
      }

      if (idx === keys.length - 1 && promises.length) {
        throw Promise.all(promises);
      }

      return acc;
    },
    {} as {
      [key in keyof TQueryDefinitionGroups]: UseSubscriptionReturn<
        TQueryDefinitionGroups[key],
        TUseSubscriptionsOpts[key]
      >;
    }
  );
}

function getStateForQuery(opts: {
  smContext: ISMContext;
  subscriptionId: string;
}) {
  const subscriptionId = opts.subscriptionId;
  const preExistingContextForThisSubscription =
    opts.smContext.ongoingSubscriptionRecord[subscriptionId];

  const results = preExistingContextForThisSubscription?.results;
  const error = preExistingContextForThisSubscription?.error;
  const querying =
    preExistingContextForThisSubscription?.querying != null
      ? preExistingContextForThisSubscription?.querying
      : true;

  return { results, error, querying };
}

function handleQueryDefitions<
  TQueryDefinitions extends QueryDefinitions,
  TUseSubscriptionOpts extends UseSubscriptionOpts & { subscriptionId: string }
>(opts: {
  smContext: ISMContext;
  queryDefinitions: TQueryDefinitions;
  subscriptionOpts: TUseSubscriptionOpts;
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
}): UseSubscriptionReturn<TQueryDefinitions, TUseSubscriptionOpts> & {
  cancelCleanup(): void;
  scheduleCleanup(): void;
} {
  type TReturn = UseSubscriptionReturn<
    TQueryDefinitions,
    TUseSubscriptionOpts
  > & {
    cancelCleanup(): void;
    scheduleCleanup(): void;
  };

  const subscriptionId = opts.subscriptionOpts.subscriptionId;
  const preExistingContextForThisSubscription =
    opts.smContext.ongoingSubscriptionRecord[subscriptionId];

  function cancelCleanup() {
    opts.smContext.cancelCleanup(subscriptionId);
  }

  function scheduleCleanup() {
    opts.smContext.scheduleCleanup(subscriptionId);
  }

  const handlePromise = (p: Promise<any>) => {
    if (opts.subscriptionOpts.doNotSuspend) {
      noAwait(p);
      return {
        data: opts.data.results,
        querying: opts.data.querying,
        cancelCleanup,
        scheduleCleanup,
      } as TReturn;
    } else {
      throw p;
    }
  };

  // We can not directly call "setResults" from this useState hook above within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling setResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.
  opts.smContext.updateSubscriptionInfo(subscriptionId, {
    onResults: opts.handlers.onResults,
    onError: opts.handlers.onError,
    setQuerying: opts.handlers.setQuerying,
  });

  const queryDefinitionHasBeenUpdated =
    preExistingContextForThisSubscription?.queryInfo?.queryGQL != null &&
    preExistingContextForThisSubscription.queryInfo.queryGQL !==
      convertQueryDefinitionToQueryInfo({
        queryDefinitions: opts.queryDefinitions,
        queryId: preExistingContextForThisSubscription.queryInfo.queryId,
      }).queryGQL;

  if (!preExistingContextForThisSubscription || queryDefinitionHasBeenUpdated) {
    if (queryDefinitionHasBeenUpdated) {
      preExistingContextForThisSubscription.unsub &&
        preExistingContextForThisSubscription.unsub();
    }

    const queryTimestamp = new Date().valueOf();
    opts.handlers.setQuerying(true);
    opts.smContext.updateSubscriptionInfo(subscriptionId, {
      querying: true,
      lastQueryTimestamp: queryTimestamp,
    });

    const suspendPromise = opts.smContext.smJSInstance
      .subscribe(opts.queryDefinitions, {
        tokenName: opts.subscriptionOpts.tokenName,
        onData: ({ results: newResults }) => {
          const contextForThisSub =
            opts.smContext.ongoingSubscriptionRecord[subscriptionId];
          const thisQueryIsMostRecent =
            contextForThisSub.lastQueryTimestamp === queryTimestamp;
          if (thisQueryIsMostRecent) {
            contextForThisSub.onResults &&
              contextForThisSub.onResults(newResults);
            opts.smContext.updateSubscriptionInfo(subscriptionId, {
              results: newResults,
            });
          }
        },
        onError: error => {
          const contextForThisSub =
            opts.smContext.ongoingSubscriptionRecord[subscriptionId];
          contextForThisSub.onError && contextForThisSub.onError(error);
          opts.smContext.updateSubscriptionInfo(subscriptionId, {
            error,
          });
        },
        onSubscriptionInitialized: subscriptionCanceller => {
          opts.smContext.updateSubscriptionInfo(subscriptionId, {
            unsub: subscriptionCanceller,
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
        }
      });

    if (!preExistingContextForThisSubscription) {
      opts.smContext.updateSubscriptionInfo(subscriptionId, {
        suspendPromise,
      });
      return handlePromise(suspendPromise) as TReturn;
    } else {
      return {
        data: opts.data.results,
        querying: opts.data.querying,
        cancelCleanup,
        scheduleCleanup,
      } as TReturn;
    }
  } else if (
    opts.data.querying &&
    preExistingContextForThisSubscription.suspendPromise
  ) {
    return handlePromise(
      preExistingContextForThisSubscription.suspendPromise
    ) as TReturn;
  } else if (opts.data.error) {
    throw opts.data.error;
  } else {
    return {
      data: opts.data.results,
      querying: opts.data.querying,
      scheduleCleanup,
      cancelCleanup,
    } as TReturn;
  }
}

function noAwait(
  thenable: ((...args: Array<any>) => Promise<any>) | Promise<any>
) {
  const handle = (p: Promise<any>) => {
    if (!(p instanceof Promise)) {
      throw new Error('noAwait: function arguments must return a promise');
    }

    p.then(() => null).catch(e => {
      if (e instanceof Error) {
        console.log(e);
      }
    });
  };

  if (thenable instanceof Promise) {
    handle(thenable);
  } else if (typeof thenable === 'function') {
    handle(thenable());
  } else {
    throw new Error('noAwait: argument must be a function or a promise');
  }
}
