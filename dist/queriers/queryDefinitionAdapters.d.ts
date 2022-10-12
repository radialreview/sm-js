import { INode, RelationalQueryRecordEntry, QueryDefinitions, QueryRecord, QueryRecordEntry, ValidFilterForNode } from '../types';
export declare function getQueryRecordFromQueryDefinition<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryId: string;
    queryDefinitions: TQueryDefinitions;
}): QueryRecord;
export declare function getBEFilterString<TNode extends INode>(filter: ValidFilterForNode<TNode>): string;
export declare type SubscriptionConfig = {
    alias: string;
    gqlString: string;
    extractNodeFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
    extractOperationFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
};
export declare function getQueryGQLStringFromQueryRecord(opts: {
    queryId: string;
    queryRecord: QueryRecord;
    useServerSidePaginationFilteringSorting: boolean;
}): string;
export declare function queryRecordEntryReturnsArrayOfData(opts: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}): boolean;
export declare function getQueryInfo<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryDefinitions: TQueryDefinitions;
    queryId: string;
    useServerSidePaginationFilteringSorting: boolean;
}): {
    subscriptionConfigs: SubscriptionConfig[];
    queryGQLString: string;
    queryParamsString: string;
    queryRecord: QueryRecord;
};
/**
 * Converts a queryDefinitions into a gql doc that can be sent to the gqlClient
 * Returns a queryRecord for easily deduping requests based on the data that is being requested
 * Can later also be used to build a diff to request only the necessary data
 * taking into account the previous query record to avoid requesting data already in memory
 */
export declare function convertQueryDefinitionToQueryInfo<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryDefinitions: TQueryDefinitions;
    queryId: string;
    useServerSidePaginationFilteringSorting: boolean;
}): {
    queryGQL: null;
    subscriptionConfigs: null;
    queryRecord: Record<string, null>;
    queryParamsString: null;
} | {
    queryGQL: import("graphql/language/ast").DocumentNode;
    subscriptionConfigs: {
        gql: import("graphql/language/ast").DocumentNode;
        alias: string;
        gqlString: string;
        extractNodeFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
        extractOperationFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
    }[];
    queryRecord: QueryRecord;
    queryParamsString: string;
};