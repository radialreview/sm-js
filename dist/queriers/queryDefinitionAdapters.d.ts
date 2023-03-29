import { INode, RelationalQueryRecordEntry, QueryDefinitions, QueryRecord, QueryRecordEntry, ValidFilterForNode } from '../types';
export declare const OBJECT_PROPERTY_SEPARATOR = "__dot__";
export declare function getQueryRecordFromQueryDefinition<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryId: string;
    queryDefinitions: TQueryDefinitions;
}): QueryRecord;
export declare function getBEFilterString<TNode extends INode>(opts: {
    filter: ValidFilterForNode<TNode>;
    def: INode;
    relational?: Record<string, RelationalQueryRecordEntry>;
}): string;
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
export declare function queryRecordEntryReturnsArrayOfDataNestedInNodes(opts: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}): boolean | null;
export declare function getDataFromQueryResponsePartial(opts: {
    queryResponsePartial: Record<string, any>;
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}): any;
