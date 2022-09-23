import { cloneDeep } from 'lodash';
import { DocumentNode } from 'graphql';

import { DEFAULT_TOKEN_NAME } from '../consts';
import { generateMockNodeDataForQueryRecord } from '../generateMockData';
import {
  convertQueryDefinitionToQueryInfo,
  SubscriptionConfig,
} from '../queryDefinitionAdapters';
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
  EPaginationFilteringSortingInstance,
  QueryRecord,
  Maybe,
} from '../types';
import { applyClientSideSortAndFilterToData } from '../clientSideOperators';

let queryIdx = 0;

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

    const nonNullishQueryDefinitions = removeNullishQueryDefinitions(
      queryDefinitions
    );
    const nullishResults = getNullishResults(queryDefinitions);

    try {
      if (!Object.keys(nonNullishQueryDefinitions).length) {
        const results = { ...nullishResults } as QueryDataReturn<
          TQueryDefinitions
        >;
        opts?.onData && opts.onData({ results });

        return {
          data: results,
          error: undefined,
        };
      }

      const dataToReturn = { ...nullishResults } as QueryDataReturn<
        TQueryDefinitions
      >;

      const queryDefinitionsSplitByToken = splitQueryDefinitionsByToken(
        nonNullishQueryDefinitions
      );

      const { queryRecord, queryGQL } = convertQueryDefinitionToQueryInfo({
        queryDefinitions,
        queryId,
        useServerSidePaginationFilteringSorting:
          mmGQLInstance.paginationFilteringSortingInstance ===
          EPaginationFilteringSortingInstance.SERVER,
      });

      const resultsForEachTokenUsed = await Promise.all(
        Object.entries(queryDefinitionsSplitByToken).map(
          ([tokenName, queryDefinitionsForThisToken]) => {
            return performQueries({
              mmGQLInstance,
              queryGQL,
              queryRecord: Object.entries(queryRecord).reduce(
                (acc, [alias, queryRecordEntry]) => {
                  if (queryDefinitionsForThisToken[alias]) {
                    acc[alias] = queryRecordEntry;
                  }

                  return acc;
                },
                {} as QueryRecord
              ),
              tokenName,
              queryId,
              batchKey: opts?.batchKey,
            });
          }
        )
      );

      const allResults = resultsForEachTokenUsed.reduce(
        (acc, resultsForToken) => {
          return {
            ...acc,
            ...resultsForToken,
          };
        },
        {}
      );

      const qM =
        queryManager ||
        new mmGQLInstance.QueryManager(queryRecord, {
          performQuery: ({ queryRecord, queryGQL, tokenName }) =>
            performQueries({
              mmGQLInstance,
              queryRecord,
              queryId,
              tokenName,
              queryGQL,
              batchKey: opts?.batchKey,
              getMockDataDelay: mmGQLInstance.getMockDataDelay,
            }),
          resultsObject: dataToReturn,
          onResultsUpdated: () => {
            opts?.onData && opts.onData({ results: dataToReturn });
          },
          queryId,
          useServerSidePaginationFilteringSorting:
            mmGQLInstance.paginationFilteringSortingInstance ===
            EPaginationFilteringSortingInstance.SERVER,
        });
      try {
        qM.onQueryResult({
          queryId,
          queryResult: allResults,
        });
        opts?.onData && opts.onData({ results: dataToReturn });
      } catch (e) {
        const error = getError(
          new Error(`Error applying query results`),
          (e as any).stack
        );

        if (opts?.onError) {
          opts.onError(error);
          return {
            data: dataToReturn as QueryDataReturn<TQueryDefinitions>,
            error,
          };
        } else {
          throw error;
        }
      }

      return {
        data: dataToReturn,
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

    const dataToReturn = { ...nullishResults } as QueryDataReturn<
      TQueryDefinitions
    >;

    if (!Object.keys(nonNullishQueryDefinitions).length) {
      opts.onData({ results: dataToReturn });
      return { data: dataToReturn, unsub: () => {} } as ReturnType;
    }
    const {
      queryGQL,
      queryRecord,
      queryParamsString,
    } = convertQueryDefinitionToQueryInfo({
      queryDefinitions: nonNullishQueryDefinitions,
      queryId,
      useServerSidePaginationFilteringSorting:
        mmGQLInstance.paginationFilteringSortingInstance ===
        EPaginationFilteringSortingInstance.SERVER,
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

    // need to pass the info page from the results from this specific root/relational alias
    // to the query builder, such that it applies the correct pagination param on that root/relational alias
    // q: should the query manager perform the query? This would avoid having to pass data around in callbacks
    //    instead the query manager would build the minimal queryRecord needed to
    //    perform the new query for the next set of results and would append them to the results object?

    //    Another option would be for the query manager to expect a callback function (as it does now)
    //    which is called with a query record for that minimal query, and this fn needs to perform the query
    //    and return the result of that query.

    // Requirements
    //    - loadMoreResults should append the new list of results to the previous list
    //    - ensure that the correct token is used in the query for the next set of results
    //       if a "query" fn is passed to the queryManager

    const queryManager = new mmGQLInstance.QueryManager(queryRecord, {
      resultsObject: dataToReturn,
      performQuery: ({ queryRecord, queryGQL, tokenName }) =>
        performQueries({
          mmGQLInstance,
          queryRecord,
          queryId,
          tokenName,
          queryGQL,
          batchKey: opts?.batchKey,
        }),
      onResultsUpdated: () => {
        opts.onData({ results: dataToReturn });
      },
      queryId,
      useServerSidePaginationFilteringSorting:
        mmGQLInstance.paginationFilteringSortingInstance ===
        EPaginationFilteringSortingInstance.SERVER,
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
            useServerSidePaginationFilteringSorting:
              mmGQLInstance.paginationFilteringSortingInstance ===
              EPaginationFilteringSortingInstance.SERVER,
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
            useServerSidePaginationFilteringSorting:
              mmGQLInstance.paginationFilteringSortingInstance ===
              EPaginationFilteringSortingInstance.SERVER,
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
        return { data: dataToReturn, unsub, error } as ReturnType;
      } else {
        throw error;
      }
    }

    if (opts.skipInitialQuery) {
      return { unsub } as ReturnType;
    } else {
      const query = generateQuerier({ mmGQLInstance, queryManager });
      try {
        const params: Parameters<typeof query> = [
          queryDefinitions,
          {
            queryId: opts.queryId,
            batchKey: opts.batchKey,
          },
        ];
        // this query method will post its results to the queryManager declared above
        await query(...params);
      } catch (e) {
        const error = getError(
          new Error(`Error querying initial data set`),
          (e as any).stack
        );

        if (opts?.onError) {
          opts.onError(error);
          return { data: dataToReturn, unsub, error } as ReturnType;
        } else {
          throw error;
        }
      }

      if (mustAwaitQuery) {
        mustAwaitQuery = false;
        messageQueue.forEach(updateQueryManagerWithSubscriptionMessage);
        messageQueue.length = 0;
      }

      opts.onData({ results: dataToReturn });

      return {
        data: dataToReturn,
        unsub,
        error: undefined,
      } as ReturnType;
    }
  };
}

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

async function performQueries(opts: {
  queryRecord: QueryRecord;
  queryGQL: DocumentNode;
  mmGQLInstance: IMMGQL;
  queryId: string;
  tokenName: Maybe<string>;
  batchKey?: string;
  getMockDataDelay?: () => number;
}) {
  function getToken(tokenName: string) {
    const token = opts.mmGQLInstance.getToken({ tokenName });

    if (!token) {
      throw new Error(
        `No token registered with the name "${tokenName}".\n` +
          'Please register this token prior to using it with setToken({ tokenName, token })) '
      );
    }

    return token;
  }

  let response;

  if (opts.mmGQLInstance.generateMockData) {
    response = generateMockNodeDataForQueryRecord({
      queryRecord: opts.queryRecord,
    });
  } else if (opts.mmGQLInstance.enableQuerySlimming) {
    response = await opts.mmGQLInstance.QuerySlimmer.query({
      queryId: opts.queryId,
      queryRecord: opts.queryRecord,
      useServerSidePaginationFilteringSorting:
        opts.mmGQLInstance.paginationFilteringSortingInstance ===
        EPaginationFilteringSortingInstance.SERVER,
      tokenName: opts.tokenName || DEFAULT_TOKEN_NAME,
      batchKey: opts.batchKey,
    });
  } else {
    const params: Parameters<IGQLClient['query']> = [
      {
        gql: opts.queryGQL,
        token: getToken(opts.tokenName || DEFAULT_TOKEN_NAME),
        batchKey: opts.batchKey,
      },
    ];
    response = await opts.mmGQLInstance.gqlClient.query(...params);
  }

  if (
    opts.mmGQLInstance.paginationFilteringSortingInstance ===
    EPaginationFilteringSortingInstance.CLIENT
  ) {
    // clone the object only if we are running the unit test
    // to simulate that we are receiving new response
    // to prevent mutating the object multiple times when filtering or sorting
    // resulting into incorrect results in our specs
    const filteredAndSortedResponse =
      process.env.NODE_ENV === 'test' ? cloneDeep(response) : response;
    applyClientSideSortAndFilterToData(
      opts.queryRecord,
      filteredAndSortedResponse
    );

    return filteredAndSortedResponse;
  }

  await new Promise(res => setTimeout(res, opts.getMockDataDelay?.() || 0));
  return response;
}
