import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  mockQueryResultExpectations,
  getMockSubscriptionMessage,
  getMockConfig,
  generateUserNode,
  mockUserData,
  mockTodoData,
  convertNodesCollectionValuesToArray,
  generateTodoNode,
} from './specUtilities';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { MMGQL, queryDefinition } from '.';
import { DEFAULT_TOKEN_NAME } from './consts';
import { NULL_TAG } from './dataConversions';
import { EPaginationFilteringSortingInstance } from './types';

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

  expect(data).toEqual(
    convertNodesCollectionValuesToArray(mockQueryResultExpectations)
  );
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

test(`query.filter can filter 'number' prop using 'gte' operator`, async () => {
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
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: { gte: 20 },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'number' prop using 'lte' operator`, async () => {
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
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: { lte: 20 },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'number' prop using 'eq' operator`, async () => {
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
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: { eq: 10 },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'number' prop using 'neq' operator`, async () => {
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
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: { neq: 10 },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'number' prop using 'gt' operator`, async () => {
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
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: { gt: 10 },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'number' prop using 'lt' operator`, async () => {
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
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: { lt: 20 },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter can filter 'boolean' prop using 'eq' operator`, async () => {
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
      map: ({ score, archived }) => ({
        score,
        archived,
      }),
      filter: {
        archived: { eq: true },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'null' values with 'eq' operator`, async () => {
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
          map: ({ score, optionalProp }) => ({
            score,
            optionalProp,
          }),
          filter: {
            optionalProp: { eq: null },
          },
        }),
      })
    ).data.users.nodes.length
  ).toBe(2);
});

test(`query.filter can filter 'null' values with 'neq' operator`, async () => {
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
          map: ({ score, optionalProp }) => ({
            score,
            optionalProp,
          }),
          filter: {
            optionalProp: { neq: null },
          },
        }),
      })
    ).data.users.nodes.length
  ).toBe(1);
});

test(`query.filter can filter 'boolean' prop using 'neq' operator`, async () => {
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
      map: ({ archived }) => ({
        archived,
      }),
      filter: {
        archived: { neq: false },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'string' prop using 'eq' operator`, async () => {
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
      map: ({ firstName }) => ({
        firstName,
      }),
      filter: {
        firstName: { eq: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter can filter 'string' prop using 'contains' operator`, async () => {
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
      map: ({ firstName }) => ({
        firstName,
      }),
      filter: {
        firstName: { contains: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'string' prop using 'ncontains' operator`, async () => {
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
      map: ({ firstName }) => ({
        firstName,
      }),
      filter: {
        firstName: { ncontains: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter can filter 'string' prop using 'neq' operator`, async () => {
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
      map: ({ firstName }) => ({
        firstName,
      }),
      filter: {
        firstName: { neq: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter supports old filter object format with 'eq' as default operator`, async () => {
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
      map: ({ firstName }) => ({
        firstName,
      }),
      filter: {
        firstName: 'Test',
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter relational data`, async () => {
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
      map: ({ score, todos }) => ({
        score,
        todos: todos({
          map: ({ task }) => ({ task }),
          filter: {
            task: { contains: 'my todo' },
          },
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].todos.nodes.length).toBe(2);
  expect(data.users.nodes[1].todos.nodes.length).toBe(1);
});

test(`query.filter can filter multilevel relational data`, async () => {
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
      map: ({ score, todos }) => ({
        score,
        todos: todos({
          map: ({ users }) => ({
            users: users({
              map: ({ firstName }) => ({ firstName }),
              filter: {
                firstName: { contains: 'john' },
              },
            }),
          }),
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].todos.nodes[0].users.nodes.length).toBe(1);
});

test(`query.filter can filter nested object property`, async () => {
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
          map: ({ address }) => ({
            address: address({
              map: ({ state }) => ({ state }),
            }),
          }),
          filter: {
            address: {
              state: { eq: 'FL' },
            },
          },
        }),
      })
    ).data.users.nodes.length
  ).toBe(2);
});

test(`query.filter should throw an error if property being filtered is not defined in the queryDefinition map function`, async () => {
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

  const result = await mmGQLInstance
    .query({
      users: queryDefinition({
        def: generateUserNode(mmGQLInstance),
        map: ({ address }) => ({
          address: address({
            map: ({ state }) => ({ state }),
          }),
        }),
        filter: {
          score: { gte: 20 },
          address: { state: { eq: 'test' } },
        },
      }),
    })
    .catch(e => (e as Error).stack || '');

  expect(result).toContain(
    `FilterPropertyNotDefinedInQueryException exception - The filter property 'score' is not defined in the 'map' function of the queryDefinition. Add that property to the queryDefinition 'map' function`
  );
});

test(`query.pagination can paginate query with array results`, async () => {
  const { mmGQLInstance } = setupTest({
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

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
        page: 2,
      },
    }),
  });

  expect(data.users.nodes[0].firstName).toBe('3');
  expect(data.users.nodes[1].firstName).toBe('4');
  expect(data.users.nodes.length).toBe(2);
});

test(`query.pagination 'hasNextPage' is set to 'false' if there are next pages to paginate`, async () => {
  const { mmGQLInstance } = setupTest({
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
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
        page: 1,
      },
    }),
  });

  expect(data.users.hasNextPage).toBe(true);
});

test(`query.pagination 'hasNextPage' is set to 'false' if there are no next pages to paginate.`, async () => {
  const { mmGQLInstance } = setupTest({
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
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
        page: 2,
      },
    }),
  });

  expect(data.users.hasNextPage).toBe(false);
});

test(`query.pagination not defining pagination parameters should return all items`, async () => {
  const { mmGQLInstance } = setupTest({
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
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
    }),
  });

  expect(data.users.nodes.length).toBe(5);
  expect(data.users.hasNextPage).toBe(false);
});

test(`query.pagination calling load more results should load more results and update the data returned by the query`, async () => {
  const { mmGQLInstance } = setupTest({
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
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
        page: 1,
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
  expect(data.users.nodes[0].firstName).toBe('1');
  expect(data.users.nodes[1].firstName).toBe('2');
  await data.users.loadMoreResults();
  expect(data.users.nodes.length).toBe(4);
  expect(data.users.nodes[2].firstName).toBe('3');
  expect(data.users.nodes[3].firstName).toBe('4');
});

test(`query.pagination can paginate relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: '1',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: '1',
              },
              {
                task: '2',
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
      map: ({ firstName, todos }) => ({
        firstName,
        todos: todos({
          map: ({ task }) => ({ task }),
          pagination: {
            itemsPerPage: 1,
            page: 1,
          },
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].todos.nodes.length).toBe(1);
  expect(data.users.nodes[0].todos.nodes[0].task).toBe('1');
  await data.users.nodes[0].todos.loadMoreResults();
  expect(data.users.nodes[0].todos.nodes.length).toBe(2);
  expect(data.users.nodes[0].todos.nodes[1].task).toBe('2');
});

test(`query.pagination loadMoreResults should throw an error if there is no next page`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: '1',
        },
        {
          firstName: '2',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      pagination: {
        itemsPerPage: 2,
        page: 1,
      },
      map: ({ firstName }) => ({
        firstName,
      }),
    }),
  });

  try {
    await data.users.loadMoreResults();
  } catch (e) {
    expect(e).toBeInstanceOf(NodesCollectionPageOutOfBoundsException);
  }
});

test(`query.sorting can sort 'string' properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'a',
        },
        {
          firstName: 'c',
        },
        {
          firstName: 'b',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        firstName: 'asc',
      },
      map: ({ firstName, lastName, address }) => ({
        firstName,
        lastName,
        address: address({
          map: ({ state }) => ({ state }),
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].firstName).toBe('a');
  expect(data.users.nodes[1].firstName).toBe('b');
  expect(data.users.nodes[2].firstName).toBe('c');
});

test(`query.sorting can sort 'string' properties descending`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'a',
        },
        {
          firstName: 'c',
        },
        {
          firstName: 'b',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        firstName: 'desc',
      },
      map: ({ firstName, lastName, address }) => ({
        firstName,
        lastName,
        address: address({
          map: ({ state }) => ({ state }),
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].firstName).toBe('c');
  expect(data.users.nodes[1].firstName).toBe('b');
  expect(data.users.nodes[2].firstName).toBe('a');
});

test(`query.sorting can sort 'number' properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: '22',
        },
        {
          score: '11',
        },
        {
          score: '2',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        score: 'asc',
      },
      map: ({ score }) => ({
        score,
      }),
    }),
  });

  expect(data.users.nodes[0].score).toBe(2);
  expect(data.users.nodes[1].score).toBe(11);
  expect(data.users.nodes[2].score).toBe(22);
});

test(`query.sorting can sort 'number' properties descending`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          score: '22',
        },
        {
          score: '11',
        },
        {
          score: '2',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        score: 'desc',
      },
      map: ({ score }) => ({
        score,
      }),
    }),
  });

  expect(data.users.nodes[0].score).toBe(22);
  expect(data.users.nodes[1].score).toBe(11);
  expect(data.users.nodes[2].score).toBe(2);
});

test(`query.sorting can sort 'boolean' properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          archived: 'true',
        },
        {
          archived: 'false',
        },
        {
          archived: 'true',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        archived: 'asc',
      },
      map: ({ archived }) => ({
        archived,
      }),
    }),
  });

  expect(data.users.nodes[0].archived).toBe(false);
  expect(data.users.nodes[1].archived).toBe(true);
  expect(data.users.nodes[2].archived).toBe(true);
});

test(`query.sorting can sort 'boolean' properties descending`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          archived: 'true',
        },
        {
          archived: 'false',
        },
        {
          archived: 'true',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        archived: 'desc',
      },
      map: ({ archived }) => ({
        archived,
      }),
    }),
  });

  expect(data.users.nodes[0].archived).toBe(true);
  expect(data.users.nodes[1].archived).toBe(true);
  expect(data.users.nodes[2].archived).toBe(false);
});

test(`query.sorting can sort 'object' properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          address__dot__state: 'FL',
        },
        {
          address__dot__state: 'CA',
        },
        {
          address__dot__state: 'IL',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        address: {
          state: 'asc',
        },
      },
      map: ({ address }) => ({
        address,
      }),
    }),
  });

  expect(data.users.nodes[0].address.state).toBe('CA');
  expect(data.users.nodes[1].address.state).toBe('FL');
  expect(data.users.nodes[2].address.state).toBe('IL');
});

test(`query.sorting can sort 'object' properties decsending`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          address__dot__state: 'FL',
        },
        {
          address__dot__state: 'CA',
        },
        {
          address__dot__state: 'IL',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        address: {
          state: 'desc',
        },
      },
      map: ({ address }) => ({
        address,
      }),
    }),
  });

  expect(data.users.nodes[0].address.state).toBe('IL');
  expect(data.users.nodes[1].address.state).toBe('FL');
  expect(data.users.nodes[2].address.state).toBe('CA');
});

test(`query.sorting can sort multiple properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'B',
          address__dot__state: 'FL',
        },
        {
          firstName: 'C',
          address__dot__state: 'IL',
        },
        {
          firstName: 'B',
          address__dot__state: 'CA',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        firstName: 'asc',
        address: {
          state: 'desc',
        },
      },
      map: ({ firstName, address }) => ({
        firstName,
        address,
      }),
    }),
  });

  expect(data.users.nodes[0].firstName).toBe('B');
  expect(data.users.nodes[0].address.state).toBe('FL');
  expect(data.users.nodes[1].firstName).toBe('B');
  expect(data.users.nodes[1].address.state).toBe('CA');
  expect(data.users.nodes[2].firstName).toBe('C');
  expect(data.users.nodes[2].address.state).toBe('IL');
});

test(`query.sorting can prioritize sorting`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'A',
          lastName: 'Y',
          address__dot__state: 'FL',
        },
        {
          firstName: 'S',
          lastName: 'S',
          address__dot__state: 'IL',
        },
        {
          firstName: 'B',
          lastName: 'Y',
          address__dot__state: 'FL',
        },
        {
          firstName: 'Z',
          lastName: 'Z',
          address__dot__state: 'FL',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        firstName: { direction: 'asc', priority: 3 },
        address: {
          state: { direction: 'asc', priority: 1 },
        },
        lastName: { direction: 'desc', priority: 2 },
      },
      map: ({ firstName, lastName, address }) => ({
        firstName,
        lastName,
        address,
      }),
    }),
  });

  expect(data.users.nodes[0].address.state).toBe('FL');
  expect(data.users.nodes[0].lastName).toBe('Z');
  expect(data.users.nodes[0].firstName).toBe('Z');
  expect(data.users.nodes[1].address.state).toBe('FL');
  expect(data.users.nodes[1].lastName).toBe('Y');
  expect(data.users.nodes[1].firstName).toBe('A');
  expect(data.users.nodes[2].address.state).toBe('FL');
  expect(data.users.nodes[2].lastName).toBe('Y');
  expect(data.users.nodes[2].firstName).toBe('B');
  expect(data.users.nodes[3].address.state).toBe('IL');
  expect(data.users.nodes[3].lastName).toBe('S');
  expect(data.users.nodes[3].firstName).toBe('S');
});

test(`query.sorting should throw an error if property being sorted is not defined in the queryDefinition map function`, async () => {
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
        map: ({ score }) => ({
          score,
          address: ({ state }) => ({ state }),
        }),
        sort: {
          score: 'asc',
        },
      }),
    });
  } catch (e) {
    expect(
      (e as Error).stack?.includes(
        `SortPropertyNotDefinedInQueryException exception - The sort property 'score' is not defined in the 'map' function of the queryDefinition. Add that property to the queryDefinition 'map' function.`
      )
    ).toBe(true);
  }
});

test(`query.sorting can sort relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Todo 3',
              },
              {
                task: 'Todo 4',
              },
              {
                task: 'Todo 1',
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
      map: ({ score, todos }) => ({
        score,
        todos: todos({
          map: ({ task }) => ({ task }),
          sort: {
            task: 'asc',
          },
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].todos.nodes[0].task).toBe('Todo 1');
  expect(data.users.nodes[0].todos.nodes[1].task).toBe('Todo 3');
  expect(data.users.nodes[0].todos.nodes[2].task).toBe('Todo 4');
});

test(`query.sorting should always sort null values last in ascending order`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: '1',
          optionalProp: 'Optional 5',
        },
        {
          firstName: '5',
          optionalProp: null,
        },
        {
          firstName: '3',
          optionalProp: 'Optional 1',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        optionalProp: 'asc',
      },
      map: ({ optionalProp, firstName }) => ({
        optionalProp,
        firstName,
      }),
    }),
  });

  expect(data.users.nodes.map(x => x.firstName)).toEqual(['3', '1', '5']);
});

test(`query.sorting should always sort null values last in descending order`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: '1',
          optionalProp: 'Optional 5',
        },
        {
          firstName: '5',
          optionalProp: NULL_TAG,
        },
        {
          firstName: '3',
          optionalProp: 'Optional 1',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      sort: {
        optionalProp: 'desc',
      },
      map: ({ optionalProp, firstName }) => ({
        optionalProp,
        firstName,
      }),
    }),
  });

  expect(data.users.nodes.map(x => x.firstName)).toEqual(['1', '3', '5']);
});

test(`query.sorting can sort 'oneToOne' relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    todos: createMockDataItems({
      sampleMockData: mockTodoData,
      items: [
        {
          task: 'Todo 1',
          assignee: {
            ...mockUserData,
            id: '1',
            firstName: 'Assignee 3',
          },
        },
        {
          task: 'Todo 5',
          assignee: {
            ...mockUserData,
            id: '3',
            firstName: 'Assignee 1',
          },
        },
        {
          task: 'Todo 3',
          assignee: {
            ...mockUserData,
            id: '2',
            firstName: 'Assignee 2',
          },
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    todos: queryDefinition({
      def: generateTodoNode(mmGQLInstance),
      sort: {
        assignee: {
          firstName: 'desc',
        },
      },
      map: ({ task, assignee }) => ({
        task,
        assignee: assignee({
          map: ({ firstName }) => ({ firstName }),
        }),
      }),
    }),
  });

  expect(data.todos.nodes.map(x => x.task)).toEqual([
    'Todo 1',
    'Todo 3',
    'Todo 5',
  ]);
});

test(`query.sorting can sort 'oneToMany' relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    todos: createMockDataItems({
      sampleMockData: mockTodoData,
      items: [
        {
          task: 'Todo 1',
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                firstName: 'A',
              },
              {
                firstName: 'Z',
              },
              {
                firstName: 'D',
              },
            ],
          }),
        },
        {
          task: 'Todo 5',
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                firstName: 'Assignee 1',
              },
            ],
          }),
        },
        {
          task: 'Todo 3',
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                firstName: 'Assignee 5',
              },
            ],
          }),
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    todos: queryDefinition({
      def: generateTodoNode(mmGQLInstance),
      sort: {
        users: {
          firstName: 'desc',
        },
      },
      map: ({ task, users }) => ({
        task,
        users: users({
          map: ({ firstName }) => ({ firstName }),
        }),
      }),
    }),
  });

  expect(data.todos.nodes.map(x => x.task)).toEqual([
    'Todo 1',
    'Todo 3',
    'Todo 5',
  ]);
});

test(`query.filter can filter using "OR" condition`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John',
          score: '10',
        },
        {
          firstName: 'Mary',
          score: '20',
        },
        {
          firstName: 'Mary 2',
          score: '21',
        },
        {
          firstName: 'Joe',
          score: '1',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      filter: {
        firstName: {
          contains: 'j',
          condition: 'or',
        },
        score: {
          eq: 20,
          condition: 'or',
        },
      },
      map: ({ score, firstName }) => ({
        firstName,
        score,
      }),
    }),
  });

  expect(data.users.nodes.map(x => x.firstName)).toEqual(
    expect.arrayContaining(['Joe', 'John', 'Mary'])
  );
});

test(`query.filter can filter relational data using "OR" condition`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Joj',
                numberProp: '10',
              },
              {
                task: 'Todo 4',
                numberProp: '20',
              },
              {
                task: 'Jacob',
                numberProp: '11',
              },
              {
                task: 'Mark',
                numberProp: '220',
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
      map: ({ todos }) => ({
        todos: todos({
          filter: {
            task: {
              contains: 'j',
              condition: 'or',
            },
            numberProp: {
              eq: 20,
              condition: 'or',
            },
          },
          map: ({ task, numberProp }) => ({ task, numberProp }),
        }),
      }),
    }),
  });

  expect(data.users.nodes[0].todos.nodes.map(x => x.task)).toEqual(
    expect.arrayContaining(['Joj', 'Todo 4', 'Jacob'])
  );
});

test(`query.filter can filter relational data of a single node query`, async () => {
  const { mmGQLInstance } = setupTest({
    user: {
      ...mockUserData,
      todos: createMockDataItems({
        sampleMockData: mockTodoData,
        items: [
          {
            task: 'Test 1',
            numberProp: '10',
          },
          {
            task: 'Test 2',
            numberProp: '20',
          },
          {
            task: 'Test 3',
            numberProp: '11',
          },
          {
            task: 'Test 4',
            numberProp: '220',
          },
        ],
      }),
    },
  });

  const { data } = await mmGQLInstance.query({
    user: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      target: {
        id: 'mock-user-id',
      },
      map: ({ archived, todos }) => ({
        archived,
        todos: todos({
          filter: {
            numberProp: {
              eq: 20,
            },
          },
          map: ({ task, numberProp }) => ({ task, numberProp }),
        }),
      }),
    }),
  });

  expect(data.user.todos.nodes.map(x => x.task)).toEqual(['Test 2']);
});

test(`query.filter can filter multiple relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    user: {
      ...mockUserData,
      todos: createMockDataItems({
        sampleMockData: mockTodoData,
        items: [
          {
            task: 'Test 1',
            numberProp: '10',
          },
          {
            task: 'Test 2',
            numberProp: '20',
          },
          {
            task: 'Test 3',
            numberProp: '11',
          },
          {
            task: 'Test 4',
            numberProp: '220',
          },
        ],
      }),
      otherTodos: createMockDataItems({
        sampleMockData: mockTodoData,
        items: [
          {
            task: 'Test 1',
            numberProp: '10',
          },
          {
            task: 'Test 2',
            numberProp: '20',
          },
          {
            task: 'Test 3',
            numberProp: '11',
          },
          {
            task: 'Test 4',
            numberProp: '220',
          },
        ],
      }),
    },
  });

  const { data } = await mmGQLInstance.query({
    user: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      target: {
        id: 'mock-user-id',
      },
      map: ({ archived, todos }) => ({
        archived,
        todos: todos({
          filter: {
            numberProp: {
              eq: 20,
            },
          },
          map: ({ task, numberProp }) => ({ task, numberProp }),
        }),
        otherTodos: todos({
          filter: {
            numberProp: {
              gt: 19,
            },
          },
          map: ({ task, numberProp }) => ({ task, numberProp }),
        }),
      }),
    }),
  });

  expect(data.user.todos.nodes.length).toEqual(1);
  expect(data.user.todos.nodes.map(x => x.task)).toEqual(['Test 2']);
  expect(data.user.otherTodos.nodes.map(x => x.task)).toEqual([
    'Test 2',
    'Test 4',
  ]);
  expect(data.user.otherTodos.nodes.length).toEqual(2);
});

test(`query.filter undefined filters should not be included`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'John',
          score: '10',
        },
        {
          firstName: 'Mary',
          score: '20',
        },
        {
          firstName: 'Mary 2',
          score: '21',
        },
        {
          firstName: 'Joe',
          score: '1',
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      filter: {
        firstName: undefined,
        score: { eq: 1 },
      },
      map: ({ score, firstName }) => ({
        score,
        firstName,
      }),
    }),
  });

  expect(data.users.nodes.map(x => x.firstName)).toEqual(['Joe']);
  expect(data.users.nodes.length).toEqual(1);
});

test(`query.filter can filter query with "AND" condition using the node's oneToMany relational properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'User 1',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 1',
              },
              {
                task: 'Task 2',
              },
              {
                task: 'Task 3',
              },
            ],
          }),
        },
        {
          firstName: 'User 2',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 4',
              },
              {
                task: 'Task 5',
              },
              {
                task: 'Task 6',
              },
            ],
          }),
        },
        {
          firstName: 'User 3',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 7',
              },
              {
                task: 'Task 2',
              },
              {
                task: 'Task 9',
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
      filter: {
        firstName: { eq: 'User 3', condition: 'and' },
        todos: {
          task: { contains: 'Task 2', condition: 'and' },
        },
      },
      map: ({ firstName, todos }) => ({
        firstName,
        todos: todos({
          map: ({ task }) => ({ task }),
        }),
      }),
    }),
  });

  expect(data.users.nodes.map(x => x.firstName)).toEqual(['User 3']);
});

test(`query.filter can filter query with "OR" condition using the node's oneToMany relational properties`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'User 1',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 1',
              },
              {
                task: 'Task 2',
              },
              {
                task: 'Task 3',
              },
            ],
          }),
        },
        {
          firstName: 'User 2',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 4',
              },
              {
                task: 'Task 5',
              },
              {
                task: 'Task 6',
              },
            ],
          }),
        },
        {
          firstName: 'User 3',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 7',
              },
              {
                task: 'Task 2',
              },
              {
                task: 'Task 9',
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
      filter: {
        firstName: { eq: 'User 3', condition: 'or' },
        todos: {
          task: { contains: 'Task 6', condition: 'or' },
        },
      },
      map: ({ firstName, todos }) => ({
        firstName,
        todos: todos({
          map: ({ task }) => ({ task }),
        }),
      }),
    }),
  });

  expect(data.users.nodes.map(x => x.firstName)).toEqual(['User 2', 'User 3']);
});

test(`query.filter should throw an error if relational prop is not defined in the map function when filtering by relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          firstName: 'User 1',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 1',
              },
              {
                task: 'Task 2',
              },
              {
                task: 'Task 3',
              },
            ],
          }),
        },
        {
          firstName: 'User 2',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 4',
              },
              {
                task: 'Task 5',
              },
              {
                task: 'Task 6',
              },
            ],
          }),
        },
        {
          firstName: 'User 3',
          todos: createMockDataItems({
            sampleMockData: mockTodoData,
            items: [
              {
                task: 'Task 7',
              },
              {
                task: 'Task 2',
              },
              {
                task: 'Task 9',
              },
            ],
          }),
        },
      ],
    }),
  });

  const result = await mmGQLInstance
    .query({
      users: queryDefinition({
        def: generateUserNode(mmGQLInstance),
        filter: {
          todos: {
            task: { contains: 'Task 6' },
          },
        },
        map: ({ firstName }) => ({
          firstName,
        }),
      }),
    })
    .catch(e => (e as Error).stack || '');

  expect(result).toContain(
    `FilterPropertyNotDefinedInQueryException exception - The filter property 'todos.task' is not defined in the 'map' function of the queryDefinition. Add that property to the queryDefinition 'map' function`
  );
});

test(`query.filter can filter query with "OR" condition using the node's oneToOne relational properties`, async () => {
  const { mmGQLInstance } = setupTest({
    todos: createMockDataItems({
      sampleMockData: mockTodoData,
      items: [
        {
          task: 'Task 2',
          assignee: {
            ...mockUserData,
            id: 'mock-assignee-1',
            firstName: 'First Name 1',
            archived: 'false',
          },
        },
        {
          task: 'Task 9',
          assignee: {
            ...mockUserData,
            id: 'mock-assignee-2',
            firstName: 'First Name 2',
            archived: 'false',
          },
        },
        {
          task: 'Task 1',
          assignee: {
            ...mockUserData,
            id: 'mock-assignee-3',
            firstName: 'First Name 3',
            archived: 'true',
          },
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    todos: queryDefinition({
      def: generateTodoNode(mmGQLInstance),
      filter: {
        assignee: {
          firstName: { eq: 'First Name 2', condition: 'or' },
          archived: { eq: true, condition: 'or' },
        },
      },
      map: ({ task, assignee }) => ({
        task,
        assignee: assignee({
          map: ({ firstName, archived }) => ({ firstName, archived }),
        }),
      }),
    }),
  });

  expect(data.todos.nodes.map(x => x.task)).toEqual(['Task 9', 'Task 1']);
});

test(`query.filter can filter query with "AND" condition using the node's oneToOne relational properties`, async () => {
  const { mmGQLInstance } = setupTest({
    todos: createMockDataItems({
      sampleMockData: mockTodoData,
      items: [
        {
          task: 'Task 2',
          assignee: {
            ...mockUserData,
            id: 'mock-assignee-1',
            firstName: 'First Name 1',
            archived: 'false',
          },
        },
        {
          task: 'Task 9',
          assignee: {
            ...mockUserData,
            id: 'mock-assignee-2',
            firstName: 'First Name 2',
            archived: 'false',
          },
        },
        {
          task: 'Task 1',
          assignee: {
            ...mockUserData,
            id: 'mock-assignee-3',
            firstName: 'First Name 3',
            archived: 'true',
          },
        },
      ],
    }),
  });

  const { data } = await mmGQLInstance.query({
    todos: queryDefinition({
      def: generateTodoNode(mmGQLInstance),
      filter: {
        assignee: {
          firstName: { eq: 'First Name 2', condition: 'and' },
          archived: { eq: false, condition: 'and' },
        },
      },
      map: ({ task, assignee }) => ({
        task,
        assignee: assignee({
          map: ({ firstName, archived }) => ({ firstName, archived }),
        }),
      }),
    }),
  });

  expect(data.todos.nodes.map(x => x.task)).toEqual(['Task 9']);
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
