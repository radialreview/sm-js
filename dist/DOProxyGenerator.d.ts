<<<<<<< HEAD
import { IMMGQL, IData, DataDefaultFn, IDOProxy, INode, NodeDO, Maybe, RelationalQueryRecordEntry } from './types';
export declare function createDOProxyGenerator(mmGQLInstance: IMMGQL): <TNodeType extends string, TNodeData extends Record<string, IData<any> | DataDefaultFn>, TNodeComputedData extends Record<string, any>, TRelationalResults extends Record<string, IDOProxy | IDOProxy[]>>(opts: {
    node: INode<{
        TNodeType: TNodeType;
        TNodeData: TNodeData;
        TNodeComputedData: TNodeComputedData;
        TNodeRelationalData: any;
    }, import("./types").NodeComputedFns<{
        TNodeData: TNodeData & {
            dateCreated: {
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
            dateLastModified: {
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
            lastUpdatedClientTimestamp: {
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
            id: {
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
            version: {
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
            lastUpdatedBy: {
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
        };
        TNodeComputedData: TNodeComputedData;
    }>, NodeDO>;
    queryId: string;
    do: NodeDO;
    allPropertiesQueried: Array<string>;
    relationalResults: Maybe<TRelationalResults>;
    relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) => Record<string, any> & import("./types").IDOMethods & import("./types").IDOAccessors & TRelationalResults & IDOProxy;
=======
import { IMMGQL, IData, DataDefaultFn, IDOProxy, INode, NodeDO, Maybe, RelationalQueryRecordEntry } from './types';
export declare function createDOProxyGenerator(mmGQLInstance: IMMGQL): <TNodeType extends string, TNodeData extends Record<string, IData<any, any, any> | DataDefaultFn>, TNodeComputedData extends Record<string, any>, TRelationalResults extends Record<string, IDOProxy | IDOProxy[]>>(opts: {
    node: INode<TNodeType, TNodeData, TNodeComputedData, {}, import("./types").NodeComputedFns<TNodeData & {
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): import("./dataTypes").Data<TStringType, TStringType, undefined>;
            _default: import("./dataTypes").Data<"", "", undefined>;
            optional: import("./dataTypes").Data<Maybe<string>, Maybe<string>, undefined>;
        };
        dateCreated: {
            (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
            _default: import("./dataTypes").Data<number, string, undefined>;
            optional: import("./dataTypes").Data<Maybe<number>, Maybe<string>, undefined>;
        };
        dateLastModified: {
            (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
            _default: import("./dataTypes").Data<number, string, undefined>;
            optional: import("./dataTypes").Data<Maybe<number>, Maybe<string>, undefined>;
        };
        lastUpdatedBy: {
            <TStringType extends string = string>(defaultValue: TStringType): import("./dataTypes").Data<TStringType, TStringType, undefined>;
            _default: import("./dataTypes").Data<"", "", undefined>;
            optional: import("./dataTypes").Data<Maybe<string>, Maybe<string>, undefined>;
        };
        lastUpdatedClientTimestamp: {
            (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
            _default: import("./dataTypes").Data<number, string, undefined>;
            optional: import("./dataTypes").Data<Maybe<number>, Maybe<string>, undefined>;
        };
    }, TNodeComputedData>, NodeDO>;
    queryId: string;
    do: NodeDO;
    allPropertiesQueried: Array<string>;
    relationalResults: Maybe<TRelationalResults>;
    relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) => Record<string, any> & import("./types").IDOMethods & import("./types").IDOAccessors & TRelationalResults & IDOProxy;
>>>>>>> origin/mm-gql
