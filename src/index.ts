import { DEFAULT_NODE_PROPERTIES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { SMImpliedNodePropertyException } from './exceptions';
import { OptimisticUpdatesOrchestrator } from './OptimisticUpdates';
import { RepositoryFactory } from './Repository';
import { generateQuerier, generateSubscriber } from './smQueriers';
import { createSMQueryManager } from './SMQueryManager';
import { createTransaction } from './transaction/transaction';
import {
  ISMJS,
  SMConfig,
  ISMData,
  SMDataDefaultFn,
  NodeRelationalQueryBuilderRecord,
  NodeMutationFn,
  NodeDefArgs,
  ISMNode,
  SMNodeDefaultProps,
} from './types';

export * from './types';
export * from './smDataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';
export * from './consts';

export class SMJS implements ISMJS {
  public gqlClient: ISMJS['gqlClient'];
  public plugins: ISMJS['plugins'];
  public query: ISMJS['query'];
  public subscribe: ISMJS['subscribe'];
  public SMQueryManager: ISMJS['SMQueryManager'];
  public transaction: ISMJS['transaction'];
  public tokens: Record<string, string> = {};
  public DOFactory: ISMJS['DOFactory'];
  public DOProxyGenerator: ISMJS['DOProxyGenerator'];
  private optimisticUpdatesOrchestrator: InstanceType<
    typeof OptimisticUpdatesOrchestrator
  >;

  constructor(config: SMConfig) {
    this.gqlClient = config.gqlClient;
    this.plugins = config.plugins;
    this.query = generateQuerier({ smJSInstance: this });
    this.subscribe = generateSubscriber(this);
    this.DOProxyGenerator = createDOProxyGenerator(this);
    this.DOFactory = createDOFactory(this);
    this.SMQueryManager = createSMQueryManager(this);
    this.optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();
    this.transaction = createTransaction(this, {
      onUpdateRequested: this.optimisticUpdatesOrchestrator.onUpdateRequested,
    });
  }

  public def<
    TNodeType extends string,
    TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
    TNodeComputedData extends Record<string, any> = {},
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {},
    TNodeMutations extends Record<
      string,
      /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn
    > = {}
  >(
    def: NodeDefArgs<
      TNodeType,
      TNodeData,
      TNodeComputedData,
      TNodeRelationalData,
      TNodeMutations
    >
  ): ISMNode<
    TNodeType,
    TNodeData & SMNodeDefaultProps,
    TNodeComputedData,
    TNodeRelationalData,
    TNodeMutations
  > {
    const propNames = Object.keys(def.properties);
    const prop = propNames.find(x =>
      Object.keys(DEFAULT_NODE_PROPERTIES).includes(x)
    );
    if (prop) {
      throw new SMImpliedNodePropertyException({
        propName: prop,
      });
    }
    const properties = this.addDefaultNodeProperties(def.properties);
    const DOClass = this.DOFactory({ ...def, properties });

    return {
      _isSMNodeDef: true,
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
      smData: properties,
      smComputed: def.computed,
      smRelational: def.relational,
      smMutations: def.mutations,
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
    T extends Record<string, ISMData | SMDataDefaultFn>
  >(nodeProperties: T): T & SMNodeDefaultProps {
    return {
      ...nodeProperties,
      ...DEFAULT_NODE_PROPERTIES,
    };
  }
}
