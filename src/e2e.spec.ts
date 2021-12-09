import { setToken } from './auth';
import { query, subscribe } from './smQueriers';
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
