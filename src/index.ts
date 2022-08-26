import { DEFAULT_NODE_PROPERTIES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { ImpliedNodePropertyException } from './exceptions';
import { OptimisticUpdatesOrchestrator } from './OptimisticUpdates';
import { RepositoryFactory } from './Repository';
import { generateQuerier, generateSubscriber } from './queriers';
import { createQueryManager } from './QueryManager';
import { createTransaction } from './transaction/transaction';
import {
  IMMGQL,
  Config,
  IData,
  DataDefaultFn,
  NodeRelationalQueryBuilderRecord,
  NodeDefArgs,
  INode,
  NodeDefaultProps,
} from './types';

export * from './types';
export * from './dataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';
export * from './generateMockDataUtilities';
export { gql } from '@apollo/client';

export class MMGQL implements IMMGQL {
  public gqlClient: IMMGQL['gqlClient'];
  public generateMockData: IMMGQL['generateMockData'];
  public plugins: IMMGQL['plugins'];
  public query: IMMGQL['query'];
  public subscribe: IMMGQL['subscribe'];
  public QueryManager: IMMGQL['QueryManager'];
  public transaction: IMMGQL['transaction'];
  public tokens: Record<string, string> = {};
  public DOFactory: IMMGQL['DOFactory'];
  public DOProxyGenerator: IMMGQL['DOProxyGenerator'];
  private optimisticUpdatesOrchestrator: InstanceType<
    typeof OptimisticUpdatesOrchestrator
  >;

  constructor(config: Config) {
    this.gqlClient = config.gqlClient;
    this.generateMockData = config.generateMockData;
    this.plugins = config.plugins;
    this.query = generateQuerier({ mmGQLInstance: this });
    this.subscribe = generateSubscriber(this);
    this.DOProxyGenerator = createDOProxyGenerator(this);
    this.DOFactory = createDOFactory(this);
    this.QueryManager = createQueryManager(this);
    this.optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();
    this.transaction = createTransaction(this, {
      onUpdateRequested: this.optimisticUpdatesOrchestrator.onUpdateRequested,
    });
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
    const DOClass = this.DOFactory({ ...def, properties });

    return {
      _isNodeDef: true,
      do: DOClass,
      repository: RepositoryFactory({
        def,
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
