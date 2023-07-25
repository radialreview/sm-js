import { MMGQL, QueryRecord, QueryRecordEntry } from '..';
import { DEFAULT_TOKEN_NAME } from '../consts';
import { string, boolean } from '../dataTypes';
import {
  QuerySlimmer,
  TInFlightQueriesByContextMap,
  TQueryRecordByContextMap,
} from './QuerySlimmer';
import { getMockConfig } from '../specUtilities';

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

  return {
    QuerySlimmer: new QuerySlimmer(mmGQL),
    userNode,
    meetingNode,
    todoNode,
  };
}

describe('populateQueriesByContext', () => {
  test.only('it should cache a query by id with only the properties requested', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      user: {
        id: 'user-id-1',
        def: userNode,
        properties: ['id', 'type', 'firstName', 'lastName'],
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockResults = {
      user: {
        id: 'user-id-1',
        type: userNode.type,
        firstName: 'Piotr',
        lastName: 'Bogun',
        email: 'test@email.com',
        nickName: 'Piotr',
      },
    };

    QuerySlimmer.populateQueriesByContext(mockQueryRecord, mockResults);

    expect(QuerySlimmer.queriesByContext['user({"id":"user-id-1"})']).toEqual({
      subscriptionsByProperty: { id: 1, type: 1, firstName: 1, lastName: 1 },
      results: {
        byParentId: false,
        user: {
          id: 'user-id-1',
          type: userNode.type,
          firstName: 'Piotr',
          lastName: 'Bogun',
        },
      },
    });
  });

  test('it should cache a query by ids with only the properties requested', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      users: {
        ids: ['user-id-1', 'user-id-2'],
        def: userNode,
        properties: ['id', 'type', 'firstName', 'lastName'],
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockResults = {
      users: [
        {
          id: 'user-id-1',
          type: userNode.type,
          firstName: 'Aidan',
          lastName: 'Goodman',
          email: 'test@email.com',
          nickName: 'Aidan',
        },
        {
          id: 'user-id-2',
          type: userNode.type,
          firstName: 'Piotr',
          lastName: 'Bogun',
          email: 'test@email.com',
          nickName: 'Piotr',
        },
      ],
    };

    QuerySlimmer.populateQueriesByContext(mockQueryRecord, mockResults);

    expect(
      QuerySlimmer.queriesByContext['users({"ids":["user-id-1","user-id-2"]})']
    ).toEqual({
      subscriptionsByProperty: { id: 1, type: 1, firstName: 1, lastName: 1 },
      results: {
        byParentId: false,
        users: {
          nodes: mockResults.users.map(u => ({
            id: u.id,
            type: u.type,
            firstName: u.firstName,
            lastName: u.lastName,
          })),
        },
      },
    });
  });

  test.only('it should cache an array of results with no params with only the properties requested', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      users: {
        def: userNode,
        properties: ['id', 'type', 'firstName', 'lastName'],
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockResults = {
      users: [
        {
          id: 'user-id-1',
          type: userNode.type,
          firstName: 'Aidan',
          lastName: 'Goodman',
          email: 'test@email.com',
          nickName: 'Aidan',
        },
        {
          id: 'user-id-2',
          type: userNode.type,
          firstName: 'Piotr',
          lastName: 'Bogun',
          email: 'test@email.com',
          nickName: 'Piotr',
        },
      ],
    };

    QuerySlimmer.populateQueriesByContext(mockQueryRecord, mockResults);

    expect(QuerySlimmer.queriesByContext['users(NO_PARAMS)']).toEqual({
      subscriptionsByProperty: { id: 1, type: 1, firstName: 1, lastName: 1 },
      results: {
        byParentId: false,
        users: {
          nodes: mockResults.users.map(u => ({
            id: u.id,
            type: u.type,
            firstName: u.firstName,
            lastName: u.lastName,
          })),
        },
      },
    });
  });

  test.only('it should create separate records for child relational data that contain no parameters', () => {
    const { QuerySlimmer, userNode, todoNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      users: {
        def: userNode,
        properties: ['id', 'type', 'firstName', 'lastName'],
        relational: {
          todos: {
            def: todoNode,
            oneToMany: true,
            _relationshipName: 'todos',
            properties: ['id', 'type', 'task'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'type', 'firstName', 'lastName'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockResults = {
      users: [
        {
          id: 'user-id-1',
          type: userNode.type,
          firstName: 'Aidan',
          lastName: 'Goodman',
          todos: [
            {
              id: 'todo-id-1',
              type: todoNode.type,
              task: 'todo-task-1',
              assignee: {
                id: 'user-id-1',
                type: userNode.type,
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
          ],
        },
        {
          id: 'user-id-2',
          type: userNode.type,
          firstName: 'Piotr',
          lastName: 'Bogun',
          todos: [
            {
              id: 'todo-id-2',
              type: todoNode.type,
              task: 'todo-task-2',
              assignee: {
                id: 'user-id-2',
                type: userNode.type,
                firstName: 'Piotr',
                lastName: 'Bogun',
              },
            },
          ],
        },
      ],
    };

    QuerySlimmer.populateQueriesByContext(mockQueryRecord, mockResults);

    expect(QuerySlimmer.queriesByContext['users(NO_PARAMS)']).toEqual({
      subscriptionsByProperty: { id: 1, type: 1, firstName: 1, lastName: 1 },
      results: {
        byParentId: false,
        users: {
          nodes: mockResults.users.map(u => ({
            id: u.id,
            type: u.type,
            firstName: u.firstName,
            lastName: u.lastName,
          })),
        },
      },
    });

    expect(
      QuerySlimmer.queriesByContext['users(NO_PARAMS).todos(NO_PARAMS)']
    ).toEqual({
      subscriptionsByProperty: { id: 1, type: 1, task: 1 },
      results: {
        byParentId: true,
        'user-id-1': {
          todos: {
            nodes: [
              { id: 'todo-id-1', type: todoNode.type, task: 'todo-task-1' },
            ],
          },
        },
        'user-id-2': {
          todos: {
            nodes: [
              { id: 'todo-id-2', type: todoNode.type, task: 'todo-task-2' },
            ],
          },
        },
      },
    });

    expect(
      QuerySlimmer.queriesByContext[
        'users(NO_PARAMS).todos(NO_PARAMS).users(NO_PARAMS)'
      ]
    ).toEqual({
      subscriptionsByProperty: { id: 1, type: 1, firstName: 1, lastName: 1 },
      results: {
        byParentId: true,
        'todo-id-1': {
          assignee: {
            id: 'user-id-1',
            type: userNode.type,
            firstName: 'Aidan',
            lastName: 'Goodman',
          },
        },
        'todo-id-2': {
          assignee: {
            id: 'user-id-2',
            type: userNode.type,
            firstName: 'Piotr',
            lastName: 'Bogun',
          },
        },
      },
    });
  });
});

describe('getInFlightQueriesToSlimAgainst', () => {
  test('it should return in flight queries that match by root level context keys and are requesting at least one of the same properties', () => {
    const { QuerySlimmer, userNode, todoNode } = setupTests();

    const newQueryMock: TQueryRecordByContextMap = {
      [`users(NO_PARAMS)`]: {
        users: {
          def: userNode,
          properties: ['firstName', 'email'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      },
      [`todos(NO_PARAMS)`]: {
        todos: {
          def: todoNode,
          properties: ['task', 'done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      },
    };
    const inFlightQueriesMock: TInFlightQueriesByContextMap = {
      [`users(NO_PARAMS)`]: [
        {
          queryId: '1',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
        {
          queryId: '2',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['lastName'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
      ],
      [`todos(NO_PARAMS)`]: [
        {
          queryId: '3',
          queryRecord: {
            todos: {
              def: todoNode,
              properties: ['task'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
      ],
    };
    const expectedReturnValue: TInFlightQueriesByContextMap = {
      [`users(NO_PARAMS)`]: [
        {
          queryId: '1',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
      ],
      [`todos(NO_PARAMS)`]: [
        {
          queryId: '3',
          queryRecord: {
            todos: {
              def: todoNode,
              properties: ['task'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
      ],
    };

    QuerySlimmer.inFlightQueryRecords = inFlightQueriesMock;

    expect(QuerySlimmer.getInFlightQueriesToSlimAgainst(newQueryMock)).toEqual(
      expectedReturnValue
    );
  });

  test('it should only return in flight queries that have a relational depth that is less than or equal to that of the new query', () => {
    const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

    const newQueryMock: TQueryRecordByContextMap = {
      [`users(NO_PARAMS)`]: {
        users: {
          def: userNode,
          properties: ['firstName', 'email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived', 'isAgendaInitialized'],
              oneToMany: true,
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      },
    };

    const inFlightQueriesMock: TInFlightQueriesByContextMap = {
      [`users(NO_PARAMS)`]: [
        {
          queryId: '1',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName', 'lastName'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
        {
          queryId: '2',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName', 'lastName'],
              relational: {
                meetings: {
                  _relationshipName: 'meetings',
                  def: meetingNode,
                  properties: ['name', 'archived'],
                  oneToMany: true,
                },
              },
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
        {
          queryId: '3',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName', 'email'],
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
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
      ],
    };

    const expectedReturnValue: TInFlightQueriesByContextMap = {
      [`users(NO_PARAMS)`]: [
        {
          queryId: '1',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName', 'lastName'],
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
        {
          queryId: '2',
          queryRecord: {
            users: {
              def: userNode,
              properties: ['firstName', 'lastName'],
              relational: {
                meetings: {
                  _relationshipName: 'meetings',
                  def: meetingNode,
                  properties: ['name', 'archived'],
                  oneToMany: true,
                },
              },
              tokenName: DEFAULT_TOKEN_NAME,
            },
          },
        },
      ],
    };

    QuerySlimmer.inFlightQueryRecords = inFlightQueriesMock;

    expect(QuerySlimmer.getInFlightQueriesToSlimAgainst(newQueryMock)).toEqual(
      expectedReturnValue
    );
  });
});

describe('getSlimmedQueryAgainstQueriesByContext', () => {
  describe('when the new query contains no requests for relational data', () => {
    test('it should return the whole new query record without changes if none of the query record entries are found in queriesByContext', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockQueryRecord)
      ).toEqual(mockQueryRecord);
    });

    test('it should return null if the query record entries and the properties of each entry are already cached', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockResults = {
        users: [
          {
            id: '0',
            type: userNode.type,
            firstName: 'Banana',
            lastName: 'Man',
          },
        ],
        todos: [
          {
            id: '0',
            type: todoNode.type,
            task: 'Eat a banana',
          },
        ],
      };

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockQueryRecord)
      ).toEqual(mockQueryRecord);

      QuerySlimmer.populateQueriesByContext(mockQueryRecord, mockResults);

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockQueryRecord)
      ).toEqual(null);
    });

    test('it should not slim properties that are cached but have no live subscriptions', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      QuerySlimmer.queriesByContext = {
        'users(NO_PARAMS)': {
          subscriptionsByProperty: { firstName: 1, lastName: 0 },
          results: [],
        },
        'todos(NO_PARAMS)': {
          subscriptionsByProperty: { id: 0, task: 1 },
          results: [],
        },
      };

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      const expectedSlimmedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockQueryRecord)
      ).toEqual(expectedSlimmedQuery);
    });

    test('it should return a slimmed query record where query record entries are returned with only non cached properties', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        meetings: {
          def: meetingNode,
          properties: ['name', 'archived'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedResults = {
        users: [
          {
            id: '0',
            type: userNode.type,
            firstName: 'Banana',
            lastName: 'Man',
          },
        ],
        meetings: [
          {
            id: '0',
            type: meetingNode.type,
            name: 'Banana Meeting',
            archived: false,
          },
        ],
        todos: [
          {
            id: '0',
            type: todoNode.type,
            task: 'Eat a banana',
          },
        ],
      };

      const mockNewQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName', 'email'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        meetings: {
          def: meetingNode,
          properties: ['name', 'archived'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['task', 'done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      const expectedSlimmedNewQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockNewQueryRecord)
      ).toEqual(mockNewQueryRecord);

      QuerySlimmer.populateQueriesByContext(
        mockCachedQueryRecord,
        mockCachedResults
      );

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockNewQueryRecord)
      ).toEqual(expectedSlimmedNewQueryRecord);
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
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedQueryData = {
        users: [
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
        ],
      };

      QuerySlimmer.populateQueriesByContext(
        mockCachedQuery,
        mockCachedQueryData
      );

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockCachedQuery)
      ).toBe(null);
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
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedQueryData = {
        users: [
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
        ],
      };

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
          tokenName: DEFAULT_TOKEN_NAME,
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
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      QuerySlimmer.populateQueriesByContext(
        mockCachedQuery,
        mockCachedQueryData
      );

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockNewQuery)
      ).toEqual(expectedSlimmedQuery);
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
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedQueryData = {
        users: [
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
        ],
      };

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
          tokenName: DEFAULT_TOKEN_NAME,
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
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      QuerySlimmer.populateQueriesByContext(
        mockCachedQuery,
        mockCachedQueryData
      );

      expect(
        QuerySlimmer.getSlimmedQueryAgainstQueriesByContext(mockNewQuery)
      ).toEqual(expectedSlimmedNewQuery);
    });
  });
});

describe('getSlimmedQueryAgainstInFlightQuery', () => {
  test('should slim the new query against an in flight query that have already been matched by context', () => {
    const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

    const newQueryMock: QueryRecord = {
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
        tokenName: DEFAULT_TOKEN_NAME,
      },
      todos: {
        def: todoNode,
        properties: ['task', 'done'],
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };
    const inFlightQueryMock: QueryRecord = {
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
                properties: ['done'],
                oneToMany: true,
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
      todos: {
        def: todoNode,
        properties: ['task'],
        tokenName: DEFAULT_TOKEN_NAME,
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
                properties: ['task'],
                oneToMany: true,
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
      todos: {
        def: todoNode,
        properties: ['done'],
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    expect(
      QuerySlimmer.getSlimmedQueryAgainstInFlightQuery(
        newQueryMock,
        inFlightQueryMock,
        false
      )
    ).toEqual(expectedSlimmedQuery);
  });
});

describe('onSubscriptionCancelled', () => {
  test(`when a query subscription is cancelled the subcription counts for the query's properties should be decremented`, () => {
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
                properties: ['task', 'done'],
                oneToMany: true,
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };
    const mockCachedQueryData = {
      users: [
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
                  done: false,
                },
              ],
            },
          ],
        },
      ],
    };

    const mockCachedQueryUsersContextKey = `users(NO_PARAMS)`;
    const mockCachedQueryMeetingsContextKey = `${mockCachedQueryUsersContextKey}.meetings(NO_PARAMS)`;
    const mockCachedQueryTodosContextKey = `${mockCachedQueryMeetingsContextKey}.todos(NO_PARAMS)`;

    const mockUnsubbedQuery: QueryRecord = {
      users: {
        def: userNode,
        properties: ['firstName'],
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
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    QuerySlimmer.populateQueriesByContext(mockCachedQuery, mockCachedQueryData);

    expect(
      QuerySlimmer.queriesByContext[mockCachedQueryUsersContextKey]
        .subscriptionsByProperty
    ).toEqual({
      firstName: 1,
      lastName: 1,
    });
    expect(
      QuerySlimmer.queriesByContext[mockCachedQueryMeetingsContextKey]
        .subscriptionsByProperty
    ).toEqual({
      name: 1,
      archived: 1,
    });
    expect(
      QuerySlimmer.queriesByContext[mockCachedQueryTodosContextKey]
        .subscriptionsByProperty
    ).toEqual({
      task: 1,
      done: 1,
    });

    QuerySlimmer.onSubscriptionCancelled(mockUnsubbedQuery);

    expect(
      QuerySlimmer.queriesByContext[mockCachedQueryUsersContextKey]
        .subscriptionsByProperty
    ).toEqual({
      firstName: 0,
      lastName: 1,
    });
    expect(
      QuerySlimmer.queriesByContext[mockCachedQueryMeetingsContextKey]
        .subscriptionsByProperty
    ).toEqual({
      name: 0,
      archived: 1,
    });
    expect(
      QuerySlimmer.queriesByContext[mockCachedQueryTodosContextKey]
        .subscriptionsByProperty
    ).toEqual({
      task: 0,
      done: 1,
    });
  });
});

describe('getRelationalDepthOfQueryRecordEntry', () => {
  test('should return 0 when a QueryRecordEntry has no relational child queries', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecordEntry: QueryRecordEntry = {
      def: userNode,
      properties: ['firstName', 'lastName'],
      tokenName: DEFAULT_TOKEN_NAME,
    };
    const actualValue = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry
    );

    expect(actualValue).toBe(0);
  });

  test('should return number of relational queries nested in a QueryRecordEntry', () => {
    const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

    const mockQueryRecordEntry1: QueryRecordEntry = {
      def: userNode,
      properties: ['firstName', 'lastName'],
      relational: {
        meetings: {
          _relationshipName: 'meetings',
          def: meetingNode,
          properties: ['name', 'archived'],
          oneToMany: true,
        },
      },
      tokenName: DEFAULT_TOKEN_NAME,
    };
    const mockQueryRecordEntry2: QueryRecordEntry = {
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
              properties: ['task', 'done'],
              oneToMany: true,
            },
          },
        },
      },
      tokenName: DEFAULT_TOKEN_NAME,
    };
    const mockQueryRecordEntry3: QueryRecordEntry = {
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
              properties: ['task', 'done'],
              oneToMany: true,
            },
          },
        },
        todos: {
          _relationshipName: 'todos',
          def: todoNode,
          properties: ['task', 'done'],
          oneToMany: true,
          relational: {
            users: {
              _relationshipName: 'users',
              def: userNode,
              properties: ['firstName', 'lastName'],
              oneToMany: true,
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
          },
        },
      },
      tokenName: DEFAULT_TOKEN_NAME,
    };

    const actualValue1 = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry1
    );
    const actualValue2 = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry2
    );
    const actualValue3 = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry3
    );

    expect(actualValue1).toBe(1);
    expect(actualValue2).toBe(2);
    expect(actualValue3).toBe(5);
  });
});
