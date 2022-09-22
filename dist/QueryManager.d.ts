import { PageInfoFromResults, ClientSidePageInfo } from './nodesCollection';
import { IDOProxy, Maybe, IMMGQL, QueryRecord, BaseQueryRecordEntry, RelationalQueryRecordEntry, QueryRecordEntry, DocumentNode, RelationalQueryRecord, IQueryPagination } from './types';
declare type QueryManagerState = Record<string, // the alias for this set of results
QueryManagerStateEntry>;
declare type QueryManagerStateEntry = {
    idsOrIdInCurrentResult: string | Array<string> | null;
    proxyCache: QueryManagerProxyCache;
    pageInfoFromResults: Maybe<PageInfoFromResults>;
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
    performQuery(opts: {
        queryRecord: QueryRecord;
        queryGQL: DocumentNode;
        tokenName: Maybe<string>;
    }): Promise<any>;
};
export declare function createQueryManager(mmGQLInstance: IMMGQL): {
    new (queryRecord: QueryRecord, opts: QueryManagerOpts): {
        state: QueryManagerState;
        queryRecord: QueryRecord;
        opts: QueryManagerOpts;
        onQueryResult(opts: {
            queryResult: any;
        }): void;
        onSubscriptionMessage(opts: {
            node: Record<string, any>;
            operation: {
                action: 'UpdateNode' | 'DeleteNode' | 'InsertNode' | 'DeleteEdge';
                path: string;
            };
            queryId: string;
            subscriptionAlias: string;
        }): void;
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
                [key: string]: QueryRecordEntry | RelationalQueryRecordEntry;
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
            queryRecord: BaseQueryRecordEntry;
            node: Record<string, any>;
        }): Record<string, any> | null;
        removeUnionSuffix(alias: string): string;
        getApplicableRelationalQueries(opts: {
            relationalQueries: Record<string, RelationalQueryRecordEntry>;
            nodeData: Record<string, any>;
        }): Record<string, RelationalQueryRecordEntry>;
        getDataFromResponse(opts: {
            queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
            dataForThisAlias: any;
        }): any;
        getPageInfoFromResponse(opts: {
            dataForThisAlias: any;
        }): Maybe<PageInfoFromResults>;
        getPageInfoFromResponseForAlias(opts: {
            aliasPath: Array<string>;
            response: Record<string, any>;
        }): Maybe<PageInfoFromResults>;
        getClientSidePageInfo(opts: {
            queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
        }): Maybe<ClientSidePageInfo>;
        onLoadMoreResults(opts: {
            previousEndCursor: string;
            aliasPath: Array<string>;
        }): Promise<Maybe<PageInfoFromResults>>;
        onGoToNextPage(opts: {
            previousEndCursor: string;
            aliasPath: Array<string>;
        }): Promise<Maybe<PageInfoFromResults>>;
        onGoToPreviousPage(opts: {
            previousStartCursor: string;
            aliasPath: Array<string>;
        }): Promise<Maybe<PageInfoFromResults>>;
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
            newPaginationParams: Partial<IQueryPagination>;
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
        extendStateObject(opts: {
            aliasPath: Array<string>;
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
export {};
