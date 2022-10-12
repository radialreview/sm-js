import { QueryRecordEntry, INode, ValidSortForNode, QueryRecord, RelationalQueryRecord, RelationalQueryRecordEntry } from '../types';
export declare function applyClientSideFilterToData({ queryRecordEntry, data, alias, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    data: any;
    alias: string;
}): void;
export declare function applyClientSideSortToData({ queryRecordEntry, data, alias, sort: queryRecordEntrySort, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    sort: ValidSortForNode<INode>;
    data: any;
    alias: string;
}): void;
export declare function applyClientSideSortAndFilterToData(queryRecord: QueryRecord | RelationalQueryRecord, data: any): void;