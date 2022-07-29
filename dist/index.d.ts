import { IMMGQL, Config, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeDefArgs, INode, NodeDefaultProps } from './types';
export * from './types';
export * from './dataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';
export declare class MMGQL implements IMMGQL {
    gqlClient: IMMGQL['gqlClient'];
    generateMockData: IMMGQL['generateMockData'];
    plugins: IMMGQL['plugins'];
    query: IMMGQL['query'];
    subscribe: IMMGQL['subscribe'];
    QueryManager: IMMGQL['QueryManager'];
    transaction: IMMGQL['transaction'];
    tokens: Record<string, string>;
    DOFactory: IMMGQL['DOFactory'];
    DOProxyGenerator: IMMGQL['DOProxyGenerator'];
    private optimisticUpdatesOrchestrator;
    constructor(config: Config);
    def<TNodeType extends string, TNodeData extends Record<string, IData | DataDefaultFn>, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}, TNodeMutations extends Record<string, NodeMutationFn> = {}>(def: NodeDefArgs<TNodeType, TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>): INode<TNodeType, TNodeData & NodeDefaultProps, TNodeComputedData, TNodeRelationalData, TNodeMutations>;
    getToken(opts: {
        tokenName: string;
    }): string;
    setToken(opts: {
        tokenName: string;
        token: string;
    }): void;
    clearTokens(): void;
    private addDefaultNodeProperties;
}
