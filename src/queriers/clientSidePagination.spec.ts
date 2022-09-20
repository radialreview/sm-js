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
  createMockDataItems,
  getPrettyPrintedGQL,
  mockUserData,
  generateUserNode,
  mockTodoData,
} from '../specUtilities';

test(`query.pagination can paginate query with array results`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  expect(data.users.nodes[0].firstName).toBe('1');
  expect(data.users.nodes[1].firstName).toBe('2');
  expect(data.users.nodes.length).toBe(2);
});

test(`query.pagination 'hasNextPage' is set to 'true' if there are next pages to paginate`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
        pageInfo: {
          hasNextPage: true,
        },
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  expect(data.users.hasNextPage).toBe(true);
});

test(`query.pagination 'hasNextPage' is set to 'false' if there are no next pages to paginate.`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
        pageInfo: {
          hasNextPage: false,
        },
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ firstName }) => ({
        firstName,
      }),
      pagination: {
        itemsPerPage: 3,
      },
    }),
  });

  expect(data.users.hasNextPage).toBe(false);
});

test(`query.pagination 'hasPreviousPage' is set to 'true' if there are previous pages to paginate`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
        pageInfo: {
          hasNextPage: true,
        },
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  await data.users.goToNextPage();
  expect(data.users.hasPreviousPage).toBe(true);
});

test(`query.pagination 'hasPreviousPage' is set to 'false' if there are no previous pages to paginate.`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  expect(data.users.hasPreviousPage).toBe(false);
});

test(`query.pagination 'totalPages' should have the correct value.`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
        pageInfo: {
          totalPages: 3,
        },
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  expect(data.users.totalPages).toBe(3);
});

test(`query.pagination not defining pagination parameters should return all items`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
        pageInfo: {
          totalPages: 1,
          hasNextPage: false,
        },
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
  expect(data.users.totalPages).toBe(1);
  expect(data.users.hasNextPage).toBe(false);
  expect(data.users.hasPreviousPage).toBe(false);
});

test(`query.pagination calling goToNextPage should go to next page and update the current page`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  expect(data.users.nodes.length).toBe(2);
  expect(data.users.nodes[0].firstName).toBe('1');
  expect(data.users.nodes[1].firstName).toBe('2');
  expect(data.users.page).toBe(1);
  await data.users.loadMore();
  expect(data.users.nodes.length).toBe(2);
  expect(data.users.nodes[0].firstName).toBe('3');
  expect(data.users.nodes[1].firstName).toBe('4');
  expect(data.users.page).toBe(2);
});

test(`query.pagination calling goToPreviousPage should go to previous page and update the current page`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
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

  await data.users.goToNextPage();
  expect(data.users.nodes.length).toBe(2);
  expect(data.users.nodes[0].firstName).toBe('3');
  expect(data.users.nodes[1].firstName).toBe('4');
  expect(data.users.page).toBe(2);

  await data.users.goToPreviousPage();

  expect(data.users.nodes.length).toBe(2);
  expect(data.users.nodes[0].firstName).toBe('1');
  expect(data.users.nodes[1].firstName).toBe('2');
  expect(data.users.page).toBe(1);
});

test(`query.pagination can paginate relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
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
    }),
  });

  expect(data.users.nodes[0].todos.nodes.length).toBe(1);
  expect(data.users.nodes[0].todos.nodes[0].task).toBe('1');
  data.users.nodes[0].todos.goToNextPage();
  expect(data.users.nodes[0].todos.nodes.length).toBe(1);
  expect(data.users.nodes[0].todos.nodes[0].task).toBe('2');
});

function setupTest(opts: {
  mockData?: any;
  onQueryPerformed: (query: DocumentNode) => void;
}) {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      mockData: opts.mockData,
      onQueryPerformed: opts.onQueryPerformed,
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
