import {
  mockQueryDataReturn,
  getMockQueryRecord,
  mockQueryResultExpectations,
  getMockConfig,
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

  console.log('results', queryManager.getResults().users);

  expect(queryManager.getResults()).toEqual(mockQueryResultExpectations);
});
