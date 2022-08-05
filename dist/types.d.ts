import { DEFAULT_NODE_PROPERTIES } from './consts';
import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { generateQuerier, generateSubscriber } from './queriers';
import { createQueryManager } from './QueryManager';
import { createTransaction } from './transaction/transaction';
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
    }) => void;
    skipInitialQuery?: boolean;
    queryId?: string;
    batchKey?: string;
};
export declare type NodeDefaultProps = typeof DEFAULT_NODE_PROPERTIES;
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
    DOProxyGenerator: ReturnType<typeof createDOProxyGenerator>;
    DOFactory: ReturnType<typeof createDOFactory>;
    QueryManager: ReturnType<typeof createQueryManager>;
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
    [key in keyof TProperties]: TProperties[key] extends IData<infer TDataArgs> ? TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn> ? IsMaybe<TDataArgs["TParsedValue"]> extends true ? Maybe<GetAllAvailableNodeDataTypeWithoutDefaultProps<TDataArgs["TBoxedValue"], {}>> : GetAllAvailableNodeDataTypeWithoutDefaultProps<TDataArgs["TBoxedValue"], {}> : TDataArgs["TParsedValue"] extends Array<infer TArrayItemType> ? IsMaybe<TDataArgs["TParsedValue"]> extends true ? Maybe<Array<TArrayItemType>> : Array<TArrayItemType> : TDataArgs["TParsedValue"] : TProperties[key] extends DataDefaultFn ? GetParsedValueTypeFromDefaultFn<TProperties[key]> : never;
};
export declare type GetResultingDataTypeFromNodeDefinition<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? GetResultingDataTypeFromProperties<TNodeArgs["TNodeData"]> : never;
/**
 * Utility to extract the expected data type of a node based on its' properties and computed data
 * For data resulting from property definitions only, use GetResultingDataTypeFromProperties
 */
export declare type GetAllAvailableNodeDataType<TData extends Record<string, IData | DataDefaultFn>, TComputedData extends Record<string, any>> = GetResultingDataTypeFromProperties<TData & NodeDefaultProps> & TComputedData;
declare type GetAllAvailableNodeDataTypeWithoutDefaultProps<TData extends Record<string, IData | DataDefaultFn>, TComputedData extends Record<string, any>> = GetResultingDataTypeFromProperties<TData> & TComputedData;
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
    [key in keyof TNodeComputedFnsArgs["TNodeComputedData"]]: (data: GetAllAvailableNodeDataType<TNodeComputedFnsArgs["TNodeData"], TNodeComputedFnsArgs["TNodeComputedData"]>) => TNodeComputedFnsArgs["TNodeComputedData"][key];
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
}> | IOneToManyQuery<TTargetNodeOrTargetNodeRecord, any>;
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
} : TTargetNodeOrTargetNodeRecord extends Record<string, INode> ? {
    [Tkey in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]>;
    };
} : never;
export interface IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>> {
    <TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(queryBuilderOpts: TQueryBuilderOpts): IOneToManyQuery<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts>;
}
export interface IOneToManyQuery<TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode> | Record<string, INode> | Maybe<Record<string, INode>>, TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>> {
    _relational: RELATIONAL_TYPES.oneToMany;
    _relationshipName: string;
    queryBuilderOpts: TQueryBuilderOpts;
    def: TTargetNodeOrTargetNodeRecord;
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
}
export declare type NodeRelationalQueryBuilderRecord = Record<string, NodeRelationalQueryBuilder>;
export interface INodeRepository {
    byId(id: string): NodeDO;
    onDataReceived(data: {
        id: string;
    } & Record<string, any>): void;
    onNodeDeleted(id: string): void;
}
/**
 * Returns the valid filter for a node
 * excluding properties which are arrays and records
 * and including properties which are nested in objects
 */
export declare type ValidFilterForNode<TNode extends INode> = DeepPartial<{
    [TKey in keyof ExtractNodeData<TNode> as ExtractNodeData<TNode>[TKey] extends IData<infer TDataArgs> ? IsArray<TDataArgs["TParsedValue"]> extends true ? never : TDataArgs["TBoxedValue"] extends undefined ? TKey : TDataArgs["TBoxedValue"] extends Record<string, IData | DataDefaultFn> ? TKey : never : ExtractNodeData<TNode>[TKey] extends DataDefaultFn ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeData<TNode>[TKey]>> extends true ? never : TKey : TKey]: TKey extends keyof GetResultingDataTypeFromNodeDefinition<TNode> ? GetResultingDataTypeFromNodeDefinition<TNode>[TKey] : never;
}>;
export declare type QueryDefinitionTarget = {
    id: string;
    allowNullResult?: boolean;
} | {
    ids: Array<string>;
};
export declare type QueryDefinition<TQueryDefinitionArgs extends {
    TNode: INode;
    TMapFn: MapFnForNode<TQueryDefinitionArgs["TNode"]> | undefined;
    TQueryDefinitionTarget: QueryDefinitionTarget;
}> = {
    def: TQueryDefinitionArgs["TNode"];
    map: TQueryDefinitionArgs["TMapFn"];
    filter?: ValidFilterForNode<TQueryDefinitionArgs["TNode"]>;
    target?: TQueryDefinitionArgs["TQueryDefinitionTarget"];
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
} ? Maybe<ExtractQueriedDataFromMapFn<TMapFn, TNode>> : ExtractQueriedDataFromMapFn<TMapFn, TNode> : Array<ExtractQueriedDataFromMapFn<TMapFn, TNode>> : never : never : never : TQueryDefinition extends {
    def: INode;
} ? TQueryDefinition extends {
    def: infer TNode;
} ? TNode extends INode ? TQueryDefinition extends {
    target?: {
        id: string;
    };
} ? GetAllAvailableNodeDataType<ExtractNodeData<TNode>, ExtractNodeComputedData<TNode>> : Array<GetAllAvailableNodeDataType<ExtractNodeData<TNode>, ExtractNodeComputedData<TNode>>> : never : never : TQueryDefinition extends INode ? Array<GetAllAvailableNodeDataType<ExtractNodeData<TQueryDefinition>, ExtractNodeComputedData<TQueryDefinition>>> : never;
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
export declare type GetMapFnArgs<TNode extends INode> = TNode extends INode<infer TNodeArgs> ? {
    [key in keyof TNodeArgs['TNodeData']]: TNodeArgs['TNodeData'][key] extends IData<{
        TParsedValue: Maybe<Array<any>>;
        TValue: any;
        TBoxedValue: any;
    }> ? TNodeArgs['TNodeData'][key] : TNodeArgs['TNodeData'][key] extends IData<infer TDataArgs> ? TDataArgs['TBoxedValue'] extends Record<string, IData | DataDefaultFn> ? <TMapFn extends MapFn<{
        TNodeData: TDataArgs['TBoxedValue'];
        TNodeComputedData: {};
        TNodeRelationalData: {};
    }>>(opts: {
        map: TMapFn;
    }) => TMapFn : TNodeArgs['TNodeData'][key] : TNodeArgs['TNodeData'][key];
} & TNodeArgs['TNodeRelationalData'] : never;
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
export declare type ExtractQueriedDataFromMapFn<TMapFn extends MapFnForNode<TNode>, TNode extends INode> = {
    type: TNode['type'];
} & ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TNode> & ExtractNodeComputedData<TNode>;
declare type ExtractQueriedDataFromMapFnReturn<TMapFnReturn, TNode extends INode> = {
    [Key in keyof TMapFnReturn]: TMapFnReturn[Key] extends NodeRelationalQueryBuilder<any> ? never : TMapFnReturn[Key] extends IOneToOneQuery<any> ? ExtractQueriedDataFromOneToOneQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends IOneToManyQuery<any, any> ? ExtractQueriedDataFromOneToManyQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends MapFnForNode<TNode> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode> : TMapFnReturn[Key] extends IData | DataDefaultFn ? GetDataType<TMapFnReturn[Key]> : TMapFnReturn[Key] extends (opts: {
        map: MapFn<infer TMapFnArgs>;
    }) => MapFn<any> ? GetResultingDataTypeFromProperties<TMapFnArgs['TNodeData']> : TMapFnReturn[Key] extends MapFn<any> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TNode> : never;
};
declare type Prev = [never, 0, 1];
declare type ExtractQueriedDataFromOneToOneQuery<TOneToOneQuery extends IOneToOneQuery<any>, D extends Prev[number] = 1> = [
    D
] extends [never] ? never : TOneToOneQuery extends IOneToOneQuery<infer TOneToOneQueryArgs> ? IsMaybe<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> extends true ? TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<INode> ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<NonNullable<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>> ? Maybe<ExtractQueriedDataFromMapFn<TOneToOneQueryArgs['TQueryBuilderOpts']['map'], NonNullable<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>>> : never : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Maybe<Record<string, INode>> ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<NonNullable<TOneToOneQueryArgs["TTargetNodeOrTargetNodeRecord"]>> ? Maybe<ExtractResultsUnionFromOneToOneQueryBuilder<NonNullable<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']>, TOneToOneQueryArgs['TQueryBuilderOpts'], Prev[D]>> : never : never : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends INode ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> ? ExtractQueriedDataFromMapFn<TOneToOneQueryArgs['TQueryBuilderOpts']['map'], TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> : never : TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'] extends Record<string, INode> ? TOneToOneQueryArgs['TQueryBuilderOpts'] extends IOneToOneQueryBuilderOpts<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord']> ? ExtractResultsUnionFromOneToOneQueryBuilder<TOneToOneQueryArgs['TTargetNodeOrTargetNodeRecord'], TOneToOneQueryArgs['TQueryBuilderOpts'], Prev[D]> : never : never : never;
declare type ExtractQueriedDataFromOneToManyQuery<TOneToManyQuery extends IOneToManyQuery<any, any>, D extends Prev[number] = 1> = [
    D
] extends [never] ? never : TOneToManyQuery extends IOneToManyQuery<infer TTargetNodeOrTargetNodeRecord, infer TQueryBuilderOpts> ? IsMaybe<TTargetNodeOrTargetNodeRecord> extends true ? TTargetNodeOrTargetNodeRecord extends INode ? TQueryBuilderOpts extends {
    map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
} ? Maybe<Array<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], NonNullable<TTargetNodeOrTargetNodeRecord>>>> : never : TTargetNodeOrTargetNodeRecord extends Record<string, INode> ? TQueryBuilderOpts extends {
    [key in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>;
    };
} ? Maybe<Array<ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>>> : never : never : TTargetNodeOrTargetNodeRecord extends INode ? TQueryBuilderOpts extends {
    map: MapFnForNode<TTargetNodeOrTargetNodeRecord>;
} ? Array<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], TTargetNodeOrTargetNodeRecord>> : never : TTargetNodeOrTargetNodeRecord extends Record<string, INode> ? TQueryBuilderOpts extends {
    [key in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>;
    };
} ? Array<ExtractResultsUnionFromOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>> : never : never : never;
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
    relational?: Record<string, RelationalQueryRecordEntry>;
};
export declare type QueryRecordEntry = BaseQueryRecordEntry & {
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
export interface IDOProxy {
    updateRelationalResults(newRelationalResults: Maybe<Record<string, IDOProxy | Array<IDOProxy>>>): void;
}
export {};
