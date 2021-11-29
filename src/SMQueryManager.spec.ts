import { SMQueryManager } from './SMQueryManager';
import {
  mockQueryDataReturn,
  mockQueryRecord,
  mockQueryResultExpectations,
  mockSubscriptionMessage,
} from './specUtilities';

test('smQueryManager handles a query result and returns the expected data', () => {
  const queryManager = new SMQueryManager(mockQueryRecord);

  queryManager.onQueryResult({
    queryResult: mockQueryDataReturn,
    queryId: 'MockQueryId',
  });

  expect(queryManager.getResults()).toEqual(mockQueryResultExpectations);
});

test(`smQueryManager handles a subscription message with a node's delta and returns the expected data`, () => {
  const queryManager = new SMQueryManager(mockQueryRecord);

  queryManager.onSubscriptionMessage(mockSubscriptionMessage.users);

  expect(queryManager.getResults()).toEqual({
    users: [{ id: 'some-mock-user-id', address: { state: 'AK' } }],
  });
});
