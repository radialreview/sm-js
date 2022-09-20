import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  getMockQueryResultExpectations,
  getMockSubscriptionMessage,
  getMockConfig,
} from '../specUtilities';
import { convertQueryDefinitionToQueryInfo } from '../queryDefinitionAdapters';
import { MMGQL } from '..';
import { DEFAULT_TOKEN_NAME } from '../consts';

import { EPaginationFilteringSortingInstance } from '../types';

// this file tests some console error functionality, this keeps the test output clean
const nativeConsoleError = console.error;
beforeEach(() => {
  console.error = () => {};
});
afterAll(() => {
  console.error = nativeConsoleError;
});

test('query uses the gql client, passing in the expected params', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const token = 'mock token';
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token });
  const queryId = 'MockQueryId';
  const expectedGQLBody = convertQueryDefinitionToQueryInfo({
    queryDefinitions,
    queryId,
    useServerSidePaginationFilteringSorting: true,
  }).queryGQL.loc?.source.body;

  const mockQuery = jest.fn(async opts => {
    expect(opts.gql.loc.source.body).toEqual(expectedGQLBody);
    expect(opts.token).toEqual(token);
    return mockQueryDataReturn;
  });
  mmGQLInstance.gqlClient.query = mockQuery;

  await mmGQLInstance.query(queryDefinitions, { queryId });

  expect(mockQuery).toHaveBeenCalled();
  done();
});

test('query returns the correct data', async () => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const { data } = await mmGQLInstance.query(queryDefinitions);

  expect(JSON.stringify(data)).toEqual(
    JSON.stringify(
      getMockQueryResultExpectations({
        useServerSidePaginationFilteringSorting: true,
      })
    )
  );
});

test('query calls "onData" with the result of the query', done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  mmGQLInstance.query(queryDefinitions, {
    onData: ({ results }) => {
      expect(JSON.stringify(results)).toEqual(
        JSON.stringify(
          getMockQueryResultExpectations({
            useServerSidePaginationFilteringSorting: true,
          })
        )
      );
      done();
    },
  });
});

test('query calls "onError" when the query fails', done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(async () => {
    throw new Error('Something went wrong');
  });
  mmGQLInstance.gqlClient.query = mockQuery;

  mmGQLInstance.query(queryDefinitions, {
    onError: e => {
      expect(e.stack.includes(`Error: Something went wrong`)).toBe(true);
      done();
    },
  });
});

test('query throws an error when the query fails and no "onError" handler is provided', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(async () => {
    throw new Error('Something went wrong');
  });
  mmGQLInstance.gqlClient.query = mockQuery;

  try {
    await mmGQLInstance.query(queryDefinitions);
  } catch (e) {
    expect((e as any).stack.includes(`Error: Something went wrong`)).toBe(true);
    done();
  }
});

test('query throws an error when the user specifies a token which has not been registered', async done => {
  const { mmGQLInstance, createMockQueryDefinitions } = setupTest();

  try {
    await mmGQLInstance.query(
      createMockQueryDefinitions(mmGQLInstance, {
        tokenName: 'invalidTokenName',
      })
    );
  } catch (e) {
    expect(
      (e as any).stack.includes(
        `Error: No token registered with the name "invalidTokenName".\nPlease register this token prior to using it with setToken({ tokenName, token }))`
      )
    ).toBe(true);

    done();
  }
});

test('query can query data using multiple tokens, by making parallel requests', () => {
  const { mmGQLInstance, createMockQueryDefinitions } = setupTest();

  mmGQLInstance.setToken({ tokenName: 'mainToken', token: '123' });
  mmGQLInstance.setToken({ tokenName: 'altToken', token: '321' });

  const mainTokenQD = createMockQueryDefinitions(mmGQLInstance, {
    tokenName: 'mainToken',
  }).users;
  const altTokenQD = createMockQueryDefinitions(mmGQLInstance, {
    tokenName: 'altToken',
  }).users;

  mmGQLInstance.gqlClient.query = jest.fn(async () => ({
    mainTokenQD: mockQueryDataReturn.users,
    altTokenQD: mockQueryDataReturn.users,
  }));

  mmGQLInstance.query({
    mainTokenQD,
    altTokenQD,
  });

  expect(mmGQLInstance.gqlClient.query).toHaveBeenCalledTimes(2);
  expect(mmGQLInstance.gqlClient.query).toHaveBeenCalledWith(
    expect.objectContaining({
      token: '123',
    })
  );
  expect(mmGQLInstance.gqlClient.query).toHaveBeenCalledWith(
    expect.objectContaining({
      token: '321',
    })
  );
});

test('sm.subscribe by default queries and subscribes to the data set', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => () => {});
  mmGQLInstance.gqlClient.query = mockQuery;
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  await mmGQLInstance.subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(mockQuery).toHaveBeenCalled();
  expect(mockSubscribe).toHaveBeenCalled();
  done();
});

test('subscribe does not query if skipInitialQuery is true', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => () => {});
  mmGQLInstance.gqlClient.query = mockQuery;
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  await mmGQLInstance.subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(mockQuery).not.toHaveBeenCalled();
  done();
});

test('subscribe returns the expected data', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const { data } = await mmGQLInstance.subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(data).toEqual(
    getMockQueryResultExpectations({
      useServerSidePaginationFilteringSorting: true,
    })
  );
  done();
});

test('subscribe returns a method to cancel any subscriptions started', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const cancel = jest.fn();
  const mockSubscribe = jest.fn(() => cancel);
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  const { unsub } = await mmGQLInstance.subscribe(queryDefinitions, {
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

test('subscribe calls onData with the new set of results when a node is updated', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockSubscriptionMessage = getMockSubscriptionMessage(mmGQLInstance);

  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onMessage({
        users: {
          ...mockSubscriptionMessage.users,
          node: {
            ...mockSubscriptionMessage.users.node,
            version: 2,
            address__dot__state: 'Definitely not FL',
          },
        },
      });
    }, 20);
    return () => {};
  });
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  let iteration = 0;
  const onData = jest.fn(({ results }) => {
    // ignore when onData is called with the query results
    if (iteration === 1) {
      expect(results.users.nodes[0].address.state).toEqual('Definitely not FL');
    } else {
      iteration++;
    }
  });
  await mmGQLInstance.subscribe(queryDefinitions, {
    onData: onData,
    onError: e => {
      done(e);
    },
  });

  setTimeout(() => {
    expect(onData).toHaveBeenCalledTimes(2);
    done();
  }, 40);
});

test.skip('subscribe handles a case where a subscription message comes in before the query result, but the subscription message had the newest version', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockSubscriptionMessage = getMockSubscriptionMessage(mmGQLInstance);

  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onMessage({
        users: {
          ...mockSubscriptionMessage.users,
          node: {
            ...mockSubscriptionMessage.users.node,
            version: 2,
            address__dot__state: 'Definitely not FL',
          },
        },
      });
    }, 20);
    return () => {};
  });
  const mockQuery = jest.fn(() => {
    return new Promise(res => {
      setTimeout(() => {
        res(mockQueryDataReturn);
      }, 40);
    });
  });
  mmGQLInstance.gqlClient.query = mockQuery;
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  const onData = jest.fn(({ results }) => {
    try {
      expect(results.users.nodes[0].address.state).toEqual('Definitely not FL');
    } catch (e) {
      done(e);
    }
  });
  await mmGQLInstance.subscribe(queryDefinitions, {
    onData: onData,
    onError: e => {
      done(e);
    },
  });

  setTimeout(() => {
    expect(onData).toHaveBeenCalledTimes(1);
    done();
  }, 60);
});

test.skip('subscribe handles a case where a subscription message comes in before the query result, but the subscription message did not have the newest version', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockSubscriptionMessage = getMockSubscriptionMessage(mmGQLInstance);

  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onMessage({
        users: {
          ...mockSubscriptionMessage.users,
          node: {
            ...mockSubscriptionMessage.users.node,
            version: 0,
            address__dot__state: 'Definitely not FL',
          },
        },
      });
    }, 20);
    return () => {};
  });
  const mockQuery = jest.fn(() => {
    return new Promise(res => {
      setTimeout(() => {
        res(mockQueryDataReturn);
      }, 40);
    });
  });
  mmGQLInstance.gqlClient.query = mockQuery;
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  const onData = jest.fn(({ results }) => {
    expect(results).toEqual(
      getMockQueryResultExpectations({
        useServerSidePaginationFilteringSorting: true,
      })
    );
  });
  await mmGQLInstance.subscribe(queryDefinitions, {
    onData: onData,
    onError: e => {
      done(e);
    },
  });

  setTimeout(() => {
    expect(onData).toHaveBeenCalledTimes(1);
    done();
  }, 60);
});

test('subscribe calls onError when a subscription error occurs', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  await mmGQLInstance.subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: () => {
      done();
    },
  });
});

test('subscribe throws an error when a subscription initialization error occurs and no onError handler is provided', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  try {
    await mmGQLInstance.subscribe(queryDefinitions, {
      skipInitialQuery: true,
      onData: () => {},
    });
  } catch (e) {
    expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
    done();
  }
});

test('subscribe calls onError when a subscription initialization error occurs', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  mmGQLInstance.subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
      done();
    },
  });
});

test('subscribe calls onError when an ongoing subscription error occurs', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onError(new Error('Something went wrong'));
    }, 30);
    return () => {};
  });
  mmGQLInstance.gqlClient.subscribe = mockSubscribe;

  mmGQLInstance.subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      expect((e as any).stack.includes(`Error: Something went wrong`)).toBe(
        true
      );
      done();
    },
  });
});

test('subscribe calls onError when a query error occurs', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(() => {
    throw Error('Some error');
  });
  mmGQLInstance.gqlClient.query = mockQuery;

  mmGQLInstance.subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
      done();
    },
  });
});

test('subscribe throws an error when a query error occurs and no onError handler is provided', async done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(() => {
    throw Error('Some error');
  });
  mmGQLInstance.gqlClient.query = mockQuery;

  try {
    await mmGQLInstance.subscribe(queryDefinitions, {
      onData: () => {},
    });
  } catch (e) {
    expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
    done();
  }
});

test('subscribe throws an error when the user specifies a token which has not been registered', async done => {
  const { mmGQLInstance, createMockQueryDefinitions } = setupTest();

  try {
    await mmGQLInstance.subscribe(
      createMockQueryDefinitions(mmGQLInstance, {
        tokenName: 'invalidTokenName',
      }),
      {
        onData: () => {},
      }
    );
  } catch (e) {
    expect(
      (e as any).stack.includes(
        `Error: No token registered with the name "invalidTokenName".\nPlease register this token prior to using it with setToken({ tokenName, token }))`
      )
    ).toBe(true);
    done();
  }
});

function setupTest(mockData?: any) {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      mockData: mockData,
      generateMockData: false,
      paginationFilteringSortingInstance:
        EPaginationFilteringSortingInstance.SERVER,
    })
  );
  mmGQLInstance.setToken({
    tokenName: DEFAULT_TOKEN_NAME,
    token: 'mock token',
  });
  const queryDefinitions = createMockQueryDefinitions(mmGQLInstance);

  return { mmGQLInstance, queryDefinitions, createMockQueryDefinitions };
}
