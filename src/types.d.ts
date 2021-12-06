declare type Maybe<T> = T | null;

declare type SMDataDefaultFn = (_default: any) => ISMData;
/**
 * The interface implemented by each smData type (like smData.string, smData.boolean)
 */
declare interface ISMData<
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
    | Record<string, ISMData | SMDataDefaultFn>
    | undefined = any
> {
  type: string;
  parser(smValue: TSMValue): TParsedValue;
  boxedValue: TBoxedValue;
  defaultValue: Maybe<TParsedValue>;
  isOptional: boolean;
}

declare type SMDataEnum<Enum extends string | number | null> = ISMData<
  Enum,
  Enum,
  undefined
>;

/**
 * Utility to extract the parsed value of an SMData type
 */
type GetSMDataType<TSMData extends ISMData> = TSMData extends ISMData<
  infer TParsedValue
>
  ? TParsedValue
  : never;

type GetSMBoxedValue<
  TSMData extends ISMData<any, any, Record<string, ISMData>>
> = TSMData extends ISMData<any, any, infer TBoxedValue> ? TBoxedValue : never;

declare type QueryFilterEqualsKeyValue<NodeType> = Partial<
  Record<keyof NodeType, string>
>;

declare type GetParsedValueTypeFromDefaultFn<
  TDefaultFn extends (_default: any) => ISMData
> = TDefaultFn extends (_default: any) => ISMData<infer TParsedValue, any, any>
  ? TParsedValue
  : never;
/**
 * Utility to extract the expected data type of a node based on its' data structure
 */
declare type GetExpectedNodeDataType<
  TSMData extends Record<string, ISMData | SMDataDefaultFn>
> = {
  [key in keyof TSMData]: TSMData[key] extends
    | ISMData<infer TParsedValue, any, infer TBoxedValue>
    | DeepPartial<ISMData<infer TParsedValue, any, infer TBoxedValue>>
    ? TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>
      ? TParsedValue extends null
        ? Maybe<GetExpectedNodeDataType<TBoxedValue>>
        : GetExpectedNodeDataType<TBoxedValue>
      : TParsedValue extends Array<infer TArrayItemType>
      ? TParsedValue extends null
        ? Maybe<Array<TArrayItemType>>
        : Array<TArrayItemType>
      : TParsedValue
    : TSMData[key] extends SMDataDefaultFn
    ? GetParsedValueTypeFromDefaultFn<TSMData[key]>
    : never;
};

declare type GetExpectedRelationalDataType<
  TRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TRelationalData]: TRelationalData[key] extends IByReferenceQueryBuilder<
    infer TSMNode
  >
    ? GetExpectedNodeDataType<ExtractNodeData<TSMNode>>
    : TRelationalData[key] extends IChildrenQueryBuilder<infer TSMNode>
    ? Array<GetExpectedNodeDataType<ExtractNodeData<TSMNode>>>
    : never;
};

/**
 * Takes in any object and returns a Partial of that object type
 * for nested objects, those will also be turned into partials
 */
declare type DeepPartial<ObjectType extends Record<string, any>> = Partial<
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

/**
 * A record that lives on each instance of a DOProxy to determine
 * if each data property on that DO is currently guaranteed to be up to date.
 * Any property that is read while not being up to date throws a run-time error to ensure the devs never use outdated data mistakenly
 */
declare type UpToDateData<
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
interface IDOMethods {
  /**
   * Called when we get data from SM for this particular DO instance, found by its id
   */
  onDataReceived(data: Record<string, any>): void;
}

declare type NodeDO = Record<string, any> & IDOMethods;

declare type NodeComputedFns<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData
> = {
  [key in keyof TNodeComputedData]: (
    data: GetExpectedNodeDataType<TNodeData> & TNodeComputedData
  ) => TNodeComputedData[key];
};

declare type NodeRelationalFns<
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key];
};

declare type NodeMutationFn<
  TNodeData,
  TAdditionalOpts extends Record<string, any>
> = (opts: SMNodeMutationOpts<TNodeData> & TAdditionalOpts) => Promise<any>;

declare interface ISMNode<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn> = {},
  TNodeComputedData extends Record<string, any> = {},
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {},
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>> = {},
  TNodeDO = NodeDO<
    TNodeData,
    TNodeComputedData,
    TNodeRelationalData,
    TNodeMutations
  >
> {
  _isSMNodeDef: true;
  smData: TNodeData;
  smComputed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  smRelational?: NodeRelationalFns<TNodeRelationalData>;
  smMutations?: TNodeMutations;
  type: string;
  repository: ISMNodeRepository;
  do: new (data?: Record<string, any>) => TNodeDO;
}

/**
 * These inform the library how to query for data that is related to the node type we're building.
 * So, for example, if a user has meetings under them, one of the user's relational data properties is "meetings", which will be "IChildren".
 * This teaches the library how to interpret a query that asks for the user's meetings.
 */
declare type NodeRelationalQueryBuilder<TSMNode extends ISMNode> =
  | IByReferenceQueryBuilder<TSMNode>
  | IChildrenQueryBuilder<TSMNode>;

declare type NodeRelationalQuery<TSMNode extends ISMNode> =
  | IChildrenQuery<TSMNode, any>
  | IByReferenceQuery<TSMNode, any>;

declare interface IByReferenceQueryBuilder<TSMNode extends ISMNode> {
  <TMapFn extends MapFnForNode<TSMNode>>(opts: {
    map: TMapFn;
  }): IByReferenceQuery<TSMNode, TMapFn>;
}

type SMRelationalTypesRecord = typeof import('../smDataTypes').SM_RELATIONAL_TYPES;
declare interface IByReferenceQuery<
  TSMNode extends ISMNode,
  TMapFn extends MapFn<
    ExtractNodeData<TSMNode>,
    ExtractNodeComputedData<TSMNode>,
    ExtractNodeRelationalData<TSMNode>
  >
> {
  _smRelational: SMRelationalTypesRecord['byReference'];
  def: TSMNode;
  idProp: string;
  map: TMapFn;
}

declare interface IChildrenQueryBuilder<TSMNode extends ISMNode> {
  <TMapFn extends MapFnForNode<TSMNode>>(opts: {
    map: TMapFn;
    pagination?: ISMQueryPagination;
  }): IChildrenQuery<TSMNode, TMapFn>;
}

declare interface IChildrenQuery<
  TSMNode extends ISMNode,
  TMapFn extends MapFnForNode<TSMNode>
> {
  _smRelational: SMRelationalTypesRecord['children'];
  def: TSMNode;
  filtersAndPagination?: ISMQueryPagination;
  map: TMapFn;
  pagination?: ISMQueryPagination;
  depth?: number;
}

declare interface ISMQueryPagination {}

declare type NodeRelationalQueryBuilderRecord = Record<
  string,
  NodeRelationalQueryBuilder<ISMNode<any, any, any>>
>;

declare interface ISMNodeRepository {
  byId(id: string): NodeDO;
  onDataReceived(data: { id: string } & Record<string, any>): void;
  onNodeDeleted(id: string): void;
}

declare type QueryFilter<TNodeData> = QueryFilterOpts<TNodeData>;

declare type QueryDefinitionTarget<
  TSMNode extends ISMNode,
  TNodeData = ExtractNodeData<TSMNode>
> =
  | {
      underIds: Array<string>;
      depth?: number;
      filter?: QueryFilter<TNodeData>;
    }
  | {
      ids: Array<string>;
      filter?: QueryFilter<TNodeData>;
    }
  | { id: string }
  | { filter?: QueryFilter<TNodeData>; depth?: number }; // underIds can be omitted

// The config needed by a query to get one or multiple nodes of a single type
declare type QueryDefinition<
  TSMNode extends ISMNode,
  TQueryDefinitionTarget extends QueryDefinitionTarget<TSMNode>,
  TMapFn extends MapFnForNode<TSMNode>
> = {
  def: TSMNode;
  map?: TMapFn;
} & TQueryDefinitionTarget;

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
// adding params to QueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
// in QueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
// strangely, if we simply tell TS to ignore the error it works perfectly
// eslint-disable-next-line
// @ts-ignore
declare type QueryDefinitions = Record<string, QueryDefinition | ISMNode>;

declare type QueryDataReturn<TQueryDefinitions extends QueryDefinitions> = {
  [Key in keyof TQueryDefinitions]: TQueryDefinitions[Key] extends {
    map: MapFn<any, any, any>;
  } // full query definition provided, with a map fn
    ? TQueryDefinitions[Key] extends { def: infer TSMNode; map: infer TMapFn }
      ? TSMNode extends ISMNode
        ? TMapFn extends MapFn<any, any, any>
          ? TQueryDefinitions[Key] extends { id: string }
            ? ExtractQueriedDataFromMapFn<TMapFn, TSMNode>
            : Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>>
          : never
        : never
      : never
    : TQueryDefinitions[Key] extends { def: ISMNode } // full query definition provided, but map function omitted // return the entirety of the node's data
    ? TQueryDefinitions[Key] extends { def: infer TSMNode }
      ? TSMNode extends ISMNode
        ? TQueryDefinitions[Key] extends { id: string }
          ? GetExpectedNodeDataType<ExtractNodeData<TSMNode>> &
              ExtractNodeComputedData<TSMNode>
          : Array<
              GetExpectedNodeDataType<ExtractNodeData<TSMNode>> &
                ExtractNodeComputedData<TSMNode>
            >
        : never
      : never
    : TQueryDefinitions[Key] extends ISMNode // shorthand syntax used, only a node definition was provided
    ? Array<
        GetExpectedNodeDataType<ExtractNodeData<TQueryDefinitions[Key]>> &
          ExtractNodeComputedData<TQueryDefinitions[Key]>
      >
    : never;
};

declare type MapFnForNode<TSMNode extends ISMNode> = MapFn<
  ExtractNodeData<TSMNode>,
  ExtractNodeComputedData<TSMNode>,
  ExtractNodeRelationalData<TSMNode>
>;

type GetMapFnArgs<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TNodeData]: TNodeData[key] extends ISMData<Maybe<Array<any>>>
    ? TNodeData[key]
    : TNodeData[key] extends ISMData<
        any,
        any,
        Record<string, ISMData | SMDataDefaultFn>
      >
    ? <TMapFn extends MapFn<GetSMBoxedValue<TNodeData[key]>, {}, {}>>(opts: {
        map: TMapFn;
      }) => TMapFn
    : TNodeData[key];
} &
  TNodeRelationalData;

declare type MapFn<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = (
  data: GetMapFnArgs<TNodeData, TNodeRelationalData>
) => RequestedData<TNodeData, TNodeComputedData>;

// The accepted type for a map fn return
// validates that the engineer is querying data that exists on the nodes
// which gives us typo prevention :)
type RequestedData<
  TNodeData extends Record<string, ISMData>,
  TNodeComputedData
> = Partial<
  | {
      [Key in
        | keyof TNodeData
        | keyof TNodeComputedData]: Key extends keyof TNodeData
        ? TNodeData[Key] extends ISMData<Maybe<Array<any>>>
          ? TNodeData[Key]
          : TNodeData[Key] extends ISMData<Maybe<Record<string, any>>> // Allows querying partials of nested objects
          ? MapFn<GetSMDataType<TNodeData[Key]>, {}, {}> // {} because there should be no computed data or relational data for objects nested in nodes
          : TNodeData[Key]
        : Key extends keyof TNodeComputedData
        ? TNodeComputedData[Key] // Whereas NodeData and NodeComputedData requests must stick to their name as declared on the node (no use for aliases here, it would just confuse the dev reading it) // relational data requests may use any alias, so that we can query different subsets of the same node relation // Check the "How we achieve concurrent relational data querying support" section in the .md file
        : never;
    }
  | {}
>;

type RequestedRelationalData = ReturnType<NodeRelationalQueryBuilder<any>>;

// A generic to extract the resulting data based on a query fn
type ExtractQueriedDataFromMapFn<
  TMapFn extends MapFn<any, any, any>,
  TSMNode extends ISMNode
> = ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TSMNode> &
  ExtractNodeMutations<TSMNode> &
  ExtractNodeComputedData<TSMNode>;

// From the return of a query fn, get the type of data that will be returned by the query, aka the expected response from the API
type ExtractQueriedDataFromMapFnReturn<
  TMapFnReturn,
  TSMNode extends ISMNode
> = {
  [Key in keyof TMapFnReturn]: TMapFnReturn[Key] extends IChildrenQuery<
    any,
    any
  >
    ? ExtractQueriedDataFromChildrenQuery<TMapFnReturn[Key]>
    : TMapFnReturn[Key] extends IByReferenceQuery<any, any>
    ? ExtractQueriedDataFromByReferenceQuery<TMapFnReturn[Key]>
    : TMapFnReturn[Key] extends MapFn<any, any, any>
    ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode>
    : TMapFnReturn[Key] extends ISMData
    ? GetSMDataType<TMapFnReturn[Key]>
    : never;
};

type ExtractQueriedDataFromChildrenQuery<
  TChildrenQuery extends IChildrenQuery<any, any>
> = TChildrenQuery extends IChildrenQuery<infer TSMNode, infer TMapFn>
  ? Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>>
  : never;

type ExtractQueriedDataFromByReferenceQuery<
  TByReferenceQuery extends IByReferenceQuery<any, any>
> = TByReferenceQuery extends IByReferenceQuery<infer TSMNode, infer TMapFn>
  ? ExtractQueriedDataFromMapFn<TMapFn, TSMNode>
  : never;

type ExtractNodeData<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  infer TNodeData,
  any
>
  ? TNodeData
  : never;

type ExtractNodeComputedData<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  any,
  infer TNodeComputedData
>
  ? TNodeComputedData
  : never;

type ExtractNodeRelationalData<
  TSMNode extends ISMNode
> = TSMNode extends ISMNode<any, any, infer TNodeRelationalData>
  ? TNodeRelationalData
  : never;

type ExtractNodeMutations<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  any,
  any,
  any,
  infer TNodeMutations
>
  ? TNodeMutations
  : never;

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
declare type BaseQueryRecordEntry = {
  def: ISMNode;
  properties: Array<string>;
  relational?: Record<string, RelationalQueryRecordEntry>;
};

declare type QueryRecordEntry = BaseQueryRecordEntry &
  (
    | { underIds: Array<string>; depth?: number }
    | { ids: Array<string> }
    | { id: string }
  );

declare type RelationalQueryRecordEntry =
  | (BaseQueryRecordEntry & { children: true; depth?: number }) // will use GetChildren to query this data
  | (BaseQueryRecordEntry & { byReference: true; idProp: string }); // will use GetReference to query this data

declare type QueryRecord = Record<string, QueryRecordEntry>;

declare type SMNodeRequestUpdate<TNodeData> = (opts: {
  payload: DeepPartial<TNodeData>;
  updateNode: (opts: IUpdateNodeOpts<TNodeData>) => void;
}) => Promise<void>;

type SMNodeMutationOpts<TNodeData> = {
  nodeData: TNodeData;
  createNode(opts: INewCreateNodeOpts<TNodeData>): void;
  createEdge(opts: ICreateEdgeOpts): void;
  deleteNode(opts: IDeleteNodeOpts): void;
  deleteEdge(opts: IDeleteEdgeOpts): void;
  updateNode(opts: IUpdateNodeOpts<TNodeData>): void;
  requestUpdate: SMNodeRequestUpdate<TNodeData>;
};

declare interface IDOProxy {
  updateRelationalResults(
    newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>
  ): void;
}
