import { INode, RelationalQueryRecordEntry, QueryDefinitions, QueryRecord, QueryRecordEntry, ValidFilterForNode, RelationalQueryRecord } from '../types';
export declare const OBJECT_PROPERTY_SEPARATOR = "__dot__";
export declare function getQueryRecordFromQueryDefinition<TNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryId: string;
    queryDefinitions: TQueryDefinitions;
}): QueryRecord;
export declare function getBEFilterString<TNode extends INode>(opts: {
    filter: ValidFilterForNode<TNode, boolean>;
    def: INode;
    relational?: RelationalQueryRecord;
    isCollectionFilter: boolean;
}): string;
export declare function getQueryGQLDocumentFromQueryRecord(opts: {
    queryId: string;
    queryRecord: QueryRecord;
    useServerSidePaginationFilteringSorting: boolean;
}): import("graphql/language/ast").DocumentNode | null;
export declare function queryRecordEntryReturnsArrayOfData(opts: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}): boolean;
export declare function queryRecordEntryReturnsArrayOfDataNestedInNodes(opts: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}): boolean | null;
export declare function getDataFromQueryResponsePartial(opts: {
    queryResponsePartial: Record<string, any>;
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
    collectionsIncludePagingInfo: boolean;
}): any;
export declare function getSubscriptionGQLDocumentsFromQueryRecord(opts: {
    queryId: string;
    queryRecord: QueryRecord;
    useServerSidePaginationFilteringSorting: boolean;
}): Record<string, import("graphql/language/ast").DocumentNode>;
export declare function capitalizeFirstLetter(string: string): string;
