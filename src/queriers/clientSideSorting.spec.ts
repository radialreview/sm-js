import { MMGQL } from '..';
import { DEFAULT_TOKEN_NAME } from '../consts';
import { queryDefinition } from '../dataTypes';
import {
  createMockDataItems,
  mockUserData,
  generateUserNode,
  mockTodoData,
  generateTodoNode,
  getMockConfig,
  createMockQueryDefinitions,
  getPrettyPrintedGQL,
  createNonPaginatedMockDataItems,
} from '../specUtilities';
import { EPaginationFilteringSortingInstance, DocumentNode } from '../types';

test(`query.sorting can sort 'string' properties`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            address: {
              state: 'FL',
            },
          },
          {
            address: {
              state: 'CA',
            },
          },
          {
            address: {
              state: 'IL',
            },
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
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            address: {
              state: 'FL',
            },
          },
          {
            address: {
              state: 'CA',
            },
          },
          {
            address: {
              state: 'IL',
            },
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
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            firstName: 'B',
            address: {
              state: 'FL',
            },
          },
          {
            firstName: 'C',
            address: {
              state: 'IL',
            },
          },
          {
            firstName: 'B',
            address: {
              state: 'CA',
            },
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
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            firstName: 'A',
            lastName: 'Y',
            address: {
              state: 'FL',
            },
          },
          {
            firstName: 'S',
            lastName: 'S',
            address: {
              state: 'IL',
            },
          },
          {
            firstName: 'B',
            lastName: 'Y',
            address: {
              state: 'FL',
            },
          },
          {
            firstName: 'Z',
            lastName: 'Z',
            address: {
              state: 'FL',
            },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  try {
    await mmGQLInstance.query({
      users: queryDefinition({
        def: generateUserNode(mmGQLInstance),
        map: ({ score, address }) => ({
          score,
          address: address({
            map: ({ state }) => ({
              state,
            }),
          }),
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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

test(`query.sorting can sort 'nonPaginatedOneToMany' relational data`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
      todos: createMockDataItems({
        sampleMockData: mockTodoData,
        items: [
          {
            task: 'Todo 1',
            users: createNonPaginatedMockDataItems({
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
            users: createNonPaginatedMockDataItems({
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
            users: createNonPaginatedMockDataItems({
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
  });

  const { data } = await mmGQLInstance.query({
    todos: queryDefinition({
      def: generateTodoNode(mmGQLInstance),
      sort: {
        users: {
          firstName: 'desc',
        },
      },
      map: ({ task, nonPaginatedUsers }) => ({
        task,
        users: nonPaginatedUsers({
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
