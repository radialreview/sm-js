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
  TOTAL_COUNT_PROPERTY_KEY,
} from '../consts';
import { DataParsingException, UnreachableCaseError } from '../exceptions';
import {
  IDOProxy,
  Maybe,
  IMMGQL,
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
  SubscriptionMessage,
} from '../types';
import {
  getDataFromQueryResponsePartial,
  getQueryGQLDocumentFromQueryRecord,
  getQueryRecordFromQueryDefinition,
  queryRecordEntryReturnsArrayOfData,
} from './queryDefinitionAdapters';
import { extend } from '../dataUtilities';
import { generateMockNodeDataForQueryRecord } from './generateMockData';
import { cloneDeep } from 'lodash';
import { applyClientSideSortAndFilterToData } from './clientSideOperators';
import { getPrettyPrintedGQL } from '../specUtilities';
import { getResponseFromStaticData } from './getResponseFromStaticData';

type QueryManagerState = Record<
  string, // the alias for this set of results
  QueryManagerStateEntry
>;

type QueryManagerStateEntry = {
  // which id or ids represent the most up to date results for this alias, used in conjunction with proxyCache to build a returned data set
  idsOrIdInCurrentResult: string | Array<string> | null;
  // proxy cache is used to keep track of the proxies that have been built for this specific part of the query
  // NOTE: different aliases may build different proxies for the same node
  // this is because different aliases may have different relationships or fields queried for the same node
  proxyCache: QueryManagerProxyCache;
  pageInfoFromResults: Maybe<PageInfoFromResults>;
  totalCount: Maybe<number>;
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
  // we use a mutable object here so that a query result can be partially updated
  // since when a "loadMoreResults" function is called, we don't re-request all
  // of the data for the query, just the data for the node collection
  resultsObject: Record<string, any>;
  // A callback that is executed when the resultsObject above is mutated
  onResultsUpdated(): void;
  onQueryError(error: any): void;
  batchKey: Maybe<string>;
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
   *    6) triggering minimal queries and extending results when a "loadMoreResults" function is called on a node collection
   */
  return class QueryManager {
    public state: QueryManagerState = {};
    public queryDefinitions:
      | QueryDefinitions<unknown, unknown, unknown>
      | UseSubscriptionQueryDefinitions<unknown, unknown, unknown, unknown>;
    public opts: QueryManagerOpts;
    public queryRecord: Maybe<QueryRecord> = null;
    public queryIdx: number = 0;
    public subscriptionMessageHandlers: Record<
      // root level alias
      string,
      (message: SubscriptionMessage) => void
    > = {};

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

    public onSubscriptionMessage(message: SubscriptionMessage) {
      if (!this.queryRecord) throw Error('No query record initialized');

      Object.keys(message.data).forEach(rootAlias => {
        const handler = this.subscriptionMessageHandlers[rootAlias];
        if (!handler)
          throw Error(`No subscription message handler found for ${rootAlias}`);

        handler(message);

        this.opts.resultsObject[rootAlias] = this.getResultsFromState({
          state: this.state,
          aliasPath: [],
        })[rootAlias];
      });

      this.opts.onResultsUpdated();
    }

    // based on the root query record
    // return a record of message handlers, one for each root level alias
    //
    // @TODO
    // - remove the aggressive erroring in favor of silent logging
    public getSubscriptionMessageHandlers(opts: { queryRecord: QueryRecord }) {
      const handlers: Record<
        string,
        (message: SubscriptionMessage) => void
      > = {};

      Object.keys(opts.queryRecord).forEach(rootLevelAlias => {
        const rootLevelQueryRecordEntry = opts.queryRecord[rootLevelAlias];
        if (!rootLevelQueryRecordEntry) return;

        const {
          nodeUpdatePaths,
          nodeCreatePaths,
          nodeDeletePaths,
          nodeInsertPaths,
          nodeRemovePaths,
          nodeUpdateAssociationPaths,
        } = this.getSubscriptionEventToCachePathRecords({
          aliasPath: [rootLevelAlias],
          queryRecordEntry: rootLevelQueryRecordEntry,
          parentQueryRecordEntry: null,
        });

        handlers[rootLevelAlias] = (message: SubscriptionMessage) => {
          const messageType = message.data?.[rootLevelAlias]?.__typename;
          if (!messageType) {
            throw Error(
              'Invalid subscription message\n' +
                JSON.stringify(message, null, 2)
            );
          }

          if (messageType.startsWith('Updated_')) {
            const nodeType = messageType.replace('Updated_', '');
            const lowerCaseNodeType = lowerCaseFirstLetter(nodeType);
            if (!nodeUpdatePaths[lowerCaseNodeType]) {
              throw Error(
                `No node update handler found for ${lowerCaseNodeType}`
              );
            }

            const nodeData = message.data[rootLevelAlias].value as {
              id: string;
            } & Record<string, any>;

            nodeUpdatePaths[lowerCaseNodeType].forEach(path => {
              const queryRecordEntry = path.queryRecordEntry;

              if (!queryRecordEntry)
                throw Error(
                  `No queryRecordEntry found for ${path.aliasPath[0]}`
                );

              queryRecordEntry.def.repository.onDataReceived(nodeData);
            });
          } else if (messageType.startsWith('Created_')) {
            const nodeType = messageType.replace('Created_', '');
            const lowerCaseNodeType = lowerCaseFirstLetter(nodeType);

            if (!nodeCreatePaths[lowerCaseNodeType]) {
              throw Error(
                `No node create handler found for ${lowerCaseNodeType}`
              );
            }

            nodeCreatePaths[lowerCaseNodeType].forEach(path => {
              const stateEntry = this.state[path.aliasPath[0]];
              if (!stateEntry)
                throw Error(`No state entry found for ${path.aliasPath[0]}`);

              const nodeData = message.data[rootLevelAlias].value as {
                id: string;
              } & Record<string, any>;

              const queryRecordEntry = path.queryRecordEntry;

              if (!queryRecordEntry)
                throw Error(
                  `No queryRecordEntry found for ${path.aliasPath[0]}`
                );

              queryRecordEntry.def.repository.onDataReceived(nodeData);

              const newCacheEntry = this.buildCacheEntry({
                aliasPath: path.aliasPath,
                nodeData,
                queryAlias: rootLevelAlias,
                queryRecord: opts.queryRecord,
                // page info is not required
                // in this case, all we need to get back is the proxy for a specific node
                // and we mutate the state paging info directly as needed
                pageInfoFromResults: null,
                totalCount: null,
                clientSidePageInfo: null,
              });

              if (!newCacheEntry) throw Error('No new cache entry found');

              if (!stateEntry.idsOrIdInCurrentResult)
                throw Error('No idsOrIdInCurrentResult found on state entry');
              if (queryRecordEntryReturnsArrayOfData({ queryRecordEntry })) {
                if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                  throw Error('idsOrIdInCurrentResult is not an array');

                if (!stateEntry.totalCount) throw Error('No totalCount found');

                stateEntry.idsOrIdInCurrentResult.push(nodeData.id);
                stateEntry.totalCount++;
              } else {
                stateEntry.idsOrIdInCurrentResult = nodeData.id;
              }

              stateEntry.proxyCache[nodeData.id] =
                newCacheEntry.proxyCache[nodeData.id];
            });
          } else if (messageType.startsWith('Deleted_')) {
            const nodeType = messageType.replace('Deleted_', '');
            const lowerCaseNodeType = lowerCaseFirstLetter(nodeType);

            if (!nodeDeletePaths[lowerCaseNodeType])
              throw Error(
                `No node delete handler found for ${lowerCaseNodeType}`
              );

            nodeDeletePaths[lowerCaseNodeType].forEach(path => {
              const stateEntry = this.state[path.aliasPath[0]];
              if (!stateEntry)
                throw Error(`No state entry found for ${path.aliasPath[0]}`);

              const nodeDeletedId = message.data[rootLevelAlias].id as string;
              if (nodeDeletedId == null)
                throw Error('Node deleted message did not include an id');

              if (!stateEntry.idsOrIdInCurrentResult)
                throw Error('No idsOrIdInCurrentResult found on state entry');
              if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                throw Error('idsOrIdInCurrentResult is not an array');
              if (!stateEntry.totalCount) throw Error('No totalCount found');

              const nodeIdx = stateEntry.idsOrIdInCurrentResult.indexOf(
                nodeDeletedId
              );
              if (nodeIdx === -1) return;

              stateEntry.idsOrIdInCurrentResult.splice(nodeIdx, 1);
              delete stateEntry.proxyCache[nodeDeletedId];
              stateEntry.totalCount--;
            });
          } else if (messageType.startsWith('Inserted_')) {
            const {
              parentNodeType,
              childNodeType,
            } = getNodeTypeAndParentNodeTypeFromRelationshipSubMessage(
              messageType
            );

            if (!nodeInsertPaths[`${parentNodeType}.${childNodeType}`]) {
              throw Error(
                `No node insert handler found for ${parentNodeType}.${childNodeType}`
              );
            }

            nodeInsertPaths[`${parentNodeType}.${childNodeType}`].forEach(
              path => {
                const parentId = message.data[rootLevelAlias].target?.id;
                const parentRelationshipWhichWasInsertedInto =
                  message.data[rootLevelAlias].target?.property;

                if (!parentId) throw Error('No parentId found');
                if (!parentRelationshipWhichWasInsertedInto)
                  throw Error(
                    'No parentRelationshipWhichWasInsertedInto found'
                  );

                const { parentQueryRecordEntry } = path;
                if (!parentQueryRecordEntry)
                  throw Error(`No parentQueryRecord found for ${messageType}`);
                if (!parentQueryRecordEntry.relational)
                  throw Error(
                    `No parentQueryRecordEntry.relational found for ${messageType}`
                  );

                const nodeInsertedData = message.data[rootLevelAlias].value as {
                  id: string;
                } & Record<string, any>;

                path.queryRecordEntry.def.repository.onDataReceived(
                  nodeInsertedData
                );

                const relationalAlias =
                  path.aliasPath[path.aliasPath.length - 1];
                const newCacheEntry = this.buildCacheEntry({
                  nodeData: nodeInsertedData,
                  queryAlias: relationalAlias,
                  queryRecord: parentQueryRecordEntry.relational,
                  aliasPath: path.aliasPath,
                  // page info is not required
                  // in this case, all we need to get back is the proxy for a specific node
                  // and we mutate the state paging info directly as needed
                  pageInfoFromResults: null,
                  totalCount: null,
                  clientSidePageInfo: null,
                });

                if (!newCacheEntry) throw Error('No new cache entry found');

                const cacheEntriesWhichRequireUpdate = this.getStateCacheEntriesForAliasPath(
                  {
                    aliasPath: path.aliasPath,
                  }
                );

                if (
                  !cacheEntriesWhichRequireUpdate ||
                  cacheEntriesWhichRequireUpdate.length === 0
                )
                  throw Error('No parent cache entries found');

                cacheEntriesWhichRequireUpdate.forEach(stateCacheEntry => {
                  const stateEntry = stateCacheEntry.leafStateEntry;
                  const parentProxy = stateCacheEntry.parentProxy;

                  if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                    throw Error('idsOrIdInCurrentResult is not an array');
                  if (!stateEntry.totalCount)
                    throw Error('No totalCount found');

                  stateEntry.idsOrIdInCurrentResult.push(nodeInsertedData.id);
                  stateEntry.proxyCache[nodeInsertedData.id] =
                    newCacheEntry.proxyCache[nodeInsertedData.id];
                  stateEntry.totalCount++;

                  if (!parentProxy) throw Error('No parent proxy found');

                  parentProxy.updateRelationalResults(
                    this.getResultsFromState({
                      state: {
                        [relationalAlias]: stateEntry,
                      },
                      aliasPath: path.aliasPath,
                    })
                  );
                });
              }
            );
          } else if (messageType.startsWith('Removed_')) {
            const {
              parentNodeType,
              childNodeType,
            } = getNodeTypeAndParentNodeTypeFromRelationshipSubMessage(
              messageType
            );

            if (!nodeRemovePaths[`${parentNodeType}.${childNodeType}`])
              throw Error(
                `No node remove handler found for ${parentNodeType}.${childNodeType}`
              );

            nodeRemovePaths[`${parentNodeType}.${childNodeType}`].forEach(
              path => {
                const parentId = message.data[rootLevelAlias].target?.id;
                const parentRelationshipWhichWasRemovedFrom =
                  message.data[rootLevelAlias].target?.property;

                if (!parentId) throw Error('No parentId found');
                if (!parentRelationshipWhichWasRemovedFrom)
                  throw Error('No parentRelationshipWhichWasRemovedFrom found');

                const { parentQueryRecordEntry } = path;
                if (!parentQueryRecordEntry)
                  throw Error(`No parentQueryRecord found for ${messageType}`);
                if (!parentQueryRecordEntry.relational)
                  throw Error(
                    `No parentQueryRecordEntry.relational found for ${messageType}`
                  );

                const nodeRemovedId = message.data[rootLevelAlias].id as
                  | string
                  | number;

                const relationalAlias =
                  path.aliasPath[path.aliasPath.length - 1];

                const cacheEntriesWhichRequireUpdate = this.getStateCacheEntriesForAliasPath(
                  {
                    aliasPath: path.aliasPath,
                  }
                );

                if (
                  !cacheEntriesWhichRequireUpdate ||
                  cacheEntriesWhichRequireUpdate.length === 0
                )
                  throw Error('No parent cache entries found');

                cacheEntriesWhichRequireUpdate.forEach(stateCacheEntry => {
                  const stateEntry = stateCacheEntry.leafStateEntry;
                  const parentProxy = stateCacheEntry.parentProxy;

                  if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                    throw Error('idsOrIdInCurrentResult is not an array');
                  if (!stateEntry.totalCount)
                    throw Error('No totalCount found');

                  const indexOfRemovedId = stateEntry.idsOrIdInCurrentResult.findIndex(
                    id => id === nodeRemovedId
                  );

                  if (indexOfRemovedId === -1)
                    throw Error(
                      `Could not find index of removed id ${nodeRemovedId}`
                    );

                  stateEntry.idsOrIdInCurrentResult.splice(indexOfRemovedId, 1);
                  delete stateEntry.proxyCache[nodeRemovedId];
                  stateEntry.totalCount--;

                  if (!parentProxy) throw Error('No parent proxy found');

                  parentProxy.updateRelationalResults(
                    this.getResultsFromState({
                      state: {
                        [relationalAlias]: stateEntry,
                      },
                      aliasPath: path.aliasPath,
                    })
                  );
                });
              }
            );
          } else if (messageType.startsWith('UpdatedAssociation_')) {
            const {
              parentNodeType,
              childNodeType,
            } = getNodeTypeAndParentNodeTypeFromRelationshipSubMessage(
              messageType
            );

            if (
              !nodeUpdateAssociationPaths[`${parentNodeType}.${childNodeType}`]
            ) {
              throw Error(
                `No node update association handler found for ${parentNodeType}.${childNodeType}`
              );
            }

            nodeUpdateAssociationPaths[
              `${parentNodeType}.${childNodeType}`
            ].forEach(path => {
              const parentId = message.data[rootLevelAlias].target?.id;
              const parentRelationshipWhichWasInsertedInto =
                message.data[rootLevelAlias].target?.property;

              if (!parentId) throw Error('No parentId found');
              if (!parentRelationshipWhichWasInsertedInto)
                throw Error('No parentRelationshipWhichWasInsertedInto found');

              const { parentQueryRecordEntry } = path;
              if (!parentQueryRecordEntry)
                throw Error(`No parentQueryRecord found for ${messageType}`);
              if (!parentQueryRecordEntry.relational)
                throw Error(
                  `No parentQueryRecordEntry.relational found for ${messageType}`
                );

              const nodeAssociatedData = message.data[rootLevelAlias].value as {
                id: string;
              } & Record<string, any>;

              path.queryRecordEntry.def.repository.onDataReceived(
                nodeAssociatedData
              );

              const relationalAlias = path.aliasPath[path.aliasPath.length - 1];
              const newCacheEntry = this.buildCacheEntry({
                nodeData: nodeAssociatedData,
                queryAlias: relationalAlias,
                queryRecord: parentQueryRecordEntry.relational,
                aliasPath: path.aliasPath,
                // page info is not required
                // in this case, all we need to get back is the proxy for a specific node
                // and we mutate the state paging info directly as needed
                pageInfoFromResults: null,
                totalCount: null,
                clientSidePageInfo: null,
              });

              if (!newCacheEntry) throw Error('No new cache entry found');

              const cacheEntriesWhichRequireUpdate = this.getStateCacheEntriesForAliasPath(
                {
                  aliasPath: path.aliasPath,
                }
              );

              if (
                !cacheEntriesWhichRequireUpdate ||
                cacheEntriesWhichRequireUpdate.length === 0
              )
                throw Error('No parent cache entries found');

              cacheEntriesWhichRequireUpdate.forEach(stateCacheEntry => {
                const stateEntry = stateCacheEntry.leafStateEntry;
                const parentProxy = stateCacheEntry.parentProxy;

                stateEntry.idsOrIdInCurrentResult = nodeAssociatedData.id;
                stateEntry.proxyCache[nodeAssociatedData.id] =
                  newCacheEntry.proxyCache[nodeAssociatedData.id];

                if (!parentProxy) throw Error('No parent proxy found');

                parentProxy.updateRelationalResults(
                  this.getResultsFromState({
                    state: {
                      [relationalAlias]: stateEntry,
                    },
                    aliasPath: path.aliasPath,
                  })
                );
              });
            });
          } else {
            throw new UnreachableCaseError(
              message.data[rootLevelAlias].__typename as never
            );
          }
        };
      });

      return handlers;
    }

    // for a given alias path (example: ['users', 'todos'])
    // return string based paths to the cache entries that are affected by each subscription message type
    public getSubscriptionEventToCachePathRecords(opts: {
      aliasPath: Array<string>;
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
      parentQueryRecordEntry:
        | QueryRecordEntry
        | RelationalQueryRecordEntry
        | null;
    }) {
      const { aliasPath, queryRecordEntry, parentQueryRecordEntry } = opts;

      type SubscriptionEventToCachePathRecord = Record<
        // node type for messages that pertain a single node
        // or a string like 'parent.child' for messages that pertain to a relationship
        string,
        Array<{
          // An alias path is used instead of a direct pointer to the cache
          // this is because in some cases, we will want to modify state entries that do no exist
          // at the time of the subscription handler creation.
          // For example, I may be subscribed to a query that returns a list of users and their todos.
          // While the subscription is action, a new user may be created, and that new user may get some todos assigned to them.
          // With a direct memory pointer approach, there would be no way to update the state entry for the new user.
          aliasPath: Array<string>;
          queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
          parentQueryRecordEntry:
            | QueryRecordEntry
            | RelationalQueryRecordEntry
            | null;
        }>
      >;

      const nodeUpdatePaths: SubscriptionEventToCachePathRecord = {};

      nodeUpdatePaths[queryRecordEntry.def.type] = [
        {
          aliasPath,
          queryRecordEntry,
          parentQueryRecordEntry,
        },
      ];

      const nodeCreatePaths: SubscriptionEventToCachePathRecord = {};

      nodeCreatePaths[queryRecordEntry.def.type] = [
        {
          aliasPath,
          queryRecordEntry,
          parentQueryRecordEntry,
        },
      ];

      const nodeDeletePaths: SubscriptionEventToCachePathRecord = {};

      nodeDeletePaths[queryRecordEntry.def.type] = [
        {
          aliasPath,
          queryRecordEntry,
          parentQueryRecordEntry,
        },
      ];

      const nodeInsertPaths: SubscriptionEventToCachePathRecord = {};
      const nodeRemovePaths: SubscriptionEventToCachePathRecord = {};
      const nodeUpdateAssociationPaths: SubscriptionEventToCachePathRecord = {};

      if (
        parentQueryRecordEntry &&
        (('oneToMany' in queryRecordEntry && queryRecordEntry.oneToMany) ||
          ('nonPaginatedOneToMany' in queryRecordEntry &&
            queryRecordEntry.nonPaginatedOneToMany))
      ) {
        nodeInsertPaths[
          `${parentQueryRecordEntry.def.type}.${queryRecordEntry.def.type}`
        ] = [
          {
            aliasPath,
            queryRecordEntry,
            parentQueryRecordEntry,
          },
        ];

        nodeRemovePaths[
          `${parentQueryRecordEntry.def.type}.${queryRecordEntry.def.type}`
        ] = [
          {
            aliasPath,
            queryRecordEntry,
            parentQueryRecordEntry,
          },
        ];
      } else if (parentQueryRecordEntry) {
        nodeUpdateAssociationPaths[
          `${parentQueryRecordEntry.def.type}.${queryRecordEntry.def.type}`
        ] = [
          {
            aliasPath,
            queryRecordEntry,
            parentQueryRecordEntry,
          },
        ];
      }

      const relational = queryRecordEntry.relational;

      const toBeReturned = {
        nodeUpdatePaths,
        nodeCreatePaths,
        nodeDeletePaths,
        nodeInsertPaths,
        nodeRemovePaths,
        nodeUpdateAssociationPaths,
      };

      if (relational) {
        Object.keys(relational).forEach(relationalAlias => {
          const nestedHandlers = this.getSubscriptionEventToCachePathRecords({
            aliasPath: [...aliasPath, relationalAlias],
            queryRecordEntry: relational[relationalAlias],
            parentQueryRecordEntry: queryRecordEntry,
          });

          Object.keys(nestedHandlers).forEach(nestedHandlerType => {
            const handlerType = nestedHandlerType as keyof ReturnType<
              QueryManager['getSubscriptionEventToCachePathRecords']
            >;
            const nestedHandlersForThisEventType = nestedHandlers[handlerType];

            Object.keys(nestedHandlersForThisEventType).forEach(
              nestedHandlerKey => {
                if (!toBeReturned[handlerType][nestedHandlerKey]) {
                  toBeReturned[handlerType][nestedHandlerKey] =
                    nestedHandlersForThisEventType[nestedHandlerKey];
                } else {
                  toBeReturned[handlerType][nestedHandlerKey].push(
                    ...nestedHandlersForThisEventType[nestedHandlerKey]
                  );
                }
              }
            );
          });
        });
      }

      return toBeReturned;
    }

    public getStateCacheEntriesForAliasPath(opts: {
      aliasPath: Array<string>;
      parentProxy?: IDOProxy | null;
      previousStateEntries?: Array<{
        leafStateEntry: QueryManagerStateEntry;
        parentProxy: IDOProxy | null;
      }>;
    }): Array<{
      leafStateEntry: QueryManagerStateEntry;
      parentProxy: IDOProxy | null;
    }> {
      const { aliasPath } = opts;
      const [firstAlias, ...restOfAliasPath] = aliasPath;

      const getStateEntriesForFirstAlias = (): Array<{
        leafStateEntry: QueryManagerStateEntry;
        parentProxy: IDOProxy | null;
      }> => {
        if (opts.previousStateEntries) {
          return opts.previousStateEntries.reduce(
            (acc, stateEntry) => {
              Object.keys(stateEntry.leafStateEntry.proxyCache).forEach(
                nodeId => {
                  const proxyCacheEntry =
                    stateEntry.leafStateEntry.proxyCache[nodeId];
                  const relationalStateForAlias =
                    proxyCacheEntry.relationalState?.[firstAlias];
                  if (!relationalStateForAlias)
                    throw Error(
                      `No relational state found for alias path "${firstAlias}"`
                    );

                  acc.push({
                    leafStateEntry: relationalStateForAlias,
                    parentProxy: proxyCacheEntry.proxy,
                  });
                }
              );

              return acc;
            },
            [] as Array<{
              leafStateEntry: QueryManagerStateEntry;
              parentProxy: IDOProxy | null;
            }>
          );
        } else {
          if (!this.state[firstAlias])
            throw Error(`No state entry found for alias path "${firstAlias}`);

          return [
            {
              leafStateEntry: this.state[firstAlias],
              parentProxy: null,
            },
          ];
        }
      };

      const stateEntriesForFirstAlias = getStateEntriesForFirstAlias();

      if (restOfAliasPath.length === 0) {
        return stateEntriesForFirstAlias;
      } else {
        return this.getStateCacheEntriesForAliasPath({
          aliasPath: restOfAliasPath,
          previousStateEntries: stateEntriesForFirstAlias,
        });
      }
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
        const totalCount = stateForThisAlias.totalCount;
        const clientSidePageInfo = stateForThisAlias.clientSidePageInfo;

        const resultsAlias = this.removeUnionSuffix(queryAlias);

        if (Array.isArray(idsOrId)) {
          if (!clientSidePageInfo) {
            throw Error(
              `No client side page info found for the alias ${queryAlias}`
            );
          }

          const items = idsOrId.map(
            id => stateForThisAlias.proxyCache[id].proxy
          );
          const aliasPath = [...(opts.aliasPath || []), resultsAlias];
          if (pageInfoFromResults) {
            resultsAcc[resultsAlias] = new NodesCollection({
              items,
              clientSidePageInfo,
              pageInfoFromResults,
              totalCount,
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
          } else {
            resultsAcc[resultsAlias] = items;
          }
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

        const dataForThisAlias = getDataFromQueryResponsePartial({
          queryRecordEntry,
          queryResponsePartial: opts.data[queryAlias],
        });

        if (dataForThisAlias == null) return;

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
            nodeData: getDataFromQueryResponsePartial({
              queryResponsePartial: opts.queryResult[queryAlias],
              queryRecordEntry: opts.queryRecord[queryAlias],
            }),
            pageInfoFromResults: this.getPageInfoFromResponse({
              dataForThisAlias: opts.queryResult[queryAlias],
            }),
            totalCount: this.getTotalCountFromResponse({
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
      queryRecord: QueryRecord | RelationalQueryRecord;
      pageInfoFromResults: Maybe<PageInfoFromResults>;
      totalCount: Maybe<number>;
      clientSidePageInfo: Maybe<ClientSidePageInfo>;
      aliasPath: Array<string>;
    }): Maybe<QueryManagerStateEntry> {
      const { nodeData, queryAlias } = opts;
      const queryRecord = opts.queryRecord;
      const queryRecordEntry = queryRecord[opts.queryAlias];

      if (!queryRecordEntry) {
        return getEmptyStateEntry();
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
            const relationalDataForThisAlias = getDataFromQueryResponsePartial({
              queryResponsePartial: node[relationalAlias],
              queryRecordEntry: relational[relationalAlias],
            });

            if (!relationalDataForThisAlias) {
              relationalStateAcc[relationalAlias] = getEmptyStateEntry();
              return relationalStateAcc;
            }

            const aliasPath = this.addIdToLastEntryInAliasPath({
              aliasPath: opts.aliasPath,
              id: node.id,
            });

            const cacheEntry = this.buildCacheEntry({
              nodeData: relationalDataForThisAlias,
              pageInfoFromResults: this.getPageInfoFromResponse({
                dataForThisAlias: node[relationalAlias],
              }),
              totalCount: this.getTotalCountFromResponse({
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

            return getEmptyStateEntry();
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
            totalCount: opts.totalCount,
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
            totalCount: opts.totalCount,
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
          totalCount: opts.totalCount,
          clientSidePageInfo: opts.clientSidePageInfo,
        };
      }
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

    public getPageInfoFromResponse(opts: {
      dataForThisAlias: any;
    }): Maybe<PageInfoFromResults> {
      return opts.dataForThisAlias?.[PAGE_INFO_PROPERTY_KEY] || null;
    }

    public getTotalCountFromResponse(opts: {
      dataForThisAlias: any;
    }): Maybe<number> {
      return opts.dataForThisAlias?.[TOTAL_COUNT_PROPERTY_KEY];
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
          if (!opts.response[firstAliasWithoutId]) {
            throw Error(
              'Expected array of data when an id is found in the alias'
            );
          }

          const dataIsArrayAtRoot = Array.isArray(
            opts.response[firstAliasWithoutId]
          );
          const dataIsArrayNestedInNodes = Array.isArray(
            opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY]
          );

          if (!dataIsArrayAtRoot && !dataIsArrayNestedInNodes)
            throw Error(
              'Expected array of data when an id is found in the alias'
            );

          const dataArray = dataIsArrayAtRoot
            ? opts.response[firstAliasWithoutId]
            : opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY];

          const dataForThisAlias = dataArray.find(
            (item: any) => item.id === idFromFirstAlias
          );
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

      const dataIsArrayAtRoot = Array.isArray(
        opts.response[firstAliasWithoutId]
      );
      const dataArray = dataIsArrayAtRoot
        ? opts.response[firstAliasWithoutId]
        : opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY];

      const dataForThisAlias = dataArray.find(
        (item: any) => item.id === idFromFirstAlias
      );
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
        getMockDataDelay: mmGQLInstance.getMockDataDelay || (() => 0),
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
        getMockDataDelay: mmGQLInstance.getMockDataDelay || (() => 0),
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
        getMockDataDelay: mmGQLInstance.getMockDataDelay || (() => 0),
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
      newPaginationParams: Partial<IQueryPagination<any>>;
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
            // if all the results are null, and they were already null last render, do nothing
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
        // no changes to the query record, so no need to update the results
        return;
      }

      this.subscriptionMessageHandlers = this.getSubscriptionMessageHandlers({
        queryRecord: this.queryRecord,
      });

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
                  getMockDataDelay: mmGQLInstance.getMockDataDelay || (() => 0),
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
    return opts.mmGQLInstance.getToken({ tokenName });
  }

  let response;

  if (opts.mmGQLInstance.generateMockData) {
    if (opts.mmGQLInstance.mockDataType === 'static') {
      if (!opts.mmGQLInstance.staticData)
        throw Error(
          `Expected staticData to be defined when using static mock data`
        );

      response = getResponseFromStaticData({
        queryRecord: opts.queryRecord,
        staticData: opts.mmGQLInstance.staticData,
      });
    } else {
      response = generateMockNodeDataForQueryRecord({
        queryRecord: opts.queryRecord,
      });
    }
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

  // if we are using static mock data, client side filtering and sorting is done in getResponseFromStaticData
  // because that static data has to be filtered before being paginated
  const shouldApplyClientSideFilterAndSort =
    opts.mmGQLInstance.paginationFilteringSortingInstance ===
      EPaginationFilteringSortingInstance.CLIENT &&
    (!opts.mmGQLInstance.generateMockData ||
      opts.mmGQLInstance.mockDataType !== 'static');
  if (shouldApplyClientSideFilterAndSort) {
    // clone the object only if we are running the unit test
    // to simulate that we are receiving new response
    // to prevent mutating the object multiple times when filtering or sorting
    // resulting in incorrect results in our specs
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

    const rootQueryHasUpdatedTheirFilteringSortingOrPagination = getQueryFilterSortingPaginationTargetingHasBeenUpdated(
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

    const filterSortingPaginationHasBeenUpdated = getQueryFilterSortingPaginationTargetingHasBeenUpdated(
      {
        previousQueryRecordEntry,
        nextQueryRecordEntry,
      }
    );
    if (filterSortingPaginationHasBeenUpdated) {
      acc[key] = nextQueryRecordEntry;
      return acc;
    }

    const relationalQueryHasUpdatedTheirFilterSortingPagination = getHasSomeRelationalQueryUpdatedTheirFilterSortingPagination(
      {
        previousQueryRecordEntry: previousQueryRecordEntry,
        nextQueryRecordEntry: nextQueryRecordEntry,
      }
    );

    if (relationalQueryHasUpdatedTheirFilterSortingPagination) {
      acc[key] = nextQueryRecordEntry;
      return acc;
    }

    return acc;
  }, {} as RelationalQueryRecord);

  if (Object.keys(updatedRelationalQueries).length)
    return updatedRelationalQueries;
  return undefined;
}

function getQueryFilterSortingPaginationTargetingHasBeenUpdated(opts: {
  previousQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  nextQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const { previousQueryRecordEntry, nextQueryRecordEntry } = opts;

  const previousFilterSortingPaginationTargeting = stringifyQueryRecordEntry({
    queryRecordEntry: previousQueryRecordEntry,
  });

  const nextFilterSortingPaginationTargeting = stringifyQueryRecordEntry({
    queryRecordEntry: nextQueryRecordEntry,
  });

  return (
    previousFilterSortingPaginationTargeting !==
    nextFilterSortingPaginationTargeting
  );
}

function stringifyQueryRecordEntry(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  return JSON.stringify({
    filter: opts.queryRecordEntry.filter,
    sort: opts.queryRecordEntry.sort,
    pagination: opts.queryRecordEntry.pagination,
    targeting: {
      id: 'id' in opts.queryRecordEntry ? opts.queryRecordEntry.id : null,
      ids: 'ids' in opts.queryRecordEntry ? opts.queryRecordEntry.ids : null,
    },
  });
}

function addIdToAliasPathEntry(opts: { aliasPathEntry: string; id: string }) {
  return `${opts.aliasPathEntry}[${opts.id}]`;
}

// when "null" is received as a root level result or relational result
// there still must be a state entry created for it
function getEmptyStateEntry(): QueryManagerStateEntry {
  return {
    idsOrIdInCurrentResult: null,
    proxyCache: {},
    pageInfoFromResults: null,
    totalCount: null,
    clientSidePageInfo: null,
  };
}
function lowerCaseFirstLetter(nodeType: string) {
  return nodeType.charAt(0).toLowerCase() + nodeType.slice(1);
}

function getNodeTypeAndParentNodeTypeFromRelationshipSubMessage(
  messageTypeName: string
) {
  const split = messageTypeName.split('_');
  if (split.length !== 3) {
    throw Error(`Invalid inserted subscription message "${messageTypeName}"`);
  }

  return {
    parentNodeType: lowerCaseFirstLetter(split[1]),
    childNodeType: lowerCaseFirstLetter(split[2]),
  };
}
