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
  QueryDefinitions,
  QueryDataReturn,
  EPaginationFilteringSortingInstance,
  IGQLClient,
  UseSubscriptionQueryDefinitions,
  QueryState,
} from '../types';
import {
  getQueryGQLDocumentFromQueryRecord,
  getQueryRecordFromQueryDefinition,
  queryRecordEntryReturnsArrayOfData,
} from './queryDefinitionAdapters';
import { extend } from '../dataUtilities';
import { generateMockNodeDataForQueryRecord } from './generateMockData';
import { cloneDeep } from 'lodash';
import { applyClientSideSortAndFilterToData } from './clientSideOperators';
import { getPrettyPrintedGQL } from '../specUtilities';

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
  onQueryError(error: any): void;
  batchKey: Maybe<string>;
  getMockDataDelay: Maybe<() => number>;
  onQueryStateChange?: (queryStateChangeOpts: {
    queryIdx: number;
    queryState: QueryState;
    error?: any;
  }) => void;
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
    public queryDefinitions:
      | QueryDefinitions<unknown, unknown, unknown>
      | UseSubscriptionQueryDefinitions<unknown, unknown, unknown, unknown>;
    public opts: QueryManagerOpts;
    public queryRecord: Maybe<QueryRecord> = null;
    public queryIdx: number = 0;

    constructor(
      queryDefinitions:
        | QueryDefinitions<unknown, unknown, unknown>
        | UseSubscriptionQueryDefinitions<unknown, unknown, unknown, unknown>,
      opts: QueryManagerOpts
    ) {
      this.queryDefinitions = queryDefinitions;
      this.opts = opts;

      this.onQueryDefinitionsUpdated(this.queryDefinitions).catch(e => {
        this.opts.onQueryError(e);
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
      if (!this.queryRecord) throw Error('No query record initialized');
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

      this.opts.onResultsUpdated();
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
        [key: string]: QueryRecordEntry | RelationalQueryRecordEntry | null;
      };
    }) {
      Object.keys(opts.queryRecord).forEach(queryAlias => {
        const queryRecordEntry = opts.queryRecord[queryAlias];

        if (!queryRecordEntry) return;

        const dataForThisAlias = this.getDataFromResponse({
          queryRecordEntry,
          dataForThisAlias: opts.data[queryAlias],
        });

        const nodeRepository = queryRecordEntry.def.repository;

        if (Array.isArray(dataForThisAlias)) {
          dataForThisAlias.forEach(data => nodeRepository.onDataReceived(data));
        } else {
          nodeRepository.onDataReceived(dataForThisAlias);
        }

        const relationalQueries = queryRecordEntry.relational;

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
            clientSidePageInfo: this.getInitialClientSidePageInfo({
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
      const queryRecordEntry = queryRecord[opts.queryAlias];

      if (!queryRecordEntry) {
        return {
          idsOrIdInCurrentResult: null,
          proxyCache: {},
          pageInfoFromResults: null,
          clientSidePageInfo: null,
        };
      }

      const { relational } = queryRecordEntry;

      // if the query alias includes a relational union query separator
      // and the first item in the array of results has a type that does not match the type of the node def in this query record
      // this means that the result node likely matches a different type in that union
      if (queryAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
        const node = (opts.nodeData as Array<any>)[0];
        if (node && node.type !== queryRecordEntry.def.type) return null;
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
              clientSidePageInfo: this.getInitialClientSidePageInfo({
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
        const nodeRepository = queryRecordEntry.def.repository;
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
          node: queryRecordEntry.def,
          allPropertiesQueried: queryRecordEntry.properties,
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
        if ('id' in queryRecordEntry) {
          if (opts.nodeData[0] == null) {
            if (!queryRecordEntry.allowNullResult)
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
      if (!this.queryRecord) throw Error('No query record initialized');

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
              queryRecordEntryForThisSubscription?.relational || null,
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

      if (!queryRecordEntryForThisSubscription) {
        return;
      } else if ('id' in queryRecordEntryForThisSubscription) {
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
      queryRecord: BaseQueryRecordEntry | null;
      node: Record<string, any>;
    }) {
      if (!opts.queryRecord) return null;

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
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
      dataForThisAlias: any;
    }) {
      if (opts.queryRecordEntry == null) return null;

      return queryRecordEntryReturnsArrayOfData({
        queryRecordEntry: opts.queryRecordEntry,
      })
        ? opts.dataForThisAlias[NODES_PROPERTY_KEY]
        : opts.dataForThisAlias;
    }

    public getPageInfoFromResponse(opts: {
      dataForThisAlias: any;
    }): Maybe<PageInfoFromResults> {
      return opts.dataForThisAlias?.[PAGE_INFO_PROPERTY_KEY] || null;
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

    public getInitialClientSidePageInfo(opts: {
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
    }): Maybe<ClientSidePageInfo> {
      if (!opts.queryRecordEntry) return null;

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
      if (!this.queryRecord) throw Error('No query record initialized');

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
      const queryGQL = getQueryGQLDocumentFromQueryRecord({
        queryId: this.opts.queryId,
        queryRecord: newMinimalQueryRecordForMoreResults,
        useServerSidePaginationFilteringSorting: this.opts
          .useServerSidePaginationFilteringSorting,
      });

      if (!queryGQL) throw Error('Expected queryGQL to be defined');

      const newData = await performQueries({
        queryRecord: newMinimalQueryRecordForMoreResults,
        queryGQL,
        tokenName,
        batchKey: this.opts.batchKey || null,
        mmGQLInstance,
        queryId: this.opts.queryId,
        getMockDataDelay: this.opts.getMockDataDelay,
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
      if (!this.queryRecord) throw Error('No query record initialized');

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

      const queryGQL = getQueryGQLDocumentFromQueryRecord({
        queryId: this.opts.queryId,
        queryRecord: newMinimalQueryRecordForMoreResults,
        useServerSidePaginationFilteringSorting: this.opts
          .useServerSidePaginationFilteringSorting,
      });

      if (!queryGQL) throw Error('Expected queryGQL to be defined');

      const newData = await performQueries({
        queryRecord: newMinimalQueryRecordForMoreResults,
        queryGQL,
        tokenName,
        batchKey: this.opts.batchKey || null,
        mmGQLInstance,
        queryId: this.opts.queryId,
        getMockDataDelay: this.opts.getMockDataDelay,
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
      if (!this.queryRecord) throw Error('No query record initialized');

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

      const queryGQL = getQueryGQLDocumentFromQueryRecord({
        queryId: this.opts.queryId,
        queryRecord: newMinimalQueryRecordForMoreResults,
        useServerSidePaginationFilteringSorting: this.opts
          .useServerSidePaginationFilteringSorting,
      });

      if (!queryGQL) throw Error('Expected queryGQL to be defined');

      const newData = await performQueries({
        queryRecord: newMinimalQueryRecordForMoreResults,
        queryGQL,
        tokenName,
        batchKey: this.opts.batchKey || null,
        mmGQLInstance,
        queryId: this.opts.queryId,
        getMockDataDelay: this.opts.getMockDataDelay,
      });

      this.handlePagingEventData({
        aliasPath: opts.aliasPath,
        queryRecord: newMinimalQueryRecordForMoreResults,
        newData,
        event: 'GO_TO_PREVIOUS',
      });
    }

    public getTokenNameForAliasPath(aliasPath: Array<string>): string {
      if (!this.queryRecord) throw Error('No query record initialized');
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
        this.queryRecord[firstAliasWithoutId]?.tokenName || DEFAULT_TOKEN_NAME
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

    public onQueryDefinitionsUpdated = async (
      newQueryDefinitionRecord: QueryDefinitions<unknown, unknown, unknown>
    ): Promise<void> => {
      const previousQueryRecord = this.queryRecord;

      const queryRecord = getQueryRecordFromQueryDefinition({
        queryDefinitions: newQueryDefinitionRecord,
        queryId: this.opts.queryId,
      });
      this.queryRecord = queryRecord;

      const nonNullishQueryDefinitions = removeNullishQueryDefinitions(
        newQueryDefinitionRecord
      );
      const nullishResults = getNullishResults(newQueryDefinitionRecord);

      if (!Object.keys(nonNullishQueryDefinitions).length) {
        if (previousQueryRecord) {
          const previousNullishResultKeys = Object.keys(
            previousQueryRecord
          ).filter(key => previousQueryRecord[key] == null);

          if (
            previousNullishResultKeys.length ===
            Object.keys(nullishResults).length
          ) {
            // if all the results are null, and they were already null last renderdo nothing
            // calling the onQueryDefinitionUpdatedResult callback here would cause an infinite loop
            return;
          }
        }

        this.onQueryDefinitionUpdatedResult({
          queryResult: nullishResults,
          minimalQueryRecord: this.queryRecord,
        });
        return;
      }

      function getMinimalQueryRecordAndAliasPathsToUpdate(): {
        minimalQueryRecord: QueryRecord;
        aliasPathsToUpdate?: Array<Array<string>>;
      } {
        if (previousQueryRecord) {
          return getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery({
            nextQueryRecord: queryRecord,
            previousQueryRecord,
          });
        } else {
          return {
            minimalQueryRecord: queryRecord,
          };
        }
      }
      const {
        minimalQueryRecord,
        aliasPathsToUpdate,
      } = getMinimalQueryRecordAndAliasPathsToUpdate();

      if (!Object.keys(minimalQueryRecord).length) {
        return;
      }

      const thisQueryIdx = this.queryIdx++;

      this.opts.onQueryStateChange?.({
        queryIdx: thisQueryIdx,
        queryState: QueryState.LOADING,
      });

      const queryRecordsSplitByToken = splitQueryRecordsByToken(
        minimalQueryRecord
      );

      try {
        const resultsForEachTokenUsed = await Promise.all(
          Object.entries(queryRecordsSplitByToken).map(
            async ([tokenName, queryRecord]) => {
              const queryGQL = getQueryGQLDocumentFromQueryRecord({
                queryId: this.opts.queryId,
                queryRecord,
                useServerSidePaginationFilteringSorting: this.opts
                  .useServerSidePaginationFilteringSorting,
              });

              if (queryGQL) {
                return await performQueries({
                  queryRecord,
                  queryGQL,
                  queryId: this.opts.queryId,
                  batchKey: this.opts.batchKey,
                  getMockDataDelay: this.opts.getMockDataDelay,
                  tokenName,
                  mmGQLInstance,
                });
              }

              return {};
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
          { ...nullishResults }
        );

        this.onQueryDefinitionUpdatedResult({
          queryResult: allResults,
          minimalQueryRecord,
          aliasPathsToUpdate: aliasPathsToUpdate,
        });
        this.opts.onQueryStateChange?.({
          queryIdx: thisQueryIdx,
          queryState: QueryState.IDLE,
        });
      } catch (error) {
        this.opts.onQueryStateChange?.({
          queryIdx: thisQueryIdx,
          queryState: QueryState.ERROR,
          error,
        });
        throw error;
      }
    };

    public onQueryDefinitionUpdatedResult(opts: {
      queryResult: Record<string, any>;
      minimalQueryRecord: QueryRecord;
      // if undefined, assumes all entries in the minimal query record represent a new bit of state
      aliasPathsToUpdate?: Array<Array<string>>;
    }) {
      this.notifyRepositories({
        data: opts.queryResult,
        queryRecord: opts.minimalQueryRecord,
      });

      const newState = this.getNewStateFromQueryResult({
        queryResult: opts.queryResult,
        queryRecord: opts.minimalQueryRecord,
      });

      if (opts.aliasPathsToUpdate) {
        opts.aliasPathsToUpdate.forEach(aliasPath => {
          this.extendStateObject({
            aliasPath,
            originalAliasPath: aliasPath,
            state: this.state,
            newState,
            mergeStrategy: 'REPLACE',
          });
        });
      } else {
        Object.keys(newState).forEach(newStateAlias => {
          this.extendStateObject({
            aliasPath: [newStateAlias],
            originalAliasPath: [newStateAlias],
            state: this.state,
            newState,
            mergeStrategy: 'REPLACE',
          });
        });
      }

      extend({
        object: this.opts.resultsObject,
        extension: this.getResultsFromState({
          state: this.state,
          aliasPath: [],
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
      if (!existingStateForFirstAlias && newStateForFirstAlias)
        opts.state[firstAliasWithoutId] = newStateForFirstAlias;

      if (remainingPath.length === 0) {
        if (existingStateForFirstAlias) {
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
              !Array.isArray(
                existingStateForFirstAlias.idsOrIdInCurrentResult
              ) ||
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
        }

        opts.parentProxy?.updateRelationalResults(
          this.getResultsFromState({
            state: {
              [firstAliasWithoutId]: opts.state[firstAliasWithoutId],
            },
            aliasPath: opts.originalAliasPath,
          })
        );
      } else {
        const id = this.getIdFromAlias(firstAlias);
        // because if we're not at the last alias, then we must be updating the relational results for a specific proxy
        if (!id) throw Error(`Expected an id for the alias ${firstAlias}`);
        const existingProxyCacheEntryForThisId =
          existingStateForFirstAlias.proxyCache[id];
        if (!existingProxyCacheEntryForThisId)
          throw Error(
            `Expected a proxy cache entry for the id ${id}. This likely means that a query was performed with an id, and the results included a different id`
          );
        const existingRelationalStateForThisProxy =
          existingProxyCacheEntryForThisId.relationalState;
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
      aliasPath[aliasPath.length - 1] = addIdToAliasPathEntry({
        aliasPathEntry: aliasPath[aliasPath.length - 1],
        id: opts.id,
      });
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

function splitQueryRecordsByToken(
  queryRecord: QueryRecord
): Record<string, QueryRecord> {
  return Object.entries(queryRecord).reduce(
    (split, [alias, queryRecordEntry]) => {
      const tokenName =
        queryRecordEntry &&
        'tokenName' in queryRecordEntry &&
        queryRecordEntry.tokenName != null
          ? queryRecordEntry.tokenName
          : DEFAULT_TOKEN_NAME;

      split[tokenName] = split[tokenName] || {};
      split[tokenName][alias] = queryRecordEntry;

      return split;
    },
    {} as Record<string, QueryRecord>
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
  batchKey: Maybe<string>;
  getMockDataDelay: Maybe<() => number>;
}) {
  if (opts.mmGQLInstance.logging.gqlClientQueries) {
    console.log('performing query', getPrettyPrintedGQL(opts.queryGQL));
  }

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
      batchKey: opts.batchKey || undefined,
    });
  } else {
    const params: Parameters<IGQLClient['query']> = [
      {
        gql: opts.queryGQL,
        token: getToken(opts.tokenName || DEFAULT_TOKEN_NAME),
        batchKey: opts.batchKey || undefined,
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
  if (opts.mmGQLInstance.logging.gqlClientQueries) {
    console.log('query response', JSON.stringify(response, null, 2));
  }
  return response;
}

/**
 * Given a previousQueryRecord and a nextQueryRecord,
 * returns the minimal query record required to perform the next query
 *
 * For now, does not account for a change in the properties being queried
 * It only looks at the filter, sort and pagination parameters being used
 *
 * If any of those were updated, the query for that data will be performed
 *
 * Recursion: does it have to handle query changes in related data?
 * The answer is yes, ideally. However, what if the user had loaded more results on the parent list,
 * previous to updating the filter/sorting/pagination on the child list?
 *
 * In this case, we would have to load the relational results for which the query was updated
 * for each item of the parent list that had been loaded so far, which could be a lot of data.
 * Not just that, it would be impossible to request that in a single query, which means this
 * function would have to inherit the additional complexity of returning multiple queries
 * and then the function calling this function would have to handle that as well.
 *
 * Because of that, any update to the filter/sorting/pagination of a child list query will result in
 * a full query starting at the root of the query record
 */
export function getMinimalQueryRecordAndAliasPathsToUpdateForNextQuery(opts: {
  previousQueryRecord: QueryRecord;
  nextQueryRecord: QueryRecord;
}): {
  minimalQueryRecord: QueryRecord;
  aliasPathsToUpdate: Array<Array<string>>;
} {
  const { nextQueryRecord, previousQueryRecord } = opts;
  const minimalQueryRecord: QueryRecord = {};
  const aliasPathsToUpdate: Array<Array<string>> = [];

  Object.entries(nextQueryRecord).forEach(([alias, nextQueryRecordEntry]) => {
    if (!nextQueryRecordEntry) return;

    const previousQueryRecordEntry = previousQueryRecord[alias];

    if (!previousQueryRecordEntry) {
      aliasPathsToUpdate.push([alias]);
      minimalQueryRecord[alias] = nextQueryRecordEntry;
      return;
    }

    const rootQueryHasUpdatedTheirFilteringSortingOrPagination = getQueryFilterSortingPaginationHasBeenUpdated(
      {
        previousQueryRecordEntry,
        nextQueryRecordEntry,
      }
    );

    if (rootQueryHasUpdatedTheirFilteringSortingOrPagination) {
      minimalQueryRecord[alias] = nextQueryRecordEntry;
      aliasPathsToUpdate.push([alias]);
      return;
    }

    // if this root query record entry returns an array of data
    // we must perform a full query if sorting/pagination/filtering has changed
    // for this root query or any of the relational queries
    // for the reasons stated above
    const rootQueryReturnsArray = queryRecordEntryReturnsArrayOfData({
      queryRecordEntry: nextQueryRecordEntry,
    });
    if (rootQueryReturnsArray) {
      const relationalParamsHaveBeenUpdatedForRelationalQueries = getHasSomeRelationalQueryUpdatedTheirFilterSortingPagination(
        {
          previousQueryRecordEntry: previousQueryRecordEntry,
          nextQueryRecordEntry: nextQueryRecordEntry,
        }
      );
      if (relationalParamsHaveBeenUpdatedForRelationalQueries) {
        minimalQueryRecord[alias] = nextQueryRecordEntry;
        aliasPathsToUpdate.push([alias]);
        return;
      }
    }

    const updatedRelationalQueries = getRelationalQueriesWithUpdatedFilteringSortingPagination(
      {
        previousQueryRecordEntry: previousQueryRecordEntry,
        nextQueryRecordEntry: nextQueryRecordEntry,
      }
    );

    if (updatedRelationalQueries) {
      minimalQueryRecord[alias] = {
        ...nextQueryRecordEntry,
        relational: updatedRelationalQueries,
      };

      Object.keys(updatedRelationalQueries).forEach(relationalAlias => {
        const nodeId = nextQueryRecordEntry.id;
        if (!nodeId) {
          throw Error('Expected a node id');
        }
        aliasPathsToUpdate.push([
          addIdToAliasPathEntry({ aliasPathEntry: alias, id: nodeId }),
          relationalAlias,
        ]);
      });
    }
  });

  return { minimalQueryRecord, aliasPathsToUpdate };
}

function getHasSomeRelationalQueryUpdatedTheirFilterSortingPagination(opts: {
  previousQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  nextQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}): boolean {
  const { previousQueryRecordEntry, nextQueryRecordEntry } = opts;

  if (nextQueryRecordEntry.relational == null) {
    // @TODO because this returns false,
    // we have to somehow manually update the relational results for applicable proxies
    return false;
  } else if (previousQueryRecordEntry.relational == null) {
    return true;
  } else {
    const previousRelationalRecord = previousQueryRecordEntry.relational as RelationalQueryRecord;
    return Object.entries(nextQueryRecordEntry.relational).some(
      ([key, nextRelationalQueryRecordEntry]) => {
        const previousRelationalQueryRecordEntry =
          previousRelationalRecord[key];

        if (!previousRelationalQueryRecordEntry) return true;

        const previousFilterSortingPagination = JSON.stringify({
          filter: previousRelationalQueryRecordEntry.filter,
          sort: previousRelationalQueryRecordEntry.sort,
          pagination: previousRelationalQueryRecordEntry.pagination,
        });

        const nextFilterSortingPagination = JSON.stringify({
          filter: nextRelationalQueryRecordEntry.filter,
          sort: nextRelationalQueryRecordEntry.sort,
          pagination: nextRelationalQueryRecordEntry.pagination,
        });

        if (previousFilterSortingPagination !== nextFilterSortingPagination)
          return true;

        return getHasSomeRelationalQueryUpdatedTheirFilterSortingPagination({
          previousQueryRecordEntry: previousRelationalQueryRecordEntry,
          nextQueryRecordEntry: nextRelationalQueryRecordEntry,
        });
      }
    );
  }
}

function getRelationalQueriesWithUpdatedFilteringSortingPagination(opts: {
  previousQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  nextQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}): RelationalQueryRecord | undefined {
  const { previousQueryRecordEntry, nextQueryRecordEntry } = opts;

  if (
    nextQueryRecordEntry.relational == null ||
    previousQueryRecordEntry.relational == null
  )
    return nextQueryRecordEntry.relational;

  const previousRelational = previousQueryRecordEntry.relational as RelationalQueryRecord;
  const updatedRelationalQueries = Object.entries(
    nextQueryRecordEntry.relational
  ).reduce((acc, [key, nextQueryRecordEntry]) => {
    const previousQueryRecordEntry = previousRelational[key];

    if (!previousQueryRecordEntry) {
      acc[key] = nextQueryRecordEntry;
      return acc;
    }

    const filterSortingPaginationHasBeenUpdated = getQueryFilterSortingPaginationHasBeenUpdated(
      {
        previousQueryRecordEntry,
        nextQueryRecordEntry,
      }
    );
    if (filterSortingPaginationHasBeenUpdated) {
      acc[key] = nextQueryRecordEntry;
    }

    return acc;
  }, {} as RelationalQueryRecord);

  if (Object.keys(updatedRelationalQueries).length)
    return updatedRelationalQueries;
  return undefined;
}

function getQueryFilterSortingPaginationHasBeenUpdated(opts: {
  previousQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  nextQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const { previousQueryRecordEntry, nextQueryRecordEntry } = opts;

  const previousFilterSortingPagination = JSON.stringify({
    filter: previousQueryRecordEntry.filter,
    sort: previousQueryRecordEntry.sort,
    pagination: previousQueryRecordEntry.pagination,
  });

  const nextFilterSortingPagination = JSON.stringify({
    filter: nextQueryRecordEntry.filter,
    sort: nextQueryRecordEntry.sort,
    pagination: nextQueryRecordEntry.pagination,
  });

  return previousFilterSortingPagination !== nextFilterSortingPagination;
}

function addIdToAliasPathEntry(opts: { aliasPathEntry: string; id: string }) {
  return `${opts.aliasPathEntry}[${opts.id}]`;
}
