import {
  mockQueryDataReturn,
  getMockQueryRecord,
  mockQueryResultExpectations,
  getMockConfig,
  convertPaginatedArrayValuesToArray,
} from './specUtilities';

import { MMGQL } from '.';

test('QueryManager handles a query result and returns the expected data', () => {
  const mmGQLInstance = new MMGQL(getMockConfig());
  const queryManager = new mmGQLInstance.QueryManager(
    getMockQueryRecord(mmGQLInstance)
  );

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
    queryId: 'MockQueryId',
  });

  expect(queryManager.getResults()).toEqual(
    convertPaginatedArrayValuesToArray(mockQueryResultExpectations)
  );
});
