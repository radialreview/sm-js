import * as smData from './smDataTypes';
import { SMJS } from '.';
import { IChildrenQueryBuilder, ISMNode, ISMJS, IByReferenceQueryBuilder, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeComputedFns, NodeRelationalFns, SMConfig, SMNodeDefaultProps } from './types';
declare const userProperties: {
    firstName: {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    lastName: smData.SMData<"joe", "joe", undefined>;
    address: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
        streetName: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, {
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>;
    }>, import("./types").GetResultingDataTypeFromProperties<{
        streetName: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, {
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>;
    }>, {
        streetName: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, {
            number: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>;
    }>;
};
declare type UserProperties = typeof userProperties;
declare type UserRelationalData = {
    todos: IChildrenQueryBuilder<TodoNode>;
};
export declare type UserNode = ISMNode<'tt-user', UserProperties, {
    displayName: string;
}, UserRelationalData, {}>;
export declare function generateUserNode(smJSInstance: ISMJS, cachedTodoNode?: TodoNode): UserNode;
declare const todoProperties: {
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    done: smData.SMData<boolean, string | boolean, undefined>;
    assigneeId: {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    meetingId: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    settings: smData.SMData<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        nestedRecord: smData.SMData<Record<string, boolean>, Record<string, boolean>, smData.SMData<boolean, string | boolean, undefined>>;
    }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        nestedRecord: smData.SMData<Record<string, boolean>, Record<string, boolean>, smData.SMData<boolean, string | boolean, undefined>>;
    }>>, {
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        nestedRecord: smData.SMData<Record<string, boolean>, Record<string, boolean>, smData.SMData<boolean, string | boolean, undefined>>;
    }>;
    dataSetIds: {
        (defaultValue: string[]): smData.SMData<string[], string[], {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        optional: smData.SMData<import("./types").Maybe<string[]>, import("./types").Maybe<string[]>, {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        _default: smData.SMData<string[], string[], {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
    };
    comments: smData.SMData<import("./types").Maybe<import("./types").Maybe<string>[]>, import("./types").Maybe<import("./types").Maybe<string>[]>, smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>>;
    record: smData.SMData<Record<string, string>, Record<string, string>, {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    }>;
};
export declare type TodoProperties = typeof todoProperties;
export declare type TodoRelationalData = {
    assignee: IByReferenceQueryBuilder<TodoNode, UserNode>;
};
export declare type TodoMutations = {};
export declare type TodoNode = ISMNode<'todo', TodoProperties, {}, TodoRelationalData, TodoMutations>;
export declare function generateTodoNode(smJSInstance: ISMJS, cachedUserNode?: UserNode): TodoNode;
export declare function generateDOInstance<TNodeType extends string, TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, NodeMutationFn>>(opts: {
    properties: TNodeData;
    computed?: NodeComputedFns<TNodeData & SMNodeDefaultProps, TNodeComputedData>;
    relational?: NodeRelationalFns<TNodeRelationalData>;
    mutations?: TNodeMutations;
    initialData: {
        id: string;
        version: string;
    } & Record<string, any>;
}): {
    doInstance: import("./types").NodeDO;
    smJSInstance: SMJS;
};
export declare function createMockQueryDefinitions(smJSInstance: ISMJS, opts?: ({
    useIds?: true;
} | {
    useUnder?: true;
} | {
    useNoUnder?: true;
}) & {
    tokenName?: string;
    doNotSuspend?: boolean;
}): {
    users: import("./types").UseSubscriptionQueryDefinition<UserNode, ({ id, todos, address }: {
        firstName: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        lastName: smData.SMData<"joe", "joe", undefined>;
        address: <TMapFn extends import("./types").MapFn<{
            streetName: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
                number: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }>, import("./types").GetResultingDataTypeFromProperties<{
                number: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }>, {
                number: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }>;
        }, {}, {}>>(opts: {
            map: TMapFn;
        }) => TMapFn;
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        dateCreated: {
            (defaultValue: number): smData.SMData<number, string, undefined>;
            _default: smData.SMData<number, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
        dateLastModified: {
            (defaultValue: number): smData.SMData<number, string, undefined>;
            _default: smData.SMData<number, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
        lastUpdatedBy: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        lastUpdatedClientTimestamp: {
            (defaultValue: number): smData.SMData<number, string, undefined>;
            _default: smData.SMData<number, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
    } & UserRelationalData) => {
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        address: ({ state, apt }: {
            streetName: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: <TMapFn_1 extends import("./types").MapFn<{
                number: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }, {}, {}>>(opts: {
                map: TMapFn_1;
            }) => TMapFn_1;
            id: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            dateCreated: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            dateLastModified: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            lastUpdatedBy: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            lastUpdatedClientTimestamp: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }) => {
            state: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: ({ floor, number }: {
                number: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                id: {
                    <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                    _default: smData.SMData<"", "", undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                dateCreated: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                dateLastModified: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                lastUpdatedBy: {
                    <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                    _default: smData.SMData<"", "", undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                lastUpdatedClientTimestamp: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }) => {
                floor: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                number: {
                    (defaultValue: number): smData.SMData<number, string, undefined>;
                    _default: smData.SMData<number, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            };
        };
        todos: import("./types").IChildrenQuery<TodoNode, ({ id, assignee }: {
            task: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            done: smData.SMData<boolean, string | boolean, undefined>;
            assigneeId: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            meetingId: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            settings: <TMapFn_2 extends import("./types").MapFn<{
                archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
                nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, {
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
                nestedRecord: smData.SMData<Record<string, boolean>, Record<string, boolean>, smData.SMData<boolean, string | boolean, undefined>>;
            }, {}, {}>>(opts: {
                map: TMapFn_2;
            }) => TMapFn_2;
            dataSetIds: {
                (defaultValue: string[]): smData.SMData<string[], string[], {
                    <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                    _default: smData.SMData<"", "", undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
                optional: smData.SMData<import("./types").Maybe<string[]>, import("./types").Maybe<string[]>, {
                    <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                    _default: smData.SMData<"", "", undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
                _default: smData.SMData<string[], string[], {
                    <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                    _default: smData.SMData<"", "", undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
            };
            comments: smData.SMData<import("./types").Maybe<import("./types").Maybe<string>[]>, import("./types").Maybe<import("./types").Maybe<string>[]>, smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>>;
            record: smData.SMData<Record<string, string>, Record<string, string>, {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            }>;
            id: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            dateCreated: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            dateLastModified: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            lastUpdatedBy: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            lastUpdatedClientTimestamp: {
                (defaultValue: number): smData.SMData<number, string, undefined>;
                _default: smData.SMData<number, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        } & TodoRelationalData) => {
            id: {
                <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                _default: smData.SMData<"", "", undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            assignee: import("./types").IByReferenceQuery<TodoNode, UserNode, {
                map: ({ id, firstName }: {
                    firstName: {
                        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                        _default: smData.SMData<"", "", undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    lastName: smData.SMData<"joe", "joe", undefined>;
                    address: <TMapFn extends import("./types").MapFn<{
                        streetName: {
                            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                            _default: smData.SMData<"", "", undefined>;
                            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        zipCode: {
                            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                            _default: smData.SMData<"", "", undefined>;
                            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        state: {
                            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                            _default: smData.SMData<"", "", undefined>;
                            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        apt: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
                            number: {
                                (defaultValue: number): smData.SMData<number, string, undefined>;
                                _default: smData.SMData<number, string, undefined>;
                                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                            };
                            floor: {
                                (defaultValue: number): smData.SMData<number, string, undefined>;
                                _default: smData.SMData<number, string, undefined>;
                                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                            };
                        }>, import("./types").GetResultingDataTypeFromProperties<{
                            number: {
                                (defaultValue: number): smData.SMData<number, string, undefined>;
                                _default: smData.SMData<number, string, undefined>;
                                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                            };
                            floor: {
                                (defaultValue: number): smData.SMData<number, string, undefined>;
                                _default: smData.SMData<number, string, undefined>;
                                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                            };
                        }>, {
                            number: {
                                (defaultValue: number): smData.SMData<number, string, undefined>;
                                _default: smData.SMData<number, string, undefined>;
                                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                            };
                            floor: {
                                (defaultValue: number): smData.SMData<number, string, undefined>;
                                _default: smData.SMData<number, string, undefined>;
                                optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                            };
                        }>;
                    }, {}, {}>>(opts: {
                        map: TMapFn;
                    }) => TMapFn;
                    id: {
                        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                        _default: smData.SMData<"", "", undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    dateCreated: {
                        (defaultValue: number): smData.SMData<number, string, undefined>;
                        _default: smData.SMData<number, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                    };
                    dateLastModified: {
                        (defaultValue: number): smData.SMData<number, string, undefined>;
                        _default: smData.SMData<number, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                    };
                    lastUpdatedBy: {
                        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                        _default: smData.SMData<"", "", undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    lastUpdatedClientTimestamp: {
                        (defaultValue: number): smData.SMData<number, string, undefined>;
                        _default: smData.SMData<number, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                    };
                } & UserRelationalData) => {
                    id: {
                        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                        _default: smData.SMData<"", "", undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    firstName: {
                        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
                        _default: smData.SMData<"", "", undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                };
            }>;
        }>;
    }, {
        underIds: string[];
        depth?: number | undefined;
    } | {
        depth: number;
    } | {
        id: string;
        allowNullResult?: boolean | undefined;
    } | {
        ids: string[];
    }, {
        doNotSuspend: boolean | undefined;
    }>;
};
export declare const mockQueryDataReturn: {
    users: {
        id: string;
        type: string;
        version: string;
        address: string;
        address__dot__state: string;
        address__dot__apt: string;
        address__dot__apt__dot__floor: string;
        address__dot__apt__dot__number: string;
        todos: {
            version: string;
            id: string;
            type: string;
            assignee: {
                id: string;
                type: string;
                version: string;
                firstName: string;
            }[];
        }[];
    }[];
};
export declare const mockQueryResultExpectations: {
    users: {
        id: string;
        type: string;
        displayName: string;
        lastUpdatedBy: undefined;
        address: {
            state: string;
            apt: {
                number: number;
                floor: number;
            };
        };
        todos: {
            id: string;
            type: string;
            assignee: {
                id: string;
                type: string;
                displayName: string;
                lastUpdatedBy: undefined;
                firstName: string;
                version: number;
            };
            lastUpdatedBy: undefined;
            version: number;
        }[];
        version: number;
    }[];
};
export declare function getMockQueryRecord(smJSInstance: ISMJS): import("./types").QueryRecord;
export declare function getMockSubscriptionMessage(smJSInstance: ISMJS): {
    users: {
        node: {
            id: string;
            type: string;
            address__dot__state: string;
            version: string;
            todos: {
                version: string;
                id: string;
                type: string;
                assignee: {
                    id: string;
                    type: string;
                    version: string;
                    firstName: string;
                }[];
            }[];
        };
        operation: {
            action: "UpdateNode";
            path: string;
        };
        queryId: string;
        queryRecord: import("./types").QueryRecord;
        subscriptionAlias: string;
    };
};
export declare function getMockConfig(opts?: {
    generateMockData: boolean;
}): SMConfig;
export declare function autoIndentGQL(gqlString: string): string;
export declare function generateTestNode(smJSInstance: ISMJS): TestNode;
declare const testProperties: {
    stringData: {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    optionalString: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    defaultString: smData.SMData<"iAmADefaultString", "iAmADefaultString", undefined>;
    numberData: {
        (defaultValue: number): smData.SMData<number, string, undefined>;
        _default: smData.SMData<number, string, undefined>;
        optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
    optionalNumber: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    defaultNumber: smData.SMData<number, string, undefined>;
    booleanData: smData.SMData<boolean, string | boolean, undefined>;
    optionalBoolean: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
    defaultBoolean: smData.SMData<boolean, string | boolean, undefined>;
    objectData: smData.SMData<import("./types").GetResultingDataTypeFromProperties<{
        recordInObject: smData.SMData<Record<string, string>, Record<string, string>, {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        stringInObject: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    }>, import("./types").GetResultingDataTypeFromProperties<{
        recordInObject: smData.SMData<Record<string, string>, Record<string, string>, {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        stringInObject: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    }>, {
        recordInObject: smData.SMData<Record<string, string>, Record<string, string>, {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        stringInObject: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    }>;
    optionalObject: smData.SMData<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
        defaultStringInOptionalObject: smData.SMData<"iAmADefaultStringInAnOptionalObject", "iAmADefaultStringInAnOptionalObject", undefined>;
        recordInOptionalObject: smData.SMData<Record<string, number>, Record<string, number>, {
            (defaultValue: number): smData.SMData<number, string, undefined>;
            _default: smData.SMData<number, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        }>;
    }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
        defaultStringInOptionalObject: smData.SMData<"iAmADefaultStringInAnOptionalObject", "iAmADefaultStringInAnOptionalObject", undefined>;
        recordInOptionalObject: smData.SMData<Record<string, number>, Record<string, number>, {
            (defaultValue: number): smData.SMData<number, string, undefined>;
            _default: smData.SMData<number, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        }>;
    }>>, {
        defaultStringInOptionalObject: smData.SMData<"iAmADefaultStringInAnOptionalObject", "iAmADefaultStringInAnOptionalObject", undefined>;
        recordInOptionalObject: smData.SMData<Record<string, number>, Record<string, number>, {
            (defaultValue: number): smData.SMData<number, string, undefined>;
            _default: smData.SMData<number, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        }>;
    }>;
    arrayData: {
        (defaultValue: string[]): smData.SMData<string[], string[], {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        optional: smData.SMData<import("./types").Maybe<string[]>, import("./types").Maybe<string[]>, {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        _default: smData.SMData<string[], string[], {
            <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
            _default: smData.SMData<"", "", undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
    };
    optionalArray: smData.SMData<import("./types").Maybe<import("./types").Maybe<boolean>[]>, import("./types").Maybe<import("./types").Maybe<boolean>[]>, smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>>;
    recordData: smData.SMData<Record<string, "iAmADefaultStringInARecord">, Record<string, "iAmADefaultStringInARecord">, smData.SMData<"iAmADefaultStringInARecord", "iAmADefaultStringInARecord", undefined>>;
    optionalRecord: smData.SMData<import("./types").Maybe<Record<string, any>>, import("./types").Maybe<Record<string, any>>, ISMData<any, any, any>>;
};
declare type TestProperties = typeof testProperties;
declare type TestNode = ISMNode<'testNode', TestProperties, {}, {}, {}>;
export declare const mockDataGenerationExpectedResultsForTodoNodeAllProperties: {
    task: any;
    id: any;
    dateCreated: any;
    dateLastModified: any;
    lastUpdatedBy: any;
    lastUpdatedClientTimestamp: any;
    type: any;
    done: any;
    assigneeId: any;
    meetingId: any;
    settings: any;
    dataSetIds: any;
    comments: any;
    record: any;
};
export declare const mockedDataGenerationExpectedResultsForUserNodeAllProperties: {
    id: any;
    dateCreated: any;
    dateLastModified: any;
    lastUpdatedBy: any;
    lastUpdatedClientTimestamp: any;
    firstName: any;
    lastName: any;
    displayName: any;
    address: any;
};
export declare const mockedDataGenerationExpectedResultsForTestNodeAllProperties: {
    test: {
        id: any;
        dateCreated: any;
        dateLastModified: any;
        lastUpdatedBy: any;
        lastUpdatedClientTimestamp: any;
        stringData: any;
        optionalString: any;
        defaultString: any;
        numberData: any;
        optionalNumber: any;
        defaultNumber: any;
        booleanData: any;
        optionalBoolean: any;
        defaultBoolean: any;
        objectData: any;
        optionalObject: any;
        arrayData: any;
        optionalArray: any;
        type: any;
        version: any;
        recordData: any;
        optionalRecord: any;
    };
};
export declare const mockedDataGenerationExpectedResultsWithMapAndRelationalPropertiesDefined: {
    users: any;
};
export {};
