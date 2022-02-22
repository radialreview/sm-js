import { SMJS, IByReferenceQueryBuilder, IChildrenQueryBuilder, ISMNode } from 'sm-js';
declare const smJS: SMJS;
export default smJS;
declare const todoProperties: {
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
};
declare const userProperties: {
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
};
declare type TodoProperties = typeof todoProperties;
declare type TodoRelationalData = {
    assignee: IByReferenceQueryBuilder<UserNode>;
};
declare type TodoMutations = {};
declare type TodoNode = ISMNode<TodoProperties, {}, TodoRelationalData, TodoMutations>;
declare type UserProperties = typeof userProperties;
declare type UserRelationalData = {
    todos: IChildrenQueryBuilder<TodoNode>;
};
declare type UserNode = ISMNode<UserProperties, {}, UserRelationalData, {}>;
export declare const todoNode: TodoNode;
export declare const userNode: UserNode;
