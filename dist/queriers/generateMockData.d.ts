import { IData, QueryRecord, DataDefaultFn, RelationalQueryRecord } from '../types';
export declare function getMockValuesForIDataRecord(record: Record<string, IData | DataDefaultFn>): Record<string, any>;
export declare function generateMockNodeDataForQueryRecord(opts: {
    queryRecord: QueryRecord | RelationalQueryRecord;
}): Record<string, any>;
