import {
  createMockQueryDefinitions,
  generateUserNode,
  generateTodoNode,
  TodoNode,
  getMockConfig,
  getMockQueryRecord,
  getPrettyPrintedGQL,
  UserNode,
} from '../specUtilities';
import {
  getQueryRecordFromQueryDefinition,
  getQueryGQLDocumentFromQueryRecord,
  getSubscriptionGQLDocumentsFromQueryRecord,
} from './queryDefinitionAdapters';
import {
  object,
  queryDefinition,
  oneToOne,
  string,
  oneToMany,
  nonPaginatedOneToMany,
  boolean,
} from '../dataTypes';
import { MMGQL } from '..';
import {
  IOneToOneQueryBuilder,
  INode,
  MapFnForNode,
  QueryRecordEntry,
  DocumentNode,
  IOneToManyQueryBuilder,
  INonPaginatedOneToManyQueryBuilder,
} from '../types';
import {
  DEFAULT_TOKEN_NAME,
  PROPERTIES_QUERIED_FOR_ALL_NODES,
  RELATIONAL_UNION_QUERY_SEPARATOR,
} from '../consts';

describe('getQueryRecordFromQueryDefinition', () => {
  it('returns a query record with all the nodes that need to be fetched within a fetcher config', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const todoNode = generateTodoNode(mmGQLInstance);
    const userNode = generateUserNode(mmGQLInstance, todoNode);

    const record = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: {
        todos: queryDefinition({
          def: todoNode,
          map: ({ task }) => ({ task }),
        }),
        users: queryDefinition({
          def: userNode,
          map: ({ firstName, lastName }) => ({
            firstName,
            lastName,
          }),
        }),
      },
    });

    expect(record.todos).toEqual(
      expect.objectContaining({
        def: expect.objectContaining({ type: 'todo' }),
        properties: [...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES), 'task'],
      })
    );

    expect(record.users).toEqual(
      expect.objectContaining({
        def: expect.objectContaining({ type: 'user' }),
        properties: [
          ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
          'firstName',
          'lastName',
        ],
      })
    );
  });

  it('handles querying partial objects within a node', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
    }).users as QueryRecordEntry & { underIds: Array<string> };

    expect(queryRecord.def).toEqual(expect.objectContaining({ type: 'user' }));
    expect(queryRecord.properties).toEqual([
      ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
      'address__dot__state',
      'address__dot__apt__dot__floor',
      'address__dot__apt__dot__number',
    ]);
  });

  it('handles relational queries', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
      }).users?.relational
    ).toEqual(
      expect.objectContaining({
        todos: expect.objectContaining({
          def: expect.objectContaining({ type: 'todo' }),
          properties: [...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES)],
          oneToMany: true,
        }),
      })
    );
  });

  it('handles nested relational queries', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
      }).users?.relational?.todos.relational
    ).toEqual(
      expect.objectContaining({
        assignee: expect.objectContaining({
          def: expect.objectContaining({ type: 'user' }),
          properties: [
            ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
            'firstName',
          ],
          oneToOne: true,
        }),
      })
    );
  });

  it('handles oneToOne queries', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const userProperties = {};
    type UserNode = INode<{
      TNodeType: 'user';
      TNodeData: typeof userProperties;
      TNodeComputedData: {};
      TNodeRelationalData: { todo: IOneToOneQueryBuilder<TodoNode> };
    }>;
    const userNode: UserNode = mmGQLInstance.def({
      type: 'user',
      properties: {},
      relational: {
        todo: () => oneToOne(generateTodoNode(mmGQLInstance)),
      },
    });

    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: {
          users: queryDefinition({
            def: userNode,
            map: ({ todo }) => ({
              todo: todo({
                map: () => ({}),
              }),
            }),
          }),
        },
      }).users?.relational
    ).toEqual(
      expect.objectContaining({
        todo: expect.objectContaining({
          def: expect.objectContaining({ type: 'todo' }),
          _relationshipName: 'todo',
          oneToOne: true,
        }),
      })
    );
  });

  it('handles oneToOne queries which return a union of node types', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const userProperties = {
      firstName: string,
      lastName: string,
    };
    const meetingGuestProperties = {
      firstName: string,
    };
    type UserNode = INode<{
      TNodeType: 'user';
      TNodeData: typeof userProperties;
      TNodeComputedData: {};
      TNodeRelationalData: {};
    }>;
    type MeetingGuestNode = INode<{
      TNodeType: 'meetingGuest';
      TNodeData: typeof meetingGuestProperties;
      TNodeComputedData: {};
      TNodeRelationalData: {};
    }>;
    const userNode: UserNode = mmGQLInstance.def({
      type: 'user',
      properties: userProperties,
    });
    const meetingGuestNode: MeetingGuestNode = mmGQLInstance.def({
      type: 'meetingGuest',
      properties: meetingGuestProperties,
    });

    const todoProperties = {
      assigneeId: string,
    };
    type TodoNode = INode<{
      TNodeType: 'todo';
      TNodeData: typeof todoProperties;
      TNodeComputedData: {};
      TNodeRelationalData: {
        assignee: IOneToOneQueryBuilder<{
          user: UserNode;
          meetingGuest: MeetingGuestNode;
        }>;
      };
    }>;
    const todoNode: TodoNode = mmGQLInstance.def({
      type: 'todo',
      properties: todoProperties,
      relational: {
        assignee: () =>
          oneToOne({
            user: userNode,
            meetingGuest: meetingGuestNode,
          }),
      },
    });

    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: {
          todos: queryDefinition({
            def: todoNode,
            map: ({ assignee }) => ({
              assignee: assignee({
                user: { map: ({ lastName }) => ({ lastName }) },
                meetingGuest: {
                  map: ({ firstName }) => ({ firstName }),
                },
              }),
            }),
          }),
        },
      }).todos?.relational
    ).toEqual({
      [`assignee${RELATIONAL_UNION_QUERY_SEPARATOR}user`]: expect.objectContaining(
        {
          def: userNode,
          properties: [
            ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
            'lastName',
          ],
        }
      ),
      [`assignee${RELATIONAL_UNION_QUERY_SEPARATOR}meetingGuest`]: expect.objectContaining(
        {
          def: meetingGuestNode,
          properties: [
            ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
            'firstName',
          ],
        }
      ),
    });
  });

  it('handles oneToMany queries', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const todoProperties = {};
    type TodoNode = INode<{
      TNodeType: 'todo';
      TNodeData: typeof todoProperties;
      TNodeComputedData: {};
      TNodeRelationalData: { assignees: IOneToManyQueryBuilder<UserNode> };
    }>;
    const todoNode: TodoNode = mmGQLInstance.def({
      type: 'todo',
      properties: {},
      relational: {
        assignees: () => oneToMany(generateUserNode(mmGQLInstance)),
      },
    });

    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: {
          todos: queryDefinition({
            def: todoNode,
            map: ({ assignees }) => ({
              assignees: assignees({
                map: () => ({}),
              }),
            }),
          }),
        },
      }).todos?.relational
    ).toEqual(
      expect.objectContaining({
        assignees: expect.objectContaining({
          def: expect.objectContaining({ type: 'user' }),
          _relationshipName: 'assignees',
          oneToMany: true,
        }),
      })
    );
  });

  it('handles nonPaginatedOneToMany queries', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const todoProperties = {};
    type TodoNode = INode<{
      TNodeType: 'todo';
      TNodeData: typeof todoProperties;
      TNodeComputedData: {};
      TNodeRelationalData: {
        assignees: INonPaginatedOneToManyQueryBuilder<UserNode>;
      };
    }>;
    const todoNode: TodoNode = mmGQLInstance.def({
      type: 'todo',
      properties: {},
      relational: {
        assignees: () => nonPaginatedOneToMany(generateUserNode(mmGQLInstance)),
      },
    });

    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: {
          todos: queryDefinition({
            def: todoNode,
            map: ({ assignees }) => ({
              assignees: assignees({
                map: () => ({}),
              }),
            }),
          }),
        },
      }).todos?.relational
    ).toEqual(
      expect.objectContaining({
        assignees: expect.objectContaining({
          def: expect.objectContaining({ type: 'user' }),
          _relationshipName: 'assignees',
          nonPaginatedOneToMany: true,
        }),
      })
    );
  });

  it('handles omitting map fn for objects, and will query all data in that object', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(mmGQLInstance),
            map: ({ settings }) => ({
              settings,
            }),
          }),
        },
      }).todos?.properties
    ).toEqual([
      ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
      'settings__dot__archiveAfterMeeting',
      'settings__dot__nestedSettings__dot__nestedNestedMaybe',
      'settings__dot__nestedRecord',
    ]);
  });

  it('handles querying all data within a related node, by using an undefined map fn for that relationship', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const relationalResults = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: {
        todos: queryDefinition({
          def: generateTodoNode(mmGQLInstance),
          map: ({ assignee }) => ({
            assignee: assignee({
              map: undefined,
            }),
          }),
        }),
      },
    }).todos?.relational;

    expect(relationalResults).toEqual(
      expect.objectContaining({
        assignee: expect.objectContaining({
          def: expect.objectContaining({ type: 'user' }),
          properties: [
            ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
            'firstName',
            'lastName',
            'score',
            'archived',
            'optionalProp',
            'address__dot__streetName',
            'address__dot__zipCode',
            'address__dot__state',
            'address__dot__apt__dot__number',
            'address__dot__apt__dot__floor',
            'dateCreated',
            'dateLastModified',
            'lastUpdatedClientTimestamp',
          ],
          oneToOne: true,
        }),
      })
    );

    // no relational properties queried for each assignee, you have to call the relational builders
    // if the dev wants relational properties included in that query, they must explicitely call the relational query builder
    // map: allUserData => ({
    //   ...allUserData,
    //   organization: allUserData.organization({
    //       map: orgData => orgData
    //   })
    // })
    expect(relationalResults?.assignee.relational).toBe(undefined);

    const withDoubleNestedObjResults = getQueryRecordFromQueryDefinition({
      queryId: 'queryId2',
      queryDefinitions: {
        mockNodes: queryDefinition({
          def: mmGQLInstance.def({
            type: 'mockNodeType',
            properties: {
              obj: object({
                nested: object({
                  doubleNested: object({
                    label: string,
                  }),
                }),
              }),
            },
          }),
          map: ({ obj }) => ({
            obj,
          }),
        }),
      },
    });

    expect(withDoubleNestedObjResults.mockNodes?.properties).toEqual([
      ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
      'obj__dot__nested__dot__doubleNested__dot__label',
    ]);
  });
});

//
// query document tests
//
describe('getQueryGQLDocumentFromQueryRecord', () => {
  it('creates a valid query from a fetcher config', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getMockQueryRecord(mmGQLInstance),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       users: users {
         nodes {
           id
           version
           lastUpdatedBy
           type
           address {
             state
             apt {
               floor
               number
             }
           }
           todos: todos {
             nodes {
               id
               version
               lastUpdatedBy
               type
               assignee: assignee {
                 id
                 version
                 lastUpdatedBy
                 type
                 firstName
               }
             }
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('handles multiple aliases', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              users: createMockQueryDefinitions(mmGQLInstance).users,
              otherAlias: createMockQueryDefinitions(mmGQLInstance).users,
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       users: users {
         nodes {
           id
           version
           lastUpdatedBy
           type
           address {
             state
             apt {
               floor
               number
             }
           }
           todos: todos {
             nodes {
               id
               version
               lastUpdatedBy
               type
               assignee: assignee {
                 id
                 version
                 lastUpdatedBy
                 type
                 firstName
               }
             }
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
       otherAlias: users {
         nodes {
           id
           version
           lastUpdatedBy
           type
           address {
             state
             apt {
               floor
               number
             }
           }
           todos: todos {
             nodes {
               id
               version
               lastUpdatedBy
               type
               assignee: assignee {
                 id
                 version
                 lastUpdatedBy
                 type
                 firstName
               }
             }
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('handles fetching specific ids', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: createMockQueryDefinitions(mmGQLInstance, {
              useIds: true,
            }),
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       users: users(ids: [\\"mock-id\\"]) {
         nodes {
           id
           version
           lastUpdatedBy
           type
           address {
             state
             apt {
               floor
               number
             }
           }
           todos: todos {
             nodes {
               id
               version
               lastUpdatedBy
               type
               assignee: assignee {
                 id
                 version
                 lastUpdatedBy
                 type
                 firstName
               }
             }
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('handles fetching nonPaginatedOneToMany data', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: {
            users: {
              def: generateUserNode(mmGQLInstance),
              properties: ['id'],
              relational: {
                todos: {
                  def: generateTodoNode(mmGQLInstance),
                  properties: ['id'],
                  _relationshipName: 'todos',
                  nonPaginatedOneToMany: true,
                },
              },
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       users: users {
         nodes {
           id
           todos: todos {
             id
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('handles shorthand query definitions', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: generateTodoNode(mmGQLInstance),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos {
         nodes {
           id
           version
           lastUpdatedBy
           type
           task
           done
           assigneeId
           meetingId
           settings {
             archiveAfterMeeting
             nestedSettings {
               nestedNestedMaybe
             }
             nestedRecord
           }
           dataSetIds
           comments
           record
           numberProp
           enumProp
           maybeEnumProp
           dateCreated
           dateLastModified
           lastUpdatedClientTimestamp
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('handles map fn omission', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: {
                def: generateTodoNode(mmGQLInstance),
                map: undefined,
              },
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos {
         nodes {
           id
           version
           lastUpdatedBy
           type
           task
           done
           assigneeId
           meetingId
           settings {
             archiveAfterMeeting
             nestedSettings {
               nestedNestedMaybe
             }
             nestedRecord
           }
           dataSetIds
           comments
           record
           numberProp
           enumProp
           maybeEnumProp
           dateCreated
           dateLastModified
           lastUpdatedClientTimestamp
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports strict equality filters', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                filter: {
                  task: 'get it done',
                  done: false,
                  meetingId: null,
                  dateCreated: 1,
                },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(where: {and: [{task: {eq: \\"get it done\\"}}, {done: {eq: false}}, {meetingId: {eq: null}}, {dateCreated: {eq: 1}}]}) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports multiple filters per prop', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                filter: {
                  dateCreated: { gte: 1, lte: 300 },
                },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(where: {and: [{dateCreated: {gte: 1, lte: 300}}]}) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports "or" filters', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                filter: { task: { condition: 'or', eq: 'get it done' } },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(where: {or: [{task: {eq: \\"get it done\\"}}]}) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports "and" filters', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                filter: { task: { condition: 'and', eq: 'get it done' } },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(where: {and: [{task: {eq: \\"get it done\\"}}]}) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports enum filters, avoiding quotes around values', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                filter: {
                  enumProp: { condition: 'and', eq: 'A' },
                  maybeEnumProp: { condition: 'or', eq: null },
                },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(where: {and: [{enumProp: {eq: A}}], or: [{maybeEnumProp: {eq: null}}]}) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports nested data filters, using "some" as the default filter for oneToMany relationships', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: {
            users: {
              def: generateUserNode(mmGQLInstance),
              properties: ['id'],
              relational: {
                todos: {
                  def: generateTodoNode(mmGQLInstance),
                  properties: ['id', 'task'],
                  _relationshipName: 'todos',
                  oneToMany: true,
                },
              },
              filter: {
                todos: {
                  task: 'get it done',
                },
              },
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       users: users(where: {and: [{todos: {some: {task: {eq: \\"get it done\\"}}}}]}) {
         nodes {
           id
           todos: todos {
             nodes {
               id
               task
             }
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports nested data filters, using other conditions for oneToMany relationships', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: {
            users: {
              def: generateUserNode(mmGQLInstance),
              properties: ['id'],
              relational: {
                todos: {
                  def: generateTodoNode(mmGQLInstance),
                  properties: ['id', 'task'],
                  _relationshipName: 'todos',
                  oneToMany: true,
                },
              },
              filter: {
                todos: {
                  task: {
                    condition: 'all',
                    eq: 'get it done',
                  },
                  id: {
                    condition: 'none',
                    eq: '1234',
                  },
                },
              },
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       users: users(where: {and: [{todos: {all: {task: {eq: \\"get it done\\"}}, none: {id: {eq: \\"1234\\"}}}}]}) {
         nodes {
           id
           todos: todos {
             nodes {
               id
               task
             }
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports sorting short hand syntax', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());

    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                sort: { task: 'asc' },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(order: [{task: ASC}]) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports sorting long hand syntax', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                sort: { task: { direction: 'asc' } },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(order: [{task: ASC}]) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports sorting with priority', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                sort: {
                  task: { direction: 'asc' },
                  numberProp: { direction: 'asc', priority: 1 },
                },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(order: [{numberProp: ASC}, {task: ASC}]) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports sorting on relational data', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                map: (() => ({})) as MapFnForNode<TodoNode>,
                sort: {
                  assignee: { firstName: { direction: 'asc' } },
                },
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos(order: [{assignee: {firstName: ASC}}]) {
         nodes {
           id
           version
           lastUpdatedBy
           type
         }
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });

  it('supports totalCount to query a count of the total number of nodes', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getPrettyPrintedGQL(
        getQueryGQLDocumentFromQueryRecord({
          queryId: 'MyTestQuery',
          queryRecord: getQueryRecordFromQueryDefinition({
            queryId: 'MyTestQuery',
            queryDefinitions: {
              todos: queryDefinition({
                def: generateTodoNode(mmGQLInstance),
                pagination: {
                  includeTotalCount: true,
                },
                map: (({ users }) => ({
                  users: users({
                    map: ({ id }) => ({ id }),
                    pagination: {
                      includeTotalCount: true,
                    },
                  }),
                })) as MapFnForNode<TodoNode>,
              }),
            },
          }),
          useServerSidePaginationFilteringSorting: true,
        }) as DocumentNode
      )
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
       todos: todos {
         nodes {
           id
           version
           lastUpdatedBy
           type
           users: users {
             nodes {
               id
               version
               lastUpdatedBy
               type
             }
             totalCount
             pageInfo {
               endCursor
               startCursor
               hasNextPage
               hasPreviousPage
             }
           }
         }
         totalCount
         pageInfo {
           endCursor
           startCursor
           hasNextPage
           hasPreviousPage
         }
       }
      }"
    `);
  });
});

//
// subscription document tests
//
describe('getSubscriptionGQLDocumentsFromQueryRecord', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const meetingNode = mmGQLInstance.def({
    type: 'meeting',
    properties: {
      name: string,
    },
    relational: {
      headlines: () => oneToMany(headlineNode),
    },
  });

  const userNode = mmGQLInstance.def({
    type: 'user',
    properties: {
      firstName: string,
      lastName: string,
    },
  });

  const headlineNode = mmGQLInstance.def({
    type: 'headline',
    properties: {
      title: string,
      closed: boolean,
    },
    relational: {
      assignee: () => oneToOne(userNode),
    },
  });

  it('creates valid subscription documents from a query record targeting a collection of nodes', () => {
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'MyTestQuery',
      queryDefinitions: {
        meetings: queryDefinition({
          def: meetingNode,
          map: ({ name, headlines }) => ({
            name,
            headlines: headlines({
              map: ({ title, assignee }) => ({
                title,
                assignee: assignee({
                  map: ({ firstName }) => ({ firstName }),
                }),
              }),
            }),
          }),
        }),
      },
    });

    const meetingsSubscription = getPrettyPrintedGQL(
      getSubscriptionGQLDocumentsFromQueryRecord({
        queryId: 'MyTestQuery',
        queryRecord,
        useServerSidePaginationFilteringSorting: false,
      }).meetings
    );

    expect(meetingsSubscription).toMatchInlineSnapshot(`
      "
      subscription MyTestQuery_meetings {
       meetings: meetings {
         ...on Created_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         ...on Updated_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         
         ...on Created_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Updated_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Inserted_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Removed_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
           }
         }
         
         ...on Created_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on Updated_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on UpdatedAssociation_Headline_User {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
       }
      }"
    `);
  });

  it('creates valid subscription documents from a query record targeting a single node', () => {
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'MyTestQuery',
      queryDefinitions: {
        meeting: queryDefinition({
          def: meetingNode,
          map: ({ name, headlines }) => ({
            name,
            headlines: headlines({
              map: ({ title, assignee }) => ({
                title,
                assignee: assignee({
                  map: ({ firstName }) => ({ firstName }),
                }),
              }),
            }),
          }),
          target: {
            id: 'mock-meeting-id',
          },
        }),
      },
    });

    const meetingSubscription = getPrettyPrintedGQL(
      getSubscriptionGQLDocumentsFromQueryRecord({
        queryId: 'MyTestQuery',
        queryRecord,
        useServerSidePaginationFilteringSorting: false,
      }).meeting
    );

    expect(meetingSubscription).toMatchInlineSnapshot(`
      "
      subscription MyTestQuery_meeting {
       meeting: meeting(id: \\"mock-meeting-id\\") {
         ...on Created_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         ...on Updated_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         
         ...on Created_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Updated_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Inserted_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Removed_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
           }
         }
         
         ...on Created_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on Updated_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on UpdatedAssociation_Headline_User {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
       }
      }"
    `);
  });

  it('creates valid subscription documents when multiple root aliases are used', () => {
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'MyTestQuery',
      queryDefinitions: {
        meeting: queryDefinition({
          def: meetingNode,
          map: ({ name, headlines }) => ({
            name,
            headlines: headlines({
              map: ({ title, assignee }) => ({
                title,
                assignee: assignee({
                  map: ({ firstName }) => ({ firstName }),
                }),
              }),
            }),
          }),
          target: {
            id: 'mock-meeting-id',
          },
        }),
        headlines: queryDefinition({
          def: headlineNode,
          map: ({ title, assignee }) => ({
            title,
            assignee: assignee({
              map: ({ firstName }) => ({
                firstName,
              }),
            }),
          }),
        }),
      },
    });

    const {
      meeting: meetingSubscription,
      headlines: headlinesSubscription,
    } = getSubscriptionGQLDocumentsFromQueryRecord({
      queryId: 'MyTestQuery',
      queryRecord,
      useServerSidePaginationFilteringSorting: false,
    });

    expect(getPrettyPrintedGQL(meetingSubscription)).toMatchInlineSnapshot(`
      "
      subscription MyTestQuery_meeting {
       meeting: meeting(id: \\"mock-meeting-id\\") {
         ...on Created_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         ...on Updated_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         
         ...on Created_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Updated_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Inserted_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Removed_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
           }
         }
         
         ...on Created_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on Updated_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on UpdatedAssociation_Headline_User {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
       }
      }"
    `);
    expect(getPrettyPrintedGQL(headlinesSubscription)).toMatchInlineSnapshot(`
      "
      subscription MyTestQuery_headlines {
       headlines: headlines {
         ...on Created_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         ...on Updated_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
           }
         }
         
         ...on Created_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on Updated_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
         
         ...on UpdatedAssociation_Headline_User {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
           }
         }
       }
      }"
    `);
  });

  it('avoids creating duplicate subscription documents, when the same node type or relationship is used in the query definition repeatedly', () => {
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'MyTestQuery',
      queryDefinitions: {
        meeting: queryDefinition({
          def: meetingNode,
          map: ({ name, headlines }) => ({
            name,
            headlines: headlines({
              map: ({ title, assignee }) => ({
                title,
                assignee: assignee({
                  map: ({ firstName }) => ({ firstName }),
                }),
              }),
            }),
            // same subscription as above but with different properties
            // replicating what would happen if the UI had 2 different collections of headlines being displayed
            duplicateHeadlines: headlines({
              map: ({ closed, assignee }) => ({
                closed,
                assignee: assignee({
                  map: ({ lastName }) => ({ lastName }),
                }),
              }),
            }),
          }),
          target: {
            id: 'mock-meeting-id',
          },
        }),
      },
    });

    const {
      meeting: meetingSubscription,
    } = getSubscriptionGQLDocumentsFromQueryRecord({
      queryId: 'MyTestQuery',
      queryRecord,
      useServerSidePaginationFilteringSorting: false,
    });

    // Every subscription around headline and user is only declared once below
    // with the properties being merged together
    expect(getPrettyPrintedGQL(meetingSubscription)).toMatchInlineSnapshot(`
      "
      subscription MyTestQuery_meeting {
       meeting: meeting(id: \\"mock-meeting-id\\") {
         ...on Created_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         ...on Updated_Meeting {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             name
           }
         }
         
         ...on Created_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
             closed
           }
         }
         
         ...on Updated_Headline {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             title
             closed
           }
         }
         
         ...on Inserted_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             title
             closed
           }
         }
         
         ...on Removed_Meeting_Headline {
           __typename
           target {
             id
             property
           }
           value {
             id
           }
         }
         
         ...on Created_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
             lastName
           }
         }
         
         ...on Updated_User {
           __typename
           id
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
             lastName
           }
         }
         
         ...on UpdatedAssociation_Headline_User {
           __typename
           target {
             id
             property
           }
           value {
             id
             version
             lastUpdatedBy
             type
             firstName
             lastName
           }
         }
       }
      }"
    `);
  });
});
