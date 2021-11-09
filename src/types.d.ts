declare type Maybe<Type> = Type | null

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
  TBoxedValue extends ISMData | Record<string, ISMData> | undefined = any
> {
  type: string
  parser(smValue: TSMValue): TParsedValue
  boxedValue: TBoxedValue
}

declare type SMDataEnum<Enum extends string | number | null> = ISMData<
  Enum,
  Enum,
  undefined
>

/**
 * Utility to extract the parsed value of an SMData type
 */
type GetSMDataType<TSMData extends ISMData> = TSMData extends ISMData<
  infer TParsedValue
>
  ? TParsedValue
  : never

type GetSMBoxedValue<
  TSMData extends ISMData<any, any, Record<string, ISMData>>
> = TSMData extends ISMData<any, any, infer TBoxedValue> ? TBoxedValue : never


/**
 * Utility to extract the expected data type of a node based on its' data structure
 */
declare type GetExpectedNodeDataType<
  TSMData extends Record<string, ISMData>
> = {
  [key in keyof TSMData]: TSMData[key] extends ISMData<
    infer TParsedValue,
    any,
    infer TBoxedValue
  >
    ? TBoxedValue extends Record<string, ISMData>
      ? TParsedValue extends null
        ? Maybe<GetExpectedNodeDataType<TBoxedValue>>
        : GetExpectedNodeDataType<TBoxedValue>
      : TParsedValue extends Array<infer TArrayItemType>
      ? TParsedValue extends null
        ? Maybe<Array<TArrayItemType>>
        : Array<TArrayItemType>
      : TParsedValue
    : never
}

declare type GetExpectedRelationalDataType<
  TRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TRelationalData]: TRelationalData[key] extends IByReferenceQueryBuilder<
    infer TSMNode
  >
    ? GetExpectedNodeDataType<ExtractNodeData<TSMNode>>
    : TRelationalData[key] extends IChildrenQueryBuilder<infer TSMNode>
    ? Array<GetExpectedNodeDataType<ExtractNodeData<TSMNode>>>
    : never
}

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
      : ObjectType[Key]
  }
>

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
      : boolean
  }
>

/**
 * These methods are called automatically when using this lib's public methods like "useSMData"
 */
interface IDOMethods {
  /**
   * Called when we get data from SM for this particular DO instance, found by its id
   */
  onDataReceived(data: DeepPartial<Record<string,any>>): void
}

declare type NodeDO= Record<string,any> &
  IDOMethods

declare type NodeComputedFns<
  TNodeData extends Record<string, ISMData>,
  TNodeComputedData
> = {
  [key in keyof TNodeComputedData]: (
    data: GetExpectedNodeDataType<TNodeData> & TNodeComputedData
  ) => TNodeComputedData[key]
}

declare type NodeRelationalFns<
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key]
}

declare type NodeMutationFn<
  TNodeData,
  TAdditionalOpts extends Record<string, any>
> = (opts: SMNodeMutationOpts<TNodeData> & TAdditionalOpts) => Promise<any>

declare interface ISMNode<
  TNodeData extends Record<string, ISMData> = {},
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
  _isSMNodeDef: true
  smData: TNodeData
  smComputed?: NodeComputedFns<TNodeData, TNodeComputedData>
  smRelational?: NodeRelationalFns<TNodeRelationalData>
  smMutations?: TNodeMutations
  // allows extending received data with an arbitrary set of default data
  transformData?: (
    receivedData: DeepPartial<GetExpectedNodeDataType<TNodeData>>
  ) => {
    extendIfQueried?: DeepPartial<GetExpectedNodeDataType<TNodeData>>
    overwriteIfQueried?: DeepPartial<GetExpectedNodeDataType<TNodeData>>
  }
  type: string
  repository: ISMNodeRepository<TNodeData, TNodeDO>
  do: new (data?: DeepPartial<GetExpectedNodeDataType<TNodeData>>) => TNodeDO
}

/**
 * These inform the library how to query for data that is related to the node type we're building.
 * So, for example, if a user has meetings under them, one of the user's relational data properties is "meetings", which will be "IChildren".
 * This teaches the library how to interpret a query that asks for the user's meetings.
 */
declare type NodeRelationalQueryBuilder<TSMNode extends ISMNode> =
  | IByReferenceQueryBuilder<TSMNode>
  | IChildrenQueryBuilder<TSMNode>

declare type NodeRelationalQuery<TSMNode extends ISMNode> =
  | IChildrenQuery<TSMNode, any>
  | IByReferenceQuery<TSMNode, any>

declare interface IByReferenceQueryBuilder<TSMNode extends ISMNode> {
  <TQueryFn extends QueryFnForNode<TSMNode>>(opts: {
    query: TQueryFn
  }): IByReferenceQuery<TSMNode, TQueryFn>
}

type SMRelationalTypesRecord = typeof import('../smDataTypes').SM_RELATIONAL_TYPES
declare interface IByReferenceQuery<
  TSMNode extends ISMNode,
  TQueryFn extends QueryFn<
    ExtractNodeData<TSMNode>,
    ExtractNodeComputedData<TSMNode>,
    ExtractNodeRelationalData<TSMNode>
  >
> {
  _smRelational: SMRelationalTypesRecord['byReference']
  node: TSMNode
  idProp: string
  query: TQueryFn
}

declare interface IChildrenQueryBuilder<TSMNode extends ISMNode> {
  <TQueryFn extends QueryFnForNode<TSMNode>>(opts: {
    query: TQueryFn
    pagination?: ISMQueryPagination
  }): IChildrenQuery<TSMNode, TQueryFn>
}

declare interface IChildrenQuery<
  TSMNode extends ISMNode,
  TQueryFn extends QueryFnForNode<TSMNode>
> {
  _smRelational: SMRelationalTypesRecord['children']
  node: TSMNode
  filtersAndPagination?: ISMQueryPagination
  query: TQueryFn
  pagination?: ISMQueryPagination
  depth?: number
}

declare interface ISMQueryPagination {}

declare type NodeRelationalQueryBuilderRecord = Record<
  string,
  NodeRelationalQueryBuilder<ISMNode<any, any, any>>
>

declare interface ISMNodeRepository<
  TNodeData extends Record<string, ISMData>,
  TNodeDO
> {
  byId(id: string): TNodeDO
  onDataReceived(
    data: { id: string } & DeepPartial<GetExpectedNodeDataType<TNodeData>>
  ): void
  onNodeDeleted(id: string): void
}

declare type QueryDefinitionTarget =
  | { underIds: Array<string>; depth?: number }
  | { ids: Array<string> }
  | { id: string }

// The config needed by a query to get one or multiple nodes of a single type
declare type QueryDefinition<
  TSMNode extends ISMNode,
  TQueryDefinitionTarget extends QueryDefinitionTarget,
  TQueryFn extends QueryFnForNode<TSMNode>
> = {
  node: TSMNode
  query: TQueryFn
} & TQueryDefinitionTarget

// A query takes a record where you can specify aliases for each node type you're querying (including 2 aliases for different sets of the same node type)
//
// example:
//  usersTodos: sm.queryDefinition({
//    node: todo,
//    under: [authenticatedUser.id],
//    query: ({ id }) => ({ id })
//  }),
//  meetingTodos: sm.queryDefinition({
//    node: todo,
//    under: [meeting.id],
//    query: ({ id } => ({ id })
//  })
//
// adding params to QueryDefinition here breaks the return type of a query function, since the TNodeData and TNodeComputedData types being infered
// in QueryDefinition would no longer be infered correctly. This would result in "any" types being returned for the query result, or implicit anys in the query fn definition
// strangely, if we simply tell TS to ignore the error it works perfectly
// eslint-disable-next-line
// @ts-ignore
declare type QueryDefinitions = Record<string, QueryDefinition | ISMNode>

// The data returned by a query, based on the query definitions it received
declare type QueryDataReturn<TQueryDefinitions extends QueryDefinitions> = {
  [Key in keyof TQueryDefinitions]: TQueryDefinitions[Key] extends {
    query: infer TQueryFn
    node: infer TSMNode
  }
    ? TQueryFn extends QueryFn<any, any, any>
      ? TSMNode extends ISMNode
        ? TQueryDefinitions[Key] extends { id: string }
          ? ExtractQueriedDataFromQueryFn<TQueryFn, TSMNode>
          : Array<ExtractQueriedDataFromQueryFn<TQueryFn, TSMNode>>
        : never
      : never
    : TQueryDefinitions[Key] extends ISMNode<infer TNodeData>
    ? Array<GetExpectedNodeDataType<TNodeData>>
    : never
}

declare type QueryFnForNode<TSMNode extends ISMNode> = QueryFn<
  ExtractNodeData<TSMNode>,
  ExtractNodeComputedData<TSMNode>,
  ExtractNodeRelationalData<TSMNode>
>

type GetQueryFnArgs<
  TNodeData extends Record<string, ISMData>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = {
  [key in keyof TNodeData]: TNodeData[key] extends ISMData<Maybe<Array<any>>>
    ? TNodeData[key]
    : TNodeData[key] extends ISMData<any, any, Record<string, ISMData>>
    ? <
        TQueryFn extends QueryFn<GetSMBoxedValue<TNodeData[key]>, {}, {}>
      >(opts: {
        query: TQueryFn
      }) => TQueryFn
    : TNodeData[key]
} &
  TNodeRelationalData

declare type QueryFn<
  TNodeData extends Record<string, ISMData>,
  TNodeComputedData,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
> = (
  data: GetQueryFnArgs<TNodeData, TNodeRelationalData>
) => RequestedData<TNodeData, TNodeComputedData>

// The accepted type for a query fn return
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
          : TNodeData[Key] extends ISMData<Maybe<Record<string, any>>>
          ? // Allows querying partials of nested objects
            QueryFn<GetSMDataType<TNodeData[Key]>, {}, {}> // {} because there should be no computed data or relational data for objects nested in nodes
          : TNodeData[Key]
        : Key extends keyof TNodeComputedData
        ? TNodeComputedData[Key]
        : // Whereas NodeData and NodeComputedData requests must stick to their name as declared on the node (no use for aliases here, it would just confuse the dev reading it)
          // relational data requests may use any alias, so that we can query different subsets of the same node relation
          // Check the "How we achieve concurrent relational data querying support" section in the .md file
          never
    }
  | {}
>

type RequestedRelationalData = ReturnType<NodeRelationalQueryBuilder<any>>

// A generic to extract the resulting data based on a query fn
type ExtractQueriedDataFromQueryFn<
  TQueryFn extends QueryFn<any, any, any>,
  TSMNode extends ISMNode
> = ExtractQueriedDataFromQueryFnReturn<ReturnType<TQueryFn>, TSMNode> &
  ExtractNodeMutations<TSMNode> &
  ExtractNodeComputedData<TSMNode>

// From the return of a query fn, get the type of data that will be returned by the query, aka the expected response from the API
type ExtractQueriedDataFromQueryFnReturn<
  TQueryFnReturn,
  TSMNode extends ISMNode
> = {
  [Key in keyof TQueryFnReturn]: TQueryFnReturn[Key] extends IChildrenQuery<
    any,
    any
  >
    ? ExtractQueriedDataFromChildrenQuery<TQueryFnReturn[Key]>
    : TQueryFnReturn[Key] extends IByReferenceQuery<any, any>
    ? ExtractQueriedDataFromByReferenceQuery<TQueryFnReturn[Key]>
    : TQueryFnReturn[Key] extends QueryFn<any, any, any>
    ? ExtractQueriedDataFromQueryFn<TQueryFnReturn[Key], TSMNode>
    : TQueryFnReturn[Key] extends ISMData
    ? GetSMDataType<TQueryFnReturn[Key]>
    : never
}

type ExtractQueriedDataFromChildrenQuery<
  TChildrenQuery extends IChildrenQuery<any, any>
> = TChildrenQuery extends IChildrenQuery<infer TSMNode, infer TQueryFn>
  ? Array<ExtractQueriedDataFromQueryFn<TQueryFn, TSMNode>>
  : never

type ExtractQueriedDataFromByReferenceQuery<
  TByReferenceQuery extends IByReferenceQuery<any, any>
> = TByReferenceQuery extends IByReferenceQuery<infer TSMNode, infer TQueryFn>
  ? ExtractQueriedDataFromQueryFn<TQueryFn, TSMNode>
  : never

type ExtractNodeData<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  infer TNodeData,
  any
>
  ? TNodeData
  : never

type ExtractNodeComputedData<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  any,
  infer TNodeComputedData
>
  ? TNodeComputedData
  : never

type ExtractNodeRelationalData<
  TSMNode extends ISMNode
> = TSMNode extends ISMNode<any, any, infer TNodeRelationalData>
  ? TNodeRelationalData
  : never

type ExtractNodeMutations<TSMNode extends ISMNode> = TSMNode extends ISMNode<
  any,
  any,
  any,
  infer TNodeMutations
>
  ? TNodeMutations
  : never

/**
 * a record of all the queries identified in this query definitions
 * looks something like this
 *
 * {
 *   // alias
 *   usersTodos: {
 *     // the SMNode we're querying
 *     node: todo,
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
 *         node: user,
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
  node: ISMNode
  properties: Array<string>
  relational?: Record<string, RelationalQueryRecordEntry>
}

declare type QueryRecordEntry = BaseQueryRecordEntry &
  (
    | { underIds: Array<string>; depth?: number }
    | { ids: Array<string> }
    | { id: string }
  )

declare type RelationalQueryRecordEntry =
  | (BaseQueryRecordEntry & { children: true; depth?: number }) // will use GetChildren to query this data
  | (BaseQueryRecordEntry & { byReference: true; idProp: string }) // will use GetReference to query this data

declare type QueryRecord = Record<string, QueryRecordEntry>

declare type SMNodeRequestUpdate<TNodeData> = (opts: {
  payload: DeepPartial<TNodeData>
  updateNode: (opts: IUpdateNodeOpts<TNodeData>) => void
}) => Promise<void>

type SMNodeMutationOpts<TNodeData> = {
  nodeData: TNodeData
  createNode(opts: INewCreateNodeOpts<TNodeData>): void
  createEdge(opts: ICreateEdgeOpts): void
  deleteNode(opts: IDeleteNodeOpts): void
  deleteEdge(opts: IDeleteEdgeOpts): void
  updateNode(opts: IUpdateNodeOpts<TNodeData>): void
  requestUpdate: SMNodeRequestUpdate<TNodeData>
}

declare interface IDOProxy {
  updateRelationalResults(
    newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>
  ): void
}
