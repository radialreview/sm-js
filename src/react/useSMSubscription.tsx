import React from 'react';

import { subscribe } from '../smQueriers';
import { SMContext } from './context';

// DOES NOT CURRENTLY HANDLE AN UPDATE TO QUERY DEFINITIONS
// @TODO think about whether this is ok for now or if we need to deal with that
export function useSubscription<TQueryDefinitions extends QueryDefinitions>(
  queryDefinitions: TQueryDefinitions
): QueryDataReturn<TQueryDefinitions> {
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

  if (!existingContextForThisSubscription) {
    const suspendPromise = subscribe(queryDefinitions, {
      onData: ({ results }) =>
        smContext.updateSubscriptionInfo(subscriptionId, { results }),
    });

    smContext.updateSubscriptionInfo(subscriptionId, { suspendPromise });
    throw suspendPromise.finally(() => {
      smContext.updateSubscriptionInfo(subscriptionId, {
        suspendPromise: undefined,
      });
    });
  } else if (existingContextForThisSubscription.suspendPromise) {
    throw existingContextForThisSubscription.suspendPromise;
  } else {
    return existingContextForThisSubscription.results;
  }
}
