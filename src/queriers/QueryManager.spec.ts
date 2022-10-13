import {
  mockQueryDataReturn,
  createMockQueryDefinitions,
  getMockQueryResultExpectations,
  getMockConfig,
  generateTodoNode,
  generateUserNode,
  getPrettyPrintedGQL,
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

test('QueryManager handles a query result and returns the expected data', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const resultsObject = {};
  const queryManager = new mmGQLInstance.QueryManager(
    createMockQueryDefinitions(mmGQLInstance) as QueryDefinitions<
      any,
      any,
      any
    >,
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

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
  });

  expect(JSON.stringify(resultsObject)).toEqual(
    JSON.stringify(
      getMockQueryResultExpectations({
        useServerSidePaginationFilteringSorting: true,
      })
    )
  );
});

test('QueryManager will query a minimum set of results when a fitler/sorting/pagination param is updated', done => {
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
      getMockData: () => {
        return {
          data: mockQueryResult,
        };
      },
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

  queryManager.onQueryResult({
    queryResult: mockQueryResult,
  });

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
