import { PageInfoFromResults, ClientSidePageInfo } from '../nodesCollection';
import { IDOProxy, Maybe, IMMGQL, QueryRecord, BaseQueryRecordEntry, RelationalQueryRecordEntry, QueryRecordEntry, RelationalQueryRecord, IQueryPagination, QueryDefinitions, UseSubscriptionQueryDefinitions, QueryState, SubscriptionMessage } from '../types';
declare type QueryManagerState = Record<string, // the alias for this set of results
QueryManagerStateEntry>;
declare type QueryManagerStateEntry = {
    idsOrIdInCurrentResult: string | Array<string> | null;
    proxyCache: QueryManagerProxyCache;
    pageInfoFromResults: Maybe<PageInfoFromResults>;
    totalCount: Maybe<number>;
    clientSidePageInfo: Maybe<ClientSidePageInfo>;
};
declare type QueryManagerProxyCache = Record<string, // id of the node
QueryManagerProxyCacheEntry>;
declare type QueryManagerProxyCacheEntry = {
    proxy: IDOProxy;
    relationalState: Maybe<QueryManagerState>;
};
declare type QueryManagerOpts = {
    queryId: string;
    useServerSidePaginationFilteringSorting: boolean;
    resultsObject: Object;
    onResultsUpdated(): void;
    onQueryError(error: any): void;
    batchKey: Maybe<string>;
    onQueryStateChange?: (queryStateChangeOpts: {
        queryIdx: number;
        queryState: QueryState;
        error?: any;
    }) => void;
};
export declare function createQueryManager(mmGQLInstance: IMMGQL): {
    new (queryDefinitions: QueryDefinitions<unknown, unknown, unknown> | UseSubscriptionQueryDefinitions<unknown, unknown, unknown, unknown>, opts: QueryManagerOpts): {
        state: QueryManagerState;
        queryDefinitions: QueryDefinitions<unknown, unknown, unknown> | UseSubscriptionQueryDefinitions<unknown, unknown, unknown, unknown>;
        opts: QueryManagerOpts;
        queryRecord: Maybe<QueryRecord>;
        queryIdx: number;
        onSubscriptionMessage(message: SubscriptionMessage): void;
        /**
         * Is used to build the root level results for the query, and also to build the relational results
         * used by each proxy, which is why "state" is a param here
         *
         * alias path is required such that when "loadMore" is executed on a node collection
         * this query manager can perform a new query with the minimal query record necessary
         * and extend the result set with the new results
         */
        getResultsFromState(opts: {
            state: QueryManagerState;
            aliasPath?: Array<string>;
        }): Record<string, any>;
        /**
         * Takes a queryRecord and the data that resulted from that query
         * notifies the appropriate repositories so that DOs can be constructed or updated
         */
        notifyRepositories(opts: {
            data: Record<string, any>;
            queryRecord: {
                [key: string]: QueryRecordEntry | RelationalQueryRecordEntry | null;
            };
        }): void;
        /**
         * Gets the initial state for this manager from the initial query results
         *   does not execute on subscription messages
         */
        getNewStateFromQueryResult(opts: {
            queryResult: Record<string, any>;
            queryRecord: QueryRecord;
        }): QueryManagerState;
        buildCacheEntry(opts: {
            nodeData: Record<string, any> | Array<Record<string, any>>;
            queryAlias: string;
            queryRecord: QueryRecord;
            pageInfoFromResults: Maybe<PageInfoFromResults>;
            totalCount: Maybe<number>;
            clientSidePageInfo: Maybe<ClientSidePageInfo>;
            aliasPath: Array<string>;
        }): Maybe<QueryManagerStateEntry>;
        updateProxiesAndStateFromSubscriptionMessage(opts: {
            node: any;
            operation: {
                action: 'UpdateNode' | 'DeleteNode' | 'InsertNode' | 'DeleteEdge';
                path: string;
            };
            subscriptionAlias: string;
        }): void;
        recursivelyUpdateProxyAndReturnNewCacheEntry(opts: {
            proxy: IDOProxy;
            newRelationalData: Maybe<Record<string, Array<Record<string, any> | Record<string, any>>>>;
            relationalQueryRecord: Maybe<Record<string, RelationalQueryRecordEntry>>;
            currentState: QueryManagerProxyCacheEntry;
            aliasPath: Array<string>;
        }): QueryManagerProxyCacheEntry;
        getRelationalData(opts: {
            queryRecord: BaseQueryRecordEntry | null;
            node: Record<string, any>;
        }): Record<string, any> | null;
        removeUnionSuffix(alias: string): string;
        getApplicableRelationalQueries(opts: {
            relationalQueries: Record<string, RelationalQueryRecordEntry>;
            nodeData: Record<string, any>;
        }): Record<string, RelationalQueryRecordEntry>;
        getPageInfoFromResponse(opts: {
            dataForThisAlias: any;
        }): Maybe<PageInfoFromResults>;
        getTotalCountFromResponse(opts: {
            dataForThisAlias: any;
        }): Maybe<number>;
        getPageInfoFromResponseForAlias(opts: {
            aliasPath: Array<string>;
            response: Record<string, any>;
        }): Maybe<PageInfoFromResults>;
        getInitialClientSidePageInfo(opts: {
            queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
        }): Maybe<ClientSidePageInfo>;
        onLoadMoreResults(opts: {
            previousEndCursor: string;
            aliasPath: Array<string>;
        }): Promise<void>;
        onGoToNextPage(opts: {
            previousEndCursor: string;
            aliasPath: Array<string>;
        }): Promise<void>;
        onGoToPreviousPage(opts: {
            previousStartCursor: string;
            aliasPath: Array<string>;
        }): Promise<void>;
        getTokenNameForAliasPath(aliasPath: Array<string>): string;
        /**
         * Builds a new query record which contains the smallest query possible
         * to get the data for a given aliasPath, with some new pagination params
         *
         * An alias path may look something like ['users'] if we're loading more results on a QueryRecordEntry (root level)
         * or something like ['users', 'todos'] if we're loading more results on a RelationalQueryRecordEntry
         */
        getMinimalQueryRecordWithUpdatedPaginationParams(opts: {
            aliasPath: Array<string>;
            preExistingQueryRecord: QueryRecord | RelationalQueryRecord;
            newPaginationParams: Partial<IQueryPagination<any>>;
        }): QueryRecord | RelationalQueryRecord;
        getMinimalQueryRecordForMoreResults(opts: {
            aliasPath: Array<string>;
            previousEndCursor: string;
            preExistingQueryRecord: QueryRecord | RelationalQueryRecord;
        }): QueryRecord | RelationalQueryRecord;
        getMinimalQueryRecordForPreviousPage(opts: {
            aliasPath: Array<string>;
            previousStartCursor: string;
            preExistingQueryRecord: QueryRecord | RelationalQueryRecord;
        }): QueryRecord | RelationalQueryRecord;
        handlePagingEventData(opts: {
            aliasPath: Array<string>;
            newData: Record<string, any>;
            queryRecord: QueryRecord;
            event: 'LOAD_MORE' | 'GO_TO_NEXT' | 'GO_TO_PREVIOUS';
        }): void;
        onQueryDefinitionsUpdated: (newQueryDefinitionRecord: QueryDefinitions<unknown, unknown, unknown>) => Promise<void>;
        onQueryDefinitionUpdatedResult(opts: {
            queryResult: Record<string, any>;
            minimalQueryRecord: QueryRecord;
            aliasPathsToUpdate?: Array<Array<string>>;
        }): void;
        extendStateObject(opts: {
            aliasPath: Array<string>;
            originalAliasPath: Array<string>;
            state: QueryManagerState;
            newState: QueryManagerState;
            mergeStrategy: 'CONCAT' | 'REPLACE';
            parentProxy?: IDOProxy;
        }): void;
        addIdToLastEntryInAliasPath(opts: {
            aliasPath: Array<string>;
            id: string;
        }): string[];
        /**
         * Removes the id from the alias if it exists
         * @example input: 'user[12msad-249js-25285]'
         * @example output: 'user'
         */
        removeIdFromAlias(alias: string): string;
        /**
         * Returns the id from the alias if it exists
         * @example input: 'user[12msad-249js-25285]'
         * @example output: '12msad-249js-25285'
         */
        getIdFromAlias(alias: string): string | undefined;
    };
};
export declare function removeNullishQueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(queryDefinitions: TQueryDefinitions): TQueryDefinitions;
/**
 * Given a previousQueryRecord and a nextQueryRecord,
 * returns the minimal query record required to perform the next query
 *
 * For now, does not account for a change in the properties being queried
 * It only looks at the filter, sort and pagination parameters being used
 *
 * If any of those were updated, the query for that data will be performed
 *
 * Recursion: does it have to handle query changes in related data?
 * The answer is yes, ideally. However, what if the user had loaded more results on the parent list,
 * previous to updating the filter/sorting/pagination on the child list?
 *
 * In this case, we would have to load the relational results for which the query was updated
 * for each item of the parent list that had been loaded so far, which could be a lot of data.
 * Not just that, it would be impossible to request that in a single query, which means this
 * function would have to inherit the additional complexity of returning multiple queries
 * and then the function calling this function would have to handle that as well.
 *
 * Because of that, any update to the filter/sorting/pagination of a child list query will result in
 * a full query starting at the root of the query record
 */
export declare function getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery(opts: {
    previousQueryRecord: QueryRecord;
    nextQueryRecord: QueryRecord;
}): {
    minimalQueryRecord: QueryRecord;
    aliasPathsToUpdate: Array<Array<string>>;
};
export {};
