import React from 'react';
import { SubscriptionCanceller, ISMJS, DocumentNode } from '../types';
interface ISMContextSubscription {
  results?: any;
  error?: any;
  querying?: boolean;
  unsub?: SubscriptionCanceller;
  suspendPromise?: Promise<any>;
  onResults?: (newResults: any) => void;
  onError?: (newError: any) => void;
  setQuerying?: (querying: boolean) => void;
  queryInfo?: { queryGQL: DocumentNode; queryId: string };
  lastQueryTimestamp?: number;
}

interface ISMContext {
  smJSInstance: ISMJS;
  ongoingSubscriptionRecord: Record<string, ISMContextSubscription>;
  updateSubscriptionInfo: (
    subscriptionId: string,
    subInfo: Partial<ISMContextSubscription>
  ) => void;
  scheduleCleanup: (subscriptionId: string) => void;
  cancelCleanup: (subscriptionId: string) => void;
}

export const SMContext = React.createContext<ISMContext>(
  (undefined as unknown) as ISMContext
);

export const SMProvider = (props: {
  children: React.ReactNode;
  smJS: ISMJS;
  subscriptionTTLMs?: number;
}) => {
  const existingContext = React.useContext(SMContext);

  if (existingContext) {
    throw Error(
      'Another instance of an SMProvider was already detected higher up the render tree.\nHaving multiple instances of SMProviders is not supported and may lead to unexpected results.'
    );
  }

  const ongoingSubscriptionRecord = React.useRef<
    Record<string, ISMContextSubscription>
  >({});
  const cleanupTimeoutRecord = React.useRef<Record<string, NodeJS.Timeout>>({});

  const updateSubscriptionInfo: ISMContext['updateSubscriptionInfo'] = React.useCallback(
    (subscriptionId, subInfo) => {
      ongoingSubscriptionRecord.current[subscriptionId] = {
        ...ongoingSubscriptionRecord.current[subscriptionId],
        ...subInfo,
      };
    },
    []
  );

  const scheduleCleanup: ISMContext['scheduleCleanup'] = React.useCallback(
    subscriptionId => {
      function cleanup() {
        const existingContextSubscription =
          ongoingSubscriptionRecord.current[subscriptionId];
        if (existingContextSubscription) {
          existingContextSubscription.unsub &&
            existingContextSubscription.unsub();
          delete ongoingSubscriptionRecord.current[subscriptionId];
        }
      }

      if (props.subscriptionTTLMs != null) {
        cleanupTimeoutRecord.current[subscriptionId] = setTimeout(
          cleanup,
          props.subscriptionTTLMs
        );
      } else {
        cleanup();
      }
    },
    []
  );

  const cancelCleanup: ISMContext['cancelCleanup'] = React.useCallback(
    subscriptionId => {
      clearTimeout(cleanupTimeoutRecord.current[subscriptionId]);
    },
    []
  );

  return (
    <SMContext.Provider
      value={{
        smJSInstance: props.smJS,
        ongoingSubscriptionRecord: ongoingSubscriptionRecord.current,
        updateSubscriptionInfo,
        scheduleCleanup,
        cancelCleanup,
      }}
    >
      {props.children}
    </SMContext.Provider>
  );
};
