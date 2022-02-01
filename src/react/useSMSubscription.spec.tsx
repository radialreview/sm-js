import React from 'react';
import { render } from '@testing-library/react';

import {
  createMockQueryDefinitions,
  mockQueryDataReturn,
  mockSubscriptionMessage,
} from '../specUtilities';
import { useSubscription } from './';
import { setToken, SMProvider, config, SMConfig } from '..';

const token = 'my mock token';
setToken('default', { token });
// this file tests some console error functionality, this keeps the test output clean
const nativeConsoleError = console.error;
beforeEach(() => {
  console.error = () => {};
});
afterAll(() => {
  console.error = nativeConsoleError;
});

test('it throws an error when used outside the context of an SMProvider', done => {
  function MyComponent() {
    useSubscription(createMockQueryDefinitions());

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

test('it throws a promise that resolves when the query for the data requested resolves, to enable React.Suspense integration', done => {
  let resolvePromise: (value: unknown) => void;
  const mockPromise = new Promise(res => {
    resolvePromise = res;
  });

  config({
    gqlClient: {
      query: () => mockPromise,
    },
  } as DeepPartial<SMConfig>);

  function MyComponent() {
    try {
      useSubscription(createMockQueryDefinitions());
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

  render(
    <SMProvider>
      <MyComponent />
    </SMProvider>
  );
});

test('it re-renders the component when a subscription message causes a change in the resulting data', async done => {
  const mockSubscribe = jest.fn(opts => {
    setTimeout(() => {
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
    }, 10);
  });
  config({
    gqlClient: {
      query: async () => mockQueryDataReturn,
      subscribe: mockSubscribe,
    },
  } as DeepPartial<SMConfig>);
  function MyComponent() {
    const { data } = useSubscription(createMockQueryDefinitions());

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
      <SMProvider>
        <MyComponent />
      </SMProvider>
    </React.Suspense>
  );

  await renderResult.findByText('FL');
  // re-render after sub message
  await renderResult.findByText('Definitely not FL');
  done();
});

function promiseState(p: Promise<any>) {
  const t = {};
  return Promise.race([p, t]).then(
    v => (v === t ? 'pending' : 'resolved'),
    () => 'rejected'
  );
}
