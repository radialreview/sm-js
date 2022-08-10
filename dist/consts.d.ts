import { FilterOperator } from './types';
export declare const PROPERTIES_QUERIED_FOR_ALL_NODES: string[];
export declare const RELATIONAL_UNION_QUERY_SEPARATOR = "__rU__";
export declare const DEFAULT_TOKEN_NAME = "default";
export declare const DEFAULT_NODE_PROPERTIES: {
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("./dataTypes").Data<TStringType, TStringType, undefined>;
        _default: import("./dataTypes").Data<"", "", undefined>;
        optional: import("./dataTypes").Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    dateCreated: {
        (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
        _default: import("./dataTypes").Data<number, string, undefined>;
        optional: import("./dataTypes").Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
    dateLastModified: {
        (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
        _default: import("./dataTypes").Data<number, string, undefined>;
        optional: import("./dataTypes").Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
    lastUpdatedBy: {
        <TStringType extends string = string>(defaultValue: TStringType): import("./dataTypes").Data<TStringType, TStringType, undefined>;
        _default: import("./dataTypes").Data<"", "", undefined>;
        optional: import("./dataTypes").Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): import("./dataTypes").Data<number, string, undefined>;
        _default: import("./dataTypes").Data<number, string, undefined>;
        optional: import("./dataTypes").Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
};
export declare const FILTER_OPERATORS: Array<FilterOperator>;
export declare const NODES_PROPERTY_KEY = "nodes";
