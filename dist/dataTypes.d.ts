import { GetResultingDataTypeFromProperties, GetDataType, IOneToOneQueryBuilder, IOneToManyQueryBuilder, IData, INode, MapFnForNode, Maybe, QueryDefinitionTarget, DataDefaultFn, DATA_TYPES, UseSubscriptionQueryDefinitionOpts, UseSubscriptionQueryDefinition } from './types';
export declare class Data<TParsedValue, TValue, TBoxedValue extends IData | DataDefaultFn | Record<string, IData | DataDefaultFn> | undefined> implements IData<TParsedValue, TValue, TBoxedValue> {
    type: DATA_TYPES;
    parser: (value: TValue) => TParsedValue;
    boxedValue: TBoxedValue;
    defaultValue: Maybe<TParsedValue>;
    isOptional: boolean;
    constructor(opts: {
        type: DATA_TYPES;
        parser: (value: TValue) => TParsedValue;
        boxedValue?: TBoxedValue;
        defaultValue?: TParsedValue;
        isOptional: boolean;
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
export declare const oneToOne: <TTargetNodeOrTargetNodeRecord extends INode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
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
}, {}>, import("./types").NodeDO> | Record<string, INode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
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
export declare const oneToMany: <TTargetNodeOrTargetNodeRecord extends INode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
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
}, {}>, import("./types").NodeDO> | Record<string, INode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
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
