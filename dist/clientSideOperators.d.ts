import { QueryRecordEntry, ValidFilterForNode, INode, ValidSortForNode, QueryRecord } from './types';
export declare function applyClientSideFilterToData({ queryRecordEntry, data, alias, filter: queryRecordEntryFilter, }: {
    queryRecordEntry: QueryRecordEntry;
    filter: ValidFilterForNode<INode>;
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
