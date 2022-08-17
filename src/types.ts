import { DEFAULT_NODE_PROPERTIES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { generateQuerier, generateSubscriber } from './queriers';
import { createQueryManager } from './QueryManager';
import { createTransaction } from './transaction/transaction';
import { QuerySlimmer } from './QuerySlimmer'

export type BOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export type Maybe<T> = T | null;

export type IsMaybe<Type> = null extends Type ? true : false

export type DataDefaultFn = {
  _default: IData
  (_default: any): IData;
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
  enableQuerySlimming: boolean
  enableQuerySlimmingLogging: boolean
};

export interface IGQLClient {
  query(opts: {
    gql: DocumentNode;
    token: string;
    batchKey?: string;
  }): Promise<any>;
  subscribe(opts: {
    gql: DocumentNode;
    token: string;
    onMessage: (message: Record<string, any>) => void;
    onError: (error: any) => void;
  }): SubscriptionCanceller;
  mutate(opts: { mutations: Array<DocumentNode>; token: string }): Promise<any>;
}

export interface IQueryManager {
  onQueryResult(opts: { queryResult: any; queryId: string }): void;
  onSubscriptionMessage(opts: {
    node: Record<string, any>;
    operation: {
      action: 'UpdateNode' | 'DeleteNode' | 'InsertNode';
      path: string;
    };
    queryId: string;
    subscriptionAlias: string;
  }): void;
  getResults: () => Record<string, any>;
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
  // @ts-ignore
  TQueryDefinitions extends QueryDefinitions
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
  onQueryInfoConstructed?: (queryInfo: {
    queryGQL: DocumentNode;
    queryId: string;
  }) => void;
  skipInitialQuery?: boolean;
  queryId?: string;
  batchKey?: string;
};


export type NodeDefaultProps = typeof DEFAULT_NODE_PROPERTIES;

export type SubscriptionCanceller = () => void;
export type SubscriptionMeta = { unsub: SubscriptionCanceller; error: any };

export interface IMMGQL {
  getToken(opts: { tokenName: string }): string
  setToken(opts: { tokenName: string; token: string }): void
  clearTokens(): void
  query: ReturnType<typeof generateQuerier>
  subscribe: ReturnType<typeof generateSubscriber>
  transaction: ReturnType<typeof createTransaction>
  gqlClient: IGQLClient
  plugins: Array<Plugin> | undefined
  generateMockData: boolean | undefined
  enableQuerySlimming: boolean | undefined
  enableQuerySlimmingLogging: boolean | undefined
  DOProxyGenerator: ReturnType<typeof createDOProxyGenerator>
  DOFactory: ReturnType<typeof createDOFactory>
  QueryManager: ReturnType<typeof createQueryManager>
  QuerySlimmer: QuerySlimmer

  def<
    TNodeType extends string,
    TNodeData extends Record<string, IData | DataDefaultFn>,
    TNodeComputedData extends Record<string, any>,
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  >(
    def: NodeDefArgs<
      TNodeType,
      TNodeData,
      TNodeComputedData,
      TNodeRelationalData
    >
  ): INode<TNodeType, TNodeData & NodeDefaultProps, TNodeComputedData, TNodeRelationalData>;
}

export type NodeDefArgs<
  TNodeType extends string,
  TNodeData extends Record<string, IData | DataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
> = {
  type: TNodeType;
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData & NodeDefaultProps, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
};

/**
 * The interface implemented by each data type (like data.string, data.boolean)
 */
export interface IData<
  TParsedValue = any,
  TValue = any,
  /**
   * only defined for object and array types
   *
   * for arrays is the data type of each item in that array
   * for objects is a record of strings to data (matching the structure the data.object received as an argument)
   */
  TBoxedValue extends
    | IData
    | DataDefaultFn
    | Record<string, IData | DataDefaultFn>
    | undefined = any
> {
  type: string;
  parser(value: TValue): TParsedValue;
  boxedValue: TBoxedValue;
  defaultValue: Maybe<TParsedValue>;
  isOptional: boolean;
  /**
   *  Enum type data will keep a reference to its acceptable values
   *  so that later this can be used by the mock data generator to produce a random value from this array
   */
  acceptableValues?: Array<TParsedValue>
}

/**
 * Utility to extract the parsed value of an Data type
 */
export type GetDataType<TData extends IData | DataDefaultFn> = TData extends IData<
  infer TParsedValue
>
  ? TParsedValue
  : TData extends DataDefaultFn
    ? TData extends (_: any) => IData<infer TParsedValue>
      ? TParsedValue
      : never
  : never

type GetBoxedValue<
  TData extends IData<any, any, Record<string, IData>> | DataDefaultFn
> = 
  TData extends IData<any, any, infer TBoxedValue> 
    ? TBoxedValue 
    : TData extends (_: any) => IData<any,any, infer TBoxedValue>
    ? TBoxedValue
: never;

export type GetParsedValueTypeFromDefaultFn<
  TDefaultFn extends (_default: any) => IData
> = TDefaultFn extends (_default: any) => IData<infer TParsedValue, any, any>
  ? TParsedValue
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
    TProperties[key] extends IData<infer TParsedValue, any, infer TBoxedValue>
      ? TBoxedValue extends Record<string, IData | DataDefaultFn>
        ? IsMaybe<TParsedValue> extends true
          ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultProps<TBoxedValue, {}>>
          : GetAllAvailableNodeDataTypeWithoutDefaultProps<TBoxedValue, {}>
        : TParsedValue extends Array<infer TArrayItemType>
          ? IsMaybe<TParsedValue> extends true
            ? Maybe<Array<TArrayItemType>>
            : Array<TArrayItemType>
          : TParsedValue
      : TProperties[key] extends DataDefaultFn
        ? GetParsedValueTypeFromDefaultFn<TProperties[key]>
        : never;
}

export type GetResultingDataTypeFromNodeDefinition<TNode extends INode> = TNode extends INode<any, infer TProperties> ? GetResultingDataTypeFromProperties<TProperties> : never

/**
 * Utility to extract the expected data type of a node based on its' properties and computed data
 * For data resulting from property definitions only, use GetResultingDataTypeFromProperties
 */

export type GetAllAvailableNodeDataType<
  TData extends Record<string, IData | DataDefaultFn>,
  TComputedData extends Record<string, any>
> = GetResultingDataTypeFromProperties<TData & NodeDefaultProps> & TComputedData;

type GetAllAvailableNodeDataTypeWithoutDefaultProps<
  TData extends Record<string, IData | DataDefaultFn>,
  TComputedData extends Record<string, any>
> = GetResultingDataTypeFromProperties<TData> & TComputedData;


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
  TNodeData extends Record<string, IData>
> = DeepPartial<
  {
    [Key in keyof TNodeData]: TNodeData[Key] extends IData<Maybe<Array<any>>>
      ? boolean
      : TNodeData[Key] extends IData<any, any, infer TBoxedValue>
      ? TBoxedValue extends Record<string, IData>
        ? UpToDateData<TBoxedValue>
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
  TNodeData extends Record<string, IData | DataDefaultFn>,
  TNodeComputedData extends Record<string, any>
> = {
  [key in keyof TNodeComputedData]: (
    data: GetAllAvailableNodeDataType<TNodeData, TNodeComputedData>
  ) => TNodeComputedData[key];
};

export type NodeRelationalFns<
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key];
};

export interface INode<
  TNodeType extends string = any,
  TNodeData extends Record<string, IData | DataDefaultFn> = {},
  TNodeComputedData extends Record<string, any> = {},
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {},
  TNodeComputedFns = NodeComputedFns<TNodeData & NodeDefaultProps, TNodeComputedData>,
  TNodeDO = NodeDO
> {
  _isNodeDef: true;
  data: TNodeData & NodeDefaultProps;
  computed?: TNodeComputedFns;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  type: TNodeType;
  repository: INodeRepository;
  do: new (data?: Record<string, any>) => TNodeDO;
}

/**
 * These inform the library how to query for data that is related to the node type we're building.
 * So, for example, if a user has meetings under them, one of the user's relational data properties is "meetings", which will be "IChildren".
 * This teaches the library how to interpret a query that asks for the user's meetings.
 */
export type NodeRelationalQueryBuilder<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>> =
  | IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord>
  | IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>

export type NodeRelationalQuery<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>> =
  | IOneToOneQuery<TTargetNodeOrTargetNodeRecord, any>
  | IOneToManyQuery<TTargetNodeOrTargetNodeRecord, any>

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
    queryBuilderOpts: TQueryBuilderOpts
  ): IOneToOneQuery<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts>;
}
export interface IOneToOneQuery<
  TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
  TQueryBuilderOpts extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>
> {
  _relational: RELATIONAL_TYPES.oneToOne;
  _relationshipName: string;
  queryBuilderOpts: TQueryBuilderOpts
  def: TTargetNodeOrTargetNodeRecord
}

export type IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>> =
  TTargetNodeOrTargetNodeRecord extends INode
  ? {
      map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
      // @TODO add filtering and pagination here
  }
  : TTargetNodeOrTargetNodeRecord extends Record<string, INode>
    ? {
      [Tkey in keyof TTargetNodeOrTargetNodeRecord]: { map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]> }
    }
    : never
export interface IOneToManyQueryBuilder<
  TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>
> {
  <TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(
    queryBuilderOpts: TQueryBuilderOpts
  ): IOneToManyQuery<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts>;
}
export interface IOneToManyQuery<
  TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string,INode>>,
  TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>
> {
  _relational: RELATIONAL_TYPES.oneToMany;
  _relationshipName: string;
  queryBuilderOpts: TQueryBuilderOpts
  def: TTargetNodeOrTargetNodeRecord
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
  oneToMany = 'otM',
}

export interface IQueryPagination {}

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

/**
 * Returns the valid filter for a node
 * excluding properties which are arrays and records
 * and including properties which are nested in objects
 */
export type ValidFilterForNode<TNode extends INode> = DeepPartial<{
  [
    TKey in keyof ExtractNodeData<TNode> as
      ExtractNodeData<TNode>[TKey] extends IData<infer TDataParsedValueType, any, infer TBoxedValue>
        ? IsArray<TDataParsedValueType> extends true
          ? never
          : TBoxedValue extends undefined 
            ? TKey
            : TBoxedValue extends Record<string, IData | DataDefaultFn>
              ? TKey
              : never
        : ExtractNodeData<TNode>[TKey] extends DataDefaultFn
          ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeData<TNode>[TKey]>> extends true
            ? never
            : TKey
          : TKey  
  ]: TKey extends keyof GetResultingDataTypeFromNodeDefinition<TNode>
    ? GetResultingDataTypeFromNodeDefinition<TNode>[TKey]
    : never
}>

export type QueryDefinitionTarget =
  | { id: string, allowNullResult?: boolean }
  | { ids: Array<string> }
    
// The config needed by a query to get one or multiple nodes of a single type
export type QueryDefinition<
  TNode extends INode,
  TMapFn extends MapFnForNode<TNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget
> = { 
  def: TNode;
  map: TMapFn;
  filter?: ValidFilterForNode<TNode>
  target?: TQueryDefinitionTarget
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
export type QueryDefinitions<
  TNode,
  TMapFn,
  TQueryDefinitionTarget
  // adding params to QueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
  // in QueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
  // strangely, if we simply tell TS to ignore the error it works perfectly
  // see https://tractiontools.atlassian.net/browse/MM-433 for simplified examples
  // eslint-disable-next-line
  // @ts-ignore
> = Record<string, QueryDefinition<TNode, TMapFn, TQueryDefinitionTarget> | INode | null>;

export type UseSubscriptionQueryDefinitionOpts = {doNotSuspend?: boolean}

export type UseSubscriptionQueryDefinition<
  TNode extends INode,
  TMapFn extends MapFnForNode<TNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts
> = QueryDefinition<TNode, TMapFn, TQueryDefinitionTarget> & {useSubOpts?: TUseSubscriptionQueryDefinitionOpts}

export type UseSubscriptionQueryDefinitions<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts
  // adding strict params to UseSubscriptionQueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
  // in UseSubscriptionQueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
  // strangely, if we simply tell TS to ignore the error it works perfectly
  // see https://tractiontools.atlassian.net/browse/MM-433 for simplified examples
  // eslint-disable-next-line
  // @ts-ignore
> = Record<string, UseSubscriptionQueryDefinition<TNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts> | INode | null>

export type QueryDataReturn<
  // @ts-ignore
  TQueryDefinitions extends QueryDefinitions
> = {
  [Key in keyof TQueryDefinitions]: IsMaybe<TQueryDefinitions[Key]> extends true
    ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>>
    : GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>
};

export type GetResultingDataFromQueryDefinition<TQueryDefinition extends QueryDefinition<any,any,any> | INode | null> = TQueryDefinition extends {
  map: MapFn<any, any, any>;
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
          : Array<ExtractQueriedDataFromMapFn<TMapFn, TNode>>
        : never
      : never
    : never
  : TQueryDefinition extends { def: INode } // full query definition provided, but map function omitted // return the entirety of the node's data
  ? TQueryDefinition extends { def: infer TNode }
    ? TNode extends INode
      ? TQueryDefinition extends { target?: { id: string } }
        ? GetAllAvailableNodeDataType<ExtractNodeData<TNode>, ExtractNodeComputedData<TNode>>
        : Array<
          GetAllAvailableNodeDataType<ExtractNodeData<TNode>, ExtractNodeComputedData<TNode>> 
        >
      : never
    : never
  : TQueryDefinition extends INode
  ? /**
     * shorthand syntax used, only a node definition was provided
     */
    Array<
      GetAllAvailableNodeDataType<ExtractNodeData<TQueryDefinition>, ExtractNodeComputedData<TQueryDefinition>>
    >
  : never;

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
  
export type MapFnForNode<TNode extends INode> = MapFn<
  ExtractNodeData<TNode>,
  ExtractNodeComputedData<TNode>,
  ExtractNodeRelationalData<TNode>
>;

export type MapFn<
  TNodeData extends Record<string, IData | DataDefaultFn>,
  TNodeComputedData,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
> = (
  data: GetMapFnArgs<INode<any, TNodeData & NodeDefaultProps, TNodeComputedData, TNodeRelationalData>>
) => RequestedData<TNodeData, TNodeComputedData>;

export type GetMapFnArgs<
  TNode extends INode,
> = TNode extends INode<any, infer TNodeData, any, infer TNodeRelationalData>
  ? {
    [key in keyof TNodeData]: 
      TNodeData[key] extends IData<Maybe<Array<any>>>
        ? TNodeData[key]
        : TNodeData[key] extends IData<
            any,
            any,
            Record<string, IData | DataDefaultFn>
          >
        // allows querying a partial of an object within a node
        ? <TMapFn extends MapFn<GetBoxedValue<TNodeData[key]>, {}, {}>>(opts: {
            map: TMapFn;
          }) => TMapFn
        : TNodeData[key];
    } &
      TNodeRelationalData
  : never;

// The accepted type for a map fn return
// validates that the engineer is querying data that exists on the nodes
// which gives us typo prevention :)
type RequestedData<
  TNodeData extends Record<string, IData | DataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  // TS-TYPE-TEST-1 making this a partial seems to cause TS to not throw errors when a random property is put into a map fn return with a bogus value
  // this will likely lead to developers misusing the query function (such as forgetting to define a map function for a relational query)
> = Partial<{
      [Key in
        keyof TNodeData
        | keyof TNodeComputedData
       ]: Key extends keyof TNodeData
        ? TNodeData[Key] extends IData<Maybe<Array<any>>>
          ? TNodeData[Key]
          : TNodeData[Key] extends IData<Maybe<Record<string, any>>> // Allows querying partials of nested objects
          ? MapFn<GetDataType<TNodeData[Key]>, {}, {}> // {} because there should be no computed data or relational data for objects nested in nodes
          : TNodeData[Key]
        : Key extends keyof TNodeComputedData   
        ? TNodeComputedData[Key] 
        : never;
  } | {}>


// A generic to extract the resulting data based on a map fn
export type ExtractQueriedDataFromMapFn<
  TMapFn extends MapFnForNode<TNode>,
  TNode extends INode
> = { type: TNode['type'] }
  & ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TNode>
  & ExtractNodeComputedData<TNode>;

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
    TMapFnReturn[Key] extends IOneToOneQuery<any,any>
    ? ExtractQueriedDataFromByOneToOneQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends IOneToManyQuery<any,any>
    ? ExtractQueriedDataFromOneToManyQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends MapFnForNode<TNode>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode>  
    :
    // when we're querying data on the node we used as the "def"
    TMapFnReturn[Key] extends IData | DataDefaultFn
    ? GetDataType<TMapFnReturn[Key]>
    :
    // when we passed through an object property without specifying a mapFn
    TMapFnReturn[Key] extends (opts: {map: MapFn<infer TBoxedValue,any,any>}) => MapFn<any, any, any>
    ? GetResultingDataTypeFromProperties<TBoxedValue>
    :
    // when we're querying data inside a nested object
    TMapFnReturn[Key] extends MapFn<any, any, any>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode>
    :
    never;
};

// Without this,ExtractQueriedDataFromByOneToOneQuery and ExtractResultsUnionFromOneToOneQueryBuilder somehow cause a loop
// even though ExtractQueriedDataFromByOneToOneQuery does not call ExtractResultsUnionFromOneToOneQueryBuilder unless it's dealing with a record of node definitions (union representation)
// borrowed this solution from this article
// https://www.angularfix.com/2022/01/why-am-i-getting-instantiation-is.html
// relavant github discussions:
// https://github.com/microsoft/TypeScript/issues/34933
// https://github.com/microsoft/TypeScript/pull/44997
// https://github.com/microsoft/TypeScript/pull/45025
type Prev = [never, 0, 1];

type ExtractQueriedDataFromByOneToOneQuery<
  TOneToOneQuery extends IOneToOneQuery<any, any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TOneToOneQuery extends IOneToOneQuery<infer TTargetNodeOrTargetNodeRecord, infer TQueryBuilderOpts>
    ? IsMaybe<TTargetNodeOrTargetNodeRecord> extends true
      ? TTargetNodeOrTargetNodeRecord extends INode
        ? TQueryBuilderOpts extends { map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> }
          ? Maybe<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], NonNullable<TTargetNodeOrTargetNodeRecord>>>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, INode>
          ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? Maybe<ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>
            : never
          : never
      : TTargetNodeOrTargetNodeRecord extends INode
        ? TQueryBuilderOpts extends { map: MapFnForNode<TTargetNodeOrTargetNodeRecord> }
          ? ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], TTargetNodeOrTargetNodeRecord>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, INode>
        ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>
            : never
          : never
    : never

type ExtractQueriedDataFromOneToManyQuery<
  TOneToManyQuery extends IOneToManyQuery<any, any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TOneToManyQuery extends IOneToManyQuery<infer TTargetNodeOrTargetNodeRecord, infer TQueryBuilderOpts>
    ? IsMaybe<TTargetNodeOrTargetNodeRecord> extends true
      ? TTargetNodeOrTargetNodeRecord extends INode
        ? TQueryBuilderOpts extends { map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> }
          ? Maybe<Array<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], NonNullable<TTargetNodeOrTargetNodeRecord>>>>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, INode>
          ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? Maybe<Array<ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>>
            : never
          : never
      : TTargetNodeOrTargetNodeRecord extends INode
        ? TQueryBuilderOpts extends { map: MapFnForNode<TTargetNodeOrTargetNodeRecord> }
          ? Array<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], TTargetNodeOrTargetNodeRecord>>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, INode>
        ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? Array<ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>
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
            ExtractQueriedDataFromByOneToOneQuery<
              IOneToOneQuery<
                TTargetNodeOrTargetNodeRecord[key],
                // says this doesn't satisfy the constraint of IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]>
                // but it does, and it works anyway
                // @ts-ignore
                { map: TQueryBuilderOpts[key]['map'] }
               >,
               D
            >
          : never
        : never
}>

type ExtractObjectValues<TObject extends Record<string,any>> = TObject extends Record<string, infer TValueType> ? TValueType : never

export type ExtractNodeData<TNode extends INode> = TNode extends INode<
  any,
  infer TNodeData
>
  ? TNodeData
  : never;

type ExtractNodeComputedData<TNode extends INode> = TNode extends INode<
  any,
  any,
  infer TNodeComputedData
>
  ? TNodeComputedData
  : never;

type ExtractNodeRelationalData<
  TNode extends INode
> = TNode extends INode<any, any, any, infer TNodeRelationalData>
  ? TNodeRelationalData
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
  relational?: Record<string, RelationalQueryRecordEntry>;
};

export type QueryRecordEntry = BaseQueryRecordEntry & {
  ids?: Array<string> 
  id?: string
  allowNullResult?: boolean
}

export type RelationalQueryRecordEntry =  { _relationshipName: string } & (
  | (BaseQueryRecordEntry & { oneToOne: true })
  | (BaseQueryRecordEntry & { oneToMany: true })
)

export type QueryRecord = Record<string, QueryRecordEntry>;

export type RelationalQueryRecord = Record<string, RelationalQueryRecordEntry>

export interface IDOProxy {
  updateRelationalResults(
    newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>
  ): void;
}
