import React from 'react';

import { subscribe } from '../smQueriers';
import { SMContext } from './context';

// DOES NOT CURRENTLY HANDLE AN UPDATE TO QUERY DEFINITIONS
// @TODO think about whether this is ok for now or if we need to deal with that
// also implement sub cancelling
export function useSubscription<TQueryDefinitions extends QueryDefinitions>(
  queryDefinitions: TQueryDefinitions
): { data: QueryDataReturn<TQueryDefinitions> } {
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
  const existingContextForThisSubscription =
    smContext.ongoingSubscriptionRecord[subscriptionId];

  const [results, setResults] = React.useState<
    QueryDataReturn<TQueryDefinitions> | undefined
  >(existingContextForThisSubscription?.results);
  const [error, setError] = React.useState<any>(
    existingContextForThisSubscription?.error
  );

  // We can not directly call "setResults" from this useState hook above within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling setResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.
  smContext.updateSubscriptionInfo(subscriptionId, {
    onResults: setResults,
    onError: setError,
  });

  if (!existingContextForThisSubscription) {
    const suspendPromise = subscribe(queryDefinitions, {
      onData: ({ results: newResults }) => {
        const contextForThisSub =
          smContext.ongoingSubscriptionRecord[subscriptionId];
        contextForThisSub.onResults && contextForThisSub.onResults(newResults);
        smContext.updateSubscriptionInfo(subscriptionId, {
          results: newResults,
        });
      },
    });

    smContext.updateSubscriptionInfo(subscriptionId, { suspendPromise });
    throw suspendPromise
      .then(({ unsub }) => {
        smContext.updateSubscriptionInfo(subscriptionId, { unsub });
      })
      .catch(e => {
        const contextForThisSub =
          smContext.ongoingSubscriptionRecord[subscriptionId];
        contextForThisSub.onError && contextForThisSub.onError(e);
        smContext.updateSubscriptionInfo(subscriptionId, {
          error: e,
        });
      })
      .finally(() => {
        smContext.updateSubscriptionInfo(subscriptionId, {
          suspendPromise: undefined,
        });
      });
  } else if (existingContextForThisSubscription.suspendPromise) {
    throw existingContextForThisSubscription.suspendPromise;
  } else if (error) {
    throw error;
  } else {
    return { data: results } as { data: QueryDataReturn<TQueryDefinitions> };
  }
}
