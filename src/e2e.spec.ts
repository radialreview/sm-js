import { def, number, queryDefinition, string } from '.';
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

const mockThingDef = def({
  type: 'mock-thing',
  properties: {
    id: string,
    number: number,
    string: string,
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
  });

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
  });

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
  });

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  await transaction(ctx => {
    ctx.updateNode({
      data: {
        id,
        number: timestamp + 10,
      },
    });
  });

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
  });

  const [{ id: id1 }, { id: id2 }] = transactionResult[0].data
    .CreateNodes as Array<{ id: string }>;

  await transaction(ctx => {
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
  });

  const id = transactionResult[0].data.CreateNodes[0].id as string;

  await transaction(ctx => {
    ctx.dropNode({ id });
  });

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
