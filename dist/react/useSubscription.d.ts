import { UseSubscriptionReturn, UseSubscriptionQueryDefinitions, UseSubscriptionQueryDefinitionOpts } from '../types';
export declare function useSubscription<TNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts, TQueryDefinitions extends UseSubscriptionQueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts>>(queryDefinitions: TQueryDefinitions, opts?: {
    subscriptionId?: string;
}): UseSubscriptionReturn<TQueryDefinitions>;
