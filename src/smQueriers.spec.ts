import { config, SMConfig } from './config';
import { setToken } from './auth';
import { query } from './smQueriers';
import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  mockResultExpectations,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { subscribe } from '.';

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

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  const data = await query(queryDefinitions);

  expect(data).toEqual(mockResultExpectations);
});

test('sm.query calls "onData" with the result of the query', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  query(queryDefinitions, {
    onData: data => {
      expect(data).toEqual(mockResultExpectations);
      done();
    },
  });
});

test('sm.query calls "onError" when the query fails', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const error = new Error();
  const mockQuery = jest.fn(async () => {
    throw error;
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  query(queryDefinitions, {
    onError: e => {
      expect(e).toBe(error);
      done();
    },
  });
});

test('sm.query throws an error when the query fails and no "onError" handler is provided', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const error = new Error();
  const mockQuery = jest.fn(async () => {
    throw error;
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  try {
    await query(queryDefinitions);
  } catch (e) {
    expect(e).toBe(error);
    done();
  }
});

test('sm.subscribe by default queries and subscribes to the data set', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => {
    expect(mockQuery).toHaveBeenCalled();
    done();
  });
  config({
    gqlClient: {
      query: mockQuery,
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      done(e);
    },
  });
});

test('sm.subscribe does not query if skipInitialQuery is true', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => {
    expect(mockQuery).not.toHaveBeenCalled();
    done();
  });
  config({
    gqlClient: {
      query: mockQuery,
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      done(e);
    },
  });
});

test('sm.subscribe returns a method to cancel any subscriptions started', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const cancel = jest.fn();
  const mockSubscribe = jest.fn(() => cancel);
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  const cancelSubs = subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  cancelSubs();
  expect(cancel).toHaveBeenCalled();
  done();
});

test('sm.subscribe calls on error when a query or subscription error occurs', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: () => {
      done();
    },
  });
});
