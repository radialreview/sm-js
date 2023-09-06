import {
  createMockQueryDefinitions,
  getMockConfig,
  getMockQueryResultExpectations,
} from './specUtilities';
import {
  autorun,
  isComputedProp,
  isObservableArray,
  isObservableObject,
  isObservableProp,
} from 'mobx';

import {
  array,
  boolean,
  MMGQL,
  number,
  object,
  queryDefinition,
  record,
  string,
  stringEnum,
} from '.';
import { INode, QueryDefinitions } from './types';
import { DEFAULT_TOKEN_NAME } from './consts';
import { mobxPlugin } from './plugins';
import {
  NotUpToDateException,
  NotUpToDateInComputedException,
} from './exceptions';
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

test('Querying returns the expected data as an observable for all data types when plugins are enabled', async done => {
  const initialData = {
    user: {
      id: 'id-1',
      type: 'user',
      firstName: 'John',
      lastName: 'Smith',
      hasPets: true,
      numberOfPets: 2,
      petName: 'Babu',
      pets: ['dog', 'cat'],
      petsToAge: { dog: 2, cat: 5 },
      petSleepToSpots: { Babu: 'couch', George: 'chair' },
    },
  };

  const mmGQLInstance = new MMGQL(
    getMockConfig({
      plugins: [mobxPlugin],
      mockData: initialData,
    })
  );

  const userProperties = {
    firstName: string,
    lastName: string,
    hasPets: boolean(false),
    numberOfPets: number,
    petName: stringEnum(['Babu', 'George']),
    pets: array(string),
    petsToAge: record(number),
    petSleepToSpots: object({ Babu: string, George: string }),
  };

  type UserNode = INode<{
    TNodeType: 'user';
    TNodeData: typeof userProperties;
    TNodeComputedData: {};
    TNodeRelationalData: {};
  }>;

  const userNode: UserNode = mmGQLInstance.def({
    type: 'user',
    properties: userProperties,
    relational: {},
    computed: {},
  });

  const { data } = await mmGQLInstance.query({
    user: queryDefinition({
      def: userNode,
      map: ({
        firstName,
        lastName,
        hasPets,
        numberOfPets,
        pets,
        petsToAge,
        petSleepToSpots,
      }) => ({
        firstName,
        lastName,
        hasPets,
        numberOfPets,
        pets,
        petsToAge,
        petSleepToSpots,
      }),
      target: {
        id: 'id-1',
      },
    }),
  });

  expect(isObservableProp(data.user, 'firstName')).toBe(true);
  expect(isObservableProp(data.user, 'numberOfPets')).toBe(true);
  expect(isObservableProp(data.user, 'hasPets')).toBe(true);
  expect(isObservableProp(data.user, 'petName')).toBe(true);
  expect(isObservableObject(data)).toBe(true);
  expect(isObservableArray(data.user.pets)).toBe(true);
  expect(isObservableObject(data.user.petsToAge)).toBe(true);

  let iterationCounter = 0;
  const updateData = () => {
    userNode.repository.onDataReceived({
      id: 'id-1',
      type: 'user',
      version: 1,
      firstName: 'Ralph',
    });
  };

  const errorSpy = jest.spyOn(console, 'error');

  autorun(() => {
    iterationCounter++;

    if (iterationCounter === 1) {
      expect(data.user.firstName).toBe('John');
    }

    if (iterationCounter === 2) {
      expect(data.user.firstName).toBe('Ralph');
      done();
    }
  });

  updateData();

  expect(errorSpy).not.toHaveBeenCalled();
});

test('QueryManager handles a query result and returns the expected data as an observable when plugins are enabled for a nodesCollection', done => {
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
            expect(isObservableObject(resultsObject)).toBe(true);
            expect(isObservableObject(node)).toBe(true);
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

test('Computed properties update only when a property that derives the computed is changed when plugins are enabled', async done => {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      plugins: [mobxPlugin],
      mockData: {
        user: {
          id: 'id-1',
          type: 'user',
          firstName: 'Babu',
          middleName: 'Orange',
          lastName: 'Cat',
        },
      },
    })
  );

  const userProperties = {
    firstName: string,
    lastName: string,
    middleName: string,
  };

  type UserNode = INode<{
    TNodeType: 'user';
    TNodeData: typeof userProperties;
    TNodeComputedData: {
      fullName: string;
      fullerName: string;
      computedThatHasToBeInvoked: (opts: { num: number }) => string;
    };
    TNodeRelationalData: {};
  }>;

  let indexCount = 0;
  const userNode: UserNode = mmGQLInstance.def({
    type: 'user',
    properties: userProperties,
    relational: {},
    computed: {
      fullName: ({ firstName, lastName }) => {
        indexCount++;
        return firstName + ' ' + lastName;
      },
      fullerName: ({ firstName, lastName, middleName }) => {
        return firstName + ' ' + middleName + ' ' + lastName;
      },
      computedThatHasToBeInvoked: ({ firstName }) => ({ num }) => {
        return firstName + ' is number ' + num + '!';
      },
    },
  });

  const { data } = await mmGQLInstance.query(
    {
      user: queryDefinition({
        def: userNode,
        map: ({ firstName, lastName }) => ({
          firstName,
          lastName,
        }),
        target: {
          id: 'id-1',
        },
      }),
    },
    { queryId: 'MockQueryId' }
  );
  expect(isObservableObject(data.user)).toBe(true);
  expect(data.user.computedThatHasToBeInvoked({ num: 1 })).toBe(
    'Babu is number 1!'
  );
  expect(() => data.user.fullerName).toThrowError(
    new NotUpToDateInComputedException({
      computedPropName: 'fullerName',
      propName: 'middleName',
      nodeType: 'user',
      queryId: 'MockQueryId',
    })
  );

  const errorSpy = jest.spyOn(console, 'error');

  autorun(() => {
    expect(isComputedProp(data.user, 'fullName')).toBe(true);
    expect(isObservableProp(data.user, 'firstName')).toBe(true);

    expect(indexCount).toBe(0);
    expect(data.user.fullName).toBe('Babu Cat');
    expect(indexCount).toBe(1);
    expect(data.user.fullName).toBe('Babu Cat');
    expect(indexCount).toBe(1);
    expect(data.user.fullName).toBe('Babu Cat');
    expect(indexCount).toBe(1);

    userNode.repository.onDataReceived({
      id: 'id-1',
      version: 1,
      type: 'user',
      firstName: 'Calcifer',
    });

    expect(data.user.firstName).toBe('Calcifer');
    expect(data.user.fullName).toBe('Calcifer Cat');
    expect(indexCount).toBe(2);
    expect(data.user.fullName).toBe('Calcifer Cat');
    expect(indexCount).toBe(2);

    if (indexCount === 2) {
      done();
    }
  });

  expect(errorSpy).not.toHaveBeenCalled();
});
