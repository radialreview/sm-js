import {
  createMockQueryDefinitions,
  getMockQueryResultExpectations,
  getMockConfig,
} from './specUtilities';
import {
  extendObservable,
  isObservable,
  isObservableObject,
  isObservableProp,
  observable,
} from 'mobx';

import { MMGQL } from '.';
import { QueryDefinitions } from './types';
import { DEFAULT_TOKEN_NAME } from './consts';
import { mobxPlugin } from './plugins';
import { NotUpToDateException } from './exceptions';
import { OBJECT_PROPERTY_SEPARATOR } from './queriers/queryDefinitionAdapters';

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

  // NOLEY NOTES: test to see if the nested props on an object are observables

  const object: Record<string, any> = observable({
    key: {
      nestedKey: 'value',
      doubleNestedKey: { tripleNestedKey: { IamAKey: 'value' } },
    },
  });

  object['newKey'] = { key: 'value' };

  const nonObservableObject: Record<string, any> = {
    key: { cats: 'cool' },
    basicKey: 'value',
  };

  extendObservable(nonObservableObject, { funNewKey: { cats: 'value' } });
  expect(isObservableObject(nonObservableObject)).toBe(true); // problematic
  expect(isObservableObject(nonObservableObject.key)).toBe(false);
  expect(isObservableObject(nonObservableObject.basicKey)).toBe(false);
  expect(isObservableObject(nonObservableObject.funNewKey)).toBe(true);

  expect(isObservable(object)).toBe(true);
  expect(isObservable(object.key)).toBe(true);
  expect(isObservableProp(object.newKey, 'key')).toBe(true);
  expect(isObservableProp(object.key, 'nestedKey')).toBe(true);
  expect(isObservable(object.key.doubleNestedKey)).toBe(true);
  expect(isObservable(object.key.doubleNestedKey.tripleNestedKey)).toBe(true);

  // const c1 = computed(() => {});
  // const c2 = computed(() => {}).get;
  // const c3 = computed(() => {}).get();

  // expect(isComputed(c1)).toBe(true);
  // expect(isComputed(c2)).toBe(true); // fail
  // expect(isComputed(c3)).toBe(true); // fail

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
        resultsObject.users.nodes.forEach(
          (node: {
            parsedData: any;
            id: string;
            displayName: string;
            address: {
              zipCode: string;
              state: string;
              apt: {
                floor: number;
                number: number;
              };
            };
          }) => {
            // console.log('NOLEY node.displayName', node.displayName);
            // expect(isComputed(node.displayName)).toBe(true);
            // expect(isComputedProp(node, 'displayName')).toBe(true);
            expect(isObservableProp(node, 'address')).toBe(true);
            // NOLEY NOTES: this causes symbol errors
            // expect(isObservableObject(node.address)).toBe(true);
            expect(() => node.address.zipCode).toThrowError(
              new NotUpToDateException({
                propName: `address${OBJECT_PROPERTY_SEPARATOR}zipCode`,
                nodeType: 'user',
                queryId: 'MockQueryId',
              })
            );
            expect(isObservableObject(node.parsedData.address)).toBe(true);
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
