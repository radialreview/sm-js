import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
  split,
  gql,
} from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { HttpLink } from '@apollo/client/link/http';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { getMainDefinition } from '@apollo/client/utilities';
import { Config, DocumentNode, IGQLClient } from './types';

require('isomorphic-fetch');

interface IGetGQLClientOpts {
  httpUrl: string;
  wsUrl: string;
  logging: Config['logging'];
}

export function getGQLCLient(gqlClientOpts: IGetGQLClientOpts) {
  const wsLink = new WebSocketLink({
    uri: gqlClientOpts.wsUrl,
    options: {
      reconnect: true,
    },
  });

  const nonBatchedLink = new HttpLink({
    uri: gqlClientOpts.httpUrl,
    credentials: 'include',
  });

  const queryBatchLink = split(
    operation => operation.getContext().batchKey,
    new BatchHttpLink({
      uri: gqlClientOpts.httpUrl,
      credentials: 'include',
      batchMax: 50,
      batchInterval: 50,
      batchKey: operation => {
        const context = operation.getContext();
        // This ensures that requests with different batch keys, headers and credentials
        // are batched separately
        return JSON.stringify({
          batchKey: context.batchKey,
          headers: context.headers,
          credentials: context.credentials,
        });
      },
    }),
    nonBatchedLink
  );

  const mutationBatchLink = split(
    operation => operation.getContext().batchedMutation,
    new BatchHttpLink({
      uri: gqlClientOpts.httpUrl,
      credentials: 'include',
      // no batch max for explicitly batched mutations
      // to ensure transactional integrity
      batchMax: Number.MAX_SAFE_INTEGER,
      batchInterval: 0,
    }),
    queryBatchLink
  );

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
    mutationBatchLink
  );

  function getContextWithToken(opts: { token?: string; batched?: boolean }) {
    let headers: Record<string, string> = {};

    if (opts.batched) {
      headers.accept = 'multipart/mixed';
    }

    if (opts.token != null && opts.token !== '') {
      headers.Authorization = `Bearer ${opts.token}`;
    }

    return headers;
  }

  function authenticateSubscriptionDocument(opts: {
    gql: DocumentNode;
    token?: string;
  }) {
    const documentBody = opts.gql.loc?.source.body;

    if (!documentBody) {
      throw new Error('No documentBody found');
    }

    const operationsThatRequireToken = [
      'GetChildren',
      'GetReferences',
      'GetNodes',
      'GetNodesNew',
      'GetNodesById',
    ];

    if (
      operationsThatRequireToken.some(operation =>
        documentBody?.includes(`${operation}(`)
      )
    ) {
      let documentBodyWithAuthTokensInjected = documentBody;

      operationsThatRequireToken.forEach(operation => {
        documentBodyWithAuthTokensInjected = documentBodyWithAuthTokensInjected.replace(
          new RegExp(operation + `\\((.*)\\)`, 'g'),
          `${operation}($1, authToken: "${opts.token}")`
        );
      });

      return gql(documentBodyWithAuthTokensInjected);
    }

    return opts.gql;
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
          ...getContextWithToken({
            token: opts.token,
            batched: opts.batchKey != null,
          }),
        },
      });

      return data;
    },
    subscribe: opts => {
      const subscription = baseClient
        .subscribe({
          query: authenticateSubscriptionDocument(opts),
        })
        .subscribe({
          next: message => {
            gqlClientOpts.logging.gqlClientSubscriptions &&
              console.log(
                'subscription message',
                JSON.stringify(message, null, 2)
              );
            if (!message.data)
              opts.onError(
                new Error(`Unexpected message structure.\n${message}`)
              );
            else opts.onMessage(message.data);
          },
          error: opts.onError,
        });

      return () => subscription.unsubscribe();
    },
    mutate: async opts => {
      gqlClientOpts.logging.gqlClientMutations &&
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
              ...getContextWithToken({ token: opts.token }),
            },
          })
        )
      );
    },
  };

  return gqlClient;
}
