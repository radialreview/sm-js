import { DEFAULT_NODE_PROPERTIES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { generateQuerier, generateSubscriber } from './smQueriers';
import { createSMQueryManager } from './SMQueryManager';
import { createTransaction } from './transaction/transaction';

export type BOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

export type Maybe<T> = T | null;

export type IsMaybe<Type> = null extends Type ? true : false

export type SMDataDefaultFn = (_default: any) => ISMData;

export type DocumentNode = import('@apollo/client/core').DocumentNode;

export type SMPlugin = {
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

export type SMConfig = {
  gqlClient: ISMGQLClient;
  plugins?: Array<SMPlugin>;
};

export interface ISMGQLClient {
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

export interface ISMQueryManager {
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
  // This is by design, for consistency with the interface of sm.subscribe
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
  // This means you can use the try/catch syntax try { await sm.subscription } catch (e) {}
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


export type SMNodeDefaultProps = typeof DEFAULT_NODE_PROPERTIES;

export type SubscriptionCanceller = () => void;
export type SubscriptionMeta = { unsub: SubscriptionCanceller; error: any };
export interface ISMJS {
  getToken(opts: { tokenName: string }): string;
  setToken(opts: { tokenName: string; token: string }): void;
  clearTokens(): void
  query: ReturnType<typeof generateQuerier>
  subscribe: ReturnType<typeof generateSubscriber>
  transaction: ReturnType<typeof createTransaction>
  gqlClient: ISMGQLClient;
  plugins: Array<SMPlugin> | undefined;
  DOProxyGenerator: ReturnType<typeof createDOProxyGenerator>
  DOFactory: ReturnType<typeof createDOFactory>
  SMQueryManager:ReturnType<typeof createSMQueryManager>

  def<
    TNodeType extends string,
    TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
    TNodeComputedData extends Record<string, any>,
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
    TNodeMutations extends Record<
      string,
      /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn
    >
  >(
    def: NodeDefArgs<
      TNodeType,
      TNodeData,
      TNodeComputedData,
      TNodeRelationalData,
      TNodeMutations
    >
  ): ISMNode<TNodeType, TNodeData & SMNodeDefaultProps, TNodeComputedData, TNodeRelationalData, TNodeMutations>;
}

export type NodeDefArgs<
  TNodeType extends string,
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, /*NodeMutationFn<TNodeData, any>*/NodeMutationFn>
> = {
  type: TNodeType;
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData & SMNodeDefaultProps, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
};

/**
 * The interface implemented by each smData type (like smData.string, smData.boolean)
 */
export interface ISMData<
  TParsedValue = any,
  TSMValue = any,
  /**
   * only defined for object and array types
   *
   * for arrays is the smData type of each item in that array
   * for objects is a record of strings to smData (matching the structure the smData.object received as an argument)
   */
  TBoxedValue extends
    | ISMData
    | SMDataDefaultFn
    | Record<string, ISMData | SMDataDefaultFn>
    | undefined = any
> {
  type: string;
  parser(smValue: TSMValue): TParsedValue;
  boxedValue: TBoxedValue;
  defaultValue: Maybe<TParsedValue>;
  isOptional: boolean;
}

export type SMDataEnum<Enum extends string | number | null> = ISMData<
  Enum,
  Enum,
  undefined
>;

/**
 * Utility to extract the parsed value of an SMData type
 */
export type GetSMDataType<TSMData extends ISMData | SMDataDefaultFn> = TSMData extends ISMData<
  infer TParsedValue
>
  ? TParsedValue
  : TSMData extends SMDataDefaultFn
    ? TSMData extends (_: any) => ISMData<infer TParsedValue>
      ? TParsedValue
      : never
  : never

type GetSMBoxedValue<
  TSMData extends ISMData<any, any, Record<string, ISMData>> | SMDataDefaultFn
> = 
  TSMData extends ISMData<any, any, infer TBoxedValue> 
    ? TBoxedValue 
    : TSMData extends (_: any) => ISMData<any,any, infer TBoxedValue>
    ? TBoxedValue
: never;

export type GetParsedValueTypeFromDefaultFn<
  TDefaultFn extends (_default: any) => ISMData
> = TDefaultFn extends (_default: any) => ISMData<infer TParsedValue, any, any>
  ? TParsedValue
  : never;

  /**
   * Utility to extract the resulting data type from the properties definition of a node
   * for example
   * 
   * {
   *   flag: boolean(false), // boolean and string types from sm-js
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
export type GetResultingDataTypeFromProperties<TProperties extends Record<string, ISMData | SMDataDefaultFn>> =  {
  [key in keyof TProperties]:
    TProperties[key] extends ISMData<infer TParsedValue, any, infer TBoxedValue>
      ? TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>
        ? IsMaybe<TParsedValue> extends true
          ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultProps<TBoxedValue, {}>>
          : GetAllAvailableNodeDataTypeWithoutDefaultProps<TBoxedValue, {}>
        : TParsedValue extends Array<infer TArrayItemType>
          ? IsMaybe<TParsedValue> extends true
            ? Maybe<Array<TArrayItemType>>
            : Array<TArrayItemType>
          : TParsedValue
      : TProperties[key] extends SMDataDefaultFn
        ? GetParsedValueTypeFromDefaultFn<TProperties[key]>
        : never;
}

export type GetResultingDataTypeFromNodeDefinition<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, infer TProperties> ? GetResultingDataTypeFromProperties<TProperties> : never


/**
 * Utility to extract the expected data type of a node based on its' properties and computed data
 * For data resulting from property definitions only, use GetResultingDataTypeFromProperties
 */

export type GetAllAvailableNodeDataType<
  TSMData extends Record<string, ISMData | SMDataDefaultFn>,
  TComputedData extends Record<string, any>
> = GetResultingDataTypeFromProperties<TSMData & SMNodeDefaultProps> & TComputedData;

type GetAllAvailableNodeDataTypeWithoutDefaultProps<
  TSMData extends Record<string, ISMData | SMDataDefaultFn>,
  TComputedData extends Record<string, any>
> = GetResultingDataTypeFromProperties<TSMData> & TComputedData;


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

type IsObject<TObject extends Record<string,any>, Y = true, N = false> =
  IsArray<TObject> extends true
    ? false
    : TObject extends Record<string, any>
      ? Y
      : N

/**
 * Note: this is used solely for obtaining the keys in an object converted to the dot notation
 * it was not possible to have the correct value types be mapped over, which is why all values are "never"
 */
type GetIdReferencePropsInDotNotation<TObject extends Record<string, any>, TPrefix extends string = ''> = 
  // object properties
  {
    [TKey in keyof TObject
      // skip values that aren't objects, those get handled below so this is easier to read
      as IsObject<TObject[TKey]> extends true
        // TS forces us to do this check, otherwise it thinks key may be a symbol
        ? TKey extends string
          // don't want to prefix the property at all if a prefix was not provided (we're at the top level and haven't called this type recursively)
          ? TPrefix extends ''
            ? keyof GetIdReferencePropsInDotNotation<TObject[TKey], TKey>
            // otherwise TPrefix every property with the prefix
            : keyof GetIdReferencePropsInDotNotation<TObject[TKey], `${TPrefix}.${TKey}`>
          : never
        : never
    ]: never
  }
  &
  // primitive properties
  {
    [TKey in keyof TObject
    // objects get their keys mapped above
      as IsObject<TObject[TKey]> extends true
        ? never
        // arrays are not searchable
        : IsArray<TObject[TKey]> extends true
          ? never
          : TPrefix extends ''
            ? TKey
            : TKey extends string
              ? `${TPrefix}.${TKey}`
              : never
    ]: never
  }

/**
 * Note: this is used solely for obtaining the keys in an object converted to the dot notation
 * it was not possible to have the correct value types be mapped over, which is why all values are "never"
 */
 type GetIdReferenceArrayPropsInDotNotation<TObject extends Record<string, any>, TPrefix extends string = ''> = 
 // object properties
 {
   [TKey in keyof TObject
     // skip values that aren't objects, those get handled below so this is easier to read
     as IsObject<TObject[TKey]> extends true
       // TS forces us to do this check, otherwise it thinks key may be a symbol
       ? TKey extends string
         // don't want to prefix the property at all if a prefix was not provided (we're at the top level and haven't called this type recursively)
         ? TPrefix extends ''
           ? keyof GetIdReferenceArrayPropsInDotNotation<TObject[TKey], TKey>
           // otherwise TPrefix every property with the prefix
           : keyof GetIdReferenceArrayPropsInDotNotation<TObject[TKey], `${TPrefix}.${TKey}`>
         : never
       : never
   ]: never
 }
 &
 // primitive properties
 {
   [TKey in keyof TObject
   // objects get their keys mapped above
     as IsObject<TObject[TKey]> extends true
       ? never
       // arrays are the only searchable props for reference arrays
       : IsArray<TObject[TKey]> extends true
         ? TObject[TKey] extends Array<string>
           ? TPrefix extends ''
             ? TKey
             : TKey extends string
               ? `${TPrefix}.${TKey}`
               : never
            : never
         : never
   ]: never
 }


type ValidReferenceIdProp<TObject extends Record<string,any>> = keyof GetIdReferencePropsInDotNotation<TObject>

type ValidReferenceIdArrayProp<TObject extends Record<string,any>> = keyof GetIdReferenceArrayPropsInDotNotation<TObject>

/**
 * Returns a union of all valid idReference props from a node's data type
 * excluding properties which are arrays
 * and converting nested properties to dot notation
 * 
 * For example, if a node's data is
 * {
 *  string: string
 *  object: {
 *    nestedString: string
 *    nestedObject: {
 *      nestedNestedBoolean: boolean
 *    }
 *  }
 *  arr: []
 * }
 * 
 * The resulting valid id references would be 'string' | 'object.nestedString' | 'object.nestedObject.nestedNestedBoolean'
 */
export type ValidReferenceIdPropFromNode<TSMNode extends ISMNode> = ValidReferenceIdProp<GetResultingDataTypeFromNodeDefinition<TSMNode>>

/**
 * Returs a union of all valid id reference ARRAY props from a node's data type
 * meaning, only properties which are arrays of strings
 */
export type ValidReferenceIdArrayPropFromNode<TSMNode extends ISMNode> = ValidReferenceIdArrayProp<GetResultingDataTypeFromNodeDefinition<TSMNode>>

/**
 * A record that lives on each instance of a DOProxy to determine
 * if each data property on that DO is currently guaranteed to be up to date.
 * Any property that is read while not being up to date throws a run-time error to ensure the devs never use outdated data mistakenly
 */
export type UpToDateData<
  TNodeData extends Record<string, ISMData>
> = DeepPartial<
  {
    [Key in keyof TNodeData]: TNodeData[Key] extends ISMData<Maybe<Array<any>>>
      ? boolean
      : TNodeData[Key] extends ISMData<any, any, infer TBoxedValue>
      ? TBoxedValue extends Record<string, ISMData>
        ? UpToDateData<TBoxedValue>
        : boolean
      : boolean;
  }
>;

/**
 * These methods are called automatically when using this lib's public methods like "useSMData"
 */
export interface IDOMethods {
  /**
   * Called when we get data from SM for this particular DO instance, found by its id
   */
  onDataReceived(data: Record<string, any>, opts?: {__unsafeIgnoreVersion?: boolean}): void;
}

export interface IDOAccessors {
  id: string
  version: number
  lastUpdatedBy: string
  persistedData: Record<string,any>
}

export type NodeDO = Record<string, any> & SMNodeDefaultProps & IDOMethods & IDOAccessors;

export type NodeComputedFns<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
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

export type NodeMutationFn<
  // TNodeData,
  // TAdditionalOpts extends Record<string, any>
> = (
  // opts: SMNodeMutationOpts<TNodeData> & TAdditionalOpts
  ) => Promise<any>;

export interface ISMNode<
  TNodeType extends string = any,
  TNodeData extends Record<string, ISMData | SMDataDefaultFn> = {},
  TNodeComputedData extends Record<string, any> = {},
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {},
  TNodeMutations extends Record<string, /*NodeMutationFn<TNodeData, any>*/NodeMutationFn> = {},
  TNodeComputedFns = NodeComputedFns<TNodeData & SMNodeDefaultProps, TNodeComputedData>,
  TNodeDO = NodeDO
> {
  _isSMNodeDef: true;
  smData: TNodeData & SMNodeDefaultProps;
  smComputed?: TNodeComputedFns;
  smRelational?: NodeRelationalFns<TNodeRelationalData>;
  smMutations?: TNodeMutations;
  type: TNodeType;
  repository: ISMNodeRepository;
  do: new (data?: Record<string, any>) => TNodeDO;
}

/**
 * These inform the library how to query for data that is related to the node type we're building.
 * So, for example, if a user has meetings under them, one of the user's relational data properties is "meetings", which will be "IChildren".
 * This teaches the library how to interpret a query that asks for the user's meetings.
 */
export type NodeRelationalQueryBuilder<TOriginNode extends ISMNode> =
  | IByReferenceQueryBuilder<TOriginNode, ISMNode>
  | IByReferenceArrayQueryBuilder<TOriginNode, ISMNode>
  | IChildrenQueryBuilder<TOriginNode>;

export type NodeRelationalQuery<TOriginNode extends ISMNode> =
  | IChildrenQuery<TOriginNode, any>
  | IByReferenceQuery<TOriginNode, any, any>
  | IByReferenceArrayQuery<TOriginNode, any, any>


export type ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends ISMNode | Maybe<ISMNode> | Record<string, ISMNode> | Maybe<Record<string,ISMNode>>> =
  TTargetNodeOrTargetNodeRecord extends ISMNode
  ? {
      map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
  }
  : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>
    ? {
      [Tkey in keyof TTargetNodeOrTargetNodeRecord]: { map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]> }
    }
    : never
export interface IByReferenceQueryBuilder<
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends ISMNode | Maybe<ISMNode> | Record<string, ISMNode> | Maybe<Record<string,ISMNode>>
> {
  <TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(
    queryBuilderOpts: TQueryBuilderOpts
  ): IByReferenceQuery<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts>;
}

export type ByReferenceArrayQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends ISMNode | Record<string, ISMNode>> =
  TTargetNodeOrTargetNodeRecord extends ISMNode
  ? {
      map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
  }
  : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>
    ? {
      [Tkey in keyof TTargetNodeOrTargetNodeRecord]: { map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]> }
    }
    : never
export interface IByReferenceArrayQueryBuilder<
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends ISMNode | Record<string, ISMNode>
> {
  <TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(
    queryBuilderOpts: TQueryBuilderOpts
  ): IByReferenceArrayQuery<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts>;
}

export enum SM_DATA_TYPES {
  string = 's',
  maybeString = 'mS',
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

export enum SM_RELATIONAL_TYPES {
  byReference = 'bR',
  byReferenceArray = 'bRA',
  children = 'bP'
}
export interface IByReferenceQuery<
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends ISMNode | Maybe<ISMNode> | Record<string, ISMNode> | Maybe<Record<string,ISMNode>>,
  TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>
> {
  _smRelational: SM_RELATIONAL_TYPES.byReference;
  idProp: ValidReferenceIdPropFromNode<TOriginNode>;
  queryBuilderOpts: TQueryBuilderOpts
  def: TTargetNodeOrTargetNodeRecord
}

export interface IByReferenceArrayQuery<
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends ISMNode | Record<string, ISMNode>,
  TQueryBuilderOpts extends ByReferenceArrayQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>
> {
  _smRelational: SM_RELATIONAL_TYPES.byReferenceArray;
  idProp: ValidReferenceIdArrayPropFromNode<TOriginNode>;
  queryBuilderOpts: TQueryBuilderOpts
  def: TTargetNodeOrTargetNodeRecord
}

export interface IChildrenQueryBuilder<TSMNode extends ISMNode> {
  <TMapFn extends MapFnForNode<TSMNode>>(opts: {
    map: TMapFn;
    pagination?: ISMQueryPagination;
  }): IChildrenQuery<TSMNode, TMapFn>;
}

export interface IChildrenQuery<
  TSMNode extends ISMNode,
  TMapFn extends MapFnForNode<TSMNode>
> {
  _smRelational: SM_RELATIONAL_TYPES.children;
  def: TSMNode;
  filtersAndPagination?: ISMQueryPagination;
  map: TMapFn;
  pagination?: ISMQueryPagination;
  depth?: number;
}

export interface ISMQueryPagination {}

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

export interface ISMNodeRepository {
  byId(id: string): NodeDO;
  onDataReceived(data: { id: string } & Record<string, any>): void;
  onNodeDeleted(id: string): void;
}

/**
 * Returns the valid filter for a node
 * excluding properties which are arrays and records
 * and including properties which are nested in objects
 */
export type ValidFilterForNode<TSMNode extends ISMNode> = DeepPartial<{
  [
    TKey in keyof ExtractNodeData<TSMNode> as
      ExtractNodeData<TSMNode>[TKey] extends ISMData<infer TSMDataParsedValueType, any, infer TBoxedValue>
        ? IsArray<TSMDataParsedValueType> extends true
          ? never
          : TBoxedValue extends undefined 
            ? TKey
            : TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>
              ? TKey
              : never
        : ExtractNodeData<TSMNode>[TKey] extends SMDataDefaultFn
          ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeData<TSMNode>[TKey]>> extends true
            ? never
            : TKey
          : TKey  
  ]: TKey extends keyof GetResultingDataTypeFromNodeDefinition<TSMNode>
    ? GetResultingDataTypeFromNodeDefinition<TSMNode>[TKey]
    : never
}>

export type QueryDefinitionTarget =
  | { underIds: Array<string>, depth?: number }
  | { depth: number }
  | { id: string, allowNullResult?: boolean }
  | { ids: Array<string> }
    
// The config needed by a query to get one or multiple nodes of a single type
export type QueryDefinition<
  TSMNode extends ISMNode,
  TMapFn extends MapFnForNode<TSMNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget
> = { 
  def: TSMNode;
  map: TMapFn;
  filter?: ValidFilterForNode<TSMNode>
  target?: TQueryDefinitionTarget
  tokenName?: string
};

// A query takes a record where you can specify aliases for each node type you're querying (including 2 aliases for different sets of the same node type)
//
// example:
//  usersTodos: sm.queryDefinition({
//    def: todo,
//    under: [authenticatedUser.id],
//    map: ({ id }) => ({ id })
//  }),
//  meetingTodos: sm.queryDefinition({
//    def: todo,
//    under: [meeting.id],
//    map: ({ id } => ({ id })
//  })
//
export type QueryDefinitions<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget
  // adding params to QueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
  // in QueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
  // strangely, if we simply tell TS to ignore the error it works perfectly
  // see https://tractiontools.atlassian.net/browse/MM-433 for simplified examples
  // eslint-disable-next-line
  // @ts-ignore
> = Record<string, QueryDefinition<TSMNode, TMapFn, TQueryDefinitionTarget> | ISMNode | null>;

export type UseSubscriptionQueryDefinitionOpts = {doNotSuspend?: boolean}

export type UseSubscriptionQueryDefinition<
  TSMNode extends ISMNode,
  TMapFn extends MapFnForNode<TSMNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts
> = QueryDefinition<TSMNode, TMapFn, TQueryDefinitionTarget> & {useSubOpts?: TUseSubscriptionQueryDefinitionOpts}

export type UseSubscriptionQueryDefinitions<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts
  // adding strict params to UseSubscriptionQueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
  // in UseSubscriptionQueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
  // strangely, if we simply tell TS to ignore the error it works perfectly
  // see https://tractiontools.atlassian.net/browse/MM-433 for simplified examples
  // eslint-disable-next-line
  // @ts-ignore
> = Record<string, UseSubscriptionQueryDefinition<TSMNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts> | ISMNode | null>

export type QueryDataReturn<
  // @ts-ignore
  TQueryDefinitions extends QueryDefinitions
> = {
  [Key in keyof TQueryDefinitions]: IsMaybe<TQueryDefinitions[Key]> extends true
    ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>>
    : GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>
};

export type GetResultingDataFromQueryDefinition<TQueryDefinition extends QueryDefinition<any,any,any> | ISMNode | null> = TQueryDefinition extends {
  map: MapFn<any, any, any>;
}
  ? /**
     * full query definition provided, with a map fn
     */
    TQueryDefinition extends { def: infer TSMNode; map: infer TMapFn }
    ? TSMNode extends ISMNode
      ? TMapFn extends MapFnForNode<TSMNode>
        ? TQueryDefinition extends { target?: { id: string } }
          ? TQueryDefinition extends { target?: { allowNullResult: true } }
            ? Maybe<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>>
            : ExtractQueriedDataFromMapFn<TMapFn, TSMNode>
          : Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>>
        : never
      : never
    : never
  : TQueryDefinition extends { def: ISMNode } // full query definition provided, but map function omitted // return the entirety of the node's data
  ? TQueryDefinition extends { def: infer TSMNode }
    ? TSMNode extends ISMNode
      ? TQueryDefinition extends { target?: { id: string } }
        ? GetAllAvailableNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>>
        : Array<
          GetAllAvailableNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>> 
        >
      : never
    : never
  : TQueryDefinition extends ISMNode
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
  
export type MapFnForNode<TSMNode extends ISMNode> = MapFn<
  ExtractNodeData<TSMNode>,
  ExtractNodeComputedData<TSMNode>,
  ExtractNodeRelationalData<TSMNode>
>;

export type MapFn<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
> = (
  data: GetMapFnArgs<ISMNode<any, TNodeData & SMNodeDefaultProps, TNodeComputedData, TNodeRelationalData>>
) => RequestedData<TNodeData, TNodeComputedData>;

export type GetMapFnArgs<
  TSMNode extends ISMNode,
> = TSMNode extends ISMNode<any, infer TNodeData, any, infer TNodeRelationalData>
  ? {
    [key in keyof TNodeData]: 
      TNodeData[key] extends ISMData<Maybe<Array<any>>>
        ? TNodeData[key]
        : TNodeData[key] extends ISMData<
            any,
            any,
            Record<string, ISMData | SMDataDefaultFn>
          >
        // allows querying a partial of an object within a node
        ? <TMapFn extends MapFn<GetSMBoxedValue<TNodeData[key]>, {}, {}>>(opts: {
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
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  // TS-TYPE-TEST-1 making this a partial seems to cause TS to not throw errors when a random property is put into a map fn return with a bogus value
  // this will likely lead to developers misusing the query function (such as forgetting to define a map function for a relational query)
> = Partial<{
      [Key in
        keyof TNodeData
        | keyof TNodeComputedData
       ]: Key extends keyof TNodeData
        ? TNodeData[Key] extends ISMData<Maybe<Array<any>>>
          ? TNodeData[Key]
          : TNodeData[Key] extends ISMData<Maybe<Record<string, any>>> // Allows querying partials of nested objects
          ? MapFn<GetSMDataType<TNodeData[Key]>, {}, {}> // {} because there should be no computed data or relational data for objects nested in nodes
          : TNodeData[Key]
        : Key extends keyof TNodeComputedData   
        ? TNodeComputedData[Key] 
        : never;
  } | {}>


// A generic to extract the resulting data based on a map fn
export type ExtractQueriedDataFromMapFn<
  TMapFn extends MapFnForNode<TSMNode>,
  TSMNode extends ISMNode
> = { type: TSMNode['type'] }
  & ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TSMNode>
  & ExtractNodeComputedData<TSMNode>;

// From the return of a map fn, get the type of data that will be returned by that portion of the query, aka the expected response from the API
type ExtractQueriedDataFromMapFnReturn<
  TMapFnReturn,
  TSMNode extends ISMNode
> = {
  [Key in keyof TMapFnReturn]:
    // when we passed through a relational property without specifying a mapFn
    TMapFnReturn[Key] extends NodeRelationalQueryBuilder<any>
    ? never
    :
    TMapFnReturn[Key] extends IByReferenceQuery<any,any,any>
    ? ExtractQueriedDataFromByReferenceQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends IByReferenceArrayQuery<any,any,any>
    ? ExtractQueriedDataFromByReferenceArrayQuery<TMapFnReturn[Key]>
    :
    TMapFnReturn[Key] extends IChildrenQuery<any, any>
    ? ExtractQueriedDataFromChildrenQuery<TMapFnReturn[Key]>  
    :
    TMapFnReturn[Key] extends MapFnForNode<TSMNode>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode>  
    :
    // when we're querying data on the node we used as the "def"
    TMapFnReturn[Key] extends ISMData | SMDataDefaultFn
    ? GetSMDataType<TMapFnReturn[Key]>
    :
    // when we passed through an object property without specifying a mapFn
    TMapFnReturn[Key] extends (opts: {map: MapFn<infer TBoxedValue,any,any>}) => MapFn<any, any, any>
    ? GetResultingDataTypeFromProperties<TBoxedValue>
    :
    // when we're querying data inside a nested object
    TMapFnReturn[Key] extends MapFn<any, any, any>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode>
    :
    never;
};

type ExtractQueriedDataFromChildrenQuery<
  TChildrenQuery extends IChildrenQuery<any, any>
> = TChildrenQuery extends IChildrenQuery<infer TSMNode, infer TMapFn>
  ? Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>>
  : never;

// Without this,ExtractQueriedDataFromByReferenceQuery and ExtractResultsUnionFromReferenceBuilder somehow cause a loop
// even though ExtractQueriedDataFromByReferenceQuery does not call ExtractResultsUnionFromReferenceBuilder unless it's dealing with a record of node definitions (union representation)
// borrowed this solution from this article
// https://www.angularfix.com/2022/01/why-am-i-getting-instantiation-is.html
// relavant github discussions:
// https://github.com/microsoft/TypeScript/issues/34933
// https://github.com/microsoft/TypeScript/pull/44997
// https://github.com/microsoft/TypeScript/pull/45025
type Prev = [never, 0, 1];

type ExtractQueriedDataFromByReferenceQuery<
  TByReferenceQuery extends IByReferenceQuery<any, any, any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TByReferenceQuery extends IByReferenceQuery<infer TOriginNode, infer TTargetNodeOrTargetNodeRecord, infer TQueryBuilderOpts>
    ? IsMaybe<TTargetNodeOrTargetNodeRecord> extends true
      ? TTargetNodeOrTargetNodeRecord extends ISMNode
        ? TQueryBuilderOpts extends { map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> }
          ? Maybe<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], NonNullable<TTargetNodeOrTargetNodeRecord>>>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>
          ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? Maybe<ExtractResultsUnionFromReferenceBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>
            : never
          : never
      : TTargetNodeOrTargetNodeRecord extends ISMNode
        ? TQueryBuilderOpts extends { map: MapFnForNode<TTargetNodeOrTargetNodeRecord> }
          ? ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], TTargetNodeOrTargetNodeRecord>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>
        ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? ExtractResultsUnionFromReferenceBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>
            : never
          : never
    : never

type ExtractQueriedDataFromByReferenceArrayQuery<
  TByReferenceArrayQuery extends IByReferenceArrayQuery<any, any, any>,
  D extends Prev[number] = 1
> = 
  [D] extends [never] ? never :
  TByReferenceArrayQuery extends IByReferenceArrayQuery<infer TOriginNode, infer TTargetNodeOrTargetNodeRecord, infer TQueryBuilderOpts>
    ? IsMaybe<TTargetNodeOrTargetNodeRecord> extends true
      ? TTargetNodeOrTargetNodeRecord extends ISMNode
        ? TQueryBuilderOpts extends { map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>> }
          ? Maybe<Array<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], NonNullable<TTargetNodeOrTargetNodeRecord>>>>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>
          ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? Maybe<Array<ExtractResultsUnionFromReferenceBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>>
            : never
          : never
      : TTargetNodeOrTargetNodeRecord extends ISMNode
        ? TQueryBuilderOpts extends { map: MapFnForNode<TTargetNodeOrTargetNodeRecord> }
          ? Array<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], TTargetNodeOrTargetNodeRecord>>
          : never
        : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>
        ? TQueryBuilderOpts extends { [key in keyof TTargetNodeOrTargetNodeRecord]: {map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>} }
            ? Array<ExtractResultsUnionFromReferenceBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>
            : never
          : never
    : never

type ExtractResultsUnionFromReferenceBuilder<
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>,
  TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>,
  D extends Prev[number]
> = ExtractObjectValues<{
  [key in keyof TQueryBuilderOpts]:
      key extends keyof TTargetNodeOrTargetNodeRecord 
        ? TQueryBuilderOpts[key] extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]>
          ?
            ExtractQueriedDataFromByReferenceQuery<
              IByReferenceQuery<
                TOriginNode,
                TTargetNodeOrTargetNodeRecord[key],
                // says this doesn't satisfy the constraint of ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]>
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

export type ExtractNodeData<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  any,
  infer TNodeData
>
  ? TNodeData
  : never;

type ExtractNodeComputedData<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  any,
  any,
  infer TNodeComputedData
>
  ? TNodeComputedData
  : never;

type ExtractNodeRelationalData<
  TSMNode extends ISMNode
> = TSMNode extends ISMNode<any, any, any, infer TNodeRelationalData>
  ? TNodeRelationalData
  : never;

// type ExtractNodeMutations<TSMNode extends ISMNode> = TSMNode extends ISMNode<
//   any,
//   any,
//   any,
//   infer TNodeMutations
// >
//   ? TNodeMutations
//   : never;

/**
 * a record of all the queries identified in this query definitions
 * looks something like this
 *
 * {
 *   // alias
 *   usersTodos: {
 *     // the SMNode we're querying
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
 *         // the SM node for the relational data we're querying
 *         def: user,
 *         properties: ['firstName', 'lastName'],
 *
 *         // if the todo node defines the assignee as being a "child" of a todo (meaning there would have to be a V edge from todo to user).
 *         // This would also return an array of users, instead of a single user in that case.
 *         children: true,
 *         // OR if the todo node defines the assignee as being stored with a foreign key (in todo.assigneeId)
 *         byReference: true, idProp: 'assigneeId',
 *       }
 *     }
 *   })
 * }
 */
export type BaseQueryRecordEntry = {
  def: ISMNode;
  properties: Array<string>;
  relational?: Record<string, RelationalQueryRecordEntry>;
};

export type QueryRecordEntry = BaseQueryRecordEntry & {
  underIds?: Array<string>
  depth?: number
  ids?: Array<string> 
  id?: string
  allowNullResult?: boolean
}

export type RelationalQueryRecordEntry =
  | (BaseQueryRecordEntry & { children: true; depth?: number }) // will use GetChildren to query this data
  | (BaseQueryRecordEntry & { byReference: true; idProp: string }) // will use GetReference to query this data
  | (BaseQueryRecordEntry & { byReferenceArray: true; idProp: string }); // will use GetReference to query this data

export type QueryRecord = Record<string, QueryRecordEntry>;

// export type SMNodeRequestUpdate<TNodeData> = (opts: {
//   payload: DeepPartial<TNodeData>;
//   // updateNode: (opts: IUpdateNodeOpts<TNodeData>) => void;
// }) => Promise<void>;

// type SMNodeMutationOpts<TNodeData> = {
//   // nodeData: TNodeData;
//   // createNode(): void;
//   // createEdge(opts: ICreateEdgeOpts): void;
//   // deleteNode(opts: IDeleteNodeOpts): void;
//   // deleteEdge(opts: IDeleteEdgeOpts): void;
//   // updateNode(opts: IUpdateNodeOpts<TNodeData>): void;
//   // requestUpdate: SMNodeRequestUpdate<TNodeData>;
// };

export interface IDOProxy {
  updateRelationalResults(
    newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>
  ): void;
}
