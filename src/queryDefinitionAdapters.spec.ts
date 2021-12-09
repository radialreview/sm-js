import gql from 'graphql-tag';

import { userNode, todoNode, TodoNode, UserNode } from './specUtilities';
import {
  getQueryRecordFromQueryDefinition,
  getQueryInfo,
} from './queryDefinitionAdapters';
import { queryDefinition, IS_NULL_IDENTIFIER } from './smDataTypes';

function createMockQueryDefinition(
  opts: { useIds: true } | { useUnder: true }
) {
  return {
    users: queryDefinition({
      def: userNode,
      map: ({ todos, address }) => ({
        address: address({
          map: ({ state, apt }) => ({
            state,
            apt: apt({
              map: ({ floor, number }) => ({
                floor,
                number,
              }),
            }),
          }),
        }),
        todos: todos({
          map: ({ id, assignee }) => ({
            id,
            assignee: assignee({
              map: ({ id, firstName }) => ({ id, firstName }),
            }),
          }),
        }),
      }),
      ...('useIds' in opts ? { ids: ['mock-id'] } : { underIds: ['mock-id'] }),
    }),
  };
}

describe('getQueryRecordFromQueryDefinition', () => {
  it('returns a query record with all the nodes that need to be fetched within a fetcher config', () => {
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
        properties: ['id', 'task'],
      })
    );

    expect(record.users).toEqual(
      expect.objectContaining({
        def: expect.objectContaining({ type: 'tt-user' }),
        underIds: ['other-mock-id'],
        properties: ['id', 'firstName', 'lastName'],
      })
    );
  });

  it('handles querying partial objects within a node', () => {
    const queryRecord = getQueryRecordFromQueryDefinition({
      queryId: 'queryId',
      queryDefinitions: createMockQueryDefinition({ useUnder: true }),
    }).users as QueryRecordEntry & { underIds: Array<string> };

    expect(queryRecord.def).toEqual(
      expect.objectContaining({ type: 'tt-user' })
    );
    expect(queryRecord.underIds).toEqual(['mock-id']),
      expect(queryRecord.properties).toEqual([
        'id',
        // include the root property name
        // so that we can continue querying old formats (stringified json)
        'address',
        // if it's stored in the new format, is this object set to null
        `address${IS_NULL_IDENTIFIER}`,
        // new format separates the object query into every non-object property that was queried
        // so that we can query much less data
        'address_state',
        'address_apt_floor',
        'address_apt_number',
      ]);
  });

  it('handles relational queries', () => {
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinition({ useUnder: true }),
      }).users.relational
    ).toEqual(
      expect.objectContaining({
        todos: expect.objectContaining({
          def: expect.objectContaining({ type: 'todo' }),
          properties: ['id'],
          children: true,
        }),
      })
    );
  });

  it('handles nested relational queries', () => {
    expect(
      getQueryRecordFromQueryDefinition({
        queryId: 'queryId',
        queryDefinitions: createMockQueryDefinition({ useUnder: true }),
      }).users.relational?.todos.relational
    ).toEqual(
      expect.objectContaining({
        assignee: expect.objectContaining({
          def: expect.objectContaining({ type: 'tt-user' }),
          properties: ['id', 'firstName'],
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
        queryDefinitions: createMockQueryDefinition({ useUnder: true }),
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            address,
            address__IS_NULL__,
            address_state,
            address_apt_floor,
            address_apt_number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
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
          users: createMockQueryDefinition({ useUnder: true }).users,
          otherAlias: createMockQueryDefinition({ useUnder: true }).users,
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            address,
            address__IS_NULL__,
            address_state,
            address_apt_floor,
            address_apt_number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
                    firstName
                }
            }
          }
          otherAlias: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"]) {
            id,
            address,
            address__IS_NULL__,
            address_state,
            address_apt_floor,
            address_apt_number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
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
        queryDefinitions: createMockQueryDefinition({ useIds: true }),
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              users: GetNodesByIdNew(ids: [\\"mock-id\\"]) {
            id,
            address,
            address__IS_NULL__,
            address_state,
            address_apt_floor,
            address_apt_number,
            todos: GetChildren(type: \\"todo\\") {
                id,
                assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                    id,
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
          todos: todoNode,
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\") {
            id,
            task,
            done,
            assigneeId,
            meetingId,
            settings,
            settings__IS_NULL__,
            settings_archiveAfterMeeting,
            settings_nestedSettings_nestedNestedMaybe,
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
            def: todoNode,
          },
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\") {
            id,
            task,
            done,
            assigneeId,
            meetingId,
            settings,
            settings__IS_NULL__,
            settings_archiveAfterMeeting,
            settings_nestedSettings_nestedNestedMaybe,
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
            def: todoNode,
            map: (todoData => ({ id: todoData.id })) as MapFnForNode<TodoNode>,
            filter: { task: 'get it done' },
          }),
        },
      }).queryGQLString
    ).toMatchInlineSnapshot(`
      "query MyTestQuery {
              todos: GetNodesNew(type: \\"todo\\", filter: {task: \\"get it done\\"}) {
            id
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
            users: createMockQueryDefinition({ useUnder: true }).users,
            otherAlias: createMockQueryDefinition({ useUnder: true }).users,
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
        queryDefinitions: createMockQueryDefinition({ useUnder: true }),
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
              node {
                
                    id,
                    address,
                    address__IS_NULL__,
                    address_state,
                    address_apt_floor,
                    address_apt_number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
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
          users: createMockQueryDefinition({ useUnder: true }).users,
          otherAlias: createMockQueryDefinition({ useUnder: true }).users,
        },
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesNew(type: \\"tt-user\\", underIds: [\\"mock-id\\"], monitorChildEvents: true) {
              node {
                
                    id,
                    address,
                    address__IS_NULL__,
                    address_state,
                    address_apt_floor,
                    address_apt_number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
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
                    address,
                    address__IS_NULL__,
                    address_state,
                    address_apt_floor,
                    address_apt_number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
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
        queryDefinitions: createMockQueryDefinition({ useIds: true }),
      }).subscriptionConfigs.map(config => config.gqlString)
    ).toMatchInlineSnapshot(`
      Array [
        "subscription MyTestQuery_users {
            users: GetNodesById(ids: [\\"mock-id\\"], monitorChildEvents: true) {
              node {
                
                    id,
                    address,
                    address__IS_NULL__,
                    address_state,
                    address_apt_floor,
                    address_apt_number,
                    todos: GetChildren(type: \\"todo\\") {
                        id,
                        assignee: GetReferences(propertyNames: \\"assigneeId\\") {
                            id,
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
          users: createMockQueryDefinition({ useUnder: true }).users,
          otherAlias: createMockQueryDefinition({ useUnder: true }).users,
        },
      }).subscriptionConfigs.map(config => gql(config.gqlString))
    ).not.toThrow();
  });
});
