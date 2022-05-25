import React from 'react';
import { SubscriptionCanceller, ISMJS, DocumentNode } from '../types';
export interface ISMContextSubscription {
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

export interface ISMContext {
  smJSInstance: ISMJS;
  ongoingSubscriptionRecord: Record<string, ISMContextSubscription>;
  updateSubscriptionInfo: (
    subscriptionId: string,
    subInfo: Partial<ISMContextSubscription>
  ) => void;
  scheduleCleanup: (subscriptionId: string) => void;
  cancelCleanup: (subscriptionId: string) => void;
  onHookMount: (
    subscriptionId: string,
    opts: { silenceDuplicateSubIdErrors: boolean }
  ) => void;
  onHookUnmount: (subscriptionId: string) => void;
}

export const SMContext = React.createContext<ISMContext>(
  (undefined as unknown) as ISMContext
);

export const LoggingContext = React.createContext<{
  unsafe__silenceDuplicateSubIdErrors: boolean;
}>({ unsafe__silenceDuplicateSubIdErrors: false });

// Allows use cases such as rendering the previous route as a suspense fallback to the next route
// where the same subscription id may be used momentarily before the fallback route unmounts
export const UnsafeNoDuplicateSubIdErrorProvider = (props: {
  children: React.ReactNode;
}) => {
  return (
    <LoggingContext.Provider
      value={{ unsafe__silenceDuplicateSubIdErrors: true }}
    >
      {props.children}
    </LoggingContext.Provider>
  );
};

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
  const mountedHooksBySubId = React.useRef<Record<string, boolean>>({});

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
    [props.subscriptionTTLMs]
  );

  const cancelCleanup: ISMContext['cancelCleanup'] = React.useCallback(
    subscriptionId => {
      clearTimeout(cleanupTimeoutRecord.current[subscriptionId]);
      delete cleanupTimeoutRecord.current[subscriptionId];
    },
    []
  );

  // These three functions exists to fix issues related to non unique sub ids, which happens when multiple instances of the same component
  // using a useSMSubscription hook are mounted at the same time
  // since useSMSubscription uses the first line of the error stack to construct a unique sub id
  // fixes https://tractiontools.atlassian.net/browse/MM-404
  const onHookMount: ISMContext['onHookMount'] = React.useCallback(
    (subscriptionId, { silenceDuplicateSubIdErrors }) => {
      if (
        mountedHooksBySubId.current[subscriptionId] &&
        !silenceDuplicateSubIdErrors
      ) {
        throw Error(
          [
            `A useSubscription hook was already mounted using the following subscription id:`,
            subscriptionId,
            `To fix this error, please specify a unique subscriptionId in the second argument of useSubscription`,
            `useSubscription(queryDefinitions, { subscriptionId })`,
          ].join('\n')
        );
      }
      mountedHooksBySubId.current[subscriptionId] = true;
    },
    []
  );

  const onHookUnmount: ISMContext['onHookUnmount'] = React.useCallback(
    subscriptionId => {
      delete mountedHooksBySubId.current[subscriptionId];
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
        onHookMount,
        onHookUnmount,
      }}
    >
      {props.children}
    </SMContext.Provider>
  );
};
