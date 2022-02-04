import {
  boolean,
  children,
  def,
  number,
  object,
  queryDefinition,
  string,
} from '.';
import { setToken } from './auth';
import { query, subscribe } from './smQueriers';
import { createMockQueryDefinitions } from './specUtilities';
import { transaction } from './transaction';

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

test('querying data from SM works', async done => {
  const token = await getToken();
  setToken('default', { token });

  const results = await query(createMockQueryDefinitions({ useNoUnder: true }));

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

// @TODO add better e2e tests for subscriptions once mutation API is written
test('subscribing to data from sm works', async done => {
  const token = await getToken();
  setToken('default', { token });

  const results = await subscribe(
    createMockQueryDefinitions({ useNoUnder: true }),
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

const mockThingDef: any = def({
  type: 'mock-thing',
  properties: {
    id: string,
    number: number,
    string: string,
    object: object.optional({
      property: string,
      otherProperty: string,
      nestedObject: object.optional({
        nestedProperty: string,
      }),
    }),
  },
  relational: {
    todos: () => children({ def: mockTodoDef }),
  },
});

const mockTodoDef = def({
  type: 'mock-todo',
  properties: {
    id: string,
    title: string,
    done: boolean(false),
  },
});

test('creating a single node in sm works', async done => {
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
    ctx.createNode({
      data: { type: 'mock-thing', number: timestamp, string: 'mock string' },
    });

    ctx.createNode({
      data: {
        type: 'mock-thing',
        number: timestamp + 1,
        string: 'mock string2',
      },
    });
  }).execute();

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  const {
    data: { thing },
  } = await query({
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
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
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
  }).execute();

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  const {
    data: { things },
  } = await query({
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

test('creating multiple nodes in multiple operations in sm works', async done => {
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
          },
        },
      ],
    });

    ctx.createNode({
      data: {
        id: '123',
        type: 'mock-thing',
        number: timestamp + 1,
        string: 'mock string 2',
      },
    });
  }).execute();

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  const {
    data: { things },
  } = await query({
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
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
    ctx.createNode({
      data: { type: 'mock-thing', number: timestamp, string: 'mock string' },
    });
  }).execute();

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  await transaction(ctx => {
    ctx.updateNode({
      data: {
        id,
        number: timestamp + 10,
      },
    });
  }).execute();

  const {
    data: { thing },
  } = await query({
    thing: queryDefinition({
      def: mockThingDef,
      id,
    }),
  });

  expect((thing as any).number).toBe(timestamp + 10);
  done();
});

test('updating several nodes in sm works', async done => {
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
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
  }).execute();

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  await transaction(ctx => {
    ctx.updateNodes({
      nodes: [
        {
          data: {
            id: id1,
            number: timestamp + 10,
          },
        },
        { data: { id: id2, number: timestamp + 20 } },
      ],
    });
  }).execute();

  const {
    data: { thing },
  } = await query({
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
  const token = await getToken();
  setToken('default', { token });

  const transactionResult = await transaction(ctx => {
    ctx.createNode({
      data: { type: 'mock-thing' },
    });
  }).execute();

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  await transaction(ctx => {
    ctx.dropNode({ id });
  }).execute();

  try {
    await query(
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

const createMockThingAndTodo = async () => {
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const nodesTransaction = await transaction(ctx => {
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
  }).execute();

  const [thingId, todoId] = nodesTransaction[0].data.CreateNodes.map(
    ({ id }: { id: string }) => id
  );

  return [thingId, todoId];
};

const createMockThingAndMultipleTodos = async () => {
  const token = await getToken();
  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const nodesTransaction = await transaction(ctx => {
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
  }).execute();

  const [thingId, todoId, todo2Id] = nodesTransaction[0].data.CreateNodes.map(
    ({ id }: { id: string }) => id
  );

  return [thingId, todoId, todo2Id];
};

test('creating a single edge in sm works', async done => {
  const [thingId, todoId] = await createMockThingAndTodo();

  await transaction(ctx => {
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
  }).execute();

  const {
    data: { todo },
  } = await query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);
  done();
});

test('creating multiple edges in sm works', async done => {
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos();

  await transaction(ctx => {
    ctx.createEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
      {
        edge: {
          from: thingId,
          to: todo2Id,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
    ]);
  }).execute();

  const {
    data: { todo },
  } = await query({
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
  const [thingId, todoId] = await createMockThingAndTodo();

  await transaction(ctx => {
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
  }).execute();

  const {
    data: { todo },
  } = await query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);

  const updateResult = await transaction(ctx => {
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
  }).execute();

  expect(updateResult[0].data.UpdateEdge).toBe(1);

  done();
});

test('updating multiple edges in sm works', async done => {
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos();

  await transaction(ctx => {
    ctx.createEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
      {
        edge: {
          from: thingId,
          to: todo2Id,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
    ]);
  }).execute();

  const {
    data: { todo },
  } = await query({
    todo: queryDefinition({
      def: mockTodoDef,
      underIds: [thingId],
    }),
  });

  expect(todo[0].id).toBe(todoId);

  const updateResult = await transaction(ctx => {
    ctx.updateEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
          permissions: {
            view: true,
            edit: false,
          },
        },
      },
      {
        edge: {
          from: thingId,
          to: todo2Id,
          permissions: {
            view: true,
            edit: false,
          },
        },
      },
    ]);
  }).execute();
  expect(updateResult[0].data.UpdateEdge).toBe(1);
  expect(updateResult[1].data.UpdateEdge).toBe(1);
  done();
});

test('dropping a single edge in sm works', async done => {
  const [thingId, todoId] = await createMockThingAndTodo();

  await transaction(ctx => {
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
  }).execute();

  const queryTodoUnderThing = (thingId: string) => {
    return query({
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

  await transaction(ctx => {
    ctx.dropEdge({
      edge: {
        from: thingId,
        to: todoId,
      },
    });
  }).execute();

  const {
    data: { todo: todoAfterDrop },
  } = await queryTodoUnderThing(thingId);

  expect(todoAfterDrop).toEqual([]);
  done();
});

test('dropping a multiple edges in sm works', async done => {
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos();
  await transaction(ctx => {
    ctx.createEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
      {
        edge: {
          from: thingId,
          to: todo2Id,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
    ]);
  }).execute();

  const queryTodosUnderThing = (thingId: string) => {
    return query({
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

  await transaction(ctx => {
    ctx.dropEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
        },
      },
      { edge: { from: thingId, to: todo2Id } },
    ]);
  }).execute();

  const {
    data: { todo: todosAfterDrop },
  } = await queryTodosUnderThing(thingId);

  expect(todosAfterDrop).toEqual([]);
  done();
});

test('replacing a single edge in sm works', async done => {
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos();
  await transaction(ctx => {
    ctx.createEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
    ]);
  }).execute();

  const queryTodoUnderThing = (thingId: string) => {
    return query({
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

  await transaction(ctx => {
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
  }).execute();

  const {
    data: { todo: todoAfterReplace },
  } = await queryTodoUnderThing(thingId);
  const { data: todosUnderOtherTodo } = await queryTodoUnderThing(todo2Id);

  expect(todoAfterReplace).toEqual([]);
  expect(todosUnderOtherTodo.todo.map(({ id }) => id)).toContain(todoId);
  done();
});

test('replacing multiple edges in sm works', async done => {
  const [thingId, todoId, todo2Id] = await createMockThingAndMultipleTodos();
  await transaction(ctx => {
    ctx.createEdges([
      {
        edge: {
          from: thingId,
          to: todoId,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
      {
        edge: {
          from: thingId,
          to: todo2Id,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
    ]);
  }).execute();

  const queryTodoUnderThing = (thingId: string) => {
    return query({
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

  await transaction(ctx => {
    ctx.replaceEdges([
      {
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
      },
      {
        edge: {
          current: thingId,
          from: todoId,
          to: todo2Id,
          permissions: {
            view: true,
            edit: true,
            addChild: true,
          },
        },
      },
    ]);
  }).execute();

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

test('dropping a property in sm works', async done => {
  const token = await getToken();

  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
            object: {
              property: 'value',
              otherProperty: 'otherValue',
              nestedObject: {
                nestedProperty: 'nestedValue',
              },
            },
          },
        },
      ],
    });
  }).execute();

  const createdThingId = transactionResult[0].data.CreateNodes[0].id as string;

  const {
    data: { thing },
  } = await query({
    thing: queryDefinition({
      def: mockThingDef,
      id: createdThingId,
    }),
  });

  expect((thing as any).object.property).toBe('value');

  await transaction(ctx => {
    ctx.updateNode({
      data: {
        id: createdThingId,
        object: {
          property: null,
          nestedObject: null,
        },
      },
    });
  }).execute();

  const {
    data: { thingAfterDrop },
  } = await query({
    thingAfterDrop: queryDefinition({
      def: mockThingDef,
      id: createdThingId,
    }),
  });

  expect((thingAfterDrop as any).object.property).toBe(null);
  expect((thingAfterDrop as any).object.nestedObject.nestedProperty).toBe(null);
  expect((thingAfterDrop as any).object.otherProperty).toBe('otherValue');
  done();
});

test('dropping an object will drop all the properties', async done => {
  const token = await getToken();

  setToken('default', { token });
  const timestamp = new Date().valueOf();

  const transactionResult = await transaction(ctx => {
    ctx.createNodes({
      nodes: [
        {
          data: {
            type: 'mock-thing',
            number: timestamp,
            string: 'mock string',
            object: {
              property: 'value',
              otherProperty: 'otherValue',
              nestedObject: {
                nestedProperty: 'nestedValue',
              },
            },
          },
        },
      ],
    });
  }).execute();

  const createdThingId = transactionResult[0].data.CreateNodes[0].id as string;

  const {
    data: { thing },
  } = await query({
    thing: queryDefinition({
      def: mockThingDef,
      id: createdThingId,
    }),
  });

  expect((thing as any).object.property).toBe('value');
  expect((thing as any).object.nestedObject.nestedProperty).toBe('nestedValue');
  await transaction(ctx => {
    ctx.updateNode({
      data: {
        id: createdThingId,
        object: null,
      },
    });
  }).execute();

  const {
    data: { thingAfterDrop },
  } = await query({
    thingAfterDrop: queryDefinition({
      def: mockThingDef,
      id: createdThingId,
    }),
  });

  expect((thingAfterDrop as any).object).toBe(null);

  done();
});

test.only('grouped transactions work as expected', async () => {
  const token = await getToken();

  setToken('default', { token });

  const createTodo = ({ title, done }: { title: string; done: boolean }) => {
    title;
    done;
    return transaction(ctx => {
      // ctx.createNode({
      //   data: {
      //     type: 'mock-todo',
      //     title,
      //     done,
      //   },
      //   onSuccess: console.log,
      // });
      // ctx.createNode({
      //   data: {
      //     type: 'mock-todo',
      //     title,
      //     done,
      //   },
      //   onSuccess: console.log,
      // });

      ctx.createNodes({
        nodes: [
          {
            data: {
              type: 'mock-thing',
              number: 2,
              string: 'mock string',
            },
          },
          {
            data: {
              type: 'mock-thing',
              number: 3,
              string: 'mock string 2',
            },
          },
        ],
      });

      ctx.createNodes({
        nodes: [
          {
            data: {
              type: 'mock-thing',
              number: 2,
              string: 'mock string',
            },
          },
          {
            data: {
              type: 'mock-thing',
              number: 3,
              string: 'mock string 2',
            },
          },
        ],
      });
    });
  };

  const createTodos = (todos: Array<{ title: string; done: boolean }>) => {
    return transaction(todos.map(createTodo));
  };

  const transactionResult = await createTodos([
    { title: 'todo 1', done: false },
    { title: 'todo 2', done: true },
  ]).execute();

  console.log(transactionResult[0].data.CreateNodes);

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  const {
    data: { todos },
  } = await query({
    todos: queryDefinition({
      def: mockTodoDef,
      ids: [id1, id2],
    }),
  });

  expect(todos[0].title).toBe('todo 1');
  expect(todos[1].title).toBe('todo 2');
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
