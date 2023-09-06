import { IData, DataDefaultFn, IDOProxy, INode, NodeDO, Maybe, RelationalQueryRecordEntry, IMMGQL } from './types';
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
                (defaultValue: string | number): IData<{
                    TValue: string | number;
                    TParsedValue: string | number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string | number;
                    TParsedValue: string | number;
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
export declare function getNestedProxyObjectWithNotUpToDateProtection(opts: {
    nodeType: string;
    queryId: string;
    allCachedData: Record<string, any>;
    dataForThisObject: Record<string, IData>;
    allPropertiesQueried: Array<string>;
    parentObjectKey: Maybe<string>;
}): Record<string, any>;
