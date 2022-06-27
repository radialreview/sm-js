import { UseSubscriptionReturn, UseSubscriptionQueryDefinitions, UseSubscriptionQueryDefinitionOpts } from '../types';
export declare function useSubscription<TSMNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts, TQueryDefinitions extends UseSubscriptionQueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts>>(queryDefinitions: TQueryDefinitions, opts?: {
    subscriptionId?: string;
}): UseSubscriptionReturn<TQueryDefinitions>;
