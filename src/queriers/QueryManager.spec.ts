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
} from '../types';
import { getMinimalQueryRecordForNextQuery } from './QueryManager';
import { oneToMany, queryDefinition } from '../dataTypes';
import {
  DEFAULT_TOKEN_NAME,
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
} from '../consts';

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
      getMockDataDelay: null,
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
        map: ({}) => ({}),
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
      getMockDataDelay: null,
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
        map: ({}) => ({}),
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
      getMockDataDelay: null,
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
        map: ({}) => ({}),
      }),
      mockSecondResults: mock({
        map: ({}) => ({}),
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
      getMockDataDelay: null,
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
            map: ({}) => ({}),
            filter: {
              // update the filter
              id: 'test-id',
            },
          }),
          mockSecondResults: mock({
            map: ({}) => ({}),
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

test('getMinimalQueryRecordForNextQuery includes the query record entry if filtering has been updated', () => {
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
    getMinimalQueryRecordForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    })
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because filtering has not been updated
  });
});

test('getMinimalQueryRecordForNextQuery includes the query record entry if sorting has been updated', () => {
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
    getMinimalQueryRecordForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedSort,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    })
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedSort,
    todosNotUpdating: undefined, // this query record entry should not be included because sorting has not been updated
  });
});

test('getMinimalQueryRecordForNextQuery includes the query record entry if pagination has been updated', () => {
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
    getMinimalQueryRecordForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedPagination,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    })
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedPagination,
    todosNotUpdating: undefined, // this query record entry should not be included because pagination has not been updated
  });
});

// See comment above getMinimalQueryRecordForNextQuery for a why
test('getMinimalQueryRecordForNextQuery includes the query record entry as a whole if it returns an array and any of the relational queries have updated their filtering', () => {
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
    getMinimalQueryRecordForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    })
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because filtering has not been updated
  });
});

test('getMinimalQueryRecordForNextQuery includes the query record entry as a whole if it returns an array and any of the relational queries have updated their sorting', () => {
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
    getMinimalQueryRecordForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    })
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because sorting has not been updated
  });
});

test('getMinimalQueryRecordForNextQuery includes the query record entry as a whole if it returns an array and any of the relational queries have updated their pagination', () => {
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
    getMinimalQueryRecordForNextQuery({
      nextQueryRecord: {
        todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
      previousQueryRecord: {
        todos: mockTodosQueryRecordEntry,
        todosNotUpdating: mockTodosQueryRecordEntry,
      },
    })
  ).toEqual({
    todos: mockTodosQueryRecordEntryWithUpdatedAssigneeFilter,
    todosNotUpdating: undefined, // this query record entry should not be included because pagination has not been updated
  });
});
