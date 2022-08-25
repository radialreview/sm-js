<<<<<<< HEAD
import { GetResultingDataTypeFromProperties, GetDataType, IOneToOneQueryBuilder, IOneToManyQueryBuilder, IData, INode, MapFnForNode, Maybe, QueryDefinitionTarget, DataDefaultFn, DATA_TYPES, UseSubscriptionQueryDefinitionOpts, UseSubscriptionQueryDefinition } from './types';
export declare class Data<TDataArgs extends {
    TParsedValue: any;
    TValue: any;
    TBoxedValue: IData | DataDefaultFn | Record<string, IData | DataDefaultFn> | undefined;
}> implements IData<TDataArgs> {
    type: DATA_TYPES;
    parser: (value: TDataArgs['TValue']) => TDataArgs['TParsedValue'];
    boxedValue: TDataArgs['TBoxedValue'];
    defaultValue: Maybe<TDataArgs['TParsedValue']>;
    isOptional: boolean;
    acceptableValues?: Array<TDataArgs['TParsedValue']>;
    constructor(opts: {
        type: DATA_TYPES;
        parser: (value: TDataArgs['TValue']) => TDataArgs['TParsedValue'];
        boxedValue?: TDataArgs['TBoxedValue'];
        defaultValue?: TDataArgs['TParsedValue'];
        isOptional: boolean;
        acceptableValues?: Array<TDataArgs['TParsedValue']>;
    });
}
/**
 * data serve 2 purposes:
 * 1) they convert strings from the backend into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the data types used,
 */
export declare const string: {
    (defaultValue: string): IData<{
        TValue: string;
        TParsedValue: string;
        TBoxedValue: undefined;
    }>;
    _default: IData<{
        TValue: string;
        TParsedValue: string;
        TBoxedValue: undefined;
    }>;
    optional: IData<{
        TValue: Maybe<string>;
        TParsedValue: Maybe<string>;
        TBoxedValue: undefined;
    }>;
};
export declare const stringEnum: {
    <TEnumEntry extends string, TEnumType extends TEnumEntry[] = TEnumEntry[]>(enumValues: TEnumType): IData<{
        TValue: TEnumType[number];
        TParsedValue: TEnumType[number];
        TBoxedValue: undefined;
    }>;
    optional<TEnumEntry_1 extends string, TEnumType_1 extends TEnumEntry_1[] = TEnumEntry_1[]>(enumValues: TEnumType_1): IData<{
        TValue: Maybe<TEnumType_1[number]>;
        TParsedValue: Maybe<TEnumType_1[number]>;
        TBoxedValue: undefined;
    }>;
};
export declare const number: {
    (defaultValue: number): IData<{
        TValue: string;
        TParsedValue: number;
        TBoxedValue: undefined;
    }>;
    _default: IData<{
        TValue: string;
        TParsedValue: number;
        TBoxedValue: undefined;
    }>;
    optional: IData<{
        TValue: Maybe<string>;
        TParsedValue: Maybe<number>;
        TBoxedValue: undefined;
    }>;
};
export declare const boolean: {
    <TDefaultValue extends boolean>(defaultValue?: TDefaultValue | undefined): IData<{
        TValue: string | boolean;
        TParsedValue: boolean;
        TBoxedValue: undefined;
    }>;
    _default: IData<{
        TValue: string | boolean;
        TParsedValue: boolean;
        TBoxedValue: undefined;
    }>;
    optional: IData<{
        TValue: Maybe<string | boolean>;
        TParsedValue: Maybe<boolean>;
        TBoxedValue: undefined;
    }>;
};
declare type ObjectDataType = {
    <TBoxedValue extends Record<string, IData | DataDefaultFn>>(boxedValue: TBoxedValue): IData<{
        TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
        TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
        TBoxedValue: TBoxedValue;
    }>;
    _default: any;
    optional: <TBoxedValue extends Record<string, IData | DataDefaultFn>>(boxedValue: TBoxedValue) => IData<{
        TValue: Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>;
        TParsedValue: Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>;
        TBoxedValue: TBoxedValue;
    }>;
};
export declare const object: ObjectDataType;
export declare const record: {
    <TKey extends string, TBoxedValue extends IData<any> | DataDefaultFn>(boxedValue: TBoxedValue): IData<{
        TValue: Record<TKey, GetDataType<TBoxedValue>>;
        TParsedValue: Record<TKey, GetDataType<TBoxedValue>>;
        TBoxedValue: TBoxedValue;
    }>;
    optional<TBoxedValue_1 extends IData<any> | DataDefaultFn>(boxedValue: TBoxedValue_1): IData<{
        TValue: Maybe<Record<string, any>>;
        TParsedValue: Maybe<Record<string, any>>;
        TBoxedValue: IData<any>;
    }>;
    _default: any;
};
export declare const array: <TBoxedValue extends IData<any> | DataDefaultFn>(boxedValue: TBoxedValue) => {
    (defaultValue: GetDataType<TBoxedValue>[]): IData<{
        TValue: GetDataType<TBoxedValue>[];
        TParsedValue: GetDataType<TBoxedValue>[];
        TBoxedValue: TBoxedValue;
    }>;
    optional: IData<{
        TValue: Maybe<GetDataType<TBoxedValue>[]>;
        TParsedValue: Maybe<GetDataType<TBoxedValue>[]>;
        TBoxedValue: TBoxedValue;
    }>;
    _default: IData<{
        TValue: GetDataType<TBoxedValue>[];
        TParsedValue: GetDataType<TBoxedValue>[];
        TBoxedValue: TBoxedValue;
    }>;
};
export declare const oneToOne: <TTargetNodeOrTargetNodeRecord extends INode<any, import("./types").NodeComputedFns<{
    TNodeData: any;
    TNodeComputedData: any;
}>, import("./types").NodeDO> | Record<string, INode<any, import("./types").NodeComputedFns<{
    TNodeData: any;
    TNodeComputedData: any;
}>, import("./types").NodeDO>> | null>(def: NonNullable<TTargetNodeOrTargetNodeRecord>) => IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare const oneToMany: <TTargetNodeOrTargetNodeRecord extends INode<any, import("./types").NodeComputedFns<{
    TNodeData: any;
    TNodeComputedData: any;
}>, import("./types").NodeDO> | Record<string, INode<any, import("./types").NodeComputedFns<{
    TNodeData: any;
    TNodeComputedData: any;
}>, import("./types").NodeDO>> | null>(def: NonNullable<TTargetNodeOrTargetNodeRecord>) => IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare const OBJECT_PROPERTY_SEPARATOR = "__dot__";
export declare const OBJECT_IDENTIFIER = "__object__";
export declare function queryDefinition<TNode extends INode, TMapFn extends MapFnForNode<TNode> | undefined, TQueryDefinitionTarget extends QueryDefinitionTarget, TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts>(queryDefinition: UseSubscriptionQueryDefinition<{
    TNode: TNode;
    TMapFn: TMapFn;
    TQueryDefinitionTarget: TQueryDefinitionTarget;
    TUseSubscriptionQueryDefinitionOpts: TUseSubscriptionQueryDefinitionOpts;
}>): UseSubscriptionQueryDefinition<{
    TNode: TNode;
    TMapFn: TMapFn;
    TQueryDefinitionTarget: TQueryDefinitionTarget;
    TUseSubscriptionQueryDefinitionOpts: TUseSubscriptionQueryDefinitionOpts;
}>;
export {};
=======
import { GetResultingDataTypeFromProperties, GetDataType, IOneToOneQueryBuilder, IOneToManyQueryBuilder, IData, INode, MapFnForNode, Maybe, QueryDefinitionTarget, DataDefaultFn, DATA_TYPES, UseSubscriptionQueryDefinitionOpts, UseSubscriptionQueryDefinition } from './types';
export declare class Data<TParsedValue, TValue, TBoxedValue extends IData | DataDefaultFn | Record<string, IData | DataDefaultFn> | undefined> implements IData<TParsedValue, TValue, TBoxedValue> {
    type: DATA_TYPES;
    parser: (value: TValue) => TParsedValue;
    boxedValue: TBoxedValue;
    defaultValue: Maybe<TParsedValue>;
    isOptional: boolean;
    acceptableValues?: Array<TParsedValue>;
    constructor(opts: {
        type: DATA_TYPES;
        parser: (value: TValue) => TParsedValue;
        boxedValue?: TBoxedValue;
        defaultValue?: TParsedValue;
        isOptional: boolean;
        acceptableValues?: Array<TParsedValue>;
    });
}
/**
 * data serve 2 purposes:
 * 1) they convert strings from the backend into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the data types used,
 */
export declare const string: {
    <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
    _default: Data<"", "", undefined>;
    optional: Data<Maybe<string>, Maybe<string>, undefined>;
};
export declare const stringEnum: <TEnumEntry extends string, TEnumType extends TEnumEntry[] = TEnumEntry[]>(enumValues: TEnumType) => Data<TEnumType[number], TEnumType[number], undefined> & {
    optional: Data<Maybe<TEnumType[number]>, Maybe<TEnumType[number]>, undefined>;
};
export declare const number: {
    (defaultValue: number): Data<number, string, undefined>;
    _default: Data<number, string, undefined>;
    optional: Data<Maybe<number>, Maybe<string>, undefined>;
};
export declare const boolean: {
    <TDefaultValue extends boolean>(defaultValue?: TDefaultValue | undefined): IData<boolean, string | boolean, undefined>;
    _default: IData<boolean, string | boolean, undefined>;
    optional: Data<Maybe<boolean>, Maybe<string | boolean>, undefined>;
};
declare type ObjectDataType = {
    <TBoxedValue extends Record<string, IData | DataDefaultFn>>(boxedValue: TBoxedValue): Data<GetResultingDataTypeFromProperties<TBoxedValue>, GetResultingDataTypeFromProperties<TBoxedValue>, TBoxedValue>;
    _default: any;
    optional: <TBoxedValue extends Record<string, IData | DataDefaultFn>>(boxedValue: TBoxedValue) => Data<Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>, Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>, TBoxedValue>;
};
export declare const object: ObjectDataType;
export declare const record: {
    <TKey extends string, TBoxedValue extends IData<any, any, any> | DataDefaultFn>(boxedValue: TBoxedValue): Data<Record<TKey, GetDataType<TBoxedValue>>, Record<TKey, GetDataType<TBoxedValue>>, TBoxedValue>;
    optional<TBoxedValue_1 extends IData<any, any, any> | DataDefaultFn>(boxedValue: TBoxedValue_1): Data<Maybe<Record<string, any>>, Maybe<Record<string, any>>, IData<any, any, any>>;
    _default: any;
};
export declare const array: <TBoxedValue extends IData<any, any, any> | DataDefaultFn>(boxedValue: TBoxedValue) => {
    (defaultValue: GetDataType<TBoxedValue>[]): Data<GetDataType<TBoxedValue>[], GetDataType<TBoxedValue>[], TBoxedValue>;
    optional: Data<Maybe<GetDataType<TBoxedValue>[]>, Maybe<GetDataType<TBoxedValue>[]>, TBoxedValue>;
    _default: Data<GetDataType<TBoxedValue>[], GetDataType<TBoxedValue>[], TBoxedValue>;
};
export declare const oneToOne: <TTargetNodeOrTargetNodeRecord extends INode<any, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO> | Record<string, INode<any, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO>> | null>(def: NonNullable<TTargetNodeOrTargetNodeRecord>) => IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare const oneToMany: <TTargetNodeOrTargetNodeRecord extends INode<any, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO> | Record<string, INode<any, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): Data<TStringType, TStringType, undefined>;
        _default: Data<"", "", undefined>;
        optional: Data<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): Data<number, string, undefined>;
        _default: Data<number, string, undefined>;
        optional: Data<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO>> | null>(def: NonNullable<TTargetNodeOrTargetNodeRecord>) => IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare const OBJECT_PROPERTY_SEPARATOR = "__dot__";
export declare const OBJECT_IDENTIFIER = "__object__";
export declare function queryDefinition<TNode extends INode, TMapFn extends MapFnForNode<TNode> | undefined, TQueryDefinitionTarget extends QueryDefinitionTarget, TUseSubscriptionOpts extends UseSubscriptionQueryDefinitionOpts>(queryDefinition: UseSubscriptionQueryDefinition<TNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionOpts>): UseSubscriptionQueryDefinition<TNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionOpts>;
export {};
>>>>>>> origin/mm-gql
