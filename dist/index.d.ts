import { IMMGQL, Config, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeDefArgs, INode } from './types';
import { StaticData } from './queriers/getResponseFromStaticData';
export * from './types';
export * from './dataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';
export * from './queriers/generateMockDataUtilities';
export * from './queriers/getResponseFromStaticData';
export * from './nodesCollection';
export { gql } from '@apollo/client';
export declare class MMGQL implements IMMGQL {
    gqlClient: IMMGQL['gqlClient'];
    generateMockData: IMMGQL['generateMockData'];
    mockDataType: 'random' | 'static' | undefined;
    staticData: StaticData | undefined;
    getMockDataDelay: IMMGQL['getMockDataDelay'];
    enableQuerySlimming: IMMGQL['enableQuerySlimming'];
    paginationFilteringSortingInstance: IMMGQL['paginationFilteringSortingInstance'];
    plugins: IMMGQL['plugins'];
    query: IMMGQL['query'];
    subscribe: IMMGQL['subscribe'];
    QueryManager: IMMGQL['QueryManager'];
    QuerySlimmer: IMMGQL['QuerySlimmer'];
    tokens: Record<string, string>;
    DOFactory: IMMGQL['DOFactory'];
    DOProxyGenerator: IMMGQL['DOProxyGenerator'];
    logging: Config['logging'];
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
    defTyped<TNode extends INode>(def: TNode extends INode<infer TNodeArgs> ? NodeDefArgs<TNodeArgs> : never): TNode;
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
