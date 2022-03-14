import { SMJS } from 'sm-js';
declare const smJS: SMJS;
export default smJS;
export declare const todoNode: import("sm-js/dist/types").ISMNode<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
}, {}, {}, {}, import("sm-js/dist/types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
}, {}>, import("sm-js/dist/types").NodeDO>;
export declare const userNode: import("sm-js/dist/types").ISMNode<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    firstName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    lastName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    address: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
}, {}, {
    todos: any;
}, {}, import("sm-js/dist/types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    firstName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    lastName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    address: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js/dist/smDataTypes").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js/dist/smDataTypes").SMData<"", "", undefined>;
        optional: import("sm-js/dist/smDataTypes").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
}, {}>, import("sm-js/dist/types").NodeDO>;
