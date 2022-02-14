import * as smData from './smDataTypes';
import { SMJS } from '.';
import { IChildrenQueryBuilder, ISMNode, ISMJS, IByReferenceQueryBuilder, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeComputedFns, NodeRelationalFns, SMConfig } from './types';
declare const userProperties: {
    id: {
        (defaultValue: string): smData.SMData<string, string, undefined>;
        _default: smData.SMData<string, string, undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    firstName: {
        (defaultValue: string): smData.SMData<string, string, undefined>;
        _default: smData.SMData<string, string, undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    lastName: smData.SMData<string, string, undefined>;
    address: smData.SMData<import("./types").GetExpectedNodeDataType<{
        streetName: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
        }>, import("./types").GetExpectedNodeDataType<{
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
    }>, import("./types").GetExpectedNodeDataType<{
        streetName: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
        }>, import("./types").GetExpectedNodeDataType<{
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
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        zipCode: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        state: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
        }>, import("./types").GetExpectedNodeDataType<{
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
export declare type UserNode = ISMNode<UserProperties, {}, UserRelationalData, {}>;
export declare function generateUserNode(smJSInstance: ISMJS, cachedTodoNode?: TodoNode): UserNode;
declare const todoProperties: {
    id: {
        (defaultValue: string): smData.SMData<string, string, undefined>;
        _default: smData.SMData<string, string, undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    task: {
        (defaultValue: string): smData.SMData<string, string, undefined>;
        _default: smData.SMData<string, string, undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    done: ISMData<boolean, string | boolean, undefined>;
    assigneeId: {
        (defaultValue: string): smData.SMData<string, string, undefined>;
        _default: smData.SMData<string, string, undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    meetingId: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    settings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
    }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
    }>>, {
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>>, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
    }>;
    dataSetIds: {
        (defaultValue: any[]): smData.SMData<any[], any[], ISMData<any, any, any>>;
        optional: smData.SMData<import("./types").Maybe<any[]>, import("./types").Maybe<any[]>, ISMData<any, any, any>>;
        _default: smData.SMData<any[], any[], ISMData<any, any, any>>;
    };
    comments: smData.SMData<import("./types").Maybe<any[]>, import("./types").Maybe<any[]>, ISMData<any, any, any>>;
};
export declare type TodoProperties = typeof todoProperties;
export declare type TodoRelationalData = {
    assignee: IByReferenceQueryBuilder<UserNode>;
};
export declare type TodoMutations = {};
export declare type TodoNode = ISMNode<TodoProperties, {}, TodoRelationalData, TodoMutations>;
export declare function generateTodoNode(smJSInstance: ISMJS, cachedUserNode?: UserNode): TodoNode;
export declare function generateDOInstance<TNodeData extends Record<string, ISMData | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, NodeMutationFn>>(opts: {
    properties: TNodeData;
    computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
    relational?: NodeRelationalFns<TNodeRelationalData>;
    mutations?: TNodeMutations;
    initialData?: {
        version: string;
    } & Record<string, any>;
}): {
    doInstance: import("./types").NodeDO;
    smJSInstance: SMJS;
};
export declare function createMockQueryDefinitions(smJSInstance: ISMJS, opts?: {
    useIds: true;
} | {
    useUnder: true;
} | {
    useNoUnder: true;
}): {
    users: import("./types").QueryDefinition<UserNode, ({ id, todos, address }: import("./types").GetMapFnArgs<{
        id: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        firstName: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        lastName: smData.SMData<string, string, undefined>;
        address: smData.SMData<import("./types").GetExpectedNodeDataType<{
            streetName: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
            }>, import("./types").GetExpectedNodeDataType<{
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
        }>, import("./types").GetExpectedNodeDataType<{
            streetName: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
            }>, import("./types").GetExpectedNodeDataType<{
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
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
            }>, import("./types").GetExpectedNodeDataType<{
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
    }, UserRelationalData>) => {
        id: {
            (defaultValue: string): smData.SMData<string, string, undefined>;
            _default: smData.SMData<string, string, undefined>;
            optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        };
        address: ({ state, apt }: {
            streetName: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            zipCode: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            state: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            apt: <TMapFn extends import("./types").MapFn<{
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
                map: TMapFn;
            }) => TMapFn;
        }) => {
            state: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
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
        todos: import("./types").IChildrenQuery<TodoNode, ({ id, assignee }: import("./types").GetMapFnArgs<{
            id: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            task: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            done: ISMData<boolean, string | boolean, undefined>;
            assigneeId: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            meetingId: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            settings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
                nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, {
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
            }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
                nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, {
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
            }>>, {
                archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
                nestedSettings: smData.SMData<import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, import("./types").Maybe<import("./types").GetExpectedNodeDataType<{
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>>, {
                    nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                }>;
            }>;
            dataSetIds: {
                (defaultValue: any[]): smData.SMData<any[], any[], ISMData<any, any, any>>;
                optional: smData.SMData<import("./types").Maybe<any[]>, import("./types").Maybe<any[]>, ISMData<any, any, any>>;
                _default: smData.SMData<any[], any[], ISMData<any, any, any>>;
            };
            comments: smData.SMData<import("./types").Maybe<any[]>, import("./types").Maybe<any[]>, ISMData<any, any, any>>;
        }, TodoRelationalData>) => {
            id: {
                (defaultValue: string): smData.SMData<string, string, undefined>;
                _default: smData.SMData<string, string, undefined>;
                optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
            };
            assignee: import("./types").IByReferenceQuery<UserNode, ({ id, firstName }: import("./types").GetMapFnArgs<{
                id: {
                    (defaultValue: string): smData.SMData<string, string, undefined>;
                    _default: smData.SMData<string, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                firstName: {
                    (defaultValue: string): smData.SMData<string, string, undefined>;
                    _default: smData.SMData<string, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                lastName: smData.SMData<string, string, undefined>;
                address: smData.SMData<import("./types").GetExpectedNodeDataType<{
                    streetName: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    zipCode: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    state: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
                    }>, import("./types").GetExpectedNodeDataType<{
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
                }>, import("./types").GetExpectedNodeDataType<{
                    streetName: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    zipCode: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    state: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
                    }>, import("./types").GetExpectedNodeDataType<{
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
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    zipCode: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    state: {
                        (defaultValue: string): smData.SMData<string, string, undefined>;
                        _default: smData.SMData<string, string, undefined>;
                        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                    };
                    apt: smData.SMData<import("./types").GetExpectedNodeDataType<{
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
                    }>, import("./types").GetExpectedNodeDataType<{
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
            }, UserRelationalData>) => {
                id: {
                    (defaultValue: string): smData.SMData<string, string, undefined>;
                    _default: smData.SMData<string, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
                firstName: {
                    (defaultValue: string): smData.SMData<string, string, undefined>;
                    _default: smData.SMData<string, string, undefined>;
                    optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
                };
            }>;
        }>;
    }>;
};
export declare const mockQueryDataReturn: {
    users: {
        id: string;
        version: string;
        address: string;
        address__dot__state: string;
        address__dot__apt: string;
        address__dot__apt__dot__floor: string;
        address__dot__apt__dot__number: string;
        todos: {
            version: string;
            id: string;
            assignee: {
                id: string;
                version: string;
                firstName: string;
            }[];
        }[];
    }[];
};
export declare const mockQueryResultExpectations: {
    users: {
        id: string;
        address: {
            state: string;
            apt: {
                number: number;
                floor: number;
            };
        };
        todos: {
            id: string;
            assignee: {
                id: string;
                firstName: string;
                version: number;
            };
            version: number;
        }[];
        version: number;
    }[];
};
export declare function getMockQueryRecord(smJSInstance: ISMJS): Record<string, import("./types").QueryRecordEntry>;
export declare function getMockSubscriptionMessage(smJSInstance: ISMJS): {
    users: {
        node: {
            id: string;
            address__dot__state: string;
            version: string;
        };
        operation: {
            action: "UpdateNode";
            path: string;
        };
        queryId: string;
        queryRecord: Record<string, import("./types").QueryRecordEntry>;
        subscriptionAlias: string;
    };
};
export declare function getMockConfig(): SMConfig;
export declare function autoIndentGQL(gqlString: string): string;
export {};
