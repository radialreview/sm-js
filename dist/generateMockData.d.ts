import { Data } from './dataTypes';
import { QueryDefinitions, DataDefaultFn } from './types';
export declare function getMockValuesForIDataRecord(record: Record<string, Data<any, any, any> | DataDefaultFn>): Record<string, any>;
export declare function generateMockNodeDataFromQueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryDefinitions: TQueryDefinitions;
    queryId: string;
}): Record<string, any>;
