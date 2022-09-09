import { QueryRecord, QueryRecordEntry, RelationalQueryRecord, RelationalQueryRecordEntry, QueryDefinitions, QueryOpts, IMMGQL } from './types';
export interface IFetchedQueryData {
    subscriptionsByProperty: Record<string, number>;
    results: any | Array<any> | null;
}
export interface IInFlightQueryRecord {
    queryId: string;
    queryRecord: QueryRecord;
}
export declare type TQueryDataByContextMap = Record<string, IFetchedQueryData>;
export declare type TInFlightQueriesByContextMap = Record<string, IInFlightQueryRecord[]>;
export declare type TQueryRecordByContextMap = Record<string, QueryRecord>;
export declare class QuerySlimmer {
    constructor(mmGQLInstance: IMMGQL);
    private mmGQLInstance;
    queriesByContext: TQueryDataByContextMap;
    inFlightQueryRecords: TInFlightQueriesByContextMap;
    query<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(opts: {
        queryId: string;
        queryDefinitions: TQueryDefinitions;
        useServerSidePaginationFilteringSorting: boolean;
        queryOpts?: QueryOpts<TQueryDefinitions>;
        tokenName: string;
    }): Promise<Record<string, any>>;
    getDataForQueryFromQueriesByContext(newQuery: QueryRecord | RelationalQueryRecord, parentContextKey?: string): Record<string, any>;
    slimNewQueryAgainstInFlightQueries(newQuery: QueryRecord): {
        queryIdsSlimmedAgainst: string[];
        slimmedQueryRecord: QueryRecord;
    } | null;
    /**
     * Returns in flight QueryRecordEntries by context that can slim down a new query.
     * The new query should wait for an in flight query to slim against if:
     *   - At least one QueryRecordEntry ContextKey in the inFlightQuery matches the QueryRecordEntry ContextKey of the newQuery.
     *   - At least one property that is being requested by the new query is already being requested by the in flight query.
     *   - The matched in flight QueryRecordEntry (from above) is not requesting relational data deeper than the newQuery QueryRecordEntry.
     */
    getInFlightQueriesToSlimAgainst(newQuery: TQueryRecordByContextMap): TInFlightQueriesByContextMap | null;
    /**
     * Slims the new query against an in flight query.
     * This function assumes queries have already been matched by context.
     */
    getSlimmedQueryAgainstInFlightQuery(newQuery: QueryRecord | RelationalQueryRecord, inFlightQuery: QueryRecord | RelationalQueryRecord, isRelationalQueryRecord: boolean): QueryRecord | RelationalQueryRecord | null;
    getSlimmedQueryAgainstQueriesByContext(newQuery: QueryRecord | RelationalQueryRecord, parentContextKey?: string): QueryRecord | RelationalQueryRecord | null;
    onSubscriptionCancelled(queryRecord: QueryRecord, parentContextKey?: string): void;
    getRelationalDepthOfQueryRecordEntry(queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry): number;
    populateQueriesByContext(queryRecord: QueryRecord, results: Record<string, any>, parentContextKey?: string): void;
    private createContextKeyForQueryRecordEntry;
    private getPropertiesNotAlreadyCached;
    private getPropertiesNotCurrentlyBeingRequested;
    private stringifyQueryParams;
    private getQueryRecordsByContextMap;
    private sendQueryRequest;
    private setInFlightQuery;
    private removeInFlightQuery;
    private areDependentQueriesStillInFlight;
    private log;
}
