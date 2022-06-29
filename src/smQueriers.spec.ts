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
import { queryDefinition, SMJS } from '.';
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

test('sm.query uses the gql client, passing in the expected params', async done => {
  const { smJSInstance, queryDefinitions } = setupTest();
  const token = 'mock token';
  smJSInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token });
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
      expect(e.stack.includes(`Error: Something went wrong`)).toBe(true);
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
    expect((e as any).stack.includes(`Error: Something went wrong`)).toBe(true);
    done();
  }
});

test('sm.query throws an error when the user specifies a token which has not been registered', async done => {
  const { smJSInstance, createMockQueryDefinitions } = setupTest();

  try {
    await smJSInstance.query(
      createMockQueryDefinitions(smJSInstance, {
        tokenName: 'invalidTokenName',
      })
    );
  } catch (e) {
    expect(
      (e as any).stack.includes(
        `Error: No token registered with the name "invalidTokenName".\nPlease register this token prior to using it with sm.setToken({ tokenName, token }))`
      )
    ).toBe(true);

    done();
  }
});

test('sm.query can query data using multiple tokens, by making parallel requests', () => {
  const { smJSInstance, createMockQueryDefinitions } = setupTest();

  smJSInstance.setToken({ tokenName: 'mainToken', token: '123' });
  smJSInstance.setToken({ tokenName: 'altToken', token: '321' });

  const mainTokenQD = createMockQueryDefinitions(smJSInstance, {
    tokenName: 'mainToken',
  }).users;
  const altTokenQD = createMockQueryDefinitions(smJSInstance, {
    tokenName: 'altToken',
  }).users;

  smJSInstance.gqlClient.query = jest.fn(async () => ({
    mainTokenQD: mockQueryDataReturn.users,
    altTokenQD: mockQueryDataReturn.users,
  }));

  smJSInstance.query({
    mainTokenQD,
    altTokenQD,
  });

  expect(smJSInstance.gqlClient.query).toHaveBeenCalledTimes(2);
  expect(smJSInstance.gqlClient.query).toHaveBeenCalledWith(
    expect.objectContaining({
      token: '123',
    })
  );
  expect(smJSInstance.gqlClient.query).toHaveBeenCalledWith(
    expect.objectContaining({
      token: '321',
    })
  );
});

function createMockDataItems<T>(opts: {
  sampleMockData: T & { id: string };
  items: Array<Partial<T>>;
}) {
  return opts.items.map((mockItem, index) => ({
    ...opts.sampleMockData,
    ...mockItem,
    id: opts.sampleMockData.id + index,
  }));
}

test(`sm.query.filter can filter 'number' prop using '_gte' operator`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        archived: { _eq: true },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'null' values with '_eq' operator`, async () => {
  const { smJSInstance } = setupTest({
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
      await smJSInstance.query({
        users: queryDefinition({
          def: generateUserNode(smJSInstance),
          map: ({ id, score }) => ({
            id,
            score,
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
  const { smJSInstance } = setupTest({
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
      await smJSInstance.query({
        users: queryDefinition({
          def: generateUserNode(smJSInstance),
          map: ({ id, score }) => ({
            id,
            score,
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
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        archived: { _eq: false },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'string' prop using '_eq' operator`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        firstName: { _eq: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'string' prop using '_contains' operator`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        firstName: { _contains: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter 'string' prop using '_ncontains' operator`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        firstName: { _ncontains: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter can filter 'string' prop using '_neq' operator`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        firstName: { _neq: 'John' },
      },
    }),
  });

  expect(data.users.length).toBe(1);
});

test(`sm.query.filter supports old filter object format with '_eq' as default operator`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, score }) => ({
        id,
        score,
      }),
      filter: {
        firstName: 'Test',
      },
    }),
  });

  expect(data.users.length).toBe(2);
});

test(`sm.query.filter can filter relational data`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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

  expect(data.users[0].todos.length).toBe(2);
  expect(data.users[1].todos.length).toBe(1);
});

test(`sm.query.filter can filter multilevel relational data`, async () => {
  const { smJSInstance } = setupTest({
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

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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

  expect(data.users[0].todos[0].users.length).toBe(1);
});

test(`sm.query.filter can filter nested object property`, async () => {
  const { smJSInstance } = setupTest({
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
      await smJSInstance.query({
        users: queryDefinition({
          def: generateUserNode(smJSInstance),
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

test.only(`sm.query.pagination can paginate query with array results`, async () => {
  // const arr = new ArrayWithPagination({
  //   items: [
  //     { firstName: 'Allan' },
  //     { firstName: 'Christian' },
  //     { firstName: 'Carlos' },
  //     { firstName: 'Garcia' },
  //     { firstName: 'Intal' },
  //   ],
  //   itemsPerPage: 1,
  //   page: 1,
  // });
  // console.log(arr.map(x => x.firstName)[0]);
  // expect(arr.toArray()).toEqual([{ firstName: 'Allan' }]);

  // console.log(arr.map(x => x.id));
  const { smJSInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: '1',
        },
        {
          firstName: '2',
        },
        {
          firstName: '3',
        },
        {
          firstName: '4',
        },
        {
          firstName: '5',
        },
        {
          firstName: '6',
        },
      ],
    }),
  });

  const { data } = await smJSInstance.query({
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
        page: 1,
      },
    }),
  });

  console.log(data.users.hasNextPage);
  // console.log(data.users.map(x => x.id));
  //   expect(data.users.length).toBe(2);
  // expect(data.users[1].firstName).toBe('2');

  // data.users.pagination.next();

  // expect(data.users.length).toBe(2);
  // expect(data.users[0].firstName).toBe('3');
  // expect(data.users[1].firstName).toBe('4');

  // data.users.pagination.next();

  // expect(data.users.length).toBe(2);
  // expect(data.users[0].firstName).toBe('5');
  // expect(data.users[1].firstName).toBe('6');
});

// test(`sm.query.pagination 'hasNextPage' is set to 'false' if there are next pages to paginate`, async () => {
//   const { smJSInstance } = setupTest({
//     users: createMockDataItems({
//       sampleMockData: mockUserData,
//       items: [
//         {
//           firstName: '1',
//         },
//         {
//           firstName: '2',
//         },
//         {
//           firstName: '3',
//         },
//       ],
//     }),
//   });

//   const { data } = await smJSInstance.query({
//     users: queryDefinition({
//       def: generateUserNode(smJSInstance),
//       map: ({ id, firstName }) => ({
//         id,
//         firstName,
//       }),
//       pagination: {
//         itemsPerPage: 2,
//         page: 1,
//       },
//     }),
//   });

//   expect(data.users.pagination.hasNextPage).toBe(true);
// });

// test(`sm.query.pagination 'hasNextPage' is set to 'false' if there are no next pages to paginate.`, async () => {
//   const { smJSInstance } = setupTest({
//     users: createMockDataItems({
//       sampleMockData: mockUserData,
//       items: [
//         {
//           firstName: '1',
//         },
//         {
//           firstName: '2',
//         },
//         {
//           firstName: '3',
//         },
//       ],
//     }),
//   });

//   const { data } = await smJSInstance.query({
//     users: queryDefinition({
//       def: generateUserNode(smJSInstance),
//       map: ({ id, firstName }) => ({
//         id,
//         firstName,
//       }),
//       pagination: {
//         itemsPerPage: 2,
//         page: 1,
//       },
//     }),
//   });

//   expect(data.users.pagination.hasNextPage).toBe(false);
// });

// test(`sm.query.pagination 'hasPreviousPage' is set to 'false' if there are previous pages to paginate`, async () => {
//   const { smJSInstance } = setupTest({
//     users: createMockDataItems({
//       sampleMockData: mockUserData,
//       items: [
//         {
//           firstName: '1',
//         },
//         {
//           firstName: '2',
//         },
//         {
//           firstName: '3',
//         },
//       ],
//     }),
//   });

//   const { data } = await smJSInstance.query({
//     users: queryDefinition({
//       def: generateUserNode(smJSInstance),
//       map: ({ id, firstName }) => ({
//         id,
//         firstName,
//       }),
//       pagination: {
//         itemsPerPage: 2,
//         page: 1,
//       },
//     }),
//   });

//   expect(data.users.pagination.hasPreviousPage).toBe(true);
// });

// test(`sm.query.pagination 'hasPreviousPage' is set to 'false' if there are no previous pages to paginate.`, async () => {
//   const { smJSInstance } = setupTest({
//     users: createMockDataItems({
//       sampleMockData: mockUserData,
//       items: [
//         {
//           firstName: '1',
//         },
//         {
//           firstName: '2',
//         },
//         {
//           firstName: '3',
//         },
//       ],
//     }),
//   });

//   const { data } = await smJSInstance.query({
//     users: queryDefinition({
//       def: generateUserNode(smJSInstance),
//       map: ({ id, firstName }) => ({
//         id,
//         firstName,
//       }),
//       pagination: {
//         itemsPerPage: 2,
//         page: 1,
//       },
//     }),
//   });

//   expect(data.users.pagination.hasPreviousPage).toBe(false);
// });

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
    expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
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
      expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
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
      expect((e as any).stack.includes(`Error: Something went wrong`)).toBe(
        true
      );
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
      expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
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
    expect((e as any).stack.includes(`Error: Some error`)).toBe(true);
    done();
  }
});

test('sm.subscribe throws an error when the user specifies a token which has not been registered', async done => {
  const { smJSInstance, createMockQueryDefinitions } = setupTest();

  try {
    await smJSInstance.subscribe(
      createMockQueryDefinitions(smJSInstance, {
        tokenName: 'invalidTokenName',
      }),
      {
        onData: () => {},
      }
    );
  } catch (e) {
    expect(
      (e as any).stack.includes(
        `Error: No token registered with the name "invalidTokenName".\nPlease register this token prior to using it with sm.setToken({ tokenName, token }))`
      )
    ).toBe(true);
    done();
  }
});

function setupTest(mockData?: any) {
  const smJSInstance = new SMJS(getMockConfig(mockData));
  smJSInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'mock token' });
  const queryDefinitions = createMockQueryDefinitions(smJSInstance);

  return { smJSInstance, queryDefinitions, createMockQueryDefinitions };
}
