import {
  mockQueryDataReturn,
  getMockQueryRecord,
  mockQueryResultExpectations,
  getMockConfig,
  convertNodesCollectionValuesToArray,
} from './specUtilities';

import { MMGQL } from '.';

test('QueryManager handles a query result and returns the expected data', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const resultsObject = {};
  const queryManager = new mmGQLInstance.QueryManager(
    getMockQueryRecord(mmGQLInstance),
    {
      queryId: 'MockQueryId',
      useServerSidePaginationFilteringSorting: true,
      resultsObject,
      onResultsUpdated: () => {},
      performQuery: async () => {},
    }
  );

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
  });

  expect(resultsObject).toEqual(
    convertNodesCollectionValuesToArray(mockQueryResultExpectations)
  );
});
