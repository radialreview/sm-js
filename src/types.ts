import { NodesCollection } from './nodesCollection';
import { DEFAULT_NODE_PROPERTIES, PROPERTIES_QUERIED_FOR_ALL_NODES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { generateQuerier, generateSubscriber } from './queriers';
import { createQueryManager } from './queriers/QueryManager';
import { QuerySlimmer } from './queriers/QuerySlimmer'
import { StaticData } from './queriers/getResponseFromStaticData';

// inspired by https://fettblog.eu/typescript-match-the-exact-object-shape/
// with a small change to provide better error messages
// (the original version would assign "never" which gave a TS error but was not very helpful)
type ValidateShape<T, Shape> =
  T extends Shape
    ? Exclude<keyof T, keyof Shape> extends never
      ? T
      : Shape
    : Shape;

export type BOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export type Maybe<T> = T | null;

export type IsMaybe<Type> = null extends Type ? true : false

export type RemoveNevers<TRecord extends Record<string,any>> = {
  [TKey in keyof TRecord as TRecord[TKey] extends never ? never : TKey]: TRecord[TKey]
}

export type DataDefaultFn = {
  _default: IData
  (_default: any): IData;
} 

export enum QueryState {
  'IDLE' = 'IDLE',
  'LOADING' = 'LOADING',
  'ERROR' = 'ERROR',
}

export type DocumentNode = import('@apollo/client/core').DocumentNode;

export type Plugin = {
  DO?: {
    onConstruct?: (opts: { DOInstance: NodeDO; parsedDataKey: string }) => void;
    computedDecorator?: <
      TReturnType,
      TComputedFn extends (data: Record<string, any>) => TReturnType
    >(opts: {
      DOInstance: NodeDO;
      computedFn: TComputedFn;
    }) => () => TReturnType;
  };
  DOProxy?: {
    computedDecorator?: <
      TReturnType,
      TComputedFn extends (data: Record<string, any>) => TReturnType
    >(opts: {
      ProxyInstance: IDOProxy;
      computedFn: TComputedFn;
    }) => () => TReturnType;
  };
};

export type Config = {
  gqlClient: IGQLClient;
  plugins?: Array<Plugin>;
  generateMockData: boolean
  mockDataType: 'random' | 'static' | undefined
  staticData: StaticData | undefined
  getMockDataDelay?: () => number
  enableQuerySlimming: boolean
  paginationFilteringSortingInstance: EPaginationFilteringSortingInstance
  logging: {
    querySlimming: boolean
    gqlQueries: boolean
    gqlMutations: boolean
    gqlSubscriptions: boolean
    gqlSubscriptionErrors: boolean
  }
};

export interface IGQLClient {
  query(opts: {
    gql: DocumentNode;
    token?: string;
    cookie?: string;
    batchKey?: string;
  }): Promise<any>;
  subscribe(opts: {
    gql: DocumentNode;
    token?: string;
    cookie?: string;
    onMessage: (message: SubscriptionMessage) => void;
    onError: (error: any) => void;
  }): SubscriptionCanceller;
  mutate(opts: {
    mutations: Array<DocumentNode>;
    token?: string,
    cookie?: string
  }): Promise<any>;
}

export type QueryReturn<
  // @ts-ignore
  TQueryDefinitions extends QueryDefinitions
> = {
  data: QueryDataReturn<TQueryDefinitions>;
  error: any;
};

export type QueryOpts<
  // @ts-ignore
  TQueryDefinitions extends QueryDefinitions
> = {
  onData?: (info: { results: QueryDataReturn<TQueryDefinitions> }) => void;
  // When onError is provided, we pass it any errors encountered instead of throwing them.
  // This is by design, for consistency with the interface of subscribe
  onError?: (...args: any) => void;
  queryId?: string;
  batchKey?: string;
};

export type SubscriptionOpts<
  TQueryDefinitions extends QueryDefinitions<unknown, unknown, unknown>
> = {
  onData: (info: { results: QueryDataReturn<TQueryDefinitions> }) => void;
  // To catch an error in a subscription, you must provide an onError handler,
  // since we resolve this promise as soon as the subscriptions are initialized and the query is resolved (if it wasn't skipped)
  //
  // This means you can use the try/catch syntax try { await subscription } catch (e) {}
  // to catch errors querying or initializing subscriptions.
  //
  // However, when onError is given, errors will no longer be thrown
  // They will instead all be passed to the onError handler
  onError?: (...args: any) => void;
  // Allow subscriptions to be cancelled immediately after "subscribe" is called, and before the initial query resolves
  onSubscriptionInitialized?: (
    subscriptionCanceller: SubscriptionCanceller
  ) => void;
  onQueryManagerQueryStateChange?: (queryStateChangeOpts: {
    queryIdx: number;
    queryState: QueryState;
    error?: any;
  }) => void
  skipInitialQuery?: boolean;
  queryId?: string;
  batchKey?: string;
};


export type NodeDefaultProps = typeof DEFAULT_NODE_PROPERTIES;
export type PropertiesQueriedForAllNodes = typeof PROPERTIES_QUERIED_FOR_ALL_NODES;

export type SubscriptionCanceller = () => void;
export type SubscriptionMeta = {
  unsub: SubscriptionCanceller;
  // onQueryDefinitionsUpdated is a function that can be called to update the query definitions for this subscription
  // This is useful for when you want to change the query definitions for a subscription, but you don't want to
  // unsubscribe and resubscribe, which would cause pagination state to be lost
  onQueryDefinitionsUpdated: (newQueryDefinitionRecord: QueryDefinitions<any,any,any>) => Promise<void> ;
  error: any
};

export enum EPaginationFilteringSortingInstance {
  'SERVER', 
  'CLIENT'
}

export interface IMMGQL {
  getToken(opts: { tokenName: string }): string
  setToken(opts: { tokenName: string; token: string }): void
  clearTokens(): void
  query: ReturnType<typeof generateQuerier>
  subscribe: ReturnType<typeof generateSubscriber>
  gqlClient: IGQLClient
  plugins: Array<Plugin> | undefined
  generateMockData: boolean | undefined
  mockDataType: 'random' | 'static' | undefined
  staticData: StaticData | undefined
  getMockDataDelay: (() => number) | undefined
  enableQuerySlimming: boolean | undefined
  paginationFilteringSortingInstance: EPaginationFilteringSortingInstance
  DOProxyGenerator: ReturnType<typeof createDOProxyGenerator>
  DOFactory: ReturnType<typeof createDOFactory>
  QueryManager: ReturnType<typeof createQueryManager>
  QuerySlimmer: QuerySlimmer
  logging: Config['logging']

  def<
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
  }>;

  defTyped<
    TNode extends INode
  >(def: TNode extends INode<infer TNodeArgs> ? NodeDefArgs<TNodeArgs> : never): TNode
}

export type NodeDefArgs<
  TDefArgs extends {
    TNodeType: string,
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>,
    TNodeRelationalData: NodeRelationalQueryBuilderRecord,
  }
> = {
  type: TDefArgs["TNodeType"];
  properties: TDefArgs["TNodeData"];
  computed?: NodeComputedFns<{TNodeData: TDefArgs["TNodeData"] & NodeDefaultProps, TNodeComputedData: TDefArgs["TNodeComputedData"]}>;
  relational?: NodeRelationalFns<TDefArgs["TNodeRelationalData"]>;
  generateMockData?: () => DeepPartial<GetResultingDataTypeFromProperties<TDefArgs["TNodeData"]>>
};

/**
 * The interface implemented by each data type (like data.string, data.boolean)
 */
export interface IData<
  TDataArgs extends {
    TValue: any,
    TParsedValue: any,
    /**
     * only defined for object and array types
     *
     * for arrays is the data type of each item in that array
     * for objects is a record of strings to data (matching the structure the data.object received as an argument)
     */
    TBoxedValue:
      | IData<any>
      | DataDefaultFn
      | Record<string, IData | DataDefaultFn>
      | undefined
  } = any
> {
  type: string;
  parser(value: TDataArgs["TValue"]): TDataArgs["TParsedValue"];
  boxedValue: TDataArgs["TBoxedValue"];
  defaultValue: Maybe<TDataArgs["TParsedValue"]>;
  // if isOptional is false, the DO will set a default value on this property if it receives a null value from the BE
  isOptional: boolean;
  /**
   *  Enum type data will keep a reference to its acceptable values
   *  so that later this can be used by the mock data generator to produce a random value from this array
   */
  acceptableValues?: Array<TDataArgs["TParsedValue"]>
}

/**
 * Utility to extract the parsed value of an Data type
 */
export type GetDataType<TData extends IData | DataDefaultFn> = TData extends IData<
  infer TDataArgs
>
  ? TDataArgs['TParsedValue']
  : TData extends DataDefaultFn
    ? TData extends (_: any) => IData<infer TDataArgs>
      ? TDataArgs['TParsedValue']
      : never
  : never



export type GetParsedValueTypeFromDefaultFn<
  TDefaultFn extends (_default: any) => IData
> = TDefaultFn extends (_default: any) => IData<infer TDataArgs>
  ? TDataArgs["TParsedValue"]
  : never;

  /**
   * Utility to extract the resulting data type from the properties definition of a node
   * for example
   * 
   * {
   *   flag: boolean(false), // boolean and string types from mm-gql
   *   name: string
   * }
   * 
   * will return
   * 
   * {
   *   flag: boolean, // boolean and string native types from TS
   *   name: string
   * }
   */
export type GetResultingDataTypeFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> =  {
  [key in keyof TProperties]:
    TProperties[key] extends IData<infer TDataArgs>
      ? TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn>
        ? IsMaybe<TDataArgs["TParsedValue"]> extends true
          ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultProps<{ TNodeData: TDataArgs["TBoxedValue"], TNodeComputedData: {}}>>
          : GetAllAvailableNodeDataTypeWithoutDefaultProps<{ TNodeData: TDataArgs["TBoxedValue"], TNodeComputedData: {}}>
        : TDataArgs["TParsedValue"] extends Array<infer TArrayItemType>
          ? IsMaybe<TDataArgs["TParsedValue"]> extends true
            ? Maybe<Array<TArrayItemType>>
            : Array<TArrayItemType>
          : TDataArgs["TParsedValue"]
      : TProperties[key] extends DataDefaultFn
        ? GetParsedValueTypeFromDefaultFn<TProperties[key]>
        : never;
}

export type GetResultingFilterDataTypeFromProperties<TProperties extends Record<string, IData | DataDefaultFn>, TIsCollectionFilter extends boolean> =  {
  [key in keyof TProperties]:
    TProperties[key] extends IData<infer TDataArgs>
        ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn>
          ? IsMaybe<TDataArgs['TParsedValue']> extends true
            ? Maybe<GetAllAvailableNodeFilterDataTypeWithoutDefaultProps<{ TNodeData: TDataArgs['TBoxedValue'], TNodeComputedData: {}, TIsCollectionFilter: TIsCollectionFilter }>>
            : GetAllAvailableNodeFilterDataTypeWithoutDefaultProps<{TNodeData: TDataArgs['TBoxedValue'], TNodeComputedData: {}, TIsCollectionFilter: TIsCollectionFilter}>
          : TDataArgs['TParsedValue'] extends Array<infer TArrayItemType>
            ? IsMaybe<TDataArgs['TParsedValue']> extends true
              ? Maybe<Array<TArrayItemType>>
              : Array<TArrayItemType>
            : FilterValue<TDataArgs['TParsedValue'], TIsCollectionFilter>
      : TProperties[key] extends DataDefaultFn
        ? FilterValue<GetParsedValueTypeFromDefaultFn<TProperties[key]>, TIsCollectionFilter>
        : never;
}

export type GetSortingDataTypeFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> =  {
  [key in keyof TProperties]:
    TProperties[key] extends IData<infer TDataArgs>
      ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn>
        ? IsMaybe<TDataArgs['TParsedValue']> extends true
          ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultPropsForSorting<{ TNodeData: TDataArgs['TBoxedValue'], TNodeComputedData: {}}>>
          : GetAllAvailableNodeDataTypeWithoutDefaultPropsForSorting<{ TNodeData: TDataArgs['TBoxedValue'], TNodeComputedData: {}}>
        : TDataArgs['TParsedValue'] extends Array<infer TArrayItemType>
          ? IsMaybe<TDataArgs['TParsedValue']> extends true
            ? Maybe<Array<TArrayItemType>>
            : Array<TArrayItemType>
          : SortValue
      : TProperties[key] extends DataDefaultFn
        ?  SortValue
        : never;
}

export type GetResultingDataTypeFromNodeDefinition<TNode extends INode> =
  TNode extends INode<infer TNodeArgs> ? GetResultingDataTypeFromProperties<TNodeArgs["TNodeData"]> : never

export type SortDirection = 'asc' | 'desc'
export type NodeFilterCondition = 'or' | 'and'
export type CollectionFilterCondition = 'all' | 'some' | 'none'
export type FilterValue<TValue extends Maybe<string> | Maybe<number> | Maybe<boolean>, TIsCollectionFilter extends boolean> =
  // strict equality check
  TValue |
  (
    Partial<
      Record<
        TValue extends boolean
          ? EBooleanFilterOperator
          : TValue extends string
            ? EStringFilterOperator
              : TValue extends number
              ? ENumberFilterOperator
              : never,            
        TValue
      > & { condition?: TIsCollectionFilter extends true ? CollectionFilterCondition : NodeFilterCondition   }
    >
  )

export type SortObject = { direction: SortDirection, priority?: number }
export type SortValue = SortDirection | SortObject

export type GetResultingFilterDataTypeFromNodeDefinition<TSMNode extends INode, TIsCollectionFilter extends boolean> = TSMNode extends INode<infer TNodeArgs> ? GetResultingFilterDataTypeFromProperties<TNodeArgs["TNodeData"] & NodeDefaultProps, TIsCollectionFilter> : never
export type GetSortingDataTypeFromNodeDefinition<TSMNode extends INode> = TSMNode extends INode<infer TNodeArgs> ? GetSortingDataTypeFromProperties<TNodeArgs["TNodeData"] & NodeDefaultProps> : never

/**
 * Utility to extract the expected data type of a node based on its' properties and computed data
 * For data resulting from property definitions only, use GetResultingDataTypeFromProperties
 */

export type GetAllAvailableNodeDataType<
  TGetAllAvailableNodeDataTypeArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>
  }
> = GetResultingDataTypeFromProperties<
  TGetAllAvailableNodeDataTypeArgs['TNodeData'] & NodeDefaultProps
> & TGetAllAvailableNodeDataTypeArgs['TNodeComputedData'];

type GetAllAvailableNodeDataTypeWithoutDefaultPropsForSorting<
  TGetAllAvailableNodeDataTypeWithoutDefaultPropsForSortingArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>
  }
> = GetSortingDataTypeFromProperties<
  TGetAllAvailableNodeDataTypeWithoutDefaultPropsForSortingArgs['TNodeData']
> & TGetAllAvailableNodeDataTypeWithoutDefaultPropsForSortingArgs['TNodeComputedData'];

type GetAllAvailableNodeDataTypeWithoutDefaultProps<
  TGetAllAvailableNodeDataTypeWithoutDefaultPropsArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>
  }
> = GetResultingDataTypeFromProperties<
  TGetAllAvailableNodeDataTypeWithoutDefaultPropsArgs['TNodeData']
> & TGetAllAvailableNodeDataTypeWithoutDefaultPropsArgs['TNodeComputedData'];

type GetAllAvailableNodeFilterDataTypeWithoutDefaultProps<
  TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs extends {
    TNodeData:  Record<string, IData | DataDefaultFn>,
    TNodeComputedData:  Record<string, any>,
    TIsCollectionFilter: boolean
  }
> = GetResultingFilterDataTypeFromProperties<
  TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs['TNodeData'],
  TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs['TIsCollectionFilter']
> & TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs['TNodeComputedData'];

/**
 * Takes in any object and returns a Partial of that object type
 * for nested objects, those will also be turned into partials
 */
export type DeepPartial<ObjectType extends Record<string, any>> = Partial<
  {
    [Key in keyof ObjectType]: ObjectType[Key] extends Maybe<Array<any>>
      ? ObjectType[Key]
      : ObjectType[Key] extends Maybe<Record<string, any>>
      ? ObjectType[Key] extends null
        ? Maybe<DeepPartial<ObjectType[Key]>>
        : DeepPartial<ObjectType[Key]>
      : ObjectType[Key];
  }
>;

type IsArray<Thing extends any, Y = true, N = false> = Thing extends Array<any> ? Y : N

/**
 * A record that lives on each instance of a DOProxy to determine
 * if each data property on that DO is currently guaranteed to be up to date.
 * Any property that is read while not being up to date throws a run-time error to ensure the devs never use outdated data mistakenly
 */
export type UpToDateData<
  TNodeData extends Record<string, IData | DataDefaultFn>
> = DeepPartial<
  {
    [Key in keyof TNodeData]: TNodeData[Key] extends IData<{ TNodeData: Maybe<Array<any>>, TBoxedValue: any, TParsedValue: any, TValue: any }>
      ? boolean
      : TNodeData[Key] extends IData<infer TDataArgs>
      ? TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn>
        ? UpToDateData<TDataArgs["TBoxedValue"]>
        : boolean
      : boolean;
  }
>;

/**
 * These methods are called automatically when using this lib's public methods like "useData"
 */
export interface IDOMethods {
  /**
   * Called when we get data from the backend for this particular DO instance, found by its id
   */
  onDataReceived(data: Record<string, any>, opts?: {__unsafeIgnoreVersion?: boolean}): void;
}

export interface IDOAccessors {
  id: string
  version: number
  lastUpdatedBy: string
  persistedData: Record<string,any>
}

export type NodeDO = Record<string, any> & IDOMethods & IDOAccessors;

export type NodeComputedFns<
  TNodeComputedFnsArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>
  }
> = {
  [key in keyof TNodeComputedFnsArgs["TNodeComputedData"]]: (
    data: GetAllAvailableNodeDataType<TNodeComputedFnsArgs>
  ) => TNodeComputedFnsArgs["TNodeComputedData"][key];
};

export type NodeRelationalFns<
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key];
};

export interface INode<
  TNodeArgs extends {
    TNodeType: string,
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>,
    TNodeRelationalData: NodeRelationalQueryBuilderRecord,
  } = any,
  TNodeComputedFns = NodeComputedFns<{ TNodeData: TNodeArgs['TNodeData'] & NodeDefaultProps, TNodeComputedData: TNodeArgs['TNodeComputedData'] }>,
  TNodeDO = NodeDO
> {
  _isNodeDef: true;
  data: TNodeArgs['TNodeData'] & NodeDefaultProps;
  computed?: TNodeComputedFns;
  relational?: NodeRelationalFns<TNodeArgs['TNodeRelationalData']>;
  type: TNodeArgs['TNodeType'];
  repository: INodeRepository;
  do: new (data?: Record<string, any>) => TNodeDO;
  generateMockData?: () => DeepPartial<GetResultingDataTypeFromProperties<TNodeArgs["TNodeData"]>>
}

/**
 * These inform the library how to query for data that is related to the node type we're building.
 * So, for example, if a user has meetings under them, one of the user's relational data properties is "meetings", which will be "IChildren".
 * This teaches the library how to interpret a query that asks for the user's meetings.
 */
export type NodeRelationalQueryBuilder<
  TNodeRelationalQueryBuilderArgs extends {
    TTargetNodeOrTargetNodeRecord: INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
    TIncludeTotalCount: boolean,
    TMapFn: TNodeRelationalQueryBuilderArgs['TTargetNodeOrTargetNodeRecord'] extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TNodeRelationalQueryBuilderArgs['TTargetNodeOrTargetNodeRecord']>> :  never,
  }
> =
  | IOneToOneQueryBuilder<TNodeRelationalQueryBuilderArgs["TTargetNodeOrTargetNodeRecord"]>
  | IOneToManyQueryBuilder<TNodeRelationalQueryBuilderArgs["TTargetNodeOrTargetNodeRecord"]>
  | INonPaginatedOneToManyQueryBuilder<TNodeRelationalQueryBuilderArgs["TTargetNodeOrTargetNodeRecord"]>

export type NodeRelationalQuery<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>, TMapFn extends TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> : never> =
  | IOneToOneQuery<{ TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts: any }>
  | IOneToManyQuery<{ TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts: any, TIncludeTotalCount: any, TMapFn: TMapFn }>
  | INonPaginatedOneToManyQuery<{ TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts: any, TIncludeTotalCount: any, TMapFn: TMapFn }>

export type IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>> =
  TTargetNodeOrTargetNodeRecord extends INode
  ? {
      map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
  }
  : TTargetNodeOrTargetNodeRecord extends Record<string, INode>
    ? {
      [Tkey in keyof TTargetNodeOrTargetNodeRecord]: { map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]> }
    }
    : never
export interface IOneToOneQueryBuilder<
  TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>
> {
  <TQueryBuilderOpts extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(
    queryBuilderOpts: ValidateShape<TQueryBuilderOpts, IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>
  ): IOneToOneQuery<{TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts: TQueryBuilderOpts}>;
}
export interface IOneToOneQuery<
  TOneToOneQueryArgs extends {
    TTargetNodeOrTargetNodeRecord: INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
    TQueryBuilderOpts: IOneToOneQueryBuilderOpts<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>
  }
> {
  _relational: RELATIONAL_TYPES.oneToOne;
  _relationshipName: string;
  queryBuilderOpts: TOneToOneQueryArgs["TQueryBuilderOpts"]
  def: TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]
}

export type IOneToManyQueryBuilderOpts<
  TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
  TIncludeTotalCount extends boolean,
  TMapFn extends TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> :  never
> = TTargetNodeOrTargetNodeRecord extends INode
? SingleNodeTypeOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord, TIncludeTotalCount, TMapFn>
: TTargetNodeOrTargetNodeRecord extends Record<string, INode>
  ? {
    [Tkey in keyof TTargetNodeOrTargetNodeRecord]: { map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]> }
  }
  : never

type SingleNodeTypeOneToManyQueryBuilderOpts<TNode extends INode, TIncludeTotalCount extends boolean ,TMapFn extends MapFnForNode<TNode>> = {
      map: TMapFn;
      filter?: FilterTypeForQuery<{ TNode: TNode, TMapFn: TMapFn }, true>
      pagination?: IQueryPagination<TIncludeTotalCount>
      sort?: ValidSortForNode<TNode>
  }
    
export interface IOneToManyQueryBuilder<
    TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>,
> {
  <
    TIncludeTotalCount extends boolean,
    TMapFn extends TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> :  never,
    TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord,
      TIncludeTotalCount,
      TMapFn
    >>(
    queryBuilderOpts: ValidateShape<TQueryBuilderOpts,  IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord, TIncludeTotalCount, TMapFn>>
  ): IOneToManyQuery<{ TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts: TQueryBuilderOpts, TIncludeTotalCount: TIncludeTotalCount, TMapFn: TMapFn }>;
}
export interface IOneToManyQuery<
  TOneToManyQueryArgs extends {
    TTargetNodeOrTargetNodeRecord: INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
    TIncludeTotalCount: boolean,
    TMapFn: TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>> :  never,
    TQueryBuilderOpts: IOneToManyQueryBuilderOpts<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToManyQueryArgs['TIncludeTotalCount'], TOneToManyQueryArgs['TMapFn']>
  }
> {
  _relational: RELATIONAL_TYPES.oneToMany;
  _relationshipName: string;
  queryBuilderOpts: TOneToManyQueryArgs['TQueryBuilderOpts']
  def: TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']
}

export type INonPaginatedOneToManyQueryBuilderOpts<
  TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
  TIncludeTotalCount extends boolean,
  TMapFn extends TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> :  never
> = TTargetNodeOrTargetNodeRecord extends INode
? SingleNodeTypeOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord, TIncludeTotalCount, TMapFn>
: TTargetNodeOrTargetNodeRecord extends Record<string, INode>
  ? {
    [Tkey in keyof TTargetNodeOrTargetNodeRecord]: { map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]> }
  }
  : never
    
export interface INonPaginatedOneToManyQueryBuilder<
      TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>,
> {
  <
    TIncludeTotalCount extends boolean,
    TMapFn extends TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> :  never,
    TQueryBuilderOpts extends INonPaginatedOneToManyQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord,
      TIncludeTotalCount,
      TMapFn
    >>(
    queryBuilderOpts: ValidateShape<TQueryBuilderOpts, INonPaginatedOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord, TIncludeTotalCount, TMapFn>>
  ): INonPaginatedOneToManyQuery<{ TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts: TQueryBuilderOpts, TIncludeTotalCount: TIncludeTotalCount, TMapFn: TMapFn }>;
}
export interface INonPaginatedOneToManyQuery<
  TNonPaginatedOneToManyQueryArgs extends {
    TTargetNodeOrTargetNodeRecord: INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
    TIncludeTotalCount: boolean,
    TMapFn: TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode | Maybe<INode> ? MapFnForNode<NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>> : never,
    TQueryBuilderOpts: IOneToManyQueryBuilderOpts<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], TNonPaginatedOneToManyQueryArgs['TIncludeTotalCount'], TNonPaginatedOneToManyQueryArgs['TMapFn']>
  }
> {
  _relational: RELATIONAL_TYPES.nonPaginatedOneToMany;
  _relationshipName: string;
  queryBuilderOpts: TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts']
  def: TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']
}

export enum DATA_TYPES {
  string = 's',
  maybeString = 'mS',
  stringEnum = 'sE',
  maybeStringEnum = 'mSE',
  number = 'n',
  maybeNumber = 'mN',
  boolean = 'b',
  maybeBoolean = 'mB',
  object = 'o',
  maybeObject = 'mO',
  record = 'r',
  maybeRecord = 'mR',
  array = 'a',
  maybeArray = 'mA',
}

export enum RELATIONAL_TYPES {
  oneToOne = 'oTO',
  oneToMany = 'oTM',
  nonPaginatedOneToMany = 'nPOTM',
}

export interface IQueryPagination<TIncludeTotalCount extends boolean> {
  itemsPerPage?: number
  // not supported atm
  // startPage?: number
  // only startCursor or endCursor can be set
  // if startCursor is set, returns the first N results from that cursor
  // if endCursor ir set, returns the first N results up to that cursor
  startCursor?: string
  endCursor?: string
  includeTotalCount?: TIncludeTotalCount
}

export type NodeRelationalQueryBuilderRecord = Record<
  string,
  // the tsignore here is necessary
  // because the generic that NodeRelationalQueryBuilder needs is
  // the node definition for the origin of the relational queries
  // which when defining a node, is the node being defined
  // attempting to replicate the node here would always end up in a loop
  // since we need the relational data to construct a node
  // and need the node to construct the relational data (without this ts ignore)
  // @ts-ignore
  NodeRelationalQueryBuilder
>;

export interface INodeRepository {
  byId(id: string): NodeDO;
  onDataReceived(data: { id: string } & Record<string, any>): void;
  onNodeDeleted(id: string): void;
}

export enum EStringFilterOperator {
  'eq' = 'eq', // equal
  'neq' = 'neq', // not equal
  'contains' = 'contains',
  'ncontains' = 'ncontains',
  'startsWith' = 'startsWith',
  'nstartsWith' = 'nstartsWith',
  'endsWith' = 'endsWith',
  'nendsWith' = 'nendsWith',
}

export enum ENumberFilterOperator {
  'eq' = 'eq', // equal
  'neq' = 'neq', // not equal
  'gt' = 'gt',
  'ngt' = 'ngt',
  'gte' = 'gte',
  'ngte' = 'ngte',
  'lt' = 'lt',
  'nlt' = 'nlt',
  'lte' = 'lte',
  'nlte' = 'nlte'
}

export enum EBooleanFilterOperator {
  'eq' = 'eq', // equal
  'neq' = 'neq' // not equal
}

export type FilterOperator = EStringFilterOperator | ENumberFilterOperator | EBooleanFilterOperator

/**
 * Returns the valid filter for a node
 * excluding properties which are arrays and records
 * and including properties which are nested in objects
 */
export type ValidFilterForNode<TNode extends INode, TIsCollectionFilter extends boolean> = Partial<ExtractNodeFilterData<TNode, TIsCollectionFilter>>
export type ValidFilterForMapFnRelationalResults<
  TValidFilterForMapFnRelationalResultsArgs extends {
    TMapFn: MapFnForNode<TValidFilterForMapFnRelationalResultsArgs['TNode']> | undefined,
    TNode: INode
  },
  TMapFn = TValidFilterForMapFnRelationalResultsArgs['TMapFn'],
  TMapFnReturn = TMapFn extends (...args: any) => any ? ReturnType<TMapFn> : {}
> = Partial<RemoveNevers<{
  [TKey in keyof TMapFnReturn]:
    TMapFnReturn[TKey] extends IOneToOneQuery<infer TOneToOneQueryArgs>
      ? TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode
        ? TOneToOneQueryArgs['TQueryBuilderOpts']['map'] extends MapFnForNode<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>
          ? ValidFilterForNode<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'], false>
          : never
        : never
      : TMapFnReturn[TKey] extends IOneToManyQuery<infer TOneToManyQueryArgs>
        ? TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode
          ? TOneToManyQueryArgs['TQueryBuilderOpts']['map'] extends MapFnForNode<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>
            ? ValidFilterForNode<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], true>
            : never
          : never
      : TMapFnReturn[TKey] extends INonPaginatedOneToManyQuery<infer TNonPaginatedOneToManyQueryArgs>
        ? TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode
          ? TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts']['map'] extends MapFnForNode<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>
            ? ValidFilterForNode<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], true>
            : never
          : never
      : never
}>>

export type ValidSortForNode<TNode extends INode> = ExtractNodeSortData<TNode> | ExtractNodeRelationalDataSort<TNode>

export type ExtractNodeFilterData<TNode extends INode, TIsCollectionFilter extends boolean> = DeepPartial<{
  [
    TKey in keyof ExtractNodeDataWithDefaultProperties<TNode> as
      ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends IData<infer TDataArgs>
        ? IsArray<TDataArgs["TParsedValue"]> extends true
          ? never
          : TDataArgs["TBoxedValue"] extends undefined 
            ? TKey
            : TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn>
              ? TKey
              : never
        : ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends DataDefaultFn
          ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeDataWithDefaultProperties<TNode>[TKey]>> extends true
            ? never
            : TKey
          : TKey  
  ]: TKey extends keyof GetResultingFilterDataTypeFromNodeDefinition<TNode, TIsCollectionFilter>
    ? GetResultingFilterDataTypeFromNodeDefinition<TNode, TIsCollectionFilter>[TKey]
    : never
}> 

export type ExtractNodeSortData<TNode extends INode> = DeepPartial<{
  [
    TKey in keyof ExtractNodeDataWithDefaultProperties<TNode> as
      ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends IData<infer TDataArgs>
        ? IsArray<TDataArgs["TParsedValue"]> extends true
          ? never
          : TDataArgs["TBoxedValue"] extends undefined 
            ? TKey
            : TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn>
              ? TKey
              : never
        : ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends DataDefaultFn
          ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeDataWithDefaultProperties<TNode>[TKey]>> extends true
            ? never
            : TKey
          : TKey  
  ]: TKey extends keyof GetSortingDataTypeFromNodeDefinition<TNode>
    ? GetSortingDataTypeFromNodeDefinition<TNode>[TKey]
    : never
}> 

export type QueryDefinitionTarget =
  | { id: string, allowNullResult?: boolean }
  | { ids: Array<string> }
    
export type FilterTypeForQuery<TFilterTypeForQueryArgs extends { TNode: INode, TMapFn: MapFnForNode<TFilterTypeForQueryArgs['TNode']> | undefined }, TIsCollectionFilter extends boolean = false>  = 
  ValidFilterForMapFnRelationalResults<TFilterTypeForQueryArgs> & ValidFilterForNode<TFilterTypeForQueryArgs['TNode'], TIsCollectionFilter>

export type SortObjectForNode<TNode extends INode> = ValidSortForNode<TNode> 
// The config needed by a query to get one or multiple nodes of a single type
export type QueryDefinition<
  TQueryDefinitionArgs extends {
    TNode: INode,
    TMapFn: MapFnForNode<TQueryDefinitionArgs["TNode"]> | undefined,
    TQueryDefinitionTarget: QueryDefinitionTarget,
    TIncludeTotalCount: boolean
  }
> = { 
  def: TQueryDefinitionArgs["TNode"];
  map: TQueryDefinitionArgs["TMapFn"];
  filter?: FilterTypeForQuery<{TMapFn: TQueryDefinitionArgs['TMapFn'], TNode: TQueryDefinitionArgs['TNode']}>
  sort?: SortObjectForNode<TQueryDefinitionArgs["TNode"]>
  target?: TQueryDefinitionArgs["TQueryDefinitionTarget"]
  pagination?: IQueryPagination<TQueryDefinitionArgs["TIncludeTotalCount"]>
  tokenName?: string
};

// A query takes a record where you can specify aliases for each node type you're querying (including 2 aliases for different sets of the same node type)
//
// example:
//  usersTodos: queryDefinition({
//    def: todo,
//    under: [authenticatedUser.id],
//    map: ({ id }) => ({ id })
//  }),
//  meetingTodos: queryDefinition({
//    def: todo,
//    under: [meeting.id],
//    map: ({ id } => ({ id })
//  })
//
export type QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget> = Record<
  string,
  // adding strict params to QueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
  // in QueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
  // strangely, if we simply tell TS to ignore the error it works perfectly
  // see https://tractiontools.atlassian.net/browse/MM-433 for simplified examples
  // @ts-ignore
  QueryDefinition<{ TNode: TNode, TMapFn: TMapFn, TQueryDefinitionTarget: TQueryDefinitionTarget }> | INode | null
>;

export type UseSubscriptionQueryDefinitionOpts = {doNotSuspend?: boolean}

export type UseSubscriptionQueryDefinition<
  TUseSubscriptionQueryDefinitionArgs extends {
    TNode: INode,
    TMapFn:  MapFnForNode<TUseSubscriptionQueryDefinitionArgs['TNode']> | undefined,
    TQueryDefinitionTarget: QueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts: UseSubscriptionQueryDefinitionOpts
    TIncludeTotalCount: boolean
  }
> = QueryDefinition<{
  TNode: TUseSubscriptionQueryDefinitionArgs["TNode"],
  TMapFn: TUseSubscriptionQueryDefinitionArgs["TMapFn"],
  TQueryDefinitionTarget: TUseSubscriptionQueryDefinitionArgs["TQueryDefinitionTarget"], 
  TIncludeTotalCount:  TUseSubscriptionQueryDefinitionArgs["TIncludeTotalCount"]
}> & {useSubOpts?: TUseSubscriptionQueryDefinitionArgs["TUseSubscriptionQueryDefinitionOpts"]}

export type UseSubscriptionQueryDefinitions<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts
> = Record<
  string,
  // adding strict params to UseSubscriptionQueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
  // in UseSubscriptionQueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
  // strangely, if we simply tell TS to ignore the error it works perfectly
  // see https://tractiontools.atlassian.net/browse/MM-433 for simplified examples
  // eslint-disable-next-line
  // @ts-ignore
  UseSubscriptionQueryDefinition<{
    TNode: TNode,
    TMapFn: TMapFn,
    TQueryDefinitionTarget: TQueryDefinitionTarget,
    TUseSubscriptionQueryDefinitionOpts: TUseSubscriptionQueryDefinitionOpts
  }> | INode | null
>

export type QueryDataReturn<
  // @ts-ignore
  TQueryDefinitions extends QueryDefinitions
> = {
  [Key in keyof TQueryDefinitions]: IsMaybe<TQueryDefinitions[Key]> extends true
    ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>>
    : GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>
};

export type GetResultingDataFromQueryDefinition<TQueryDefinition extends QueryDefinition<any> | INode | null> = TQueryDefinition extends {
  map: MapFn<any>;
}
  ? /**
     * full query definition provided, with a map fn
     */
    TQueryDefinition extends { def: infer TNode; map: infer TMapFn }
    ? TNode extends INode
      ? TMapFn extends MapFnForNode<TNode>
        ? TQueryDefinition extends { target?: { id: string } }
          ? TQueryDefinition extends { target?: { allowNullResult: true } }
            ? Maybe<ExtractQueriedDataFromMapFn<TMapFn, TNode>>
            : ExtractQueriedDataFromMapFn<TMapFn, TNode>
          : NodesCollectionWithCorrectTotalCountParam<{
              TItemType: ExtractQueriedDataFromMapFn<TMapFn, TNode>,
              TQueryDefinition: TQueryDefinition
            }>
        : never
      : never
    : never
  : TQueryDefinition extends { def: INode } // full query definition provided, but map function omitted // return the entirety of the node's data
  ? TQueryDefinition extends { def: infer TNode }
    ? TNode extends INode
      ? TQueryDefinition extends { target?: { id: string } }
        ? GetAllAvailableNodeDataType<{ TNodeData: ExtractNodeData<TNode>, TNodeComputedData: ExtractNodeComputedData<TNode> }> & DataExpectedOnAllNodeResults<TNode>
        : NodesCollectionWithCorrectTotalCountParam<{
            TItemType: GetAllAvailableNodeDataType<{ TNodeData: ExtractNodeData<TNode>, TNodeComputedData: ExtractNodeComputedData<TNode> }>  & DataExpectedOnAllNodeResults<TNode>,
            TQueryDefinition: TQueryDefinition
          }>
      : never
    : never
  : TQueryDefinition extends INode
  ? /**
     * shorthand syntax used, only a node definition was provided
     */
    NodesCollectionWithCorrectTotalCountParam<{
      TItemType: GetAllAvailableNodeDataType<{
        TNodeData: ExtractNodeData<TQueryDefinition>,
        TNodeComputedData: ExtractNodeComputedData<TQueryDefinition>
      }> & DataExpectedOnAllNodeResults<TQueryDefinition>,
      TQueryDefinition: TQueryDefinition
    }>
  : never;

type NodesCollectionWithCorrectTotalCountParam<NodesCollectionWithCorrectTotalCountParamArgs extends {
    TItemType: unknown,
    TQueryDefinition: unknown
}> = 
  NodesCollectionWithCorrectTotalCountParamArgs["TQueryDefinition"] extends {pagination?: IQueryPagination<true> | undefined}
        ? NodesCollection<{ TItemType: NodesCollectionWithCorrectTotalCountParamArgs["TItemType"],  TIncludeTotalCount: true }>
        : NodesCollection<{ TItemType: NodesCollectionWithCorrectTotalCountParamArgs["TItemType"], TIncludeTotalCount: false }>

// The extends check is slightly different. Not sure why since IQueryPagination is the same type as what's being checked below
type NodesCollectionWithCorrectTotalCountParamForRelationalQueries<NodesCollectionWithCorrectTotalCountParamArgs extends {
    TItemType: unknown,
    TQueryDefinition: unknown
}> = 
  NodesCollectionWithCorrectTotalCountParamArgs["TQueryDefinition"] extends {pagination?: {includeTotalCount: true} }
        ? NodesCollection<{ TItemType: NodesCollectionWithCorrectTotalCountParamArgs["TItemType"],  TIncludeTotalCount: true }>
        : NodesCollection<{ TItemType: NodesCollectionWithCorrectTotalCountParamArgs["TItemType"], TIncludeTotalCount: false }>

export type UseSubscriptionReturn<
  // @ts-ignore
  TQueryDefinitions extends UseSubscriptionQueryDefinitions
> = {
  data: {
    [key in keyof TQueryDefinitions]:
      TQueryDefinitions[key] extends { useSubOpts?:{ doNotSuspend: true } }
          ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[key]>>
          : IsMaybe<TQueryDefinitions[key]> extends true
            ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[key]>>
            : GetResultingDataFromQueryDefinition<TQueryDefinitions[key]>
  },
  querying: boolean,
  error: any
}
  
export type MapFnForNode<TNode extends INode> = MapFn<{
  TNodeData: ExtractNodeData<TNode>,
  TNodeComputedData: ExtractNodeComputedData<TNode>,
  TNodeRelationalData: ExtractNodeRelationalData<TNode>
}>;

export type MapFn<
  TMapFnArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>,
    TNodeComputedData: Record<string, any>,
    TNodeRelationalData: NodeRelationalQueryBuilderRecord,
  },
> = ((
  data: GetMapFnArgs<INode<TMapFnArgs & { TNodeType: any }>>
) => RequestedData) | undefined

export type GetMapFnArgs<
  TNode extends INode,
> = TNode extends INode<infer TNodeArgs>
  ? GetMapFnArgsFromProperties<TNodeArgs['TNodeData']> &
      TNodeArgs['TNodeRelationalData']
      & GetMapFnArgsFromProperties<NodeDefaultProps>
  : never;

type GetMapFnArgsFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> = {
  [key in keyof TProperties]: 
    TProperties[key] extends IData<{TParsedValue: Maybe<Array<any>>, TValue: any, TBoxedValue: any}>
      ? TProperties[key]
      : TProperties[key] extends IData<infer TDataArgs>
        ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn>
          // allows querying a partial of an object within a node
          ? <TMapFn extends MapFn<{ TNodeData: TDataArgs['TBoxedValue'], TNodeComputedData:Record<string,never>,  TNodeRelationalData: Record<string,never> }>>(opts: {
              map: TMapFn;
            }) => TMapFn
          : TProperties[key]
        : TProperties[key]
}


// The accepted type for a map fn return
// validates that the engineer is querying data that exists on the nodes
// which gives us typo prevention :)
type RequestedData = {
  [key in string]:
    | IData
    | ((args: any) => RequestedData | IData)
    | ((opts: { map: MapFn<any> }) => MapFn<any>)
    | IOneToManyQuery<any>
    | INonPaginatedOneToManyQuery<any>
    | IOneToOneQuery<any>
} 

// A generic to extract the resulting data based on a map fn
export type ExtractQueriedDataFromMapFn<
  TMapFn extends MapFnForNode<NonNullable<TNode>>,
  TNode extends INode | null // null when querying within a nested object
> = RemoveNevers<
  (TNode extends null ? Record<string,never> : DataExpectedOnAllNodeResults<NonNullable<TNode>>)
  & 
  (TMapFn extends undefined
    ? GetAllAvailableNodeDataType<{
        TNodeData: ExtractNodeData<NonNullable<TNode>>,
        TNodeComputedData: ExtractNodeComputedData<NonNullable<TNode>
      >}>
    :
    TMapFn extends NonNullable<MapFnForNode<NonNullable<TNode>>>
      ? ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, NonNullable<TNode>>
      : never
  )
>

type DataExpectedOnAllNodeResults<TNode extends INode> =
  { type: TNode['type'] }
  & GetResultingDataTypeFromProperties<PropertiesQueriedForAllNodes>
  & ExtractNodeComputedData<TNode>

// From the return of a map fn, get the type of data that will be returned by that portion of the query, aka the expected response from the API
type ExtractQueriedDataFromMapFnReturn<
  TMapFnReturn,
  TNode extends INode
> = {
  [Key in keyof TMapFnReturn]:
    // when we passed through a relational property without specifying a mapFn
    TMapFnReturn[Key] extends NodeRelationalQueryBuilder<any>
    ? never
    :
    TMapFnReturn[Key] extends IOneToOneQuery<any>
    ? ExtractQueriedDataFromOneToOneQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends IOneToManyQuery<any>
    ? ExtractQueriedDataFromOneToManyQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends INonPaginatedOneToManyQuery<any>
    ? ExtractQueriedDataFromNonPaginatedOneToManyQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends MapFnForNode<TNode>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode>  
    :
    // when we're querying data on the node we used as the "def"
    TMapFnReturn[Key] extends IData | DataDefaultFn
    ? GetDataType<TMapFnReturn[Key]>
    :
    // when we passed through an object property without specifying a mapFn
    TMapFnReturn[Key] extends (opts: {map: MapFn<infer TMapFnArgs>}) => MapFn<any>
    ? GetResultingDataTypeFromProperties<TMapFnArgs['TNodeData']>
    :
    // when we're querying data inside a nested object
    TMapFnReturn[Key] extends MapFn<any>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], null>
    :
    never;
};

// Without this,ExtractQueriedDataFromOneToOneQuery and ExtractResultsUnionFromOneToOneQueryBuilder somehow cause a loop
// even though ExtractQueriedDataFromOneToOneQuery does not call ExtractResultsUnionFromOneToOneQueryBuilder unless it's dealing with a record of node definitions (union representation)
// borrowed this solution from this article
// https://www.angularfix.com/2022/01/why-am-i-getting-instantiation-is.html
// relavant github discussions:
// https://github.com/microsoft/TypeScript/issues/34933
// https://github.com/microsoft/TypeScript/pull/44997
// https://github.com/microsoft/TypeScript/pull/45025
type Prev = [never, 0, 1];

type ExtractQueriedDataFromOneToOneQuery<
  TOneToOneQuery extends IOneToOneQuery<any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TOneToOneQuery extends IOneToOneQuery<infer TOneToOneQueryArgs>
    ? IsMaybe<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> extends true
      ? TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<INode>
        ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<NonNullable<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>>
          ? Maybe<ExtractQueriedDataFromMapFn<TOneToOneQueryArgs['TQueryBuilderOpts']['map'], NonNullable<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>>>
          : never
        : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<Record<string, INode>>
          ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<NonNullable<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>>
            ? Maybe<ExtractResultsUnionFromOneToOneQueryBuilder<NonNullable<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>, TOneToOneQueryArgs['TQueryBuilderOpts'], Prev[D]>>
            : never
          : never
      : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode
        ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>
          ? ExtractQueriedDataFromMapFn<TOneToOneQueryArgs['TQueryBuilderOpts']['map'], TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>
          : never
        : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Record<string, INode>
          ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>
            ? ExtractResultsUnionFromOneToOneQueryBuilder<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToOneQueryArgs['TQueryBuilderOpts'], Prev[D]>
            : never
          : never
    : never

type ExtractQueriedDataFromOneToManyQuery<
  TOneToManyQuery extends IOneToManyQuery<any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TOneToManyQuery extends IOneToManyQuery<infer TOneToManyQueryArgs>
    ? IsMaybe<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']> extends true
      ? TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<INode>
        ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TOneToManyQueryArgs["TIncludeTotalCount"], TOneToManyQueryArgs['TMapFn']>
          ? Maybe<NodesCollectionWithCorrectTotalCountParamForRelationalQueries<{
              TItemType: ExtractQueriedDataFromMapFn<
                TOneToManyQueryArgs['TQueryBuilderOpts']['map'],
                NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>
              >,
              TQueryDefinition: TOneToManyQueryArgs['TQueryBuilderOpts']
            }>>
          : never
        : TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<Record<string, INode>>
          ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TOneToManyQueryArgs["TIncludeTotalCount"], TOneToManyQueryArgs['TMapFn']> 
            ? Maybe<NodesCollectionWithCorrectTotalCountParamForRelationalQueries<{
                TItemType:  ExtractResultsUnionFromOneToOneQueryBuilder<
                  NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>,
                  TOneToManyQueryArgs['TQueryBuilderOpts'],
                  Prev[D]
                >,
                TQueryDefinition: TOneToManyQueryArgs['TQueryBuilderOpts']
              }>>
            : never
          : never
      : TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode
        ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToManyQueryArgs["TIncludeTotalCount"], TOneToManyQueryArgs['TMapFn']>
          ? NodesCollectionWithCorrectTotalCountParamForRelationalQueries<{
              TItemType: ExtractQueriedDataFromMapFn<
                TOneToManyQueryArgs['TQueryBuilderOpts']['map'],
                TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']
              >,
              TQueryDefinition: TOneToManyQueryArgs['TQueryBuilderOpts']
            }>
          : never
        : TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Record<string, INode>
        ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToManyQueryArgs["TIncludeTotalCount"], TOneToManyQueryArgs['TMapFn']>
            ? NodesCollectionWithCorrectTotalCountParamForRelationalQueries<{
                TItemType: ExtractResultsUnionFromOneToOneQueryBuilder<
                  TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'],
                  TOneToManyQueryArgs['TQueryBuilderOpts'],
                  Prev[D]
                >,
                TQueryDefinition: TOneToManyQueryArgs['TQueryBuilderOpts']
              }>
            : never
          : never
    : never

type ExtractQueriedDataFromNonPaginatedOneToManyQuery<
  TNonPaginatedOneToManyQuery extends INonPaginatedOneToManyQuery<any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TNonPaginatedOneToManyQuery extends INonPaginatedOneToManyQuery<infer TNonPaginatedOneToManyQueryArgs>
    ? IsMaybe<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']> extends true
      ? TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<INode>
        ? TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts'] extends INonPaginatedOneToManyQueryBuilderOpts<NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TNonPaginatedOneToManyQueryArgs["TIncludeTotalCount"], TNonPaginatedOneToManyQueryArgs['TMapFn']>
          ? Maybe<Array<ExtractQueriedDataFromMapFn<
            TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts']['map'],
            NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>
          >>>
          : never
        : TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<Record<string, INode>>
          ? TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts'] extends INonPaginatedOneToManyQueryBuilderOpts<NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TNonPaginatedOneToManyQueryArgs["TIncludeTotalCount"], TNonPaginatedOneToManyQueryArgs['TMapFn']>
            ? Maybe<Array<ExtractResultsUnionFromOneToOneQueryBuilder<
              NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>,
              TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts'],
              Prev[D]
            >>>
            : never
          : never
      : TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode
        ? TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts'] extends INonPaginatedOneToManyQueryBuilderOpts<NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TNonPaginatedOneToManyQueryArgs["TIncludeTotalCount"], TNonPaginatedOneToManyQueryArgs['TMapFn']>
          ? Array<ExtractQueriedDataFromMapFn<
            TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts']['map'],
            TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']
          >>
          : never
        : TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Record<string, INode>
        ? TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts'] extends INonPaginatedOneToManyQueryBuilderOpts<NonNullable<TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TNonPaginatedOneToManyQueryArgs["TIncludeTotalCount"], TNonPaginatedOneToManyQueryArgs['TMapFn']>
            ? Array<ExtractResultsUnionFromOneToOneQueryBuilder<
                TNonPaginatedOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'],
                TNonPaginatedOneToManyQueryArgs['TQueryBuilderOpts'],
                Prev[D]
              >>
            : never
          : never
    : never

type ExtractResultsUnionFromOneToOneQueryBuilder<
  TTargetNodeOrTargetNodeRecord extends Record<string, INode>,
  TQueryBuilderOpts extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>,
  D extends Prev[number]
> = ExtractObjectValues<{
  [key in keyof TQueryBuilderOpts]:
      key extends keyof TTargetNodeOrTargetNodeRecord 
        ? TQueryBuilderOpts[key] extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]>
          ?
            ExtractQueriedDataFromOneToOneQuery<
              // says this doesn't satisfy the constraint of IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]>
              // but it does, and it works anyway
              // @ts-ignore
              IOneToOneQuery<{
                TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord[key],
                TQueryBuilderOpts: {
                  map: TQueryBuilderOpts[key]['map']                }
              }>,
               D
            >
          : never
        : never
}>

type ExtractObjectValues<TObject extends Record<string,any>> = TObject extends Record<string, infer TValueType> ? TValueType : never

export type ExtractNodeData<TNode extends INode> = TNode extends INode<
  infer TNodeArgs
>
  ? TNodeArgs["TNodeData"]
  : never;
export type ExtractNodeDataWithDefaultProperties<TNode extends INode> = TNode extends INode<
  infer TNodeArgs
>
  ? TNodeArgs["TNodeData"] & NodeDefaultProps
  : never;

export type ExtractNodeRelationalDataSort<TNode extends INode> = TNode extends INode<infer TNodeArgs>
  ? DeepPartial<{[Tkey in keyof TNodeArgs['TNodeRelationalData']]: 
    TNodeArgs['TNodeRelationalData'][Tkey] extends (IOneToManyQueryBuilder<infer TOneToManyRelationalNode> | INonPaginatedOneToManyQueryBuilder<infer TOneToManyRelationalNode>)
      ? TOneToManyRelationalNode extends INode<any> 
        ? ExtractNodeSortData<TOneToManyRelationalNode> : never 
    : TNodeArgs['TNodeRelationalData'][Tkey] extends IOneToOneQueryBuilder<infer TOneToOneRelationalNode> 
      ? TOneToOneRelationalNode extends INode<any> 
        ? ExtractNodeSortData<TOneToOneRelationalNode> : never  
    : never}>
  : never;

type ExtractNodeComputedData<TNode extends INode> = TNode extends INode<
  infer TNodeArgs
>
  // RemoveNevers fixes this bug https://winterinternational.atlassian.net/browse/TTD-1317
  ? RemoveNevers<TNodeArgs["TNodeComputedData"]>
  : never;

export type ExtractNodeRelationalData<
  TNode extends INode
> = TNode extends INode<infer TNodeArgs>
  // RemoveNevers fixes this bug https://winterinternational.atlassian.net/browse/TTD-1317
  ? RemoveNevers<TNodeArgs["TNodeRelationalData"]>
  : never;

/**
 * a record of all the queries identified in this query definitions
 * looks something like this
 *
 * {
 *   // alias
 *   usersTodos: {
 *     // the Node we're querying
 *     def: todo,
 *     // id used as under
 *     under: ['some-id-I-want-to-get-children-for'],
 *     // ^ could have under or ids, not both
 *     ids: ['some-specific-node-id-im-trying-to-query'],
 *     // properties being queried on this todo, Array<keyof Todo>
 *     properties: ['id', 'task'],
 *     // relational data being queried
 *     relational: {
 *       // alias for the relational query result
 *       assignee: {
 *         // the node for the relational data we're querying
 *         def: user,
 *         properties: ['firstName', 'lastName'],
 *
 *         // if the todo node defines the assignee as being a "oneToMany" relationship
 *         // This would also return an array of users, instead of a single user in that case.
 *         oneToMany: true,
 *         // OR if the todo node defines the assignee as being a "oneToOne" relationship
 *         oneToOne: true
 *       }
 *     }
 *   })
 * }
 */
export type BaseQueryRecordEntry = {
  def: INode;
  properties: Array<string>;
  relational?: RelationalQueryRecord;
  filter?: ValidFilterForNode<INode, boolean>
  sort?: ValidSortForNode<INode>
  pagination?: IQueryPagination<boolean>
};

export type QueryRecordEntry = BaseQueryRecordEntry & {
  tokenName: Maybe<string>
  pagination?: IQueryPagination<boolean>
  ids?: Array<string> 
  id?: string
  allowNullResult?: boolean
}

export type RelationalQueryRecordEntry =  { _relationshipName: string } & (
  | (BaseQueryRecordEntry & { oneToOne: true })
  | (BaseQueryRecordEntry & { oneToMany: true })
  | (BaseQueryRecordEntry & { nonPaginatedOneToMany: true })
)

export type QueryRecord = Record<string, QueryRecordEntry | null>;

export type RelationalQueryRecord = Record<string, RelationalQueryRecordEntry>

export interface IDOProxy {
  updateRelationalResults(
    newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>
  ): void;
}

export type SubscriptionMessage = {
  data: Record<string, SubscriptionMessageData>;
}

export type SubscriptionMessageData = {
  __typename: string,
  id:  string
  target?: {
    id: string | number,
    property: string
  },
  value?: {id: string} & Record<string,any>
}
