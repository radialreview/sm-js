import { GetExpectedNodeDataType, GetSMDataType, IByReferenceQueryBuilder, IChildrenQueryBuilder, ISMData, ISMNode, MapFnForNode, Maybe, QueryDefinition, SMDataDefaultFn } from './types';
export declare const SM_DATA_TYPES: {
    string: string;
    maybeString: string;
    number: string;
    maybeNumber: string;
    boolean: string;
    maybeBoolean: string;
    object: string;
    maybeObject: string;
    record: string;
    maybeRecord: string;
    array: string;
    maybeArray: string;
};
export declare class SMData<TParsedValue, TSMValue, TBoxedValue extends ISMData | SMDataDefaultFn | Record<string, ISMData | SMDataDefaultFn> | undefined> implements ISMData<TParsedValue, TSMValue, TBoxedValue> {
    type: typeof SM_DATA_TYPES[keyof typeof SM_DATA_TYPES];
    parser: (smValue: TSMValue) => TParsedValue;
    boxedValue: TBoxedValue;
    defaultValue: Maybe<TParsedValue>;
    isOptional: boolean;
    constructor(opts: {
        type: string;
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
    <TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>>(boxedValue: TBoxedValue): SMData<GetExpectedNodeDataType<TBoxedValue, {}>, GetExpectedNodeDataType<TBoxedValue, {}>, TBoxedValue>;
    _default: any;
    optional: <TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>>(boxedValue: TBoxedValue) => SMData<GetExpectedNodeDataType<TBoxedValue, {}>, GetExpectedNodeDataType<TBoxedValue, {}>, TBoxedValue>;
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
export declare const SM_RELATIONAL_TYPES: {
    byReference: "bR";
    children: "bP";
};
export declare const reference: <TParentHoldingReference extends ISMNode<{}, {}, {}, {}, import("./types").NodeComputedFns<{}, {}>, import("./types").NodeDO>, TReferencedNode extends ISMNode<{}, {}, {}, {}, import("./types").NodeComputedFns<{}, {}>, import("./types").NodeDO> = ISMNode<{}, {}, {}, {}, import("./types").NodeComputedFns<{}, {}>, import("./types").NodeDO>>(opts: {
    def: TReferencedNode;
    idProp: keyof TParentHoldingReference["smData"];
}) => IByReferenceQueryBuilder<TReferencedNode>;
export declare const relational: <TSMNode extends ISMNode<{}, {}, {}, {}, import("./types").NodeComputedFns<{}, {}>, import("./types").NodeDO>>({ depth, ...opts }: {
    def: TSMNode;
    name?: string | undefined;
    depth?: number | undefined;
}) => IChildrenQueryBuilder<TSMNode>;
export declare const OBJECT_PROPERTY_SEPARATOR = "__dot__";
export declare const OBJECT_IDENTIFIER = "__object__";
export declare function queryDefinition<TSMNode extends ISMNode, TMapFn extends MapFnForNode<TSMNode> | undefined>(queryDefinition: QueryDefinition<TSMNode, TMapFn>): QueryDefinition<TSMNode, TMapFn>;
export {};
