import {
  SMJS,
  number,
  queryDefinition,
  string,
  children,
  boolean,
  getDefaultConfig,
} from '.';
import { createMockQueryDefinitions } from './specUtilities';

function removeVersionsFromResults(results: any) {
  return results.data.users.map((user: any) => ({
    ...user,
    version: null,
    todos: user.todos.map((todo: any) => ({
      ...todo,
      version: null,
      assignee: {
        ...todo.assignee,
        version: null,
      },
    })),
  }));
}

async function setupTest() {
  const smJSInstance = new SMJS(getDefaultConfig());

  const token = await getToken();
  smJSInstance.setToken({ tokenName: 'default', token });

  const mockThingDef: any = smJSInstance.def({
    type: 'mock-thing',
    properties: {
      id: string,
      number: number,
      string: string,
    },
    relational: {
      todos: () => children({ def: mockTodoDef }),
    },
  });

  const mockTodoDef = smJSInstance.def({
    type: 'mock-todo',
    properties: {
      id: string,
      title: string,
      done: boolean(false),
    },
  });

  return { smJSInstance, token, mockThingDef, mockTodoDef };
}

test('querying data from SM works', async done => {
  const { smJSInstance } = await setupTest();

  const results = await smJSInstance.query(
    createMockQueryDefinitions(smJSInstance, { useNoUnder: true })
  );

  expect(removeVersionsFromResults(results)).toMatchInlineSnapshot(`
    Array [
      Object {
        "address": Object {
          "apt": Object {
            "floor": 0,
            "number": 0,
          },
          "state": "",
        },
        "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
        "todos": Array [
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "dcdce629-2b4d-4b0d-9a5a-317794e6fcdd",
            "version": null,
          },
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "05293aaa-01a3-4f12-8752-60a59a18538e",
            "version": null,
          },
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "0b51e699-6119-49ed-834f-a9463290ea97",
            "version": null,
          },
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "e17dd2f1-329a-41f9-8f4c-0daa03f7d06b",
            "version": null,
          },
        ],
        "version": null,
      },
    ]
  `);
  done();
});

test('subscribing to data from sm works', async done => {
  const { smJSInstance } = await setupTest();

  const results = await smJSInstance.subscribe(
    createMockQueryDefinitions(smJSInstance, { useNoUnder: true }),
    {
      onData: () => {},
    }
  );

  expect(removeVersionsFromResults(results)).toMatchInlineSnapshot(`
    Array [
      Object {
        "address": Object {
          "apt": Object {
            "floor": 0,
            "number": 0,
          },
          "state": "",
        },
        "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
        "todos": Array [
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "dcdce629-2b4d-4b0d-9a5a-317794e6fcdd",
            "version": null,
          },
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "05293aaa-01a3-4f12-8752-60a59a18538e",
            "version": null,
          },
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "0b51e699-6119-49ed-834f-a9463290ea97",
            "version": null,
          },
          Object {
            "assignee": Object {
              "firstName": "Meida",
              "id": "64829368-d8df-44a5-9fcc-af4a20e7b575",
              "version": null,
            },
            "id": "e17dd2f1-329a-41f9-8f4c-0daa03f7d06b",
            "version": null,
          },
        ],
        "version": null,
      },
    ]
  `);
  done();
});

test('creating a single node in sm works', async done => {
  const { smJSInstance, mockThingDef } = await setupTest();
  const timestamp = new Date().valueOf();

  const transactionResult = await smJSInstance.transaction(ctx => {
    ctx.createNode({
      data: { type: 'mock-thing', number: timestamp, string: 'mock string' },
    });
  });

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  const {
    data: { thing },
  } = await smJSInstance.query({
    thing: queryDefinition({
      def: mockThingDef,
      id,
    }),
  });

  expect((thing as any).number).toBe(timestamp);
  expect((thing as any).string).toBe('mock string');
  done();
});

test('creating multiple nodes in sm works', async done => {
  const { smJSInstance, mockThingDef } = await setupTest();
  const timestamp = new Date().valueOf();

  const transactionResult = await smJSInstance.transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
          },
        },
        {
          data: {
            type: 'mock-thing',
            number: timestamp + 1,
            string: 'mock string 2',
          },
        },
      ],
    });
  });

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  const {
    data: { things },
  } = await smJSInstance.query({
    things: queryDefinition({
      def: mockThingDef,
      ids: [id1, id2],
    }),
  });

  expect(things.length).toBe(2);
  expect(things[0].number).toBe(timestamp);
  expect(things[0].string).toBe('mock string');
  expect(things[1].number).toBe(timestamp + 1);
  expect(things[1].string).toBe('mock string 2');
  done();
});

test('updating a single node in sm works', async done => {
  const { smJSInstance, mockThingDef } = await setupTest();
  const timestamp = new Date().valueOf();

  const transactionResult = await smJSInstance.transaction(ctx => {
    ctx.createNode({
      data: { type: 'mock-thing', number: timestamp, string: 'mock string' },
    });
  });

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  await smJSInstance.transaction(ctx => {
    ctx.updateNode({
      data: {
        id,
        number: timestamp + 10,
      },
    });
  });

  const {
    data: { thing },
  } = await smJSInstance.query({
    thing: queryDefinition({
      def: mockThingDef,
      id,
    }),
  });

  expect((thing as any).number).toBe(timestamp + 10);
  done();
});

test('updating several nodes in sm works', async done => {
  const { smJSInstance, mockThingDef } = await setupTest();
  const timestamp = new Date().valueOf();

  const transactionResult = await smJSInstance.transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
          },
        },
        {
          data: {
            type: 'mock-thing',
            number: timestamp + 1,
            string: 'mock string 2',
          },
        },
      ],
    });
  });

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  await smJSInstance.transaction(ctx => {
    ctx.updateNodes({
      nodes: [
        {
          id: id1,
          number: timestamp + 10,
        },
        { id: id2, number: timestamp + 20 },
      ],
    });
  });

  const {
    data: { thing },
  } = await smJSInstance.query({
    thing: queryDefinition({
      def: mockThingDef,
      ids: [id1, id2],
    }),
  });

  expect(thing[0].number).toBe(timestamp + 10);
  expect(thing[1].number).toBe(timestamp + 20);
  done();
});

test('dropping a node in sm works', async done => {
  const { smJSInstance, mockThingDef } = await setupTest();

  const transactionResult = await smJSInstance.transaction(ctx => {
    ctx.createNode({
      data: { type: 'mock-thing' },
    });
  });

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  await smJSInstance.transaction(ctx => {
    ctx.dropNode({ id });
  });

  try {
    await smJSInstance.query(
      {
        thing: queryDefinition({
          def: mockThingDef,
          id,
        }),
      },
      { queryId: 'mock-query' }
    );
    done(
      new Error(
        'Did not expect to find the node that was just dropped, but it was found'
      )
    );
  } catch (e) {
    expect(e).toMatchInlineSnapshot(`
      [Error: Error querying data
      Error: Error applying query results
      Error: SMDataParsing exception - Queried a node by id for the query with the id "mock-query" but received back an empty array
      Data: [].]
    `);
    done();
  }
});

const createMockThingAndTodo = async (smJSInstance: ISMJS) => {
  const timestamp = new Date().valueOf();

  const nodesTransaction = await smJSInstance.transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
          },
        },
        {
          data: {
            type: 'mock-todo',
            title: 'mock todo',
            done: false,
          },
        },
      ],
    });
  });

  const [thingId, todoId] = nodesTransaction[0].data.CreateNodes.map(
    ({ id }: { id: string }) => id
  );

  return [thingId, todoId];
};

const createMockThingAndMultipleTodos = async (smJSInstance: ISMJS) => {
  const timestamp = new Date().valueOf();

  const nodesTransaction = await smJSInstance.transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
          },
        },
        {
          data: {
            type: 'mock-todo',
            title: 'mock todo',
            done: false,
          },
        },
        {
          data: {
            type: 'mock-todo',
            title: 'mock todo 2',
            done: false,
          },
        },
      ],
    });
  });

  const [thingId, todoId, todo2Id] = nodesTransaction[0].data.CreateNodes.map(
    ({ id }: { id: string }) => id
  );

  return [thingId, todoId, todo2Id];
};

test('creating a single edge in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId] = await createMockThingAndTodo(smJSInstance);

  await smJSInstance.transaction(ctx => {
    ctx.createEdge({
      edge: {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    });
  });

  const {
    data: { todo },
  } = await smJSInstance.query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);
  done();
});

test('creating multiple edges in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
    smJSInstance
  );

  await smJSInstance.transaction(ctx => {
    ctx.createEdges([
      {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
      {
        from: thingId,
        to: todo2Id,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    ]);
  });

  const {
    data: { todo },
  } = await smJSInstance.query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);
  expect(todo[1].id).toBe(todo2Id);
  done();
});

test('updating a single edge in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId] = await createMockThingAndTodo(smJSInstance);

  await smJSInstance.transaction(ctx => {
    ctx.createEdge({
      edge: {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
        },
      },
    });
  });

  const {
    data: { todo },
  } = await smJSInstance.query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);

  const updateResult = await smJSInstance.transaction(ctx => {
    ctx.updateEdge({
      edge: {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: false,
        },
      },
    });
  });
  expect(updateResult[0].data.UpdateEdge).toBe(1);

  done();
});

test('updating multiple edges in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
    smJSInstance
  );

  await smJSInstance.transaction(ctx => {
    ctx.createEdges([
      {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
      {
        from: thingId,
        to: todo2Id,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    ]);
  });

  const {
    data: { todo },
  } = await smJSInstance.query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);

  const updateResult = await smJSInstance.transaction(ctx => {
    ctx.updateEdges([
      {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: false,
        },
      },
      {
        from: thingId,
        to: todo2Id,
        permissions: {
          view: true,
          edit: false,
        },
      },
    ]);
  });
  expect(updateResult[0].data.UpdateEdge).toBe(1);
  expect(updateResult[1].data.UpdateEdge).toBe(1);
  done();
});

test('dropping a single edge in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId] = await createMockThingAndTodo(smJSInstance);

  await smJSInstance.transaction(ctx => {
    ctx.createEdge({
      edge: {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    });
  });

  const queryTodoUnderThing = (thingId: string) => {
    return smJSInstance.query({
      todo: queryDefinition({
        def: mockTodoDef,
        underIds: [thingId],
      }),
    });
  };

  const {
    data: { todo },
  } = await queryTodoUnderThing(thingId);

  expect(todo[0].id).toBe(todoId);

  await smJSInstance.transaction(ctx => {
    ctx.dropEdge({
      edge: {
        from: thingId,
        to: todoId,
      },
    });
  });

  const {
    data: { todo: todoAfterDrop },
  } = await queryTodoUnderThing(thingId);

  expect(todoAfterDrop).toEqual([]);
  done();
});

test('dropping a multiple edges in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
    smJSInstance
  );

  await smJSInstance.transaction(ctx => {
    ctx.createEdges([
      {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
      {
        from: thingId,
        to: todo2Id,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    ]);
  });

  const queryTodosUnderThing = (thingId: string) => {
    return smJSInstance.query({
      todo: queryDefinition({
        def: mockTodoDef,
        underIds: [thingId],
      }),
    });
  };

  const {
    data: { todo },
  } = await queryTodosUnderThing(thingId);

  expect(todo[0].id).toBe(todoId);
  expect(todo[1].id).toBe(todo2Id);

  await smJSInstance.transaction(ctx => {
    ctx.dropEdges([
      {
        from: thingId,
        to: todoId,
      },
      { from: thingId, to: todo2Id },
    ]);
  });

  const {
    data: { todo: todosAfterDrop },
  } = await queryTodosUnderThing(thingId);

  expect(todosAfterDrop).toEqual([]);
  done();
});

test('replacing a single edge in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
    smJSInstance
  );

  await smJSInstance.transaction(ctx => {
    ctx.createEdges([
      {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    ]);
  });

  const queryTodoUnderThing = (thingId: string) => {
    return smJSInstance.query({
      todo: queryDefinition({
        def: mockTodoDef,
        underIds: [thingId],
      }),
    });
  };

  const {
    data: { todo },
  } = await queryTodoUnderThing(thingId);

  expect(todo[0].id).toBe(todoId);

  await smJSInstance.transaction(ctx => {
    ctx.replaceEdge({
      edge: {
        current: thingId,
        from: todo2Id,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    });
  });

  const {
    data: { todo: todoAfterReplace },
  } = await queryTodoUnderThing(thingId);
  const { data: todosUnderOtherTodo } = await queryTodoUnderThing(todo2Id);

  expect(todoAfterReplace).toEqual([]);
  expect(todosUnderOtherTodo.todo.map(({ id }) => id)).toContain(todoId);
  done();
});

test('replacing a multiple edges in sm works', async done => {
  const { smJSInstance, mockTodoDef } = await setupTest();
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos(
    smJSInstance
  );

  await smJSInstance.transaction(ctx => {
    ctx.createEdges([
      {
        from: thingId,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
      {
        from: thingId,
        to: todo2Id,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    ]);
  });

  const queryTodoUnderThing = (thingId: string) => {
    return smJSInstance.query({
      todo: queryDefinition({
        def: mockTodoDef,
        underIds: [thingId],
      }),
    });
  };

  const {
    data: { todo },
  } = await queryTodoUnderThing(thingId);

  expect(todo[0].id).toBe(todoId);
  expect(todo[1].id).toBe(todo2Id);

  await smJSInstance.transaction(ctx => {
    ctx.replaceEdges([
      {
        current: thingId,
        from: todo2Id,
        to: todoId,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
      {
        current: thingId,
        from: todoId,
        to: todo2Id,
        permissions: {
          view: true,
          edit: true,
          addChild: true,
        },
      },
    ]);
  });

  const {
    data: { todo: todoAfterReplace },
  } = await queryTodoUnderThing(thingId);
  const { data: todosUnderOtherTodo } = await queryTodoUnderThing(todo2Id);
  const todoIds = todosUnderOtherTodo.todo.map(({ id }) => id);

  expect(todoAfterReplace).toEqual([]);
  expect(todoIds).toContain(todoId);
  expect(todoIds).toContain(todo2Id);
  done();
});

async function getToken(): Promise<string> {
  const data = await fetch(
    'https://appservice.dev02.tt-devs.com/api/user/login',
    {
      method: 'POST',
      headers: {
        applicationId: '1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'meida.m+60@meetings.io',
        password: 'Password1!',
        timeZone: null,
      }),
    }
  ).then((res: any) => {
    return res.json();
  });

  if (!data.orgUserToken) throw Error('Failed to get token');
  return data.orgUserToken as string;
}
