import React from 'react';
import { SubscriptionCanceller } from '../smQueriers';

interface ISMContextSubscription {
  results?: any;
  error?: any;
  unsub?: SubscriptionCanceller;
  suspendPromise?: Promise<any>;
  onResults?: (newResults: any) => void;
  onError?: (newError: any) => void;
}

interface ISMContext {
  ongoingSubscriptionRecord: Record<string, ISMContextSubscription>;
  updateSubscriptionInfo: (
    subscriptionId: string,
    subInfo: Partial<ISMContextSubscription>
  ) => void;
}

export const SMContext = React.createContext<ISMContext>(
  (undefined as unknown) as ISMContext
);

export const SMProvider = (props: { children: React.ReactNode }) => {
  const existingContext = React.useContext(SMContext);

  if (existingContext) {
    throw Error(
      'Another instance of an SMProvider was already detected higher up the render tree.\nHaving multiple instances of SMProviders is not supported and may lead to unexpected results.'
    );
  }

  const ongoingSubscriptionRecord = React.useRef<
    Record<string, ISMContextSubscription>
  >({});

  const updateSubscriptionInfo: ISMContext['updateSubscriptionInfo'] = React.useCallback(
    (subscriptionId, subInfo) => {
      ongoingSubscriptionRecord.current[subscriptionId] = {
        ...ongoingSubscriptionRecord.current[subscriptionId],
        ...subInfo,
      };
    },
    []
  );

  return (
    <SMContext.Provider
      value={{
        ongoingSubscriptionRecord: ongoingSubscriptionRecord.current,
        updateSubscriptionInfo,
      }}
    >
      {props.children}
    </SMContext.Provider>
  );
};
