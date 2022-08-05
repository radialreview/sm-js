import { MMGQL, QueryRecord } from '.';
import { string } from './dataTypes';
import { QuerySlimmer } from './QuerySlimmer';
import { getMockConfig } from './specUtilities';

function setupTests() {
  const mmGQL = new MMGQL(getMockConfig());

  const userNode = mmGQL.def({
    type: 'user',
    properties: {
      firstName: string,
      lastName: string,
    },
  });
  const todoNode = mmGQL.def({
    type: 'todo',
    properties: {
      task: string,
    },
  });

  return { QuerySlimmer: new QuerySlimmer(), userNode, todoNode };
}

test(`when it receives a query's results, it caches the results correctly`, () => {
  const { QuerySlimmer, userNode } = setupTests();

  const slimmedQuery: QueryRecord = {
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
    slimmedQuery,
    originalQuery: slimmedQuery,
    slimmedQueryResults: {
      users,
    },
    subscriptionEstablished: true,
  });

  expect(QuerySlimmer.resultsByContext['users(NO_PARAMS)']).toEqual({
    subscriptionsByProperty: { firstName: 1, lastName: 1 },
    results: users,
  });
});
//test that you get back actual version of slimmed query after building out onResultsReceived func

test('when it queries by a single id in query results it caches them correctly', () => {
  const { QuerySlimmer, userNode } = setupTests();

  const slimmedQuery: QueryRecord = {
    user: {
      def: userNode,
      properties: ['firstName', 'lastName'],
      id: 'id-2',
    },
  };
  const user = {
    id: 'id-2',
    type: userNode.type,
    firstName: 'Aidan',
    lastName: 'Goodman',
  };

  QuerySlimmer.onResultsReceived({
    slimmedQuery,
    originalQuery: slimmedQuery,
    slimmedQueryResults: {
      user,
    },
    subscriptionEstablished: true,
  });

  expect(QuerySlimmer.resultsByContext['user({"id":"id-2"})']).toEqual({
    subscriptionsByProperty: { firstName: 1, lastName: 1 },
    results: user,
  });
});

test('when it queries by a multiple ids in query results it caches them correctly', () => {
  const { QuerySlimmer, userNode } = setupTests();

  const slimmedQuery: QueryRecord = {
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
    slimmedQuery,
    originalQuery: slimmedQuery,
    slimmedQueryResults: {
      users,
    },
    subscriptionEstablished: true,
  });

  expect(
    QuerySlimmer.resultsByContext['users({"ids":["id-3","id-4"]})']
  ).toEqual({
    subscriptionsByProperty: { firstName: 1, lastName: 1 },
    results: users,
  });
});

test('when it queries by a multiple ids in query results it caches them correctly', () => {
  const { QuerySlimmer, userNode, todoNode } = setupTests();

  const slimmedQuery: QueryRecord = {
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
    slimmedQuery,
    originalQuery: slimmedQuery,
    slimmedQueryResults: {
      users,
    },
    subscriptionEstablished: true,
  });

  expect(QuerySlimmer.resultsByContext['users(NO_PARAMS)']).toEqual({
    subscriptionsByProperty: { firstName: 1, lastName: 1 },
    results: users,
  });

  expect(
    QuerySlimmer.resultsByContext['users(NO_PARAMS).todos(NO_PARAMS)']
  ).toEqual({
    subscriptionsByProperty: { task: 1 },
    results: users.map(user => user.todos),
  });
});
