import { QueryRecord } from '../types';
export declare type StaticData = Record<string, // node type
Record<string, // node id
Record<string, // field name
any>>>;
export declare function getResponseFromStaticData(opts: {
    queryRecord: QueryRecord;
    staticData: StaticData;
    throwErrorOnMissingIds?: boolean;
}): Record<string, any>;
export declare function staticRelational(ownPropName: string): {
    __staticRelational: string;
};
