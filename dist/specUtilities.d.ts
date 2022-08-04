import * as data from './dataTypes';
import { MMGQL } from '.';
import { IOneToOneQueryBuilder, IOneToManyQueryBuilder, INode, IMMGQL, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeComputedFns, NodeRelationalFns, Config, QueryDefinitionTarget, NodeDefaultProps } from './types';
declare const userProperties: {
    firstName: {
        (defaultValue: string): data.Data<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: data.Data<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: data.Data<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    lastName: data.Data<{
        TValue: string;
        TParsedValue: string;
        TBoxedValue: undefined;
    }>;
    address: data.Data<{
        TValue: import("./types").GetResultingDataTypeFromProperties<{
            streetName: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            zipCode: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            state: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            apt: data.Data<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TBoxedValue: {
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                };
            }>;
        }>;
        TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
            streetName: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            zipCode: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            state: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            apt: data.Data<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TBoxedValue: {
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                };
            }>;
        }>;
        TBoxedValue: {
            streetName: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            zipCode: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            state: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            apt: data.Data<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TBoxedValue: {
                    number: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: data.Data<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: data.Data<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                };
            }>;
        };
    }>;
};
declare type UserProperties = typeof userProperties;
declare type UserRelationalData = {
    todos: IOneToManyQueryBuilder<TodoNode>;
};
export declare type UserNode = INode<'user', UserProperties, {
    displayName: string;
}, UserRelationalData, {}>;
export declare function generateUserNode(mmGQLInstance: IMMGQL, cachedTodoNode?: TodoNode): UserNode;
declare const todoProperties: {
    task: {
        (defaultValue: string): data.Data<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: data.Data<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: data.Data<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    done: IData<{
        TValue: string | boolean;
        TParsedValue: boolean;
        TBoxedValue: undefined;
    }>;
    assigneeId: {
        (defaultValue: string): data.Data<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: data.Data<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: data.Data<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    meetingId: data.Data<{
        TValue: import("./types").Maybe<string>;
        TParsedValue: import("./types").Maybe<string>;
        TBoxedValue: undefined;
    }>;
    settings: data.Data<{
        TValue: import("./types").GetResultingDataTypeFromProperties<{
            archiveAfterMeeting: data.Data<{
                TValue: import("./types").Maybe<string | boolean>;
                TParsedValue: import("./types").Maybe<boolean>;
                TBoxedValue: undefined;
            }>;
            nestedSettings: data.Data<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>;
                TBoxedValue: {
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }>;
            nestedRecord: data.Data<{
                TValue: Record<string, boolean>;
                TParsedValue: Record<string, boolean>;
                TBoxedValue: IData<{
                    TValue: string | boolean;
                    TParsedValue: boolean;
                    TBoxedValue: undefined;
                }>;
            }>;
        }>;
        TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
            archiveAfterMeeting: data.Data<{
                TValue: import("./types").Maybe<string | boolean>;
                TParsedValue: import("./types").Maybe<boolean>;
                TBoxedValue: undefined;
            }>;
            nestedSettings: data.Data<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>;
                TBoxedValue: {
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }>;
            nestedRecord: data.Data<{
                TValue: Record<string, boolean>;
                TParsedValue: Record<string, boolean>;
                TBoxedValue: IData<{
                    TValue: string | boolean;
                    TParsedValue: boolean;
                    TBoxedValue: undefined;
                }>;
            }>;
        }>;
        TBoxedValue: {
            archiveAfterMeeting: data.Data<{
                TValue: import("./types").Maybe<string | boolean>;
                TParsedValue: import("./types").Maybe<boolean>;
                TBoxedValue: undefined;
            }>;
            nestedSettings: data.Data<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>;
                TBoxedValue: {
                    nestedNestedMaybe: data.Data<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }>;
            nestedRecord: data.Data<{
                TValue: Record<string, boolean>;
                TParsedValue: Record<string, boolean>;
                TBoxedValue: IData<{
                    TValue: string | boolean;
                    TParsedValue: boolean;
                    TBoxedValue: undefined;
                }>;
            }>;
        };
    }>;
    dataSetIds: {
        (defaultValue: any[]): data.Data<{
            TValue: any[];
            TParsedValue: any[];
            TBoxedValue: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }>;
        optional: data.Data<{
            TValue: import("./types").Maybe<any[]>;
            TParsedValue: import("./types").Maybe<any[]>;
            TBoxedValue: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }>;
        _default: data.Data<{
            TValue: any[];
            TParsedValue: any[];
            TBoxedValue: {
                (defaultValue: string): data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: data.Data<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: data.Data<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }>;
    };
    comments: data.Data<{
        TValue: import("./types").Maybe<any[]>;
        TParsedValue: import("./types").Maybe<any[]>;
        TBoxedValue: data.Data<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    }>;
    record: data.Data<{
        TValue: Record<string, any>;
        TParsedValue: Record<string, any>;
        TBoxedValue: {
            (defaultValue: string): data.Data<{
                TValue: string;
                TParsedValue: string;
                TBoxedValue: undefined;
            }>;
            _default: data.Data<{
                TValue: string;
                TParsedValue: string;
                TBoxedValue: undefined;
            }>;
            optional: data.Data<{
                TValue: import("./types").Maybe<string>;
                TParsedValue: import("./types").Maybe<string>;
                TBoxedValue: undefined;
            }>;
        };
    }>;
};
export declare type TodoProperties = typeof todoProperties;
export declare type TodoRelationalData = {
    assignee: IOneToOneQueryBuilder<UserNode>;
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
    users: import("./types").UseSubscriptionQueryDefinition<{
        TNode: INode<any, NodeComputedFns<{
            TNodeData: any;
            TNodeComputedData: any;
        }>, import("./types").NodeDO>;
        TMapFn: import("./types").MapFnForNode<unknown> | undefined;
        TQueryDefinitionTarget: QueryDefinitionTarget;
        TUseSubscriptionQueryDefinitionOpts: import("./types").UseSubscriptionQueryDefinitionOpts;
    }>;
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
}): Config;
export declare function autoIndentGQL(gqlString: string): string;
export {};
