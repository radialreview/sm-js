import { config, SMConfig } from './config';
import { setToken } from './auth';
import { smQuery } from './smQuery';
import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

test('smQuery uses the gql client, passing in the expected params', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const queryId = 'MockQueryId';
  const token = 'my mock token';
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
  setToken('default', { token });

  await smQuery(queryDefinitions, { queryId });

  expect(mockQuery).toHaveBeenCalled();
  done();
});

test('smQuery returns the correct data', async () => {
  const queryDefinitions = createMockQueryDefinitions();
  const queryId = 'MockQueryId';
  const token = 'my mock token';

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);
  setToken('default', { token });

  const { users } = await smQuery(queryDefinitions, { queryId });

  expect(users[0].address.apt).toEqual({ floor: 1, number: 1 });
  expect(users[0].todos[0].assignee).toBe('Joe');
});
