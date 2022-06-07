import { IDOProxy, Maybe, ISMJS, QueryRecord, BaseQueryRecordEntry, RelationalQueryRecordEntry } from './types';
declare type SMQueryManagerState = Record<string, // the alias for this set of results
SMQueryManagerStateEntry>;
declare type SMQueryManagerStateEntry = {
    idsOrIdInCurrentResult: string | Array<string> | null;
    proxyCache: SMQueryManagerProxyCache;
};
declare type SMQueryManagerProxyCache = Record<string, // id of the node
SMQueryManagerProxyCacheEntry>;
declare type SMQueryManagerProxyCacheEntry = {
    proxy: IDOProxy;
    relationalState: Maybe<SMQueryManagerState>;
};
export declare function createSMQueryManager(smJSInstance: ISMJS): {
    new (queryRecord: QueryRecord): {
        state: SMQueryManagerState;
        queryRecord: QueryRecord;
        onQueryResult(opts: {
            queryResult: any;
            queryId: string;
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
         * Returns the current results based on received query results and subscription messages
         */
        getResults(): Record<string, any>;
        /**
         * Is used to build the overall results for the query, and also to build the relational results used by each proxy
         * which is why "state" is a param here
         */
        getResultsFromState(state: SMQueryManagerState): Record<string, any>;
        /**
         * Takes a queryRecord and the data that resulted from that query
         * notifies the appropriate repositories so that DOs can be constructed or updated
         */
        notifyRepositories(opts: {
            data: Record<string, any>;
            queryRecord: {
                [key: string]: BaseQueryRecordEntry;
            };
        }): void;
        /**
         * Gets the initial state for this manager from the initial query results
         *   does not execute on subscription messages
         */
        getNewStateFromQueryResult(opts: {
            queryResult: Record<string, any>;
            queryId: string;
        }): SMQueryManagerState;
        buildCacheEntry(opts: {
            nodeData: Record<string, any> | Array<Record<string, any>>;
            queryId: string;
            queryAlias: string;
            queryRecord?: QueryRecord;
        }): Maybe<SMQueryManagerStateEntry>;
        updateProxiesAndStateFromSubscriptionMessage(opts: {
            node: any;
            queryId: string;
            operation: {
                action: 'UpdateNode' | 'DeleteNode' | 'InsertNode' | 'DeleteEdge';
                path: string;
            };
            subscriptionAlias: string;
        }): void;
        recursivelyUpdateProxyAndReturnNewCacheEntry(opts: {
            queryId: string;
            proxy: IDOProxy;
            newRelationalData: Maybe<Record<string, Array<Record<string, any> | Record<string, any>>>>;
            relationalQueryRecord: Maybe<Record<string, RelationalQueryRecordEntry>>;
            currentState: SMQueryManagerProxyCacheEntry;
        }): SMQueryManagerProxyCacheEntry;
        getRelationalData(opts: {
            queryRecord: BaseQueryRecordEntry;
            node: Record<string, any>;
        }): Record<string, any> | null;
        removeUnionSuffix(alias: string): string;
        getApplicableRelationalQueries(opts: {
            relationalQueries: Record<string, RelationalQueryRecordEntry>;
            nodeData: Record<string, any>;
        }): Record<string, RelationalQueryRecordEntry>;
    };
};
export {};
