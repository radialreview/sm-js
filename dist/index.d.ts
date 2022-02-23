<<<<<<< HEAD
import { ISMJS, SMConfig, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeDefArgs, ISMNode, SMDataEnum, MapFnForNode, QueryDefinition, QueryFilter, GetExpectedNodeDataType, DeepPartial } from './types';
export { ISMNode, SMDataEnum, MapFnForNode, QueryFilter, QueryDefinition, ISMJS, GetExpectedNodeDataType, DeepPartial, };
=======
import { ISMJS, SMConfig, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeDefArgs, ISMNode, SMDataEnum, MapFnForNode, QueryDefinition, QueryFilterForNode, GetExpectedNodeDataType, DeepPartial } from './types';
export { ISMNode, SMDataEnum, MapFnForNode, QueryFilterForNode, QueryDefinition, ISMJS, GetExpectedNodeDataType, DeepPartial, };
>>>>>>> origin/v0.0.1
export * from './smDataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export declare class SMJS implements ISMJS {
    gqlClient: ISMJS['gqlClient'];
    plugins: ISMJS['plugins'];
    query: ISMJS['query'];
    subscribe: ISMJS['subscribe'];
    SMQueryManager: ISMJS['SMQueryManager'];
    transaction: ISMJS['transaction'];
    tokens: Record<string, string>;
    DOFactory: ISMJS['DOFactory'];
    DOProxyGenerator: ISMJS['DOProxyGenerator'];
    private optimisticUpdatesOrchestrator;
    constructor(config: SMConfig);
    def<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}, TNodeMutations extends Record<string, NodeMutationFn> = {}>(def: NodeDefArgs<TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>): ISMNode<TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>;
    getToken(opts: {
        tokenName: string;
    }): string;
    setToken(opts: {
        tokenName: string;
        token: string;
    }): void;
    clearTokens(): void;
}
