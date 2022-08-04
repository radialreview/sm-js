import { MMGQL, QueryRecord } from '.';
import { string } from './dataTypes';
import { QuerySlimmer } from './QuerySlimmer';
import { getMockConfig } from './specUtilities';

function setupTests() {
  const mmGQL = new MMGQL(getMockConfig());

  const userNode = mmGQL.def({
    type: 'user',
    properties: {
      firstName: string,
      lastName: string,
    },
  });



  return { QuerySlimmer: new QuerySlimmer(), userNode };
}

test(`when it receives a query's results, it caches the results correctly`, () => {
  const { QuerySlimmer, userNode } = setupTests();

  const slimmedQuery: QueryRecord = {
    users: {
      def: userNode,
      properties: ['firstName', 'lastName'],
    },
  };
  
  const users = [
    {
      id: 'id-1',
      type: userNode.type,
      firstName: 'Aidan',
      lastName: 'Goodman',
    },
  ];
  QuerySlimmer.onResultsReceived({
    slimmedQuery,
    originalQuery: slimmedQuery,
    slimmedQueryResults: {
      users,
    },
    subscriptionEstablished: true,
  });

  expect(QuerySlimmer.resultsByContext['users(NO_PARAMS)']).toEqual({
    subscriptionsByProperty: { firstName: 1, lastName: 1 },
    results: users,
  });
});
//test single id, array of ids
  //test that you get back actual version of slimmed query after building out onResultsReceived func

test('when it receives a single id in query results it caches them correctly', () => {
    const { QuerySlimmer, userNode } = setupTests();

  const slimmedQuery: QueryRecord = {
    users: {
      def: userNode,
      properties: ['firstName', 'lastName'],
    },
  };
  const users = [
    {
      id: 'id-1',
      type: userNode.type,
      firstName: 'Aidan',
      lastName: 'Goodman',
    },
  ];
    QuerySlimmer.onResultsReceived({
    slimmedQuery,
    originalQuery: slimmedQuery,
    slimmedQueryResults: {
      users,
    },
    subscriptionEstablished: true,
  });
    expect(QuerySlimmer.resultsByContext['users(id).todos'].toEqual({
      subscriptionsByProperty: { firstName: 1, lastName: 1 },
      results: users,
    });
})
