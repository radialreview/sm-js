import { DEFAULT_NODE_PROPERTIES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { ImpliedNodePropertyException } from './exceptions';
import { OptimisticUpdatesOrchestrator } from './OptimisticUpdates';
import { RepositoryFactory } from './Repository';
import { generateQuerier, generateSubscriber } from './queriers';
import { createQueryManager } from './queriers/QueryManager';
import { QuerySlimmer } from './queriers/QuerySlimmer';
import {
  IMMGQL,
  Config,
  IData,
  DataDefaultFn,
  NodeRelationalQueryBuilderRecord,
  NodeDefArgs,
  INode,
  NodeDefaultProps,
  EPaginationFilteringSortingInstance,
} from './types';

export * from './types';
export * from './dataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';
export * from './queriers/generateMockDataUtilities';
export * from './nodesCollection';
export { gql } from '@apollo/client';

export class MMGQL implements IMMGQL {
  public gqlClient: IMMGQL['gqlClient'];
  public generateMockData: IMMGQL['generateMockData'];
  public getMockDataDelay: IMMGQL['getMockDataDelay'];
  public enableQuerySlimming: IMMGQL['enableQuerySlimming'];
  public paginationFilteringSortingInstance: IMMGQL['paginationFilteringSortingInstance'];
  public plugins: IMMGQL['plugins'];
  public query: IMMGQL['query'];
  public subscribe: IMMGQL['subscribe'];
  public QueryManager: IMMGQL['QueryManager'];
  public QuerySlimmer: IMMGQL['QuerySlimmer'];
  public tokens: Record<string, string> = {};
  public DOFactory: IMMGQL['DOFactory'];
  public DOProxyGenerator: IMMGQL['DOProxyGenerator'];
  public logging: Config['logging'];
  private optimisticUpdatesOrchestrator: InstanceType<
    typeof OptimisticUpdatesOrchestrator
  >;

  constructor(config: Config) {
    this.gqlClient = config.gqlClient;
    this.generateMockData = config.generateMockData;
    this.getMockDataDelay = config.getMockDataDelay;
    this.enableQuerySlimming = config.enableQuerySlimming;
    this.logging = config.logging;
    this.paginationFilteringSortingInstance =
      config.paginationFilteringSortingInstance;
    this.plugins = config.plugins;
    this.query = generateQuerier({ mmGQLInstance: this });
    this.subscribe = generateSubscriber(this);
    this.DOProxyGenerator = createDOProxyGenerator(this);
    this.DOFactory = createDOFactory(this);
    this.QueryManager = createQueryManager(this);
    this.QuerySlimmer = new QuerySlimmer(this);
    this.optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();

    if (
      config.generateMockData &&
      config.paginationFilteringSortingInstance ===
        EPaginationFilteringSortingInstance.SERVER
    ) {
      throw Error(
        `mmGQL was told to generate mock data and use "SERVER" pagination/filtering/sorting. Switch paginationFilteringSortingInstance to "CLIENT"`
      );
    }
  }

  public def<
    TNodeType extends string,
    TNodeData extends Record<string, IData | DataDefaultFn>,
    TNodeComputedData extends Record<string, any> = {},
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}
  >(
    def: NodeDefArgs<{
      TNodeType: TNodeType;
      TNodeData: TNodeData;
      TNodeComputedData: TNodeComputedData;
      TNodeRelationalData: TNodeRelationalData;
    }>
  ): INode<{
    TNodeType: TNodeType;
    TNodeData: TNodeData;
    TNodeComputedData: TNodeComputedData;
    TNodeRelationalData: TNodeRelationalData;
  }> {
    if (def.type.includes('-') || def.type.includes('.')) {
      throw new Error('Node types cannot include hyphens or dots');
    }

    const propertyNames = Object.keys(def.properties);
    const defaultProp = propertyNames.find(x =>
      Object.keys(DEFAULT_NODE_PROPERTIES).includes(x)
    );
    if (defaultProp) {
      throw new ImpliedNodePropertyException({
        propName: defaultProp,
      });
    }
    const properties = this.addDefaultNodeProperties(def.properties);
    const defWithDefaultProperties = { ...def, properties };
    const DOClass = this.DOFactory(defWithDefaultProperties);

    return {
      _isNodeDef: true,
      do: DOClass,
      repository: RepositoryFactory({
        def: defWithDefaultProperties,
        DOClass,
        onDOConstructed: this.optimisticUpdatesOrchestrator.onDOConstructed,
        onDODeleted: this.optimisticUpdatesOrchestrator.onDODeleted,
        onDataReceived: this.optimisticUpdatesOrchestrator
          .onPersistedDataReceived,
      }),
      type: def.type,
      data: properties,
      computed: def.computed,
      relational: def.relational,
      generateMockData: def.generateMockData,
    };
  }

  // This is simply an easier to consume version of the "def" function above
  // if explicit types are needed
  //
  public defTyped<TNode extends INode>(
    def: TNode extends INode<infer TNodeArgs> ? NodeDefArgs<TNodeArgs> : never
  ): TNode {
    return this.def(def) as TNode;
  }

  public getToken(opts: { tokenName: string }): string {
    return this.tokens[opts.tokenName];
  }

  public setToken(opts: { tokenName: string; token: string }): void {
    this.tokens[opts.tokenName] = opts.token;
  }

  public clearTokens() {
    this.tokens = {};
  }

  private addDefaultNodeProperties<
    T extends Record<string, IData | DataDefaultFn>
  >(nodeProperties: T): T & NodeDefaultProps {
    return {
      ...nodeProperties,
      ...DEFAULT_NODE_PROPERTIES,
    };
  }
}
