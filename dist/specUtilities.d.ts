import * as smData from './smDataTypes';
import { SMJS } from '.';
import { IChildrenQueryBuilder, ISMNode, ISMJS, IByReferenceQueryBuilder, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeComputedFns, NodeRelationalFns, SMConfig } from './types';
declare const userProperties: {
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
    lastName: smData.SMData<"joe", "joe", undefined>;
    address: smData.SMData<{
        streetName: string;
        zipCode: string;
        state: string;
        apt: {
            number: number;
            floor: number;
        };
    }, {
        streetName: string;
        zipCode: string;
        state: string;
        apt: {
            number: number;
            floor: number;
        };
    }, {
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
        apt: smData.SMData<{
            number: number;
            floor: number;
        }, {
            number: number;
            floor: number;
        }, {
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
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    task: {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    done: ISMData<boolean, string | boolean, undefined>;
    assigneeId: {
        <TStringType extends string = string>(defaultValue: TStringType): smData.SMData<TStringType, TStringType, undefined>;
        _default: smData.SMData<"", "", undefined>;
        optional: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    };
    meetingId: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
    settings: smData.SMData<{
        archiveAfterMeeting: import("./types").Maybe<boolean>;
        nestedSettings: {
            nestedNestedMaybe: import("./types").Maybe<string>;
        };
    }, {
        archiveAfterMeeting: import("./types").Maybe<boolean>;
        nestedSettings: {
            nestedNestedMaybe: import("./types").Maybe<string>;
        };
    }, {
        archiveAfterMeeting: smData.SMData<import("./types").Maybe<boolean>, import("./types").Maybe<string | boolean>, undefined>;
        nestedSettings: smData.SMData<{
            nestedNestedMaybe: import("./types").Maybe<string>;
        }, {
            nestedNestedMaybe: import("./types").Maybe<string>;
        }, {
            nestedNestedMaybe: smData.SMData<import("./types").Maybe<string>, import("./types").Maybe<string>, undefined>;
        }>;
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
    initialData: {
        id: string;
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
    users: import("./types").QueryDefinition<UserNode, import("./types").MapFn<{
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
        lastName: smData.SMData<"joe", "joe", undefined>;
        address: smData.SMData<{
            streetName: string;
            zipCode: string;
            state: string;
            apt: {
                number: number;
                floor: number;
            };
        }, {
            streetName: string;
            zipCode: string;
            state: string;
            apt: {
                number: number;
                floor: number;
            };
        }, {
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
            apt: smData.SMData<{
                number: number;
                floor: number;
            }, {
                number: number;
                floor: number;
            }, {
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
    }, {}, UserRelationalData> | undefined, import("./types").QueryDefinitionTarget>;
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
            type: string;
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
