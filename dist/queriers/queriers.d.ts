import { IMMGQL, QueryDefinitions, QueryOpts, QueryReturn, QueryDataReturn, SubscriptionOpts, SubscriptionMeta } from '../types';
export declare function generateQuerier({ mmGQLInstance }: {
    mmGQLInstance: IMMGQL;
}): <TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(queryDefinitions: TQueryDefinitions, opts?: QueryOpts<TQueryDefinitions> | undefined) => Promise<QueryReturn<TQueryDefinitions>>;
export declare function generateSubscriber(mmGQLInstance: IMMGQL): <TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>, TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>>(queryDefinitions: TQueryDefinitions, opts: TSubscriptionOpts) => Promise<TSubscriptionOpts extends {
    skipInitialQuery: true;
} ? SubscriptionMeta : {
    data: QueryDataReturn<TQueryDefinitions>;
} & SubscriptionMeta>;
