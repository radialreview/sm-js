import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  mockQueryResultExpectations,
  getMockSubscriptionMessage,
  getMockConfig,
  generateUserNode,
  mockUserData,
  mockTodoData,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { MMGQL, queryDefinition } from '.';
import { DEFAULT_TOKEN_NAME } from './consts';
import { NULL_TAG } from './dataConversions';

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
    queryId: queryId + '_default', // the token being used
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

  expect(data).toEqual(mockQueryResultExpectations);
});

test('query calls "onData" with the result of the query', done => {
  const { mmGQLInstance, queryDefinitions } = setupTest();

  mmGQLInstance.query(queryDefinitions, {
    onData: ({ results }) => {
      expect(results).toEqual(mockQueryResultExpectations);
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

function createMockDataItems<T>(opts: {
  sampleMockData: T & { id: string };
  items: Array<Partial<any>>;
}) {
  return {
    nodes: opts.items.map((mockItem, index) => ({
      ...opts.sampleMockData,
      ...mockItem,
      id: opts.sampleMockData.id + index,
    })),
  };
}

test(`sm.query.filter can filter 'number' prop using '_gte' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 30,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        score: { _gte: 20 },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'number' prop using '_lte' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 30,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        score: { _lte: 20 },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'number' prop using '_eq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 10,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        score: { _eq: 10 },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'number' prop using '_neq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 30,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        score: { _neq: 10 },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'number' prop using '_gt' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 30,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        score: { _gt: 10 },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'number' prop using '_lt' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 30,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        score: { _lt: 20 },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'boolean' prop using '_eq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          archived: true,
        },
        {
          archived: true,
        },
        {
          archived: false,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score, archived }) => ({
        id,
        score,
        archived,
      }),
      filter: {
        archived: { _eq: true },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'null' values with '_eq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          optionalProp: NULL_TAG,
        },
        {
          optionalProp: NULL_TAG,
        },
        {
          optionalProp: 'withvalue',
        },
      ],
    }),
  });

  expect(
    (
      await mmGQLInstance.query({
        users: queryDefinition({
          def: generateUserNode(mmGQLInstance),
          map: ({ id, score, optionalProp }) => ({
            id,
            score,
            optionalProp,
          }),
          filter: {
            optionalProp: { _eq: null },
          },
        }),
      })
    ).data.users.length
  ).toBe(2);
});

test(`sm.query.filter can filter 'null' values with '_neq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          optionalProp: NULL_TAG,
        },
        {
          optionalProp: NULL_TAG,
        },
        {
          optionalProp: 'withvalue',
        },
      ],
    }),
  });

  expect(
    (
      await mmGQLInstance.query({
        users: queryDefinition({
          def: generateUserNode(mmGQLInstance),
          map: ({ id, score, optionalProp }) => ({
            id,
            score,
            optionalProp,
          }),
          filter: {
            optionalProp: { _neq: null },
          },
        }),
      })
    ).data.users.length
  ).toBe(1);
});

test(`sm.query.filter can filter 'boolean' prop using '_neq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          archived: true,
        },
        {
          archived: true,
        },
        {
          archived: false,
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, archived }) => ({
        id,
        archived,
      }),
      filter: {
        archived: { _eq: false },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'string' prop using '_eq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John',
        },
        {
          firstName: 'Doe',
        },
        {
          firstName: 'Mary',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
      filter: {
        firstName: { _eq: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'string' prop using '_contains' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John Patrick',
        },
        {
          firstName: 'Patrick John',
        },
        {
          firstName: 'Mary',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
      filter: {
        firstName: { _contains: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'string' prop using '_ncontains' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John Patrick',
        },
        {
          firstName: 'Patrick John',
        },
        {
          firstName: 'Mary',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
      filter: {
        firstName: { _ncontains: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'string' prop using '_neq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John',
        },
        {
          firstName: 'John',
        },
        {
          firstName: 'Mary',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
      filter: {
        firstName: { _neq: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter supports old filter object format with '_eq' as default operator`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John',
        },
        {
          firstName: 'Test',
        },
        {
          firstName: 'Test',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
      filter: {
        firstName: 'Test',
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'My Todo 1',
              },
              {
                task: 'My Todo 2',
              },
              {
                task: 'Todo 8',
              },
            ],
          }),
        },
        {
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'My Todo 3',
              },
              {
                task: 'Todo 4',
              },
            ],
          }),
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score, todos }) => ({
        id,
        score,
        todos: todos({
          map: ({ task }) => ({ task }),
          filter: {
            task: { _contains: 'my todo' },
          },
        }),
      }),
    }),
  });

  // @TODO_NEVER_TYPE_ISSUE
  // @ts-ignore-error
  expect(data.users[0].todos.length).toBe(2);
  // @ts-ignore-error
  expect(data.users[1].todos.length).toBe(1);
});

test(`sm.query.filter can filter multilevel relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'My Todo 1',
                users: createMockDataItems({
                  sampleMockData: mockUserData,
                  items: [
                    {
                      firstName: 'John',
                    },
                    {
                      firstName: 'Mark',
                    },
                  ],
                }),
              },
            ],
          }),
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ id, score, todos }) => ({
        id,
        score,
        todos: todos({
          map: ({ id, users }) => ({
            id,
            users: users({
              map: ({ firstName }) => ({ firstName }),
              filter: {
                firstName: { _contains: 'john' },
              },
            }),
          }),
        }),
      }),
    }),
  });

  // @TODO_NEVER_TYPE_ISSUE
  // @ts-ignore-error
  expect(data.users[0].todos[0].users.length).toBe(1);
});

test(`sm.query.filter can filter nested object property`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          address__dot__state: 'FL',
        },
        {
          address__dot__state: 'NY',
        },
        {
          address__dot__state: 'FL',
        },
      ],
    }),
  });

  expect(
    (
      await mmGQLInstance.query({
        users: queryDefinition({
          def: generateUserNode(mmGQLInstance),
          map: ({ id, address }) => ({
            id,
            address: address({
              map: ({ state }) => ({ state }),
            }),
          }),
          filter: {
            address: {
              state: { _eq: 'FL' },
            },
          },
        }),
      })
    ).data.users.length
  ).toBe(2);
});

test(`sm.query.filter should throw an error if property being filtered is not defined in the queryDefinition map function`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: 10,
        },
        {
          score: 20,
        },
        {
          score: 30,
        },
      ],
    }),
  });

  try {
    await mmGQLInstance.query({
      users: queryDefinition({
        def: generateUserNode(mmGQLInstance),
        map: ({ id }) => ({
          id,
          // @TODO_NEVER_TYPE_ISSUE
          // @ts-ignore-error
          address: ({ state }) => ({ state }),
        }),
        filter: {
          score: { _gte: 20 },
          address: { state: { _eq: 'test' } },
        },
      }),
    });
  } catch (e) {
    expect(
      (e as Error).stack?.includes(
        `FilterPropertyNotDefinedInQueryException exception - The filter property 'score' is not defined in the 'map' function of the queryDefinition. Add that property to the queryDefinition 'map' function`
      )
    ).toBe(true);
  }
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

  expect(data).toEqual(mockQueryResultExpectations);
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
      expect(results.users[0].address.state).toEqual('Definitely not FL');
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

test('subscribe handles a case where a subscription message comes in before the query result, but the subscription message had the newest version', async done => {
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
      expect(results.users[0].address.state).toEqual('Definitely not FL');
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

test('subscribe handles a case where a subscription message comes in before the query result, but the subscription message did not have the newest version', async done => {
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
    expect(results).toEqual(mockQueryResultExpectations);
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
    getMockConfig({ mockData: mockData, generateMockData: false })
  );
  mmGQLInstance.setToken({
    tokenName: DEFAULT_TOKEN_NAME,
    token: 'mock token',
  });
  const queryDefinitions = createMockQueryDefinitions(mmGQLInstance);

  return { mmGQLInstance, queryDefinitions, createMockQueryDefinitions };
}
