import { QueryDefinitions, QueryRecordEntry } from './types';
export declare const PROPERTIES_QUERIED_FOR_ALL_NODES: string[];
export declare function getQueryRecordFromQueryDefinition(opts: {
    queryId: string;
    queryDefinitions: QueryDefinitions;
}): Record<string, QueryRecordEntry>;
export declare function getKeyValueFilterString<NodeType>(clause: Partial<Record<keyof NodeType, string>>): string;
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
    queryRecord: Record<string, QueryRecordEntry>;
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
    queryGQL: any;
    subscriptionConfigs: {
        gql: any;
        alias: string;
        gqlString: string;
        extractNodeFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
        extractOperationFromSubscriptionMessage: (subscriptionMessage: Record<string, any>) => any;
    }[];
    queryRecord: Record<string, QueryRecordEntry>;
};
