import { OnPaginateCallback, NodesCollection } from './nodesCollection';
import { RELATIONAL_UNION_QUERY_SEPARATOR } from './consts';
import { DataParsingException } from './exceptions';
import {
  IDOProxy,
  Maybe,
  IMMGQL,
  IQueryManager,
  QueryRecord,
  BaseQueryRecordEntry,
  RelationalQueryRecordEntry,
  QueryRecordEntry,
  IQueryPagination,
} from './types';

type QueryManagerState = Record<
  string, // the alias for this set of results
  QueryManagerStateEntry
>;

type QueryManagerStateEntry = {
  // which id or ids represent the most up to date results for this alias, used in conjunction with proxyCache to build a returned data set
  idsOrIdInCurrentResult: string | Array<string> | null;
  proxyCache: QueryManagerProxyCache;
  pagination?: IQueryPagination;
};

type QueryManagerProxyCache = Record<
  string, // id of the node
  QueryManagerProxyCacheEntry
>;

type QueryManagerProxyCacheEntry = {
  proxy: IDOProxy;
  relationalState: Maybe<QueryManagerState>;
}; // the proxy for that DO and relational state from the query results/latest subscription message

type QueryManagerOpts = { onPaginate?: OnPaginateCallback };

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
    public opts: QueryManagerOpts | undefined;

    constructor(queryRecord: QueryRecord, opts?: QueryManagerOpts) {
      this.queryRecord = queryRecord;
      this.opts = opts;
    }

    public onQueryResult(opts: { queryResult: any; queryId: string }) {
      this.notifyRepositories({
        data: opts.queryResult,
        queryRecord: this.queryRecord,
      });

      this.state = this.getNewStateFromQueryResult({
        ...opts,
        queryRecord: this.queryRecord,
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
    }

    /**
     * Returns the current results based on received query results and subscription messages
     */
    getResults() {
      return this.getResultsFromState(this.state);
    }

    /**
     * Is used to build the overall results for the query, and also to build the relational results used by each proxy
     * which is why "state" is a param here
     */
    public getResultsFromState(state: QueryManagerState): Record<string, any> {
      const acc = Object.keys(state).reduce((resultsAcc, queryAlias) => {
        const stateForThisAlias = state[queryAlias];
        const idsOrId = stateForThisAlias.idsOrIdInCurrentResult;
        const resultsAlias = this.removeUnionSuffix(queryAlias);

        if (Array.isArray(idsOrId)) {
          const ids = idsOrId.map(id => stateForThisAlias.proxyCache[id].proxy);
          resultsAcc[resultsAlias] = new NodesCollection({
            items: ids,
            itemsPerPage:
              stateForThisAlias.pagination?.itemsPerPage || ids.length,
            page: stateForThisAlias.pagination?.page || 1,
            onPaginate: this.opts?.onPaginate,
          });
        } else if (idsOrId) {
          resultsAcc[resultsAlias] =
            stateForThisAlias.proxyCache[idsOrId].proxy;
        } else {
          resultsAcc[resultsAlias] = null;
        }

        return resultsAcc;
      }, {} as Record<string, any>);

      return acc;
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
          queryRecord: opts.queryRecord[queryAlias],
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
      queryId: string;
      queryRecord: Record<string, BaseQueryRecordEntry>;
    }): QueryManagerState {
      return Object.keys(opts.queryRecord).reduce(
        (resultingStateAcc, queryAlias) => {
          const cacheEntry = this.buildCacheEntry({
            nodeData: this.getDataFromResponse({
              dataForThisAlias: opts.queryResult[queryAlias],
              queryRecord: opts.queryRecord[queryAlias],
            }),
            queryId: opts.queryId,
            queryAlias,
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
      queryId: string;
      queryAlias: string;
      queryRecord?: QueryRecord;
    }): Maybe<QueryManagerStateEntry> {
      const { nodeData, queryAlias } = opts;
      const queryRecord = opts.queryRecord || this.queryRecord;
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
              queryRecord: relational[relationalAlias],
              dataForThisAlias: node[relationalAlias],
            });
            if (!relationalDataForThisAlias) return relationalStateAcc;

            const cacheEntry = this.buildCacheEntry({
              nodeData: relationalDataForThisAlias,
              queryId: opts.queryId,
              queryAlias: relationalAlias,
              queryRecord: (relational as unknown) as QueryRecord,
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

      const buildProxyCacheEntryForNode = (
        node: Record<string, any>
      ): QueryManagerProxyCacheEntry => {
        const relationalState = buildRelationalStateForNode(node);
        const nodeRepository = queryRecord[queryAlias].def.repository;
        const relationalQueries = relational
          ? this.getApplicableRelationalQueries({
              relationalQueries: relational,
              nodeData: node,
            })
          : null;

        const proxy = mmGQLInstance.DOProxyGenerator({
          node: queryRecord[opts.queryAlias].def,
          allPropertiesQueried: queryRecord[opts.queryAlias].properties,
          relationalQueries: relationalQueries,
          queryId: opts.queryId,
          relationalResults: !relationalState
            ? null
            : this.getResultsFromState(relationalState),
          do: nodeRepository.byId(node.id),
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
                message: `Queried a node by id for the query with the id "${opts.queryId}" but received back an empty array`,
              });

            return {
              idsOrIdInCurrentResult: null,
              proxyCache: {},
            };
          }

          return {
            idsOrIdInCurrentResult: opts.nodeData[0].id,
            proxyCache: opts.nodeData.reduce((proxyCacheAcc, node) => {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode(node);

              return proxyCacheAcc;
            }, {} as QueryManagerProxyCache),
          };
        } else {
          return {
            idsOrIdInCurrentResult: opts.nodeData.map(node => node.id),
            proxyCache: opts.nodeData.reduce((proxyCacheAcc, node) => {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode(node);

              return proxyCacheAcc;
            }, {} as QueryManagerProxyCache),
            pagination: queryRecord[opts.queryAlias].pagination,
          };
        }
      } else {
        return {
          idsOrIdInCurrentResult: opts.nodeData.id,
          proxyCache: {
            [(nodeData as { id: string }).id]: buildProxyCacheEntryForNode(
              nodeData
            ),
          },
        };
      }
    }

    public updateProxiesAndStateFromSubscriptionMessage(opts: {
      node: any;
      queryId: string;
      operation: {
        action: 'UpdateNode' | 'DeleteNode' | 'InsertNode' | 'DeleteEdge';
        path: string;
      };
      subscriptionAlias: string;
    }) {
      const { node, queryId, subscriptionAlias, operation } = opts;
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
            queryId,
            proxy,
            newRelationalData: this.getRelationalData({
              queryRecord: queryRecordEntryForThisSubscription,
              node: opts.node,
            }),
            relationalQueryRecord:
              queryRecordEntryForThisSubscription.relational || null,
            currentState: { proxy, relationalState },
          }
        );
        stateForThisAlias.proxyCache[nodeId] = newCacheEntry;
      } else {
        const cacheEntry = this.buildCacheEntry({
          nodeData: node,
          queryId,
          queryAlias: subscriptionAlias,
          queryRecord: this.queryRecord,
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
      queryId: string;
      proxy: IDOProxy;
      newRelationalData: Maybe<
        Record<string, Array<Record<string, any> | Record<string, any>>>
      >;
      relationalQueryRecord: Maybe<Record<string, RelationalQueryRecordEntry>>;
      currentState: QueryManagerProxyCacheEntry;
    }): QueryManagerProxyCacheEntry {
      const {
        queryId,
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
                  queryId,
                  queryAlias: relationalAlias,
                  queryRecord: (relationalQueryRecord as unknown) as QueryRecord,
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
                      queryId: queryId,
                      queryAlias: relationalAlias,
                      queryRecord: (relationalQueryRecord as unknown) as QueryRecord,
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
                    };
                  } else {
                    const newCacheEntry = this.recursivelyUpdateProxyAndReturnNewCacheEntry(
                      {
                        queryId,
                        proxy: existingProxy,
                        newRelationalData: this.getRelationalData({
                          queryRecord: queryRecordForThisAlias,
                          node,
                        }),
                        relationalQueryRecord:
                          queryRecordForThisAlias.relational || null,
                        currentState:
                          currentStateForThisAlias.proxyCache[node.id],
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
            this.getResultsFromState(newRelationalState)
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
      queryRecord: BaseQueryRecordEntry;
      dataForThisAlias: any;
    }) {
      return 'id' in opts.queryRecord || 'oneToOne' in opts.queryRecord
        ? opts.dataForThisAlias
        : opts.dataForThisAlias.nodes;
    }
  };
}
