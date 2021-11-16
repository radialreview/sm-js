import { config, SMConfig } from './config';
import { setToken } from './auth';
import { query } from './smQueriers';
import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

const token = 'my mock token';
setToken('default', { token });

test('sm.query uses the gql client, passing in the expected params', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const queryId = 'MockQueryId';
  const expectedGQLBody = convertQueryDefinitionToQueryInfo({
    queryDefinitions,
    queryId,
  }).queryGQL.loc?.source.body;

  const mockQuery = jest.fn(async opts => {
    expect(opts.gql.loc.source.body).toEqual(expectedGQLBody);
    expect(opts.token).toEqual(token);
    return mockQueryDataReturn;
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  await query(queryDefinitions, { queryId });

  expect(mockQuery).toHaveBeenCalled();
  done();
});

test('sm.query returns the correct data', async () => {
  const queryDefinitions = createMockQueryDefinitions();
  const expectedAssignee = {
    id: 'mock-user-id',
    firstName: 'Joe',
  };
  const expectedTodo = {
    id: 'mock-todo-id',
    assignee: expectedAssignee,
  };
  const expectedUsers = [
    {
      id: 'mock-user-id',
      address: { state: 'FL', apt: { number: 1, floor: 1 } },
      todos: [expectedTodo],
    },
  ];

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  const { users } = await query(queryDefinitions);

  expect(users.length).toBe(expectedUsers.length);
  expectedUsers.forEach((expectedUser, i) =>
    expect(users[i]).toEqual(expectedUser)
  );
});
