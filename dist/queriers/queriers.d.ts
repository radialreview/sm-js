import { IMMGQL, IQueryManager, QueryDefinitions, QueryOpts, QueryReturn, QueryDataReturn, SubscriptionOpts, SubscriptionMeta } from '../types';
/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */
export declare function generateQuerier({ mmGQLInstance, queryManager, }: {
    mmGQLInstance: IMMGQL;
    queryManager?: IQueryManager;
}): <TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(queryDefinitions: TQueryDefinitions, opts?: QueryOpts<TQueryDefinitions> | undefined) => Promise<QueryReturn<TQueryDefinitions>>;
export declare function generateSubscriber(mmGQLInstance: IMMGQL): <TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>, TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>>(queryDefinitions: TQueryDefinitions, opts: TSubscriptionOpts) => Promise<TSubscriptionOpts extends {
    skipInitialQuery: true;
} ? SubscriptionMeta : {
    data: QueryDataReturn<TQueryDefinitions>;
} & SubscriptionMeta>;
export declare function removeNullishQueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(queryDefinitions: TQueryDefinitions): TQueryDefinitions;
