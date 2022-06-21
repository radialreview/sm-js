import { DEFAULT_TOKEN_NAME } from './consts';
import {
  convertQueryDefinitionToQueryInfo,
  SubscriptionConfig,
} from './queryDefinitionAdapters';
import {
  ISMJS,
  ISMQueryManager,
  QueryDefinitions,
  QueryOpts,
  QueryReturn,
  QueryDataReturn,
  SubscriptionOpts,
  SubscriptionMeta,
  SubscriptionCanceller,
  ISMGQLClient,
} from './types';

let queryIdx = 0;

function splitQueryDefinitionsByToken<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(queryDefinitions: TQueryDefinitions): Record<string, TQueryDefinitions> {
  return Object.entries(queryDefinitions).reduce(
    (split, [alias, queryDefinition]) => {
      const tokenName =
        queryDefinition &&
        'tokenName' in queryDefinition &&
        queryDefinition.tokenName != null
          ? queryDefinition.tokenName
          : DEFAULT_TOKEN_NAME;

      split[tokenName] = split[tokenName] || {};
      split[tokenName][
        alias as keyof TQueryDefinitions
      ] = queryDefinition as TQueryDefinitions[string];

      return split;
    },
    {} as Record<string, TQueryDefinitions>
  );
}

export function removeNullishQueryDefinitions<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(queryDefinitions: TQueryDefinitions) {
  return Object.entries(queryDefinitions).reduce(
    (acc, [alias, queryDefinition]) => {
      if (!queryDefinition) return acc;
      acc[
        alias as keyof TQueryDefinitions
      ] = queryDefinition as TQueryDefinitions[string];
      return acc;
    },
    {} as TQueryDefinitions
  );
}

function getNullishResults<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(queryDefinitions: TQueryDefinitions) {
  return Object.entries(queryDefinitions).reduce(
    (acc, [key, queryDefinition]) => {
      if (queryDefinition == null)
        acc[key as keyof TQueryDefinitions] = null as QueryDataReturn<
          TQueryDefinitions
        >[keyof TQueryDefinitions];

      return acc;
    },
    {} as QueryDataReturn<TQueryDefinitions>
  );
}

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
  return async function query<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TSMNode,
      TMapFn,
      TQueryDefinitionTarget
    >
  >(
    queryDefinitions: TQueryDefinitions,
    opts?: QueryOpts<TQueryDefinitions>
  ): Promise<QueryReturn<TQueryDefinitions>> {
    const startStack = new Error().stack as string;
    const queryId = opts?.queryId || `smQuery${queryIdx++}`;

    function getError(error: any, stack?: string) {
      // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
      error.stack =
        `\n` +
        (stack || error.stack) +
        '\n' +
        startStack.substring(startStack.indexOf('\n') + 1);

      return error;
    }

    function getToken(tokenName: string) {
      const token = smJSInstance.getToken({ tokenName });

      if (!token) {
        throw new Error(
          `No token registered with the name "${tokenName}".\n` +
            'Please register this token prior to using it with sm.setToken({ tokenName, token })) '
        );
      }

      return token;
    }

    const nonNullishQueryDefinitions = removeNullishQueryDefinitions(
      queryDefinitions
    );
    const nullishResults = getNullishResults(queryDefinitions);
    const queryDefinitionsSplitByToken = splitQueryDefinitionsByToken(
      nonNullishQueryDefinitions
    );

    async function performQueries() {
      const allResults = await Promise.all(
        Object.entries(queryDefinitionsSplitByToken).map(
          async ([tokenName, queryDefinitions]) => {
            const { queryGQL } = convertQueryDefinitionToQueryInfo({
              queryDefinitions: queryDefinitions,
              queryId: queryId + '_' + tokenName,
            });

            const queryOpts: Parameters<ISMGQLClient['query']>[0] = {
              gql: queryGQL,
              token: getToken(tokenName),
            };
            if (opts && 'batchKey' in opts) {
              queryOpts.batchKey = opts.batchKey;
            }

            const result = await smJSInstance.gqlClient.query(queryOpts);
            // console.log(JSON.stringify(result));
            // function getFilter(): ValidFilterForNode<TSMNode> {

            // }
            // const filters = Object.keys(queryDefinitions).forEach(queryDefinitionsAlias => {
            //   const queryDefinition: QueryDefinition<any, any, any> | ISMNode | null = queryDefinitions[queryDefinitionsAlias];
            // })

            return result;
          }
        )
      );

      return allResults.reduce(
        (acc, resultsForToken) => {
          return {
            ...acc,
            ...resultsForToken,
          };
        },
        { ...nullishResults }
      );
    }

    try {
      if (!Object.keys(nonNullishQueryDefinitions).length) {
        opts?.onData && opts.onData({ results: { ...nullishResults } });

        return {
          data: { ...nullishResults },
          error: undefined,
        };
      }
      const results = await performQueries();

      const qM =
        queryManager ||
        new smJSInstance.SMQueryManager(
          convertQueryDefinitionToQueryInfo({
            queryDefinitions: nonNullishQueryDefinitions,
            queryId,
          }).queryRecord
        );
      try {
        qM.onQueryResult({
          queryId,
          queryResult: results,
        });
      } catch (e) {
        const error = getError(
          new Error(`Error applying query results`),
          (e as any).stack
        );

        if (opts?.onError) {
          opts.onError(error);
          return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
        } else {
          throw error;
        }
      }

      const qmResults = qM.getResults() as QueryDataReturn<TQueryDefinitions>;

      opts?.onData &&
        opts.onData({ results: { ...nullishResults, ...qmResults } });

      return {
        data: { ...nullishResults, ...qmResults } as QueryDataReturn<
          TQueryDefinitions
        >,
        error: undefined,
      };
    } catch (e) {
      const error = getError(
        new Error(`Error querying data`),
        (e as any).stack
      );
      if (opts?.onError) {
        opts.onError(error);
        return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
      } else {
        throw error;
      }
    }
  };
}

let subscriptionId = 0;
export function generateSubscriber(smJSInstance: ISMJS) {
  return async function subscribe<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TSMNode,
      TMapFn,
      TQueryDefinitionTarget
    >,
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
    const queryId = opts?.queryId || `smQuery${subscriptionId++}`;
    const nonNullishQueryDefinitions = removeNullishQueryDefinitions(
      queryDefinitions
    );
    const nullishResults = getNullishResults(queryDefinitions);

    if (!Object.keys(nonNullishQueryDefinitions).length) {
      opts.onData({ results: { ...nullishResults } });
      return { data: { ...nullishResults }, unsub: () => {} } as ReturnType;
    }
    const { queryGQL, queryRecord } = convertQueryDefinitionToQueryInfo({
      queryDefinitions: nonNullishQueryDefinitions,
      queryId,
    });

    opts.onQueryInfoConstructed &&
      opts.onQueryInfoConstructed({ queryGQL, queryId });

    function getError(error: any, stack?: any) {
      // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
      error.stack =
        '\n' +
        (stack || error.stack) +
        '\n' +
        startStack.substring(startStack.indexOf('\n') + 1);

      return error;
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
          new Error(`Error applying subscription message`),
          (e as any).stack
        );

        if (opts.onError) {
          opts.onError(error);
        } else {
          console.error(error);
        }
      }
    }

    function getToken(tokenName: string) {
      const token = smJSInstance.getToken({ tokenName });

      if (!token) {
        throw new Error(
          `No token registered with the name "${tokenName}".\n` +
            'Please register this token prior to using it with sm.setToken({ tokenName, token })) '
        );
      }

      return token;
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
      const queryDefinitionsSplitByToken = splitQueryDefinitionsByToken(
        nonNullishQueryDefinitions
      );

      Object.entries(queryDefinitionsSplitByToken).forEach(
        ([tokenName, queryDefinitions]) => {
          const { subscriptionConfigs } = convertQueryDefinitionToQueryInfo({
            queryDefinitions,
            queryId: queryId + '_' + tokenName,
          });

          subscriptionCancellers.push(
            ...subscriptionConfigs.map(subscriptionConfig => {
              return smJSInstance.gqlClient.subscribe({
                gql: subscriptionConfig.gql,
                token: getToken(tokenName),
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
                    results: {
                      ...nullishResults,
                      ...queryManager.getResults(),
                    } as QueryDataReturn<TQueryDefinitions>,
                  });
                },
                onError: e => {
                  // Can never throw here. The dev consuming this would have no way of catching it
                  // To catch an error in a subscription they must provide onError
                  const error = getError(
                    new Error(`Error in a subscription message`),
                    e.stack
                  );

                  if (opts.onError) {
                    opts.onError(error);
                  } else {
                    console.error(error);
                  }
                },
              });
            })
          );
        }
      );
    }

    function unsub() {
      subscriptionCancellers.forEach(cancel => cancel());
    }

    try {
      initSubs();
      opts.onSubscriptionInitialized && opts.onSubscriptionInitialized(unsub);
    } catch (e) {
      const error = getError(
        new Error(`Error initializating subscriptions`),
        (e as any).stack
      );

      if (opts?.onError) {
        opts.onError(error);
        return { data: {}, unsub, error } as ReturnType;
      } else {
        throw error;
      }
    }

    if (opts.skipInitialQuery) {
      return { unsub } as ReturnType;
    } else {
      const query = generateQuerier({ smJSInstance, queryManager });
      try {
        const queryOpts: Parameters<typeof query>[1] = {
          queryId: opts.queryId,
        };
        if (opts && 'batchKey' in opts) {
          queryOpts.batchKey = opts.batchKey;
        }
        // this query method will post its results to the queryManager declared above
        await query(queryDefinitions, queryOpts);
      } catch (e) {
        const error = getError(
          new Error(`Error querying initial data set`),
          (e as any).stack
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

      const qmResults = queryManager.getResults() as QueryDataReturn<
        TQueryDefinitions
      >;

      opts.onData({ results: { ...nullishResults, ...qmResults } });

      return {
        data: { ...nullishResults, ...qmResults },
        unsub,
        error: null,
      } as ReturnType;
    }
  };
}
