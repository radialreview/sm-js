import {
  createMockQueryDefinitions,
  getMockQueryResultExpectations,
  getMockConfig,
} from './specUtilities';
import { isObservableObject } from 'mobx';

import { MMGQL } from '.';
import { QueryDefinitions } from './types';
import { DEFAULT_TOKEN_NAME } from './consts';
import { mobxPlugin } from './plugins';

test('mmGQLInstance correctly returns the plugins passed in', async () => {
  const mmGQLInstance = new MMGQL(getMockConfig({ plugins: [mobxPlugin] }));

  expect(JSON.stringify(mmGQLInstance.plugins)).toEqual(
    '[{"DO":{},"DOProxy":{},"QMResults":{}}]'
  );
});

test('QueryManager handles a query result and returns the expected data when plugins are enabled', done => {
  const mmGQLInstance = new MMGQL(getMockConfig({ plugins: [mobxPlugin] }));
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });

  new mmGQLInstance.QueryManager(
    createMockQueryDefinitions(mmGQLInstance) as QueryDefinitions<
      any,
      any,
      any
    >,
    {
      queryId: 'MockQueryId',
      subscribe: false,
      useServerSidePaginationFilteringSorting: true,
      onResultsUpdated: resultsObject => {
        expect(JSON.stringify(resultsObject)).toEqual(
          JSON.stringify(
            getMockQueryResultExpectations({
              useServerSidePaginationFilteringSorting: true,
            })
          )
        );
        done();
      },
      onQueryError: e => done(e),
      onSubscriptionError: e => done(e),
      batchKey: null,
    }
  );
});

// NOLEY TEST
// need to check each DO property is an observable and the computed functions are computed
// the resutlsObject is an observable
// run existing tests hunt all spec files and see if any new failings
test('QueryManager handles a query result and returns the expected data as an observable when plugins are enabled', done => {
  const mmGQLInstance = new MMGQL(getMockConfig({ plugins: [mobxPlugin] }));
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });

  new mmGQLInstance.QueryManager(
    createMockQueryDefinitions(mmGQLInstance) as QueryDefinitions<
      any,
      any,
      any
    >,
    {
      queryId: 'MockQueryId',
      subscribe: false,
      useServerSidePaginationFilteringSorting: true,
      onResultsUpdated: resultsObject => {
        expect(isObservableObject(resultsObject)).toBe(true);
        done();
      },
      onQueryError: e => done(e),
      onSubscriptionError: e => done(e),
      batchKey: null,
    }
  );
});

test.only('QueryManager handles a query result and returns the expected data with each property on the DO being an observable when plugins are enabled', done => {
  const mmGQLInstance = new MMGQL(getMockConfig({ plugins: [mobxPlugin] }));
  mmGQLInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'token' });

  new mmGQLInstance.QueryManager(
    createMockQueryDefinitions(mmGQLInstance) as QueryDefinitions<
      any,
      any,
      any
    >,
    {
      queryId: 'MockQueryId',
      subscribe: false,
      useServerSidePaginationFilteringSorting: true,
      onResultsUpdated: resultsObject => {
        console.log('NOLEY RESULTS OBJECT', resultsObject);
        resultsObject.users.nodes.forEach(
          (node: {
            parsedData: any;
            id: string;
            address: {
              state: string;
              apt: {
                floor: number;
                number: number;
              };
            };
          }) => {
            console.log('NOLEY NODE', node);
            // expect(isObservableObject(node.address)).toBe(true);
            expect(isObservableObject(node.parsedData)).toBe(true);
          }
        );
        done();
      },
      onQueryError: e => done(e),
      onSubscriptionError: e => done(e),
      batchKey: null,
    }
  );
});
