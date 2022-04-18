import { QueryDefinitions, UseSubscriptionReturn } from '../types';
declare type UseSubscriptionOpts = {
    tokenName?: string;
    doNotSuspend?: boolean;
    subscriptionId?: string;
};
export declare function useSubscription<TQueryDefinitions extends QueryDefinitions, TOpts extends UseSubscriptionOpts>(queryDefinitions: TQueryDefinitions, opts?: TOpts): UseSubscriptionReturn<TQueryDefinitions, TOpts>;
export declare function useSubscriptions<TQueryDefinitionGroups extends Record<string, QueryDefinitions>, TUseSubscriptionsOpts extends {
    [key in keyof TQueryDefinitionGroups]?: UseSubscriptionOpts;
}>(queryDefintionGroups: TQueryDefinitionGroups, opts?: TUseSubscriptionsOpts): {
    [key in keyof TQueryDefinitionGroups]: UseSubscriptionReturn<TQueryDefinitionGroups[key], TUseSubscriptionsOpts[key]>;
};
export {};
