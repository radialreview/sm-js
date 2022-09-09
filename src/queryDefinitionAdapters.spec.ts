import {
  createMockQueryDefinitions,
  generateUserNode,
  generateTodoNode,
  TodoNode,
  getMockConfig,
} from './specUtilities';
import {
  getQueryRecordFromQueryDefinition,
  getQueryInfo,
} from './queryDefinitionAdapters';
import { object, queryDefinition, oneToOne, string } from './dataTypes';
import { gql } from '@apollo/client/core';
import { MMGQL } from '.';
import {
  IOneToOneQueryBuilder,
  INode,
  MapFnForNode,
  QueryRecordEntry,
} from './types';
import {
  PROPERTIES_QUERIED_FOR_ALL_NODES,
  RELATIONAL_UNION_QUERY_SEPARATOR,
} from './consts';

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
      // include the root property name
      // so that we can continue querying old formats (stringified json)
      'address',
      // new format separates the object query into every non-object property that was queried
      // so that we can query much less data
      'address__dot__state',
      'address__dot__apt',
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
      }).users.relational
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
      }).users.relational?.todos.relational
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
      }).users.relational
    ).toEqual(
      expect.objectContaining({
        todo: expect.objectContaining({
          def: expect.objectContaining({ type: 'todo' }),
          _relationshipName: 'todo',
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
      }).todos.relational
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
      }).todos.properties
    ).toEqual([
      ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
      'settings',
      'settings__dot__archiveAfterMeeting',
      'settings__dot__nestedSettings',
      'settings__dot__nestedSettings__dot__nestedNestedMaybe',
      'settings__dot__nestedRecord',
    ]);
  });

  it('handles querying all data for a relational query result, by using a map function that passes through all data for that node', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const relationalResults = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: {
        todos: queryDefinition({
          def: generateTodoNode(mmGQLInstance),
          map: ({ assignee }) => ({
            assignee: assignee({
              map: allData => allData,
            }),
          }),
        }),
      },
    }).todos.relational;

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
            'address',
            'address__dot__streetName',
            'address__dot__zipCode',
            'address__dot__state',
            'address__dot__apt',
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

    expect(withDoubleNestedObjResults.mockNodes.properties).toEqual([
      ...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES),
      'obj',
      'obj__dot__nested',
      'obj__dot__nested__dot__doubleNested',
      'obj__dot__nested__dot__doubleNested__dot__label',
    ]);
  });
});

describe('getQueryInfo.queryGQLString', () => {
  it('creates a valid query from a fetcher config', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        users: users {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: todos {
              nodes {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: assignee {
                  id,
                  version,
                  lastUpdatedBy,
                  type,
                  firstName
                }
              }
            }
          }
        }
      }"
    `);
  });

  it('handles multiple aliases', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions(mmGQLInstance).users,
          otherAlias: createMockQueryDefinitions(mmGQLInstance).users,
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        users: users {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: todos {
              nodes {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: assignee {
                  id,
                  version,
                  lastUpdatedBy,
                  type,
                  firstName
                }
              }
            }
          }
        }
            otherAlias: users {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: todos {
              nodes {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: assignee {
                  id,
                  version,
                  lastUpdatedBy,
                  type,
                  firstName
                }
              }
            }
          }
        }
      }"
    `);
  });

  it('handles fetching specific ids', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(mmGQLInstance, {
          useIds: true,
        }),
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        users: users(ids: [\\"mock-id\\"]) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: todos {
              nodes {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: assignee {
                  id,
                  version,
                  lastUpdatedBy,
                  type,
                  firstName
                }
              }
            }
          }
        }
      }"
    `);
  });

  it('handles shorthand query definitions', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: generateTodoNode(mmGQLInstance),
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type,
            task,
            done,
            assigneeId,
            meetingId,
            settings,
            settings__dot__archiveAfterMeeting,
            settings__dot__nestedSettings,
            settings__dot__nestedSettings__dot__nestedNestedMaybe,
            settings__dot__nestedRecord,
            dataSetIds,
            comments,
            record,
            numberProp,
            dateCreated,
            dateLastModified,
            lastUpdatedClientTimestamp
          }
        }
      }"
    `);
  });

  it('handles map fn omission', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: {
            def: generateTodoNode(mmGQLInstance),
            map: undefined,
          },
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type,
            task,
            done,
            assigneeId,
            meetingId,
            settings,
            settings__dot__archiveAfterMeeting,
            settings__dot__nestedSettings,
            settings__dot__nestedSettings__dot__nestedNestedMaybe,
            settings__dot__nestedRecord,
            dataSetIds,
            comments,
            record,
            numberProp,
            dateCreated,
            dateLastModified,
            lastUpdatedClientTimestamp
          }
        }
      }"
    `);
  });

  it('supports strict equality filters', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
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
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos(where: {and: [{task: {eq: \\"get it done\\"}}, {done: {eq: false}}, {meetingId: {eq: null}}, {dateCreated: {eq: 1}}]}) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type
          }
        }
      }"
    `);
  });

  it('supports "or" filters', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(mmGQLInstance),
            map: (() => ({})) as MapFnForNode<TodoNode>,
            filter: { task: { _condition: 'or', eq: 'get it done' } },
          }),
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos(where: {or: [{task: {eq: \\"get it done\\"}}]}) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type
          }
        }
      }"
    `);
  });

  it('supports "and" filters', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(mmGQLInstance),
            map: (() => ({})) as MapFnForNode<TodoNode>,
            filter: { task: { _condition: 'and', eq: 'get it done' } },
          }),
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos(where: {and: [{task: {eq: \\"get it done\\"}}]}) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type
          }
        }
      }"
    `);
  });

  it('supports sorting short hand syntax', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(mmGQLInstance),
            map: (() => ({})) as MapFnForNode<TodoNode>,
            sort: { task: 'asc' },
          }),
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos(order: [{task: ASC}]) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type
          }
        }
      }"
    `);
  });

  it('supports sorting long hand syntax', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(mmGQLInstance),
            map: (() => ({})) as MapFnForNode<TodoNode>,
            sort: { task: { _direction: 'asc' } },
          }),
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos(order: [{task: ASC}]) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type
          }
        }
      }"
    `);
  });

  it('supports sorting with priority', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(mmGQLInstance),
            map: (() => ({})) as MapFnForNode<TodoNode>,
            sort: {
              task: { _direction: 'asc' },
              numberProp: { _direction: 'asc', _priority: 1 },
            },
          }),
        },
        useServerSidePaginationFilteringSorting: true,
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
        todos: todos(order: [{numberProp: ASC}, {task: ASC}]) {
          nodes {
            id,
            version,
            lastUpdatedBy,
            type
          }
        }
      }"
    `);
  });

  it('returns a valid gql string', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(() =>
      gql(
        getQueryInfo({
          queryId: 'MyTestQuery',
          queryDefinitions: {
            users: createMockQueryDefinitions(mmGQLInstance).users,
            otherAlias: createMockQueryDefinitions(mmGQLInstance).users,
          },
          useServerSidePaginationFilteringSorting: true,
        }).queryGQLString
      )
    ).not.toThrow();
  });
});

describe('getQueryInfo.subscriptionGQLStrings', () => {
  it('creates a valid subscription from a fetcher config', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
        useServerSidePaginationFilteringSorting: true,
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: users {
              node {
                          id,
                version,
                lastUpdatedBy,
                type,
                address,
                address__dot__state,
                address__dot__apt,
                address__dot__apt__dot__floor,
                address__dot__apt__dot__number,
                todos: todos {
                  nodes {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    assignee: assignee {
                      id,
                      version,
                      lastUpdatedBy,
                      type,
                      firstName
                    }
                  }
                }
              }
              operation { action, path }
            }
          }",
      ]
    `);
  });

  it('handles multiple aliases', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions(mmGQLInstance).users,
          otherAlias: createMockQueryDefinitions(mmGQLInstance).users,
        },
        useServerSidePaginationFilteringSorting: true,
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: users {
              node {
                          id,
                version,
                lastUpdatedBy,
                type,
                address,
                address__dot__state,
                address__dot__apt,
                address__dot__apt__dot__floor,
                address__dot__apt__dot__number,
                todos: todos {
                  nodes {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    assignee: assignee {
                      id,
                      version,
                      lastUpdatedBy,
                      type,
                      firstName
                    }
                  }
                }
              }
              operation { action, path }
            }
          }",
        "subscription MyTestQuery_otherAlias {
            otherAlias: users {
              node {
                          id,
                version,
                lastUpdatedBy,
                type,
                address,
                address__dot__state,
                address__dot__apt,
                address__dot__apt__dot__floor,
                address__dot__apt__dot__number,
                todos: todos {
                  nodes {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    assignee: assignee {
                      id,
                      version,
                      lastUpdatedBy,
                      type,
                      firstName
                    }
                  }
                }
              }
              operation { action, path }
            }
          }",
      ]
    `);
  });

  it('handles fetching specific ids', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(mmGQLInstance, {
          useIds: true,
        }),
        useServerSidePaginationFilteringSorting: true,
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: users(ids: [\\"mock-id\\"]) {
              node {
                          id,
                version,
                lastUpdatedBy,
                type,
                address,
                address__dot__state,
                address__dot__apt,
                address__dot__apt__dot__floor,
                address__dot__apt__dot__number,
                todos: todos {
                  nodes {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    assignee: assignee {
                      id,
                      version,
                      lastUpdatedBy,
                      type,
                      firstName
                    }
                  }
                }
              }
              operation { action, path }
            }
          }",
      ]
    `);
  });

  it('returns a valid gql string', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    expect(() =>
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions(mmGQLInstance).users,
          otherAlias: createMockQueryDefinitions(mmGQLInstance).users,
        },
        useServerSidePaginationFilteringSorting: true,
      }).subscriptionConfigs.map(config => gql(config.gqlString))
    ).not.toThrow();
  });
});
