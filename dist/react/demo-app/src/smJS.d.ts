import { SMJS } from 'sm-js';
declare const smJS: SMJS;
export default smJS;
export declare const todoNode: import("sm-js").ISMNode<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    assigneeId: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
}, {}, {}, {}, import("sm-js/dist/types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    assigneeId: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
}, {}>, import("sm-js/dist/types").NodeDO>;
export declare const userNode: import("sm-js").ISMNode<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    firstName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    lastName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    address: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
}, {}, {
    todos: import("sm-js/dist/types").IChildrenQueryBuilder<import("sm-js").ISMNode<{
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
            _default: import("sm-js").SMData<"", "", undefined>;
            optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
        };
        task: {
            <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
            _default: import("sm-js").SMData<"", "", undefined>;
            optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
        };
        assigneeId: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    }, {}, {}, {}, import("sm-js/dist/types").NodeComputedFns<{
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
            _default: import("sm-js").SMData<"", "", undefined>;
            optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
        };
        task: {
            <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
            _default: import("sm-js").SMData<"", "", undefined>;
            optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
        };
        assigneeId: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    }, {}>, import("sm-js/dist/types").NodeDO>>;
}, {}, import("sm-js/dist/types").NodeComputedFns<{
    id: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    firstName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    lastName: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
    address: {
        <TStringType extends string = string>(defaultValue: TStringType): import("sm-js").SMData<TStringType, TStringType, undefined>;
        _default: import("sm-js").SMData<"", "", undefined>;
        optional: import("sm-js").SMData<import("../../../types").Maybe<string>, import("../../../types").Maybe<string>, undefined>;
    };
}, {}>, import("sm-js/dist/types").NodeDO>;
