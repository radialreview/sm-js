import {
  DEFAULT_TOKEN_NAME,
  DocumentNode,
  EPaginationFilteringSortingInstance,
  MMGQL,
  queryDefinition,
} from '..';
import {
  getMockConfig,
  createMockQueryDefinitions,
  getPrettyPrintedGQL,
  generateUserNode,
  createMockDataItems,
  mockUserData,
  mockTodoData,
} from '../specUtilities';

test(`query gql matches the expectation when specifying an items per page param`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
      },
    }),
  });
});

test(`query gql matches the expectation when querying relational data and specifying an items per page param`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName, todos }) => ({
        firstName,
        todos: todos({
          map: ({ task }) => ({ task }),
          pagination: {
            itemsPerPage: 1,
          },
        }),
      }),
    }),
  });
});

test(`query gql matches the expectation when specifying a start cursor param`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        startCursor: 'xyz',
        itemsPerPage: 2,
      },
    }),
  });
});

test(`query gql matches the expectation when specifying an end cursor param`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        endCursor: 'xyz',
        itemsPerPage: 2,
      },
    }),
  });
});

test(`calling loadMore results causes the expected query to be executed`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
        pageInfo: {
          endCursor: 'mock-end-cursor',
        },
      }),
    },
    onQueryPerformed: query => {
      queriesPerformed++;
      if (queriesPerformed === 2) {
        expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
      }
    },
  });

  const {
    data: { users },
  } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
      },
    }),
  });

  await users.loadMore();
});

test(`calling loadMore results appends the new results to the previous results`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    getMockData: () => {
      if (queriesPerformed === 0) {
        return {
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                id: 'User-1-id',
                firstName: 'User 1',
              },
            ],
          }),
        };
      } else if (queriesPerformed === 1) {
        return {
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                id: 'User-2-id',
                firstName: 'User 2',
              },
            ],
          }),
        };
      }
      throw Error('Unexpected query');
    },
    onQueryPerformed: () => {
      queriesPerformed++;
    },
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 1,
      },
    }),
  });

  await data.users.loadMore();

  expect(data.users.nodes.length).toBe(2);
  expect(data.users.nodes[0].firstName).toBe('User 1');
  expect(data.users.nodes[1].firstName).toBe('User 2');
});

test.only(`calling loadMore on a piece of relational results causes the expected query to be executed`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            firstName: 'John',
            todos: createMockDataItems({
              sampleMockData: mockTodoData,
              items: [],
              pageInfo: {
                endCursor: 'mock-end-cursor',
              },
            }),
          },
        ],
      }),
    },
    onQueryPerformed: query => {
      queriesPerformed++;
      if (queriesPerformed === 2) {
        expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
      }
    },
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
          },
        }),
      }),
      pagination: {
        itemsPerPage: 1,
      },
    }),
  });

  await data.users.nodes[0].todos.loadMore();
});

test(`calling goToNextPage causes the expected query to be executed`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
        pageInfo: {
          endCursor: 'mock-end-cursor',
        },
      }),
    },
    onQueryPerformed: query => {
      queriesPerformed++;
      if (queriesPerformed === 2) {
        expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
      }
    },
  });

  const {
    data: { users },
  } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
      },
    }),
  });

  await users.goToNextPage();
});

test(`calling goToNextPage replaces the results in that node collection`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    getMockData: () => {
      if (queriesPerformed === 0) {
        return {
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                id: 'User-1-id',
                firstName: 'User 1',
              },
            ],
          }),
        };
      } else if (queriesPerformed === 1) {
        return {
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                id: 'User-2-id',
                firstName: 'User 2',
              },
            ],
          }),
        };
      }
      throw Error('Unexpected query');
    },
    onQueryPerformed: () => {
      queriesPerformed++;
    },
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 1,
      },
    }),
  });

  await data.users.goToNextPage();

  expect(data.users.nodes.length).toBe(1);
  expect(data.users.nodes[0].firstName).toBe('User 2');
});

test(`calling goToPreviousPage causes the expected query to be executed`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [],
        pageInfo: {
          startCursor: 'mock-start-cursor',
          hasPreviousPage: true,
        },
      }),
    },
    onQueryPerformed: query => {
      queriesPerformed++;
      if (queriesPerformed === 2) {
        expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
      }
    },
  });

  const {
    data: { users },
  } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 2,
      },
    }),
  });

  await users.goToNextPage();
  await users.goToPreviousPage();
});

test(`calling goToPreviousPage replaces the results in that node collection`, async () => {
  let queriesPerformed = 0;
  const { mmGQLInstance } = setupTest({
    getMockData: () => {
      if (queriesPerformed === 0) {
        return {
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                id: 'User-1-id',
                firstName: 'User 1',
              },
            ],
            pageInfo: {
              hasPreviousPage: true,
            },
          }),
        };
      } else if (queriesPerformed === 1) {
        return {
          users: createMockDataItems({
            sampleMockData: mockUserData,
            items: [
              {
                id: 'User-2-id',
                firstName: 'User 2',
              },
            ],
          }),
        };
      }
      throw Error('Unexpected query');
    },
    onQueryPerformed: () => {
      queriesPerformed++;
    },
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 1,
      },
    }),
  });

  await data.users.goToPreviousPage();

  expect(data.users.nodes.length).toBe(1);
  expect(data.users.nodes[0].firstName).toBe('User 2');
});

function setupTest(opts: {
  mockData?: any;
  getMockData?: () => any;
  onQueryPerformed: (query: DocumentNode) => void;
}) {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      mockData: opts.mockData,
      getMockData: opts.getMockData,
      onQueryPerformed: opts.onQueryPerformed,
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
