import { QueryRecord, RelationalQueryRecord } from './types';
export interface IQuerySlimmerConfig {
    enableLogging: boolean;
}
export interface IFetchedQueryData {
    subscriptionsByProperty: Record<string, number>;
    results: any | Array<any> | null;
}
export declare type IQueryDataByContextMap = Record<string, IFetchedQueryData>;
export declare class QuerySlimmer {
    constructor(config: IQuerySlimmerConfig);
    private loggingEnabled;
    queriesByContext: IQueryDataByContextMap;
    onResultsReceived(opts: {
        slimmedQuery: QueryRecord;
        originalQuery: QueryRecord;
        slimmedQueryResults: Record<string, any>;
        subscriptionEstablished: boolean;
    }): void;
    onNewQueryReceived(newQuery: QueryRecord | RelationalQueryRecord, parentContextKey?: string): QueryRecord | RelationalQueryRecord | null;
    private populateQueriesByContext;
    private createContextKeyForQuery;
    private getPropertiesNotAlreadyCached;
    private stringifyQueryParams;
    private log;
    onSubscriptionCancelled(queryRecord: QueryRecord, parentContextKey?: string): void;
}
