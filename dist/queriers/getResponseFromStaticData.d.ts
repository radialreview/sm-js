import { QueryRecord } from '../types';
export declare type StaticData = Record<string, // node type
Record<string, // node id
Record<string, // field name
any>>>;
export declare function getResponseFromStaticData(opts: {
    queryRecord: QueryRecord;
    staticData: StaticData;
}): Record<string, any>;
