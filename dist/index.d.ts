import { ISMJS, SMConfig, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeDefArgs, ISMNode } from './types';
export * from './types';
export * from './smDataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';
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
    def<TNodeType extends string, TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}, TNodeMutations extends Record<string, NodeMutationFn> = {}>(def: NodeDefArgs<TNodeType, TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>): ISMNode<TNodeType, TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>;
    getToken(opts: {
        tokenName: string;
    }): string;
    setToken(opts: {
        tokenName: string;
        token: string;
    }): void;
    clearTokens(): void;
}
