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

// NOLEY TESING GOALS
// 1. need to check each DO property is an observable and the computed functions are computed
// - problem with this, see NOLEY PROBLEM 1 below
// 2. the resutlsObject is an observable
// - done
// 3. run existing tests hunt all spec files and see if any new failings
// - need to do, also should run all tests with the plugins to see how that behaves
// 4. onDataRecieved should update data for computed as expected
// - need to test, this probably is covered in other tests but worth making sure.

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
          firstName: 'John',
          lastName: 'Smith',
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

  // NOLEY PROBLEM 1: these fail, mobx or me?
  // expect(isObservableProp(data.user, 'firstName')).toBe(true);
  // expect(isObservableProp(data.user, 'numberOfPets')).toBe(true);
  // expect(isObservableProp(data.user, 'hasPets')).toBe(true);
  // expect(isObservableProp(data.user, 'petName')).toBe(true);
  // expect(isObservableObject(data.user.petSleepToSpots)).toBe(true);
  expect(isObservableObject(data.user)).toBe(true);
  expect(isObservableArray(data.user.pets)).toBe(true);
  expect(isObservableObject(data.user.petsToAge)).toBe(true);
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

test('Computed properties update only when a property that derives the computed is changed when plugins are enabled', async () => {
  const mmGQLInstance = new MMGQL(
    getMockConfig({
      plugins: [mobxPlugin],
      mockData: {
        user: {
          id: 'id-1',
          type: 'user',
          firstName: 'Babu',
          middleName: 'Toe',
          lastName: 'Biter',
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
    expect(indexCount).toBe(0);
    expect(data.user.fullName).toBe('Babu Biter');
    expect(indexCount).toBe(1);
    expect(data.user.fullName).toBe('Babu Biter');
    expect(indexCount).toBe(1);
    expect(data.user.fullName).toBe('Babu Biter');
    expect(indexCount).toBe(1);
  });

  expect(errorSpy).not.toHaveBeenCalled();
});

//NOLEY GRAVEYARD - delete at end.
// test('POC for DO observables does the things', () => {
//   let computedIndex = 0;

//   const node: Record<string, any> = {
//     computed: {
//       superCoolComputed: (opts: { cats: string }) => {
//         computedIndex++;
//         return opts.cats + ' are super cool';
//       },
//       superNeatComputed: (opts: { cats: string }) => {
//         return opts.cats + ' are neat';
//       },
//     },
//   };

//   class DO {
//     public parsedData: Record<string, any> = {};
//     public useMobx: boolean = false;

//     constructor(opts: { initialData: Record<string, any>; useMobx: boolean }) {
//       this.parsedData = opts.initialData;
//       this.useMobx = opts.useMobx;
//       opts.useMobx && makeAutoObservable(this['parsedData']);

//       this.initializeNodePropGetters();
//       this.initializeNodeComputedGetters();
//     }

//     public onDataReceived = (data: Record<string, any>) => {
//       this.parsedData = data;
//     };

//     private initializeNodePropGetters() {
//       this.setPrimitiveValueProp('cats');
//     }

//     private initializeNodeComputedGetters() {
//       const computedData = node.computed;
//       if (computedData) {
//         Object.keys(computedData).forEach(computedProp => {
//           this.setComputedProp({
//             propName: computedProp,
//             computedFn: computedData[computedProp] as (
//               data: Record<string, any>
//             ) => any,
//           });
//         });
//       }
//     }

//     private setComputedProp(opts: {
//       propName: string;
//       computedFn: (nodeData: Record<string, any>) => any;
//     }) {
//       let extended = false;
//       if (this.useMobx) {
//         extended = true;

//         extendObservable(this, {
//           get [opts.propName]() {
//             return computed(() => {
//               return opts.computedFn(this);
//             }).get();
//           },
//         });
//       }

//       if (!extended) {
//         Object.defineProperty(this, opts.propName, {
//           get: () => opts.computedFn(this),
//           configurable: true,
//           enumerable: true,
//         });
//       }
//     }

//     private setPrimitiveValueProp = (propName: string) => {
//       if (this.useMobx) {
//         const emptyObj = {};
//         Object.defineProperty(emptyObj, propName, {
//           enumerable: true,
//           configurable: true,
//           get: () => this.parsedData[propName],
//         });
//         extendObservable(this, emptyObj);
//       } else {
//         Object.defineProperty(this, propName, {
//           enumerable: true,
//           configurable: true,
//           get: () => this.parsedData[propName],
//         });
//       }
//     };
//   }

//   const myDOWithMobx: Record<string, any> = new DO({
//     initialData: { cats: 'dogs' },
//     useMobx: true,
//   });

//   // onDataRecieved will not update correctly within autorun, not autofun. See how this behaves when we plug this in to
//   // the real DO.
//   // expect(computedIndex).toBe(0);
//   // myDOWithMobx.onDataReceived({ cats: 'avocados' });
//   // expect(computedIndex).toBe(0);
//   // expect(myDOWithMobx.superCoolComputed).toBe('avocados are super cool');
//   // expect(computedIndex).toBe(1);
//   // myDOWithMobx.onDataReceived({ cats: 'dogs' });

//   // // per mobx, computed's have to be observed by something in order to memoize values, autorun replicates this:
//   // // https://github.com/mobxjs/mobx/issues/1531#issuecomment-386818310
//   // autorun(() => {
//   //   expect(isComputedProp(myDOWithMobx, 'superCoolComputed')).toBe(true);
//   //   expect(computedIndex).toBe(1);
//   //   expect(myDOWithMobx.superCoolComputed).toBe('dogs are super cool');
//   //   expect(computedIndex).toBe(2);
//   //   expect(myDOWithMobx.superCoolComputed).toBe('dogs are super cool');
//   //   expect(computedIndex).toBe(2);
//   //   expect(myDOWithMobx.superCoolComputed).toBe('dogs are super cool');
//   //   expect(computedIndex).toBe(2);
//   // });

//   const nodeComputed = (node.computed as unknown) as Record<
//     string,
//     (proxy: IDOProxy) => any
//   >;

//   const computedAccessors = nodeComputed
//     ? Object.keys(nodeComputed).reduce((acc, computedKey) => {
//         acc[computedKey] = computedFn(() => {
//           return nodeComputed[computedKey](proxiedDO as IDOProxy);
//         });

//         return acc;
//       }, {} as Record<string, () => any>)
//     : {};

//   const proxiedDO = new Proxy(
//     {},
//     {
//       getOwnPropertyDescriptor: (_: Record<string, any>, key: string) => {
//         if (key === 'id') {
//           return {
//             ...Object.getOwnPropertyDescriptor(myDOWithMobx, key),
//             enumerable: true,
//             configurable: true,
//             // value: myDO[key],
//           };
//         }

//         // enumerate computed properties which have all the data they need queried
//         // otherwise they throw NotUpToDateException and we don't enumerate
//         else if (nodeComputed && Object.keys(nodeComputed).includes(key)) {
//           try {
//             computedAccessors[key]();
//             return {
//               enumerable: true,
//               configurable: true,
//             };
//           } catch (e) {
//             if (!(e instanceof NotUpToDateException)) throw e;
//             return {
//               enumerable: false,
//               configurable: true,
//             };
//           }
//         } else {
//           return {
//             ...Object.getOwnPropertyDescriptor(myDOWithMobx, key),
//             enumerable: false,
//             configurable: true,
//             // value: myDO[key],
//           };
//         }
//       },
//       ownKeys: () => {
//         return Object.keys(myDOWithMobx);
//       },
//       get: (_: Record<string, any>, key: string) => {
//         if (computedAccessors[key]) {
//           try {
//             return computedAccessors[key]();
//           } catch (e) {
//             if (e instanceof NotUpToDateException) {
//               throw new NotUpToDateInComputedException({
//                 computedPropName: key,
//                 propName: e.propName,
//                 nodeType: 'TEST',
//                 queryId: '123',
//               });
//             }
//             throw e;
//           }
//         } else {
//           return myDOWithMobx[key];
//         }
//       },
//     }
//   );

//   expect(isObservableProp(proxiedDO, 'cats')).toBe(true);

//   expect(computedIndex).toBe(0);
//   proxiedDO.onDataReceived({ cats: 'avocados' });
//   expect(computedIndex).toBe(0);
//   expect(proxiedDO.superCoolComputed).toBe('avocados are super cool');
//   expect(proxiedDO.superNeatComputed).toBe('avocados are neat');
//   expect(computedIndex).toBe(1);
//   proxiedDO.onDataReceived({ cats: 'dogs' });

//   const errorSpy = jest.spyOn(console, 'error');

//   // per mobx, computed's have to be observed by something in order to memoize values, autorun replicates this:
//   // https://github.com/mobxjs/mobx/issues/1531#issuecomment-386818310
//   autorun(() => {
//     expect(isComputedProp(proxiedDO, 'superCoolComputed')).toBe(true);
//     expect(computedIndex).toBe(1);
//     expect(proxiedDO.superCoolComputed).toBe('dogs are super cool');
//     expect(computedIndex).toBe(2);
//     expect(proxiedDO.superCoolComputed).toBe('dogs are super cool');
//     expect(computedIndex).toBe(2);
//     expect(proxiedDO.superCoolComputed).toBe('dogs are super cool');
//     expect(computedIndex).toBe(2);
//   });

//   expect(errorSpy).not.toHaveBeenCalled();
// });

// makeAutoObservable(computedIndex);

// makeAutoObservable(computedInde// this fails due to not properly memozing the value
// Object.defineProperty(emptyObj, 'computed', {
//   configurable: true,
//   enumerable: true,
//   get: computedFn(() =>
//     node.computed.superCoolComputed({ cats: computedIndexl })
//   ),
// });

// this fails due to blah of undefined errors:  TypeError: Cannot read property 'size' of undefined
// Object.defineProperty(emptyObj, 'computed', {
//   configurable: true,
//   enumerable: true,
//   get: computed(() =>
//     node.computed.superCoolComputed({ cats: computedIndexl })
//   ).get,
// });

// this does not properly memoize
// Object.defineProperty(emptyObj, 'computed', {
//   configurable: true,
//   enumerable: true,
//   get: () =>
//     computed(() =>
//       node.computed.superCoolComputed({ cats: computedIndexl })
//     ).get(),
// });

//    TypeError: Cannot read property 'isComputing_' of undefined
//   const computedFunctionTest = computed(() =>
//   node.computed.superCoolComputed({ cats: computedIndexl })
// ).get;

// class DOTest {
//   animal = 'cats';

//   constructor() {
//     makeAutoObservable(this);
//   }

//   changeAnimal(newAnimal: string) {
//     action(() => {
//       this.animal = newAnimal;
//     })();
//   }
// }

// const obersObj: Record<string, any> = new DOTest();

// const computedValue = computed(() => {
//   return node.computed.superCoolComputed({ cats: obersObj.animal });
// }).get();

// extendObservable(obersObj, {
//   get computed() {
//     return computedValue;
//   },
// });

// someone kill me: https://github.com/mobxjs/mobx/issues/1531#issuecomment-386818310

// autorun(() => {
//   expect(isComputedProp(obersObj, 'computed')).toBe(true);
//   expect(computedIndex).toBe(1);
//   expect(obersObj.computed).toBe('cats are super cool');
//   expect(computedIndex).toBe(1);
//   expect(obersObj.computed).toBe('cats are super cool');
//   expect(computedIndex).toBe(1);
// });
