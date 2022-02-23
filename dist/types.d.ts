import { SM_RELATIONAL_TYPES } from './smDataTypes';
import { IPendingTransaction, ITransactionContext } from './transaction/transaction';
export declare type BOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export declare type Maybe<T> = T | null;
export declare type SMDataDefaultFn = (_default: any) => ISMData;
export declare type DocumentNode = import('@apollo/client/core').DocumentNode;
export declare type SMPlugin = {
    DO?: {
        onConstruct?: (opts: {
            DOInstance: NodeDO;
            parsedDataKey: string;
        }) => void;
        computedDecorator?: <TReturnType, TComputedFn extends (data: Record<string, any>) => TReturnType>(opts: {
            DOInstance: NodeDO;
            computedFn: TComputedFn;
        }) => () => TReturnType;
    };
    DOProxy?: {
        computedDecorator?: <TReturnType, TComputedFn extends (data: Record<string, any>) => TReturnType>(opts: {
            ProxyInstance: IDOProxy;
            computedFn: TComputedFn;
        }) => () => TReturnType;
    };
};
export declare type SMConfig = {
    gqlClient: ISMGQLClient;
    plugins?: Array<SMPlugin>;
};
export interface ISMGQLClient {
    query(opts: {
        gql: DocumentNode;
        token: string;
        batched?: boolean;
    }): Promise<any>;
    subscribe(opts: {
        gql: DocumentNode;
        token: string;
        onMessage: (message: Record<string, any>) => void;
        onError: (error: any) => void;
    }): SubscriptionCanceller;
    mutate(opts: {
        mutations: Array<DocumentNode>;
        token: string;
    }): Promise<any>;
}
export interface ISMQueryManager {
    onQueryResult(opts: {
        queryResult: any;
        queryId: string;
    }): void;
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
export declare type QueryReturn<TQueryDefinitions extends QueryDefinitions> = {
    data: QueryDataReturn<TQueryDefinitions>;
    error: any;
};
export declare type QueryOpts<TQueryDefinitions extends QueryDefinitions> = {
    onData?: (info: {
        results: QueryDataReturn<TQueryDefinitions>;
    }) => void;
    onError?: (...args: any) => void;
    queryId?: string;
    tokenName?: string;
    batched?: boolean;
};
export declare type SubscriptionOpts<TQueryDefinitions extends QueryDefinitions> = {
    onData: (info: {
        results: QueryDataReturn<TQueryDefinitions>;
    }) => void;
    onError?: (...args: any) => void;
    onSubscriptionInitialized?: (subscriptionCanceller: SubscriptionCanceller) => void;
    onQueryInfoConstructed?: (queryInfo: {
        queryGQL: DocumentNode;
        queryId: string;
    }) => void;
    skipInitialQuery?: boolean;
    queryId?: string;
    tokenName?: string;
    batched?: boolean;
};
export declare type SubscriptionCanceller = () => void;
export declare type SubscriptionMeta = {
    unsub: SubscriptionCanceller;
    error: any;
};
export interface ISMJS {
    getToken(opts: {
        tokenName: string;
    }): string;
    setToken(opts: {
        tokenName: string;
        token: string;
    }): void;
    clearTokens(): void;
    query<TQueryDefinitions extends QueryDefinitions>(queryDefinition: TQueryDefinitions, opts?: QueryOpts<TQueryDefinitions>): Promise<QueryReturn<TQueryDefinitions>>;
    subscribe<TQueryDefinitions extends QueryDefinitions, TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>>(queryDefinitions: TQueryDefinitions, opts: TSubscriptionOpts): Promise<TSubscriptionOpts extends {
        skipInitialQuery: true;
    } ? SubscriptionMeta : {
        data: QueryDataReturn<TQueryDefinitions>;
    } & SubscriptionMeta>;
    def<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, NodeMutationFn>>(def: NodeDefArgs<TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>): ISMNode<TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>;
    transaction(callback: ((context: ITransactionContext) => void | Promise<void>) | Array<IPendingTransaction>, opts?: {
        tokenName: string;
    }): IPendingTransaction;
    gqlClient: ISMGQLClient;
    plugins: Array<SMPlugin> | undefined;
    DOProxyGenerator<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TRelationalResults extends Record<string, Array<IDOProxy> | IDOProxy>>(opts: {
        node: ISMNode<TNodeData, TNodeComputedData>;
        queryId: string;
        do: NodeDO;
        allPropertiesQueried: Array<string>;
        relationalResults: Maybe<TRelationalResults>;
        relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
    }): NodeDO & TRelationalResults & IDOProxy;
    DOFactory<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, NodeMutationFn>, TDOClass = new (initialData?: Record<string, any>) => NodeDO>(node: {
        type: string;
        properties: TNodeData;
        computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
        relational?: NodeRelationalFns<TNodeRelationalData>;
        mutations?: TNodeMutations;
    }): TDOClass;
    SMQueryManager: new (queryRecord: QueryRecord) => ISMQueryManager;
}
export declare type NodeDefArgs<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn>> = {
    type: string;
    properties: TNodeData;
    computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
    relational?: NodeRelationalFns<TNodeRelationalData>;
    mutations?: TNodeMutations;
};
/**
 * The interface implemented by each smData type (like smData.string, smData.boolean)
 */
export interface ISMData<TParsedValue = any, TSMValue = any, 
/**
 * only defined for object and array types
 *
 * for arrays is the smData type of each item in that array
 * for objects is a record of strings to smData (matching the structure the smData.object received as an argument)
 */
TBoxedValue extends ISMData | SMDataDefaultFn | Record<string, ISMData | SMDataDefaultFn> | undefined = any> {
    type: string;
    parser(smValue: TSMValue): TParsedValue;
    boxedValue: TBoxedValue;
    defaultValue: Maybe<TParsedValue>;
    isOptional: boolean;
}
export declare type SMDataEnum<Enum extends string | number | null> = ISMData<Enum, Enum, undefined>;
/**
 * Utility to extract the parsed value of an SMData type
 */
export declare type GetSMDataType<TSMData extends ISMData | SMDataDefaultFn> = TSMData extends ISMData<infer TParsedValue> ? TParsedValue : TSMData extends SMDataDefaultFn ? TSMData extends (_: any) => ISMData<infer TParsedValue> ? TParsedValue : never : never;
declare type GetSMBoxedValue<TSMData extends ISMData<any, any, Record<string, ISMData>> | SMDataDefaultFn> = TSMData extends ISMData<any, any, infer TBoxedValue> ? TBoxedValue : TSMData extends (_: any) => ISMData<any, any, infer TBoxedValue> ? TBoxedValue : never;
export declare type QueryFilterEqualsKeyValue<NodeType> = Partial<Record<keyof NodeType, string>>;
export declare type GetParsedValueTypeFromDefaultFn<TDefaultFn extends (_default: any) => ISMData> = TDefaultFn extends (_default: any) => ISMData<infer TParsedValue, any, any> ? TParsedValue : never;
/**
 * Utility to extract the expected data type of a node based on its' data structure
 */
export declare type GetExpectedNodeDataType<TSMData extends Record<string, ISMData | SMDataDefaultFn>, TComputedData extends Record<string, any>> = {
    [key in keyof TSMData]: TSMData[key] extends ISMData<infer TParsedValue, any, infer TBoxedValue> | DeepPartial<ISMData<infer TParsedValue, any, infer TBoxedValue>> ? TBoxedValue extends Record<string, ISMData | SMDataDefaultFn> ? TParsedValue extends null ? Maybe<GetExpectedNodeDataType<TBoxedValue, {}>> : GetExpectedNodeDataType<TBoxedValue, {}> : TParsedValue extends Array<infer TArrayItemType> ? TParsedValue extends null ? Maybe<Array<TArrayItemType>> : Array<TArrayItemType> : TParsedValue : TSMData[key] extends SMDataDefaultFn ? GetParsedValueTypeFromDefaultFn<TSMData[key]> : never;
} & TComputedData;
export declare type GetExpectedRelationalDataType<TRelationalData extends NodeRelationalQueryBuilderRecord> = {
    [key in keyof TRelationalData]: TRelationalData[key] extends IByReferenceQueryBuilder<infer TSMNode> ? GetExpectedNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>> : TRelationalData[key] extends IChildrenQueryBuilder<infer TSMNode> ? Array<GetExpectedNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>>> : never;
};
/**
 * Takes in any object and returns a Partial of that object type
 * for nested objects, those will also be turned into partials
 */
export declare type DeepPartial<ObjectType extends Record<string, any>> = Partial<{
    [Key in keyof ObjectType]: ObjectType[Key] extends Maybe<Array<any>> ? ObjectType[Key] : ObjectType[Key] extends Maybe<Record<string, any>> ? ObjectType[Key] extends null ? Maybe<DeepPartial<ObjectType[Key]>> : DeepPartial<ObjectType[Key]> : ObjectType[Key];
}>;
/**
 * A record that lives on each instance of a DOProxy to determine
 * if each data property on that DO is currently guaranteed to be up to date.
 * Any property that is read while not being up to date throws a run-time error to ensure the devs never use outdated data mistakenly
 */
export declare type UpToDateData<TNodeData extends Record<string, ISMData>> = DeepPartial<{
    [Key in keyof TNodeData]: TNodeData[Key] extends ISMData<Maybe<Array<any>>> ? boolean : TNodeData[Key] extends ISMData<any, any, infer TBoxedValue> ? TBoxedValue extends Record<string, ISMData> ? UpToDateData<TBoxedValue> : boolean : boolean;
}>;
/**
 * These methods are called automatically when using this lib's public methods like "useSMData"
 */
export interface IDOMethods {
    /**
     * Called when we get data from SM for this particular DO instance, found by its id
     */
    onDataReceived(data: Record<string, any>, opts?: {
        __unsafeIgnoreVersion?: boolean;
    }): void;
}
export interface IDOAccessors {
    id: string;
    version: number;
    lastUpdatedBy: string;
    persistedData: Record<string, any>;
}
export declare type NodeDO = Record<string, any> & IDOMethods & IDOAccessors;
export declare type NodeComputedFns<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>> = {
    [key in keyof TNodeComputedData]: (data: GetExpectedNodeDataType<TNodeData, TNodeComputedData>) => TNodeComputedData[key];
};
export declare type NodeRelationalFns<TNodeRelationalData extends NodeRelationalQueryBuilderRecord> = {
    [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key];
};
export declare type NodeMutationFn = () => Promise<any>;
export interface ISMNode<TNodeData extends Record<string, ISMData | SMDataDefaultFn> = {}, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}, TNodeMutations extends Record<string, /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn> = {}, TNodeComputedFns = NodeComputedFns<TNodeData, TNodeComputedData>, TNodeDO = NodeDO> {
    _isSMNodeDef: true;
    smData: TNodeData;
    smComputed?: TNodeComputedFns;
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
export declare type NodeRelationalQueryBuilder<TSMNode extends ISMNode> = IByReferenceQueryBuilder<TSMNode> | IChildrenQueryBuilder<TSMNode>;
export declare type NodeRelationalQuery<TSMNode extends ISMNode> = IChildrenQuery<TSMNode, any> | IByReferenceQuery<TSMNode, any>;
export interface IByReferenceQueryBuilder<TSMNode extends ISMNode> {
    <TMapFn extends MapFnForNode<TSMNode>>(opts: {
        map: TMapFn;
    }): IByReferenceQuery<TSMNode, TMapFn>;
}
declare type SMRelationalTypesRecord = typeof SM_RELATIONAL_TYPES;
export interface IByReferenceQuery<TSMNode extends ISMNode, TMapFn extends MapFn<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>, ExtractNodeRelationalData<TSMNode>>> {
    _smRelational: SMRelationalTypesRecord['byReference'];
    def: TSMNode;
    idProp: string;
    map: TMapFn;
}
export interface IChildrenQueryBuilder<TSMNode extends ISMNode> {
    <TMapFn extends MapFnForNode<TSMNode>>(opts: {
        map: TMapFn;
        pagination?: ISMQueryPagination;
    }): IChildrenQuery<TSMNode, TMapFn>;
}
export interface IChildrenQuery<TSMNode extends ISMNode, TMapFn extends MapFnForNode<TSMNode>> {
    _smRelational: SMRelationalTypesRecord['children'];
    def: TSMNode;
    filtersAndPagination?: ISMQueryPagination;
    map: TMapFn;
    pagination?: ISMQueryPagination;
    depth?: number;
}
export interface ISMQueryPagination {
}
export declare type NodeRelationalQueryBuilderRecord = Record<string, NodeRelationalQueryBuilder<ISMNode>>;
export interface ISMNodeRepository {
    byId(id: string): NodeDO;
    onDataReceived(data: {
        id: string;
    } & Record<string, any>): void;
    onNodeDeleted(id: string): void;
}
declare type Exactly<T, U extends T> = {
    [K in keyof U]: K extends keyof T ? T[K] : never;
};
export declare type QueryFilter<TSMNode extends ISMNode> = Partial<Record<keyof ExtractNodeData<TSMNode>, string>>;
export declare type QueryDefinitionTarget = {
    underIds?: Array<string>;
    depth?: number;
    id?: string;
    ids?: Array<string>;
};
export declare type QueryDefinition<TSMNode extends ISMNode, TMapFn extends MapFnForNode<TSMNode>, TQueryFilter extends QueryFilter<TSMNode>, TQueryDefinitionTarget extends QueryDefinitionTarget> = {
    def: TSMNode;
    map: TMapFn;
    filter?: Exactly<Partial<Record<keyof ExtractNodeData<TSMNode>, string>>, TQueryFilter>;
    target?: TQueryDefinitionTarget;
};
export declare type QueryDefinitions = Record<string, QueryDefinition | ISMNode>;
export declare type QueryDataReturn<TQueryDefinitions extends QueryDefinitions> = {
    [Key in keyof TQueryDefinitions]: TQueryDefinitions[Key] extends {
        map: MapFn<any, any, any>;
    } ? TQueryDefinitions[Key] extends {
        def: infer TSMNode;
        map: infer TMapFn;
    } ? TSMNode extends ISMNode ? TMapFn extends MapFnForNode<TSMNode> ? TQueryDefinitions[Key] extends {
        target?: {
            id: string;
        };
    } ? ExtractQueriedDataFromMapFn<TMapFn, TSMNode> : Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>> : never : never : never : TQueryDefinitions[Key] extends {
        def: ISMNode;
    } ? TQueryDefinitions[Key] extends {
        def: infer TSMNode;
    } ? TSMNode extends ISMNode ? TQueryDefinitions[Key] extends {
        target?: {
            id: string;
        };
    } ? GetExpectedNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>> : Array<GetExpectedNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>>> : never : never : TQueryDefinitions[Key] extends ISMNode ? Array<GetExpectedNodeDataType<ExtractNodeData<TQueryDefinitions[Key]>, ExtractNodeComputedData<TQueryDefinitions[Key]>>> : never;
};
export declare type MapFnForNode<TSMNode extends ISMNode> = MapFn<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>, ExtractNodeRelationalData<TSMNode>>;
export declare type MapFn<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData, TNodeRelationalData extends NodeRelationalQueryBuilderRecord> = (data: GetMapFnArgs<TNodeData, TNodeRelationalData>) => RequestedData<TNodeData, TNodeComputedData>;
export declare type GetMapFnArgs<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord> = {
    [key in keyof TNodeData]: TNodeData[key] extends ISMData<Maybe<Array<any>>> ? TNodeData[key] : TNodeData[key] extends ISMData<any, any, Record<string, ISMData | SMDataDefaultFn>> ? <TMapFn extends MapFn<GetSMBoxedValue<TNodeData[key]>, {}, {}>>(opts: {
        map: TMapFn;
    }) => TMapFn : TNodeData[key];
} & TNodeRelationalData;
declare type RequestedData<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>> = Partial<{
    [Key in keyof TNodeData | keyof TNodeComputedData]: Key extends keyof TNodeData ? TNodeData[Key] extends ISMData<Maybe<Array<any>>> ? TNodeData[Key] : TNodeData[Key] extends ISMData<Maybe<Record<string, any>>> ? MapFn<GetSMDataType<TNodeData[Key]>, {}, {}> : TNodeData[Key] : Key extends keyof TNodeComputedData ? TNodeComputedData[Key] : never;
} | {}>;
export declare type ExtractQueriedDataFromMapFn<TMapFn extends MapFnForNode<TSMNode>, TSMNode extends ISMNode> = ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TSMNode> & ExtractNodeComputedData<TSMNode>;
declare type ExtractQueriedDataFromMapFnReturn<TMapFnReturn, TSMNode extends ISMNode> = {
    [Key in keyof TMapFnReturn]: TMapFnReturn[Key] extends IByReferenceQuery<any, any> ? ExtractQueriedDataFromByReferenceQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends IChildrenQuery<any, any> ? ExtractQueriedDataFromChildrenQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends MapFnForNode<TSMNode> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode> : TMapFnReturn[Key] extends ISMData | SMDataDefaultFn ? GetSMDataType<TMapFnReturn[Key]> : TMapFnReturn[Key] extends MapFn<any, any, any> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode> : never;
};
declare type ExtractQueriedDataFromChildrenQuery<TChildrenQuery extends IChildrenQuery<any, any>> = TChildrenQuery extends IChildrenQuery<infer TSMNode, infer TMapFn> ? Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>> : never;
declare type ExtractQueriedDataFromByReferenceQuery<TByReferenceQuery extends IByReferenceQuery<any, any>> = TByReferenceQuery extends IByReferenceQuery<infer TSMNode, infer TMapFn> ? ExtractQueriedDataFromMapFn<TMapFn, TSMNode> : never;
export declare type ExtractNodeData<TSMNode extends ISMNode> = TSMNode extends ISMNode<infer TNodeData, any> ? TNodeData : never;
declare type ExtractNodeComputedData<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, infer TNodeComputedData> ? TNodeComputedData : never;
declare type ExtractNodeRelationalData<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, any, infer TNodeRelationalData> ? TNodeRelationalData : never;
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
export declare type BaseQueryRecordEntry = {
    def: ISMNode;
    properties: Array<string>;
    relational?: Record<string, RelationalQueryRecordEntry>;
};
export declare type QueryRecordEntry = BaseQueryRecordEntry & ({
    underIds: Array<string>;
    depth?: number;
} | {
    ids: Array<string>;
} | {
    id: string;
});
export declare type RelationalQueryRecordEntry = (BaseQueryRecordEntry & {
    children: true;
    depth?: number;
}) | (BaseQueryRecordEntry & {
    byReference: true;
    idProp: string;
});
export declare type QueryRecord = Record<string, QueryRecordEntry>;
export interface IDOProxy {
    updateRelationalResults(newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>): void;
}
export {};
