import {
  DEFAULT_TOKEN_NAME,
  EPaginationFilteringSortingInstance,
  MMGQL,
  queryDefinition,
} from '..';
import { NULL_TAG } from '../dataConversions';
import {
  createMockQueryDefinitions,
  generateUserNode,
  getMockConfig,
  mockTodoData,
  mockUserData,
  createMockDataItems,
} from '../specUtilities';

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
          optionalProp: null,
        },
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
  ).toBe(3);
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

function setupTest(mockData?: any) {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      mockData: mockData,
      generateMockData: false,
      paginationFilteringSortingInstance:
        EPaginationFilteringSortingInstance.CLIENT,
    })
  );
  mmGQLInstance.setToken({
    tokenName: DEFAULT_TOKEN_NAME,
    token: 'mock token',
  });
  const queryDefinitions = createMockQueryDefinitions(mmGQLInstance);

  return { mmGQLInstance, queryDefinitions, createMockQueryDefinitions };
}
