import { IMMGQL, Config, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeDefArgs, INode } from './types';
export * from './types';
export * from './dataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';
export * from './generateMockDataUtilities';
export { gql } from '@apollo/client';
export declare class MMGQL implements IMMGQL {
    gqlClient: IMMGQL['gqlClient'];
    generateMockData: IMMGQL['generateMockData'];
    enableQuerySlimming: IMMGQL['enableQuerySlimming'];
    enableQuerySlimmingLogging: IMMGQL['enableQuerySlimmingLogging'];
    plugins: IMMGQL['plugins'];
    query: IMMGQL['query'];
    subscribe: IMMGQL['subscribe'];
    QueryManager: IMMGQL['QueryManager'];
    QuerySlimmer: IMMGQL['QuerySlimmer'];
    transaction: IMMGQL['transaction'];
    tokens: Record<string, string>;
    DOFactory: IMMGQL['DOFactory'];
    DOProxyGenerator: IMMGQL['DOProxyGenerator'];
    private optimisticUpdatesOrchestrator;
    constructor(config: Config);
    def<TNodeType extends string, TNodeData extends Record<string, IData | DataDefaultFn>, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}>(def: NodeDefArgs<{
        TNodeType: TNodeType;
        TNodeData: TNodeData;
        TNodeComputedData: TNodeComputedData;
        TNodeRelationalData: TNodeRelationalData;
    }>): INode<{
        TNodeType: TNodeType;
        TNodeData: TNodeData;
        TNodeComputedData: TNodeComputedData;
        TNodeRelationalData: TNodeRelationalData;
    }>;
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
