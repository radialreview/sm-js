import { MMGQL } from '.';
import { IOneToOneQueryBuilder, IOneToManyQueryBuilder, INode, IMMGQL, IData, DataDefaultFn, NodeRelationalQueryBuilderRecord, NodeComputedFns, NodeRelationalFns, Config, NodeDefaultProps, EPaginationFilteringSortingInstance, DocumentNode, ValidFilterForNode, INonPaginatedOneToManyQueryBuilder, Id } from './types';
import { PageInfoFromResults } from './nodesCollection';
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
    nonPaginatedTodos: INonPaginatedOneToManyQueryBuilder<TodoNode>;
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
    enumProp: IData<{
        TValue: "A" | "B" | "C";
        TParsedValue: "A" | "B" | "C";
        TBoxedValue: undefined;
    }>;
    maybeEnumProp: IData<{
        TValue: import("./types").Maybe<"A" | "B" | "C">;
        TParsedValue: import("./types").Maybe<"A" | "B" | "C">;
        TBoxedValue: undefined;
    }>;
};
export declare type TodoProperties = typeof todoProperties;
export declare type TodoRelationalData = {
    assignee: IOneToOneQueryBuilder<UserNode>;
    users: IOneToManyQueryBuilder<UserNode>;
    nonPaginatedUsers: INonPaginatedOneToManyQueryBuilder<UserNode>;
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
        id: Id;
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
    todosFilter?: ValidFilterForNode<TodoNode, true>;
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
                TNodeComputedData: Record<string, never>;
                TNodeRelationalData: Record<string, never>;
            }>>(opts: {
                map: TMapFn;
            }) => TMapFn;
        } & import("./types").RemoveNevers<UserRelationalData> & {
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
                (defaultValue: string | number): IData<{
                    TValue: string | number;
                    TParsedValue: string | number;
                    TBoxedValue: undefined;
                }>;
                _default: IData<{
                    TValue: string | number;
                    TParsedValue: string | number;
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
                    TNodeComputedData: Record<string, never>;
                    TNodeRelationalData: Record<string, never>;
                }>>(opts: {
                    map: TMapFn_1;
                }) => TMapFn_1;
            } & Record<string, never> & {
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
                    (defaultValue: string | number): IData<{
                        TValue: string | number;
                        TParsedValue: string | number;
                        TBoxedValue: undefined;
                    }>;
                    _default: IData<{
                        TValue: string | number;
                        TParsedValue: string | number;
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
                } & Record<string, never> & {
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
                        (defaultValue: string | number): IData<{
                            TValue: string | number;
                            TParsedValue: string | number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string | number;
                            TParsedValue: string | number;
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
                            TNodeComputedData: Record<string, never>;
                            TNodeRelationalData: Record<string, never>;
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
                        enumProp: IData<{
                            TValue: "A" | "B" | "C";
                            TParsedValue: "A" | "B" | "C";
                            TBoxedValue: undefined;
                        }>;
                        maybeEnumProp: IData<{
                            TValue: import("./types").Maybe<"A" | "B" | "C">;
                            TParsedValue: import("./types").Maybe<"A" | "B" | "C">;
                            TBoxedValue: undefined;
                        }>;
                    } & import("./types").RemoveNevers<TodoRelationalData> & {
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
                            (defaultValue: string | number): IData<{
                                TValue: string | number;
                                TParsedValue: string | number;
                                TBoxedValue: undefined;
                            }>;
                            _default: IData<{
                                TValue: string | number;
                                TParsedValue: string | number;
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
                                        TNodeComputedData: Record<string, never>;
                                        TNodeRelationalData: Record<string, never>;
                                    }>>(opts: {
                                        map: TMapFn;
                                    }) => TMapFn;
                                } & import("./types").RemoveNevers<UserRelationalData> & {
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
                                        (defaultValue: string | number): IData<{
                                            TValue: string | number;
                                            TParsedValue: string | number;
                                            TBoxedValue: undefined;
                                        }>;
                                        _default: IData<{
                                            TValue: string | number;
                                            TParsedValue: string | number;
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
                    filter: Partial<Partial<{
                        task: import("./types").FilterValue<string, true>;
                        done: import("./types").FilterValue<boolean, true>;
                        assigneeId: import("./types").FilterValue<string, true>;
                        meetingId: import("./types").FilterValue<import("./types").Maybe<string>, true>;
                        settings: Partial<{
                            archiveAfterMeeting: import("./types").FilterValue<import("./types").Maybe<boolean>, true>;
                            nestedSettings: Partial<{
                                nestedNestedMaybe: import("./types").FilterValue<import("./types").Maybe<string>, true>;
                            } | null>;
                            nestedRecord: Partial<{
                                [x: string]: boolean;
                            } | {
                                condition?: import("./types").CollectionFilterCondition | undefined;
                            }>;
                        } | null>;
                        numberProp: import("./types").FilterValue<number, true>;
                        enumProp: import("./types").FilterValue<"A" | "B" | "C", true>;
                        maybeEnumProp: import("./types").FilterValue<import("./types").Maybe<"A" | "B" | "C">, true>;
                        dateCreated: import("./types").FilterValue<number, true>;
                        dateLastModified: import("./types").FilterValue<number, true>;
                        lastUpdatedClientTimestamp: import("./types").FilterValue<number, true>;
                        id: import("./types").FilterValue<string | number, true>;
                        version: import("./types").FilterValue<number, true>;
                        lastUpdatedBy: import("./types").FilterValue<string, true>;
                    }>> | undefined;
                };
                TIncludeTotalCount: boolean;
                TMapFn: ({ assignee }: {
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
                        TNodeComputedData: Record<string, never>;
                        TNodeRelationalData: Record<string, never>;
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
                    enumProp: IData<{
                        TValue: "A" | "B" | "C";
                        TParsedValue: "A" | "B" | "C";
                        TBoxedValue: undefined;
                    }>;
                    maybeEnumProp: IData<{
                        TValue: import("./types").Maybe<"A" | "B" | "C">;
                        TParsedValue: import("./types").Maybe<"A" | "B" | "C">;
                        TBoxedValue: undefined;
                    }>;
                } & import("./types").RemoveNevers<TodoRelationalData> & {
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
                        (defaultValue: string | number): IData<{
                            TValue: string | number;
                            TParsedValue: string | number;
                            TBoxedValue: undefined;
                        }>;
                        _default: IData<{
                            TValue: string | number;
                            TParsedValue: string | number;
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
                                    TNodeComputedData: Record<string, never>;
                                    TNodeRelationalData: Record<string, never>;
                                }>>(opts: {
                                    map: TMapFn;
                                }) => TMapFn;
                            } & import("./types").RemoveNevers<UserRelationalData> & {
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
                                    (defaultValue: string | number): IData<{
                                        TValue: string | number;
                                        TParsedValue: string | number;
                                        TBoxedValue: undefined;
                                    }>;
                                    _default: IData<{
                                        TValue: string | number;
                                        TParsedValue: string | number;
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
            }>;
        };
        TQueryDefinitionTarget: {
            id: Id;
            allowNullResult?: boolean | undefined;
        } | {
            ids: Id[];
        };
        TUseSubscriptionQueryDefinitionOpts: {
            doNotSuspend: boolean | undefined;
        };
        TIncludeTotalCount: boolean;
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
    address: {
        state: string;
        apt: {
            floor: number;
            number: number;
        };
    };
    firstName: string;
    optionalProp: null;
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
        nodes: ({
            id: string;
            type: string;
            version: string;
            address: {
                state: string;
                apt: {
                    floor: number;
                    number: number;
                };
            };
            todos: {
                nodes: ({
                    version: string;
                    id: string;
                    type: string;
                    assignee: {
                        id: string;
                        type: string;
                        version: string;
                        firstName: string;
                    };
                } & {
                    id: string;
                })[];
                totalCount: number;
                pageInfo: PageInfoFromResults;
            };
        } & {
            id: string;
        })[];
        totalCount: number;
        pageInfo: PageInfoFromResults;
    };
};
export declare const getMockQueryResultExpectations: (opts: {
    useServerSidePaginationFilteringSorting: boolean;
}) => Record<string, any>;
export declare function getMockQueryRecord(mmGQLInstance: IMMGQL): import("./types").QueryRecord;
export declare function getMockSubscriptionMessage(mmGQLInstance: IMMGQL): {
    users: {
        node: {
            id: string;
            type: string;
            address: {
                state: string;
            };
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
    getMockData?: () => any;
    generateMockData?: boolean;
    enableQuerySlimming?: boolean;
    logging?: Partial<Config['logging']>;
    paginationFilteringSortingInstance?: EPaginationFilteringSortingInstance;
    onQueryPerformed?: (query: DocumentNode) => void;
    failQuery?: () => any;
}): Config;
export declare function autoIndentGQL(gqlString: string): string;
export declare function getPrettyPrintedGQL(documentNode: DocumentNode): string;
export declare function convertNodesCollectionValuesToArray<T extends Record<string, any>>(opts: {
    obj: T;
    useServerSidePaginationFilteringSorting: boolean;
}): Record<string, any>;
export declare function createMockDataItems<T>(opts: {
    sampleMockData: T & {
        id: Id;
    };
    items: Array<Partial<any>>;
    pageInfo?: Partial<PageInfoFromResults>;
    totalCount?: number;
}): {
    nodes: (T & {
        id: string;
    })[];
    totalCount: number;
    pageInfo: PageInfoFromResults;
};
export declare function createNonPaginatedMockDataItems<T>(opts: {
    sampleMockData: T & {
        id: Id;
    };
    items: Array<Partial<any>>;
}): (T & {
    id: string;
})[];
export {};
