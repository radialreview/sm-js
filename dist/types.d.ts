import { createDOFactory } from './DO';
import { createDOProxyGenerator } from './DOProxyGenerator';
import { generateQuerier, generateSubscriber } from './smQueriers';
import { createSMQueryManager } from './SMQueryManager';
import { createTransaction } from './transaction/transaction';
export declare type BOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export declare type Maybe<T> = T | null;
export declare type IsMaybe<Type> = null extends Type ? true : false;
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
    query: ReturnType<typeof generateQuerier>;
    subscribe: ReturnType<typeof generateSubscriber>;
    transaction: ReturnType<typeof createTransaction>;
    gqlClient: ISMGQLClient;
    plugins: Array<SMPlugin> | undefined;
    DOProxyGenerator: ReturnType<typeof createDOProxyGenerator>;
    DOFactory: ReturnType<typeof createDOFactory>;
    SMQueryManager: ReturnType<typeof createSMQueryManager>;
    def<TNodeType extends string, TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, NodeMutationFn>>(def: NodeDefArgs<TNodeType, TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>): ISMNode<TNodeType, TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations>;
}
export declare type NodeDefArgs<TNodeType extends string, TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn>> = {
    type: TNodeType;
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
export declare type GetParsedValueTypeFromDefaultFn<TDefaultFn extends (_default: any) => ISMData> = TDefaultFn extends (_default: any) => ISMData<infer TParsedValue, any, any> ? TParsedValue : never;
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
export declare type GetResultingDataTypeFromProperties<TProperties extends Record<string, ISMData | SMDataDefaultFn>> = {
    [key in keyof TProperties]: TProperties[key] extends ISMData<infer TParsedValue, any, infer TBoxedValue> ? TBoxedValue extends Record<string, ISMData | SMDataDefaultFn> ? IsMaybe<TParsedValue> extends true ? Maybe<GetAllAvailableNodeDataType<TBoxedValue, {}>> : GetAllAvailableNodeDataType<TBoxedValue, {}> : TParsedValue extends Array<infer TArrayItemType> ? IsMaybe<TParsedValue> extends true ? Maybe<Array<TArrayItemType>> : Array<TArrayItemType> : TParsedValue : TProperties[key] extends SMDataDefaultFn ? GetParsedValueTypeFromDefaultFn<TProperties[key]> : never;
};
export declare type GetResultingDataTypeFromNodeDefinition<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, infer TProperties> ? GetResultingDataTypeFromProperties<TProperties> : never;
/**
 * Utility to extract the expected data type of a node based on its' properties and computed data
 * For data resulting from property definitions only, use GetResultingDataTypeFromProperties
 */
export declare type GetAllAvailableNodeDataType<TSMData extends Record<string, ISMData | SMDataDefaultFn>, TComputedData extends Record<string, any>> = GetResultingDataTypeFromProperties<TSMData> & TComputedData;
/**
 * Takes in any object and returns a Partial of that object type
 * for nested objects, those will also be turned into partials
 */
export declare type DeepPartial<ObjectType extends Record<string, any>> = Partial<{
    [Key in keyof ObjectType]: ObjectType[Key] extends Maybe<Array<any>> ? ObjectType[Key] : ObjectType[Key] extends Maybe<Record<string, any>> ? ObjectType[Key] extends null ? Maybe<DeepPartial<ObjectType[Key]>> : DeepPartial<ObjectType[Key]> : ObjectType[Key];
}>;
declare type IsArray<Thing extends any, Y = true, N = false> = Thing extends Array<any> ? Y : N;
declare type IsObject<TObject extends Record<string, any>, Y = true, N = false> = IsArray<TObject> extends true ? false : TObject extends Record<string, any> ? Y : N;
/**
 * Note: this is used solely for obtaining the keys in an object converted to the dot notation
 * it was not possible to have the correct value types be mapped over, which is why all values are "never"
 */
declare type ConvertToRootLevelDotNotation<TObject extends Record<string, any>, TPrefix extends string = ''> = {
    [TKey in keyof TObject as IsObject<TObject[TKey]> extends true ? TKey extends string ? TPrefix extends '' ? keyof ConvertToRootLevelDotNotation<TObject[TKey], TKey> : keyof ConvertToRootLevelDotNotation<TObject[TKey], `${TPrefix}.${TKey}`> : never : never]: never;
} & {
    [TKey in keyof TObject as IsObject<TObject[TKey]> extends true ? never : IsArray<TObject[TKey]> extends true ? never : TPrefix extends '' ? TKey : TKey extends string ? `${TPrefix}.${TKey}` : never]: never;
};
declare type ValidReferenceIdProp<TObject extends Record<string, any>> = keyof ConvertToRootLevelDotNotation<TObject>;
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
export declare type ValidReferenceIdPropFromNode<TSMNode extends ISMNode> = ValidReferenceIdProp<GetResultingDataTypeFromNodeDefinition<TSMNode>>;
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
    [key in keyof TNodeComputedData]: (data: GetAllAvailableNodeDataType<TNodeData, TNodeComputedData>) => TNodeComputedData[key];
};
export declare type NodeRelationalFns<TNodeRelationalData extends NodeRelationalQueryBuilderRecord> = {
    [key in keyof TNodeRelationalData]: () => TNodeRelationalData[key];
};
export declare type NodeMutationFn = () => Promise<any>;
export interface ISMNode<TNodeType extends string = any, TNodeData extends Record<string, ISMData | SMDataDefaultFn> = {}, TNodeComputedData extends Record<string, any> = {}, TNodeRelationalData extends NodeRelationalQueryBuilderRecord = {}, TNodeMutations extends Record<string, /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn> = {}, TNodeComputedFns = NodeComputedFns<TNodeData, TNodeComputedData>, TNodeDO = NodeDO> {
    _isSMNodeDef: true;
    smData: TNodeData;
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
export declare type NodeRelationalQueryBuilder<TOriginNode extends ISMNode> = IByReferenceQueryBuilder<TOriginNode, ISMNode> | IChildrenQueryBuilder<TOriginNode>;
export declare type NodeRelationalQuery<TOriginNode extends ISMNode> = IChildrenQuery<TOriginNode, any> | IByReferenceQuery<TOriginNode, any, any>;
export declare type ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord extends ISMNode | Maybe<ISMNode> | Record<string, ISMNode> | Maybe<Record<string, ISMNode>>> = TTargetNodeOrTargetNodeRecord extends ISMNode ? {
    map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
} : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode> ? {
    [Tkey in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[Tkey]>;
    };
} : never;
export interface IByReferenceQueryBuilder<TOriginNode extends ISMNode, TTargetNodeOrTargetNodeRecord extends ISMNode | Maybe<ISMNode> | Record<string, ISMNode> | Maybe<Record<string, ISMNode>>> {
    <TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>>(queryBuilderOpts: TQueryBuilderOpts): IByReferenceQuery<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts>;
}
export declare enum SM_DATA_TYPES {
    string = "s",
    maybeString = "mS",
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
export declare enum SM_RELATIONAL_TYPES {
    byReference = "bR",
    children = "bP"
}
export interface IByReferenceQuery<TOriginNode extends ISMNode, TTargetNodeOrTargetNodeRecord extends ISMNode | Maybe<ISMNode> | Record<string, ISMNode> | Maybe<Record<string, ISMNode>>, TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>> {
    _smRelational: SM_RELATIONAL_TYPES.byReference;
    idProp: ValidReferenceIdPropFromNode<TOriginNode>;
    queryBuilderOpts: TQueryBuilderOpts;
    def: TTargetNodeOrTargetNodeRecord;
}
export interface IChildrenQueryBuilder<TSMNode extends ISMNode> {
    <TMapFn extends MapFnForNode<TSMNode>>(opts: {
        map: TMapFn;
        pagination?: ISMQueryPagination;
    }): IChildrenQuery<TSMNode, TMapFn>;
}
export interface IChildrenQuery<TSMNode extends ISMNode, TMapFn extends MapFnForNode<TSMNode>> {
    _smRelational: SM_RELATIONAL_TYPES.children;
    def: TSMNode;
    filtersAndPagination?: ISMQueryPagination;
    map: TMapFn;
    pagination?: ISMQueryPagination;
    depth?: number;
}
export interface ISMQueryPagination {
}
export declare type NodeRelationalQueryBuilderRecord = Record<string, NodeRelationalQueryBuilder>;
export interface ISMNodeRepository {
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
export declare type ValidFilterForNode<TSMNode extends ISMNode> = DeepPartial<{
    [TKey in keyof ExtractNodeData<TSMNode> as ExtractNodeData<TSMNode>[TKey] extends ISMData<infer TSMDataParsedValueType, any, infer TBoxedValue> ? IsArray<TSMDataParsedValueType> extends true ? never : TBoxedValue extends undefined ? TKey : TBoxedValue extends Record<string, ISMData | SMDataDefaultFn> ? TKey : never : ExtractNodeData<TSMNode>[TKey] extends SMDataDefaultFn ? IsArray<GetParsedValueTypeFromDefaultFn<ExtractNodeData<TSMNode>[TKey]>> extends true ? never : TKey : TKey]: TKey extends keyof GetResultingDataTypeFromNodeDefinition<TSMNode> ? GetResultingDataTypeFromNodeDefinition<TSMNode>[TKey] : never;
}>;
export declare type QueryDefinitionTarget = {
    underIds: Array<string>;
    depth?: number;
} | {
    depth: number;
} | {
    id: string;
} | {
    ids: Array<string>;
};
export declare type QueryDefinition<TSMNode extends ISMNode, TMapFn extends MapFnForNode<TSMNode> | undefined, TQueryDefinitionTarget extends QueryDefinitionTarget> = {
    def: TSMNode;
    map: TMapFn;
    filter?: ValidFilterForNode<TSMNode>;
    target?: TQueryDefinitionTarget;
};
export declare type QueryDefinitions = Record<string, QueryDefinition | ISMNode>;
export declare type QueryDataReturn<TQueryDefinitions extends QueryDefinitions> = {
    [Key in keyof TQueryDefinitions]: GetResultingDataFromQueryDefinition<TQueryDefinitions[Key]>;
};
export declare type GetResultingDataFromQueryDefinition<TQueryDefinition extends QueryDefinition<any, any, any> | ISMNode> = TQueryDefinition extends {
    map: MapFn<any, any, any>;
} ? TQueryDefinition extends {
    def: infer TSMNode;
    map: infer TMapFn;
} ? TSMNode extends ISMNode ? TMapFn extends MapFnForNode<TSMNode> ? TQueryDefinition extends {
    target?: {
        id: string;
    };
} ? ExtractQueriedDataFromMapFn<TMapFn, TSMNode> : Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>> : never : never : never : TQueryDefinition extends {
    def: ISMNode;
} ? TQueryDefinition extends {
    def: infer TSMNode;
} ? TSMNode extends ISMNode ? TQueryDefinition extends {
    target?: {
        id: string;
    };
} ? GetAllAvailableNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>> : Array<GetAllAvailableNodeDataType<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>>> : never : never : TQueryDefinition extends ISMNode ? Array<GetAllAvailableNodeDataType<ExtractNodeData<TQueryDefinition>, ExtractNodeComputedData<TQueryDefinition>>> : never;
export declare type UseSubscriptionReturn<TQueryDefinitions, TOpts> = TOpts extends {
    doNotSuspend: true;
} ? {
    data?: QueryDataReturn<TQueryDefinitions>;
    querying: boolean;
} : {
    data: QueryDataReturn<TQueryDefinitions>;
    querying: boolean;
};
export declare type MapFnForNode<TSMNode extends ISMNode> = MapFn<ExtractNodeData<TSMNode>, ExtractNodeComputedData<TSMNode>, ExtractNodeRelationalData<TSMNode>>;
export declare type MapFn<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData, TNodeRelationalData extends NodeRelationalQueryBuilderRecord> = (data: GetMapFnArgs<ISMNode<any, TNodeData, TNodeComputedData, TNodeRelationalData>>) => RequestedData<TNodeData, TNodeComputedData>;
export declare type GetMapFnArgs<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, infer TNodeData, any, infer TNodeRelationalData> ? {
    [key in keyof TNodeData]: TNodeData[key] extends ISMData<Maybe<Array<any>>> ? TNodeData[key] : TNodeData[key] extends ISMData<any, any, Record<string, ISMData | SMDataDefaultFn>> ? <TMapFn extends MapFn<GetSMBoxedValue<TNodeData[key]>, {}, {}>>(opts: {
        map: TMapFn;
    }) => TMapFn : TNodeData[key];
} & TNodeRelationalData : never;
declare type RequestedData<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>> = Partial<{
    [Key in keyof TNodeData | keyof TNodeComputedData]: Key extends keyof TNodeData ? TNodeData[Key] extends ISMData<Maybe<Array<any>>> ? TNodeData[Key] : TNodeData[Key] extends ISMData<Maybe<Record<string, any>>> ? MapFn<GetSMDataType<TNodeData[Key]>, {}, {}> : TNodeData[Key] : Key extends keyof TNodeComputedData ? TNodeComputedData[Key] : never;
} | {}>;
export declare type ExtractQueriedDataFromMapFn<TMapFn extends MapFnForNode<TSMNode>, TSMNode extends ISMNode> = {
    type: TSMNode['type'];
} & ExtractQueriedDataFromMapFnReturn<ReturnType<TMapFn>, TSMNode> & ExtractNodeComputedData<TSMNode>;
declare type ExtractQueriedDataFromMapFnReturn<TMapFnReturn, TSMNode extends ISMNode> = {
    [Key in keyof TMapFnReturn]: TMapFnReturn[Key] extends NodeRelationalQueryBuilder<any> ? never : TMapFnReturn[Key] extends IByReferenceQuery<any, any, any> ? ExtractQueriedDataFromByReferenceQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends IChildrenQuery<any, any> ? ExtractQueriedDataFromChildrenQuery<TMapFnReturn[Key]> : TMapFnReturn[Key] extends MapFnForNode<TSMNode> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode> : TMapFnReturn[Key] extends ISMData | SMDataDefaultFn ? GetSMDataType<TMapFnReturn[Key]> : TMapFnReturn[Key] extends (opts: {
        map: MapFn<infer TBoxedValue, any, any>;
    }) => MapFn<any, any, any> ? GetResultingDataTypeFromProperties<TBoxedValue> : TMapFnReturn[Key] extends MapFn<any, any, any> ? ExtractQueriedDataFromMapFn<TMapFnReturn[Key], TSMNode> : never;
};
declare type ExtractQueriedDataFromChildrenQuery<TChildrenQuery extends IChildrenQuery<any, any>> = TChildrenQuery extends IChildrenQuery<infer TSMNode, infer TMapFn> ? Array<ExtractQueriedDataFromMapFn<TMapFn, TSMNode>> : never;
declare type Prev = [never, 0, 1];
declare type ExtractQueriedDataFromByReferenceQuery<TByReferenceQuery extends IByReferenceQuery<any, any, any>, D extends Prev[number] = 1> = [
    D
] extends [never] ? never : TByReferenceQuery extends IByReferenceQuery<infer TOriginNode, infer TTargetNodeOrTargetNodeRecord, infer TQueryBuilderOpts> ? IsMaybe<TTargetNodeOrTargetNodeRecord> extends true ? TTargetNodeOrTargetNodeRecord extends ISMNode ? TQueryBuilderOpts extends {
    map: MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>;
} ? Maybe<ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], NonNullable<TTargetNodeOrTargetNodeRecord>>> : never : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode> ? TQueryBuilderOpts extends {
    [key in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>;
    };
} ? Maybe<ExtractResultsUnionFromReferenceBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]>> : never : never : TTargetNodeOrTargetNodeRecord extends ISMNode ? TQueryBuilderOpts extends {
    map: MapFnForNode<TTargetNodeOrTargetNodeRecord>;
} ? ExtractQueriedDataFromMapFn<TQueryBuilderOpts['map'], TTargetNodeOrTargetNodeRecord> : never : TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode> ? TQueryBuilderOpts extends {
    [key in keyof TTargetNodeOrTargetNodeRecord]: {
        map: MapFnForNode<TTargetNodeOrTargetNodeRecord[key]>;
    };
} ? ExtractResultsUnionFromReferenceBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord, TQueryBuilderOpts, Prev[D]> : never : never : never;
declare type ExtractResultsUnionFromReferenceBuilder<TOriginNode extends ISMNode, TTargetNodeOrTargetNodeRecord extends Record<string, ISMNode>, TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord>, D extends Prev[number]> = ExtractObjectValues<{
    [key in keyof TQueryBuilderOpts]: key extends keyof TTargetNodeOrTargetNodeRecord ? TQueryBuilderOpts[key] extends ByReferenceQueryBuilderOpts<TTargetNodeOrTargetNodeRecord[key]> ? ExtractQueriedDataFromByReferenceQuery<IByReferenceQuery<TOriginNode, TTargetNodeOrTargetNodeRecord[key], {
        map: TQueryBuilderOpts[key]['map'];
    }>, D> : never : never;
}>;
declare type ExtractObjectValues<TObject extends Record<string, any>> = TObject extends Record<string, infer TValueType> ? TValueType : never;
export declare type ExtractNodeData<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, infer TNodeData> ? TNodeData : never;
declare type ExtractNodeComputedData<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, any, infer TNodeComputedData> ? TNodeComputedData : never;
declare type ExtractNodeRelationalData<TSMNode extends ISMNode> = TSMNode extends ISMNode<any, any, any, infer TNodeRelationalData> ? TNodeRelationalData : never;
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
