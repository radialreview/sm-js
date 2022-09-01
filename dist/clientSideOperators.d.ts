import { QueryRecordEntry, INode, ValidSortForNode, QueryRecord, FilterObjectForNode } from './types';
export declare function applyClientSideFilterToData({ queryRecordEntry, data, alias, filter: queryRecordEntryFilter, }: {
    queryRecordEntry: QueryRecordEntry;
    filter: FilterObjectForNode<INode>;
    data: any;
    alias: string;
}): void;
export declare function applyClientSideSortToData({ queryRecordEntry, data, alias, sort: queryRecordEntrySort, }: {
    queryRecordEntry: QueryRecordEntry;
    sort: ValidSortForNode<INode>;
    data: any;
    alias: string;
}): void;
export declare function applyClientSideSortAndFilterToData(queryRecord: QueryRecord, data: any): void;
