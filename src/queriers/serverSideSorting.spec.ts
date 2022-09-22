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
} from '../specUtilities';

test(`query gql matches the expectation when specifying a sorting param`, async () => {
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
      sort: {
        firstName: 'asc',
      },
    }),
  });
});

test(`query gql matches the expectation when specifying a sort param for a relational property`, async () => {
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
        }),
      }),
      sort: {
        todos: {
          task: 'asc',
        },
      },
    }),
  });
});

test(`query gql matches the expectation when specifying a sort params with priority`, async () => {
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
      map: ({ firstName, lastName }) => ({
        firstName,
        lastName,
      }),
      sort: {
        firstName: {
          priority: 1,
          direction: 'asc',
        },
        lastName: {
          priority: 2,
          direction: 'desc',
        },
      },
    }),
  });
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
