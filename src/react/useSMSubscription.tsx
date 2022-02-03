import React from 'react';
import { convertQueryDefinitionToQueryInfo } from '../queryDefinitionAdapters';

import { SMContext } from './context';

export function useSubscription<TQueryDefinitions extends QueryDefinitions>(
  queryDefinitions: TQueryDefinitions
): { data: QueryDataReturn<TQueryDefinitions>; querying: boolean } {
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
  const subscriptionId = obj.stack.split('\n')[1];
  const preExistingContextForThisSubscription =
    smContext.ongoingSubscriptionRecord[subscriptionId];

  const [results, setResults] = React.useState<
    QueryDataReturn<TQueryDefinitions> | undefined
  >(preExistingContextForThisSubscription?.results);
  const [error, setError] = React.useState<any>(
    preExistingContextForThisSubscription?.error
  );
  const [querying, setQuerying] = React.useState<boolean>(
    preExistingContextForThisSubscription?.querying != null
      ? preExistingContextForThisSubscription?.querying
      : true
  );
  React.useEffect(() => {
    smContext.cancelCleanup(subscriptionId);
    return () => {
      smContext.scheduleCleanup(subscriptionId);
    };
  }, []);

  // We can not directly call "setResults" from this useState hook above within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling setResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.
  smContext.updateSubscriptionInfo(subscriptionId, {
    onResults: setResults,
    onError: setError,
    setQuerying: setQuerying,
  });

  const queryDefinitionHasBeenUpdated =
    preExistingContextForThisSubscription?.queryInfo?.queryGQL != null &&
    preExistingContextForThisSubscription.queryInfo.queryGQL !==
      convertQueryDefinitionToQueryInfo({
        queryDefinitions,
        queryId: preExistingContextForThisSubscription.queryInfo.queryId,
      }).queryGQL;
  if (!preExistingContextForThisSubscription || queryDefinitionHasBeenUpdated) {
    if (queryDefinitionHasBeenUpdated) {
      preExistingContextForThisSubscription.unsub &&
        preExistingContextForThisSubscription.unsub();
    }

    const queryTimestamp = new Date().valueOf();
    setQuerying(true);
    smContext.updateSubscriptionInfo(subscriptionId, {
      querying: true,
      lastQueryTimestamp: queryTimestamp,
    });

    const suspendPromise = smContext.smJSInstance
      .subscribe(queryDefinitions, {
        onData: ({ results: newResults }) => {
          const contextForThisSub =
            smContext.ongoingSubscriptionRecord[subscriptionId];
          const thisQueryIsMostRecent =
            contextForThisSub.lastQueryTimestamp === queryTimestamp;
          if (thisQueryIsMostRecent) {
            contextForThisSub.onResults &&
              contextForThisSub.onResults(newResults);
            smContext.updateSubscriptionInfo(subscriptionId, {
              results: newResults,
            });
          }
        },
        onError: error => {
          const contextForThisSub =
            smContext.ongoingSubscriptionRecord[subscriptionId];
          contextForThisSub.onError && contextForThisSub.onError(error);
          smContext.updateSubscriptionInfo(subscriptionId, {
            error,
          });
        },
        onSubscriptionInitialized: subscriptionCanceller => {
          smContext.updateSubscriptionInfo(subscriptionId, {
            unsub: subscriptionCanceller,
          });
        },
        onQueryInfoConstructed: queryInfo => {
          smContext.updateSubscriptionInfo(subscriptionId, {
            queryInfo,
          });
        },
      })
      .finally(() => {
        const contextForThisSub =
          smContext.ongoingSubscriptionRecord[subscriptionId];
        const thisQueryIsMostRecent =
          contextForThisSub.lastQueryTimestamp === queryTimestamp;
        if (thisQueryIsMostRecent) {
          contextForThisSub.setQuerying && contextForThisSub.setQuerying(false);
          smContext.updateSubscriptionInfo(subscriptionId, {
            suspendPromise: undefined,
            querying: false,
          });
        }
      });

    if (!preExistingContextForThisSubscription) {
      smContext.updateSubscriptionInfo(subscriptionId, { suspendPromise });
      throw suspendPromise;
    } else {
      return { data: results, querying } as {
        data: QueryDataReturn<TQueryDefinitions>;
        querying: boolean;
      };
    }
  } else if (preExistingContextForThisSubscription.suspendPromise) {
    throw preExistingContextForThisSubscription.suspendPromise;
  } else if (error) {
    throw error;
  } else {
    return { data: results, querying } as {
      data: QueryDataReturn<TQueryDefinitions>;
      querying: boolean;
    };
  }
}
