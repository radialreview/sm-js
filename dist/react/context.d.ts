import React from 'react';
import { SubscriptionCanceller, IMMGQL, DocumentNode } from '../types';
export interface IContextSubscription {
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
        queryParamsString: string;
    } | null;
    lastQueryTimestamp?: number;
}
export interface IContext {
    mmGQLInstance: IMMGQL;
    ongoingSubscriptionRecord: Record<string, IContextSubscription>;
    updateSubscriptionInfo: (subscriptionId: string, subInfo: Partial<IContextSubscription>) => void;
    scheduleCleanup: (subscriptionId: string) => void;
    cancelCleanup: (subscriptionId: string) => void;
    onHookMount: (subscriptionId: string, opts: {
        silenceDuplicateSubIdErrors: boolean;
    }) => void;
    onHookUnmount: (subscriptionId: string) => void;
}
export declare const MMGQLContext: React.Context<IContext>;
export declare const LoggingContext: React.Context<{
    unsafe__silenceDuplicateSubIdErrors: boolean;
}>;
export declare const UnsafeNoDuplicateSubIdErrorProvider: (props: {
    children: React.ReactNode;
}) => JSX.Element;
export declare const MMGQLProvider: (props: {
    children: React.ReactNode;
    mmGQL: IMMGQL;
    subscriptionTTLMs?: number;
}) => JSX.Element;
