import {
  mockQueryDataReturn,
  getMockQueryRecord,
  mockQueryResultExpectations,
  getMockConfig,
} from './specUtilities';

import { SMJS } from '.';

test('smQueryManager handles a query result and returns the expected data', () => {
  const smJSInstance = new SMJS(getMockConfig());
  const queryManager = new smJSInstance.SMQueryManager(
    getMockQueryRecord(smJSInstance)
  );

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
    queryId: 'MockQueryId',
  });

  expect(queryManager.getResults()).toEqual(mockQueryResultExpectations);
});
