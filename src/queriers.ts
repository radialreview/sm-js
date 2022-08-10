import { DEFAULT_TOKEN_NAME, NODES_PROPERTY_KEY } from './consts';
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
  FilterOperator,
  QueryRecord,
  FilterValue,
} from './types';
import { update, isArray } from 'lodash';
import { getFlattenedNodeFilterObject } from './dataUtilities';
import { OBJECT_PROPERTY_SEPARATOR } from './dataTypes';
import {
  FilterOperatorNotImplementedException,
  FilterPropertyNotDefinedInQueryException,
} from './exceptions';
import { NULL_TAG } from './dataConversions';

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

    // Mutates the response object to apply the filters on the client side.
    // This is just temporary until backend supports all the filters.
    function mutateResponseWithQueryRecordFilters(
      queryRecord: QueryRecord,
      responseData: any
    ) {
      Object.keys(queryRecord).forEach(alias => {
        const queryRecordEntry = queryRecord[alias];
        if (queryRecordEntry.filter) {
          const filterObject = getFlattenedNodeFilterObject(
            queryRecordEntry.filter
          );
          if (filterObject && responseData[alias]) {
            Object.keys(filterObject).forEach(filterPropertyName => {
              const underscoreSeparatedPropertyPath = filterPropertyName.replaceAll(
                '.',
                OBJECT_PROPERTY_SEPARATOR
              );

              const filterPropertyIsNotDefinedInTheQuery =
                queryRecordEntry.properties.includes(
                  underscoreSeparatedPropertyPath
                ) === false;

              if (filterPropertyIsNotDefinedInTheQuery) {
                throw new FilterPropertyNotDefinedInQueryException({
                  filterPropName: filterPropertyName,
                });
              }

              if (filterPropertyName) {
                update(
                  responseData,
                  `${alias}.${NODES_PROPERTY_KEY}`,
                  currentValue => {
                    if (!isArray(currentValue)) {
                      return currentValue;
                    }
                    return currentValue.filter(item => {
                      const propertyFilter: FilterValue<any> =
                        filterObject[filterPropertyName];

                      // Handle null filtering since backend returns "__NULL__" string instead of null
                      const value =
                        item[underscoreSeparatedPropertyPath] === NULL_TAG
                          ? null
                          : item[underscoreSeparatedPropertyPath];

                      return (Object.keys(propertyFilter) as Array<
                        FilterOperator
                      >).every(filterOperator => {
                        switch (filterOperator) {
                          case '_contains': {
                            return (
                              String(value)
                                .toLowerCase()
                                .indexOf(
                                  String(
                                    propertyFilter[filterOperator]
                                  ).toLowerCase()
                                ) !== -1
                            );
                          }
                          case '_ncontains': {
                            return (
                              String(value)
                                .toLowerCase()
                                .indexOf(
                                  String(
                                    propertyFilter[filterOperator]
                                  ).toLowerCase()
                                ) === -1
                            );
                          }
                          case '_eq': {
                            return (
                              String(value).toLowerCase() ===
                              String(
                                propertyFilter[filterOperator]
                              ).toLowerCase()
                            );
                          }
                          case '_neq':
                            return (
                              String(value).toLowerCase() !==
                              String(
                                propertyFilter[filterOperator]
                              ).toLowerCase()
                            );
                          case '_gt':
                            return value > propertyFilter[filterOperator];
                          case '_gte':
                            return value >= propertyFilter[filterOperator];
                          case '_lt':
                            return value < propertyFilter[filterOperator];
                          case '_lte':
                            return value <= propertyFilter[filterOperator];
                          default:
                            throw new FilterOperatorNotImplementedException({
                              operator: filterOperator,
                            });
                        }
                      });
                    });
                  }
                );
              }
            });
          }
        }

        const relational = queryRecordEntry.relational;

        if (relational != null) {
          Object.keys(relational).forEach(() => {
            if (
              responseData[alias] &&
              responseData[alias][NODES_PROPERTY_KEY]
            ) {
              responseData[alias][NODES_PROPERTY_KEY].forEach((item: any) => {
                mutateResponseWithQueryRecordFilters(relational, item);
              });
            }
          });
        }
      });
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

            mutateResponseWithQueryRecordFilters(queryRecord, response);

            return response;
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
          }).queryRecord,
          {
            onPaginate: () => {
              qM.onQueryResult({ queryId, queryResult: results });
            },
          }
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

    const queryManager = new mmGQLInstance.QueryManager(queryRecord);

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
