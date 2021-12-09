import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
  split,
  DocumentNode,
  gql,
} from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { HttpLink } from '@apollo/client/link/http';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { getMainDefinition } from '@apollo/client/utilities';

import { SMGQLClient } from './config';

interface IGetGQLClientOpts {
  httpUrl: string;
  wsUrl: string;
  // return "true" if the errors were handled
  // false otherwise to ensure errors are bubbled up
  onErrors: (errs: Array<any>) => boolean;
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
  });

  const queryBatchLink = split(
    operation => operation.getContext().batchedQuery !== false,
    new BatchHttpLink({
      uri: gqlClientOpts.httpUrl,
      batchMax: 30,
      batchInterval: 50,
    }),
    nonBatchedLink
  );

  const mutationBatchLink = split(
    operation => operation.getContext().batchedMutation,
    new BatchHttpLink({
      uri: gqlClientOpts.httpUrl,
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

  function getContextWithToken(opts: { token: string }) {
    return {
      headers: {
        Authorization: `Bearer ${opts.token}`,
      },
    };
  }

  function authenticateSubscriptionDocument(opts: {
    gql: DocumentNode;
    token: string;
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

  const gqlClient: SMGQLClient = {
    query: async opts => {
      try {
        const { data } = await baseClient.query({
          query: opts.gql,
          context: {
            batchedQuery: opts.batched != null ? opts.batched : true,
            ...getContextWithToken({ token: opts.token }),
          },
        });

        return data;
      } catch (e) {
        const gqlErrors = (e as any).graphQLErrors;
        if (gqlErrors) {
          if (gqlClientOpts.onErrors(gqlErrors)) {
            return { data: null, errors: gqlErrors };
          }
        }

        throw e;
      }
    },
    subscribe: opts => {
      const subscription = baseClient
        .subscribe({
          query: authenticateSubscriptionDocument(opts),
        })
        .subscribe({
          next: message => {
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
  };

  return gqlClient;
}
