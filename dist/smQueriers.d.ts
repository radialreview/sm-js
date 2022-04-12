import { ISMJS, ISMQueryManager, QueryDefinitions, QueryOpts, QueryReturn, QueryDataReturn, SubscriptionOpts, SubscriptionMeta } from './types';
/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */
export declare function generateQuerier({ smJSInstance, queryManager, }: {
    smJSInstance: ISMJS;
    queryManager?: ISMQueryManager;
}): <TQueryDefinitions extends QueryDefinitions>(queryDefinitions: TQueryDefinitions, opts?: QueryOpts<TQueryDefinitions> | undefined) => Promise<QueryReturn<TQueryDefinitions>>;
export declare function generateSubscriber(smJSInstance: ISMJS): <TQueryDefinitions extends QueryDefinitions, TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>>(queryDefinitions: TQueryDefinitions, opts: TSubscriptionOpts) => Promise<TSubscriptionOpts extends {
    skipInitialQuery: true;
} ? SubscriptionMeta : {
    data: QueryDataReturn<TQueryDefinitions>;
} & SubscriptionMeta>;
