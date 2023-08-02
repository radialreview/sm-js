import { QueryRecord, QueryRecordEntry, RelationalQueryRecord, RelationalQueryRecordEntry, IMMGQL } from '../types';
export interface IFetchedQueryData {
    subscriptionsByProperty: Record<string, number>;
    results: any | Array<any> | null;
}
export interface IInFlightQueryRecord {
    queryId: string;
    queryRecord: QueryRecord | RelationalQueryRecord;
}
export declare type TQueryDataByContextMap = Record<string, IFetchedQueryData>;
export declare type TInFlightQueriesByContextMap = Record<string, IInFlightQueryRecord[]>;
export declare type TQueryRecordByContextMap = Record<string, QueryRecord | RelationalQueryRecord>;
export declare class QuerySlimmer {
    constructor(mmGQLInstance: IMMGQL);
    private mmGQLInstance;
    queriesByContext: TQueryDataByContextMap;
    inFlightQueryRecords: TInFlightQueriesByContextMap;
    query(opts: {
        queryRecord: QueryRecord;
        queryId: string;
        useServerSidePaginationFilteringSorting: boolean;
        tokenName: string;
        batchKey?: string;
    }): Promise<Record<string, any>>;
    cacheNewData(queryRecordToCache: QueryRecord | RelationalQueryRecord, queryResponseToCache: Record<string, any>, parentContextKey?: string): void;
    getSlimmedQueryAgainstCache(newQuery: QueryRecord | RelationalQueryRecord, parentContextKey?: string): QueryRecord | RelationalQueryRecord | null;
    getDataForQueryFromCache(newQuery: QueryRecord | RelationalQueryRecord, parentContextKey?: string): Record<string, any>;
    /**
     * Returns in flight QueryRecordEntries by context that can slim down a new query.
     * The new query should wait for an in flight query to slim against if:
     *   - At least one QueryRecordEntry ContextKey in the inFlightQuery matches the QueryRecordEntry ContextKey of the newQuery.
     *   - At least one property that is being requested by the new query is already being requested by the in flight query.
     *   - The matched in flight QueryRecordEntry (from above) is not requesting relational data deeper than the newQuery QueryRecordEntry.
     */
    /**
     * Slims the new query against an in flight query.
     * This function assumes queries have already been matched by context.
     */
    onSubscriptionCancelled(queryRecord: QueryRecord | RelationalQueryRecord, parentContextKey?: string): void;
    getRelationalDepthOfQueryRecordEntry(queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry): number;
    private createContextKeyForQueryRecordEntry;
    private getPropertiesNotAlreadyCached;
    private stringifyQueryParams;
    private sendQueryRequest;
    private log;
}
