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
    (defaultValue: string): Data<{
        TValue: string;
        TParsedValue: string;
        TBoxedValue: undefined;
    }>;
    _default: Data<{
        TValue: string;
        TParsedValue: string;
        TBoxedValue: undefined;
    }>;
    optional: Data<{
        TValue: Maybe<string>;
        TParsedValue: Maybe<string>;
        TBoxedValue: undefined;
    }>;
};
export declare const stringEnum: <TEnumEntry extends string, TEnumType extends TEnumEntry[] = TEnumEntry[]>(enumValues: TEnumType) => Data<{
    TValue: TEnumType[number];
    TParsedValue: TEnumType[number];
    TBoxedValue: undefined;
}> & {
    optional: Data<{
        TValue: Maybe<TEnumType[number]>;
        TParsedValue: Maybe<TEnumType[number]>;
        TBoxedValue: undefined;
    }>;
};
export declare const number: {
    (defaultValue: number): Data<{
        TValue: string;
        TParsedValue: number;
        TBoxedValue: undefined;
    }>;
    _default: Data<{
        TValue: string;
        TParsedValue: number;
        TBoxedValue: undefined;
    }>;
    optional: Data<{
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
    optional: Data<{
        TValue: Maybe<string | boolean>;
        TParsedValue: Maybe<boolean>;
        TBoxedValue: undefined;
    }>;
};
declare type ObjectDataType = {
    <TBoxedValue extends Record<string, IData | DataDefaultFn>>(boxedValue: TBoxedValue): Data<{
        TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
        TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
        TBoxedValue: TBoxedValue;
    }>;
    _default: any;
    optional: <TBoxedValue extends Record<string, IData | DataDefaultFn>>(boxedValue: TBoxedValue) => Data<{
        TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
        TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
        TBoxedValue: TBoxedValue;
    }>;
};
export declare const object: ObjectDataType;
export declare const record: {
    <TKey extends string, TBoxedValue extends IData<any> | DataDefaultFn>(boxedValue: TBoxedValue): Data<{
        TValue: Record<TKey, GetDataType<TBoxedValue>>;
        TParsedValue: Record<TKey, GetDataType<TBoxedValue>>;
        TBoxedValue: TBoxedValue;
    }>;
    optional<TBoxedValue_1 extends IData<any> | DataDefaultFn>(boxedValue: TBoxedValue_1): Data<{
        TValue: Maybe<Record<string, any>>;
        TParsedValue: Maybe<Record<string, any>>;
        TBoxedValue: IData<any>;
    }>;
    _default: any;
};
export declare const array: <TBoxedValue extends IData<any> | DataDefaultFn>(boxedValue: TBoxedValue) => {
    (defaultValue: GetDataType<TBoxedValue>[]): Data<{
        TValue: GetDataType<TBoxedValue>[];
        TParsedValue: GetDataType<TBoxedValue>[];
        TBoxedValue: TBoxedValue;
    }>;
    optional: Data<{
        TValue: Maybe<GetDataType<TBoxedValue>[]>;
        TParsedValue: Maybe<GetDataType<TBoxedValue>[]>;
        TBoxedValue: TBoxedValue;
    }>;
    _default: Data<{
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
export declare function queryDefinition<TQueryDefinitionArgs extends {
    TNode: INode;
    TMapFn: MapFnForNode<TQueryDefinitionArgs['TNode']> | undefined;
    TQueryDefinitionTarget: QueryDefinitionTarget;
    TUseSubscriptionQueryDefinitionOpts: UseSubscriptionQueryDefinitionOpts;
}>(queryDefinition: UseSubscriptionQueryDefinition<TQueryDefinitionArgs>): UseSubscriptionQueryDefinition<TQueryDefinitionArgs>;
export {};
