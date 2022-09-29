import {
  mockQueryDataReturn,
  getMockQueryRecord,
  getMockQueryResultExpectations,
  getMockConfig,
} from '../specUtilities';

import { MMGQL } from '..';

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

  expect(JSON.stringify(resultsObject)).toEqual(
    JSON.stringify(
      getMockQueryResultExpectations({
        useServerSidePaginationFilteringSorting: true,
      })
    )
  );
});
