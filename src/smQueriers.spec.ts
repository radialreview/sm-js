import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  mockQueryResultExpectations,
  getMockSubscriptionMessage,
  getMockConfig,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { SMJS } from '.';

// this file tests some console error functionality, this keeps the test output clean
const nativeConsoleError = console.error;
beforeEach(() => {
  console.error = () => {};
});
afterAll(() => {
  console.error = nativeConsoleError;
});

test('sm.query uses the gql client, passing in the expected params', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();
  const token = 'mock token';
  smJSInstance.setToken({ tokenName: 'default', token });
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
  smJSInstance.gqlClient.query = mockQuery;

  await smJSInstance.query(queryDefinitions, { queryId });

  expect(mockQuery).toHaveBeenCalled();
  done();
});

test('sm.query returns the correct data', async () => {
  const { smJSInstance, queryDefinitions } = setupTest();

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toEqual(mockQueryResultExpectations);
});

test('sm.query calls "onData" with the result of the query', done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  smJSInstance.query(queryDefinitions, {
    onData: ({ results }) => {
      expect(results).toEqual(mockQueryResultExpectations);
      done();
    },
  });
});

test('sm.query calls "onError" when the query fails', done => {
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(async () => {
    throw new Error('Something went wrong');
  });
  smJSInstance.gqlClient.query = mockQuery;

  smJSInstance.query(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(async () => {
    throw new Error('Something went wrong');
  });
  smJSInstance.gqlClient.query = mockQuery;

  try {
    await smJSInstance.query(queryDefinitions);
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: Error querying data
      Error: Something went wrong]
    `);
    done();
  }
});

test('sm.query throws an error when the user specifies a token which has not been registered', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  try {
    await smJSInstance.query(queryDefinitions, {
      tokenName: 'invalidTokenName',
    });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: No token registered with the name "invalidTokenName".
      Please register this token prior to using it with sm.setToken({ tokenName, token })) ]
    `);
    done();
  }
});

test('sm.subscribe by default queries and subscribes to the data set', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => () => {});
  smJSInstance.gqlClient.query = mockQuery;
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  await smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  const mockSubscribe = jest.fn(() => () => {});
  smJSInstance.gqlClient.query = mockQuery;
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  await smJSInstance.subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(mockQuery).not.toHaveBeenCalled();
  done();
});

test('sm.subscribe returns the expected data', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  const { data } = await smJSInstance.subscribe(queryDefinitions, {
    onData: () => {},
    onError: e => {
      done(e);
    },
  });

  expect(data).toEqual(mockQueryResultExpectations);
  done();
});

test('sm.subscribe returns a method to cancel any subscriptions started', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  const cancel = jest.fn();
  const mockSubscribe = jest.fn(() => cancel);
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  const { unsub } = await smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockSubscriptionMessage = getMockSubscriptionMessage(smJSInstance);

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
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  let iteration = 0;
  const onData = jest.fn(({ results }) => {
    // ignore when onData is called with the query results
    if (iteration === 1) {
      expect(results.users[0].address.state).toEqual('Definitely not FL');
    } else {
      iteration++;
    }
  });
  await smJSInstance.subscribe(queryDefinitions, {
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

test('sm.subscribe handles a case where a subscription message comes in before the query result, but the subscription message had the newest version', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockSubscriptionMessage = getMockSubscriptionMessage(smJSInstance);

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
  smJSInstance.gqlClient.query = mockQuery;
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  const onData = jest.fn(({ results }) => {
    try {
      expect(results.users[0].address.state).toEqual('Definitely not FL');
    } catch (e) {
      done(e);
    }
  });
  await smJSInstance.subscribe(queryDefinitions, {
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

test('sm.subscribe handles a case where a subscription message comes in before the query result, but the subscription message did not have the newest version', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockSubscriptionMessage = getMockSubscriptionMessage(smJSInstance);

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
  smJSInstance.gqlClient.query = mockQuery;
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  const onData = jest.fn(({ results }) => {
    expect(results).toEqual(mockQueryResultExpectations);
  });
  await smJSInstance.subscribe(queryDefinitions, {
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

test('sm.subscribe calls onError when a subscription error occurs', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  await smJSInstance.subscribe(queryDefinitions, {
    skipInitialQuery: true,
    onData: () => {},
    onError: () => {
      done();
    },
  });
});

test('sm.subscribe throws an error when a subscription initialization error occurs and no onError handler is provided', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();

  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  try {
    await smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockSubscribe = jest.fn(() => {
    throw Error('Some error');
  });
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
      opts.onError(new Error('Something went wrong'));
    }, 30);
    return () => {};
  });
  smJSInstance.gqlClient.subscribe = mockSubscribe;

  smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(() => {
    throw Error('Some error');
  });
  smJSInstance.gqlClient.query = mockQuery;

  smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();
  const mockQuery = jest.fn(() => {
    throw Error('Some error');
  });
  smJSInstance.gqlClient.query = mockQuery;

  try {
    await smJSInstance.subscribe(queryDefinitions, {
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
  const { smJSInstance, queryDefinitions } = setupTest();

  try {
    await smJSInstance.subscribe(queryDefinitions, {
      onData: () => {},
      tokenName: 'invalidTokenName',
    });
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: No token registered with the name "invalidTokenName".
      Please register this token prior to using it with sm.setToken(tokenName, { token })) ]
    `);
    done();
  }
});

function setupTest() {
  const smJSInstance = new SMJS(getMockConfig());
  smJSInstance.setToken({ tokenName: 'default', token: 'mock token' });
  const queryDefinitions = createMockQueryDefinitions(smJSInstance);

  return { smJSInstance, queryDefinitions };
}
