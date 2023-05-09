import {
  createMockQueryDefinitions,
  getMockQueryResultExpectations,
  getMockConfig,
  generateTodoNode,
  generateUserNode,
  getPrettyPrintedGQL,
  createMockDataItems,
} from '../specUtilities';

import { MMGQL } from '..';
import {
  QueryDefinitions,
  QueryRecordEntry,
  RelationalQueryRecordEntry,
  SubscriptionMessage,
} from '../types';
import { getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery } from './QueryManager';
import { oneToMany, queryDefinition } from '../dataTypes';
import {
  DEFAULT_TOKEN_NAME,
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
  TOTAL_COUNT_PROPERTY_KEY,
} from '../consts';
import { deepClone } from '../dataUtilities';

test('QueryManager handles a query result and returns the expected data', done => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });
  const resultsObject = {};
  new mmGQLInstance.QueryManager(
    createMockQueryDefinitions(mmGQLInstance) as QueryDefinitions<
      any,
      any,
      any
    >,
    {
      queryId: 'MockQueryId',
      useServerSidePaginationFilteringSorting: true,
      resultsObject,
      onResultsUpdated: () => {
        expect(JSON.stringify(resultsObject)).toEqual(
          JSON.stringify(
            getMockQueryResultExpectations({
              useServerSidePaginationFilteringSorting: true,
            })
          )
        );
        done();
      },
      onQueryError: e => done(e),
      batchKey: null,
    }
  );
});

test('QueryManager will query a minimum set of results when a fitler/sorting/pagination param is updated in a relational query under a paginated list query', done => {
  const mockQueryResult = {
    secondMockFirstResults: {
      [NODES_PROPERTY_KEY]: [],
      [PAGE_INFO_PROPERTY_KEY]: {},
    },
    secondMockSecondResults: {
      [NODES_PROPERTY_KEY]: [],
      [PAGE_INFO_PROPERTY_KEY]: {},
    },
  };

  let queryIdx = 0;
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      mockData: mockQueryResult,
      onQueryPerformed: query => {
        if (queryIdx === 1) {
          expect(getPrettyPrintedGQL(query)).toMatchSnapshot(
            'Should query only secondMockSecondResults, because the other query did not change'
          );
          done();
        }

        queryIdx++;
      },
    })
  );
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });
  const resultsObject = {};

  const mockNode = mmGQLInstance.def({
    type: 'mock',
    properties: {},
  });

  const secondMockNode = mmGQLInstance.def({
    type: 'secondMock',
    properties: {},
    relational: {
      mock: () => oneToMany(mockNode),
    },
  });

  const mockQueryDef = queryDefinition({
    def: secondMockNode,
    map: ({ mock }) => ({
      mock: mock({
        map: ({ id }) => ({ id }),
      }),
    }),
  });

  const queryManager = new mmGQLInstance.QueryManager(
    {
      secondMockFirstResults: mockQueryDef,
      secondMockSecondResults: mockQueryDef,
    },
    {
      queryId: 'MockQueryId',
      useServerSidePaginationFilteringSorting: true,
      resultsObject,
      onResultsUpdated: () => {},
      onQueryError: () => {},
      batchKey: null,
    }
  );

  queryManager.onQueryDefinitionsUpdated({
    secondMockFirstResults: mockQueryDef,
    secondMockSecondResults: {
      ...mockQueryDef,
      filter: {
        id: 'test-id',
      },
    },
  });
});

test('QueryManager correctly updates the results object when a fitler/sorting/pagination param is updated in a relational query under a paginated list query', async done => {
  const mockNodeData = {
    id: 'mock-id',
    version: 1,
    type: 'mock',
  };

  const secondMockNodeData = {
    id: 'second-mock-id',
    version: 1,
    type: 'secondMock',
    mock: createMockDataItems({
      sampleMockData: mockNodeData,
      items: [{}],
    }),
  };

  const mockQueryResult = {
    secondMockFirstResults: createMockDataItems({
      sampleMockData: secondMockNodeData,
      items: [
        {
          mock: createMockDataItems({
            sampleMockData: mockNodeData,
            items: [{}],
          }),
        },
      ],
    }),
    secondMockSecondResults: createMockDataItems({
      sampleMockData: secondMockNodeData,
      items: [
        {
          mock: createMockDataItems({
            sampleMockData: mockNodeData,
            items: [{}],
          }),
        },
      ],
    }),
  };

  let queryIdx = 0;
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      getMockData: () => {
        if (queryIdx === 0) {
          queryIdx++;
          return mockQueryResult;
        } else if (queryIdx === 1) {
          queryIdx++;
          return {
            secondMockFirstResults: createMockDataItems({
              sampleMockData: secondMockNodeData,
              items: [{ id: 'second-mock-id-1' }],
            }),
          };
        } else {
          queryIdx++;
          return {
            secondMockSecondResults: createMockDataItems({
              sampleMockData: secondMockNodeData,
              items: [
                {
                  mock: createMockDataItems({
                    sampleMockData: mockNodeData,
                    items: [{ id: 'test-id' }],
                  }),
                },
              ],
            }),
          };
        }
      },
    })
  );
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });

  const mockNode = mmGQLInstance.def({
    type: mockNodeData.type,
    properties: {},
  });

  const secondMockNode = mmGQLInstance.def({
    type: secondMockNodeData.type,
    properties: {},
    relational: {
      mock: () => oneToMany(mockNode),
    },
  });

  const mockQueryDef = queryDefinition({
    def: secondMockNode,
    map: ({ mock }) => ({
      mock: mock({
        map: ({ id }) => ({ id }),
      }),
    }),
  });

  const resultsObject: Record<string, any> = {};
  let resultsIdx = 0;
  const queryManager = new mmGQLInstance.QueryManager(
    {
      secondMockFirstResults: mockQueryDef,
      secondMockSecondResults: mockQueryDef,
    },
    {
      queryId: 'MockQueryId',
      useServerSidePaginationFilteringSorting: true,
      resultsObject,
      onResultsUpdated: () => {
        if (resultsIdx === 0) {
          resultsIdx++;
          continueTest();
        }
        return;
      },
      onQueryError: e => done(e),
      batchKey: null,
    }
  );

  async function continueTest() {
    await resultsObject.secondMockFirstResults.loadMore();
    expect(resultsObject.secondMockFirstResults.nodes.length).toBe(2);

    await queryManager.onQueryDefinitionsUpdated({
      secondMockFirstResults: mockQueryDef,
      secondMockSecondResults: {
        ...mockQueryDef,
        filter: {
          id: 'test-id',
        },
      },
    });

    // mock for secondResults was updatdd due to the change in filter above
    expect(
      resultsObject.secondMockSecondResults.nodes[0].mock.nodes[0].id
    ).toEqual('test-id');

    // pagination state for secondMockFirstResults remains intact
    expect(resultsObject.secondMockFirstResults.nodes.length).toBe(2);
    done();
  }
});

test('QueryManager correctly updates the results object when a fitler/sorting/pagination param is updated in a relational query under a by id query', async done => {
  const mockNodeData = {
    id: 'mock-id',
    version: 1,
    type: 'mock',
  };

  const secondMockNodeData = {
    id: 'second-mock-id',
    version: 1,
    type: 'secondMock',
    mockFirstResults: createMockDataItems({
      sampleMockData: mockNodeData,
      items: [{}],
    }),
    mockSecondResults: createMockDataItems({
      sampleMockData: mockNodeData,
      items: [{}],
    }),
  };

  const mockQueryResult = {
    secondMockResults: secondMockNodeData,
  };

  let queryIdx = 0;
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      getMockData: () => {
        if (queryIdx === 0) {
          queryIdx++;
          return mockQueryResult;
        } else if (queryIdx === 1) {
          queryIdx++;
          return {
            secondMockResults: {
              ...secondMockNodeData,
              mockFirstResults: undefined,
              // respond to the first query for looading more results for mockSecondResults
              mockSecondResults: createMockDataItems({
                sampleMockData: mockNodeData,
                items: [{ id: 'mock-node-id-1' }],
              }),
            },
          };
        } else {
          queryIdx++;
          return {
            secondMockResults: {
              ...secondMockNodeData,
              mockFirstResults: createMockDataItems({
                sampleMockData: mockNodeData,
                items: [{ id: 'test-id' }],
              }),
              mockSecondResults: undefined,
            },
          };
        }
      },
    })
  );
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });

  const mockNode = mmGQLInstance.def({
    type: mockNodeData.type,
    properties: {},
  });

  const secondMockNode = mmGQLInstance.def({
    type: secondMockNodeData.type,
    properties: {},
    relational: {
      mock: () => oneToMany(mockNode),
    },
  });

  const mockQueryDef = queryDefinition({
    def: secondMockNode,
    map: ({ mock }) => ({
      mockFirstResults: mock({
        map: ({ id }) => ({ id }),
      }),
      mockSecondResults: mock({
        map: ({ id }) => ({ id }),
      }),
    }),
    target: {
      id: secondMockNodeData.id,
    },
  });

  const resultsObject: Record<string, any> = {};
  let resultsIdx = 0;
  const queryManager = new mmGQLInstance.QueryManager(
    {
      secondMockResults: mockQueryDef,
    },
    {
      queryId: 'MockQueryId',
      useServerSidePaginationFilteringSorting: true,
      resultsObject,
      onResultsUpdated: () => {
        if (resultsIdx === 0) {
          resultsIdx++;
          continueTest();
        }
        return;
      },
      onQueryError: e => done(e),
      batchKey: null,
    }
  );

  async function continueTest() {
    await resultsObject.secondMockResults.mockSecondResults.loadMore();
    expect(resultsObject.secondMockResults.mockSecondResults.nodes.length).toBe(
      2
    );

    await queryManager.onQueryDefinitionsUpdated({
      secondMockResults: queryDefinition({
        ...mockQueryDef,
        map: ({ mock }) => ({
          mockFirstResults: mock({
            map: ({ id }) => ({ id }),
            filter: {
              // update the filter
              id: 'test-id',
            },
          }),
          mockSecondResults: mock({
            map: ({ id }) => ({ id }),
          }),
        }),
      }),
    });

    // mock for secondResults was updated due to the change in filter above
    expect(
      resultsObject.secondMockResults.mockFirstResults.nodes[0].id
    ).toEqual('test-id');

    // pagination state for secondMockFirstResults remains intact
    expect(resultsObject.secondMockResults.mockSecondResults.nodes.length).toBe(
      2
    );
    done();
  }
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry if filtering has been updated', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    filter: {
      task: 'get it done',
    },
    tokenName: 'test',
  };

  const mockTodosQueryRecordEntryWithUpdatedFilter: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    filter: {
      task: 'get it done updated',
    },
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because filtering has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry if a nested filter has been updated', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const userNode = generateUserNode(mmGQLInstance);
  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    relational: {
      assignee: {
        def: userNode,
        _relationshipName: 'assignee',
        properties: ['id'],
        relational: {
          todos: {
            def: todoNode,
            _relationshipName: 'todos',
            properties: ['id'],
            filter: {
              tast: 'test',
            },
            oneToMany: true,
          },
        },
        oneToOne: true,
      },
    },
    tokenName: 'test',
  };

  const mockTodosQueryRecordEntryWithUpdatedFilter: QueryRecordEntry = deepClone(
    mockTodosQueryRecordEntry
  );
  if (
    mockTodosQueryRecordEntryWithUpdatedFilter.relational?.assignee.relational
      ?.todos.filter
  ) {
    mockTodosQueryRecordEntryWithUpdatedFilter.relational.assignee.relational.todos.filter = {
      task: 'get it done updated',
    };
  }

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because filtering has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry if a nested filter has been updated, if the root query returns a single entity', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const userNode = generateUserNode(mmGQLInstance);
  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    relational: {
      assignee: {
        def: userNode,
        _relationshipName: 'assignee',
        properties: ['id'],
        relational: {
          todos: {
            def: todoNode,
            _relationshipName: 'todos',
            properties: ['id'],
            filter: {
              tast: 'test',
            },
            oneToMany: true,
          },
        },
        oneToOne: true,
      },
    },
    id: 'test-id',
    tokenName: 'test',
  };

  const mockTodosQueryRecordEntryWithUpdatedFilter: QueryRecordEntry = deepClone(
    mockTodosQueryRecordEntry
  );
  if (
    mockTodosQueryRecordEntryWithUpdatedFilter.relational?.assignee.relational
      ?.todos.filter
  ) {
    mockTodosQueryRecordEntryWithUpdatedFilter.relational.assignee.relational.todos.filter = {
      task: 'get it done updated',
    };
  }

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because filtering has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry if sorting has been updated', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    sort: {
      task: 'asc',
    },
    tokenName: 'test',
  };

  const mockTodosQueryRecordEntryWithUpdatedSort: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    sort: {
      task: 'desc',
    },
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedSort,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedSort,
    todosNotUpdating: undefined, // this query record entry should not be included because sorting has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry if pagination has been updated', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    pagination: {
      itemsPerPage: 10,
    },
    tokenName: 'test',
  };

  const mockTodosQueryRecordEntryWithUpdatedPagination: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    pagination: {
      itemsPerPage: 50,
    },
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedPagination,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedPagination,
    todosNotUpdating: undefined, // this query record entry should not be included because pagination has not been updated
  });
});

// See comment above getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery for a why
test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry as a whole if it returns an array and any of the relational queries have updated their filtering', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const userNode = generateUserNode(mmGQLInstance, todoNode);

  const mockAssigneeRelationalQuery: RelationalQueryRecordEntry = {
    _relationshipName: 'assignee',
    def: userNode,
    properties: ['id'],
    filter: {
      name: 'test',
    },
    oneToMany: true,
  };

  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    tokenName: 'test',
    relational: {
      assignee: mockAssigneeRelationalQuery,
      assigneeNotUpdating: mockAssigneeRelationalQuery,
    },
  };

  const mockTodosQueryRecordEntryWithUpdatedAssigneeFilter: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    relational: {
      assignee: {
        ...mockAssigneeRelationalQuery,
        filter: {
          name: 'test updated',
        },
      },
      assigneeNotUpdating: mockAssigneeRelationalQuery,
    },
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because filtering has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry as a whole if it returns an array and any of the relational queries have updated their sorting', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const userNode = generateUserNode(mmGQLInstance, todoNode);

  const mockAssigneeRelationalQuery: RelationalQueryRecordEntry = {
    _relationshipName: 'assignee',
    def: userNode,
    properties: ['id'],
    sort: {
      name: 'asc',
    },
    oneToMany: true,
  };

  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    tokenName: 'test',
    relational: {
      assignee: mockAssigneeRelationalQuery,
      assigneeNotUpdating: mockAssigneeRelationalQuery,
    },
  };

  const mockTodosQueryRecordEntryWithUpdatedAssigneeFilter: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    relational: {
      assignee: {
        ...mockAssigneeRelationalQuery,
        sort: {
          name: 'desc',
        },
      },
      assigneeNotUpdating: mockAssigneeRelationalQuery,
    },
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because sorting has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry as a whole if it returns an array and any of the relational queries have updated their pagination', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const userNode = generateUserNode(mmGQLInstance, todoNode);

  const mockAssigneeRelationalQuery: RelationalQueryRecordEntry = {
    _relationshipName: 'assignee',
    def: userNode,
    properties: ['id'],
    pagination: {
      itemsPerPage: 10,
    },
    oneToMany: true,
  };

  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    tokenName: 'test',
    relational: {
      assignee: mockAssigneeRelationalQuery,
      assigneeNotUpdating: mockAssigneeRelationalQuery,
    },
  };

  const mockTodosQueryRecordEntryWithUpdatedAssigneeFilter: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    relational: {
      assignee: {
        ...mockAssigneeRelationalQuery,
        pagination: {
          itemsPerPage: 20,
        },
      },
      assigneeNotUpdating: mockAssigneeRelationalQuery,
    },
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because pagination has not been updated
  });
});

test('getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery includes the query record entry if targeting has been updated', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const todoNode = generateTodoNode(mmGQLInstance);
  const mockTodosQueryRecordEntry: QueryRecordEntry = {
    def: todoNode,
    properties: ['id'],
    sort: {
      task: 'asc',
    },
    id: 'mock-id',
    tokenName: 'test',
  };

  const mockTodosQueryRecordEntryWithUpdatedTarget: QueryRecordEntry = {
    ...mockTodosQueryRecordEntry,
    id: 'mock-id-2',
  };

  expect(
    getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedTarget,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    }).minimalQueryRecord
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedTarget,
    todosNotUpdating: undefined, // this query record entry should not be included because sorting has not been updated
  });
});

type SubscriptionMessageType =
  | 'Created'
  | 'Deleted'
  | 'Updated'
  | 'Inserted'
  | 'Removed'
  | 'UpdatedAssociation';

function getMockSubscriptionMessage(opts: {
  alias: string;
  type: SubscriptionMessageType;
  targetNodeType?: string;
  id: string;
  target?: {
    id: string | number;
    property: string;
  };
  valueNodeType?: string;
  value?: { id: string | number } & Record<string, any>;
}) {
  let typeNameString = `${opts.type}_`;

  if (opts.type === 'UpdatedAssociation') {
    if (!opts.targetNodeType) throw Error('targetNodeType must be provided');
    if (!opts.valueNodeType) throw Error('valueNodeType must be provided');
    typeNameString += `${opts.targetNodeType}_${opts.valueNodeType}`;
  } else {
    if (!opts.valueNodeType) throw Error('valueNodeType must be provided');
    typeNameString += opts.valueNodeType;
  }

  return {
    data: {
      [opts.alias]: {
        __typename: typeNameString,
        id: opts.id,
        target: opts.target,
        value: opts.value,
      },
    },
  } as SubscriptionMessage;
}

/**
 * A few notes regarding these tests:
 * - Several tests will contain queries that seem redundant, such as "users" and "usersCopy".
 *   The subscription system must combine relational accessors. What this means in practice, is that
 *   in a query that requests meeting.attendees and meeting.attendeesCopy (for pagination, filtering, or sorting purposes)
 *   the subscription system must combine the two relational accessors into a single subscription
 *   that will update both meeting.attendees and meeting.attendeesCopy. These tests verify that this is the case.
 */
describe.skip('subscription handling', () => {
  /**
   * Start tests root level single node
   */
  it('handles an "UPDATE" subscription message related to a single node that was queried by its id', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
          },
        }),
      })
    );
    const todoNode = generateTodoNode(mmGQLInstance);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done }) => ({
        task,
        done,
      }),
      target: {
        id: 'mock-todo-id-1',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'Updated',
      valueNodeType: todoNode.type,
      id: 'mock-todo-id-1',
      value: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1-updated',
        done: true,
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1-updated',
        done: true,
      },
    });
  });

  /**
   * Start tests root level collection
   */
  it('handles an "UPDATED" subscription message related to a node that was queried within a root collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
              },
              {
                id: 'mock-todo-id-2',
                task: 'mock-task-2',
                done: false,
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 2,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const todoNode = generateTodoNode(mmGQLInstance);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done }) => ({
        task,
        done,
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Updated',
      valueNodeType: todoNode.type,
      id: 'mock-todo-id-1',
      value: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1-updated',
        done: true,
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1-updated',
            done: true,
          },
          {
            id: 'mock-todo-id-2',
            task: 'mock-task-2',
            done: false,
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 2,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('handles a "CREATED" subscription message related to a node within a root collection', done => {
    const mockUsers = [
      {
        id: 'mock-user-id-1',
        firstName: 'mock-first-name-1',
        lastName: 'mock-last-name-1',
      },
      {
        id: 'mock-user-id-2',
        firstName: 'mock-first-name-2',
        lastName: 'mock-last-name-2',
      },
    ];

    const mockUsersCollection = {
      [NODES_PROPERTY_KEY]: mockUsers,
      [TOTAL_COUNT_PROPERTY_KEY]: 2,
      [PAGE_INFO_PROPERTY_KEY]: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'mock-user-id-1',
        endCursor: 'mock-user-id-1',
        totalPages: 1,
      },
    };

    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                assignee: mockUsers[0],
                assigneeCopy: mockUsers[0],
                users: mockUsersCollection,
                usersCopy: mockUsersCollection,
              },
              {
                id: 'mock-todo-id-2',
                task: 'mock-task-2',
                done: false,
                assignee: mockUsers[0],
                assigneeCopy: mockUsers[0],
                users: mockUsersCollection,
                usersCopy: mockUsersCollection,
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 2,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const todoNode = generateTodoNode(mmGQLInstance);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, assignee, users }) => ({
        task,
        done,
        assignee: assignee({
          map: ({ firstName }) => ({ firstName }),
        }),
        assigneeCopy: assignee({
          map: ({ lastName }) => ({ lastName }),
        }),
        users: users({
          map: ({ firstName }) => ({ firstName }),
        }),
        usersCopy: users({
          map: ({ lastName }) => ({ lastName }),
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Created',
      valueNodeType: todoNode.type,
      id: 'mock-todo-id-3',
      value: {
        id: 'mock-todo-id-3',
        task: 'mock-task-3',
        done: false,
        assignee: mockUsers[0],
        users: mockUsersCollection,
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1-updated',
            done: true,
            assignee: mockUsers[0],
            assigneeCopy: mockUsers[0],
            users: mockUsersCollection,
            usersCopy: mockUsersCollection,
          },
          {
            id: 'mock-todo-id-2',
            task: 'mock-task-2',
            done: false,
            assignee: mockUsers[0],
            assigneeCopy: mockUsers[0],
            users: mockUsersCollection,
            usersCopy: mockUsersCollection,
          },
          {
            id: 'mock-todo-id-3',
            task: 'mock-task-3',
            done: false,
            assignee: mockUsers[0],
            assigneeCopy: mockUsers[0],
            users: mockUsersCollection,
            usersCopy: mockUsersCollection,
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 3,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('handles a "DELETED" subscription message related to a node within a root collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
              },
              {
                id: 'mock-todo-id-2',
                task: 'mock-task-2',
                done: false,
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 2,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const todoNode = generateTodoNode(mmGQLInstance);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done }) => ({
        task,
        done,
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Deleted',
      valueNodeType: todoNode.type,
      id: 'mock-todo-id-2',
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1-updated',
            done: true,
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('correctly filters data from subscription messages related to a root level collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const todoNode = generateTodoNode(mmGQLInstance);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done }) => ({
        task,
        done,
      }),
      filter: {
        done: false,
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Created',
      id: 'mock-todo-id-2',
      valueNodeType: todoNode.type,
      value: {
        id: 'mock-todo-id-2',
        task: 'mock-task-2',
        // This should be filtered out
        done: true,
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('correctly sorts data from subscription messages related to a root level collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const todoNode = generateTodoNode(mmGQLInstance);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done }) => ({
        task,
        done,
      }),
      sort: {
        task: 'asc',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Created',
      id: 'mock-todo-id-0',
      valueNodeType: todoNode.type,
      value: {
        id: 'mock-todo-id-0',
        task: 'mock-task-0',
        done: true,
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-0',
            task: 'mock-task-0',
            done: true,
          },
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 2,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  /**
   * Start tests for collection nested within a single node query
   */
  it('handles an "UPDATED" subscription message related to a node that was queried within a relational collection, nested within a single node query', done => {
    const mockUsersCollection = {
      [NODES_PROPERTY_KEY]: [
        {
          id: 'mock-user-id-1',
          firstName: 'mock-user-name-1',
          lastName: 'mock-user-last-name-1',
        },
      ],
      [TOTAL_COUNT_PROPERTY_KEY]: 1,
      [PAGE_INFO_PROPERTY_KEY]: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'mock-user-id-1',
        endCursor: 'mock-user-id-1',
        totalPages: 1,
      },
    };

    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: mockUsersCollection,
            usersCopy: mockUsersCollection,
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
        usersCopy: users({
          map: ({ lastName }) => ({
            lastName,
          }),
        }),
      }),
      target: {
        id: 'mock-todo-id-1',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'Updated',
      valueNodeType: userNode.type,
      id: 'mock-user-id-1',
      value: {
        id: 'mock-user-id-1',
        firstName: 'mock-user-name-1-updated',
        lastName: 'mock-user-last-name-1-updated',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    const expectedUpdatedUsersCollection = {
      [NODES_PROPERTY_KEY]: [
        {
          id: 'mock-user-id-1',
          firstName: 'mock-user-name-1-updated',
          lastName: 'mock-user-last-name-1-updated',
        },
      ],
      [TOTAL_COUNT_PROPERTY_KEY]: 1,
      [PAGE_INFO_PROPERTY_KEY]: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'mock-user-id-1',
        endCursor: 'mock-user-id-1',
        totalPages: 1,
      },
    };

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1',
        done: false,
        users: expectedUpdatedUsersCollection,
        usersCopy: expectedUpdatedUsersCollection,
      },
    });
  });

  it('handles an "INSERTED" subscription message related to a node that was queried within a relational collection, nested within a single node query', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 1,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
      target: {
        id: 'mock-todo-id-1',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'Inserted',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
        firstName: 'mock-user-name-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1',
        done: false,
        users: {
          [NODES_PROPERTY_KEY]: [
            {
              id: 'mock-user-id-1',
              firstName: 'mock-user-name-1',
            },
            {
              id: 'mock-user-id-2',
              firstName: 'mock-user-name-2',
            },
          ],
          [TOTAL_COUNT_PROPERTY_KEY]: 2,
          [PAGE_INFO_PROPERTY_KEY]: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'mock-user-id-1',
            endCursor: 'mock-user-id-2',
            totalPages: 1,
          },
        },
      },
    });
  });

  it('correctly filters data from subscription messages related to a collection, nested within a single node query', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 1,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
          filter: {
            firstName: 'mock-user-name-1',
          },
        }),
      }),
      target: {
        id: 'mock-todo-id-1',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'Inserted',
      id: 'mock-todo-id-2',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
        // This user should not be included in the results
        firstName: 'mock-user-name-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1',
        done: false,
        users: {
          [NODES_PROPERTY_KEY]: [
            {
              id: 'mock-user-id-1',
              firstName: 'mock-user-name-1',
            },
          ],
          [TOTAL_COUNT_PROPERTY_KEY]: 1,
          [PAGE_INFO_PROPERTY_KEY]: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'mock-user-id-1',
            endCursor: 'mock-user-id-1',
            totalPages: 1,
          },
        },
      },
    });
  });

  it('correctly sorts data from subscription messages related to a collection, nested within a single node query', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 1,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
          sort: {
            firstName: 'asc',
          },
        }),
      }),
      target: {
        id: 'mock-todo-id-1',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'Inserted',
      id: 'mock-todo-id-2',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-0',
        firstName: 'mock-user-name-0',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1',
        done: false,
        users: {
          [NODES_PROPERTY_KEY]: [
            {
              id: 'mock-user-id-0',
              firstName: 'mock-user-name-0',
            },
            {
              id: 'mock-user-id-1',
              firstName: 'mock-user-name-1',
            },
          ],
          [TOTAL_COUNT_PROPERTY_KEY]: 2,
          [PAGE_INFO_PROPERTY_KEY]: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'mock-user-id-1',
            endCursor: 'mock-user-id-1',
            totalPages: 1,
          },
        },
      },
    });
  });

  /**
   * Start tests for collection nested within collection
   */
  it('handles a "REMOVED" subscription message related to a node that was queried within a relational collection, nested within a single node query', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
                {
                  id: 'mock-user-id-2',
                  firstName: 'mock-user-name-2',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 2,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
      target: {
        id: 'mock-todo-id-1',
      },
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'Removed',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1',
        done: false,
        users: {
          [NODES_PROPERTY_KEY]: [
            {
              id: 'mock-user-id-1',
              firstName: 'mock-user-name-1',
            },
          ],
          [TOTAL_COUNT_PROPERTY_KEY]: 1,
          [PAGE_INFO_PROPERTY_KEY]: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'mock-user-id-1',
            endCursor: 'mock-user-id-1',
            totalPages: 1,
          },
        },
      },
    });
  });

  it('handles an "UPDATED" subscription message related to a node that was queried within a relational collection, nested within a collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                users: {
                  [NODES_PROPERTY_KEY]: [
                    {
                      id: 'mock-user-id-1',
                      firstName: 'mock-user-name-1',
                    },
                  ],
                  [TOTAL_COUNT_PROPERTY_KEY]: 1,
                  [PAGE_INFO_PROPERTY_KEY]: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'mock-user-id-1',
                    endCursor: 'mock-user-id-1',
                    totalPages: 1,
                  },
                },
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Updated',
      valueNodeType: userNode.type,
      id: 'mock-user-id-1',
      value: {
        id: 'mock-user-id-1',
        firstName: 'mock-user-name-1-updated',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1-updated',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 1,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('handles an "INSERTED" subscription message related to a node that was queried within a relational collection, nested within a collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                users: {
                  [NODES_PROPERTY_KEY]: [
                    {
                      id: 'mock-user-id-1',
                      firstName: 'mock-user-name-1',
                    },
                  ],
                  [TOTAL_COUNT_PROPERTY_KEY]: 1,
                  [PAGE_INFO_PROPERTY_KEY]: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'mock-user-id-1',
                    endCursor: 'mock-user-id-1',
                    totalPages: 1,
                  },
                },
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Inserted',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
        firstName: 'mock-user-name-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1-updated',
                },
                {
                  id: 'mock-user-id-2',
                  firstName: 'mock-user-name-2',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 2,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('handles a "REMOVED" subscription message related to a node that was queried within a relational collection, nested within a collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                users: {
                  [NODES_PROPERTY_KEY]: [
                    {
                      id: 'mock-user-id-1',
                      firstName: 'mock-user-name-1',
                    },
                    {
                      id: 'mock-user-id-2',
                      firstName: 'mock-user-name-2',
                    },
                  ],
                  [TOTAL_COUNT_PROPERTY_KEY]: 2,
                  [PAGE_INFO_PROPERTY_KEY]: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'mock-user-id-1',
                    endCursor: 'mock-user-id-1',
                    totalPages: 1,
                  },
                },
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Removed',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1-updated',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 1,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('correctly filters data from subscription messages related to a collection nested within a collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                users: {
                  [NODES_PROPERTY_KEY]: [
                    {
                      id: 'mock-user-id-1',
                      firstName: 'mock-user-name-1',
                    },
                  ],
                  [TOTAL_COUNT_PROPERTY_KEY]: 1,
                  [PAGE_INFO_PROPERTY_KEY]: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'mock-user-id-1',
                    endCursor: 'mock-user-id-1',
                    totalPages: 1,
                  },
                },
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
          filter: {
            firstName: 'mock-user-name-1',
          },
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Inserted',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
        // first name that does not conform to filter
        firstName: 'mock-user-name-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 1,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  it('correctly sorts data from subscription messages related to a collection nested within a collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                users: {
                  [NODES_PROPERTY_KEY]: [
                    {
                      id: 'mock-user-id-1',
                      firstName: 'mock-user-name-1',
                    },
                  ],
                  [TOTAL_COUNT_PROPERTY_KEY]: 1,
                  [PAGE_INFO_PROPERTY_KEY]: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: 'mock-user-id-1',
                    endCursor: 'mock-user-id-1',
                    totalPages: 1,
                  },
                },
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, users }) => ({
        task,
        done,
        users: users({
          map: ({ firstName }) => ({
            firstName,
          }),
          sort: {
            firstName: 'asc',
          },
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'Inserted',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'users',
      },
      id: 'mock-user-id-0',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-0',
        // first name that does not conform to filter
        firstName: 'mock-user-name-0',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            users: {
              [NODES_PROPERTY_KEY]: [
                {
                  id: 'mock-user-id-0',
                  firstName: 'mock-user-name-0',
                },
                {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
              ],
              [TOTAL_COUNT_PROPERTY_KEY]: 2,
              [PAGE_INFO_PROPERTY_KEY]: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'mock-user-id-1',
                endCursor: 'mock-user-id-1',
                totalPages: 1,
              },
            },
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });

  /**
   * Start tests for oneToOne relationship, nested within a single node query
   */
  it('handles an "UPDATED_ASSOCIATION" subscription message related to a oneToOne relationship nested within a single node query', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todo: {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            assignee: {
              id: 'mock-user-id-1',
              firstName: 'mock-user-name-1',
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todoQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, assignee }) => ({
        task,
        done,
        assignee: assignee({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todo: todoQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todo',
      type: 'UpdatedAssociation',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'assignee',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
        firstName: 'mock-user-name-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todo: {
        id: 'mock-todo-id-1',
        task: 'mock-task-1',
        done: false,
        assignee: {
          id: 'mock-user-id-2',
          firstName: 'mock-user-name-2',
        },
      },
    });
  });

  /**
   * Start tests for oneToOne relationship, nested within a collection
   */
  it('handles an "UPDATED_ASSOCIATION" subscription message related to a oneToOne relationship nested within a collection', done => {
    const mmGQLInstance = new MMGQL(
      getMockConfig({
        getMockData: () => ({
          todos: {
            [NODES_PROPERTY_KEY]: [
              {
                id: 'mock-todo-id-1',
                task: 'mock-task-1',
                done: false,
                assignee: {
                  id: 'mock-user-id-1',
                  firstName: 'mock-user-name-1',
                },
              },
            ],
            [TOTAL_COUNT_PROPERTY_KEY]: 1,
            [PAGE_INFO_PROPERTY_KEY]: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'mock-todo-id-1',
              endCursor: 'mock-todo-id-1',
              totalPages: 1,
            },
          },
        }),
      })
    );
    const userNode = generateUserNode(mmGQLInstance);
    const todoNode = generateTodoNode(mmGQLInstance, userNode);
    const todosQueryDefinition = queryDefinition({
      def: todoNode,
      map: ({ task, done, assignee }) => ({
        task,
        done,
        assignee: assignee({
          map: ({ firstName }) => ({
            firstName,
          }),
        }),
      }),
    });

    const resultsObject = {};
    const queryManager = new mmGQLInstance.QueryManager(
      {
        todos: todosQueryDefinition,
      },
      {
        queryId: 'Test_Query',
        useServerSidePaginationFilteringSorting: false,
        resultsObject,
        onResultsUpdated: () => {},
        onQueryError: e => {
          done(e);
        },
        batchKey: null,
      }
    );

    const mockSubscriptionMessage = getMockSubscriptionMessage({
      alias: 'todos',
      type: 'UpdatedAssociation',
      targetNodeType: todoNode.type,
      target: {
        id: 'mock-todo-id-1',
        property: 'assignee',
      },
      id: 'mock-user-id-2',
      valueNodeType: userNode.type,
      value: {
        id: 'mock-user-id-2',
        firstName: 'mock-user-name-2',
      },
    });

    queryManager.onSubscriptionMessage(mockSubscriptionMessage);

    expect(resultsObject).toEqual({
      todos: {
        [NODES_PROPERTY_KEY]: [
          {
            id: 'mock-todo-id-1',
            task: 'mock-task-1',
            done: false,
            assignee: {
              id: 'mock-user-id-2',
              firstName: 'mock-user-name-2',
            },
          },
        ],
        [TOTAL_COUNT_PROPERTY_KEY]: 1,
        [PAGE_INFO_PROPERTY_KEY]: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-todo-id-1',
          endCursor: 'mock-todo-id-1',
          totalPages: 1,
        },
      },
    });
  });
});
