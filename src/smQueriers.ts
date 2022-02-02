import {
  convertQueryDefinitionToQueryInfo,
  SubscriptionConfig,
} from './queryDefinitionAdapters';

let queryIdx = 0;

/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */
export function generateQuerier({
  smJSInstance,
  queryManager,
}: {
  smJSInstance: ISMJS;
  queryManager?: ISMQueryManager;
}) {
  return async function query<TQueryDefinitions extends QueryDefinitions>(
    queryDefinitions: TQueryDefinitions,
    opts?: QueryOpts<TQueryDefinitions>
  ): Promise<QueryReturn<TQueryDefinitions>> {
    const startStack = new Error().stack as string;

    const queryId = opts?.queryId || `smQuery${queryIdx++}`;
    const { queryGQL, queryRecord } = convertQueryDefinitionToQueryInfo({
      queryDefinitions,
      queryId,
    });

    const tokenName = opts?.tokenName || 'default';
    const token = smJSInstance.getToken({ tokenName });

    function getError(error: any) {
      if (opts?.onError) {
        return error;
      } else {
        // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
        error.stack =
          error.stack +
          '\n' +
          startStack.substring(startStack.indexOf('\n') + 1);

        return error;
      }
    }

    if (!token) {
      const error = getError(
        new Error(
          `No token registered with the name "${tokenName}".\n` +
            'Please register this token prior to using it with sm.setToken({ tokenName, token })) '
        )
      );

      if (opts?.onError) {
        opts.onError(error);
        return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
      } else {
        throw error;
      }
    }

    return smJSInstance.gqlClient
      .query({
        gql: queryGQL,
        token: token,
        batched: opts?.batched,
      })
      .then((queryResult: any) => {
        let results;
        try {
          const qM =
            queryManager || new smJSInstance.SMQueryManager(queryRecord);
          qM.onQueryResult({
            queryId,
            queryResult,
          });

          results = qM.getResults() as QueryDataReturn<TQueryDefinitions>;
        } catch (e) {
          const error = getError(
            new Error(`Error applying query results\n${e}`)
          );

          if (opts?.onError) {
            opts.onError(error);
            return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
          } else {
            throw error;
          }
        }

        opts?.onData && opts.onData({ results });
        return { data: results, error: null };
      })
      .catch(e => {
        const error = getError(new Error(`Error querying data\n${e}`));
        if (opts?.onError) {
          opts.onError(error);
          return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
        } else {
          throw error;
        }
      });
  };
}

export function generateSubscriber(smJSInstance: ISMJS) {
  return async function subscribe<
    TQueryDefinitions extends QueryDefinitions,
    TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>
  >(
    queryDefinitions: TQueryDefinitions,
    opts: TSubscriptionOpts
  ): Promise<
    TSubscriptionOpts extends { skipInitialQuery: true }
      ? SubscriptionMeta
      : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta
  > {
    type ReturnType = TSubscriptionOpts extends {
      skipInitialQuery: true;
    }
      ? SubscriptionMeta
      : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta;

    // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
    const startStack = new Error().stack as string;
    const queryId = opts?.queryId || `smQuery${queryIdx++}`;
    const {
      queryRecord,
      subscriptionConfigs,
    } = convertQueryDefinitionToQueryInfo({
      queryDefinitions,
      queryId,
    });

    function getError(error: any) {
      if (opts.onError) {
        return error;
      } else {
        // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
        error.stack =
          error.stack +
          '\n' +
          startStack.substring(startStack.indexOf('\n') + 1);

        return error;
      }
    }

    const tokenName = opts?.tokenName || 'default';
    const token = smJSInstance.getToken({ tokenName });

    if (!token) {
      const error = getError(
        new Error(
          `No token registered with the name "${tokenName}".\n` +
            'Please register this token prior to using it with sm.setToken(tokenName, { token })) '
        )
      );
      if (opts.onError) {
        opts.onError(error);
        return { data: {}, unsub, error } as TSubscriptionOpts extends {
          skipInitialQuery: true;
        }
          ? SubscriptionMeta
          : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta;
      } else {
        throw error;
      }
    }

    const queryManager = new smJSInstance.SMQueryManager(queryRecord);

    function updateQueryManagerWithSubscriptionMessage(data: {
      message: Record<string, any>;
      subscriptionConfig: SubscriptionConfig;
    }) {
      let node;
      let operation;
      try {
        node = data.subscriptionConfig.extractNodeFromSubscriptionMessage(
          data.message
        );
        operation = data.subscriptionConfig.extractOperationFromSubscriptionMessage(
          data.message
        );
        queryManager.onSubscriptionMessage({
          node,
          operation,
          queryId: queryId,
          subscriptionAlias: data.subscriptionConfig.alias,
        });
      } catch (e) {
        const error = getError(
          new Error(`Error applying subscription message\n${e}`)
        );

        if (opts.onError) {
          opts.onError(error);
        } else {
          console.error(error);
        }
      }
    }

    let subscriptionCancellers: Array<SubscriptionCanceller> = [];
    // Subscriptions are initialized immediately, rather than after the query resolves, to prevent an edge case where an update to a node happens
    // while the data for that node is being transfered from SM to the client. This would result in a missed update.
    // However, we must be careful to not call opts.onData with any subscription messages before the query resolves,
    // because a subscription message only includes info about the node that changed, not all data being subscribed to,
    // which means the consumer of this API would receive and incomplete data set in this edge case.
    // This flag prevents that, by short-circuiting opts.onData in subscription messages, if the query has not resolved
    let mustAwaitQuery = !opts.skipInitialQuery;
    const messageQueue: Array<{
      message: Record<string, any>;
      subscriptionConfig: SubscriptionConfig;
    }> = [];
    function initSubs() {
      try {
        subscriptionCancellers = subscriptionConfigs.map(subscriptionConfig => {
          return smJSInstance.gqlClient.subscribe({
            gql: subscriptionConfig.gql,
            token: token,
            onMessage: message => {
              if (mustAwaitQuery) {
                messageQueue.push({ message, subscriptionConfig });
                return;
              }

              updateQueryManagerWithSubscriptionMessage({
                message,
                subscriptionConfig,
              });

              // @TODO When called with skipInitialQuery, results should be null
              // and we should simply expose a "delta" from the message
              // probably don't need a query manager in that case either.
              opts.onData({
                results: queryManager.getResults() as QueryDataReturn<
                  TQueryDefinitions
                >,
              });
            },
            onError: e => {
              // Can never throw here. The dev consuming this would have no way of catching it
              // To catch an error in a subscription they must provide onError
              const error = getError(
                new Error(`Error in a subscription message\n${e}`)
              );

              if (opts.onError) {
                opts.onError(error);
              } else {
                console.error(error);
              }
            },
          });
        });
      } catch (e) {
        const error = getError(
          new Error(`Error initializating subscriptions\n${e}`)
        );

        if (opts?.onError) {
          opts.onError(error);
        } else {
          throw error;
        }
      }
    }

    function unsub() {
      subscriptionCancellers.forEach(cancel => cancel());
    }

    initSubs();
    opts.onSubscriptionInitialized && opts.onSubscriptionInitialized(unsub);
    if (opts.skipInitialQuery) {
      return { unsub } as ReturnType;
    } else {
      const query = generateQuerier({ smJSInstance, queryManager });
      try {
        // this query method will post its results to the queryManager declared above
        await query(queryDefinitions, {
          queryId: opts.queryId,
          tokenName: opts.tokenName,
          batched: opts.batched,
        });
      } catch (e) {
        const error = getError(
          new Error(`Error querying initial data set\n${e}`)
        );

        if (opts?.onError) {
          opts.onError(error);
          return { data: {}, unsub, error } as ReturnType;
        } else {
          throw error;
        }
      }

      if (mustAwaitQuery) {
        mustAwaitQuery = false;
        messageQueue.forEach(updateQueryManagerWithSubscriptionMessage);
        messageQueue.length = 0;
      }

      const data = queryManager.getResults() as QueryDataReturn<
        TQueryDefinitions
      >;

      opts.onData({ results: data as QueryDataReturn<TQueryDefinitions> });

      return { data, unsub, error: null } as ReturnType;
    }
  };
}
