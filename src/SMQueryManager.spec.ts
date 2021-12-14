import { SMQueryManager } from './SMQueryManager';
import {
  mockQueryDataReturn,
  mockQueryRecord,
  mockQueryResultExpectations,
} from './specUtilities';

test('smQueryManager handles a query result and returns the expected data', () => {
  const queryManager = new SMQueryManager(mockQueryRecord);

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
    queryId: 'MockQueryId',
  });

  expect(queryManager.getResults()).toEqual(mockQueryResultExpectations);
});
