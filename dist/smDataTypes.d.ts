import { GetResultingDataTypeFromProperties, GetSMDataType, IOneToOneQueryBuilder, IOneToManyQueryBuilder, ISMData, ISMNode, MapFnForNode, Maybe, QueryDefinitionTarget, SMDataDefaultFn, SM_DATA_TYPES, UseSubscriptionQueryDefinitionOpts, UseSubscriptionQueryDefinition } from './types';
export declare class SMData<TParsedValue, TSMValue, TBoxedValue extends ISMData | SMDataDefaultFn | Record<string, ISMData | SMDataDefaultFn> | undefined> implements ISMData<TParsedValue, TSMValue, TBoxedValue> {
    type: SM_DATA_TYPES;
    parser: (smValue: TSMValue) => TParsedValue;
    boxedValue: TBoxedValue;
    defaultValue: Maybe<TParsedValue>;
    isOptional: boolean;
    constructor(opts: {
        type: SM_DATA_TYPES;
        parser: (smValue: TSMValue) => TParsedValue;
        boxedValue?: TBoxedValue;
        defaultValue?: TParsedValue;
        isOptional: boolean;
    });
}
/**
 * smData serve 2 purposes:
 * 1) they convert strings from SM into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the smData types used,
 */
export declare const string: {
    <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
    _default: SMData<"", "", undefined>;
    optional: SMData<Maybe<string>, Maybe<string>, undefined>;
};
export declare const number: {
    (defaultValue: number): SMData<number, string, undefined>;
    _default: SMData<number, string, undefined>;
    optional: SMData<Maybe<number>, Maybe<string>, undefined>;
};
export declare const boolean: {
    <TDefaultValue extends boolean>(defaultValue?: TDefaultValue | undefined): ISMData<boolean, string | boolean, undefined>;
    _default: ISMData<boolean, string | boolean, undefined>;
    optional: SMData<Maybe<boolean>, Maybe<string | boolean>, undefined>;
};
declare type ObjectSMDataType = {
    <TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>>(boxedValue: TBoxedValue): SMData<GetResultingDataTypeFromProperties<TBoxedValue>, GetResultingDataTypeFromProperties<TBoxedValue>, TBoxedValue>;
    _default: any;
    optional: <TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>>(boxedValue: TBoxedValue) => SMData<Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>, Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>, TBoxedValue>;
};
export declare const object: ObjectSMDataType;
export declare const record: {
    <TKey extends string, TBoxedValue extends ISMData<any, any, any> | SMDataDefaultFn>(boxedValue: TBoxedValue): SMData<Record<TKey, GetSMDataType<TBoxedValue>>, Record<TKey, GetSMDataType<TBoxedValue>>, TBoxedValue>;
    optional<TBoxedValue_1 extends ISMData<any, any, any> | SMDataDefaultFn>(boxedValue: TBoxedValue_1): SMData<Maybe<Record<string, any>>, Maybe<Record<string, any>>, ISMData<any, any, any>>;
    _default: any;
};
export declare const array: <TBoxedValue extends ISMData<any, any, any> | SMDataDefaultFn>(boxedValue: TBoxedValue) => {
    (defaultValue: GetSMDataType<TBoxedValue>[]): SMData<GetSMDataType<TBoxedValue>[], GetSMDataType<TBoxedValue>[], TBoxedValue>;
    optional: SMData<Maybe<GetSMDataType<TBoxedValue>[]>, Maybe<GetSMDataType<TBoxedValue>[]>, TBoxedValue>;
    _default: SMData<GetSMDataType<TBoxedValue>[], GetSMDataType<TBoxedValue>[], TBoxedValue>;
};
export declare const oneToOne: <TTargetNodeOrTargetNodeRecord extends ISMNode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO> | Record<string, ISMNode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO>> | null>(def: NonNullable<TTargetNodeOrTargetNodeRecord>) => IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare const oneToMany: <TTargetNodeOrTargetNodeRecord extends ISMNode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO> | Record<string, ISMNode<any, {}, {}, {}, {}, import("./types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): SMData<TStringType, TStringType, undefined>;
        _default: SMData<"", "", undefined>;
        optional: SMData<Maybe<string>, Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): SMData<number, string, undefined>;
        _default: SMData<number, string, undefined>;
        optional: SMData<Maybe<number>, Maybe<string>, undefined>;
    };
}, {}>, import("./types").NodeDO>> | null>(def: NonNullable<TTargetNodeOrTargetNodeRecord>) => IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
export declare const OBJECT_PROPERTY_SEPARATOR = "__dot__";
export declare const OBJECT_IDENTIFIER = "__object__";
export declare function queryDefinition<TSMNode extends ISMNode, TMapFn extends MapFnForNode<TSMNode> | undefined, TQueryDefinitionTarget extends QueryDefinitionTarget, TUseSubscriptionOpts extends UseSubscriptionQueryDefinitionOpts>(queryDefinition: UseSubscriptionQueryDefinition<TSMNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionOpts>): UseSubscriptionQueryDefinition<TSMNode, TMapFn, TQueryDefinitionTarget, TUseSubscriptionOpts>;
export {};
