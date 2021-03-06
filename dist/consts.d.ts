export declare const PROPERTIES_QUERIED_FOR_ALL_NODES: string[];
export declare const RELATIONAL_UNION_QUERY_SEPARATOR = "__rU__";
export declare const DEFAULT_TOKEN_NAME = "default";
export declare const DEFAULT_NODE_PROPERTIES: {
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("./smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("./smDataTypes").SMData<"", "", undefined>;
        optional: import("./smDataTypes").SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): import("./smDataTypes").SMData<number, string, undefined>;
        _default: import("./smDataTypes").SMData<number, string, undefined>;
        optional: import("./smDataTypes").SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): import("./smDataTypes").SMData<number, string, undefined>;
        _default: import("./smDataTypes").SMData<number, string, undefined>;
        optional: import("./smDataTypes").SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): import("./smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("./smDataTypes").SMData<"", "", undefined>;
        optional: import("./smDataTypes").SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): import("./smDataTypes").SMData<number, string, undefined>;
        _default: import("./smDataTypes").SMData<number, string, undefined>;
        optional: import("./smDataTypes").SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
};
