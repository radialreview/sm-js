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

/*
// TODO:
// - test that you get back actual version of slimmed query after building out onResultsReceived func
*/

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
test('when a subscription is cancelled the cache is appropriately updated', () => {
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
  expect(QuerySlimmer.resultsByContext['users(NO_PARAMS)']).toBe(undefined);
});

test('when a subscription is cancelled the subscription count is appropriately decremented', () => {
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
  expect(QuerySlimmer.resultsByContext['users(NO_PARAMS)']).toEqual({
    subscriptionsByProperty: { firstName: 1, lastName: 1 },
    results: users,
  });
});
