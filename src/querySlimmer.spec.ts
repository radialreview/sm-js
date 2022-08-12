import { MMGQL, QueryRecord } from '.';
import { string, boolean } from './dataTypes';
import { QuerySlimmer } from './QuerySlimmer';
import { getMockConfig } from './specUtilities';

function setupTests() {
  const mmGQL = new MMGQL(getMockConfig());

  const userNode = mmGQL.def({
    type: 'user',
    properties: {
      firstName: string,
      lastName: string,
      email: string,
    },
  });
  const meetingNode = mmGQL.def({
    type: 'meeting',
    properties: {
      name: string,
      archived: boolean,
      isAgendaInitialized: boolean,
    },
  });
  const todoNode = mmGQL.def({
    type: 'todo',
    properties: {
      task: string,
      done: boolean,
    },
  });

  return { QuerySlimmer: new QuerySlimmer(), userNode, meetingNode, todoNode };
}

describe('onNewQueryReceived', () => {
  test(`it should create a record for a query with no params and update the subscription count for the given properties`, () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName', 'lastName'],
      },
    };
    const users = [
      {
        id: 'id-1',
        type: userNode.type,
        firstName: 'Aidan',
        lastName: 'Goodman',
      },
    ];

    QuerySlimmer.onResultsReceived({
      slimmedQuery: mockQueryRecord,
      originalQuery: mockQueryRecord,
      slimmedQueryResults: {
        users,
      },
      subscriptionEstablished: true,
    });

    expect(QuerySlimmer.queriesByContext['users(NO_PARAMS)']).toEqual({
      subscriptionsByProperty: { firstName: 1, lastName: 1 },
      results: users,
    });
  });

  test('it should create a record with the id parameter included when querying by an id', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      user: {
        id: 'id-2',
        def: userNode,
        properties: ['firstName', 'lastName'],
      },
    };
    const user = {
      id: 'id-2',
      type: userNode.type,
      firstName: 'Aidan',
      lastName: 'Goodman',
    };

    QuerySlimmer.onResultsReceived({
      slimmedQuery: mockQueryRecord,
      originalQuery: mockQueryRecord,
      slimmedQueryResults: {
        user,
      },
      subscriptionEstablished: true,
    });

    expect(QuerySlimmer.queriesByContext['user({"id":"id-2"})']).toEqual({
      subscriptionsByProperty: { firstName: 1, lastName: 1 },
      results: user,
    });
  });

  test('it should create a record with all the id parameters included when querying by multiple ids', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName', 'lastName'],
        ids: ['id-3', 'id-4'],
      },
    };
    const users = [
      {
        id: 'id-3',
        type: userNode.type,
        firstName: 'Aidan',
        lastName: 'Goodman',
      },
      {
        id: 'id-4',
        type: userNode.type,
        firstName: 'Piotr',
        lastName: 'Bogun',
      },
    ];

    QuerySlimmer.onResultsReceived({
      slimmedQuery: mockQueryRecord,
      originalQuery: mockQueryRecord,
      slimmedQueryResults: {
        users,
      },
      subscriptionEstablished: true,
    });

    expect(
      QuerySlimmer.queriesByContext['users({"ids":["id-3","id-4"]})']
    ).toEqual({
      subscriptionsByProperty: { firstName: 1, lastName: 1 },
      results: users,
    });
  });

  test('it should create separate records for child relational data that contain no parameters', () => {
    const { QuerySlimmer, userNode, todoNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName', 'lastName'],
        relational: {
          todos: {
            _relationshipName: 'todos',
            def: todoNode,
            properties: ['task'],
            oneToMany: true,
          },
        },
      },
    };
    const users = [
      {
        id: 'id-3',
        type: userNode.type,
        firstName: 'Aidan',
        lastName: 'Goodman',
        todos: [{ task: 'test-1', id: 'id-1', type: todoNode.type }],
      },
      {
        id: 'id-4',
        type: userNode.type,
        firstName: 'Piotr',
        lastName: 'Bogun',
        todos: [{ task: 'test-2', id: 'id-2', type: todoNode.type }],
      },
    ];

    QuerySlimmer.onResultsReceived({
      slimmedQuery: mockQueryRecord,
      originalQuery: mockQueryRecord,
      slimmedQueryResults: {
        users,
      },
      subscriptionEstablished: true,
    });

    expect(QuerySlimmer.queriesByContext['users(NO_PARAMS)']).toEqual({
      subscriptionsByProperty: { firstName: 1, lastName: 1 },
      results: users,
    });

    expect(
      QuerySlimmer.queriesByContext['users(NO_PARAMS).todos(NO_PARAMS)']
    ).toEqual({
      subscriptionsByProperty: { task: 1 },
      results: users.map(user => user.todos),
    });
  });
});

describe('onNewQueryReceived', () => {
  describe('when the new query contains no requests for relational data', () => {
    test('it should return the whole new query record without changes if none of the query record entries are found in queriesByContext', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
        },
      };

      expect(QuerySlimmer.onNewQueryReceived(mockQueryRecord)).toEqual(
        mockQueryRecord
      );
    });

    test('it should return null if the query record entries and the properties of each entry are already cached', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
        },
      };
      const mockUsersData = [
        {
          id: '0',
          type: userNode.type,
          firstName: 'Banana',
          lastName: 'Man',
        },
      ];
      const mockTodosData = [
        {
          id: '0',
          type: todoNode.type,
          task: 'Eat a banana',
        },
      ];

      expect(QuerySlimmer.onNewQueryReceived(mockQueryRecord)).toEqual(
        mockQueryRecord
      );

      QuerySlimmer.onResultsReceived({
        slimmedQuery: mockQueryRecord,
        originalQuery: mockQueryRecord,
        slimmedQueryResults: {
          users: mockUsersData,
          todos: mockTodosData,
        },
        subscriptionEstablished: true,
      });

      expect(QuerySlimmer.onNewQueryReceived(mockQueryRecord)).toEqual(null);
    });

    test('it should return a slimmed query record where query record entries are returned with only non cached properties', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
        },
        meetings: {
          def: meetingNode,
          properties: ['name', 'archived'],
        },
        todos: {
          def: todoNode,
          properties: ['task'],
        },
      };
      const mockCachedUsersData = [
        {
          id: '0',
          type: userNode.type,
          firstName: 'Banana',
          lastName: 'Man',
        },
      ];
      const mockCachedMeetingsData = [
        {
          id: '0',
          type: meetingNode.type,
          name: 'Banana Meeting',
          archived: false,
        },
      ];
      const mockCachedTodosData = [
        {
          id: '0',
          type: todoNode.type,
          task: 'Eat a banana',
        },
      ];

      const mockNewQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName', 'email'],
        },
        meetings: {
          def: meetingNode,
          properties: ['name', 'archived'],
        },
        todos: {
          def: todoNode,
          properties: ['task', 'done'],
        },
      };

      const expectedSlimmedNewQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
        },
        todos: {
          def: todoNode,
          properties: ['done'],
        },
      };

      expect(QuerySlimmer.onNewQueryReceived(mockNewQueryRecord)).toEqual(
        mockNewQueryRecord
      );

      QuerySlimmer.onResultsReceived({
        slimmedQuery: mockCachedQueryRecord,
        originalQuery: mockCachedQueryRecord,
        slimmedQueryResults: {
          users: mockCachedUsersData,
          meetings: mockCachedMeetingsData,
          todos: mockCachedTodosData,
        },
        subscriptionEstablished: true,
      });

      expect(QuerySlimmer.onNewQueryReceived(mockNewQueryRecord)).toEqual(
        expectedSlimmedNewQueryRecord
      );
    });
  });

  describe('when the new query is requesting relational data', () => {
    test('it should return null if both the base query and relational queries are completely cached', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };
      const mockCachedQueryData = [
        {
          id: '0',
          type: userNode.type,
          firstName: 'Banana',
          lastName: 'Man',
          meetings: [
            {
              id: '0',
              name: 'Banana Meeting',
              archived: false,
              todos: [
                {
                  id: '0',
                  type: todoNode.type,
                  task: 'Eat a banana',
                },
              ],
            },
          ],
        },
      ];

      QuerySlimmer.onResultsReceived({
        slimmedQuery: mockCachedQuery,
        originalQuery: mockCachedQuery,
        slimmedQueryResults: {
          users: mockCachedQueryData,
        },
        subscriptionEstablished: true,
      });

      expect(QuerySlimmer.onNewQueryReceived(mockCachedQuery)).toBe(null);
    });

    test('it should return a query with only non cached properties for the entire query tree', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };
      const mockCachedQueryData = [
        {
          id: '0',
          type: userNode.type,
          firstName: 'Banana',
          lastName: 'Man',
          meetings: [
            {
              id: '0',
              name: 'Banana Meeting',
              todos: [
                {
                  id: '0',
                  type: todoNode.type,
                  task: 'Eat a banana',
                },
              ],
            },
          ],
        },
      ];

      const mockNewQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName', 'email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task', 'done'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };
      const expectedSlimmedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['done'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };

      QuerySlimmer.onResultsReceived({
        slimmedQuery: mockCachedQuery,
        originalQuery: mockCachedQuery,
        slimmedQueryResults: {
          users: mockCachedQueryData,
        },
        subscriptionEstablished: true,
      });

      expect(QuerySlimmer.onNewQueryReceived(mockNewQuery)).toEqual(
        expectedSlimmedQuery
      );
    });

    test('it should return the query record entry with an empty properties array when those properties are cached but the relational query`s are not', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };
      const mockCachedQueryData = [
        {
          id: '0',
          type: userNode.type,
          firstName: 'Banana',
          lastName: 'Man',
          meetings: [
            {
              id: '0',
              name: 'Banana Meeting',
              archived: false,
              todos: [{ id: '0', task: 'Eat a banana' }],
            },
          ],
        },
        {
          id: '1',
          type: userNode.type,
          firstName: 'Apple',
          lastName: 'Woman',
          meetings: [
            {
              id: '1',
              name: 'Apple Meeting',
              archived: false,
              todos: [{ task: 'Eat an apple' }],
            },
          ],
        },
      ];

      const mockNewQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['done'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };
      const expectedSlimmedNewQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: [],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['done'],
                  oneToMany: true,
                },
              },
            },
          },
        },
      };

      QuerySlimmer.onResultsReceived({
        slimmedQuery: mockCachedQuery,
        originalQuery: mockCachedQuery,
        slimmedQueryResults: {
          users: mockCachedQueryData,
        },
        subscriptionEstablished: true,
      });

      expect(QuerySlimmer.onNewQueryReceived(mockNewQuery)).toEqual(
        expectedSlimmedNewQuery
      );
    });
  });
});
describe('onSubscriptionCancelled', () => {
  test('when a subscription with a count of 1 is cancelled the cache is appropriately updated', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const slimmedQuery: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName', 'lastName'],
      },
    };

    const users = [
      {
        id: 'id-5',
        type: userNode.type,
        firstName: 'Noley',
        lastName: 'Holland',
      },
    ];

    QuerySlimmer.onResultsReceived({
      slimmedQuery,
      originalQuery: slimmedQuery,
      slimmedQueryResults: {
        users,
      },
      subscriptionEstablished: true,
    });
    QuerySlimmer.onSubscriptionCancelled(slimmedQuery, undefined);
    expect(QuerySlimmer.queriesByContext['users(NO_PARAMS)']).toBe(undefined);
  });

  test('when a subscription with a count higher than 1 is cancelled the subscription count is appropriately decremented', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const slimmedQuery: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName', 'lastName'],
      },
    };

    const users = [
      {
        id: 'id-5',
        type: userNode.type,
        firstName: 'Noley',
        lastName: 'Holland',
      },
    ];

    QuerySlimmer.onResultsReceived({
      slimmedQuery,
      originalQuery: slimmedQuery,
      slimmedQueryResults: {
        users,
      },
      subscriptionEstablished: true,
    });
    QuerySlimmer.onResultsReceived({
      slimmedQuery,
      originalQuery: slimmedQuery,
      slimmedQueryResults: {
        users,
      },
      subscriptionEstablished: true,
    });
    QuerySlimmer.onSubscriptionCancelled(slimmedQuery, undefined);
    expect(QuerySlimmer.queriesByContext['users(NO_PARAMS)']).toEqual({
      subscriptionsByProperty: { firstName: 1, lastName: 1 },
      results: users,
    });
  });

  test(`when a relational query's subscription is cancelled, the property count is decremented appropriately`, () => {
    const { QuerySlimmer, userNode, todoNode, meetingNode } = setupTests();
    const mockCachedQuery: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName', 'lastName'],
        relational: {
          meetings: {
            _relationshipName: 'meetings',
            def: meetingNode,
            properties: ['name', 'archived'],
            oneToMany: true,
            relational: {
              todos: {
                _relationshipName: 'todos',
                def: todoNode,
                properties: ['task'],
                oneToMany: true,
              },
            },
          },
        },
      },
    };
    const mockCachedQueryData = [
      {
        id: '0',
        type: userNode.type,
        firstName: 'Banana',
        lastName: 'Man',
        meetings: [
          {
            id: '0',
            type: meetingNode.type,
            name: 'Banana Meeting',
            archived: false,
            todos: [
              {
                id: '0',
                type: todoNode.type,
                task: 'Eat a banana',
              },
            ],
          },
        ],
      },
    ];

    QuerySlimmer.onResultsReceived({
      slimmedQuery: mockCachedQuery,
      originalQuery: mockCachedQuery,
      slimmedQueryResults: {
        users: mockCachedQueryData,
      },
      subscriptionEstablished: true,
    });
    QuerySlimmer.onResultsReceived({
      slimmedQuery: mockCachedQuery,
      originalQuery: mockCachedQuery,
      slimmedQueryResults: {
        users: mockCachedQueryData,
      },
      subscriptionEstablished: true,
    });
    QuerySlimmer.onSubscriptionCancelled(mockCachedQuery, undefined);
    expect(
      QuerySlimmer.queriesByContext[
        'users(NO_PARAMS).meetings(NO_PARAMS).todos(NO_PARAMS)'
      ]
    ).toEqual({
      subscriptionsByProperty: { task: 1 },
    });
  });
});
