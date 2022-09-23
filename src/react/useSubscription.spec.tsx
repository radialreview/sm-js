import React from 'react';
import { render } from '@testing-library/react';

import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  getMockSubscriptionMessage,
  getMockConfig,
  generateUserNode,
  createMockDataItems,
  mockUserData,
} from '../specUtilities';
import { UnsafeNoDuplicateSubIdErrorProvider, useSubscription } from '.';
import { MMGQLProvider, MMGQL, queryDefinition } from '..';
import { deepClone } from '../dataUtilities';
import { DEFAULT_TOKEN_NAME } from '../consts';
import { EPaginationFilteringSortingInstance, SortDirection } from '../types';

// this file tests some console error functionality, this keeps the test output clean
const nativeConsoleError = console.error;
beforeEach(() => {
  console.error = () => {};
});
afterAll(() => {
  console.error = nativeConsoleError;
});

test('it throws an error when used outside the context of an MMGQLProvider', done => {
  const { mmGQL } = setupTests();
  function MyComponent() {
    useSubscription(createMockQueryDefinitions(mmGQL));

    return null;
  }

  try {
    render(<MyComponent />);
  } catch (e) {
    expect(e).toMatchInlineSnapshot(
      `[Error: You must wrap your app with an MMGQLProvider before using useSubscription.]`
    );
    done();
  }
});

test('it throws an error when a non registered token is used', done => {
  const { mmGQL } = setupTests();
  function MyComponent() {
    try {
      useSubscription(
        createMockQueryDefinitions(mmGQL, { tokenName: 'invalid' })
      );
    } catch (e) {
      if (e instanceof Promise) {
        return null;
      }

      const [first, second] = (e as any).stack.trim().split('\n');
      expect([first, second]).toMatchInlineSnapshot(`
        Array [
          "Error: No token registered with the name \\"invalid\\".",
          "Please register this token prior to using it with setToken({ tokenName, token })) ",
        ]
      `);
      done();
    }

    return null;
  }

  render(
    <React.Suspense fallback={'loading'}>
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );
});

test('it throws a promise that resolves when the query for the data requested resolves, to enable React.Suspense integration', done => {
  let resolvePromise: (value: unknown) => void;
  const mockPromise = new Promise(res => {
    resolvePromise = res;
  });
  const { mmGQL } = setupTests();
  mmGQL.gqlClient.query = () => mockPromise;

  render(
    <MMGQLProvider mmGQL={mmGQL}>
      <MyComponent />
    </MMGQLProvider>
  );

  function MyComponent() {
    try {
      useSubscription(createMockQueryDefinitions(mmGQL));
    } catch (suspendPromise) {
      testPromise(suspendPromise as Promise<any>);
    }

    return null;
  }

  async function testPromise(promise: Promise<any>) {
    try {
      expect(promise).toBeInstanceOf(Promise);
      expect(await promiseState(promise)).toBe('pending');
      resolvePromise(mockQueryDataReturn);
      setTimeout(async () => {
        expect(await promiseState(promise)).toBe('resolved');
        done();
      });
    } catch (e) {
      done(e);
    }
  }
});

test.skip('it re-renders the component when a subscription message causes a change in the resulting data', async done => {
  const { mmGQL } = setupTests();
  const mockSubscriptionMessage = getMockSubscriptionMessage(mmGQL);

  let triggerMessage: (() => void) | undefined;
  const mockSubscribe = jest.fn(opts => {
    triggerMessage = () => {
      opts.onMessage({
        users: {
          ...mockSubscriptionMessage.users,
          node: {
            ...mockSubscriptionMessage.users.node,
            version: 2,
            address__dot__state: 'Definitely not FL',
          },
        },
      });
    };
    return () => {};
  });
  mmGQL.gqlClient.subscribe = mockSubscribe;

  function MyComponent() {
    const { data } = useSubscription(createMockQueryDefinitions(mmGQL));

    return (
      <>
        {data.users.nodes.map(user => (
          <div key={user.id}>{user.address.state}</div>
        ))}
      </>
    );
  }

  const renderResult = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await renderResult.findByText('FL');
  triggerMessage && triggerMessage();
  await renderResult.findByText('Definitely not FL');
  done();
});

test('it cancels the subscription after the component that establishes the subscription unmounts', done => {
  const { mmGQL } = setupTests();
  const mockUnsub = jest.fn(() => {});
  const mockSubscribe = jest.fn(() => {
    return mockUnsub;
  });
  mmGQL.gqlClient.subscribe = mockSubscribe;

  function MyComponent() {
    useSubscription(createMockQueryDefinitions(mmGQL));

    return null;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  // wrap around a setTimeout to allow the useEffect hook to run and schedule the cleanup
  setTimeout(() => {
    result.unmount();
    expect(mockUnsub).toHaveBeenCalled();
    done();
  }, 100);
});

test('if the query record provided is updated, performs a new query and returns the new set of results when that query resolves', async () => {
  const { mmGQL } = setupTests();
  let requestIdx = 0;
  mmGQL.gqlClient.query = jest.fn(() => {
    return new Promise(res => {
      if (requestIdx === 0) {
        setTimeout(() => {
          res(mockQueryDataReturn);
        }, 100);
        requestIdx++;
      } else {
        const updatedQueryDataReturn = deepClone(mockQueryDataReturn);
        updatedQueryDataReturn.users.nodes[0].address__dot__state = 'Not FL';
        setTimeout(() => {
          res(updatedQueryDataReturn);
        }, 100);
      }
    });
  });

  function MyComponent() {
    const [updateQueryDefinition, setUpdateQueryDefinition] = React.useState(
      false
    );
    const { data, querying } = useSubscription(
      updateQueryDefinition
        ? createMockQueryDefinitions(mmGQL)
        : createMockQueryDefinitions(mmGQL, { useIds: true })
    );

    React.useEffect(() => {
      setTimeout(() => {
        setUpdateQueryDefinition(true);
      }, 200);
    }, []);

    if (querying) return <>querying</>;
    return <>{data.users.nodes[0].address.state}</>;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await result.findByText('FL');
  // query definitions are updated by the timeout within the use effect above, which triggers a new query
  await result.findByText('querying');
  await result.findByText('Not FL');
  expect(mmGQL.gqlClient.query).toHaveBeenCalledTimes(2);
});

test('handles a query definition switching from non nullish to nullish', async () => {
  const { mmGQL } = setupTests();

  function MyComponent() {
    const [updateQueryDefinition, setUpdateQueryDefinition] = React.useState(
      false
    );
    const { data } = useSubscription(
      updateQueryDefinition
        ? { users: null }
        : createMockQueryDefinitions(mmGQL)
    );

    React.useEffect(() => {
      setTimeout(() => {
        setUpdateQueryDefinition(true);
      }, 200);
    }, []);

    return <>{data.users ? data.users.nodes[0].address.state : 'No users'}</>;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await result.findByText('FL');
  await result.findByText('No users');
});

test('updates data when paginating', async () => {
  const { mmGQL } = setupTests({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          id: 'mock-user-id',
          type: 'user',
          version: '1',
          address: '__object__',
          address__dot__state: 'FL',
          address__dot__apt: '__object__',
          address__dot__apt__dot__floor: '1',
          address__dot__apt__dot__number: '1',
        },
        {
          id: 'mock-user-id2',
          type: 'user',
          version: '1',
          address: '__object__',
          address__dot__state: 'CA',
          address__dot__apt: '__object__',
          address__dot__apt__dot__floor: '1',
          address__dot__apt__dot__number: '1',
        },
      ],
    }),
  });

  function MyComponent() {
    const { data } = useSubscription({
      users: queryDefinition({
        pagination: {
          itemsPerPage: 1,
        },
        def: generateUserNode(mmGQL),
        map: ({ address }) => ({
          address: address({
            map: ({ state }) => ({
              state,
            }),
          }),
        }),
      }),
    });

    React.useEffect(() => {
      setTimeout(() => {
        data.users.goToNextPage();
      }, 200);
    }, []); // eslint-disable-line

    return <>{data.users.nodes[0].address.state}</>;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await result.findByText('FL');
  await result.findByText('CA');
});

test('updates data when filtering', async () => {
  const { mmGQL } = setupTests({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          id: 'mock-user-id',
          type: 'user',
          version: '1',
          archived: 'false',
          address: '__object__',
          address__dot__state: 'FL',
          address__dot__apt: '__object__',
          address__dot__apt__dot__floor: '1',
          address__dot__apt__dot__number: '1',
        },
        {
          id: 'mock-user-id2',
          type: 'user',
          version: '1',
          archived: 'true',
          address: '__object__',
          address__dot__state: 'CA',
          address__dot__apt: '__object__',
          address__dot__apt__dot__floor: '1',
          address__dot__apt__dot__number: '1',
        },
      ],
    }),
  });

  function MyComponent() {
    const [archived, setArchived] = React.useState(false);
    const { data } = useSubscription({
      users: queryDefinition({
        filter: { archived },
        def: generateUserNode(mmGQL),
        map: ({ address, archived }) => ({
          archived,
          address: address({
            map: ({ state }) => ({
              state,
            }),
          }),
        }),
      }),
    });

    React.useEffect(() => {
      setTimeout(() => {
        setArchived(true);
      }, 200);
    }, []); // eslint-disable-line

    return <>{data.users.nodes[0].archived ? 'archived' : 'unarchived'}</>;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await result.findByText('unarchived');
  await result.findByText('archived');
});

test('updates data when sorting', async () => {
  const { mmGQL } = setupTests({
    users: createMockDataItems({
      sampleMockData: mockUserData,
      items: [
        {
          id: 'mock-user-id',
          type: 'user',
          version: '1',
          firstName: 'A',
        },
        {
          id: 'mock-user-id2',
          type: 'user',
          version: '1',
          firstName: 'C',
        },
        {
          id: 'mock-user-id3',
          type: 'user',
          version: '1',
          firstName: 'B',
        },
      ],
    }),
  });

  function MyComponent() {
    const [sorting, setSorting] = React.useState<SortDirection>('desc');
    const { data } = useSubscription({
      users: queryDefinition({
        sort: {
          firstName: sorting,
        },
        def: generateUserNode(mmGQL),
        map: ({ firstName }) => ({
          firstName,
        }),
      }),
    });

    React.useEffect(() => {
      setTimeout(() => {
        setSorting('asc');
      }, 200);
    }, []); // eslint-disable-line

    return <>{data.users.nodes.map(x => x.firstName).join(',')}</>;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await result.findByText('C,B,A');
  await result.findByText('A,B,C');
});

test('"querying" is true until all queries in the query definition record resolve', async done => {
  const { mmGQL } = setupTests();
  let requestIdx = 0;
  mmGQL.gqlClient.query = jest.fn(() => {
    return new Promise(res => {
      if (requestIdx === 0) {
        setTimeout(() => {
          res({
            users: mockQueryDataReturn.users,
            usersNotSuspended: mockQueryDataReturn.users,
          });
        }, 300);
        requestIdx++;
      } else {
        setTimeout(() => {
          res({
            users: mockQueryDataReturn.users,
            usersNotSuspended: mockQueryDataReturn.users,
          });
        }, 100);
      }
    });
  });

  function MyComponent() {
    const { data, querying, error } = useSubscription({
      users: createMockQueryDefinitions(mmGQL).users,
      usersNotSuspended: createMockQueryDefinitions(mmGQL, {
        doNotSuspend: true,
      }).users,
    });

    if (error) {
      done(error);
      return null;
    }
    if (querying) return <>querying</>;
    if (!data.users || !data.usersNotSuspended) {
      done(new Error('Unexpected null result'));
      return null;
    }
    const text = `${data.users.nodes[0].id}+${data.usersNotSuspended.nodes[0].id}`;
    return <>{text}</>;
  }

  const result = render(
    <React.Suspense fallback="suspense-fallback">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  await result.findByText(
    `${mockQueryDataReturn.users.nodes[0].id}+${mockQueryDataReturn.users.nodes[0].id}`
  );
  expect(mmGQL.gqlClient.query).toHaveBeenCalledTimes(2);
  done();
});

test('if the query record provided is updated, unsubscribes from the previously established subscription', async done => {
  const { mmGQL } = setupTests();
  const mockUnsub = jest.fn();
  mmGQL.gqlClient.subscribe = () => mockUnsub;

  function MyComponent() {
    const [updateQueryDefinition, setUpdateQueryDefinition] = React.useState(
      false
    );
    useSubscription(
      updateQueryDefinition
        ? createMockQueryDefinitions(mmGQL)
        : createMockQueryDefinitions(mmGQL, { useIds: true })
    );

    React.useEffect(() => {
      setTimeout(() => {
        setUpdateQueryDefinition(true);
        setTimeout(() => {
          expect(mockUnsub).toHaveBeenCalledTimes(1);
          done();
        }, 50);
      }, 50);
    }, []);

    return null;
  }

  render(
    <React.Suspense fallback="loading">
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );
});

test('suspense barrier is not triggered when doNotSuspend is true', async () => {
  const LOADING_TEXT = 'loading';
  const { mmGQL } = setupTests();

  const result = render(
    <React.Suspense fallback={LOADING_TEXT}>
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  expect(result.queryByText(LOADING_TEXT)).toBeNull();

  await result.findByText('FL');

  function MyComponent() {
    const { data } = useSubscription(
      createMockQueryDefinitions(mmGQL, { doNotSuspend: true })
    );

    return (
      <>
        {data.users?.nodes.map(user => (
          <div key={user.id}>{user.address.state}</div>
        ))}
      </>
    );
  }
});

test('queries that do not suspend rendering go out in separate requests', async () => {
  const LOADING_TEXT = 'loading';
  const { mmGQL } = setupTests();

  const mockQuery = jest.fn(async () => mockQueryDataReturn);
  mmGQL.gqlClient.query = mockQuery;

  render(
    <React.Suspense fallback={LOADING_TEXT}>
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
      </MMGQLProvider>
    </React.Suspense>
  );

  function MyComponent() {
    const { users: usersSuspended } = createMockQueryDefinitions(mmGQL, {
      doNotSuspend: false,
    });
    const { users: usersNotSuspended } = createMockQueryDefinitions(mmGQL, {
      doNotSuspend: true,
    });

    useSubscription({
      usersNotSuspended,
      usersSuspended,
    });

    return null;
  }

  expect(mmGQL.gqlClient.query).toHaveBeenCalledTimes(2);
});

test('rendering multiple instances of the same component using useSubscription throws an error if a unique subscriptionId is not provided', async done => {
  const { mmGQL } = setupTests();

  function MyComponent() {
    const { users } = createMockQueryDefinitions(mmGQL, { doNotSuspend: true });

    const { data } = useSubscription({
      users,
    });

    return <pre>{JSON.stringify(data.users, null, 2)}</pre>;
  }

  try {
    render(
      <MMGQLProvider mmGQL={mmGQL}>
        <MyComponent />
        <MyComponent />
      </MMGQLProvider>
    );
  } catch (e) {
    expect((e as any).message.split('\n')[0]).toMatchInlineSnapshot(
      `"A useSubscription hook was already mounted using the following subscription id:"`
    );
    done();
  }
});

test('it allows duplicating subscription ids when wrapped in a NoDuplicateSubIdErrorProvider', async () => {
  const { mmGQL } = setupTests();

  function MyComponent() {
    useSubscription(createMockQueryDefinitions(mmGQL));
    return <span>{'rendered'}</span>;
  }

  const result = render(
    <MMGQLProvider mmGQL={mmGQL} subscriptionTTLMs={2000}>
      <React.Suspense fallback={'loading'}>
        <MyComponent />
        <UnsafeNoDuplicateSubIdErrorProvider>
          <MyComponent />
        </UnsafeNoDuplicateSubIdErrorProvider>
      </React.Suspense>
    </MMGQLProvider>
  );

  await result.queryAllByText('rendered');
});

test('rendering multiple instances of the same component using useSubscription works if a unique subscription id is provided', async () => {
  const { mmGQL } = setupTests();

  function MyComponent(props: { id: string }) {
    const { users } = createMockQueryDefinitions(mmGQL, { doNotSuspend: true });

    const { data } = useSubscription(
      {
        users,
      },
      { subscriptionId: props.id }
    );

    if (data.users == null) return null;

    return <pre>{data.users.nodes[0].id}</pre>;
  }

  const renderResult = render(
    <MMGQLProvider mmGQL={mmGQL}>
      <MyComponent id={'1'} />
      <MyComponent id={'2'} />
    </MMGQLProvider>
  );

  const results = await renderResult.findAllByText(
    mockQueryDataReturn.users.nodes[0].id
  );
  expect(results.length).toBe(2);
});

function setupTests(mockData?: any) {
  const mmGQL = new MMGQL(
    getMockConfig({
      mockData: mockData,
      generateMockData: false,
      paginationFilteringSortingInstance:
        EPaginationFilteringSortingInstance.CLIENT,
    })
  );
  mmGQL.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'mock token' });

  return { mmGQL };
}

function promiseState(p: Promise<any>) {
  const t = {};
  return Promise.race([p, t]).then(
    v => (v === t ? 'pending' : 'resolved'),
    () => 'rejected'
  );
}
