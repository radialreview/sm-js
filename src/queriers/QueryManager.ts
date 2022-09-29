import {
  NodesCollection,
  PageInfoFromResults,
  ClientSidePageInfo,
} from '../nodesCollection';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_TOKEN_NAME,
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
  RELATIONAL_UNION_QUERY_SEPARATOR,
} from '../consts';
import { DataParsingException, UnreachableCaseError } from '../exceptions';
import {
  IDOProxy,
  Maybe,
  IMMGQL,
  IQueryManager,
  QueryRecord,
  BaseQueryRecordEntry,
  RelationalQueryRecordEntry,
  QueryRecordEntry,
  DocumentNode,
  RelationalQueryRecord,
  IQueryPagination,
} from '../types';
import {
  getQueryGQLStringFromQueryRecord,
  queryRecordEntryReturnsArrayOfData,
} from './queryDefinitionAdapters';
import { gql } from '@apollo/client';
import { extend } from '../dataUtilities';

type QueryManagerState = Record<
  string, // the alias for this set of results
  QueryManagerStateEntry
>;

type QueryManagerStateEntry = {
  // which id or ids represent the most up to date results for this alias, used in conjunction with proxyCache to build a returned data set
  idsOrIdInCurrentResult: string | Array<string> | null;
  proxyCache: QueryManagerProxyCache;
  pageInfoFromResults: Maybe<PageInfoFromResults>;
  clientSidePageInfo: Maybe<ClientSidePageInfo>;
};

type QueryManagerProxyCache = Record<
  string, // id of the node
  QueryManagerProxyCacheEntry
>;

type QueryManagerProxyCacheEntry = {
  proxy: IDOProxy;
  relationalState: Maybe<QueryManagerState>;
}; // the proxy for that DO and relational state from the query results/latest subscription message

type QueryManagerOpts = {
  queryId: string;
  useServerSidePaginationFilteringSorting: boolean;
  // an object which will be mutated when a "loadMoreResults" function is called
  // on a node collection
  resultsObject: Object;
  // A callback that is executed when the resultsObject above is mutated
  onResultsUpdated(): void;
  performQuery(opts: {
    queryRecord: QueryRecord;
    queryGQL: DocumentNode;
    tokenName: Maybe<string>;
  }): Promise<any>;
};

export function createQueryManager(mmGQLInstance: IMMGQL) {
  /**
   * QueryManager is in charge of
   *
   *    1) receiving data from a query and notifying the appropriate DO repositories
   *    2) building proxies for those DOs
   *    3) keeping a cache of those generated proxies so that we can update proxies on subscription messages, rather than generating new ones
   *    4) handling incoming subscription messages and
   *       4.1) notifying DO repositories with the data in those sub messages
   *       4.2) build proxies for new DOs received + update relational data (recursively) for proxies that had been previously built
   *    5) building the resulting data that is returned by queriers from its cache of proxies
   */
  return class QueryManager implements IQueryManager {
    public state: QueryManagerState = {};
    public queryRecord: QueryRecord;
    public opts: QueryManagerOpts;

    constructor(queryRecord: QueryRecord, opts: QueryManagerOpts) {
      this.queryRecord = queryRecord;
      this.opts = opts;
    }

    public onQueryResult(opts: { queryResult: any }) {
      this.notifyRepositories({
        data: opts.queryResult,
        queryRecord: this.queryRecord,
      });

      this.state = this.getNewStateFromQueryResult({
        ...opts,
        queryRecord: this.queryRecord,
      });

      extend({
        object: this.opts.resultsObject,
        extension: this.getResultsFromState({
          state: this.state,
          aliasPath: [],
        }),
        extendNestedObjects: false,
        deleteKeysNotInExtension: false,
      });
    }

    public onSubscriptionMessage(opts: {
      node: Record<string, any>;
      operation: {
        action: 'UpdateNode' | 'DeleteNode' | 'InsertNode' | 'DeleteEdge';
        path: string;
      };
      queryId: string;
      subscriptionAlias: string;
    }) {
      const { node, subscriptionAlias } = opts;
      const queryRecordEntryForThisSubscription = this.queryRecord[
        subscriptionAlias
      ];

      this.notifyRepositories({
        data: {
          [subscriptionAlias]: node,
        },
        queryRecord: {
          [subscriptionAlias]: queryRecordEntryForThisSubscription,
        },
      });

      this.updateProxiesAndStateFromSubscriptionMessage(opts);

      Object.assign(
        this.opts.resultsObject,
        this.getResultsFromState({ state: this.state, aliasPath: [] })
      );
    }

    /**
     * Is used to build the root level results for the query, and also to build the relational results
     * used by each proxy, which is why "state" is a param here
     *
     * alias path is required such that when "loadMore" is executed on a node collection
     * this query manager can perform a new query with the minimal query record necessary
     * and extend the result set with the new results
     */
    public getResultsFromState(opts: {
      state: QueryManagerState;
      aliasPath?: Array<string>;
    }): Record<string, any> {
      return Object.keys(opts.state).reduce((resultsAcc, queryAlias) => {
        const stateForThisAlias = opts.state[queryAlias];
        const idsOrId = stateForThisAlias.idsOrIdInCurrentResult;
        const pageInfoFromResults = stateForThisAlias.pageInfoFromResults;
        const clientSidePageInfo = stateForThisAlias.clientSidePageInfo;

        const resultsAlias = this.removeUnionSuffix(queryAlias);

        if (Array.isArray(idsOrId)) {
          if (!pageInfoFromResults) {
            throw Error(
              `No page info for results found for the alias ${queryAlias}`
            );
          }

          if (!clientSidePageInfo) {
            throw Error(
              `No client side page info found for the alias ${queryAlias}`
            );
          }

          const items = idsOrId.map(
            id => stateForThisAlias.proxyCache[id].proxy
          );
          const aliasPath = [...(opts.aliasPath || []), resultsAlias];
          resultsAcc[resultsAlias] = new NodesCollection({
            items,
            clientSidePageInfo,
            pageInfoFromResults,
            // allows the UI to re-render when a nodeCollection's internal state is updated
            onPaginationRequestStateChanged: this.opts.onResultsUpdated,
            onLoadMoreResults: () =>
              this.onLoadMoreResults({
                aliasPath,
                previousEndCursor: pageInfoFromResults.endCursor,
              }),
            onGoToNextPage: () =>
              this.onGoToNextPage({
                aliasPath,
                previousEndCursor: pageInfoFromResults.endCursor,
              }),
            onGoToPreviousPage: () =>
              this.onGoToPreviousPage({
                aliasPath,
                previousStartCursor: pageInfoFromResults.startCursor,
              }),
            useServerSidePaginationFilteringSorting: this.opts
              .useServerSidePaginationFilteringSorting,
          });
        } else if (idsOrId) {
          resultsAcc[resultsAlias] =
            stateForThisAlias.proxyCache[idsOrId].proxy;
        } else {
          resultsAcc[resultsAlias] = null;
        }

        return resultsAcc;
      }, {} as Record<string, any>);
    }

    /**
     * Takes a queryRecord and the data that resulted from that query
     * notifies the appropriate repositories so that DOs can be constructed or updated
     */
    public notifyRepositories(opts: {
      data: Record<string, any>;
      queryRecord: {
        [key: string]: QueryRecordEntry | RelationalQueryRecordEntry;
      };
    }) {
      Object.keys(opts.queryRecord).forEach(queryAlias => {
        const dataForThisAlias = this.getDataFromResponse({
          queryRecordEntry: opts.queryRecord[queryAlias],
          dataForThisAlias: opts.data[queryAlias],
        });

        if (!dataForThisAlias) {
          throw Error(
            `notifyRepositories could not find resulting data for the alias "${queryAlias}" in the following queryRecord:\n${JSON.stringify(
              opts.queryRecord,
              null,
              2
            )}\nResulting data:\n${JSON.stringify(opts.data, null, 2)}`
          );
        }

        const nodeRepository = opts.queryRecord[queryAlias].def.repository;

        if (Array.isArray(dataForThisAlias)) {
          dataForThisAlias.forEach(data => nodeRepository.onDataReceived(data));
        } else {
          nodeRepository.onDataReceived(dataForThisAlias);
        }

        const relationalQueries = opts.queryRecord[queryAlias].relational;

        if (relationalQueries) {
          Object.keys(relationalQueries).forEach(relationalAlias => {
            let relationalDataForThisAlias = Array.isArray(dataForThisAlias)
              ? dataForThisAlias.flatMap(
                  (dataEntry: any) => dataEntry[relationalAlias]
                )
              : dataForThisAlias[relationalAlias];

            // makes it easier to simply handle this as an array below
            if (!Array.isArray(relationalDataForThisAlias)) {
              relationalDataForThisAlias = [relationalDataForThisAlias];
            }

            relationalDataForThisAlias.forEach((relationalDataEntry: any) => {
              const relationalQuery = relationalQueries[relationalAlias];

              if (relationalAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
                const node = relationalDataEntry;
                if (node && node.type !== relationalQuery.def.type) return;
              }

              this.notifyRepositories({
                data: {
                  [relationalAlias]: relationalDataEntry,
                },
                queryRecord: {
                  [relationalAlias]: relationalQuery,
                },
              });
            });
          });
        }
      });
    }

    /**
     * Gets the initial state for this manager from the initial query results
     *   does not execute on subscription messages
     */
    public getNewStateFromQueryResult(opts: {
      queryResult: Record<string, any>;
      queryRecord: QueryRecord;
    }): QueryManagerState {
      return Object.keys(opts.queryRecord).reduce(
        (resultingStateAcc, queryAlias) => {
          const cacheEntry = this.buildCacheEntry({
            nodeData: this.getDataFromResponse({
              dataForThisAlias: opts.queryResult[queryAlias],
              queryRecordEntry: opts.queryRecord[queryAlias],
            }),
            pageInfoFromResults: this.getPageInfoFromResponse({
              dataForThisAlias: opts.queryResult[queryAlias],
            }),
            clientSidePageInfo: this.getClientSidePageInfo({
              queryRecordEntry: opts.queryRecord[queryAlias],
            }),
            queryRecord: opts.queryRecord,
            queryAlias,
            aliasPath: [queryAlias],
          });

          if (!cacheEntry) return resultingStateAcc;
          resultingStateAcc[queryAlias] = cacheEntry;

          return resultingStateAcc;
        },
        {} as QueryManagerState
      );
    }

    public buildCacheEntry(opts: {
      nodeData: Record<string, any> | Array<Record<string, any>>;
      queryAlias: string;
      queryRecord: QueryRecord;
      pageInfoFromResults: Maybe<PageInfoFromResults>;
      clientSidePageInfo: Maybe<ClientSidePageInfo>;
      aliasPath: Array<string>;
    }): Maybe<QueryManagerStateEntry> {
      const { nodeData, queryAlias } = opts;
      const queryRecord = opts.queryRecord;
      const { relational } = queryRecord[opts.queryAlias];

      // if the query alias includes a relational union query separator
      // and the first item in the array of results has a type that does not match the type of the node def in this query record
      // this means that the result node likely matches a different type in that union
      if (queryAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
        const node = (opts.nodeData as Array<any>)[0];
        if (node && node.type !== queryRecord[opts.queryAlias].def.type)
          return null;
      }

      const buildRelationalStateForNode = (
        node: Record<string, any>
      ): Maybe<QueryManagerState> => {
        if (!relational) return null;

        return Object.keys(relational).reduce(
          (relationalStateAcc, relationalAlias) => {
            const relationalDataForThisAlias = this.getDataFromResponse({
              queryRecordEntry: relational[relationalAlias],
              dataForThisAlias: node[relationalAlias],
            });
            if (!relationalDataForThisAlias) return relationalStateAcc;
            const aliasPath = this.addIdToLastEntryInAliasPath({
              aliasPath: opts.aliasPath,
              id: node.id,
            });

            const cacheEntry = this.buildCacheEntry({
              nodeData: relationalDataForThisAlias,
              pageInfoFromResults: this.getPageInfoFromResponse({
                dataForThisAlias: node[relationalAlias],
              }),
              clientSidePageInfo: this.getClientSidePageInfo({
                queryRecordEntry: relational[relationalAlias],
              }),
              queryAlias: relationalAlias,
              queryRecord: (relational as unknown) as QueryRecord,
              aliasPath: [...aliasPath, relationalAlias],
            });
            if (!cacheEntry) return relationalStateAcc;

            return {
              ...relationalStateAcc,
              [this.removeUnionSuffix(relationalAlias)]: cacheEntry,
            };
          },
          {} as QueryManagerState
        );
      };

      const buildProxyCacheEntryForNode = (buildCacheEntryOpts: {
        node: Record<string, any>;
      }): QueryManagerProxyCacheEntry => {
        const relationalState = buildRelationalStateForNode(
          buildCacheEntryOpts.node
        );
        const nodeRepository = queryRecord[queryAlias].def.repository;
        const relationalQueries = relational
          ? this.getApplicableRelationalQueries({
              relationalQueries: relational,
              nodeData: buildCacheEntryOpts.node,
            })
          : null;

        const aliasPath = this.addIdToLastEntryInAliasPath({
          aliasPath: opts.aliasPath,
          id: buildCacheEntryOpts.node.id,
        });

        const proxy = mmGQLInstance.DOProxyGenerator({
          node: queryRecord[opts.queryAlias].def,
          allPropertiesQueried: queryRecord[opts.queryAlias].properties,
          relationalQueries: relationalQueries,
          queryId: this.opts.queryId,
          relationalResults: !relationalState
            ? null
            : this.getResultsFromState({
                state: relationalState,
                aliasPath,
              }),
          do: nodeRepository.byId(buildCacheEntryOpts.node.id),
        });

        return {
          proxy,
          relationalState,
        };
      };

      if (Array.isArray(opts.nodeData)) {
        if ('id' in queryRecord[opts.queryAlias]) {
          if (opts.nodeData[0] == null) {
            if (!queryRecord[opts.queryAlias].allowNullResult)
              throw new DataParsingException({
                receivedData: opts.nodeData,
                message: `Queried a node by id for the query with the id "${this.opts.queryId}" but received back an empty array`,
              });

            return {
              idsOrIdInCurrentResult: null,
              proxyCache: {},
              pageInfoFromResults: opts.pageInfoFromResults,
              clientSidePageInfo: opts.clientSidePageInfo,
            };
          }

          return {
            idsOrIdInCurrentResult: opts.nodeData[0].id,
            proxyCache: opts.nodeData.reduce((proxyCacheAcc, node) => {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode({
                node,
              });

              return proxyCacheAcc;
            }, {} as QueryManagerProxyCache),
            pageInfoFromResults: opts.pageInfoFromResults,
            clientSidePageInfo: opts.clientSidePageInfo,
          };
        } else {
          return {
            idsOrIdInCurrentResult: opts.nodeData.map(node => node.id),
            proxyCache: opts.nodeData.reduce((proxyCacheAcc, node) => {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode({
                node,
              });

              return proxyCacheAcc;
            }, {} as QueryManagerProxyCache),
            pageInfoFromResults: opts.pageInfoFromResults,
            clientSidePageInfo: opts.clientSidePageInfo,
          };
        }
      } else {
        return {
          idsOrIdInCurrentResult: opts.nodeData.id,
          proxyCache: {
            [(nodeData as { id: string }).id]: buildProxyCacheEntryForNode({
              node: nodeData,
            }),
          },
          pageInfoFromResults: opts.pageInfoFromResults,
          clientSidePageInfo: opts.clientSidePageInfo,
        };
      }
    }

    public updateProxiesAndStateFromSubscriptionMessage(opts: {
      node: any;
      operation: {
        action: 'UpdateNode' | 'DeleteNode' | 'InsertNode' | 'DeleteEdge';
        path: string;
      };
      subscriptionAlias: string;
    }) {
      const { node, subscriptionAlias, operation } = opts;
      if (
        (operation.action === 'DeleteNode' ||
          operation.action === 'DeleteEdge') &&
        operation.path === node.id
      ) {
        const idsOrIdInCurrentResult = this.state[subscriptionAlias]
          .idsOrIdInCurrentResult;
        if (Array.isArray(idsOrIdInCurrentResult)) {
          this.state[
            subscriptionAlias
          ].idsOrIdInCurrentResult = idsOrIdInCurrentResult.filter(
            id => id !== node.id
          );
        } else {
          this.state[subscriptionAlias].idsOrIdInCurrentResult = null;
        }

        return;
      }

      const queryRecordEntryForThisSubscription = this.queryRecord[
        subscriptionAlias
      ];
      this.state[subscriptionAlias] = this.state[subscriptionAlias] || {};
      const stateForThisAlias = this.state[subscriptionAlias];
      const nodeId = node.id;
      const { proxy, relationalState } =
        stateForThisAlias.proxyCache[nodeId] || {};

      if (proxy) {
        const newCacheEntry = this.recursivelyUpdateProxyAndReturnNewCacheEntry(
          {
            proxy,
            newRelationalData: this.getRelationalData({
              queryRecord: queryRecordEntryForThisSubscription,
              node: opts.node,
            }),
            relationalQueryRecord:
              queryRecordEntryForThisSubscription.relational || null,
            currentState: { proxy, relationalState },
            aliasPath: [subscriptionAlias],
          }
        );
        stateForThisAlias.proxyCache[nodeId] = newCacheEntry;
      } else {
        const cacheEntry = this.buildCacheEntry({
          nodeData: node,
          queryAlias: subscriptionAlias,
          queryRecord: this.queryRecord,
          // @TODO will we get pageInfo in subscription messages?
          pageInfoFromResults: null,
          clientSidePageInfo: null,
          aliasPath: [subscriptionAlias],
        });
        if (!cacheEntry) return;
        const { proxyCache } = cacheEntry;

        const newlyGeneratedProxy = proxyCache[node.id];

        if (!newlyGeneratedProxy)
          throw Error('Expected a newly generated proxy');

        stateForThisAlias.proxyCache[nodeId] = proxyCache[node.id];
      }

      if ('id' in queryRecordEntryForThisSubscription) {
        if ((stateForThisAlias.idsOrIdInCurrentResult as string) === nodeId) {
          return;
        }

        this.state[opts.subscriptionAlias].idsOrIdInCurrentResult = nodeId;
      } else {
        if (
          (
            stateForThisAlias.idsOrIdInCurrentResult || ([] as Array<string>)
          ).includes(nodeId)
        )
          return; // don't need to do anything if this id was already in the returned set

        this.state[opts.subscriptionAlias].idsOrIdInCurrentResult = [
          nodeId, // insert the new node at the start of the array
          ...(this.state[opts.subscriptionAlias]
            .idsOrIdInCurrentResult as Array<string>),
        ];
      }
    }

    public recursivelyUpdateProxyAndReturnNewCacheEntry(opts: {
      proxy: IDOProxy;
      newRelationalData: Maybe<
        Record<string, Array<Record<string, any> | Record<string, any>>>
      >;
      relationalQueryRecord: Maybe<Record<string, RelationalQueryRecordEntry>>;
      currentState: QueryManagerProxyCacheEntry;
      aliasPath: Array<string>;
    }): QueryManagerProxyCacheEntry {
      const {
        proxy,
        newRelationalData,
        currentState,
        relationalQueryRecord,
      } = opts;
      const { relationalState: currentRelationalState } = currentState;

      const newRelationalState = !relationalQueryRecord
        ? null
        : Object.keys(relationalQueryRecord).reduce(
            (relationalStateAcc, relationalAlias) => {
              if (!newRelationalData || !newRelationalData[relationalAlias]) {
                return relationalStateAcc;
              }

              const relationalDataForThisAlias =
                newRelationalData[relationalAlias];
              const queryRecordForThisAlias =
                relationalQueryRecord[relationalAlias];

              const currentStateForThisAlias = !currentRelationalState
                ? null
                : currentRelationalState[relationalAlias];

              if (!currentStateForThisAlias) {
                const cacheEntry = this.buildCacheEntry({
                  nodeData: relationalDataForThisAlias,
                  queryAlias: relationalAlias,
                  queryRecord: (relationalQueryRecord as unknown) as QueryRecord,
                  // @TODO will we get pageInfo in subscription messages?
                  pageInfoFromResults: null,
                  clientSidePageInfo: null,
                  aliasPath: [...opts.aliasPath, relationalAlias],
                });

                if (!cacheEntry) return relationalStateAcc;

                relationalStateAcc[relationalAlias] = cacheEntry;

                return relationalStateAcc;
              }

              if (Array.isArray(relationalDataForThisAlias)) {
                relationalStateAcc[relationalAlias] = relationalStateAcc[
                  relationalAlias
                ] || { proxyCache: {}, idsOrIdInCurrentResult: [] };

                relationalDataForThisAlias.forEach(node => {
                  const existingProxy =
                    currentStateForThisAlias.proxyCache[node.id]?.proxy;

                  if (!existingProxy) {
                    const cacheEntry = this.buildCacheEntry({
                      nodeData: node,
                      queryAlias: relationalAlias,
                      queryRecord: (relationalQueryRecord as unknown) as QueryRecord,
                      // @TODO will we get pageInfo in subscription messages?
                      pageInfoFromResults: null,
                      clientSidePageInfo: null,
                      aliasPath: [...opts.aliasPath, relationalAlias],
                    });

                    if (!cacheEntry) return;

                    relationalStateAcc[relationalAlias] = {
                      proxyCache: {
                        ...relationalStateAcc[relationalAlias].proxyCache,
                        [node.id]: cacheEntry.proxyCache[node.id],
                      },
                      idsOrIdInCurrentResult: [
                        ...(relationalStateAcc[relationalAlias]
                          .idsOrIdInCurrentResult as Array<string>),
                        node.id,
                      ],
                      // @TODO will we get pageInfo in subscription messages?
                      pageInfoFromResults: null,
                      clientSidePageInfo: null,
                    };
                  } else {
                    const newCacheEntry = this.recursivelyUpdateProxyAndReturnNewCacheEntry(
                      {
                        proxy: existingProxy,
                        newRelationalData: this.getRelationalData({
                          queryRecord: queryRecordForThisAlias,
                          node,
                        }),
                        relationalQueryRecord:
                          queryRecordForThisAlias.relational || null,
                        currentState:
                          currentStateForThisAlias.proxyCache[node.id],
                        aliasPath: [...opts.aliasPath, relationalAlias],
                      }
                    );

                    relationalStateAcc[relationalAlias] = {
                      proxyCache: {
                        ...relationalStateAcc[relationalAlias].proxyCache,
                        [node.id]: newCacheEntry,
                      },
                      idsOrIdInCurrentResult: [
                        ...(relationalStateAcc[relationalAlias]
                          .idsOrIdInCurrentResult as Array<string>),
                        node.id,
                      ],
                      // @TODO will we get pageInfo in subscription messages?
                      pageInfoFromResults: null,
                      clientSidePageInfo: null,
                    };
                  }
                });
              } else {
                throw Error(
                  `Not implemented. ${JSON.stringify(
                    relationalDataForThisAlias
                  )}`
                );
              }

              return relationalStateAcc;
            },
            {} as QueryManagerState
          );

      newRelationalState
        ? proxy.updateRelationalResults(
            this.getResultsFromState({
              state: newRelationalState,
              aliasPath: opts.aliasPath,
            })
          )
        : proxy.updateRelationalResults(null);

      return {
        proxy,
        relationalState: newRelationalState,
      };
    }

    public getRelationalData(opts: {
      queryRecord: BaseQueryRecordEntry;
      node: Record<string, any>;
    }) {
      return opts.queryRecord.relational
        ? Object.keys(opts.queryRecord.relational).reduce(
            (relationalDataAcc, relationalAlias) => {
              relationalDataAcc[relationalAlias] = opts.node[relationalAlias];

              return relationalDataAcc;
            },
            {} as Record<string, any>
          )
        : null;
    }

    public removeUnionSuffix(alias: string) {
      if (alias.includes(RELATIONAL_UNION_QUERY_SEPARATOR))
        return alias.split(RELATIONAL_UNION_QUERY_SEPARATOR)[0];
      else return alias;
    }

    public getApplicableRelationalQueries(opts: {
      relationalQueries: Record<string, RelationalQueryRecordEntry>;
      nodeData: Record<string, any>;
    }) {
      return Object.keys(opts.relationalQueries).reduce(
        (acc, relationalQueryAlias) => {
          if (!relationalQueryAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR))
            return {
              ...acc,
              [relationalQueryAlias]:
                opts.relationalQueries[relationalQueryAlias],
            };

          const firstResult = opts.nodeData[relationalQueryAlias]
            ? opts.nodeData[relationalQueryAlias][0]
            : null;

          // if the node.type returned in the relational query results does not match that of the relational query alias, skip adding this relational query
          // this happens when a reference union is queried, for all nodes in the union type that do not match the type in the result
          // and ensures that the correct node definition is used when building the decorated results for this query/subscription
          if (
            firstResult &&
            firstResult.type !==
              opts.relationalQueries[relationalQueryAlias].def.type
          )
            return acc;

          return {
            ...acc,
            [this.removeUnionSuffix(relationalQueryAlias)]: opts
              .relationalQueries[relationalQueryAlias],
          };
        },
        {} as Record<string, RelationalQueryRecordEntry>
      );
    }

    public getDataFromResponse(opts: {
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
      dataForThisAlias: any;
    }) {
      return queryRecordEntryReturnsArrayOfData({
        queryRecordEntry: opts.queryRecordEntry,
      })
        ? opts.dataForThisAlias[NODES_PROPERTY_KEY]
        : opts.dataForThisAlias;
    }

    public getPageInfoFromResponse(opts: {
      dataForThisAlias: any;
    }): Maybe<PageInfoFromResults> {
      return opts.dataForThisAlias[PAGE_INFO_PROPERTY_KEY] || null;
    }

    public getPageInfoFromResponseForAlias(opts: {
      aliasPath: Array<string>;
      response: Record<string, any>;
    }): Maybe<PageInfoFromResults> {
      const [firstAlias, ...remainingPath] = opts.aliasPath;

      const firstAliasWithoutId = this.removeIdFromAlias(firstAlias);
      const idFromFirstAlias = this.getIdFromAlias(firstAlias);
      if (remainingPath.length === 0) {
        if (idFromFirstAlias != null) {
          const isArrayOfData = Array.isArray(
            opts.response[firstAliasWithoutId]
              ? opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY]
              : false
          );
          if (!isArrayOfData)
            throw Error(
              'Expected array of data when an id is found in the alias'
            );

          const dataForThisAlias = opts.response[firstAliasWithoutId][
            NODES_PROPERTY_KEY
          ].find((item: any) => item.id === idFromFirstAlias);
          if (!dataForThisAlias)
            throw Error(
              'Expected data for this alias when an id is found in the alias'
            );

          return this.getPageInfoFromResponse({
            dataForThisAlias,
          });
        }

        return this.getPageInfoFromResponse({
          dataForThisAlias: opts.response[firstAliasWithoutId],
        });
      }

      const dataForThisAlias = opts.response[firstAliasWithoutId][
        NODES_PROPERTY_KEY
      ].find((item: any) => item.id === idFromFirstAlias);
      return this.getPageInfoFromResponseForAlias({
        aliasPath: remainingPath,
        response: dataForThisAlias,
      });
    }

    public getClientSidePageInfo(opts: {
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    }): Maybe<ClientSidePageInfo> {
      if (
        !queryRecordEntryReturnsArrayOfData({
          queryRecordEntry: opts.queryRecordEntry,
        })
      )
        return null;

      return {
        lastQueriedPage: 1,
        pageSize:
          opts.queryRecordEntry.pagination?.itemsPerPage || DEFAULT_PAGE_SIZE,
      };
    }

    public async onLoadMoreResults(opts: {
      previousEndCursor: string;
      aliasPath: Array<string>;
    }): Promise<void> {
      if (!this.opts.useServerSidePaginationFilteringSorting) {
        // for client side pagination, loadMoreResults logic ran on NodeCollection, which sets the new queried page
        await new Promise(resolve =>
          setTimeout(resolve, mmGQLInstance.getMockDataDelay?.() || 0)
        );
        return;
      }

      const newMinimalQueryRecordForMoreResults = this.getMinimalQueryRecordForMoreResults(
        {
          preExistingQueryRecord: this.queryRecord,
          previousEndCursor: opts.previousEndCursor,
          aliasPath: opts.aliasPath,
        }
      ) as QueryRecord;

      const tokenName = this.getTokenNameForAliasPath(opts.aliasPath);

      const newData = await this.opts.performQuery({
        queryRecord: newMinimalQueryRecordForMoreResults,
        queryGQL: gql`
          ${getQueryGQLStringFromQueryRecord({
            queryId: this.opts.queryId,
            queryRecord: newMinimalQueryRecordForMoreResults,
            useServerSidePaginationFilteringSorting: this.opts
              .useServerSidePaginationFilteringSorting,
          })}
        `,
        tokenName,
      });

      this.handlePagingEventData({
        aliasPath: opts.aliasPath,
        queryRecord: newMinimalQueryRecordForMoreResults,
        newData,
        event: 'LOAD_MORE',
      });
    }

    public async onGoToNextPage(opts: {
      previousEndCursor: string;
      aliasPath: Array<string>;
    }): Promise<void> {
      if (!this.opts.useServerSidePaginationFilteringSorting) {
        // for client side pagination, goToNextPage logic ran on NodeCollection, which sets the new queried page
        await new Promise(resolve =>
          setTimeout(resolve, mmGQLInstance.getMockDataDelay?.() || 0)
        );
        return;
      }

      const newMinimalQueryRecordForMoreResults = this.getMinimalQueryRecordForMoreResults(
        {
          preExistingQueryRecord: this.queryRecord,
          previousEndCursor: opts.previousEndCursor,
          aliasPath: opts.aliasPath,
        }
      ) as QueryRecord;

      const tokenName = this.getTokenNameForAliasPath(opts.aliasPath);

      const newData = await this.opts.performQuery({
        queryRecord: newMinimalQueryRecordForMoreResults,
        queryGQL: gql`
          ${getQueryGQLStringFromQueryRecord({
            queryId: this.opts.queryId,
            queryRecord: newMinimalQueryRecordForMoreResults,
            useServerSidePaginationFilteringSorting: this.opts
              .useServerSidePaginationFilteringSorting,
          })}
        `,
        tokenName,
      });

      this.handlePagingEventData({
        aliasPath: opts.aliasPath,
        queryRecord: newMinimalQueryRecordForMoreResults,
        newData,
        event: 'GO_TO_NEXT',
      });
    }

    public async onGoToPreviousPage(opts: {
      previousStartCursor: string;
      aliasPath: Array<string>;
    }): Promise<void> {
      if (!this.opts.useServerSidePaginationFilteringSorting) {
        // for client side pagination, goToPreviousPage logic ran on NodeCollection, which sets the new queried page
        await new Promise(resolve =>
          setTimeout(resolve, mmGQLInstance.getMockDataDelay?.() || 0)
        );
        return;
      }

      const newMinimalQueryRecordForMoreResults = this.getMinimalQueryRecordForPreviousPage(
        {
          preExistingQueryRecord: this.queryRecord,
          previousStartCursor: opts.previousStartCursor,
          aliasPath: opts.aliasPath,
        }
      ) as QueryRecord;

      const tokenName = this.getTokenNameForAliasPath(opts.aliasPath);

      const newData = await this.opts.performQuery({
        queryRecord: newMinimalQueryRecordForMoreResults,
        queryGQL: gql`
          ${getQueryGQLStringFromQueryRecord({
            queryId: this.opts.queryId,
            queryRecord: newMinimalQueryRecordForMoreResults,
            useServerSidePaginationFilteringSorting: this.opts
              .useServerSidePaginationFilteringSorting,
          })}
        `,
        tokenName,
      });

      this.handlePagingEventData({
        aliasPath: opts.aliasPath,
        queryRecord: newMinimalQueryRecordForMoreResults,
        newData,
        event: 'GO_TO_PREVIOUS',
      });
    }

    public getTokenNameForAliasPath(aliasPath: Array<string>): string {
      if (aliasPath.length === 0)
        throw new Error('Alias path must contain at least 1 entry');

      const firstAliasWithoutId = this.removeIdFromAlias(aliasPath[0]);
      if (!this.queryRecord[firstAliasWithoutId])
        throw Error(
          `The key ${firstAliasWithoutId} was not found in the queryRecord\n${JSON.stringify(
            this.queryRecord,
            null,
            2
          )}`
        );

      return (
        this.queryRecord[firstAliasWithoutId].tokenName || DEFAULT_TOKEN_NAME
      );
    }

    /**
     * Builds a new query record which contains the smallest query possible
     * to get the data for a given aliasPath, with some new pagination params
     *
     * An alias path may look something like ['users'] if we're loading more results on a QueryRecordEntry (root level)
     * or something like ['users', 'todos'] if we're loading more results on a RelationalQueryRecordEntry
     */
    public getMinimalQueryRecordWithUpdatedPaginationParams(opts: {
      aliasPath: Array<string>;
      preExistingQueryRecord: QueryRecord | RelationalQueryRecord;
      newPaginationParams: Partial<IQueryPagination>;
    }) {
      const [firstAlias, ...remainingPath] = opts.aliasPath;

      const newQueryRecord: QueryRecord | RelationalQueryRecord = {};
      const firstAliasWithoutId = this.removeIdFromAlias(firstAlias);

      const preExistingQueryRecordEntryForFirstAlias =
        opts.preExistingQueryRecord[firstAliasWithoutId];
      if (!preExistingQueryRecordEntryForFirstAlias)
        throw new Error(
          `No preexisting query record entry for the alias ${firstAliasWithoutId}`
        );
      if (!remainingPath.length) {
        newQueryRecord[firstAliasWithoutId] = {
          ...preExistingQueryRecordEntryForFirstAlias,
          pagination: {
            ...preExistingQueryRecordEntryForFirstAlias.pagination,
            ...opts.newPaginationParams,
          },
        };
      } else {
        newQueryRecord[firstAliasWithoutId] = {
          ...preExistingQueryRecordEntryForFirstAlias,
          relational: this.getMinimalQueryRecordWithUpdatedPaginationParams({
            aliasPath: remainingPath,
            preExistingQueryRecord: preExistingQueryRecordEntryForFirstAlias.relational as RelationalQueryRecord,
            newPaginationParams: opts.newPaginationParams,
          }) as RelationalQueryRecord,
        };
      }

      return newQueryRecord;
    }

    public getMinimalQueryRecordForMoreResults(opts: {
      aliasPath: Array<string>;
      previousEndCursor: string;
      preExistingQueryRecord: QueryRecord | RelationalQueryRecord;
    }): QueryRecord | RelationalQueryRecord {
      return this.getMinimalQueryRecordWithUpdatedPaginationParams({
        aliasPath: opts.aliasPath,
        preExistingQueryRecord: opts.preExistingQueryRecord,
        newPaginationParams: {
          startCursor: opts.previousEndCursor,
          endCursor: undefined,
        },
      });
    }

    public getMinimalQueryRecordForPreviousPage(opts: {
      aliasPath: Array<string>;
      previousStartCursor: string;
      preExistingQueryRecord: QueryRecord | RelationalQueryRecord;
    }): QueryRecord | RelationalQueryRecord {
      return this.getMinimalQueryRecordWithUpdatedPaginationParams({
        aliasPath: opts.aliasPath,
        preExistingQueryRecord: opts.preExistingQueryRecord,
        newPaginationParams: {
          endCursor: opts.previousStartCursor,
          startCursor: undefined,
        },
      });
    }

    public handlePagingEventData(opts: {
      aliasPath: Array<string>;
      newData: Record<string, any>;
      queryRecord: QueryRecord;
      event: 'LOAD_MORE' | 'GO_TO_NEXT' | 'GO_TO_PREVIOUS';
    }) {
      this.notifyRepositories({
        data: opts.newData,
        queryRecord: opts.queryRecord,
      });
      const newState = this.getNewStateFromQueryResult({
        queryResult: opts.newData,
        queryRecord: opts.queryRecord,
      });

      this.extendStateObject({
        aliasPath: opts.aliasPath,
        originalAliasPath: opts.aliasPath,
        state: this.state,
        newState,
        mergeStrategy: opts.event === 'LOAD_MORE' ? 'CONCAT' : 'REPLACE',
      });

      extend({
        object: this.opts.resultsObject,
        extension: this.getResultsFromState({
          state: this.state,
        }),
        extendNestedObjects: false,
        deleteKeysNotInExtension: false,
      });

      this.opts.onResultsUpdated();
    }

    public extendStateObject(opts: {
      aliasPath: Array<string>;
      originalAliasPath: Array<string>;
      state: QueryManagerState;
      newState: QueryManagerState;
      mergeStrategy: 'CONCAT' | 'REPLACE';
      parentProxy?: IDOProxy;
    }) {
      const [firstAlias, ...remainingPath] = opts.aliasPath;

      const firstAliasWithoutId = this.removeIdFromAlias(firstAlias);
      const existingStateForFirstAlias = opts.state[firstAliasWithoutId];
      const newStateForFirstAlias = opts.newState[firstAliasWithoutId];
      if (!existingStateForFirstAlias || !newStateForFirstAlias)
        throw Error(
          `Expected new and existing state for the alias ${firstAliasWithoutId}`
        );

      if (remainingPath.length === 0) {
        existingStateForFirstAlias.pageInfoFromResults =
          newStateForFirstAlias.pageInfoFromResults;
        existingStateForFirstAlias.clientSidePageInfo =
          newStateForFirstAlias.clientSidePageInfo;
        existingStateForFirstAlias.proxyCache = {
          ...existingStateForFirstAlias.proxyCache,
          ...newStateForFirstAlias.proxyCache,
        };

        if (opts.mergeStrategy === 'CONCAT') {
          if (
            !Array.isArray(existingStateForFirstAlias.idsOrIdInCurrentResult) ||
            !Array.isArray(newStateForFirstAlias.idsOrIdInCurrentResult)
          ) {
            throw Error(
              'Expected both existing and new state "idsOrIdInCurrentResult" to be arrays'
            );
          }

          existingStateForFirstAlias.idsOrIdInCurrentResult = [
            ...existingStateForFirstAlias.idsOrIdInCurrentResult,
            ...newStateForFirstAlias.idsOrIdInCurrentResult,
          ];
        } else if (opts.mergeStrategy === 'REPLACE') {
          existingStateForFirstAlias.idsOrIdInCurrentResult =
            newStateForFirstAlias.idsOrIdInCurrentResult;
        } else {
          throw new UnreachableCaseError(opts.mergeStrategy);
        }

        opts.parentProxy?.updateRelationalResults(
          this.getResultsFromState({
            state: {
              [firstAliasWithoutId]: existingStateForFirstAlias,
            },
            aliasPath: opts.originalAliasPath,
          })
        );
      } else {
        const id = this.getIdFromAlias(firstAlias);
        if (!id) throw Error(`Expected an id for the alias ${firstAlias}`);
        const existingRelationalStateForThisProxy =
          existingStateForFirstAlias.proxyCache[id].relationalState;
        if (!existingRelationalStateForThisProxy)
          throw Error(
            `Expected existing relational state for the alias ${firstAlias} and the id ${id}`
          );
        const newRelationalStateForThisProxy =
          newStateForFirstAlias.proxyCache[id].relationalState;
        if (!newRelationalStateForThisProxy)
          throw Error(
            `Expected new relational state for the alias ${firstAlias} and the id ${id}`
          );

        this.extendStateObject({
          aliasPath: remainingPath,
          originalAliasPath: opts.originalAliasPath,
          state: existingRelationalStateForThisProxy,
          newState: newRelationalStateForThisProxy,
          mergeStrategy: opts.mergeStrategy,
          parentProxy: existingStateForFirstAlias.proxyCache[id].proxy,
        });
      }
    }

    public addIdToLastEntryInAliasPath(opts: {
      aliasPath: Array<string>;
      id: string;
    }) {
      const aliasPath = [...opts.aliasPath];
      aliasPath[aliasPath.length - 1] =
        aliasPath[aliasPath.length - 1] + `[${opts.id}]`;
      return aliasPath;
    }

    /**
     * Removes the id from the alias if it exists
     * @example input: 'user[12msad-249js-25285]'
     * @example output: 'user'
     */
    public removeIdFromAlias(alias: string) {
      return alias.replace(/\[.*\]$/, '');
    }

    /**
     * Returns the id from the alias if it exists
     * @example input: 'user[12msad-249js-25285]'
     * @example output: '12msad-249js-25285'
     */
    public getIdFromAlias(alias: string) {
      const id = alias.match(/\[(.*)\]$/);
      if (!id) return undefined;
      return id[1];
    }
  };
}
