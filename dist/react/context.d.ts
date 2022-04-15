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
    queryInfo?: {
        queryGQL: DocumentNode;
        queryId: string;
    };
    lastQueryTimestamp?: number;
}
interface ISMContext {
    smJSInstance: ISMJS;
    ongoingSubscriptionRecord: Record<string, ISMContextSubscription>;
    updateSubscriptionInfo: (subscriptionId: string, subInfo: Partial<ISMContextSubscription>) => void;
    scheduleCleanup: (subscriptionId: string) => void;
    cancelCleanup: (subscriptionId: string) => void;
}
export declare const SMContext: React.Context<ISMContext>;
export declare const SMProvider: (props: {
    children: React.ReactNode;
    smJS: ISMJS;
    subscriptionTTLMs?: number;
}) => JSX.Element;
export {};
