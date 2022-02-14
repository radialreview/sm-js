import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
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
} from './types';

export { SMDataEnum } from './types';
export * from './smDataTypes';
export * from './react';
export * from './config';
export * from './gqlClient';

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
    TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
    TNodeComputedData extends Record<string, any> = {},
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {},
    TNodeMutations extends Record<
      string,
      /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn
    > = {}
  >(
    def: NodeDefArgs<
      TNodeData,
      TNodeComputedData,
      TNodeRelationalData,
      TNodeMutations
    >
  ): ISMNode<
    TNodeData,
    TNodeComputedData,
    TNodeRelationalData,
    TNodeMutations
  > {
    const DOClass = this.DOFactory(def);

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
      smData: def.properties,
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
}
