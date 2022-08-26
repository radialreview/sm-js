import { cloneDeep } from 'lodash';

import { DEFAULT_TOKEN_NAME } from './consts';
import { generateMockNodeDataFromQueryDefinitions } from './generateMockData';
import {
  convertQueryDefinitionToQueryInfo,
  SubscriptionConfig,
} from './queryDefinitionAdapters';
import {
  IMMGQL,
  IQueryManager,
  QueryDefinitions,
  QueryOpts,
  QueryReturn,
  QueryDataReturn,
  SubscriptionOpts,
  SubscriptionMeta,
  SubscriptionCanceller,
  IGQLClient,
} from './types';
import { applyClientSideSortAndFilterToData } from './clientSideOperators';

let queryIdx = 0;

function splitQueryDefinitionsByToken<
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TNode,
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
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TNode,
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
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TNode,
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
  mmGQLInstance,
  queryManager,
}: {
  mmGQLInstance: IMMGQL;
  queryManager?: IQueryManager;
}) {
  return async function query<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TNode,
      TMapFn,
      TQueryDefinitionTarget
    >
  >(
    queryDefinitions: TQueryDefinitions,
    opts?: QueryOpts<TQueryDefinitions>
  ): Promise<QueryReturn<TQueryDefinitions>> {
    const startStack = new Error().stack as string;
    const queryId = opts?.queryId || `query${queryIdx++}`;

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
      const token = mmGQLInstance.getToken({ tokenName });

      if (!token) {
        throw new Error(
          `No token registered with the name "${tokenName}".\n` +
            'Please register this token prior to using it with setToken({ tokenName, token })) '
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
            let response;
            const { queryGQL, queryRecord } = convertQueryDefinitionToQueryInfo(
              {
                queryDefinitions: queryDefinitions,
                queryId: queryId + '_' + tokenName,
              }
            );

            if (mmGQLInstance.generateMockData) {
              response = generateMockNodeDataFromQueryDefinitions({
                queryDefinitions,
                queryId,
              });
            } else if (mmGQLInstance.enableQuerySlimming) {
              response = await mmGQLInstance.QuerySlimmer.query({
                queryId: `${queryId}_${tokenName}`,
                queryDefinitions,
                tokenName,
                queryOpts: opts,
              });
            } else {
              const queryOpts: Parameters<IGQLClient['query']>[0] = {
                gql: queryGQL,
                token: getToken(tokenName),
              };
              if (opts && 'batchKey' in opts) {
                queryOpts.batchKey = opts.batchKey;
              }
              response = await mmGQLInstance.gqlClient.query(queryOpts);
            }

            // clone the object only if we are running the unit test
            // to simulate that we are receiving new response
            // to prevent mutating the object multiple times when filtering or sorting
            // resulting into incorrect results in our specs
            const filteredAndSortedResponse =
              process.env.NODE_ENV === 'test' ? cloneDeep(response) : response;
            applyClientSideSortAndFilterToData(
              queryRecord,
              filteredAndSortedResponse
            );

            return filteredAndSortedResponse;
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
        new mmGQLInstance.QueryManager(
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
export function generateSubscriber(mmGQLInstance: IMMGQL) {
  return async function subscribe<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TNode,
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
    const queryId = opts?.queryId || `query${subscriptionId++}`;
    const nonNullishQueryDefinitions = removeNullishQueryDefinitions(
      queryDefinitions
    );
    const nullishResults = getNullishResults(queryDefinitions);

    if (!Object.keys(nonNullishQueryDefinitions).length) {
      opts.onData({ results: { ...nullishResults } });
      return { data: { ...nullishResults }, unsub: () => {} } as ReturnType;
    }
    const {
      queryGQL,
      queryRecord,
      queryParamsString,
    } = convertQueryDefinitionToQueryInfo({
      queryDefinitions: nonNullishQueryDefinitions,
      queryId,
    });

    opts.onQueryInfoConstructed &&
      opts.onQueryInfoConstructed({ queryGQL, queryId, queryParamsString });

    function getError(error: any, stack?: any) {
      // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
      error.stack =
        '\n' +
        (stack || error.stack) +
        '\n' +
        startStack.substring(startStack.indexOf('\n') + 1);

      return error;
    }

    const queryManager = new mmGQLInstance.QueryManager(queryRecord, {
      onPaginate: opts.onPaginate,
    });

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
        // TODO: https://tractiontools.atlassian.net/browse/TTD-377
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
      const token = mmGQLInstance.getToken({ tokenName });

      if (!token) {
        throw new Error(
          `No token registered with the name "${tokenName}".\n` +
            'Please register this token prior to using it with setToken({ tokenName, token })) '
        );
      }

      return token;
    }

    let subscriptionCancellers: Array<SubscriptionCanceller> = [];
    // Subscriptions are initialized immediately, rather than after the query resolves, to prevent an edge case where an update to a node happens
    // while the data for that node is being transfered from the backend to the client. This would result in a missed update.
    // However, we must be careful to not call opts.onData with any subscription messages before the query resolves,
    // because a subscription message only includes info about the node that changed, not all data being subscribed to,
    // which means the consumer of this API would receive and incomplete data set in this edge case.
    // This flag prevents that, by short-circuiting opts.onData in subscription messages, if the query has not resolved
    let mustAwaitQuery = !opts.skipInitialQuery;
    const messageQueue: Array<{
      message: Record<string, any>;
      subscriptionConfig: SubscriptionConfig;
    }> = [];
    const queryDefinitionsSplitByToken = splitQueryDefinitionsByToken(
      nonNullishQueryDefinitions
    );
    const queryDefinitionsSplitByTokenEntries = Object.entries(
      queryDefinitionsSplitByToken
    );

    function initSubs() {
      queryDefinitionsSplitByTokenEntries.forEach(
        ([tokenName, queryDefinitions]) => {
          const { subscriptionConfigs } = convertQueryDefinitionToQueryInfo({
            queryDefinitions,
            queryId: queryId + '_' + tokenName,
          });

          subscriptionCancellers.push(
            ...subscriptionConfigs.map(subscriptionConfig => {
              return mmGQLInstance.gqlClient.subscribe({
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
      queryDefinitionsSplitByTokenEntries.forEach(
        ([tokenName, queryDefinitions]) => {
          const { queryRecord } = convertQueryDefinitionToQueryInfo({
            queryDefinitions,
            queryId: queryId + '_' + tokenName,
          });
          mmGQLInstance.QuerySlimmer.onSubscriptionCancelled(queryRecord);
        }
      );
    }

    try {
      if (!mmGQLInstance.generateMockData) {
        initSubs();
      }
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
      const query = generateQuerier({ mmGQLInstance, queryManager });
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
