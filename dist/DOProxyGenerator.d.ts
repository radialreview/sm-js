import { ISMJS, ISMData, SMDataDefaultFn, IDOProxy, ISMNode, NodeDO, Maybe, RelationalQueryRecordEntry } from './types';
export declare function createDOProxyGenerator(smJSInstance: ISMJS): <TNodeType extends string, TNodeData extends Record<string, ISMData<any, any, any> | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TRelationalResults extends Record<string, IDOProxy | IDOProxy[]>>(opts: {
    node: ISMNode<TNodeType, TNodeData, TNodeComputedData, {}, {}, import("./types").NodeComputedFns<TNodeData & {
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): import("./smDataTypes").SMData<TStringType, TStringType, undefined>;
            _default: import("./smDataTypes").SMData<"", "", undefined>;
            optional: import("./smDataTypes").SMData<Maybe<string>, Maybe<string>, undefined>;
        };
        dateCreated: {
            (defaultValue: number): import("./smDataTypes").SMData<number, string, undefined>;
            _default: import("./smDataTypes").SMData<number, string, undefined>;
            optional: import("./smDataTypes").SMData<Maybe<number>, Maybe<string>, undefined>;
        };
        dateLastModified: {
            (defaultValue: number): import("./smDataTypes").SMData<number, string, undefined>;
            _default: import("./smDataTypes").SMData<number, string, undefined>;
            optional: import("./smDataTypes").SMData<Maybe<number>, Maybe<string>, undefined>;
        };
        lastUpdatedBy: {
            <TStringType extends string = string>(defaultValue: TStringType): import("./smDataTypes").SMData<TStringType, TStringType, undefined>;
            _default: import("./smDataTypes").SMData<"", "", undefined>;
            optional: import("./smDataTypes").SMData<Maybe<string>, Maybe<string>, undefined>;
        };
        lastUpdatedClientTimestamp: {
            (defaultValue: number): import("./smDataTypes").SMData<number, string, undefined>;
            _default: import("./smDataTypes").SMData<number, string, undefined>;
            optional: import("./smDataTypes").SMData<Maybe<number>, Maybe<string>, undefined>;
        };
    }, TNodeComputedData>, NodeDO>;
    queryId: string;
    do: NodeDO;
    allPropertiesQueried: Array<string>;
    relationalResults: Maybe<TRelationalResults>;
    relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) => Record<string, any> & import("./types").IDOMethods & import("./types").IDOAccessors & TRelationalResults & IDOProxy;
