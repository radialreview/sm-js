import {
  createMockQueryDefinitions,
  getMockConfig,
  getMockQueryResultExpectations,
} from './specUtilities';
import {
  computed,
  extendObservable,
  isComputed,
  isComputedProp,
  isObservableArray,
  isObservableObject,
  isObservableProp,
  makeAutoObservable,
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

test('Querying returns the expected data as an observable for all data types when plugins are enabled', async () => {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      plugins: [mobxPlugin],
      mockData: {
        user: {
          id: 'id-1',
          type: 'user',
          firstName: 'Noley',
          lastName: 'Holland',
          hasPets: true,
          numberOfPets: 2,
          petName: 'Babu',
          pets: ['dog', 'cat'],
          petsToAge: { dog: 2, cat: 5 },
          petSleepToSpots: { Babu: 'couch', George: 'chair' },
        },
      },
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

  // NOLEY NOTES: these fail, the object one fails due to mobx symbol error.
  // I am not sure if this is a mobx testing problem or a me problem.
  // expect(isObservableProp(data.user, 'firstName')).toBe(true);
  // expect(isObservableProp(data.user, 'numberOfPets')).toBe(true);
  // expect(isObservableProp(data.user, 'hasPets')).toBe(true);
  // expect(isObservableProp(data.user, 'petName')).toBe(true);
  // expect(isObservableObject(data.user.petSleepToSpots)).toBe(true);
  expect(isObservableObject(data.user)).toBe(true);
  expect(isObservableArray(data.user.pets)).toBe(true);
  expect(isObservableObject(data.user.petsToAge)).toBe(true);
});

// NOLEY TEST
// need to check each DO property is an observable and the computed functions are computed
// the resutlsObject is an observable
// run existing tests hunt all spec files and see if any new failings

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
            // NOLEY PROBLEM: this causes symbol errors, we cannot test anything that is an object without erroring out.
            // expect(isObservableObject(node.address)).toBe(true);
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

test('Computed properties update only when a property that derives the computed is changed when plugins are enabled', async () => {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      plugins: [mobxPlugin],
      mockData: {
        user: {
          id: 'id-1',
          type: 'user',
          firstName: 'Noley',
          lastName: 'Holland',
        },
      },
    })
  );

  const userProperties = {
    firstName: string,
    lastName: string,
  };

  type UserNode = INode<{
    TNodeType: 'user';
    TNodeData: typeof userProperties;
    TNodeComputedData: { fullName: string };
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
    },
  });

  const { data } = await mmGQLInstance.query({
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
  });
  expect(isObservableObject(data.user)).toBe(true);

  // NOLEY FAIL
  // NotUpToDateInComputedException test these errors fire
  expect(isComputed(data.user.fullName)).toBe(true);
  expect(isComputedProp(data.user, 'fullName')).toBe(true);

  expect(indexCount).toBe(0);
  expect(data.user.fullName).toBe('Noley Holland');
  expect(indexCount).toBe(1);
  expect(data.user.fullName).toBe('Noley Holland');
  expect(indexCount).toBe(1); // NOLEY NOTES: we want this to still be 1.
  expect(data.user.fullName).toBe('Noley Holland');
  expect(indexCount).toBe(1); // NOLEY NOTES: we want this to still be 1.
});

test.only('POC for DO observables does the things', () => {
  let computedIndex = { count: 0 };
  let computedInformation = { count: 0, animal: 'cats' };
  const node: Record<string, any> = {
    computed: {
      catsAreWut: (opts: { cats: string }) => {
        computedIndex.count++;
        computedInformation.count++;
        return opts.cats + ' are super cool';
      },
    },
  };

  // makeAutoObservable(computedIndex);

  makeAutoObservable(computedInformation);

  const computedFunctionTest = computed(() =>
    node.computed.catsAreWut({ cats: computedInformation.animal })
  ).get();

  // expect(isComputed(computedFunctionTest)).toBe(true);
  expect(computedInformation.count).toBe(1);
  expect(computedFunctionTest).toBe('cats are super cool');
  expect(computedInformation.count).toBe(1);
  expect(computedFunctionTest).toBe('cats are super cool');
  expect(computedInformation.count).toBe(1);
  //NOLEY BUG: this does not update, start here when back up.
  computedInformation.animal = 'pigs';
  console.log('NOLEY computedInformation', computedInformation.animal);
  expect(computedFunctionTest).toBe('pigs are super cool');
  expect(computedInformation.count).toBe(2);

  class DO {
    public parsedData: Record<string, any> = {};
    public useMobx: boolean = false;

    constructor(opts: { initialData: Record<string, any>; useMobx: boolean }) {
      this.parsedData = opts.initialData;
      this.useMobx = opts.useMobx;
      opts.useMobx && makeAutoObservable(this['parsedData']);

      this.initializeNodePropGetters();
      this.initializeNodeComputedGetters();
    }

    public onDataReceived = (data: Record<string, any>) => {
      this.parsedData = data;
    };

    private initializeNodePropGetters() {
      this.setPrimitiveValueProp('cats');
    }

    private initializeNodeComputedGetters() {
      const computedData = node.computed;
      if (computedData) {
        Object.keys(computedData).forEach(computedProp => {
          this.setComputedProp({
            propName: computedProp,
            computedFn: computedData[computedProp] as (
              data: Record<string, any>
            ) => any,
          });
        });
      }
    }

    private setComputedProp(opts: {
      propName: string;
      computedFn: (nodeData: Record<string, any>) => any;
    }) {
      // let computedGetter = () => opts.computedFn(this);
      // NOLEY DO WE NEED THIS??
      // mmGQLInstance.plugins?.forEach(plugin => {
      //   if (plugin.DO?.computedDecorator) {
      //     computedGetter = plugin.DO.computedDecorator({
      //       computedFn: computedGetter,
      //       DOInstance: this,
      //     });
      //   }
      // });

      let extended = false;
      if (this.useMobx) {
        extended = true;

        const objectToExtend = {};

        Object.defineProperty(this, opts.propName, {
          configurable: true,
          enumerable: true,
          get: () => opts.computedFn(this),
        });

        extendObservable(this, objectToExtend);
      }

      if (!extended) {
        Object.defineProperty(this, opts.propName, {
          get: () => opts.computedFn(this),
          configurable: true,
          enumerable: true,
        });
      }
    }

    private setPrimitiveValueProp = (propName: string) => {
      if (this.useMobx) {
        const emptyObj = {};
        Object.defineProperty(emptyObj, propName, {
          get: () => this.parsedData[propName],
        });
        extendObservable(this, emptyObj);
      } else {
        Object.defineProperty(this, propName, {
          get: () => this.parsedData[propName],
        });
      }
    };
  }

  const myDOWithMobx: Record<string, any> = new DO({
    initialData: { cats: 'dogs' },
    useMobx: true,
  });

  const myDOWithoutMobx: Record<string, any> = new DO({
    initialData: { cats: 'dogs' },
    useMobx: false,
  });

  // expect(computedIndex.count).toBe(0);
  // expect(myDOWithMobx.catsAreWut).toBe('dogs are super cool');
  // expect(computedIndex.count).toBe(1);
  // // expect(myDOWithMobx.catsAreWut).toBe('dogs are super cool');
  // // expect(computedIndex.count).toBe(1);
  // expect(myDOWithMobx.catsAreWut).toBe('dogs are super cool');
  // expect(computedIndex.count).toBe(1);
  // myDOWithMobx.onDataReceived({ cats: 'avocados' });
  // expect(myDOWithMobx.catsAreWut).toBe('avocados are super cool');
  // expect(computedIndex.count).toBe(2);
  // expect(isComputed(myDOWithoutMobx.catsAreWut)).toBe(true);
  // expect(isComputedProp(myDOWithoutMobx, 'catsAreWut')).toBe(true);

  // myDOWithMobx.onDataReceived({ cats: 'avocados' });
  myDOWithoutMobx.onDataReceived({ cats: 'avocados' });

  const proxiedDO = new Proxy(
    {},
    {
      getOwnPropertyDescriptor: (_: Record<string, any>, key: string) => {
        if (key === 'id') {
          return {
            ...Object.getOwnPropertyDescriptor(myDOWithMobx, key),
            enumerable: true,
            configurable: true,
            // value: myDO[key],
          };
        } else {
          return {
            ...Object.getOwnPropertyDescriptor(myDOWithMobx, key),
            enumerable: false,
            configurable: true,
            // value: myDO[key],
          };
        }
      },
      ownKeys: () => {
        return Object.keys(myDOWithMobx);
      },
      get: (_: Record<string, any>, key: string) => {
        return myDOWithMobx[key];
      },
    }
  );

  //NOLEY NOTES: the fact that this passes and other tests don't is an issue.
  expect(isObservableProp(proxiedDO, 'cats')).toBe(true);

  // const c1 = computed(() => {});
  // const c2 = computed(() => {}).get;
  // const c3 = computed(() => {}).get();

  // expect(isComputed(c1)).toBe(true);
  // expect(isComputed(c2)).toBe(true); // fail
  // expect(isComputed(c3)).toBe(true); // fail
});
