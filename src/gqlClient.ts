import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
  split,
} from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { HttpLink } from '@apollo/client/link/http';
// import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { getMainDefinition } from '@apollo/client/utilities';
import { Config, IGQLClient, SubscriptionMessage } from './types';
import WebSocket from 'isomorphic-ws';
import { getPrettyPrintedGQL } from './specUtilities';

require('isomorphic-fetch');

interface IGetGQLClientOpts {
  httpUrl: string;
  wsUrl: string;
  logging: Config['logging'];
  getCookie?: () => string;
}

export function getGQLCLient(gqlClientOpts: IGetGQLClientOpts) {
  const wsOptions: Record<string, any> = {
    credentials: 'include',
  };

  if (gqlClientOpts.getCookie) {
    wsOptions.headers = {
      cookie: gqlClientOpts.getCookie(),
    };
  }

  // const wsLink = new WebSocketLink({
  //   uri: gqlClientOpts.wsUrl,
  //   options: {
  //     reconnect: true,
  //     wsOptionArguments: [wsOptions],
  //   },
  //   webSocketImpl: WebSocket,
  // });

  const wsLink = new ApolloLink(operation => {
    const link = new WebSocketLink({
      uri: gqlClientOpts.wsUrl,
      options: {
        reconnect: true,
        wsOptionArguments: [wsOptions],
        inactivityTimeout: 1,
      },
      webSocketImpl: WebSocket,
    });

    return link.request(operation);
  });

  const nonBatchedLink = new HttpLink({
    uri: gqlClientOpts.httpUrl,
    credentials: 'include',
  });

  // const queryBatchLink = split(
  //   operation => operation.getContext().batchKey,
  //   new BatchHttpLink({
  //     uri: gqlClientOpts.httpUrl,
  //     credentials: 'include',
  //     batchMax: 50,
  //     batchInterval: 50,
  //     batchKey: operation => {
  //       const context = operation.getContext();
  //       // This ensures that requests with different batch keys, headers and credentials
  //       // are batched separately
  //       return JSON.stringify({
  //         batchKey: context.batchKey,
  //         headers: context.headers,
  //         credentials: context.credentials,
  //       });
  //     },
  //   }),
  //   nonBatchedLink
  // );

  // const mutationBatchLink = split(
  //   operation => operation.getContext().batchedMutation,
  //   new BatchHttpLink({
  //     uri: gqlClientOpts.httpUrl,
  //     credentials: 'include',
  //     // no batch max for explicitly batched mutations
  //     // to ensure transactional integrity
  //     batchMax: Number.MAX_SAFE_INTEGER,
  //     batchInterval: 0,
  //   }),
  //   nonBatchedLink
  // );

  const requestLink = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    nonBatchedLink
  );

  function getContextWithAuthorization(opts: {
    token?: string;
    cookie?: string;
  }) {
    let headers: Record<string, string> = {};

    if (opts.cookie != null && opts.cookie !== '') {
      headers.Cookie = opts.cookie;
    } else if (opts.token != null && opts.token !== '') {
      headers.Authorization = `Bearer ${opts.token}`;
    }

    return { headers };
  }

  const authLink = new ApolloLink(
    (operation, forward) =>
      new Observable(observer => {
        let handle: ZenObservable.Subscription;
        Promise.resolve(operation)
          .then(() => {
            handle = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          })
          .catch(observer.error.bind(observer));

        return () => {
          if (handle) handle.unsubscribe();
        };
      })
  );

  const baseClient = new ApolloClient({
    link: ApolloLink.from([authLink, requestLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
      },
    },
  });

  const gqlClient: IGQLClient = {
    query: async opts => {
      const { data } = await baseClient.query({
        query: opts.gql,
        context: {
          // allow turning off batching by specifying a null or undefined batchKey
          // but by default, batch all requests into the same request batch
          batchKey: 'batchKey' in opts ? opts.batchKey : 'default',
          ...getContextWithAuthorization({
            token: opts.token,
            cookie: opts.cookie,
          }),
        },
      });

      return data;
    },
    subscribe: opts => {
      if (gqlClientOpts.logging.gqlSubscriptions) {
        console.log('subscribing', getPrettyPrintedGQL(opts.gql));
      }

      let subscription = baseClient
        .subscribe({
          query: opts.gql,
        })
        .subscribe({
          next: message => {
            // restart retry attempts when a message is successfully received
            opts.retryAttempts = 0;

            gqlClientOpts.logging.gqlSubscriptions &&
              console.log(
                'subscription message',
                JSON.stringify(message, null, 2)
              );

            if (!message.data)
              opts.onError(
                new Error(`Unexpected message structure.\n${message}`)
              );
            else opts.onMessage(message as SubscriptionMessage);
          },
          error: e => {
            // something in Apollo's internals appears to be causing subscriptions to be prematurely closed when any error is received
            // even if partial data is included in the message
            // so we retry the subscription a few times before giving up
            if (opts.retryAttempts == null || opts.retryAttempts < 3) {
              unsubscribe && unsubscribe();
              unsubscribe = gqlClient.subscribe({
                ...opts,
                retryAttempts: (opts.retryAttempts || 0) + 1,
              });
            } else {
              console.error(
                'Failed to initialize subscription after 3 attempts'
              );
              console.error(getPrettyPrintedGQL(opts.gql));
            }
            opts.onError(e);
          },
        });

      let unsubscribe = subscription.unsubscribe.bind(subscription);

      return () => unsubscribe();
    },
    mutate: async opts => {
      gqlClientOpts.logging.gqlMutations &&
        console.log(
          'mutations',
          opts.mutations.map(mutation => mutation.loc?.source.body)
        );
      return await Promise.all(
        opts.mutations.map(mutation =>
          baseClient.mutate({
            mutation,
            context: {
              batchedMutation: true,
              ...getContextWithAuthorization({
                token: opts.token,
                cookie: opts.cookie,
              }),
            },
          })
        )
      );
    },
  };

  return gqlClient;
}
