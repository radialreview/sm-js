import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { RepositoryFactory } from './Repository';
import { generateQuerier, generateSubscriber } from './smQueriers';
import { createSMQueryManager } from './SMQueryManager';

export * from './smDataTypes';
export * from './react';
export * from './config';

export class SMJS implements ISMJS {
  public gqlClient;
  public plugins;
  public tokens: Record<string, string> = {};
  public query;
  public subscribe;
  public doProxyGenerator;
  public SMQueryManager;
  private DOFactory;

  constructor(config: SMConfig) {
    this.gqlClient = config.gqlClient;
    this.plugins = config.plugins;
    this.query = generateQuerier({ smJSInstance: this });
    this.subscribe = generateSubscriber(this);
    this.doProxyGenerator = createDOProxyGenerator(this);
    this.DOFactory = createDOFactory(this);
    this.SMQueryManager = createSMQueryManager(this);
  }

  public def<
    TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
    TNodeComputedData extends Record<string, any>,
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
    TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
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
      repository: RepositoryFactory({ def, DOClass }),
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
}
