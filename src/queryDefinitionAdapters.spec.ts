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
import {
  object,
  OBJECT_PROPERTY_SEPARATOR,
  queryDefinition,
  reference,
  string,
} from './smDataTypes';
import { gql } from '@apollo/client/core';
import { SMJS } from '.';
import {
  IByReferenceQueryBuilder,
  ISMNode,
  MapFnForNode,
  QueryRecordEntry,
} from './types';
import {
  PROPERTIES_QUERIED_FOR_ALL_NODES,
  RELATIONAL_UNION_QUERY_SEPARATOR,
} from './consts';

describe('getQueryRecordFromQueryDefinition', () => {
  it('returns a query record with all the nodes that need to be fetched within a fetcher config', () => {
    const smJSInstance = new SMJS(getMockConfig());
    const todoNode = generateTodoNode(smJSInstance);
    const userNode = generateUserNode(smJSInstance, todoNode);

    const record = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: {
        todos: queryDefinition({
          def: todoNode,
          map: ({ id, task }) => ({ id, task }),
          target: { underIds: ['mock-id'] },
        }),
        users: queryDefinition({
          def: userNode,
          map: ({ firstName, lastName }) => ({
            firstName,
            lastName,
          }),
          target: { underIds: ['other-mock-id'] },
        }),
      },
    });

    expect(record.todos).toEqual(
      expect.objectContaining({
        def: expect.objectContaining({ type: 'todo' }),
        underIds: ['mock-id'],
        properties: [...PROPERTIES_QUERIED_FOR_ALL_NODES, 'task'],
      })
    );

    expect(record.users).toEqual(
      expect.objectContaining({
        def: expect.objectContaining({ type: 'tt-user' }),
        underIds: ['other-mock-id'],
        properties: [
          ...PROPERTIES_QUERIED_FOR_ALL_NODES,
          'firstName',
          'lastName',
        ],
      })
    );
  });

  it('handles querying partial objects within a node', () => {
    const smJSInstance = new SMJS(getMockConfig());
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: createMockQueryDefinitions(smJSInstance, {
        useUnder: true,
      }),
    }).users as QueryRecordEntry & { underIds: Array<string> };

    expect(queryRecord.def).toEqual(
      expect.objectContaining({ type: 'tt-user' })
    );
    expect(queryRecord.underIds).toEqual(['mock-id']);
    expect(queryRecord.properties).toEqual([
      ...PROPERTIES_QUERIED_FOR_ALL_NODES,
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
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinitions(smJSInstance, {
          useUnder: true,
        }),
      }).users.relational
    ).toEqual(
      expect.objectContaining({
        todos: expect.objectContaining({
          def: expect.objectContaining({ type: 'todo' }),
          properties: [...PROPERTIES_QUERIED_FOR_ALL_NODES],
          children: true,
        }),
      })
    );
  });

  it('handles nested relational queries', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinitions(smJSInstance, {
          useUnder: true,
        }),
      }).users.relational?.todos.relational
    ).toEqual(
      expect.objectContaining({
        assignee: expect.objectContaining({
          def: expect.objectContaining({ type: 'tt-user' }),
          properties: [...PROPERTIES_QUERIED_FOR_ALL_NODES, 'firstName'],
          byReference: true,
          idProp: 'assigneeId',
        }),
      })
    );
  });

  it('handles reference queries that use dot notation', () => {
    const smJSInstance = new SMJS(getMockConfig());
    const userProperties = {
      settings: object({
        mainTodoId: string,
      }),
    };
    type UserNode = ISMNode<
      'user',
      typeof userProperties,
      {},
      { todo: IByReferenceQueryBuilder<UserNode, TodoNode> }
    >;
    const userNode: UserNode = smJSInstance.def({
      type: 'user',
      properties: {
        settings: object({
          mainTodoId: string,
        }),
      },
      relational: {
        todo: () =>
          reference({
            def: generateTodoNode(smJSInstance),
            idProp: 'settings.mainTodoId',
          }),
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
                map: ({ id }) => ({ id }),
              }),
            }),
          }),
        },
      }).users.relational
    ).toEqual(
      expect.objectContaining({
        todo: expect.objectContaining({
          def: expect.objectContaining({ type: 'todo' }),
          idProp: `settings${OBJECT_PROPERTY_SEPARATOR}mainTodoId`,
        }),
      })
    );
  });

  it('handles reference queries which return a union of node types', () => {
    const smJSInstance = new SMJS(getMockConfig());
    const userProperties = {
      firstName: string,
      lastName: string,
    };
    const meetingGuestProperties = {
      firstName: string,
    };
    type UserNode = ISMNode<'user', typeof userProperties>;
    type MeetingGuestNode = ISMNode<
      'meeting-guest',
      typeof meetingGuestProperties
    >;
    const userNode: UserNode = smJSInstance.def({
      type: 'user',
      properties: userProperties,
    });
    const meetingGuestNode: MeetingGuestNode = smJSInstance.def({
      type: 'meeting-guest',
      properties: meetingGuestProperties,
    });

    const todoProperties = {
      assigneeId: string,
    };
    type TodoNode = ISMNode<
      'todo',
      typeof todoProperties,
      {},
      {
        assignee: IByReferenceQueryBuilder<
          TodoNode,
          { user: UserNode; meetingGuest: MeetingGuestNode }
        >;
      }
    >;
    const todoNode: TodoNode = smJSInstance.def({
      type: 'todo',
      properties: todoProperties,
      relational: {
        assignee: () =>
          reference({
            idProp: 'assigneeId',
            def: { user: userNode, meetingGuest: meetingGuestNode },
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
                user: { map: ({ id, lastName }) => ({ id, lastName }) },
                meetingGuest: {
                  map: ({ id, firstName }) => ({ id, firstName }),
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
          properties: [...PROPERTIES_QUERIED_FOR_ALL_NODES, 'lastName'],
        }
      ),
      [`assignee${RELATIONAL_UNION_QUERY_SEPARATOR}meetingGuest`]: expect.objectContaining(
        {
          def: meetingGuestNode,
          properties: [...PROPERTIES_QUERIED_FOR_ALL_NODES, 'firstName'],
        }
      ),
    });
  });

  it('handles omitting map fn for objects, and will query all data in that object', () => {
    const smJSInstance = new SMJS(getMockConfig());

    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(smJSInstance),
            map: ({ settings }) => ({
              settings,
            }),
          }),
        },
      }).todos.properties
    ).toEqual([
      ...PROPERTIES_QUERIED_FOR_ALL_NODES,
      'settings',
      'settings__dot__archiveAfterMeeting',
      'settings__dot__nestedSettings',
      'settings__dot__nestedSettings__dot__nestedNestedMaybe',
      'settings__dot__nestedRecord',
    ]);
  });

  it('handles querying all data for a relational query result, by using a map function that passes through all data for that node', () => {
    const smJSInstance = new SMJS(getMockConfig());
    const relationalResults = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: {
        todos: queryDefinition({
          def: generateTodoNode(smJSInstance),
          map: ({ id, assignee }) => ({
            id,
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
          def: expect.objectContaining({ type: 'tt-user' }),
          properties: [
            ...PROPERTIES_QUERIED_FOR_ALL_NODES,
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
          byReference: true,
          idProp: 'assigneeId',
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
          def: smJSInstance.def({
            type: 'mock-node-type',
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
      ...PROPERTIES_QUERIED_FOR_ALL_NODES,
      'obj',
      'obj__dot__nested',
      'obj__dot__nested__dot__doubleNested',
      'obj__dot__nested__dot__doubleNested__dot__label',
    ]);
  });
});

describe('getQueryInfo.queryGQLString', () => {
  it('creates a valid SM query from a fetcher config', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(smJSInstance, {
          useUnder: true,
        }),
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    firstName
                }
            }
          }
          }"
    `);
  });

  it('handles multiple aliases', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions(smJSInstance, { useUnder: true })
            .users,
          otherAlias: createMockQueryDefinitions(smJSInstance, {
            useUnder: true,
          }).users,
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    firstName
                }
            }
          }
          otherAlias: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    firstName
                }
            }
          }
          }"
    `);
  });

  it('handles fetching specific ids', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(smJSInstance, {
          useIds: true,
        }),
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesByIdNew(ids: [\\"mock-id\\"]) {
            id,
            version,
            lastUpdatedBy,
            type,
            address,
            address__dot__state,
            address__dot__apt,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                lastUpdatedBy,
                type,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    lastUpdatedBy,
                    type,
                    firstName
                }
            }
          }
          }"
    `);
  });

  it('handles shorthand query definitions', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: generateTodoNode(smJSInstance),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\") {
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
          }"
    `);
  });

  it('handles map fn omission', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: {
            def: generateTodoNode(smJSInstance),
            map: undefined,
          },
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\") {
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
          }"
    `);
  });

  it('supports filters', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(smJSInstance),
            map: (todoData => ({ id: todoData.id })) as MapFnForNode<TodoNode>,
            filter: { task: 'get it done', done: false, meetingId: null },
          }),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\", filter: {task: \\"get it done\\", done: \\"false\\", meetingId: null}) {
            id,
            version,
            lastUpdatedBy,
            type
          }
          }"
    `);
  });

  it('supports combinations of target params', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(smJSInstance),
            map: (todoData => ({ id: todoData.id })) as MapFnForNode<TodoNode>,
            target: { underIds: ['userA'], depth: 1 },
          }),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\", underIds: [\\"userA\\"], depth: 1) {
            id,
            version,
            lastUpdatedBy,
            type
          }
          }"
    `);
  });

  it('supports filters for nested properties', () => {
    const smJSInstance = new SMJS(getMockConfig());

    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(smJSInstance),
            map: (todoData => ({ id: todoData.id })) as MapFnForNode<TodoNode>,
            filter: {
              settings: { nestedSettings: { nestedNestedMaybe: 'mock value' } },
            },
          }),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\", filter: {settings__dot__nestedSettings__dot__nestedNestedMaybe: \\"mock value\\"}) {
            id,
            version,
            lastUpdatedBy,
            type
          }
          }"
    `);
  });

  it('returns a valid gql string', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(() =>
      gql(
        getQueryInfo({
          queryId: 'MyTestQuery',
          queryDefinitions: {
            users: createMockQueryDefinitions(smJSInstance, { useUnder: true })
              .users,
            otherAlias: createMockQueryDefinitions(smJSInstance, {
              useUnder: true,
            }).users,
          },
        }).queryGQLString
      )
    ).not.toThrow();
  });
});

describe('getQueryInfo.subscriptionGQLStrings', () => {
  it('creates a valid SM subscription from a fetcher config', () => {
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(smJSInstance, {
          useUnder: true,
        }),
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
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
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        lastUpdatedBy,
                        type,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
                            lastUpdatedBy,
                            type,
                            firstName
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
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions(smJSInstance, { useUnder: true })
            .users,
          otherAlias: createMockQueryDefinitions(smJSInstance, {
            useUnder: true,
          }).users,
        },
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
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
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        lastUpdatedBy,
                        type,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
                            lastUpdatedBy,
                            type,
                            firstName
                        }
                    }
              }
              operation { action, path }
            }
          }",
        "subscription MyTestQuery_otherAlias {
            otherAlias: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
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
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        lastUpdatedBy,
                        type,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
                            lastUpdatedBy,
                            type,
                            firstName
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
    const smJSInstance = new SMJS(getMockConfig());
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions(smJSInstance, {
          useIds: true,
        }),
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesById(ids: [\\"mock-id\\"], monitorChildEvents: true) {
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
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        lastUpdatedBy,
                        type,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
                            lastUpdatedBy,
                            type,
                            firstName
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
    const smJSInstance = new SMJS(getMockConfig());
    expect(() =>
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions(smJSInstance, { useUnder: true })
            .users,
          otherAlias: createMockQueryDefinitions(smJSInstance, {
            useUnder: true,
          }).users,
        },
      }).subscriptionConfigs.map(config => gql(config.gqlString))
    ).not.toThrow();
  });
});
