import { ISMNode, QueryDefinitions, QueryRecord, ValidFilterForNode } from './types';
export declare function getQueryRecordFromQueryDefinition<TSMNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryId: string;
    queryDefinitions: TQueryDefinitions;
}): QueryRecord;
export declare function getKeyValueFilterString<TSMNode extends ISMNode>(filter: ValidFilterForNode<TSMNode>): string;
export declare type SubscriptionConfig = {
    alias: string;
    gqlString: string;
    extractNodeFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
    extractOperationFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
};
export declare function getQueryInfo<TSMNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryDefinitions: TQueryDefinitions;
    queryId: string;
}): {
    subscriptionConfigs: SubscriptionConfig[];
    queryGQLString: string;
    queryRecord: QueryRecord;
};
/**
 * Converts a queryDefinitions into a gql doc that can be sent to the gqlClient
 * Returns a queryRecord for easily deduping requests based on the data that is being requested
 * Can later also be used to build a diff to request only the necessary data
 * taking into account the previous query record to avoid requesting data already in memory
 */
export declare function convertQueryDefinitionToQueryInfo<TSMNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryDefinitions: TQueryDefinitions;
    queryId: string;
}): {
    queryGQL: import("graphql/language/ast").DocumentNode;
    subscriptionConfigs: {
        gql: import("graphql/language/ast").DocumentNode;
        alias: string;
        gqlString: string;
        extractNodeFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
        extractOperationFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
    }[];
    queryRecord: QueryRecord;
};
