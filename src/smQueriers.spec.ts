import { config, SMConfig } from './config';
import { setToken } from './auth';
import { query, subscribe } from './smQueriers';
import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  mockResultExpectations,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

// this file tests some console error functionality, this keeps the test output clean
const nativeConsoleError = console.error;
beforeEach(() => {
  console.error = () => {};
  config({
    gqlClient: {
      query: async () => mockQueryDataReturn,
      subscribe: () => {},
    },
  } as DeepPartial<SMConfig>);
});
afterAll(() => {
  console.error = nativeConsoleError;
});

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

  const { data } = await query(queryDefinitions);

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
    onData: ({ results }) => {
      expect(results).toEqual(mockResultExpectations);
      done();
    },
  });
});

test('sm.query calls "onError" when the query fails', done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => {
    throw new Error('Something went wrong');
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  query(queryDefinitions, {
    onError: e => {
      expect(e).toMatchInlineSnapshot(`
        [Error: Error querying data
        Error: Something went wrong]
      `);
      done();
    },
  });
});

test('sm.query throws an error when the query fails and no "onError" handler is provided', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => {
    throw new Error('Something went wrong');
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  try {
    await query(queryDefinitions);
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: Error querying data
      Error: Something went wrong]
    `);
    done();
  }
});

test('sm.query throws an error when the user specifies a token which has not been registered', async done => {
  const queryDefinitions = createMockQueryDefinitions();

  try {
    await query(queryDefinitions, { tokenName: 'invalidTokenName' });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: No token registered with the name "invalidTokenName".
      Please register this token prior to using it with sm.setToken(tokenName, { token })) ]
    `);
    done();
  }
});

test('sm.subscribe by default queries and subscribes to the data set', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => {});
  config({
    gqlClient: {
      query: mockQuery,
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  await subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(mockQuery).toHaveBeenCalled();
  expect(mockSubscribe).toHaveBeenCalled();
  done();
});

test('sm.subscribe does not query if skipInitialQuery is true', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => {});
  config({
    gqlClient: {
      query: mockQuery,
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  await subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(mockQuery).not.toHaveBeenCalled();
  done();
});

test('sm.subscribe returns a method to cancel any subscriptions started', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const cancel = jest.fn();
  const mockSubscribe = jest.fn(() => cancel);
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  const { unsub } = await subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  unsub();
  expect(cancel).toHaveBeenCalled();
  done();
});

test('sm.subscribe calls onData with the new set of results when a node is updated', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onMessage({
        users: {
          node: {
            ...mockQueryDataReturn.users[0],
          },
          operation: {
            action: 'UpdateNode',
            path: mockQueryDataReturn.users[0].id,
          },
        },
      });
    }, 20);
  });
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  const onData = jest.fn();
  await subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: onData,
    onError: e => {
      done(e);
    },
  });

  setTimeout(() => {
    expect(onData).toHaveBeenCalledTimes(2);
  }, 40);
});

test('sm.subscribe calls onError when a subscription error occurs', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  await subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: () => {
      done();
    },
  });
});

test('sm.subscribe throws an error when a subscription initialization error occurs and no onError handler is provided', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  try {
    await subscribe(queryDefinitions, {
      skipInitialQuery: true,
      onData: () => {},
    });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: Error initializating subscriptions
      Error: Some error]
    `);
    done();
  }
});

test('sm.subscribe calls onError when a subscription initialization error occurs', async done => {
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
    onError: e => {
      expect(e).toMatchInlineSnapshot(`
        [Error: Error initializating subscriptions
        Error: Some error]
      `);
      done();
    },
  });
});

test('sm.subscribe calls onError when an ongoing subscription error occurs', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onError(new Error('Something went wrong'));
    }, 30);
  });
  config({
    gqlClient: {
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);

  subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      expect(e).toMatchInlineSnapshot(`
        [Error: Error in a subscription message
        Error: Something went wrong]
      `);
      done();
    },
  });
});

test('sm.subscribe calls onError when a query error occurs', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(() => {
    throw Error('Some error');
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      expect(e).toMatchInlineSnapshot(`
        [Error: Error querying initial data set
        Error: Some error]
      `);
      done();
    },
  });
});

test('sm.subscribe throws an error when a query error occurs and no onError handler is provided', async done => {
  const queryDefinitions = createMockQueryDefinitions();
  const mockQuery = jest.fn(() => {
    throw Error('Some error');
  });
  config({
    gqlClient: {
      query: mockQuery,
    },
  } as DeepPartial<SMConfig>);

  try {
    await subscribe(queryDefinitions, {
      onData: () => {},
    });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: Error querying initial data set
      Error: Some error]
    `);
    done();
  }
});

test('sm.subscribe throws an error when the user specifies a token which has not been registered', async done => {
  const queryDefinitions = createMockQueryDefinitions();

  try {
    await subscribe(queryDefinitions, {
      onData: () => {},
      tokenName: 'invalidTokenName',
    });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: Error querying initial data set
      Error: No token registered with the name "invalidTokenName".
      Please register this token prior to using it with sm.setToken(tokenName, { token })) ]
    `);
    done();
  }
});
