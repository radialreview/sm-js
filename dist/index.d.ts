import { IMMGQL, Config, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeDefArgs, INode } from './types';
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
    def<TDefArgs extends {
        TNodeType: string;
        TNodeData: Record<string, IData | DataDefaultFn>;
        TNodeComputedData: Record<string, any>;
        TNodeRelationalData: NodeRelationalQueryBuilderRecord;
    }>(def: NodeDefArgs<TDefArgs>): INode<TDefArgs>;
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
