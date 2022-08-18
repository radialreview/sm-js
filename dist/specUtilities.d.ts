import * as data from './dataTypes';
import { MMGQL } from '.';
import { IOneToOneQueryBuilder, IOneToManyQueryBuilder, INode, IMMGQL, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeComputedFns, NodeRelationalFns, Config, NodeDefaultProps } from './types';
declare const userProperties: {
    firstName: {
        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
        _default: data.Data<"", "", undefined>;
        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    lastName: data.Data<"joe", "joe", undefined>;
    score: {
        (defaultValue: number): data.Data<number, string, undefined>;
        _default: data.Data<number, string, undefined>;
        optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
    archived: IData<boolean, string | boolean, undefined>;
    optionalProp: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    address: data.Data<import("./types").GetResultingDataTypeFromProperties<{
        streetName: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: data.Data<import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, {
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>;
    }>, import("./types").GetResultingDataTypeFromProperties<{
        streetName: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: data.Data<import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, {
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>;
    }>, {
        streetName: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: data.Data<import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, import("./types").GetResultingDataTypeFromProperties<{
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>, {
            number: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            floor: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }>;
    }>;
};
declare type UserProperties = typeof userProperties;
declare type UserRelationalData = {
    todos: IOneToManyQueryBuilder<TodoNode>;
};
export declare type UserNode = INode<'user', UserProperties, {
    displayName: string;
}, UserRelationalData>;
export declare function generateUserNode(mmGQLInstance: IMMGQL, cachedTodoNode?: TodoNode): UserNode;
declare const todoProperties: {
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
        _default: data.Data<"", "", undefined>;
        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    done: IData<boolean, string | boolean, undefined>;
    assigneeId: {
        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
        _default: data.Data<"", "", undefined>;
        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    meetingId: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    settings: data.Data<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
        archiveAfterMeeting: data.Data<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: data.Data<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        nestedRecord: data.Data<Record<string, boolean>, Record<string, boolean>, IData<boolean, string | boolean, undefined>>;
    }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
        archiveAfterMeeting: data.Data<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: data.Data<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        nestedRecord: data.Data<Record<string, boolean>, Record<string, boolean>, IData<boolean, string | boolean, undefined>>;
    }>>, {
        archiveAfterMeeting: data.Data<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: data.Data<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        nestedRecord: data.Data<Record<string, boolean>, Record<string, boolean>, IData<boolean, string | boolean, undefined>>;
    }>;
    dataSetIds: {
        (defaultValue: string[]): data.Data<string[], string[], {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        optional: data.Data<import("./types").Maybe<string[]>, import("./types").Maybe<string[]>, {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
        _default: data.Data<string[], string[], {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
    };
    comments: data.Data<import("./types").Maybe<import("./types").Maybe<string>[]>, import("./types").Maybe<import("./types").Maybe<string>[]>, data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>>;
    record: data.Data<Record<string, string>, Record<string, string>, {
        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
        _default: data.Data<"", "", undefined>;
        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    }>;
    numberProp: {
        (defaultValue: number): data.Data<number, string, undefined>;
        _default: data.Data<number, string, undefined>;
        optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
    };
};
export declare type TodoProperties = typeof todoProperties;
export declare type TodoRelationalData = {
    assignee: IOneToOneQueryBuilder<UserNode>;
    users: IOneToManyQueryBuilder<UserNode>;
};
export declare type TodoNode = INode<'todo', TodoProperties, {}, TodoRelationalData>;
export declare function generateTodoNode(mmGQLInstance: IMMGQL, cachedUserNode?: UserNode): TodoNode;
export declare function generateDOInstance<TNodeType extends string, TNodeData extends Record<string, IData | DataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord>(opts: {
    properties: TNodeData;
    computed?: NodeComputedFns<TNodeData & NodeDefaultProps, TNodeComputedData>;
    relational?: NodeRelationalFns<TNodeRelationalData>;
    initialData: {
        id: string;
        version: string;
    } & Record<string, any>;
}): {
    doInstance: import("./types").NodeDO;
    mmGQLInstance: MMGQL;
};
export declare function createMockQueryDefinitions(mmGQLInstance: IMMGQL, opts?: {
    useIds?: true;
} & {
    tokenName?: string;
    doNotSuspend?: boolean;
}): {
    users: import("./types").UseSubscriptionQueryDefinition<UserNode, ({ id, todos, address }: {
        firstName: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        lastName: data.Data<"joe", "joe", undefined>;
        score: {
            (defaultValue: number): data.Data<number, string, undefined>;
            _default: data.Data<number, string, undefined>;
            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
        archived: IData<boolean, string | boolean, undefined>;
        optionalProp: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        address: <TMapFn extends import("./types").MapFn<{
            streetName: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: data.Data<import("./types").GetResultingDataTypeFromProperties<{
                number: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }>, import("./types").GetResultingDataTypeFromProperties<{
                number: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }>, {
                number: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }>;
        }, {}, {}>>(opts: {
            map: TMapFn;
        }) => TMapFn;
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        dateCreated: {
            (defaultValue: number): data.Data<number, string, undefined>;
            _default: data.Data<number, string, undefined>;
            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
        dateLastModified: {
            (defaultValue: number): data.Data<number, string, undefined>;
            _default: data.Data<number, string, undefined>;
            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
        lastUpdatedBy: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        lastUpdatedClientTimestamp: {
            (defaultValue: number): data.Data<number, string, undefined>;
            _default: data.Data<number, string, undefined>;
            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
        };
    } & UserRelationalData) => {
        id: {
            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
            _default: data.Data<"", "", undefined>;
            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        address: ({ state, apt }: {
            streetName: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: <TMapFn_1 extends import("./types").MapFn<{
                number: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }, {}, {}>>(opts: {
                map: TMapFn_1;
            }) => TMapFn_1;
            id: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            dateCreated: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            dateLastModified: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
            lastUpdatedBy: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            lastUpdatedClientTimestamp: {
                (defaultValue: number): data.Data<number, string, undefined>;
                _default: data.Data<number, string, undefined>;
                optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
            };
        }) => {
            state: {
                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                _default: data.Data<"", "", undefined>;
                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: ({ floor, number }: {
                number: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                floor: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                id: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                dateCreated: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                dateLastModified: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                lastUpdatedBy: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                lastUpdatedClientTimestamp: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            }) => {
                floor: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                number: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            };
        };
        todos: import("./types").IOneToManyQuery<TodoNode, {
            map: ({ id, assignee }: {
                task: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                done: IData<boolean, string | boolean, undefined>;
                assigneeId: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                meetingId: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                settings: <TMapFn_2 extends import("./types").MapFn<{
                    archiveAfterMeeting: data.Data<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
                    nestedSettings: data.Data<import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                        nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    }>>, import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                        nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    }>>, {
                        nestedNestedMaybe: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    }>;
                    nestedRecord: data.Data<Record<string, boolean>, Record<string, boolean>, IData<boolean, string | boolean, undefined>>;
                }, {}, {}>>(opts: {
                    map: TMapFn_2;
                }) => TMapFn_2;
                dataSetIds: {
                    (defaultValue: string[]): data.Data<string[], string[], {
                        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                        _default: data.Data<"", "", undefined>;
                        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    }>;
                    optional: data.Data<import("./types").Maybe<string[]>, import("./types").Maybe<string[]>, {
                        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                        _default: data.Data<"", "", undefined>;
                        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    }>;
                    _default: data.Data<string[], string[], {
                        <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                        _default: data.Data<"", "", undefined>;
                        optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    }>;
                };
                comments: data.Data<import("./types").Maybe<import("./types").Maybe<string>[]>, import("./types").Maybe<import("./types").Maybe<string>[]>, data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>>;
                record: data.Data<Record<string, string>, Record<string, string>, {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
                numberProp: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                id: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                dateCreated: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                dateLastModified: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
                lastUpdatedBy: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                lastUpdatedClientTimestamp: {
                    (defaultValue: number): data.Data<number, string, undefined>;
                    _default: data.Data<number, string, undefined>;
                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                };
            } & TodoRelationalData) => {
                id: {
                    <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                    _default: data.Data<"", "", undefined>;
                    optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                assignee: import("./types").IOneToOneQuery<UserNode, {
                    map: ({ id, firstName }: {
                        firstName: {
                            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                            _default: data.Data<"", "", undefined>;
                            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        lastName: data.Data<"joe", "joe", undefined>;
                        score: {
                            (defaultValue: number): data.Data<number, string, undefined>;
                            _default: data.Data<number, string, undefined>;
                            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                        };
                        archived: IData<boolean, string | boolean, undefined>;
                        optionalProp: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        address: <TMapFn extends import("./types").MapFn<{
                            streetName: {
                                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                                _default: data.Data<"", "", undefined>;
                                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                            };
                            zipCode: {
                                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                                _default: data.Data<"", "", undefined>;
                                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                            };
                            state: {
                                <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                                _default: data.Data<"", "", undefined>;
                                optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                            };
                            apt: data.Data<import("./types").GetResultingDataTypeFromProperties<{
                                number: {
                                    (defaultValue: number): data.Data<number, string, undefined>;
                                    _default: data.Data<number, string, undefined>;
                                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                                };
                                floor: {
                                    (defaultValue: number): data.Data<number, string, undefined>;
                                    _default: data.Data<number, string, undefined>;
                                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                                };
                            }>, import("./types").GetResultingDataTypeFromProperties<{
                                number: {
                                    (defaultValue: number): data.Data<number, string, undefined>;
                                    _default: data.Data<number, string, undefined>;
                                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                                };
                                floor: {
                                    (defaultValue: number): data.Data<number, string, undefined>;
                                    _default: data.Data<number, string, undefined>;
                                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                                };
                            }>, {
                                number: {
                                    (defaultValue: number): data.Data<number, string, undefined>;
                                    _default: data.Data<number, string, undefined>;
                                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                                };
                                floor: {
                                    (defaultValue: number): data.Data<number, string, undefined>;
                                    _default: data.Data<number, string, undefined>;
                                    optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                                };
                            }>;
                        }, {}, {}>>(opts: {
                            map: TMapFn;
                        }) => TMapFn;
                        id: {
                            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                            _default: data.Data<"", "", undefined>;
                            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        dateCreated: {
                            (defaultValue: number): data.Data<number, string, undefined>;
                            _default: data.Data<number, string, undefined>;
                            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                        };
                        dateLastModified: {
                            (defaultValue: number): data.Data<number, string, undefined>;
                            _default: data.Data<number, string, undefined>;
                            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                        };
                        lastUpdatedBy: {
                            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                            _default: data.Data<"", "", undefined>;
                            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        lastUpdatedClientTimestamp: {
                            (defaultValue: number): data.Data<number, string, undefined>;
                            _default: data.Data<number, string, undefined>;
                            optional: data.Data<import("./types").Maybe<number>, import("./types").Maybe<string>, undefined>;
                        };
                    } & UserRelationalData) => {
                        id: {
                            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                            _default: data.Data<"", "", undefined>;
                            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                        firstName: {
                            <TStringType extends string = string>(defaultValue: TStringType): data.Data<TStringType, TStringType, undefined>;
                            _default: data.Data<"", "", undefined>;
                            optional: data.Data<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                        };
                    };
                }>;
            };
        }>;
    }, {
        id: string;
        allowNullResult?: boolean | undefined;
    } | {
        ids: string[];
    }, {
        doNotSuspend: boolean | undefined;
    }>;
};
export declare const mockTodoData: {
    version: string;
    id: string;
    type: string;
    task: string;
    numberProp: number;
    users: {
        id: string;
        type: string;
        version: string;
        firstName: string;
    }[];
    assignee: {
        id: string;
        type: string;
        version: string;
        firstName: string;
    }[];
};
export declare const mockUserData: {
    id: string;
    type: string;
    version: string;
    address: string;
    address__dot__state: string;
    address__dot__apt: string;
    address__dot__apt__dot__floor: string;
    address__dot__apt__dot__number: string;
    firstName: string;
    optionalProp: string;
    score: number;
    archived: boolean;
    todos: {
        version: string;
        id: string;
        type: string;
        task: string;
        numberProp: number;
        users: {
            id: string;
            type: string;
            version: string;
            firstName: string;
        }[];
        assignee: {
            id: string;
            type: string;
            version: string;
            firstName: string;
        }[];
    }[];
};
export declare const mockQueryDataReturn: {
    users: {
        nodes: {
            id: string;
            type: string;
            version: string;
            address: string;
            address__dot__state: string;
            address__dot__apt: string;
            address__dot__apt__dot__floor: string;
            address__dot__apt__dot__number: string;
            todos: {
                nodes: {
                    version: string;
                    id: string;
                    type: string;
                    assignee: {
                        id: string;
                        type: string;
                        version: string;
                        firstName: string;
                    };
                }[];
            };
        }[];
    };
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
export declare function getMockQueryRecord(mmGQLInstance: IMMGQL): import("./types").QueryRecord;
export declare function getMockSubscriptionMessage(mmGQLInstance: IMMGQL): {
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
    mockData?: any;
}): Config;
export declare function autoIndentGQL(gqlString: string): string;
export declare function convertNodesCollectionValuesToArray<T extends Record<string, any>>(obj: T): Record<string, any>;
export {};
