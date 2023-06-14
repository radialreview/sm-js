import { QueryRecordEntry, INode, ValidSortForNode, QueryRecord, RelationalQueryRecord, RelationalQueryRecordEntry } from '../types';
export declare function applyClientSideFilterToData({ queryRecordEntry, data, alias, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    data: any;
    alias: string;
}): void;
export declare function getIdsThatPassFilter({ queryRecordEntry, data, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    data: Array<any>;
}): Array<string>;
export declare function getSortedIds({ queryRecordEntry, data, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    data: Array<{
        id: string | number;
    }>;
}): (string | number)[];
export declare function applyClientSideSortToData({ queryRecordEntry, data, alias, sort: queryRecordEntrySort, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    sort: ValidSortForNode<INode>;
    data: any;
    alias: string;
}): void;
export declare function applyClientSideSortAndFilterToData(queryRecord: QueryRecord | RelationalQueryRecord, data: any): void;
