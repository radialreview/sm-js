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
export declare function getQueryGQLDocumentFromQueryRecord(opts: {
    queryId: string;
    queryRecord: QueryRecord;
    useServerSidePaginationFilteringSorting: boolean;
}): import("graphql/language/ast").DocumentNode | null;
export declare function queryRecordEntryReturnsArrayOfData(opts: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}): boolean | null;
