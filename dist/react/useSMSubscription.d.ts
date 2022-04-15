import { QueryDefinitions, UseSubscriptionReturn } from '../types';
export declare function useSubscription<TQueryDefinitions extends QueryDefinitions, TOpts extends {
    tokenName?: string;
    doNotSuspend?: boolean;
}>(queryDefinitions: TQueryDefinitions, opts?: TOpts): UseSubscriptionReturn<TQueryDefinitions, TOpts>;
