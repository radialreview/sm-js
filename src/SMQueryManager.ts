import { RELATIONAL_UNION_QUERY_SEPARATOR } from './consts';
import { SMDataParsingException } from './exceptions';
import {
  IDOProxy,
  Maybe,
  ISMJS,
  ISMQueryManager,
  QueryRecord,
  BaseQueryRecordEntry,
  RelationalQueryRecordEntry,
} from './types';

type SMQueryManagerState = Record<
  string, // the alias for this set of results
  SMQueryManagerStateEntry
>;

type SMQueryManagerStateEntry = {
  // which id or ids represent the most up to date results for this alias, used in conjunction with proxyCache to build a returned data set
  idsOrIdInCurrentResult: string | Array<string>;
  proxyCache: SMQueryManagerProxyCache;
};

type SMQueryManagerProxyCache = Record<
  string, // id of the node
  SMQueryManagerProxyCacheEntry
>;

type SMQueryManagerProxyCacheEntry = {
  proxy: IDOProxy;
  relationalState: Maybe<SMQueryManagerState>;
}; // the proxy for that DO and relational state from the query results/latest subscription message

export function createSMQueryManager(smJSInstance: ISMJS) {
  /**
   * SMQueryManager is in charge of
   *
   *    1) receiving data from an SM query and notifying the appropriate DO repositories
   *    2) building proxies for those DOs
   *    3) keeping a cache of those generated proxies so that we can update proxies on subscription messages, rather than generating new ones
   *    4) handling incoming SM subscription messages and
   *       4.1) notifying DO repositories with the data in those sub messages
   *       4.2) build proxies for new DOs received + update relational data (recursively) for proxies that had been previously built
   *    5) building the resulting data that is returned by useSMQuery from its cache of proxies
   */
  return class SMQueryManager implements ISMQueryManager {
    public state: SMQueryManagerState = {};
    public queryRecord: QueryRecord;

    constructor(queryRecord: QueryRecord) {
      this.queryRecord = queryRecord;
    }

    public onQueryResult(opts: { queryResult: any; queryId: string }) {
      this.notifyRepositories({
        data: opts.queryResult,
        queryRecord: this.queryRecord,
      });

      this.state = this.getNewStateFromQueryResult(opts);
    }

    public onSubscriptionMessage(opts: {
      node: Record<string, any>;
      operation: {
        action: 'UpdateNode' | 'DeleteNode' | 'InsertNode';
        path: string;
      };
      queryId: string;
      subscriptionAlias: string;
    }) {
      const { node, operation, subscriptionAlias } = opts;
      const queryRecordEntryForThisSubscription = this.queryRecord[
        subscriptionAlias
      ];

      if (operation.action === 'DeleteNode' && operation.path === node.id) {
        const idsOrIdInCurrentResult = this.state[opts.subscriptionAlias]
          .idsOrIdInCurrentResult;
        if (Array.isArray(idsOrIdInCurrentResult)) {
          this.state[
            opts.subscriptionAlias
          ].idsOrIdInCurrentResult = idsOrIdInCurrentResult.filter(
            id => id !== node.id
          );
        }

        return;
      }

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
    public getResultsFromState(
      state: SMQueryManagerState
    ): Record<string, any> {
      const acc = Object.keys(state).reduce((resultsAcc, queryAlias) => {
        const stateForThisAlias = state[queryAlias];
        const idsOrId = stateForThisAlias.idsOrIdInCurrentResult;

        const resultsAlias = this.removeUnionSuffix(queryAlias);

        resultsAcc[resultsAlias] = Array.isArray(idsOrId)
          ? idsOrId.map(id => stateForThisAlias.proxyCache[id].proxy)
          : stateForThisAlias.proxyCache[idsOrId].proxy;

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
      queryRecord: { [key: string]: BaseQueryRecordEntry };
    }) {
      Object.keys(opts.queryRecord).forEach(queryAlias => {
        const dataForThisAlias = opts.data[queryAlias];

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
          dataForThisAlias.flatMap(data => nodeRepository.onDataReceived(data));
        } else {
          nodeRepository.onDataReceived(dataForThisAlias);
        }

        const relationalQueries = opts.queryRecord[queryAlias].relational;

        if (relationalQueries) {
          Object.keys(relationalQueries).forEach(relationalAlias => {
            const relationalDataForThisAlias = Array.isArray(dataForThisAlias)
              ? dataForThisAlias.flatMap(
                  (dataEntry: any) => dataEntry[relationalAlias]
                )
              : dataForThisAlias[relationalAlias];

            if (relationalDataForThisAlias) {
              const relationalQuery = relationalQueries[relationalAlias];

              if (relationalAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
                const node = relationalDataForThisAlias[0];
                if (node && node.type !== relationalQuery.def.type) return;
              }

              this.notifyRepositories({
                data: {
                  [relationalAlias]: relationalDataForThisAlias,
                },
                queryRecord: {
                  [relationalAlias]: relationalQuery,
                },
              });
            }
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
    }): SMQueryManagerState {
      return Object.keys(this.queryRecord).reduce(
        (resultingStateAcc, queryAlias) => {
          const cacheEntry = this.buildCacheEntry({
            nodeData: opts.queryResult[queryAlias],
            queryId: opts.queryId,
            queryAlias,
          });

          if (!cacheEntry) return resultingStateAcc;
          resultingStateAcc[queryAlias] = cacheEntry;

          return resultingStateAcc;
        },
        {} as SMQueryManagerState
      );
    }

    public buildCacheEntry(opts: {
      nodeData: Record<string, any> | Array<Record<string, any>>;
      queryId: string;
      queryAlias: string;
      queryRecord?: QueryRecord;
    }): Maybe<SMQueryManagerStateEntry> {
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
      ): Maybe<SMQueryManagerState> => {
        if (!relational) return null;

        return Object.keys(relational).reduce(
          (relationalStateAcc, relationalAlias) => {
            const relationalDataForThisAlias = node[relationalAlias];
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
          {} as SMQueryManagerState
        );
      };

      const buildProxyCacheEntryForNode = (
        node: Record<string, any>
      ): SMQueryManagerProxyCacheEntry => {
        const relationalState = buildRelationalStateForNode(node);
        const nodeRepository = queryRecord[queryAlias].def.repository;

        const proxy = smJSInstance.DOProxyGenerator({
          node: queryRecord[opts.queryAlias].def,
          allPropertiesQueried: queryRecord[opts.queryAlias].properties,
          relationalQueries: relational
            ? this.getApplicableRelationalQueries({
                relationalQueries: relational,
                nodeData: node,
              })
            : null,
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
            throw new SMDataParsingException({
              receivedData: opts.nodeData,
              message: `Queried a node by id for the query with the id "${opts.queryId}" but received back an empty array`,
            });
          }

          return {
            idsOrIdInCurrentResult: opts.nodeData[0].id,
            proxyCache: opts.nodeData.reduce((proxyCacheAcc, node) => {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode(node);

              return proxyCacheAcc;
            }, {} as SMQueryManagerProxyCache),
          };
        } else {
          return {
            idsOrIdInCurrentResult: opts.nodeData.map(node => node.id),
            proxyCache: opts.nodeData.reduce((proxyCacheAcc, node) => {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode(node);

              return proxyCacheAcc;
            }, {} as SMQueryManagerProxyCache),
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
      subscriptionAlias: string;
    }) {
      const { node, queryId, subscriptionAlias } = opts;
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
      currentState: SMQueryManagerProxyCacheEntry;
    }): SMQueryManagerProxyCacheEntry {
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
                        [node.id]: cacheEntry,
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
            {} as SMQueryManagerState
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
  };
}
