import {
  DEFAULT_TOKEN_NAME,
  EPaginationFilteringSortingInstance,
  MMGQL,
  queryDefinition,
} from '..';
import {
  createMockQueryDefinitions,
  generateUserNode,
  getMockConfig,
  mockTodoData,
  mockUserData,
  createMockDataItems,
  getPrettyPrintedGQL,
  generateTodoNode,
} from '../specUtilities';
import { DocumentNode } from '../types';

test(`query.filter accepts undefined as a value`, async () => {
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

  const { data } = await mmGQLInstance.query({
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ score }) => ({
        score,
      }),
      filter: {
        score: undefined,
      },
    }),
  });

  expect(data.users.nodes.length).toBe(3);
});

test(`query.filter accepts undefined as a value for a relational query's filter`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            todos: createMockDataItems({
              sampleMockData: mockTodoData,
              items: [{}, {}],
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
      map: ({ todos }) => ({
        todos: todos({
          map: ({ task }) => ({ task }),
        }),
      }),
      filter: {
        todos: {
          task: undefined,
        },
      },
    }),
  });

  expect(data.users.nodes[0].todos.nodes.length).toBe(2);
});

test(`query.filter can filter 'number' prop using 'gte' operator`, async () => {
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
            score: 10,
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            optionalProp: null,
          },
          {
            optionalProp: null,
          },
          {
            optionalProp: null,
          },
          {
            optionalProp: 'withvalue',
          },
        ],
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
      users: createMockDataItems({
        sampleMockData: mockUserData,
        items: [
          {
            optionalProp: null,
          },
          {
            optionalProp: null,
          },
          {
            optionalProp: 'withvalue',
          },
        ],
      }),
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
      filter: {
        firstName: { eq: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter can filter 'string' prop using 'contains' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
      filter: {
        firstName: { contains: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter 'string' prop using 'ncontains' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
      filter: {
        firstName: { ncontains: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter can filter 'string' prop using 'neq' operator`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
      filter: {
        firstName: { neq: 'John' },
      },
    }),
  });

  expect(data.users.nodes.length).toBe(1);
});

test(`query.filter supports old filter object format with 'eq' as default operator`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
      filter: {
        firstName: 'Test',
      },
    }),
  });

  expect(data.users.nodes.length).toBe(2);
});

test(`query.filter can filter relational data`, async () => {
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
    mockData: {
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
              state: 'NY',
            },
          },
          {
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

test(`query.filter undefined filters should not be included`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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

test(`query.filter should throw an error if property being filtered is not defined in the queryDefinition map function`, async () => {
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

test(`query.filter can filter query with "AND" condition using the node's oneToMany relational properties`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
          {
            firstName: 'User 3',
            todos: createMockDataItems({
              sampleMockData: mockTodoData,
              items: [
                {
                  task: 'Task 7',
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
      filter: {
        firstName: { eq: 'User 3', condition: 'and' },
        todos: {
          task: { contains: 'Task 9', condition: 'and' },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
        map: ({ firstName, todos }) => ({
          firstName,
          todos: todos({
            map: ({ version }) => ({ version }),
          }),
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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

test(`query.filter can filter using "OR" condition`, async () => {
  const { mmGQLInstance } = setupTest({
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
    },
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
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
    mockData: {
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
    },
    onQueryPerformed: query => {
      expect(getPrettyPrintedGQL(query)).toMatchSnapshot();
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
