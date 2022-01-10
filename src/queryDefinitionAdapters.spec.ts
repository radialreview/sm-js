import {
  createMockQueryDefinitions,
  generateUserNode,
  generateTodoNode,
  TodoNode,
  UserNode,
} from './specUtilities';
import {
  getQueryRecordFromQueryDefinition,
  getQueryInfo,
  PROPERTIES_QUERIED_FOR_ALL_NODES,
} from './queryDefinitionAdapters';
import { queryDefinition, IS_NULL_IDENTIFIER } from './smDataTypes';
import { gql } from '@apollo/client/core';

describe('getQueryRecordFromQueryDefinition', () => {
  it('returns a query record with all the nodes that need to be fetched within a fetcher config', () => {
    const todoNode = generateTodoNode();
    const userNode = generateUserNode(todoNode);

    const record = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: {
        todos: queryDefinition({
          def: todoNode,
          underIds: ['mock-id'],
          map: (({ id, task }) => ({ id, task })) as MapFnForNode<TodoNode>,
        }),
        users: queryDefinition({
          def: userNode,
          underIds: ['other-mock-id'],
          map: (({ firstName, lastName }) => ({
            firstName,
            lastName,
          })) as MapFnForNode<UserNode>,
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
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: createMockQueryDefinitions({ useUnder: true }),
    }).users as QueryRecordEntry & { underIds: Array<string> };

    expect(queryRecord.def).toEqual(
      expect.objectContaining({ type: 'tt-user' })
    );
    expect(queryRecord.underIds).toEqual(['mock-id']),
      expect(queryRecord.properties).toEqual([
        ...PROPERTIES_QUERIED_FOR_ALL_NODES,
        // include the root property name
        // so that we can continue querying old formats (stringified json)
        'address',
        // if it's stored in the new format, is this object set to null
        `address${IS_NULL_IDENTIFIER}`,
        // new format separates the object query into every non-object property that was queried
        // so that we can query much less data
        'address__dot__state',
        'address__dot__apt__dot__floor',
        'address__dot__apt__dot__number',
      ]);
  });

  it('handles relational queries', () => {
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinitions({ useUnder: true }),
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
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinitions({ useUnder: true }),
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
});

describe('getQueryInfo.queryGQLString', () => {
  it('creates a valid SM query from a fetcher config', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions({ useUnder: true }),
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            version,
            address,
            address__IS_NULL__,
            address__dot__state,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    firstName
                }
            }
          }
          }"
    `);
  });

  it('handles multiple aliases', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions({ useUnder: true }).users,
          otherAlias: createMockQueryDefinitions({ useUnder: true }).users,
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            version,
            address,
            address__IS_NULL__,
            address__dot__state,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    firstName
                }
            }
          }
          otherAlias: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            version,
            address,
            address__IS_NULL__,
            address__dot__state,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    firstName
                }
            }
          }
          }"
    `);
  });

  it('handles fetching specific ids', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions({ useIds: true }),
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesByIdNew(ids: [\\"mock-id\\"]) {
            id,
            version,
            address,
            address__IS_NULL__,
            address__dot__state,
            address__dot__apt__dot__floor,
            address__dot__apt__dot__number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                version,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    version,
                    firstName
                }
            }
          }
          }"
    `);
  });

  it('handles shorthand query definitions', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: generateTodoNode(),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\") {
            id,
            version,
            task,
            done,
            assigneeId,
            meetingId,
            settings,
            settings__IS_NULL__,
            settings__dot__archiveAfterMeeting,
            settings__dot__nestedSettings__dot__nestedNestedMaybe,
            dataSetIds,
            comments
          }
          }"
    `);
  });

  it('handles map fn omission', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: {
            def: generateTodoNode(),
          },
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\") {
            id,
            version,
            task,
            done,
            assigneeId,
            meetingId,
            settings,
            settings__IS_NULL__,
            settings__dot__archiveAfterMeeting,
            settings__dot__nestedSettings__dot__nestedNestedMaybe,
            dataSetIds,
            comments
          }
          }"
    `);
  });

  it('supports filters', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          todos: queryDefinition({
            def: generateTodoNode(),
            map: (todoData => ({ id: todoData.id })) as MapFnForNode<TodoNode>,
            filter: { task: 'get it done' },
          }),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\", filter: {task: \\"get it done\\"}) {
            id,
            version
          }
          }"
    `);
  });

  it('returns a valid gql string', () => {
    expect(() =>
      gql(
        getQueryInfo({
          queryId: 'MyTestQuery',
          queryDefinitions: {
            users: createMockQueryDefinitions({ useUnder: true }).users,
            otherAlias: createMockQueryDefinitions({ useUnder: true }).users,
          },
        }).queryGQLString
      )
    ).not.toThrow();
  });
});

describe('getQueryInfo.subscriptionGQLStrings', () => {
  it('creates a valid SM subscription from a fetcher config', () => {
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions({ useUnder: true }),
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
              node {
                
                    id,
                    version,
                    address,
                    address__IS_NULL__,
                    address__dot__state,
                    address__dot__apt__dot__floor,
                    address__dot__apt__dot__number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
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
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions({ useUnder: true }).users,
          otherAlias: createMockQueryDefinitions({ useUnder: true }).users,
        },
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
              node {
                
                    id,
                    version,
                    address,
                    address__IS_NULL__,
                    address__dot__state,
                    address__dot__apt__dot__floor,
                    address__dot__apt__dot__number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
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
                    address,
                    address__IS_NULL__,
                    address__dot__state,
                    address__dot__apt__dot__floor,
                    address__dot__apt__dot__number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
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
    expect(
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: createMockQueryDefinitions({ useIds: true }),
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesById(ids: [\\"mock-id\\"], monitorChildEvents: true) {
              node {
                
                    id,
                    version,
                    address,
                    address__IS_NULL__,
                    address__dot__state,
                    address__dot__apt__dot__floor,
                    address__dot__apt__dot__number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        version,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
                            version,
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
    expect(() =>
      getQueryInfo({
        queryId: 'MyTestQuery',
        queryDefinitions: {
          users: createMockQueryDefinitions({ useUnder: true }).users,
          otherAlias: createMockQueryDefinitions({ useUnder: true }).users,
        },
      }).subscriptionConfigs.map(config => gql(config.gqlString))
    ).not.toThrow();
  });
});
