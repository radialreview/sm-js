import { QueryRecordEntry, QueryRecord, RelationalQueryRecord, RelationalQueryRecordEntry, Id } from '../types';
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
        id: Id;
    }>;
}): Id[];
export declare function applyClientSideSortToData({ queryRecordEntry, data, alias, }: {
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    data: any;
    alias: string;
}): void;
export declare function applyClientSideSortAndFilterToData(queryRecord: QueryRecord | RelationalQueryRecord, data: any): void;
