import { SMData } from './smDataTypes';
import { QueryDefinitions, SMDataDefaultFn } from './types';
export declare function getMockValuesForISMDataRecord(record: Record<string, SMData<any, any, any> | SMDataDefaultFn>): Record<string, any>;
export declare function generateMockNodeDataFromQueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget, TQueryDefinitions extends QueryDefinitions<TSMNode, TMapFn, TQueryDefinitionTarget>>(opts: {
    queryDefinitions: TQueryDefinitions;
    queryId: string;
}): Record<string, any>;
