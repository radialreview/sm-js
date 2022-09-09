import { MMGQL } from '.';
import { IOneToOneQueryBuilder, IOneToManyQueryBuilder, INode, IMMGQL, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeComputedFns, NodeRelationalFns, Config, NodeDefaultProps, EPaginationFilteringSortingInstance } from './types';
declare const userProperties: {
    firstName: {
        (defaultValue: string): IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    lastName: IData<{
        TValue: string;
        TParsedValue: string;
        TBoxedValue: undefined;
    }>;
    score: {
        (defaultValue: number): IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
    archived: IData<{
        TValue: string | boolean;
        TParsedValue: boolean;
        TBoxedValue: undefined;
    }>;
    optionalProp: IData<{
        TValue: import("./types").Maybe<string>;
        TParsedValue: import("./types").Maybe<string>;
        TBoxedValue: undefined;
    }>;
    address: IData<{
        TValue: import("./types").GetResultingDataTypeFromProperties<{
            streetName: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            zipCode: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            state: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            apt: IData<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TBoxedValue: {
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
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
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            zipCode: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            state: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            apt: IData<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TBoxedValue: {
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
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
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            zipCode: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            state: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            apt: IData<{
                TValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }>;
                TBoxedValue: {
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
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
export declare type UserNode = INode<{
    TNodeType: 'user';
    TNodeData: UserProperties;
    TNodeComputedData: {
        displayName: string;
    };
    TNodeRelationalData: UserRelationalData;
}>;
export declare function generateUserNode(mmGQLInstance: IMMGQL, cachedTodoNode?: TodoNode): UserNode;
declare const todoProperties: {
    task: {
        (defaultValue: string): IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: IData<{
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
        (defaultValue: string): IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        _default: IData<{
            TValue: string;
            TParsedValue: string;
            TBoxedValue: undefined;
        }>;
        optional: IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    };
    meetingId: IData<{
        TValue: import("./types").Maybe<string>;
        TParsedValue: import("./types").Maybe<string>;
        TBoxedValue: undefined;
    }>;
    settings: IData<{
        TValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            archiveAfterMeeting: IData<{
                TValue: import("./types").Maybe<string | boolean>;
                TParsedValue: import("./types").Maybe<boolean>;
                TBoxedValue: undefined;
            }>;
            nestedSettings: IData<{
                TValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>>;
                TParsedValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>>;
                TBoxedValue: {
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }>;
            nestedRecord: IData<{
                TValue: Record<string, boolean>;
                TParsedValue: Record<string, boolean>;
                TBoxedValue: IData<{
                    TValue: string | boolean;
                    TParsedValue: boolean;
                    TBoxedValue: undefined;
                }>;
            }>;
        }>>;
        TParsedValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
            archiveAfterMeeting: IData<{
                TValue: import("./types").Maybe<string | boolean>;
                TParsedValue: import("./types").Maybe<boolean>;
                TBoxedValue: undefined;
            }>;
            nestedSettings: IData<{
                TValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>>;
                TParsedValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>>;
                TBoxedValue: {
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }>;
            nestedRecord: IData<{
                TValue: Record<string, boolean>;
                TParsedValue: Record<string, boolean>;
                TBoxedValue: IData<{
                    TValue: string | boolean;
                    TParsedValue: boolean;
                    TBoxedValue: undefined;
                }>;
            }>;
        }>>;
        TBoxedValue: {
            archiveAfterMeeting: IData<{
                TValue: import("./types").Maybe<string | boolean>;
                TParsedValue: import("./types").Maybe<boolean>;
                TBoxedValue: undefined;
            }>;
            nestedSettings: IData<{
                TValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>>;
                TParsedValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                }>>;
                TBoxedValue: {
                    nestedNestedMaybe: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }>;
            nestedRecord: IData<{
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
        (defaultValue: string[]): IData<{
            TValue: string[];
            TParsedValue: string[];
            TBoxedValue: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }>;
        optional: IData<{
            TValue: import("./types").Maybe<string[]>;
            TParsedValue: import("./types").Maybe<string[]>;
            TBoxedValue: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }>;
        _default: IData<{
            TValue: string[];
            TParsedValue: string[];
            TBoxedValue: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }>;
    };
    comments: IData<{
        TValue: import("./types").Maybe<import("./types").Maybe<string>[]>;
        TParsedValue: import("./types").Maybe<import("./types").Maybe<string>[]>;
        TBoxedValue: IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<string>;
            TBoxedValue: undefined;
        }>;
    }>;
    record: IData<{
        TValue: Record<string, string>;
        TParsedValue: Record<string, string>;
        TBoxedValue: {
            (defaultValue: string): IData<{
                TValue: string;
                TParsedValue: string;
                TBoxedValue: undefined;
            }>;
            _default: IData<{
                TValue: string;
                TParsedValue: string;
                TBoxedValue: undefined;
            }>;
            optional: IData<{
                TValue: import("./types").Maybe<string>;
                TParsedValue: import("./types").Maybe<string>;
                TBoxedValue: undefined;
            }>;
        };
    }>;
    numberProp: {
        (defaultValue: number): IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        _default: IData<{
            TValue: string;
            TParsedValue: number;
            TBoxedValue: undefined;
        }>;
        optional: IData<{
            TValue: import("./types").Maybe<string>;
            TParsedValue: import("./types").Maybe<number>;
            TBoxedValue: undefined;
        }>;
    };
};
export declare type TodoProperties = typeof todoProperties;
export declare type TodoRelationalData = {
    assignee: IOneToOneQueryBuilder<UserNode>;
    users: IOneToManyQueryBuilder<UserNode>;
};
export declare type TodoNode = INode<{
    TNodeType: 'todo';
    TNodeData: TodoProperties;
    TNodeComputedData: {};
    TNodeRelationalData: TodoRelationalData;
}>;
export declare function generateTodoNode(mmGQLInstance: IMMGQL, cachedUserNode?: UserNode): TodoNode;
export declare function generateDOInstance<TNodeType extends string, TNodeData extends Record<string, IData | DataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord>(opts: {
    properties: TNodeData;
    computed?: NodeComputedFns<{
        TNodeData: TNodeData & NodeDefaultProps;
        TNodeComputedData: TNodeComputedData;
    }>;
    relational?: NodeRelationalFns<TNodeRelationalData>;
    initialData: {
        id: string;
        version: number;
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
        TNode: UserNode;
        TMapFn: ({ todos, address }: {
            firstName: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            lastName: IData<{
                TValue: string;
                TParsedValue: string;
                TBoxedValue: undefined;
            }>;
            score: {
                (defaultValue: number): IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<number>;
                    TBoxedValue: undefined;
                }>;
            };
            archived: IData<{
                TValue: string | boolean;
                TParsedValue: boolean;
                TBoxedValue: undefined;
            }>;
            optionalProp: IData<{
                TValue: import("./types").Maybe<string>;
                TParsedValue: import("./types").Maybe<string>;
                TBoxedValue: undefined;
            }>;
            address: <TMapFn extends import("./types").MapFn<{
                TNodeData: {
                    streetName: {
                        (defaultValue: string): IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<string>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    zipCode: {
                        (defaultValue: string): IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<string>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    state: {
                        (defaultValue: string): IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<string>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    apt: IData<{
                        TValue: import("./types").GetResultingDataTypeFromProperties<{
                            number: {
                                (defaultValue: number): IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<number>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                            floor: {
                                (defaultValue: number): IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<number>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                        }>;
                        TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                            number: {
                                (defaultValue: number): IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<number>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                            floor: {
                                (defaultValue: number): IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<number>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                        }>;
                        TBoxedValue: {
                            number: {
                                (defaultValue: number): IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<number>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                            floor: {
                                (defaultValue: number): IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: number;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<number>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                        };
                    }>;
                };
                TNodeComputedData: {};
                TNodeRelationalData: {};
            }>>(opts: {
                map: TMapFn;
            }) => TMapFn;
        } & UserRelationalData & {
            dateCreated: {
                (defaultValue: number): IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<number>;
                    TBoxedValue: undefined;
                }>;
            };
            dateLastModified: {
                (defaultValue: number): IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<number>;
                    TBoxedValue: undefined;
                }>;
            };
            lastUpdatedClientTimestamp: {
                (defaultValue: number): IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<number>;
                    TBoxedValue: undefined;
                }>;
            };
            id: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
            version: {
                (defaultValue: number): IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: number;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<number>;
                    TBoxedValue: undefined;
                }>;
            };
            lastUpdatedBy: {
                (defaultValue: string): IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string;
                    TParsedValue: string;
                    TBoxedValue: undefined;
                }>;
                optional: IData<{
                    TValue: import("./types").Maybe<string>;
                    TParsedValue: import("./types").Maybe<string>;
                    TBoxedValue: undefined;
                }>;
            };
        }) => {
            address: ({ state, apt }: {
                streetName: {
                    (defaultValue: string): IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
                zipCode: {
                    (defaultValue: string): IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
                state: {
                    (defaultValue: string): IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
                apt: <TMapFn_1 extends import("./types").MapFn<{
                    TNodeData: {
                        number: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        floor: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                    };
                    TNodeComputedData: {};
                    TNodeRelationalData: {};
                }>>(opts: {
                    map: TMapFn_1;
                }) => TMapFn_1;
            } & {
                dateCreated: {
                    (defaultValue: number): IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<number>;
                        TBoxedValue: undefined;
                    }>;
                };
                dateLastModified: {
                    (defaultValue: number): IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<number>;
                        TBoxedValue: undefined;
                    }>;
                };
                lastUpdatedClientTimestamp: {
                    (defaultValue: number): IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<number>;
                        TBoxedValue: undefined;
                    }>;
                };
                id: {
                    (defaultValue: string): IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
                version: {
                    (defaultValue: number): IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: number;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<number>;
                        TBoxedValue: undefined;
                    }>;
                };
                lastUpdatedBy: {
                    (defaultValue: string): IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
            }) => {
                state: {
                    (defaultValue: string): IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string;
                        TParsedValue: string;
                        TBoxedValue: undefined;
                    }>;
                    optional: IData<{
                        TValue: import("./types").Maybe<string>;
                        TParsedValue: import("./types").Maybe<string>;
                        TBoxedValue: undefined;
                    }>;
                };
                apt: ({ floor, number }: {
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                } & {
                    dateCreated: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    dateLastModified: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    lastUpdatedClientTimestamp: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    id: {
                        (defaultValue: string): IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<string>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    version: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    lastUpdatedBy: {
                        (defaultValue: string): IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: string;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<string>;
                            TBoxedValue: undefined;
                        }>;
                    };
                }) => {
                    floor: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                    number: {
                        (defaultValue: number): IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string;
                            TParsedValue: number;
                            TBoxedValue: undefined;
                        }>;
                        optional: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<number>;
                            TBoxedValue: undefined;
                        }>;
                    };
                };
            };
            todos: import("./types").IOneToManyQuery<{
                TTargetNodeOrTargetNodeRecord: TodoNode;
                TQueryBuilderOpts: {
                    map: ({ assignee }: {
                        task: {
                            (defaultValue: string): IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
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
                            (defaultValue: string): IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<string>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        meetingId: IData<{
                            TValue: import("./types").Maybe<string>;
                            TParsedValue: import("./types").Maybe<string>;
                            TBoxedValue: undefined;
                        }>;
                        settings: <TMapFn_2 extends import("./types").MapFn<{
                            TNodeData: {
                                archiveAfterMeeting: IData<{
                                    TValue: import("./types").Maybe<string | boolean>;
                                    TParsedValue: import("./types").Maybe<boolean>;
                                    TBoxedValue: undefined;
                                }>;
                                nestedSettings: IData<{
                                    TValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                                        nestedNestedMaybe: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    }>>;
                                    TParsedValue: import("./types").Maybe<import("./types").GetResultingDataTypeFromProperties<{
                                        nestedNestedMaybe: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    }>>;
                                    TBoxedValue: {
                                        nestedNestedMaybe: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                }>;
                                nestedRecord: IData<{
                                    TValue: Record<string, boolean>;
                                    TParsedValue: Record<string, boolean>;
                                    TBoxedValue: IData<{
                                        TValue: string | boolean;
                                        TParsedValue: boolean;
                                        TBoxedValue: undefined;
                                    }>;
                                }>;
                            };
                            TNodeComputedData: {};
                            TNodeRelationalData: {};
                        }>>(opts: {
                            map: TMapFn_2;
                        }) => TMapFn_2;
                        dataSetIds: {
                            (defaultValue: string[]): IData<{
                                TValue: string[];
                                TParsedValue: string[];
                                TBoxedValue: {
                                    (defaultValue: string): IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    _default: IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    optional: IData<{
                                        TValue: import("./types").Maybe<string>;
                                        TParsedValue: import("./types").Maybe<string>;
                                        TBoxedValue: undefined;
                                    }>;
                                };
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string[]>;
                                TParsedValue: import("./types").Maybe<string[]>;
                                TBoxedValue: {
                                    (defaultValue: string): IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    _default: IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    optional: IData<{
                                        TValue: import("./types").Maybe<string>;
                                        TParsedValue: import("./types").Maybe<string>;
                                        TBoxedValue: undefined;
                                    }>;
                                };
                            }>;
                            _default: IData<{
                                TValue: string[];
                                TParsedValue: string[];
                                TBoxedValue: {
                                    (defaultValue: string): IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    _default: IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    optional: IData<{
                                        TValue: import("./types").Maybe<string>;
                                        TParsedValue: import("./types").Maybe<string>;
                                        TBoxedValue: undefined;
                                    }>;
                                };
                            }>;
                        };
                        comments: IData<{
                            TValue: import("./types").Maybe<import("./types").Maybe<string>[]>;
                            TParsedValue: import("./types").Maybe<import("./types").Maybe<string>[]>;
                            TBoxedValue: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<string>;
                                TBoxedValue: undefined;
                            }>;
                        }>;
                        record: IData<{
                            TValue: Record<string, string>;
                            TParsedValue: Record<string, string>;
                            TBoxedValue: {
                                (defaultValue: string): IData<{
                                    TValue: string;
                                    TParsedValue: string;
                                    TBoxedValue: undefined;
                                }>;
                                _default: IData<{
                                    TValue: string;
                                    TParsedValue: string;
                                    TBoxedValue: undefined;
                                }>;
                                optional: IData<{
                                    TValue: import("./types").Maybe<string>;
                                    TParsedValue: import("./types").Maybe<string>;
                                    TBoxedValue: undefined;
                                }>;
                            };
                        }>;
                        numberProp: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                    } & TodoRelationalData & {
                        dateCreated: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        dateLastModified: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        lastUpdatedClientTimestamp: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        id: {
                            (defaultValue: string): IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<string>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        version: {
                            (defaultValue: number): IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: number;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<number>;
                                TBoxedValue: undefined;
                            }>;
                        };
                        lastUpdatedBy: {
                            (defaultValue: string): IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string;
                                TParsedValue: string;
                                TBoxedValue: undefined;
                            }>;
                            optional: IData<{
                                TValue: import("./types").Maybe<string>;
                                TParsedValue: import("./types").Maybe<string>;
                                TBoxedValue: undefined;
                            }>;
                        };
                    }) => {
                        assignee: import("./types").IOneToOneQuery<{
                            TTargetNodeOrTargetNodeRecord: UserNode;
                            TQueryBuilderOpts: {
                                map: ({ firstName }: {
                                    firstName: {
                                        (defaultValue: string): IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    lastName: IData<{
                                        TValue: string;
                                        TParsedValue: string;
                                        TBoxedValue: undefined;
                                    }>;
                                    score: {
                                        (defaultValue: number): IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<number>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    archived: IData<{
                                        TValue: string | boolean;
                                        TParsedValue: boolean;
                                        TBoxedValue: undefined;
                                    }>;
                                    optionalProp: IData<{
                                        TValue: import("./types").Maybe<string>;
                                        TParsedValue: import("./types").Maybe<string>;
                                        TBoxedValue: undefined;
                                    }>;
                                    address: <TMapFn extends import("./types").MapFn<{
                                        TNodeData: {
                                            streetName: {
                                                (defaultValue: string): IData<{
                                                    TValue: string;
                                                    TParsedValue: string;
                                                    TBoxedValue: undefined;
                                                }>;
                                                _default: IData<{
                                                    TValue: string;
                                                    TParsedValue: string;
                                                    TBoxedValue: undefined;
                                                }>;
                                                optional: IData<{
                                                    TValue: import("./types").Maybe<string>;
                                                    TParsedValue: import("./types").Maybe<string>;
                                                    TBoxedValue: undefined;
                                                }>;
                                            };
                                            zipCode: {
                                                (defaultValue: string): IData<{
                                                    TValue: string;
                                                    TParsedValue: string;
                                                    TBoxedValue: undefined;
                                                }>;
                                                _default: IData<{
                                                    TValue: string;
                                                    TParsedValue: string;
                                                    TBoxedValue: undefined;
                                                }>;
                                                optional: IData<{
                                                    TValue: import("./types").Maybe<string>;
                                                    TParsedValue: import("./types").Maybe<string>;
                                                    TBoxedValue: undefined;
                                                }>;
                                            };
                                            state: {
                                                (defaultValue: string): IData<{
                                                    TValue: string;
                                                    TParsedValue: string;
                                                    TBoxedValue: undefined;
                                                }>;
                                                _default: IData<{
                                                    TValue: string;
                                                    TParsedValue: string;
                                                    TBoxedValue: undefined;
                                                }>;
                                                optional: IData<{
                                                    TValue: import("./types").Maybe<string>;
                                                    TParsedValue: import("./types").Maybe<string>;
                                                    TBoxedValue: undefined;
                                                }>;
                                            };
                                            apt: IData<{
                                                TValue: import("./types").GetResultingDataTypeFromProperties<{
                                                    number: {
                                                        (defaultValue: number): IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        _default: IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        optional: IData<{
                                                            TValue: import("./types").Maybe<string>;
                                                            TParsedValue: import("./types").Maybe<number>;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                    };
                                                    floor: {
                                                        (defaultValue: number): IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        _default: IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        optional: IData<{
                                                            TValue: import("./types").Maybe<string>;
                                                            TParsedValue: import("./types").Maybe<number>;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                    };
                                                }>;
                                                TParsedValue: import("./types").GetResultingDataTypeFromProperties<{
                                                    number: {
                                                        (defaultValue: number): IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        _default: IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        optional: IData<{
                                                            TValue: import("./types").Maybe<string>;
                                                            TParsedValue: import("./types").Maybe<number>;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                    };
                                                    floor: {
                                                        (defaultValue: number): IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        _default: IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        optional: IData<{
                                                            TValue: import("./types").Maybe<string>;
                                                            TParsedValue: import("./types").Maybe<number>;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                    };
                                                }>;
                                                TBoxedValue: {
                                                    number: {
                                                        (defaultValue: number): IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        _default: IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        optional: IData<{
                                                            TValue: import("./types").Maybe<string>;
                                                            TParsedValue: import("./types").Maybe<number>;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                    };
                                                    floor: {
                                                        (defaultValue: number): IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        _default: IData<{
                                                            TValue: string;
                                                            TParsedValue: number;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                        optional: IData<{
                                                            TValue: import("./types").Maybe<string>;
                                                            TParsedValue: import("./types").Maybe<number>;
                                                            TBoxedValue: undefined;
                                                        }>;
                                                    };
                                                };
                                            }>;
                                        };
                                        TNodeComputedData: {};
                                        TNodeRelationalData: {};
                                    }>>(opts: {
                                        map: TMapFn;
                                    }) => TMapFn;
                                } & UserRelationalData & {
                                    dateCreated: {
                                        (defaultValue: number): IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<number>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    dateLastModified: {
                                        (defaultValue: number): IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<number>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    lastUpdatedClientTimestamp: {
                                        (defaultValue: number): IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<number>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    id: {
                                        (defaultValue: string): IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    version: {
                                        (defaultValue: number): IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: number;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<number>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                    lastUpdatedBy: {
                                        (defaultValue: string): IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                }) => {
                                    firstName: {
                                        (defaultValue: string): IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string;
                                            TParsedValue: string;
                                            TBoxedValue: undefined;
                                        }>;
                                        optional: IData<{
                                            TValue: import("./types").Maybe<string>;
                                            TParsedValue: import("./types").Maybe<string>;
                                            TBoxedValue: undefined;
                                        }>;
                                    };
                                };
                            };
                        }>;
                    };
                };
            }>;
        };
        TQueryDefinitionTarget: {
            id: string;
            allowNullResult?: boolean | undefined;
        } | {
            ids: string[];
        };
        TUseSubscriptionQueryDefinitionOpts: {
            doNotSuspend: boolean | undefined;
        };
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
    mockData?: any;
    generateMockData?: boolean;
    enableQuerySlimming?: boolean;
    enableQuerySlimmingLogging?: boolean;
    paginationFilteringSortingInstance: EPaginationFilteringSortingInstance;
}): Config;
export declare function autoIndentGQL(gqlString: string): string;
export declare function convertNodesCollectionValuesToArray<T extends Record<string, any>>(obj: T): Record<string, any>;
export {};
