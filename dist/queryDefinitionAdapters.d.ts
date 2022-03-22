import { ISMNode, QueryDefinitions, QueryRecord, ValidFilterForNode } from './types';
export declare const OBJECT_IDENTIFIER = "__object__";
export declare function prepareObjectForBE(obj: Record<string, any>, opts?: {
    parentKey?: string;
    omitObjectIdentifier?: boolean;
}): Record<string, any>;
export declare const PROPERTIES_QUERIED_FOR_ALL_NODES: string[];
export declare function getQueryRecordFromQueryDefinition(opts: {
    queryId: string;
    queryDefinitions: QueryDefinitions;
}): QueryRecord;
export declare function getKeyValueFilterString<TSMNode extends ISMNode>(filter: ValidFilterForNode<TSMNode>): string;
export declare type SubscriptionConfig = {
    alias: string;
    gqlString: string;
    extractNodeFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
    extractOperationFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
};
export declare function getQueryInfo(opts: {
    queryDefinitions: QueryDefinitions;
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
export declare function convertQueryDefinitionToQueryInfo(opts: {
    queryDefinitions: QueryDefinitions;
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
