import { OnPaginateCallback, NodesCollection } from './nodesCollection';
import { DEFAULT_NODE_PROPERTIES, PROPERTIES_QUERIED_FOR_ALL_NODES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { generateQuerier, generateSubscriber } from './queriers';
import { createQueryManager } from './QueryManager';
import { createTransaction } from './transaction/transaction';
import { QuerySlimmer } from './QuerySlimmer';
export declare type BOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export declare type Maybe<T> = T | null;
export declare type IsMaybe<Type> = null extends Type ? true : false;
export declare type DataDefaultFn = {
    _default: IData;
    (_default: any): IData;
};
export declare type DocumentNode = import('@apollo/client/core').DocumentNode;
export declare type Plugin = {
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
export declare type Config = {
    gqlClient: IGQLClient;
    plugins?: Array<Plugin>;
    generateMockData: boolean;
    enableQuerySlimming: boolean;
    enableQuerySlimmingLogging: boolean;
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
    mutate(opts: {
        mutations: Array<DocumentNode>;
        token: string;
    }): Promise<any>;
}
export interface IQueryManager {
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
    batchKey?: string;
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
        queryParamsString: string;
    }) => void;
    onPaginate?: OnPaginateCallback;
    skipInitialQuery?: boolean;
    queryId?: string;
    batchKey?: string;
};
export declare type NodeDefaultProps = typeof DEFAULT_NODE_PROPERTIES;
export declare type PropertiesQueriedForAllNodes = typeof PROPERTIES_QUERIED_FOR_ALL_NODES;
export declare type SubscriptionCanceller = () => void;
export declare type SubscriptionMeta = {
    unsub: SubscriptionCanceller;
    error: any;
};
export interface IMMGQL {
    getToken(opts: {
        tokenName: string;
    }): string;
    setToken(opts: {
        tokenName: string;
        token: string;
    }): void;
    clearTokens(): void;
    query: ReturnType<typeof generateQuerier>;
    subscribe: ReturnType<typeof generateSubscriber>;
    transaction: ReturnType<typeof createTransaction>;
    gqlClient: IGQLClient;
    plugins: Array<Plugin> | undefined;
    generateMockData: boolean | undefined;
    enableQuerySlimming: boolean | undefined;
    enableQuerySlimmingLogging: boolean | undefined;
    DOProxyGenerator: ReturnType<typeof createDOProxyGenerator>;
    DOFactory: ReturnType<typeof createDOFactory>;
    QueryManager: ReturnType<typeof createQueryManager>;
    QuerySlimmer: QuerySlimmer;
    def<TNodeType extends string, TNodeData extends Record<string, IData | DataDefaultFn>, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}>(def: NodeDefArgs<{
        TNodeType: TNodeType;
        TNodeData: TNodeData;
        TNodeComputedData: TNodeComputedData;
        TNodeRelationalData: TNodeRelationalData;
    }>): INode<{
        TNodeType: TNodeType;
        TNodeData: TNodeData;
        TNodeComputedData: TNodeComputedData;
        TNodeRelationalData: TNodeRelationalData;
    }>;
    defTyped<TNode extends INode>(def: TNode extends INode<infer TNodeArgs> ? NodeDefArgs<TNodeArgs> : never): TNode;
}
export declare type NodeDefArgs<TDefArgs extends {
    TNodeType: string;
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
    TNodeRelationalData: NodeRelationalQueryBuilderRecord;
}> = {
    type: TDefArgs["TNodeType"];
    properties: TDefArgs["TNodeData"];
    computed?: NodeComputedFns<{
        TNodeData: TDefArgs["TNodeData"] & NodeDefaultProps;
        TNodeComputedData: TDefArgs["TNodeComputedData"];
    }>;
    relational?: NodeRelationalFns<TDefArgs["TNodeRelationalData"]>;
    generateMockData?: () => DeepPartial<GetResultingDataTypeFromProperties<TDefArgs["TNodeData"]>>;
};
/**
 * The interface implemented by each data type (like data.string, data.boolean)
 */
export interface IData<TDataArgs extends {
    TValue: any;
    TParsedValue: any;
    /**
     * only defined for object and array types
     *
     * for arrays is the data type of each item in that array
     * for objects is a record of strings to data (matching the structure the data.object received as an argument)
     */
    TBoxedValue: IData<any> | DataDefaultFn | Record<string, IData | DataDefaultFn> | undefined;
} = any> {
    type: string;
    parser(value: TDataArgs["TValue"]): TDataArgs["TParsedValue"];
    boxedValue: TDataArgs["TBoxedValue"];
    defaultValue: Maybe<TDataArgs["TParsedValue"]>;
    isOptional: boolean;
    /**
     *  Enum type data will keep a reference to its acceptable values
     *  so that later this can be used by the mock data generator to produce a random value from this array
     */
    acceptableValues?: Array<TDataArgs["TParsedValue"]>;
}
/**
 * Utility to extract the parsed value of an Data type
 */
export declare type GetDataType<TData extends IData | DataDefaultFn> = TData extends IData<infer TDataArgs> ? TDataArgs['TParsedValue'] : TData extends DataDefaultFn ? TData extends (_: any) => IData<infer TDataArgs> ? TDataArgs['TParsedValue'] : never : never;
export declare type GetParsedValueTypeFromDefaultFn<TDefaultFn extends (_default: any) => IData> = TDefaultFn extends (_default: any) => IData<infer TDataArgs> ? TDataArgs["TParsedValue"] : never;
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
export declare type GetResultingDataTypeFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> = {
    [key in keyof TProperties]: TProperties[key] extends IData<infer TDataArgs> ? TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn> ? IsMaybe<TDataArgs["TParsedValue"]> extends true ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultProps<{
        TNodeData: TDataArgs["TBoxedValue"];
        TNodeComputedData: {};
    }>> : GetAllAvailableNodeDataTypeWithoutDefaultProps<{
        TNodeData: TDataArgs["TBoxedValue"];
        TNodeComputedData: {};
    }> : TDataArgs["TParsedValue"] extends Array<infer TArrayItemType> ? IsMaybe<TDataArgs["TParsedValue"]> extends true ? Maybe<Array<TArrayItemType>> : Array<TArrayItemType> : TDataArgs["TParsedValue"] : TProperties[key] extends DataDefaultFn ? GetParsedValueTypeFromDefaultFn<TProperties[key]> : never;
};
export declare type GetResultingFilterDataTypeFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> = {
    [key in keyof TProperties]: TProperties[key] extends IData<infer TDataArgs> ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn> ? IsMaybe<TDataArgs['TParsedValue']> extends true ? Maybe<GetAllAvailableNodeFilterDataTypeWithoutDefaultProps<{
        TNodeData: TDataArgs['TBoxedValue'];
        TNodeComputedData: {};
    }>> : GetAllAvailableNodeFilterDataTypeWithoutDefaultProps<{
        TNodeData: TDataArgs['TBoxedValue'];
        TNodeComputedData: {};
    }> : TDataArgs['TParsedValue'] extends Array<infer TArrayItemType> ? IsMaybe<TDataArgs['TParsedValue']> extends true ? Maybe<Array<TArrayItemType>> : Array<TArrayItemType> : FilterValue<TDataArgs['TParsedValue']> : TProperties[key] extends DataDefaultFn ? FilterValue<GetParsedValueTypeFromDefaultFn<TProperties[key]>> : never;
};
export declare type GetSortingDataTypeFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> = {
    [key in keyof TProperties]: TProperties[key] extends IData<infer TDataArgs> ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn> ? IsMaybe<TDataArgs['TParsedValue']> extends true ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultPropsForSorting<{
        TNodeData: TDataArgs['TBoxedValue'];
        TNodeComputedData: {};
    }>> : GetAllAvailableNodeDataTypeWithoutDefaultPropsForSorting<{
        TNodeData: TDataArgs['TBoxedValue'];
        TNodeComputedData: {};
    }> : TDataArgs['TParsedValue'] extends Array<infer TArrayItemType> ? IsMaybe<TDataArgs['TParsedValue']> extends true ? Maybe<Array<TArrayItemType>> : Array<TArrayItemType> : SortValue : TProperties[key] extends DataDefaultFn ? SortValue : never;
};
export declare type GetResultingDataTypeFromNodeDefinition<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? GetResultingDataTypeFromProperties<TNodeArgs["TNodeData"]> : never;
export declare type SortDirection = 'asc' | 'desc';
export declare type FilterCondition = 'OR' | 'AND';
export declare type FilterValue<TValue> = TValue | (Partial<Record<FilterOperator, TValue> & {
    _condition?: FilterCondition;
}>);
export declare type SortObject = {
    _direction: SortDirection;
    _priority?: number;
};
export declare type SortValue = SortDirection | SortObject;
export declare type GetResultingFilterDataTypeFromNodeDefinition<TSMNode extends INode> = TSMNode extends INode<infer TNodeArgs> ? GetResultingFilterDataTypeFromProperties<TNodeArgs["TNodeData"] & NodeDefaultProps> : never;
export declare type GetSortingDataTypeFromNodeDefinition<TSMNode extends INode> = TSMNode extends INode<infer TNodeArgs> ? GetSortingDataTypeFromProperties<TNodeArgs["TNodeData"] & NodeDefaultProps> : never;
/**
 * Utility to extract the expected data type of a node based on its' properties and computed data
 * For data resulting from property definitions only, use GetResultingDataTypeFromProperties
 */
export declare type GetAllAvailableNodeDataType<TGetAllAvailableNodeDataTypeArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
}> = GetResultingDataTypeFromProperties<TGetAllAvailableNodeDataTypeArgs['TNodeData'] & NodeDefaultProps> & TGetAllAvailableNodeDataTypeArgs['TNodeComputedData'];
declare type GetAllAvailableNodeDataTypeWithoutDefaultPropsForSorting<TGetAllAvailableNodeDataTypeWithoutDefaultPropsForSortingArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
}> = GetSortingDataTypeFromProperties<TGetAllAvailableNodeDataTypeWithoutDefaultPropsForSortingArgs['TNodeData']> & TGetAllAvailableNodeDataTypeWithoutDefaultPropsForSortingArgs['TNodeComputedData'];
declare type GetAllAvailableNodeDataTypeWithoutDefaultProps<TGetAllAvailableNodeDataTypeWithoutDefaultPropsArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
}> = GetResultingDataTypeFromProperties<TGetAllAvailableNodeDataTypeWithoutDefaultPropsArgs['TNodeData']> & TGetAllAvailableNodeDataTypeWithoutDefaultPropsArgs['TNodeComputedData'];
declare type GetAllAvailableNodeFilterDataTypeWithoutDefaultProps<TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
}> = GetResultingFilterDataTypeFromProperties<TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs['TNodeData']> & TGetAllAvailableNodeFilterDataTypeWithoutDefaultPropsArgs['TNodeComputedData'];
/**
 * Takes in any object and returns a Partial of that object type
 * for nested objects, those will also be turned into partials
 */
export declare type DeepPartial<ObjectType extends Record<string, any>> = Partial<{
    [Key in keyof ObjectType]: ObjectType[Key] extends Maybe<Array<any>> ? ObjectType[Key] : ObjectType[Key] extends Maybe<Record<string, any>> ? ObjectType[Key] extends null ? Maybe<DeepPartial<ObjectType[Key]>> : DeepPartial<ObjectType[Key]> : ObjectType[Key];
}>;
declare type IsArray<Thing extends any, Y = true, N = false> = Thing extends Array<any> ? Y : N;
/**
 * A record that lives on each instance of a DOProxy to determine
 * if each data property on that DO is currently guaranteed to be up to date.
 * Any property that is read while not being up to date throws a run-time error to ensure the devs never use outdated data mistakenly
 */
export declare type UpToDateData<TNodeData extends Record<string, IData | DataDefaultFn>> = DeepPartial<{
    [Key in keyof TNodeData]: TNodeData[Key] extends IData<{
        TNodeData: Maybe<Array<any>>;
        TBoxedValue: any;
        TParsedValue: any;
        TValue: any;
    }> ? boolean : TNodeData[Key] extends IData<infer TDataArgs> ? TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn> ? UpToDateData<TDataArgs["TBoxedValue"]> : boolean : boolean;
}>;
/**
 * These methods are called automatically when using this lib's public methods like "useData"
 */
export interface IDOMethods {
    /**
     * Called when we get data from the backend for this particular DO instance, found by its id
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
export declare type NodeComputedFns<TNodeComputedFnsArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
}> = {
    [key in keyof TNodeComputedFnsArgs["TNodeComputedData"]]: (data: GetAllAvailableNodeDataType<TNodeComputedFnsArgs>) => TNodeComputedFnsArgs["TNodeComputedData"][key];
};
export declare type NodeRelationalFns<TNodeRelationalData extends NodeRelationalQueryBuilderRecord> = {
    [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key];
};
export interface INode<TNodeArgs extends {
    TNodeType: string;
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
    TNodeRelationalData: NodeRelationalQueryBuilderRecord;
} = any, TNodeComputedFns = NodeComputedFns<{
    TNodeData: TNodeArgs['TNodeData'] & NodeDefaultProps;
    TNodeComputedData: TNodeArgs['TNodeComputedData'];
}>, TNodeDO = NodeDO> {
    _isNodeDef: true;
    data: TNodeArgs['TNodeData'] & NodeDefaultProps;
    computed?: TNodeComputedFns;
    relational?: NodeRelationalFns<TNodeArgs['TNodeRelationalData']>;
    type: TNodeArgs['TNodeType'];
    repository: INodeRepository;
    do: new (data?: Record<string, any>) => TNodeDO;
    generateMockData?: () => DeepPartial<GetResultingDataTypeFromProperties<TNodeArgs["TNodeData"]>>;
}
/**
 * These inform the library how to query for data that is related to the node type we're building.
 * So, for example, if a user has meetings under them, one of the user's relational data properties is "meetings", which will be "IChildren".
 * This teaches the library how to interpret a query that asks for the user's meetings.
 */
export declare type NodeRelationalQueryBuilder<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> = IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord> | IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare type NodeRelationalQuery<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> = IOneToOneQuery<{
    TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord;
    TQueryBuilderOpts: any;
}> | IOneToManyQuery<{
    TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord;
    TQueryBuilderOpts: any;
}>;
export declare type IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> = TTargetNodeOrTargetNodeRecord extends INode ? {
    map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
} : TTargetNodeOrTargetNodeRecord extends Record<string, INode> ? {
    [Tkey in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]>;
    };
} : never;
export interface IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> {
    <TQueryBuilderOpts extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(queryBuilderOpts: TQueryBuilderOpts): IOneToOneQuery<{
        TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord;
        TQueryBuilderOpts: TQueryBuilderOpts;
    }>;
}
export interface IOneToOneQuery<TOneToOneQueryArgs extends {
    TTargetNodeOrTargetNodeRecord: INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>;
    TQueryBuilderOpts: IOneToOneQueryBuilderOpts<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>;
}> {
    _relational: RELATIONAL_TYPES.oneToOne;
    _relationshipName: string;
    queryBuilderOpts: TOneToOneQueryArgs["TQueryBuilderOpts"];
    def: TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"];
}
export declare type IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> = TTargetNodeOrTargetNodeRecord extends INode ? {
    map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
    filter?: ValidFilterForNode<TTargetNodeOrTargetNodeRecord>;
    pagination?: IQueryPagination;
    sort?: ValidSortForNode<TTargetNodeOrTargetNodeRecord>;
} : TTargetNodeOrTargetNodeRecord extends Record<string, INode> ? {
    [Tkey in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]>;
    };
} : never;
export interface IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> {
    <TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(queryBuilderOpts: TQueryBuilderOpts): IOneToManyQuery<{
        TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord;
        TQueryBuilderOpts: TQueryBuilderOpts;
    }>;
}
export interface IOneToManyQuery<TOneToManyQueryArgs extends {
    TTargetNodeOrTargetNodeRecord: INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>;
    TQueryBuilderOpts: IOneToManyQueryBuilderOpts<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>;
}> {
    _relational: RELATIONAL_TYPES.oneToMany;
    _relationshipName: string;
    queryBuilderOpts: TOneToManyQueryArgs['TQueryBuilderOpts'];
    def: TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'];
}
export declare enum DATA_TYPES {
    string = "s",
    maybeString = "mS",
    stringEnum = "sE",
    maybeStringEnum = "mSE",
    number = "n",
    maybeNumber = "mN",
    boolean = "b",
    maybeBoolean = "mB",
    object = "o",
    maybeObject = "mO",
    record = "r",
    maybeRecord = "mR",
    array = "a",
    maybeArray = "mA"
}
export declare enum RELATIONAL_TYPES {
    oneToOne = "oTO",
    oneToMany = "otM"
}
export interface IQueryPagination {
    itemsPerPage: number;
    page: number;
}
export declare type NodeRelationalQueryBuilderRecord = Record<string, NodeRelationalQueryBuilder>;
export interface INodeRepository {
    byId(id: string): NodeDO;
    onDataReceived(data: {
        id: string;
    } & Record<string, any>): void;
    onNodeDeleted(id: string): void;
}
export declare type FilterOperator = 
/** greater than or equal */
'_gte' | 
/** less than or equal */
'_lte' | 
/** equal */
'_eq' | 
/** greater than */
'_gt' | 
/** less than */
'_lt' | 
/** not equal */
'_neq' | 
/** contains */
'_contains' | 
/** does not contain */
'_ncontains';
/**
 * Returns the valid filter for a node
 * excluding properties which are arrays and records
 * and including properties which are nested in objects
 */
export declare type ValidFilterForNode<TNode extends INode> = ExtractNodeFilterData<TNode> | ExtractNodeRelationalDataFilter<TNode>;
export declare type ValidSortForNode<TNode extends INode> = ExtractNodeSortData<TNode> | ExtractNodeRelationalDataSort<TNode>;
export declare type ExtractNodeFilterData<TNode extends INode> = DeepPartial<{
    [TKey in keyof ExtractNodeDataWithDefaultProperties<TNode> as ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends IData<infer TDataArgs> ? IsArray<TDataArgs["TParsedValue"]> extends true ? never : TDataArgs["TBoxedValue"] extends undefined ? TKey : TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn> ? TKey : never : ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends DataDefaultFn ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeDataWithDefaultProperties<TNode>[TKey]>> extends true ? never : TKey : TKey]: TKey extends keyof GetResultingFilterDataTypeFromNodeDefinition<TNode> ? GetResultingFilterDataTypeFromNodeDefinition<TNode>[TKey] : never;
}>;
export declare type ExtractNodeSortData<TNode extends INode> = DeepPartial<{
    [TKey in keyof ExtractNodeDataWithDefaultProperties<TNode> as ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends IData<infer TDataArgs> ? IsArray<TDataArgs["TParsedValue"]> extends true ? never : TDataArgs["TBoxedValue"] extends undefined ? TKey : TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn> ? TKey : never : ExtractNodeDataWithDefaultProperties<TNode>[TKey] extends DataDefaultFn ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeDataWithDefaultProperties<TNode>[TKey]>> extends true ? never : TKey : TKey]: TKey extends keyof GetSortingDataTypeFromNodeDefinition<TNode> ? GetSortingDataTypeFromNodeDefinition<TNode>[TKey] : never;
}>;
export declare type QueryDefinitionTarget = {
    id: string;
    allowNullResult?: boolean;
} | {
    ids: Array<string>;
};
export declare type FilterObjectForNode<TNode extends INode> = ValidFilterForNode<TNode>;
export declare type SortObjectForNode<TNode extends INode> = ValidSortForNode<TNode>;
export declare type QueryDefinition<TQueryDefinitionArgs extends {
    TNode: INode;
    TMapFn: MapFnForNode<TQueryDefinitionArgs["TNode"]> | undefined;
    TQueryDefinitionTarget: QueryDefinitionTarget;
}> = {
    def: TQueryDefinitionArgs["TNode"];
    map: TQueryDefinitionArgs["TMapFn"];
    filter?: FilterObjectForNode<TQueryDefinitionArgs["TNode"]>;
    sort?: SortObjectForNode<TQueryDefinitionArgs["TNode"]>;
    target?: TQueryDefinitionArgs["TQueryDefinitionTarget"];
    pagination?: IQueryPagination;
    tokenName?: string;
};
export declare type QueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget> = Record<string, QueryDefinition<{
    TNode: TNode;
    TMapFn: TMapFn;
    TQueryDefinitionTarget: TQueryDefinitionTarget;
}> | INode | null>;
export declare type UseSubscriptionQueryDefinitionOpts = {
    doNotSuspend?: boolean;
};
export declare type UseSubscriptionQueryDefinition<TUseSubscriptionQueryDefinitionArgs extends {
    TNode: INode;
    TMapFn: MapFnForNode<TUseSubscriptionQueryDefinitionArgs['TNode']> | undefined;
    TQueryDefinitionTarget: QueryDefinitionTarget;
    TUseSubscriptionQueryDefinitionOpts: UseSubscriptionQueryDefinitionOpts;
}> = QueryDefinition<{
    TNode: TUseSubscriptionQueryDefinitionArgs["TNode"];
    TMapFn: TUseSubscriptionQueryDefinitionArgs["TMapFn"];
    TQueryDefinitionTarget: TUseSubscriptionQueryDefinitionArgs["TQueryDefinitionTarget"];
}> & {
    useSubOpts?: TUseSubscriptionQueryDefinitionArgs["TUseSubscriptionQueryDefinitionOpts"];
};
export declare type UseSubscriptionQueryDefinitions<TNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts> = Record<string, UseSubscriptionQueryDefinition<{
    TNode: TNode;
    TMapFn: TMapFn;
    TQueryDefinitionTarget: TQueryDefinitionTarget;
    TUseSubscriptionQueryDefinitionOpts: TUseSubscriptionQueryDefinitionOpts;
}> | INode | null>;
export declare type QueryDataReturn<TQueryDefinitions extends QueryDefinitions> = {
    [Key in keyof TQueryDefinitions]: IsMaybe<TQueryDefinitions[Key]> extends true ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>> : GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>;
};
export declare type GetResultingDataFromQueryDefinition<TQueryDefinition extends QueryDefinition<any> | INode | null> = TQueryDefinition extends {
    map: MapFn<any>;
} ? TQueryDefinition extends {
    def: infer TNode;
    map: infer TMapFn;
} ? TNode extends INode ? TMapFn extends MapFnForNode<TNode> ? TQueryDefinition extends {
    target?: {
        id: string;
    };
} ? TQueryDefinition extends {
    target?: {
        allowNullResult: true;
    };
} ? Maybe<ExtractQueriedDataFromMapFn<TMapFn, TNode>> : ExtractQueriedDataFromMapFn<TMapFn, TNode> : NodesCollection<ExtractQueriedDataFromMapFn<TMapFn, TNode>> : never : never : never : TQueryDefinition extends {
    def: INode;
} ? TQueryDefinition extends {
    def: infer TNode;
} ? TNode extends INode ? TQueryDefinition extends {
    target?: {
        id: string;
    };
} ? GetAllAvailableNodeDataType<{
    TNodeData: ExtractNodeData<TNode>;
    TNodeComputedData: ExtractNodeComputedData<TNode>;
}> & DataExpectedOnAllNodeResults<TNode> : NodesCollection<GetAllAvailableNodeDataType<{
    TNodeData: ExtractNodeData<TNode>;
    TNodeComputedData: ExtractNodeComputedData<TNode>;
}> & DataExpectedOnAllNodeResults<TNode>> : never : never : TQueryDefinition extends INode ? NodesCollection<GetAllAvailableNodeDataType<{
    TNodeData: ExtractNodeData<TQueryDefinition>;
    TNodeComputedData: ExtractNodeComputedData<TQueryDefinition>;
}> & DataExpectedOnAllNodeResults<TQueryDefinition>> : never;
export declare type UseSubscriptionReturn<TQueryDefinitions extends UseSubscriptionQueryDefinitions> = {
    data: {
        [key in keyof TQueryDefinitions]: TQueryDefinitions[key] extends {
            useSubOpts?: {
                doNotSuspend: true;
            };
        } ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[key]>> : IsMaybe<TQueryDefinitions[key]> extends true ? Maybe<GetResultingDataFromQueryDefinition<TQueryDefinitions[key]>> : GetResultingDataFromQueryDefinition<TQueryDefinitions[key]>;
    };
    querying: boolean;
    error: any;
};
export declare type MapFnForNode<TNode extends INode> = MapFn<{
    TNodeData: ExtractNodeData<TNode>;
    TNodeComputedData: ExtractNodeComputedData<TNode>;
    TNodeRelationalData: ExtractNodeRelationalData<TNode>;
}>;
export declare type MapFn<TMapFnArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
    TNodeRelationalData: NodeRelationalQueryBuilderRecord;
}> = (data: GetMapFnArgs<INode<TMapFnArgs & {
    TNodeType: any;
}>>) => RequestedData<TMapFnArgs>;
export declare type GetMapFnArgs<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? GetMapFnArgsFromProperties<TNodeArgs['TNodeData']> & TNodeArgs['TNodeRelationalData'] & GetMapFnArgsFromProperties<NodeDefaultProps> : never;
declare type GetMapFnArgsFromProperties<TProperties extends Record<string, IData | DataDefaultFn>> = {
    [key in keyof TProperties]: TProperties[key] extends IData<{
        TParsedValue: Maybe<Array<any>>;
        TValue: any;
        TBoxedValue: any;
    }> ? TProperties[key] : TProperties[key] extends IData<infer TDataArgs> ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn> ? <TMapFn extends MapFn<{
        TNodeData: TDataArgs['TBoxedValue'];
        TNodeComputedData: {};
        TNodeRelationalData: {};
    }>>(opts: {
        map: TMapFn;
    }) => TMapFn : TProperties[key] : TProperties[key];
};
declare type RequestedData<TRequestedDataArgs extends {
    TNodeData: Record<string, IData | DataDefaultFn>;
    TNodeComputedData: Record<string, any>;
}> = Partial<{
    [Key in keyof TRequestedDataArgs['TNodeData'] | keyof TRequestedDataArgs['TNodeComputedData']]: Key extends keyof TRequestedDataArgs['TNodeData'] ? TRequestedDataArgs['TNodeData'][Key] extends IData<{
        TParsedValue: Maybe<Array<any>>;
        TBoxedValue: any;
        TValue: any;
    }> ? TRequestedDataArgs['TNodeData'][Key] : TRequestedDataArgs['TNodeData'][Key] extends IData<infer TDataArgs> ? TDataArgs['TValue'] extends Maybe<Record<string, any>> ? MapFn<{
        TNodeData: TDataArgs['TValue'];
        TNodeComputedData: {};
        TNodeRelationalData: {};
    }> : TRequestedDataArgs['TNodeData'][Key] : TRequestedDataArgs['TNodeData'][Key] : Key extends keyof TRequestedDataArgs['TNodeComputedData'] ? TRequestedDataArgs['TNodeComputedData'][Key] : never;
} | {}>;
export declare type ExtractQueriedDataFromMapFn<TMapFn extends MapFnForNode<TNode>, TNode extends INode> = DataExpectedOnAllNodeResults<TNode> & ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TNode>;
declare type DataExpectedOnAllNodeResults<TNode extends INode> = {
    type: TNode['type'];
} & GetResultingDataTypeFromProperties<PropertiesQueriedForAllNodes> & ExtractNodeComputedData<TNode>;
declare type ExtractQueriedDataFromMapFnReturn<TMapFnReturn, TNode extends INode> = {
    [Key in keyof TMapFnReturn]: TMapFnReturn[Key] extends NodeRelationalQueryBuilder<any> ? never : TMapFnReturn[Key] extends IOneToOneQuery<any> ? ExtractQueriedDataFromOneToOneQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends IOneToManyQuery<any> ? ExtractQueriedDataFromOneToManyQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends MapFnForNode<TNode> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode> : TMapFnReturn[Key] extends IData | DataDefaultFn ? GetDataType<TMapFnReturn[Key]> : TMapFnReturn[Key] extends (opts: {
        map: MapFn<infer TMapFnArgs>;
    }) => MapFn<any> ? GetResultingDataTypeFromProperties<TMapFnArgs['TNodeData']> : TMapFnReturn[Key] extends MapFn<any> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode> : never;
};
declare type Prev = [never, 0, 1];
declare type ExtractQueriedDataFromOneToOneQuery<TOneToOneQuery extends IOneToOneQuery<any>, D extends Prev[number] = 1> = [
    D
] extends [never] ? never : TOneToOneQuery extends IOneToOneQuery<infer TOneToOneQueryArgs> ? IsMaybe<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> extends true ? TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<INode> ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<NonNullable<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>> ? Maybe<ExtractQueriedDataFromMapFn<TOneToOneQueryArgs['TQueryBuilderOpts']['map'], NonNullable<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>>> : never : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<Record<string, INode>> ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<NonNullable<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>> ? Maybe<ExtractResultsUnionFromOneToOneQueryBuilder<NonNullable<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>, TOneToOneQueryArgs['TQueryBuilderOpts'], Prev[D]>> : never : never : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> ? ExtractQueriedDataFromMapFn<TOneToOneQueryArgs['TQueryBuilderOpts']['map'], TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> : never : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Record<string, INode> ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> ? ExtractResultsUnionFromOneToOneQueryBuilder<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToOneQueryArgs['TQueryBuilderOpts'], Prev[D]> : never : never : never;
declare type ExtractQueriedDataFromOneToManyQuery<TOneToManyQuery extends IOneToManyQuery<any>, D extends Prev[number] = 1> = [
    D
] extends [never] ? never : TOneToManyQuery extends IOneToManyQuery<infer TOneToManyQueryArgs> ? IsMaybe<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']> extends true ? TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<INode> ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>> ? Maybe<NodesCollection<ExtractQueriedDataFromMapFn<TOneToManyQueryArgs['TQueryBuilderOpts']['map'], NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>>>> : never : TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<Record<string, INode>> ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>> ? Maybe<NodesCollection<ExtractResultsUnionFromOneToOneQueryBuilder<NonNullable<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>, TOneToManyQueryArgs['TQueryBuilderOpts'], Prev[D]>>> : never : never : TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']> ? NodesCollection<ExtractQueriedDataFromMapFn<TOneToManyQueryArgs['TQueryBuilderOpts']['map'], TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']>> : never : TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Record<string, INode> ? TOneToManyQueryArgs['TQueryBuilderOpts'] extends IOneToManyQueryBuilderOpts<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord']> ? NodesCollection<ExtractResultsUnionFromOneToOneQueryBuilder<TOneToManyQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToManyQueryArgs['TQueryBuilderOpts'], Prev[D]>> : never : never : never;
declare type ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord extends Record<string, INode>, TQueryBuilderOpts extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>, D extends Prev[number]> = ExtractObjectValues<{
    [key in keyof TQueryBuilderOpts]: key extends keyof TTargetNodeOrTargetNodeRecord ? TQueryBuilderOpts[key] extends IOneToOneQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]> ? ExtractQueriedDataFromOneToOneQuery<IOneToOneQuery<{
        TTargetNodeOrTargetNodeRecord: TTargetNodeOrTargetNodeRecord[key];
        TQueryBuilderOpts: {
            map: TQueryBuilderOpts[key]['map'];
        };
    }>, D> : never : never;
}>;
declare type ExtractObjectValues<TObject extends Record<string, any>> = TObject extends Record<string, infer TValueType> ? TValueType : never;
export declare type ExtractNodeData<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? TNodeArgs["TNodeData"] : never;
export declare type ExtractNodeDataWithDefaultProperties<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? TNodeArgs["TNodeData"] & NodeDefaultProps : never;
export declare type ExtractNodeRelationalDataFilter<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? DeepPartial<{
    [Tkey in keyof TNodeArgs['TNodeRelationalData']]: TNodeArgs['TNodeRelationalData'][Tkey] extends IOneToManyQueryBuilder<infer TOneToManyRelationalNode> ? TOneToManyRelationalNode extends INode<any> ? ExtractNodeFilterData<TOneToManyRelationalNode> : never : TNodeArgs['TNodeRelationalData'][Tkey] extends IOneToOneQueryBuilder<infer TOneToOneRelationalNode> ? TOneToOneRelationalNode extends INode<any> ? ExtractNodeFilterData<TOneToOneRelationalNode> : never : never;
}> : never;
export declare type ExtractNodeRelationalDataSort<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? DeepPartial<{
    [Tkey in keyof TNodeArgs['TNodeRelationalData']]: TNodeArgs['TNodeRelationalData'][Tkey] extends IOneToManyQueryBuilder<infer TOneToManyRelationalNode> ? TOneToManyRelationalNode extends INode<any> ? ExtractNodeSortData<TOneToManyRelationalNode> : never : TNodeArgs['TNodeRelationalData'][Tkey] extends IOneToOneQueryBuilder<infer TOneToOneRelationalNode> ? TOneToOneRelationalNode extends INode<any> ? ExtractNodeSortData<TOneToOneRelationalNode> : never : never;
}> : never;
declare type ExtractNodeComputedData<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? TNodeArgs["TNodeComputedData"] : never;
declare type ExtractNodeRelationalData<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? TNodeArgs["TNodeRelationalData"] : never;
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
export declare type BaseQueryRecordEntry = {
    def: INode;
    properties: Array<string>;
    relational?: RelationalQueryRecord;
    filter?: ValidFilterForNode<INode>;
    sort?: ValidFilterForNode<INode>;
    pagination?: IQueryPagination;
};
export declare type QueryRecordEntry = BaseQueryRecordEntry & {
    pagination?: IQueryPagination;
    ids?: Array<string>;
    id?: string;
    allowNullResult?: boolean;
};
export declare type RelationalQueryRecordEntry = {
    _relationshipName: string;
} & ((BaseQueryRecordEntry & {
    oneToOne: true;
}) | (BaseQueryRecordEntry & {
    oneToMany: true;
}));
export declare type QueryRecord = Record<string, QueryRecordEntry>;
export declare type RelationalQueryRecord = Record<string, RelationalQueryRecordEntry>;
export interface IDOProxy {
    updateRelationalResults(newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>): void;
}
export {};
