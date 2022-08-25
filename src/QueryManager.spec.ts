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
  const queryManager = new mmGQLInstance.QueryManager(
    getMockQueryRecord(mmGQLInstance)
  );

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
    queryId: 'MockQueryId',
  });

  expect(queryManager.getResults()).toEqual(
    convertNodesCollectionValuesToArray(mockQueryResultExpectations)
  );
});
