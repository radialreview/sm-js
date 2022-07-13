// THESE END TO END TESTS FOCUSED ON TESTING THE CAPABILITIES OF SM
// NOW THAT THIS LIB IS MOVING TO A MORE VANILLA GQL FLAVOR THESE NO LONGER APPLY

// import {
//   MMGQL,
//   number,
//   queryDefinition,
//   string,
//   children,
//   boolean,
//   object,
//   getDefaultConfig,
//   reference,
// } from '.';
// import { DEFAULT_TOKEN_NAME } from './consts';

// import { array, referenceArray } from './dataTypes';
// import { createMockQueryDefinitions } from './specUtilities';
// import {
//   IByReferenceArrayQueryBuilder,
//   IByReferenceQueryBuilder,
//   IChildrenQueryBuilder,
//   IMMGQL,
//   INode,
// } from './types';

// const env = require('../env.json');

// let consoleError: typeof console.error;
// beforeAll(() => {
//   consoleError = console.error;
//   console.error = () => {};
// });
// afterAll(() => {
//   console.error = consoleError;
// });

// function removeVersionsFromResults(results: any) {
//   return results.data.users.map((user: any) => ({
//     ...user,
//     version: null,
//     todos: user.todos.map((todo: any) => ({
//       ...todo,
//       version: null,
//       assignee: {
//         ...todo.assignee,
//         version: null,
//       },
//     })),
//   }));
// }

// const mockThingProperties = {
//   id: string,
//   number: number,
//   string: string,
//   otherString: string.optional,
//   object: object.optional({
//     property: string,
//     otherProperty: string,
//     nestedObject: object.optional({
//       nestedProperty: string,
//     }),
//   }),
// };

// const mockTodoProperties = {
//   id: string,
//   title: string,
//   assigneeId: string.optional,
//   done: boolean(false),
// };

// const mockUserProperties = {
//   id: string,
//   name: string,
// };

// type TodoProperties = typeof mockTodoProperties;

// type TodoRelationalData = {
//   assignee: IByReferenceQueryBuilder<TodoNode, ThingNode>;
// };

// type TodoMutations = {};

// type TodoNode = INode<
//   'mock-todo',
//   TodoProperties,
//   {},
//   TodoRelationalData,
//   TodoMutations
// >;
// type ThingProperties = typeof mockThingProperties;

// type ThingRelationalData = {
//   todos: IChildrenQueryBuilder<TodoNode>;
// };

// type ThingNode = INode<
//   'mock-thing',
//   ThingProperties,
//   {},
//   ThingRelationalData,
//   {}
// >;

// const ALT_TOKEN_NAME = 'alt-token';
// async function setupTest() {
//   const mmGQLInstance = new MMGQL(getDefaultConfig());

//   const { authUrl, email, password, altEmail, altPassword } = env.credentials;

//   const tokenInfo = await getToken({ authUrl, email, password });
//   mmGQLInstance.setToken({
//     tokenName: DEFAULT_TOKEN_NAME,
//     token: tokenInfo.token,
//   });

//   let altTokenInfo;
//   if (altEmail && altPassword) {
//     altTokenInfo = await getToken({
//       authUrl,
//       email: altEmail,
//       password: altPassword,
//     });
//     mmGQLInstance.setToken({
//       tokenName: ALT_TOKEN_NAME,
//       token: altTokenInfo.token,
//     });
//   }

//   const mockThingDef: ThingNode = mmGQLInstance.def({
//     type: 'mock-thing',
//     properties: mockThingProperties,
//     relational: {
//       todos: () => children({ def: mockTodoDef }),
//     },
//   });

//   const mockTodoDef: TodoNode = mmGQLInstance.def({
//     type: 'mock-todo',
//     properties: mockTodoProperties,
//     relational: {
//       assignee: () =>
//         reference<TodoNode, ThingNode>({
//           def: mockThingDef,
//           idProp: 'assigneeId',
//         }),
//     },
//   });

//   const mockUserDef = mmGQLInstance.def({
//     type: 'mock-user',
//     properties: mockUserProperties,
//   });

//   return {
//     mmGQLInstance,
//     token: tokenInfo.token,
//     userId: tokenInfo.id,
//     altToken: altTokenInfo?.token,
//     altUserId: altTokenInfo?.id,
//     mockThingDef,
//     mockTodoDef,
//     mockUserDef,
//   };
// }

// const TIMEOUT_MS = 150000;

// test(
//   'querying data from SM works',
//   async done => {
//     const { mmGQLInstance } = await setupTest();

//     const results = await mmGQLInstance.query(
//       createMockQueryDefinitions(mmGQLInstance, { useNoUnder: true })
//     );

//     // remove versions from results so that screenshots don't change with each test
//     // since those versions are auto incremented by SM on each update
//     expect(removeVersionsFromResults(results)).toMatchInlineSnapshot(`
//       Array [
//         Object {
//           "address": Object {
//             "apt": Object {
//               "floor": 0,
//               "number": 0,
//             },
//             "state": "",
//           },
//           "displayName": "User display name",
//           "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//           "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//           "todos": Array [
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "dcdce629-2b4d-4b0d-9a5a-317794e6fcdd",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "05293aaa-01a3-4f12-8752-60a59a18538e",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "0b51e699-6119-49ed-834f-a9463290ea97",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "e17dd2f1-329a-41f9-8f4c-0daa03f7d06b",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//           ],
//           "type": "user",
//           "version": null,
//         },
//       ]
//     `);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'subscribing to data from sm works',
//   async done => {
//     const { mmGQLInstance } = await setupTest();

//     const results = await mmGQLInstance.subscribe(
//       createMockQueryDefinitions(mmGQLInstance, { useNoUnder: true }),
//       {
//         onData: () => {},
//       }
//     );

//     expect(removeVersionsFromResults(results)).toMatchInlineSnapshot(`
//       Array [
//         Object {
//           "address": Object {
//             "apt": Object {
//               "floor": 0,
//               "number": 0,
//             },
//             "state": "",
//           },
//           "displayName": "User display name",
//           "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//           "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//           "todos": Array [
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "dcdce629-2b4d-4b0d-9a5a-317794e6fcdd",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "05293aaa-01a3-4f12-8752-60a59a18538e",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "0b51e699-6119-49ed-834f-a9463290ea97",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//             Object {
//               "assignee": Object {
//                 "displayName": "User display name",
//                 "firstName": "Meida",
//                 "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//                 "type": "user",
//                 "version": null,
//               },
//               "id": "e17dd2f1-329a-41f9-8f4c-0daa03f7d06b",
//               "lastUpdatedBy": "64829368-d8df-44a5-9fcc-af4a20e7b575",
//               "type": "todo",
//               "version": null,
//             },
//           ],
//           "type": "user",
//           "version": null,
//         },
//       ]
//     `);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'creating a single node in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode({
//           data: {
//             type: 'mock-thing',
//             number: timestamp,
//             string: 'mock string',
//           },
//         });

//         ctx.createNode({
//           data: {
//             type: 'mock-thing',
//             number: timestamp + 1,
//             string: 'mock string2',
//           },
//         });
//       })
//       .execute();

//     const id = transactionResult[0].data.CreateNodes[0].id as string;

//     const {
//       data: { thing },
//     } = await mmGQLInstance.query({
//       thing: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: { id },
//       }),
//     });

//     expect(thing.number).toBe(timestamp);
//     expect(thing.string).toBe('mock string');
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'creating multiple nodes in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp,
//                 string: 'mock string',
//               },
//             },
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp + 1,
//                 string: 'mock string 2',
//               },
//             },
//           ],
//         });
//       })
//       .execute();

//     const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
//       .CreateNodes as Array<{ id: string }>;

//     const {
//       data: { things },
//     } = await mmGQLInstance.query({
//       things: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: {
//           underIds: [id1, id2],
//         },
//       }),
//     });

//     expect(things.length).toBe(2);
//     expect(things[0].number).toBe(timestamp);
//     expect(things[0].string).toBe('mock string');
//     expect(things[1].number).toBe(timestamp + 1);
//     expect(things[1].string).toBe('mock string 2');
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'creating multiple nodes in multiple operations in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp,
//                 string: 'mock string',
//               },
//             },
//           ],
//         });

//         ctx.createNode({
//           data: {
//             id: '123',
//             type: 'mock-thing',
//             number: timestamp + 1,
//             string: 'mock string 2',
//           },
//         });
//       })
//       .execute();

//     const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
//       .CreateNodes as Array<{ id: string }>;

//     const {
//       data: { things },
//     } = await mmGQLInstance.query({
//       things: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: {
//           ids: [id1, id2],
//         },
//       }),
//     });

//     expect(things.length).toBe(2);
//     expect(things[0].number).toBe(timestamp);
//     expect(things[0].string).toBe('mock string');
//     expect(things[1].number).toBe(timestamp + 1);
//     expect(things[1].string).toBe('mock string 2');
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'updating a single node in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode({
//           data: {
//             type: 'mock-thing',
//             number: timestamp,
//             string: 'mock string',
//           },
//         });
//       })
//       .execute();

//     const id = transactionResult[0].data.CreateNodes[0].id as string;

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateNode({
//           data: {
//             id,
//             number: timestamp + 10,
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { thing },
//     } = await mmGQLInstance.query({
//       thing: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: { id },
//       }),
//     });

//     expect(thing.number).toBe(timestamp + 10);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'updating several nodes in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp,
//                 string: 'mock string',
//               },
//             },
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp + 1,
//                 string: 'mock string 2',
//               },
//             },
//           ],
//         });
//       })
//       .execute();

//     const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
//       .CreateNodes as Array<{ id: string }>;

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateNodes({
//           nodes: [
//             {
//               data: {
//                 id: id1,
//                 number: timestamp + 10,
//               },
//             },
//             { data: { id: id2, number: timestamp + 20 } },
//           ],
//         });
//       })
//       .execute();

//     const {
//       data: { thing },
//     } = await mmGQLInstance.query({
//       thing: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: {
//           ids: [id1, id2],
//         },
//       }),
//     });

//     expect(thing[0].number).toBe(timestamp + 10);
//     expect(thing[1].number).toBe(timestamp + 20);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'dropping a node in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode({
//           data: { type: 'mock-thing' },
//         });
//       })
//       .execute();

//     const id = transactionResult[0].data.CreateNodes[0].id as string;

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.dropNode({ id });
//       })
//       .execute();

//     try {
//       await mmGQLInstance.query(
//         {
//           thing: queryDefinition({
//             def: mockThingDef,
//             map: undefined,
//             target: { id },
//           }),
//         },
//         { queryId: 'mock-query' }
//       );
//       done(
//         new Error(
//           'Did not expect to find the node that was just dropped, but it was found'
//         )
//       );
//     } catch (e) {
//       expect(
//         (e as any).stack.includes(
//           `Error: DataParsing exception - Queried a node by id for the query with the id "mock-query" but received back an empty array`
//         )
//       ).toBe(true);
//       done();
//     }
//   },
//   TIMEOUT_MS
// );

// const createMockThingAndTodo = async (mmGQLInstance: IMMGQL) => {
//   const timestamp = new Date().valueOf();

//   const nodesTransaction = await mmGQLInstance
//     .transaction(ctx => {
//       ctx.createNodes({
//         nodes: [
//           {
//             data: {
//               type: 'mock-thing',
//               number: timestamp,
//               string: 'mock string',
//             },
//           },
//           {
//             data: {
//               type: 'mock-todo',
//               title: 'mock todo',
//               done: false,
//             },
//           },
//         ],
//       });
//     })
//     .execute();

//   const [thingId, todoId] = nodesTransaction[0].data.CreateNodes.map(
//     ({ id }: { id: string }) => id
//   );

//   return [thingId, todoId];
// };

// const createMockThingAndMultipleTodos = async (mmGQLInstance: IMMGQL) => {
//   const timestamp = new Date().valueOf();

//   const nodesTransaction = await mmGQLInstance
//     .transaction(ctx => {
//       ctx.createNodes({
//         nodes: [
//           {
//             data: {
//               type: 'mock-thing',
//               number: timestamp,
//               string: 'mock string',
//             },
//           },
//           {
//             data: {
//               type: 'mock-todo',
//               title: 'mock todo',
//               done: false,
//             },
//           },
//           {
//             data: {
//               type: 'mock-todo',
//               title: 'mock todo 2',
//               done: false,
//             },
//           },
//         ],
//       });
//     })
//     .execute();

//   const [thingId, todoId, todo2Id] = nodesTransaction[0].data.CreateNodes.map(
//     ({ id }: { id: string }) => id
//   );

//   return [thingId, todoId, todo2Id];
// };

// test(
//   'creating a single edge in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId] = await createMockThingAndTodo(mmGQLInstance);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdge({
//           edge: {
//             from: thingId,
//             to: todoId,
//             permissions: {
//               view: true,
//               edit: true,
//               addChild: true,
//             },
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { todo },
//     } = await mmGQLInstance.query({
//       todo: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: { underIds: [thingId] },
//       }),
//     });

//     expect(todo[0].id).toBe(todoId);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'creating multiple edges in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
//       mmGQLInstance
//     );

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//           {
//             edge: {
//               from: thingId,
//               to: todo2Id,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();

//     const {
//       data: { todo },
//     } = await mmGQLInstance.query({
//       todo: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: { underIds: [thingId] },
//       }),
//     });

//     expect(todo[0].id).toBe(todoId);
//     expect(todo[1].id).toBe(todo2Id);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'updating a single edge in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId] = await createMockThingAndTodo(mmGQLInstance);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdge({
//           edge: {
//             from: thingId,
//             to: todoId,
//             permissions: {
//               view: true,
//               edit: true,
//             },
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { todo },
//     } = await mmGQLInstance.query({
//       todo: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: { underIds: [thingId] },
//       }),
//     });

//     expect(todo[0].id).toBe(todoId);

//     const updateResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateEdge({
//           edge: {
//             from: thingId,
//             to: todoId,
//             permissions: {
//               view: true,
//               edit: false,
//             },
//           },
//         });
//       })
//       .execute();

//     expect(updateResult[0].data.UpdateEdge).toBe(1);

//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'updating multiple edges in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
//       mmGQLInstance
//     );

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//           {
//             edge: {
//               from: thingId,
//               to: todo2Id,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();

//     const {
//       data: { todo },
//     } = await mmGQLInstance.query({
//       todo: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: { underIds: [thingId] },
//       }),
//     });

//     expect(todo[0].id).toBe(todoId);

//     const updateResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: false,
//               },
//             },
//           },
//           {
//             edge: {
//               from: thingId,
//               to: todo2Id,
//               permissions: {
//                 view: true,
//                 edit: false,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();
//     expect(updateResult[0].data.UpdateEdge).toBe(1);
//     expect(updateResult[1].data.UpdateEdge).toBe(1);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'dropping a single edge in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId] = await createMockThingAndTodo(mmGQLInstance);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdge({
//           edge: {
//             from: thingId,
//             to: todoId,
//             permissions: {
//               view: true,
//               edit: true,
//               addChild: true,
//             },
//           },
//         });
//       })
//       .execute();

//     const queryTodoUnderThing = (thingId: string) => {
//       return mmGQLInstance.query({
//         todo: queryDefinition({
//           def: mockTodoDef,
//           map: undefined,
//           target: { underIds: [thingId] },
//         }),
//       });
//     };

//     const {
//       data: { todo },
//     } = await queryTodoUnderThing(thingId);

//     expect(todo[0].id).toBe(todoId);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.dropEdge({
//           edge: {
//             from: thingId,
//             to: todoId,
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { todo: todoAfterDrop },
//     } = await queryTodoUnderThing(thingId);

//     expect(todoAfterDrop).toEqual([]);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'dropping a multiple edges in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
//       mmGQLInstance
//     );

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//           {
//             edge: {
//               from: thingId,
//               to: todo2Id,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();

//     const queryTodosUnderThing = (thingId: string) => {
//       return mmGQLInstance.query({
//         todo: queryDefinition({
//           def: mockTodoDef,
//           map: undefined,
//           target: { underIds: [thingId] },
//         }),
//       });
//     };

//     const {
//       data: { todo },
//     } = await queryTodosUnderThing(thingId);

//     expect(todo[0].id).toBe(todoId);
//     expect(todo[1].id).toBe(todo2Id);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.dropEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//             },
//           },
//           { edge: { from: thingId, to: todo2Id } },
//         ]);
//       })
//       .execute();

//     const {
//       data: { todo: todosAfterDrop },
//     } = await queryTodosUnderThing(thingId);

//     expect(todosAfterDrop).toEqual([]);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'replacing a single edge in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
//       mmGQLInstance
//     );

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();

//     const queryTodoUnderThing = (thingId: string) => {
//       return mmGQLInstance.query({
//         todo: queryDefinition({
//           def: mockTodoDef,
//           map: undefined,
//           target: { underIds: [thingId] },
//         }),
//       });
//     };

//     const {
//       data: { todo },
//     } = await queryTodoUnderThing(thingId);

//     expect(todo[0].id).toBe(todoId);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.replaceEdge({
//           edge: {
//             current: thingId,
//             from: todo2Id,
//             to: todoId,
//             permissions: {
//               view: true,
//               edit: true,
//               addChild: true,
//             },
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { todo: todoAfterReplace },
//     } = await queryTodoUnderThing(thingId);
//     const { data: todosUnderOtherTodo } = await queryTodoUnderThing(todo2Id);

//     expect(todoAfterReplace).toEqual([]);
//     expect(todosUnderOtherTodo.todo.map(({ id }) => id)).toContain(todoId);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'replacing multiple edges in sm works',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();
//     const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
//       mmGQLInstance
//     );

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createEdges([
//           {
//             edge: {
//               from: thingId,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//           {
//             edge: {
//               from: thingId,
//               to: todo2Id,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();

//     const queryTodoUnderThing = (thingId: string) => {
//       return mmGQLInstance.query({
//         todo: queryDefinition({
//           def: mockTodoDef,
//           map: undefined,
//           target: { underIds: [thingId] },
//         }),
//       });
//     };

//     const {
//       data: { todo },
//     } = await queryTodoUnderThing(thingId);

//     expect(todo[0].id).toBe(todoId);
//     expect(todo[1].id).toBe(todo2Id);

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.replaceEdges([
//           {
//             edge: {
//               current: thingId,
//               from: todo2Id,
//               to: todoId,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//           {
//             edge: {
//               current: thingId,
//               from: todoId,
//               to: todo2Id,
//               permissions: {
//                 view: true,
//                 edit: true,
//                 addChild: true,
//               },
//             },
//           },
//         ]);
//       })
//       .execute();

//     const {
//       data: { todo: todoAfterReplace },
//     } = await queryTodoUnderThing(thingId);
//     const { data: todosUnderOtherTodo } = await queryTodoUnderThing(todo2Id);
//     const todoIds = todosUnderOtherTodo.todo.map(({ id }) => id);

//     expect(todoAfterReplace).toEqual([]);
//     expect(todoIds).toContain(todoId);
//     expect(todoIds).toContain(todo2Id);
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'dropping a property in sm works',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp,
//                 string: 'mock string',
//                 object: {
//                   property: 'value',
//                   otherProperty: 'otherValue',
//                   nestedObject: {
//                     nestedProperty: 'nestedValue',
//                   },
//                 },
//               },
//             },
//           ],
//         });
//       })
//       .execute();

//     const createdThingId = transactionResult[0].data.CreateNodes[0]
//       .id as string;

//     const {
//       data: { thing },
//     } = await mmGQLInstance.query({
//       thing: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: { id: createdThingId },
//       }),
//     });

//     expect(thing.object?.property).toBe('value');

//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateNode({
//           data: {
//             id: createdThingId,
//             object: {
//               property: null,
//               nestedObject: null,
//             },
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { thingAfterDrop },
//     } = await mmGQLInstance.query({
//       thingAfterDrop: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: { id: createdThingId },
//       }),
//     });

//     expect(thingAfterDrop.object?.property).toBe('');
//     expect(thingAfterDrop.object?.nestedObject).toBe(null);
//     expect(thingAfterDrop.object?.otherProperty).toBe('otherValue');
//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'dropping an object will drop all the properties',
//   async done => {
//     const { mmGQLInstance, mockThingDef } = await setupTest();
//     const timestamp = new Date().valueOf();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: 'mock-thing',
//                 number: timestamp,
//                 string: 'mock string',
//                 object: {
//                   property: 'value',
//                   otherProperty: 'otherValue',
//                   nestedObject: {
//                     nestedProperty: 'nestedValue',
//                   },
//                 },
//               },
//             },
//           ],
//         });
//       })
//       .execute();

//     const createdThingId = transactionResult[0].data.CreateNodes[0]
//       .id as string;

//     const {
//       data: { thing },
//     } = await mmGQLInstance.query({
//       thing: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: { id: createdThingId },
//       }),
//     });

//     expect(thing.object?.property).toBe('value');
//     expect(thing.object?.nestedObject?.nestedProperty).toBe('nestedValue');
//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateNode({
//           data: {
//             id: createdThingId,
//             object: null,
//           },
//         });
//       })
//       .execute();

//     const {
//       data: { thingAfterDrop },
//     } = await mmGQLInstance.query({
//       thingAfterDrop: queryDefinition({
//         def: mockThingDef,
//         map: undefined,
//         target: { id: createdThingId },
//       }),
//     });

//     expect(thingAfterDrop.object).toBe(null);

//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   'grouped transactions work as expected',
//   async () => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();

//     const onSuccessMock = jest.fn();

//     const createTodo = ({ title, done }: { title: string; done: boolean }) => {
//       return mmGQLInstance.transaction(ctx => {
//         ctx.createNode({
//           data: {
//             type: 'mock-todo',
//             title,
//             done,
//           },
//           onSuccess: onSuccessMock,
//         });
//       });
//     };

//     const createTodos = (todos: Array<{ title: string; done: boolean }>) => {
//       return mmGQLInstance.transaction(todos.map(createTodo));
//     };

//     const transactionResult = await createTodos([
//       { title: 'todo 1', done: false },
//       { title: 'todo 2', done: true },
//     ]).execute();

//     const [id1, id2] = transactionResult.map(
//       ({
//         data,
//       }: {
//         data: { CreateNodes: Array<{ id: string; __typename: string }> };
//       }) => data.CreateNodes[0].id
//     );

//     const {
//       data: { todos },
//     } = await mmGQLInstance.query({
//       todos: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: { ids: [id1, id2] },
//       }),
//     });

//     expect(todos[0].title).toBe('todo 1');
//     expect(todos[1].title).toBe('todo 2');
//     expect(onSuccessMock).toHaveBeenCalledTimes(2);
//   },
//   TIMEOUT_MS
// );

// test(
//   'optimistic updates work',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await setupTest();

//     const transactionResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: mockTodoDef.type,
//                 title: 'Do the deed',
//               },
//             },
//           ],
//         });
//       })
//       .execute();

//     const createdTodoId = transactionResult[0].data.CreateNodes[0].id as string;

//     const {
//       data: { todo },
//     } = await mmGQLInstance.query({
//       todo: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: { id: createdTodoId },
//       }),
//     });

//     expect(todo.title).toBe('Do the deed');

//     mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateNode({
//           data: {
//             id: createdTodoId,
//             title: 'Do the other deed',
//           },
//         });
//       })
//       .execute();

//     // DO is immediately update
//     // even though this was a query with no associated subscription

//     // this is as good of an E2E test as I can think of for this particular feature
//     // We'll need to rely on the unit tests within OptimisticUpdates.spec for any other edge case testing
//     expect(todo.title).toBe('Do the other deed');

//     done();
//   },
//   TIMEOUT_MS
// );

// test(
//   '#ref_ foreign keys work',
//   async () => {
//     const {
//       mmGQLInstance,
//       mockTodoDef,
//       mockThingDef,
//       mockUserDef,
//     } = await setupTest();

//     const tx = await mmGQLInstance
//       .transaction(ctx => {
//         const thingId = 'thing';
//         ctx.createNodes({
//           nodes: [
//             {
//               data: {
//                 type: mockUserDef.type,
//                 name: 'Joe',
//                 additionalEdges: [
//                   {
//                     to: `#ref_${thingId}`,
//                     view: true,
//                     edit: true,
//                     manage: true,
//                   },
//                 ],
//               },
//             },
//             {
//               data: {
//                 id: thingId,
//                 type: mockThingDef.type,
//                 number: 1,
//                 string: 'hi',
//                 childNodes: [
//                   {
//                     type: mockTodoDef.type,
//                     title: 'todo',
//                     done: false,
//                     assigneeId: `#ref_${thingId}`,
//                   },
//                   {
//                     id: 'mockTodo',
//                     type: mockTodoDef.type,
//                     title: 'todo2',
//                     done: false,
//                     assigneeId: `#ref_${thingId}`,
//                   },
//                 ],
//               },
//             },
//           ],
//         });
//       })
//       .execute();
//     const createdUserId = tx[0].data.CreateNodes[0].id;

//     const createdThingId = tx[0].data.CreateNodes[1].id;

//     const {
//       data: { thingsUnderUser },
//     } = await mmGQLInstance.query({
//       thingsUnderUser: queryDefinition({
//         def: mockThingDef,
//         target: { underIds: [createdUserId] },
//         map: ({ id }) => ({ id }),
//       }),
//     });

//     const {
//       data: { thing },
//     } = await mmGQLInstance.query({
//       thing: queryDefinition({
//         def: mockThingDef,
//         map: ({ id, todos, number, string }) => ({
//           id,
//           number,
//           string,
//           todos: todos({
//             map: ({ id, title, done, assigneeId }) => ({
//               id,
//               title,
//               done,
//               assigneeId,
//             }),
//           }),
//         }),
//         target: { id: createdThingId },
//       }),
//     });

//     expect(thingsUnderUser[0].id).toBe(createdThingId);
//     expect(thing.todos.length).toBe(2);

//     thing.todos.forEach(todo => {
//       expect(todo.assigneeId).toBe(createdThingId);
//     });
//   },
//   TIMEOUT_MS
// );

// test(
//   'querying an id for the wrong node type throws an error',
//   async done => {
//     const { mmGQLInstance, mockTodoDef, mockThingDef } = await setupTest();
//     try {
//       const tx = await mmGQLInstance
//         .transaction(ctx => {
//           ctx.createNodes({
//             nodes: [
//               {
//                 data: {
//                   type: mockTodoDef.type,
//                   title: 'todo',
//                 },
//               },
//               {
//                 data: {
//                   type: mockThingDef.type,
//                   string: 'hi',
//                   number: 2,
//                 },
//               },
//             ],
//           });
//         })
//         .execute();

//       const [{ id: todoId }] = tx[0].data.CreateNodes as Array<{
//         id: string;
//       }>;

//       await mmGQLInstance.query({
//         thing: queryDefinition({
//           def: mockThingDef,
//           map: undefined,
//           target: { id: todoId },
//         }),
//       });
//     } catch (e) {
//       expect(
//         (e as any).stack.includes(
//           'Attempted to query a node with an id belonging to a different type - Expected: mock-thing Received: mock-todo'
//         )
//       ).toEqual(true);
//       done();
//     }
//   },
//   TIMEOUT_MS
// );

// type MockNodeType = INode<
//   'mock-node',
//   { todoOrThingId: typeof string },
//   {},
//   {
//     todoOrThing: IByReferenceQueryBuilder<
//       MockNodeType,
//       { todo: TodoNode; thing: ThingNode }
//     >;
//   }
// >;
// async function getReferenceTestUtils() {
//   const { mmGQLInstance, mockTodoDef, mockThingDef } = await setupTest();

//   const mockNodeDef: MockNodeType = mmGQLInstance.def({
//     type: 'mock-node',
//     properties: {
//       todoOrThingId: string,
//     },
//     relational: {
//       todoOrThing: () =>
//         reference<MockNodeType, { todo: TodoNode; thing: ThingNode }>({
//           idProp: 'todoOrThingId',
//           def: { todo: mockTodoDef, thing: mockThingDef },
//         }),
//     },
//   });

//   const todoTitle = 'get it done';
//   async function createTodo() {
//     const txResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode({
//           data: {
//             type: mockTodoDef.type,
//             title: todoTitle,
//           },
//         });
//       })
//       .execute();

//     const [{ id: todoId }] = txResult[0].data.CreateNodes as Array<{
//       id: string;
//     }>;
//     return todoId;
//   }

//   async function createMockNode(todoOrThingId: string) {
//     const txResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode<MockNodeType>({
//           data: {
//             type: mockNodeDef.type,
//             todoOrThingId,
//           },
//         });
//       })
//       .execute();

//     const [{ id: mockNodeId }] = txResult[0].data.CreateNodes as Array<{
//       id: string;
//     }>;

//     return mockNodeId;
//   }

//   const mockThingString = 'some mock string';

//   async function createThing() {
//     const txResult3 = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode<ThingNode>({
//           data: {
//             type: mockThingDef.type,
//             string: mockThingString,
//           },
//         });
//       })
//       .execute();

//     const [{ id: mockThingId }] = txResult3[0].data.CreateNodes as Array<{
//       id: string;
//     }>;

//     return mockThingId;
//   }

//   async function updateMockNode(opts: {
//     mockNodeId: string;
//     todoOrThingId: string;
//   }) {
//     await mmGQLInstance
//       .transaction(ctx => {
//         ctx.updateNode<MockNodeType>({
//           data: {
//             id: opts.mockNodeId,
//             todoOrThingId: opts.todoOrThingId,
//           },
//         });
//       })
//       .execute();
//   }

//   function getQD(mockNodeId: string) {
//     return queryDefinition({
//       def: mockNodeDef,
//       map: ({ todoOrThingId, todoOrThing }) => ({
//         todoOrThingId,
//         todoOrThing: todoOrThing({
//           thing: {
//             map: thingData => thingData,
//           },
//           todo: {
//             map: todoData => todoData,
//           },
//         }),
//       }),
//       target: {
//         id: mockNodeId,
//       },
//     });
//   }

//   return {
//     todoTitle,
//     createTodo,
//     mockNodeDef,
//     createMockNode,
//     getQD,
//     mmGQLInstance,
//     mockTodoDef,
//     mockThingDef,
//     createThing,
//     mockThingString,
//     updateMockNode,
//   };
// }

// test(
//   'reference unions work',
//   async () => {
//     const {
//       createTodo,
//       todoTitle,
//       createMockNode,
//       getQD,
//       mmGQLInstance,
//       mockTodoDef,
//       mockThingDef,
//       createThing,
//       mockThingString,
//       updateMockNode,
//     } = await getReferenceTestUtils();

//     const todoId = await createTodo();
//     const mockNodeId = await createMockNode(todoId);
//     const result = await mmGQLInstance.query({
//       mockNode: getQD(mockNodeId),
//     });

//     expect(result.data.mockNode.todoOrThing.type).toBe(mockTodoDef.type);
//     if (result.data.mockNode.todoOrThing.type === mockTodoDef.type) {
//       expect(result.data.mockNode.todoOrThing.title).toBe(todoTitle);
//     }

//     const thingId = await createThing();
//     await updateMockNode({ mockNodeId, todoOrThingId: thingId });
//     const result2 = await mmGQLInstance.query({
//       mockNode: getQD(mockNodeId),
//     });

//     expect(result2.data.mockNode.todoOrThing.type).toBe(mockThingDef.type);
//     if (result2.data.mockNode.todoOrThing.type === mockThingDef.type) {
//       expect(result2.data.mockNode.todoOrThing.string).toBe(mockThingString);
//     }

//     await updateMockNode({
//       mockNodeId,
//       todoOrThingId: (null as unknown) as string,
//     });

//     const result3 = await mmGQLInstance.query({
//       mockNode: getQD(mockNodeId),
//     });

//     expect(result3.data.mockNode.todoOrThing).toBe(undefined);
//   },
//   TIMEOUT_MS
// );

// test(
//   'reference unions have their updates applied correctly',
//   async done => {
//     const {
//       createTodo,
//       createMockNode,
//       getQD,
//       mmGQLInstance,
//       mockTodoDef,
//       mockThingDef,
//       createThing,
//       updateMockNode,
//     } = await getReferenceTestUtils();

//     const todoId = await createTodo();
//     const mockNodeId = await createMockNode(todoId);

//     let subDataIdx = 0;
//     const sub = await mmGQLInstance.subscribe(
//       {
//         mockNode: getQD(mockNodeId),
//       },
//       {
//         onData: ({ results }) => {
//           try {
//             if (subDataIdx === 0) {
//               expect(results.mockNode.todoOrThing.type).toBe(mockTodoDef.type);
//             } else if (subDataIdx === 1) {
//               expect(results.mockNode.todoOrThing.type).toBe(mockThingDef.type);
//             } else if (subDataIdx === 2) {
//               expect(results.mockNode.todoOrThing).toBe(undefined);
//               sub.unsub();
//               done();
//             }
//             subDataIdx++;
//           } catch (e) {
//             done(e);
//           }
//         },
//         onError: e => done(e),
//       }
//     );

//     const thingId = await createThing();
//     await updateMockNode({ mockNodeId, todoOrThingId: thingId });

//     await updateMockNode({
//       mockNodeId,
//       todoOrThingId: (null as unknown) as string,
//     });
//   },
//   TIMEOUT_MS
// );

// test(
//   'reference arrays work',
//   async done => {
//     const { mmGQLInstance } = await setupTest();

//     const childNode = mmGQLInstance.def({
//       type: 'mock-child',
//       properties: {
//         id: string,
//         foo: string,
//       },
//     });

//     const parentNodeProperties = {
//       children: array(string),
//       // for testing the result of referenceArray when used against a null field
//       childrenLeftEmpty: array(string),
//     };
//     type ParentNode = INode<
//       'mock-parent',
//       typeof parentNodeProperties,
//       {},
//       {
//         childrenInReference: IByReferenceArrayQueryBuilder<
//           ParentNode,
//           typeof childNode
//         >;
//         childrenLeftEmptyInReference: IByReferenceArrayQueryBuilder<
//           ParentNode,
//           typeof childNode
//         >;
//       }
//     >;
//     const parentNode: ParentNode = mmGQLInstance.def({
//       type: 'mock-parent',
//       properties: parentNodeProperties,
//       relational: {
//         childrenInReference: () =>
//           referenceArray<ParentNode, typeof childNode>({
//             def: childNode,
//             idProp: 'children',
//           }),
//         childrenLeftEmptyInReference: () =>
//           referenceArray<ParentNode, typeof childNode>({
//             def: childNode,
//             idProp: 'childrenLeftEmpty',
//           }),
//       },
//     });

//     const txResult = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode({
//           data: {
//             type: parentNode.type,
//             childNodes: ['mock foo 1', 'mock foo 2'].map(
//               (mockFooString, mockFooIdx) => ({
//                 id: `mockFoo${mockFooIdx}`,
//                 type: childNode.type,
//                 foo: mockFooString,
//               })
//             ),
//             children: ['#ref_mockFoo0', '#ref_mockFoo1'],
//           },
//         });
//       })
//       .execute();

//     const parentId = txResult[0].data.CreateNodes[0].id;

//     let resultsIteration = 0;
//     const subResult = await mmGQLInstance.subscribe(
//       {
//         parent: queryDefinition({
//           def: parentNode,
//           map: ({
//             children,
//             childrenInReference,
//             childrenLeftEmptyInReference,
//           }) => ({
//             children,
//             childrenInReference: childrenInReference({
//               map: ({ foo }) => ({ foo }),
//             }),
//             childrenLeftEmptyInReference: childrenLeftEmptyInReference({
//               map: ({ foo }) => ({ foo }),
//             }),
//           }),
//           target: {
//             id: parentId,
//           },
//         }),
//       },
//       {
//         onData: async ({ results }) => {
//           if (resultsIteration === 0) {
//             expect(results.parent.children.length).toBe(2);
//             expect(
//               results.parent.children.every(
//                 childId => typeof childId === 'string'
//               )
//             );
//             expect(results.parent.childrenInReference.length).toBe(2);
//             // we left this property null, and here verify that we get back no results
//             expect(results.parent.childrenLeftEmptyInReference.length).toBe(0);
//             mmGQLInstance
//               .transaction(ctx => {
//                 ctx.updateNode({
//                   data: {
//                     id: parentId,
//                     children: [results.parent.children[0]], // keep only the first child
//                   },
//                 });
//               })
//               .execute();
//           } else if (resultsIteration === 1) {
//             expect(results.parent.childrenInReference.length).toBe(1);

//             const txResult = await mmGQLInstance
//               .transaction(ctx => {
//                 ctx.createNode({
//                   data: {
//                     type: childNode.type,
//                     foo: 'mock foo 3',
//                   },
//                 });
//               })
//               .execute();
//             const newChildId = txResult[0].data.CreateNodes[0].id;

//             mmGQLInstance
//               .transaction(ctx => {
//                 ctx.updateNode({
//                   data: {
//                     id: parentId,
//                     children: [results.parent.children[0], newChildId],
//                   },
//                 });
//               })
//               .execute();
//           } else if (resultsIteration === 2) {
//             expect(results.parent.childrenInReference.length).toBe(2);
//             // this test sometimes fails, because the children are returned in the wrong order
//             // https://winterinternational.slack.com/archives/C02KK3VE6MR/p1650991967898839
//             // expect(results.parent.childrenInReference[1].foo).toBe(
//             //   'mock foo 3'
//             // );
//             done();
//             subResult.unsub();
//           }
//           resultsIteration++;
//         },
//       }
//     );
//   },
//   TIMEOUT_MS
// );

// test(
//   'child data works and updates in real time',
//   async done => {
//     const { mmGQLInstance, mockTodoDef } = await getReferenceTestUtils();

//     const mockTodoGroupNode = mmGQLInstance.def({
//       type: 'mock-todo-group',
//       properties: {},
//       relational: {
//         todos: () => children({ def: mockTodoDef }),
//       },
//     });

//     const response = await mmGQLInstance
//       .transaction(ctx => {
//         ctx.createNode<typeof mockTodoGroupNode>({
//           data: {
//             type: mockTodoGroupNode.type,
//           },
//         });
//       })
//       .execute();

//     const mockTodoGroupNodeId = response[0].data.CreateNodes[0].id;

//     let iteration = 0;
//     const { unsub } = await mmGQLInstance.subscribe(
//       {
//         todoGroup: queryDefinition({
//           def: mockTodoGroupNode,
//           target: {
//             id: mockTodoGroupNodeId,
//           },
//           map: ({ todos }) => ({
//             todos: todos({
//               map: allData => allData,
//             }),
//           }),
//         }),
//       },
//       {
//         onData: ({ results }) => {
//           if (iteration === 0) {
//             expect(results.todoGroup.todos.length).toBe(0);
//             // create todo under the group

//             mmGQLInstance
//               .transaction(ctx => {
//                 ctx.createNode({
//                   data: {
//                     type: mockTodoDef.type,
//                   },
//                   under: mockTodoGroupNodeId,
//                 });
//               })
//               .execute();
//           } else if (iteration === 1) {
//             expect(results.todoGroup.todos.length).toBe(1);
//             expect(typeof results.todoGroup.todos[0].id).toBe('string');

//             mmGQLInstance
//               .transaction(ctx => {
//                 ctx.createNode({
//                   data: {
//                     type: mockTodoDef.type,
//                   },
//                   under: mockTodoGroupNodeId,
//                 });
//               })
//               .execute();
//           } else if (iteration === 2) {
//             expect(results.todoGroup.todos.length).toBe(2);
//             expect(typeof results.todoGroup.todos[1].id).toBe('string');

//             unsub();
//             done();
//           }
//           iteration++;
//         },
//       }
//     );
//   },
//   TIMEOUT_MS
// );

// test(
//   'querying by id and receiving back null is allowed, if the query definition is configured to do so',
//   async () => {
//     const { mmGQLInstance, mockTodoDef } = await getReferenceTestUtils();

//     const response = await mmGQLInstance.query({
//       todo: queryDefinition({
//         def: mockTodoDef,
//         map: undefined,
//         target: {
//           id: 'some-bogus-id',
//           allowNullResult: true,
//         },
//       }),
//     });

//     expect(response.data.todo).toBe(null);
//   },
//   TIMEOUT_MS
// );

// test(
//   'losing view access to a node being queried causes the subscription to return null',
//   async done => {
//     const { mmGQLInstance, userId, mockThingDef, altUserId } = await setupTest();

//     if (!altUserId) done(new Error('No alt user id found'));

//     const transactionResult = await mmGQLInstance
//       .transaction(
//         ctx => {
//           ctx.createNode({
//             data: {
//               type: mockThingDef.type,
//             },
//             under: [altUserId as string, userId],
//           });
//         },
//         { tokenName: ALT_TOKEN_NAME }
//       )
//       .execute();

//     const thingId = transactionResult[0].data.CreateNodes[0].id as string;

//     let iterationIdx = 0;
//     const subResult = await mmGQLInstance.subscribe(
//       {
//         thing: queryDefinition({
//           def: mockThingDef,
//           map: undefined,
//           target: {
//             id: thingId,
//             allowNullResult: true,
//           },
//         }),
//       },
//       {
//         onData: ({ results }) => {
//           if (iterationIdx === 0) {
//             expect(results.thing).not.toBe(null);
//             mmGQLInstance
//               .transaction(
//                 ctx => {
//                   ctx.dropEdge({
//                     edge: {
//                       from: userId,
//                       to: thingId,
//                     },
//                   });
//                 },
//                 { tokenName: ALT_TOKEN_NAME }
//               )
//               .execute();
//           }

//           if (results.thing == null) {
//             done();
//             subResult.unsub();
//           }

//           iterationIdx++;
//         },
//       }
//     );
//   },
//   TIMEOUT_MS
// );

// test('querying with a null queryDefinition returns null and performs no actual queries', async () => {
//   const { mmGQLInstance } = await getReferenceTestUtils();
//   mmGQLInstance.gqlClient.query = jest.fn();
//   const { data } = await mmGQLInstance.query({
//     test: null,
//   });
//   expect(data.test).toBe(null);
//   expect(mmGQLInstance.gqlClient.query).not.toHaveBeenCalled();
// });

// test('subscribing with a null queryDefinition returns null and performs no actual queries or subscriptions', async done => {
//   const { mmGQLInstance } = await getReferenceTestUtils();
//   mmGQLInstance.gqlClient.query = jest.fn();
//   mmGQLInstance.gqlClient.subscribe = jest.fn();
//   const subscriptionResult = await mmGQLInstance.subscribe(
//     {
//       test: null,
//     },
//     {
//       onData: ({ results }) => {
//         expect(results.test).toBe(null);
//         expect(mmGQLInstance.gqlClient.query).not.toHaveBeenCalled();
//         expect(mmGQLInstance.gqlClient.subscribe).not.toHaveBeenCalled();
//         done();
//         setTimeout(() => subscriptionResult.unsub());
//       },
//     }
//   );
// });

// test(
//   'querying with a mix of null and non null queryDefinitions produces the expected results',
//   async () => {
//     const { mmGQLInstance } = await getReferenceTestUtils();
//     const { data } = await mmGQLInstance.query({
//       ...createMockQueryDefinitions(mmGQLInstance),
//       test: null,
//     });
//     expect(data.test).toBe(null);
//     expect(data.users).toBeInstanceOf(Array);
//   },
//   TIMEOUT_MS
// );

// test(
//   'subscribing with a mix of null and non null queryDefinitions produces the expected results',
//   async done => {
//     const { mmGQLInstance } = await getReferenceTestUtils();
//     const subscriptionResult = await mmGQLInstance.subscribe(
//       {
//         ...createMockQueryDefinitions(mmGQLInstance),
//         test: null,
//       },
//       {
//         onData: ({ results }) => {
//           expect(results.test).toBe(null);
//           expect(results.users).toBeInstanceOf(Array);
//           setTimeout(() => subscriptionResult.unsub());
//           done();
//         },
//       }
//     );
//   },
//   TIMEOUT_MS
// );

// async function getToken(opts: {
//   authUrl: string;
//   email: string;
//   password: string;
// }): Promise<{ token: string; id: string }> {
//   const data = await fetch(opts.authUrl, {
//     method: 'POST',
//     headers: {
//       applicationid: env.applicationId || '1',
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       email: opts.email,
//       password: opts.password,
//       timeZone: null,
//     }),
//   })
//     .then((res: any) => {
//       return res.json();
//     })
//     .catch(console.log);

//   if (!data.orgUserToken) throw Error('Failed to get token');
//   return {
//     token: data.orgUserToken,
//     id: data.orgUserId,
//   };
// }
