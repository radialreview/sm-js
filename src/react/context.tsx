import React from 'react';
import { SubscriptionCanceller, IMMGQL, QueryDefinitions } from '../types';
export interface IContextSubscription {
  results?: any;
  error?: any;
  querying?: boolean;
  unsub?: SubscriptionCanceller;
  suspendPromise?: Promise<any>;
  onResults?: (newResults: any) => void;
  onError?: (newError: any) => void;
  setQuerying?: (querying: boolean) => void;
  onQueryDefinitionsUpdated?: (
    newQueryDefinitionRecord: QueryDefinitions<unknown, unknown, unknown>
  ) => void;
  lastQueryIdx?: number;
}

export interface IContext {
  mmGQLInstance: IMMGQL;
  ongoingSubscriptionRecord: Record<string, IContextSubscription>;
  updateSubscriptionInfo: (
    subscriptionId: string,
    subInfo: Partial<IContextSubscription>
  ) => void;
  scheduleCleanup: (subscriptionId: string) => void;
  cancelCleanup: (subscriptionId: string) => void;
  onHookMount: (
    subscriptionId: string,
    opts: { silenceDuplicateSubIdErrors: boolean }
  ) => void;
  onHookUnmount: (subscriptionId: string) => void;
}

export const MMGQLContext = React.createContext<IContext>(
  (undefined as unknown) as IContext
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

export const MMGQLProvider = (props: {
  children: React.ReactNode;
  mmGQL: IMMGQL;
  subscriptionTTLMs?: number;
}) => {
  const existingContext = React.useContext(MMGQLContext);

  if (existingContext) {
    throw Error(
      'Another instance of an MMGQLProvider was already detected higher up the render tree.\nHaving multiple instances of MMGQLProviders is not supported and may lead to unexpected results.'
    );
  }

  const ongoingSubscriptionRecord = React.useRef<
    Record<string, IContextSubscription>
  >({});
  const cleanupTimeoutRecord = React.useRef<Record<string, NodeJS.Timeout>>({});
  const mountedHooksBySubId = React.useRef<Record<string, boolean>>({});

  const updateSubscriptionInfo: IContext['updateSubscriptionInfo'] = React.useCallback(
    (subscriptionId, subInfo) => {
      ongoingSubscriptionRecord.current[subscriptionId] = {
        ...ongoingSubscriptionRecord.current[subscriptionId],
        ...subInfo,
      };
    },
    []
  );

  const scheduleCleanup: IContext['scheduleCleanup'] = React.useCallback(
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

  const cancelCleanup: IContext['cancelCleanup'] = React.useCallback(
    subscriptionId => {
      clearTimeout(cleanupTimeoutRecord.current[subscriptionId]);
      delete cleanupTimeoutRecord.current[subscriptionId];
    },
    []
  );

  // These three functions exists to fix issues related to non unique sub ids, which happens when multiple instances of the same component
  // using a useSubscription hook are mounted at the same time
  // since useSubscription uses the first line of the error stack to construct a unique sub id
  // fixes https://tractiontools.atlassian.net/browse/MM-404
  const onHookMount: IContext['onHookMount'] = React.useCallback(
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

  const onHookUnmount: IContext['onHookUnmount'] = React.useCallback(
    subscriptionId => {
      delete mountedHooksBySubId.current[subscriptionId];
    },
    []
  );

  return (
    <MMGQLContext.Provider
      value={{
        mmGQLInstance: props.mmGQL,
        ongoingSubscriptionRecord: ongoingSubscriptionRecord.current,
        updateSubscriptionInfo,
        scheduleCleanup,
        cancelCleanup,
        onHookMount,
        onHookUnmount,
      }}
    >
      {props.children}
    </MMGQLContext.Provider>
  );
};
