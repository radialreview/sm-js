import React from 'react';
import { render } from '@testing-library/react';

import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  getMockSubscriptionMessage,
  getMockConfig,
} from '../specUtilities';
import { useSubscription } from './';
import { SMProvider, SMJS } from '..';
import { deepClone } from '../dataUtilities';
import { DEFAULT_TOKEN_NAME } from '../consts';

// this file tests some console error functionality, this keeps the test output clean
const nativeConsoleError = console.error;
beforeEach(() => {
  console.error = () => {};
});
afterAll(() => {
  console.error = nativeConsoleError;
});

test('it throws an error when used outside the context of an SMProvider', done => {
  const { smJS } = setupTests();
  function MyComponent() {
    useSubscription(createMockQueryDefinitions(smJS));

    return null;
  }

  try {
    render(<MyComponent />);
  } catch (e) {
    expect(e).toMatchInlineSnapshot(
      `[Error: You must wrap your app with an SMProvider before using useSubscription.]`
    );
    done();
  }
});

test('it throws an error when a non registered token is used', done => {
  const { smJS } = setupTests();
  function MyComponent() {
    try {
      useSubscription(
        createMockQueryDefinitions(smJS, { tokenName: 'invalid' })
      );
    } catch (e) {
      if (e instanceof Promise) {
        return null;
      }

      expect(e).toMatchInlineSnapshot(`
        [Error: No token registered with the name "invalid".
        Please register this token prior to using it with sm.setToken({ tokenName, token })) ]
      `);
      done();
    }

    return null;
  }

  render(
    <React.Suspense fallback={'loading'}>
      <SMProvider smJS={smJS}>
        <MyComponent />
      </SMProvider>
    </React.Suspense>
  );
});

test('it throws a promise that resolves when the query for the data requested resolves, to enable React.Suspense integration', done => {
  let resolvePromise: (value: unknown) => void;
  const mockPromise = new Promise(res => {
    resolvePromise = res;
  });
  const { smJS } = setupTests();
  smJS.gqlClient.query = () => mockPromise;

  render(
    <SMProvider smJS={smJS}>
      <MyComponent />
    </SMProvider>
  );

  function MyComponent() {
    try {
      useSubscription(createMockQueryDefinitions(smJS));
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

test('it re-renders the component when a subscription message causes a change in the resulting data', async done => {
  const { smJS } = setupTests();
  const mockSubscriptionMessage = getMockSubscriptionMessage(smJS);

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
  smJS.gqlClient.subscribe = mockSubscribe;

  function MyComponent() {
    const { data } = useSubscription(createMockQueryDefinitions(smJS));

    return (
      <>
        {data.users.map(user => (
          <div key={user.id}>{user.address.state}</div>
        ))}
      </>
    );
  }

  const renderResult = render(
    <React.Suspense fallback="loading">
      <SMProvider smJS={smJS}>
        <MyComponent />
      </SMProvider>
    </React.Suspense>
  );

  await renderResult.findByText('FL');
  triggerMessage && triggerMessage();
  await renderResult.findByText('Definitely not FL');
  done();
});

test('it cancels the subscription after the component that establishes the subscription unmounts', done => {
  const { smJS } = setupTests();
  const mockUnsub = jest.fn(() => {});
  const mockSubscribe = jest.fn(() => {
    return mockUnsub;
  });
  smJS.gqlClient.subscribe = mockSubscribe;

  function MyComponent() {
    useSubscription(createMockQueryDefinitions(smJS));

    return null;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <SMProvider smJS={smJS}>
        <MyComponent />
      </SMProvider>
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
  const { smJS } = setupTests();
  let requestIdx = 0;
  smJS.gqlClient.query = jest.fn(() => {
    return new Promise(res => {
      if (requestIdx === 0) {
        res(mockQueryDataReturn);
        requestIdx++;
      } else {
        const updatedQueryDataReturn = deepClone(mockQueryDataReturn);
        updatedQueryDataReturn.users[0].address__dot__state = 'Not FL';
        res(updatedQueryDataReturn);
      }
    });
  });

  function MyComponent() {
    const [updateQueryDefinition, setUpdateQueryDefinition] = React.useState(
      false
    );
    const { data, querying } = useSubscription(
      updateQueryDefinition
        ? createMockQueryDefinitions(smJS, { useUnder: true })
        : createMockQueryDefinitions(smJS, { useIds: true })
    );

    React.useEffect(() => {
      setTimeout(() => {
        setUpdateQueryDefinition(true);
      }, 50);
    }, []);

    if (querying) return <>querying</>;
    return <>{data.users[0].address.state}</>;
  }

  const result = render(
    <React.Suspense fallback="loading">
      <SMProvider smJS={smJS}>
        <MyComponent />
      </SMProvider>
    </React.Suspense>
  );

  await result.findByText('FL');
  // query definitions are updated by the timeout within the use effect above, which triggers a new query
  await result.findByText('querying');
  await result.findByText('Not FL');
  expect(smJS.gqlClient.query).toHaveBeenCalledTimes(2);
});

test('if the query record provided is updated, unsubscribes from the previously established subscription', async done => {
  const { smJS } = setupTests();
  const mockUnsub = jest.fn();
  smJS.gqlClient.subscribe = () => mockUnsub;

  function MyComponent() {
    const [updateQueryDefinition, setUpdateQueryDefinition] = React.useState(
      false
    );
    useSubscription(
      updateQueryDefinition
        ? createMockQueryDefinitions(smJS, { useUnder: true })
        : createMockQueryDefinitions(smJS, { useIds: true })
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
      <SMProvider smJS={smJS}>
        <MyComponent />
      </SMProvider>
    </React.Suspense>
  );
});

test('suspense barrier is not triggered when doNotSuspend is true', async () => {
  const LOADING_TEXT = 'loading';
  const { smJS } = setupTests();

  const result = render(
    <React.Suspense fallback={LOADING_TEXT}>
      <SMProvider smJS={smJS}>
        <MyComponent />
      </SMProvider>
    </React.Suspense>
  );

  expect(result.queryByText(LOADING_TEXT)).toBeNull();

  await result.findByText('FL');

  function MyComponent() {
    const { data } = useSubscription(
      createMockQueryDefinitions(smJS, { doNotSuspend: true })
    );

    return (
      <>
        {data.users?.map(user => (
          <div key={user.id}>{user.address.state}</div>
        ))}
      </>
    );
  }
});

function setupTests() {
  const smJS = new SMJS(getMockConfig());
  smJS.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'mock token' });

  return { smJS };
}

function promiseState(p: Promise<any>) {
  const t = {};
  return Promise.race([p, t]).then(
    v => (v === t ? 'pending' : 'resolved'),
    () => 'rejected'
  );
}
