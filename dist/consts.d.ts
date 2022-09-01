import { FilterOperator } from './types';
export declare const PROPERTIES_QUERIED_FOR_ALL_NODES: {
    id: {
        (defaultValue: string): import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    version: {
        (defaultValue: number): import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
    lastUpdatedBy: {
        (defaultValue: string): import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    type: {
        (defaultValue: string): import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
};
export declare const RELATIONAL_UNION_QUERY_SEPARATOR = "__rU__";
export declare const DEFAULT_TOKEN_NAME = "default";
export declare const DEFAULT_NODE_PROPERTIES: {
    dateCreated: {
        (defaultValue: number): import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
    dateLastModified: {
        (defaultValue: number): import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
    lastUpdatedClientTimestamp: {
        (defaultValue: number): import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
    id: {
        (defaultValue: string): import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    version: {
        (defaultValue: number): import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
    lastUpdatedBy: {
        (defaultValue: string): import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: import("./types").IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: import("./types").IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
};
export declare const FILTER_OPERATORS: Array<FilterOperator>;
export declare const NODES_PROPERTY_KEY = "nodes";
