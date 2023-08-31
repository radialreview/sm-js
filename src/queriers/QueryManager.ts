import {
  NodesCollection,
  PageInfoFromResults,
  ClientSidePageInfo,
} from '../nodesCollection';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_TOKEN_NAME,
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
  Id,
} from '../types';
import {
  getDataFromQueryResponsePartial,
  getQueryGQLDocumentFromQueryRecord,
  getQueryRecordFromQueryDefinition,
  getSubscriptionGQLDocumentsFromQueryRecord,
  queryRecordEntryReturnsArrayOfData,
  queryRecordEntryReturnsArrayOfDataNestedInNodes,
} from './queryDefinitionAdapters';
import { arrayEquals } from '../dataUtilities';
import { generateMockNodeDataForQueryRecord } from './generateMockData';
import { cloneDeep } from 'lodash';
import {
  applyClientSideSortAndFilterToData,
  getIdsThatPassFilter,
  getSortedIds,
} from './clientSideOperators';
import { getPrettyPrintedGQL } from '../specUtilities';
import { getResponseFromStaticData } from './getResponseFromStaticData';

type QueryManagerState = Record<
  string, // the alias for this set of results
  QueryManagerStateEntry
>;

type QueryManagerStateEntry = {
  // which id or ids represent the most up to date results for this alias, used in conjunction with proxyCache to build a returned data set
  idsOrIdInCurrentResult: Id | Array<Id> | null;
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
  subscribe: boolean;
  useServerSidePaginationFilteringSorting: boolean;

  // A callback that is executed when the resultsObject above is mutated
  onResultsUpdated(resultsObject: Record<string, any>): void;
  onQueryError(error: any): void;
  onSubscriptionError(error: any): void;
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
    public queryResults: Record<string, any> = {};
    public subscriptionMessageHandlers: Record<
      // root level alias
      string,
      (message: SubscriptionMessage) => void
    > = {};
    public unsubRecord: Record<
      // root level alis
      string,
      () => void
    > = {};

    constructor(
      queryDefinitions:
        | QueryDefinitions<unknown, unknown, unknown>
        | UseSubscriptionQueryDefinitions<unknown, unknown, unknown, unknown>,
      opts: QueryManagerOpts
    ) {
      this.queryDefinitions = queryDefinitions;
      this.opts = opts;
      this.onConstructQueryResultsFromPlugin();

      this.onQueryDefinitionsUpdated(this.queryDefinitions).catch(e => {
        this.opts.onQueryError(e);
      });
    }

    public onConstructQueryResultsFromPlugin = () => {
      if (mmGQLInstance.plugins) {
        mmGQLInstance.plugins.forEach(plugin => {
          if (plugin.QMResults?.onConstruct) {
            plugin.QMResults.onConstruct({
              queryResults: this.queryResults,
            });
          }
        });
      }
    };

    public onSubscriptionMessage = (message: SubscriptionMessage) => {
      if (!this.queryRecord) throw Error('No query record initialized');

      Object.keys(message.data).forEach(rootAlias => {
        const handler = this.subscriptionMessageHandlers[rootAlias];
        if (!handler)
          throw Error(`No subscription message handler found for ${rootAlias}`);

        handler(message);
      });

      this.opts.onResultsUpdated(this.getQueryResults());
    };

    public logSubscriptionError = (error: string) => {
      if (mmGQLInstance.logging.gqlSubscriptionErrors) {
        console.error(error);
      }
    };

    // based on the root query record
    // return a record of message handlers, one for each root level alias
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
            return this.logSubscriptionError(
              'Invalid subscription message\n' +
                JSON.stringify(message, null, 2)
            );
          }

          const messageMeta = getMessageMetaFromType(messageType);

          if (messageMeta.type === 'Updated') {
            const nodeType = messageMeta.nodeType;
            if (!nodeUpdatePaths[nodeType]) {
              return this.logSubscriptionError(
                `No node update handler found for ${nodeType}`
              );
            }

            const nodeData = message.data[rootLevelAlias].value as {
              id: Id;
            } & Record<string, any>;

            if (!nodeData) {
              // This can be removed once BE only notifies about events that the subscription requests
              return this.logSubscriptionError(
                `No node data found for ${messageType}`
              );
            }

            const targets = message.data[rootLevelAlias].targets;

            nodeUpdatePaths[nodeType].forEach((path, i) => {
              const queryRecordEntry = path.queryRecordEntry;

              if (!queryRecordEntry)
                return this.logSubscriptionError(
                  `No queryRecordEntry found for ${path.aliasPath[0]}`
                );

              if (i === 0) {
                // we don't need to call this for every path
                // since it's targeting the same node repository instance
                queryRecordEntry.def.repository.onDataReceived(nodeData);
              }

              const stateEntriesWhichRequireUpdate = this.getStateCacheEntriesForAliasPath(
                {
                  aliasPath: path.aliasPath,
                  pathEndQueryRecordEntry: queryRecordEntry,
                  // This || [] can be removed once the backend is guaranteed to include targets
                  // in every Update type message
                  parentFilters: targets || [],
                }
              );

              stateEntriesWhichRequireUpdate.forEach(
                ({
                  parentStateEntry,
                  idOfAffectedParent,
                  relationalAlias,
                  relationalStateEntry,
                }) => {
                  const stateEntryWhichMayRequireUpdate =
                    relationalStateEntry || parentStateEntry;

                  if (path.queryRecordEntry.relational) {
                    this.notifyRepositories({
                      data: nodeData,
                      queryRecord: path.queryRecordEntry.relational,
                      isFromSubscriptionMessage: true,
                    });
                  }

                  let cacheEntry: Maybe<QueryManagerStateEntry>;
                  let requiresPotentialRelationalUpdate: boolean = true;
                  if (
                    !stateEntryWhichMayRequireUpdate.proxyCache[nodeData.id]
                  ) {
                    // we're building a brand new cache entry
                    // so updating the relational results for any proxies is not necessary
                    requiresPotentialRelationalUpdate = false;
                    cacheEntry = this.buildCacheEntry({
                      nodeData: nodeData,
                      queryAlias: relationalAlias || rootLevelAlias,
                      queryRecord: relationalStateEntry
                        ? (path.parentQueryRecordEntry
                            ?.relational as RelationalQueryRecord)
                        : (this.queryRecord as QueryRecord),
                      aliasPath: path.aliasPath,
                      // page info is not required
                      // in this case, all we need to get back is the proxy for a specific node
                      // and we mutate the state paging info directly as needed
                      pageInfoFromResults: null,
                      totalCount: null,
                      clientSidePageInfo: null,
                      isFromSubscriptionMessage: true,
                    });
                  } else {
                    cacheEntry = stateEntryWhichMayRequireUpdate;
                  }

                  if (!cacheEntry)
                    return this.logSubscriptionError(
                      'No new cache entry found'
                    );

                  stateEntryWhichMayRequireUpdate.proxyCache[nodeData.id] =
                    cacheEntry.proxyCache[nodeData.id];

                  if (
                    Array.isArray(
                      stateEntryWhichMayRequireUpdate.idsOrIdInCurrentResult
                    ) &&
                    !stateEntryWhichMayRequireUpdate.idsOrIdInCurrentResult.includes(
                      nodeData.id
                    )
                  ) {
                    stateEntryWhichMayRequireUpdate.idsOrIdInCurrentResult.push(
                      nodeData.id
                    );
                  }

                  this.applyClientSideFilterAndSortToStateEntry({
                    stateEntryWhichMayRequireUpdate,
                    queryRecordEntry: path.queryRecordEntry,
                  });

                  if (requiresPotentialRelationalUpdate) {
                    const relationalQueryRecord =
                      path.queryRecordEntry.relational;

                    if (relationalQueryRecord) {
                      const relationalState = (stateEntryWhichMayRequireUpdate.proxyCache[
                        nodeData.id
                      ].relationalState = this.getQueryManagerStateFromData({
                        data: nodeData,
                        queryRecord: relationalQueryRecord,
                        isFromSubscriptionMessage: true,
                      }));

                      this.applyClientSideFilterAndSortToState({
                        stateWhichMayRequireUpdate: relationalState,
                        queryRecord: relationalQueryRecord,
                      });

                      stateEntryWhichMayRequireUpdate.proxyCache[
                        nodeData.id
                      ].proxy.updateRelationalResults(
                        this.getResultsFromState({
                          state: relationalState,
                          aliasPath: path.aliasPath,
                        })
                      );
                    }
                  }

                  if (
                    idOfAffectedParent != null &&
                    relationalAlias &&
                    relationalStateEntry
                  ) {
                    const parentProxy =
                      parentStateEntry.proxyCache[idOfAffectedParent]?.proxy;

                    if (parentProxy) {
                      parentProxy.updateRelationalResults(
                        this.getResultsFromState({
                          state: {
                            [relationalAlias]: relationalStateEntry,
                          },
                          aliasPath: path.aliasPath,
                        })
                      );
                    }
                  }
                }
              );
            });
          } else if (messageMeta.type === 'Created') {
            const nodeType = messageMeta.nodeType;

            if (!nodeCreatePaths[nodeType])
              return this.logSubscriptionError(
                `No node create handler found for ${nodeType}`
              );

            nodeCreatePaths[nodeType].forEach((path, i) => {
              const stateEntry = this.state[path.aliasPath[0]];
              if (!stateEntry)
                return this.logSubscriptionError(
                  `No state entry found for ${path.aliasPath[0]}`
                );

              const nodeData = message.data[rootLevelAlias].value as {
                id: Id;
              } & Record<string, any>;

              if (!nodeData)
                return this.logSubscriptionError(
                  `No node data found for ${messageType}`
                );

              const queryRecordEntry = path.queryRecordEntry;

              if (!queryRecordEntry)
                return this.logSubscriptionError(
                  `No queryRecordEntry found for ${path.aliasPath[0]}`
                );

              if (i === 0) {
                // we don't need to call this for every path
                // since it's targeting the same node repository instance
                queryRecordEntry.def.repository.onDataReceived(nodeData);
              }

              if (path.queryRecordEntry.relational) {
                this.notifyRepositories({
                  data: nodeData,
                  queryRecord: path.queryRecordEntry.relational,
                  isFromSubscriptionMessage: true,
                });
              }

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
                isFromSubscriptionMessage: true,
              });

              if (!newCacheEntry)
                return this.logSubscriptionError('No new cache entry found');

              if (!stateEntry.idsOrIdInCurrentResult)
                return this.logSubscriptionError(
                  'No idsOrIdInCurrentResult found on state entry'
                );

              stateEntry.proxyCache[nodeData.id] =
                newCacheEntry.proxyCache[nodeData.id];

              if (queryRecordEntryReturnsArrayOfData({ queryRecordEntry })) {
                if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                  return this.logSubscriptionError(
                    'idsOrIdInCurrentResult is not an array'
                  );

                stateEntry.idsOrIdInCurrentResult.push(nodeData.id);
                // needs to be ok with null totalCount, because it is sometimes not queried
                if (stateEntry.totalCount != null) {
                  stateEntry.totalCount++;
                }

                this.applyClientSideFilterAndSortToStateEntry({
                  stateEntryWhichMayRequireUpdate: stateEntry,
                  queryRecordEntry: path.queryRecordEntry,
                });
              } else {
                stateEntry.idsOrIdInCurrentResult = nodeData.id;
              }
            });
          } else if (messageMeta.type === 'Deleted') {
            const nodeType = messageMeta.nodeType;

            if (!nodeDeletePaths[nodeType])
              return this.logSubscriptionError(
                `No node delete handler found for ${nodeType}`
              );

            nodeDeletePaths[nodeType].forEach(path => {
              const stateEntry = this.state[path.aliasPath[0]];
              if (!stateEntry)
                return this.logSubscriptionError(
                  `No state entry found for ${path.aliasPath[0]}`
                );

              const nodeDeletedId = message.data[rootLevelAlias].id as string;
              if (nodeDeletedId == null)
                return this.logSubscriptionError(
                  'Node deleted message did not include an id'
                );

              if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                return this.logSubscriptionError(
                  'idsOrIdInCurrentResult is not an array'
                );

              const nodeIdx = stateEntry.idsOrIdInCurrentResult.indexOf(
                nodeDeletedId
              );
              if (nodeIdx === -1) return;

              stateEntry.idsOrIdInCurrentResult.splice(nodeIdx, 1);
              delete stateEntry.proxyCache[nodeDeletedId];
              if (stateEntry.totalCount != null) {
                stateEntry.totalCount--;
              }
            });
          } else if (messageMeta.type === 'Inserted') {
            const { parentNodeType, childNodeType } = messageMeta;

            if (!nodeInsertPaths[`${parentNodeType}.${childNodeType}`])
              return this.logSubscriptionError(
                `No node insert handler found for ${parentNodeType}.${childNodeType}`
              );

            const parentId = message.data[rootLevelAlias].target?.id;
            const propertyName = message.data[rootLevelAlias].target?.property;
            const parentRelationshipWhichWasUpdated = propertyName
              ? camelCasePropertyName(propertyName)
              : null;

            if (!parentId)
              return this.logSubscriptionError('No parentId found');
            if (!parentRelationshipWhichWasUpdated || !propertyName)
              return this.logSubscriptionError(
                'No parentRelationshipWhichWasUpdated found'
              );

            nodeInsertPaths[`${parentNodeType}.${childNodeType}`].forEach(
              (path, i) => {
                const { parentQueryRecordEntry } = path;
                if (!parentQueryRecordEntry)
                  return this.logSubscriptionError(
                    `No parentQueryRecord found for ${messageType}`
                  );
                if (!parentQueryRecordEntry.relational)
                  return this.logSubscriptionError(
                    `No parentQueryRecordEntry.relational found for ${messageType}`
                  );

                const nodeInsertedData = message.data[rootLevelAlias].value as {
                  id: Id;
                } & Record<string, any>;

                if (!nodeInsertedData) {
                  return this.logSubscriptionError(
                    `No node inserted data found for ${messageType}`
                  );
                }

                if (i === 0) {
                  // we don't need to call this for every path
                  // since it's targeting the same node repository instance
                  path.queryRecordEntry.def.repository.onDataReceived(
                    nodeInsertedData
                  );
                }

                if (path.queryRecordEntry.relational) {
                  this.notifyRepositories({
                    data: nodeInsertedData,
                    queryRecord: path.queryRecordEntry.relational,
                    isFromSubscriptionMessage: true,
                  });
                }

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
                  isFromSubscriptionMessage: true,
                });

                if (!newCacheEntry)
                  return this.logSubscriptionError('No new cache entry found');

                const cacheEntriesWhichRequireUpdate = this.getStateCacheEntriesForAliasPath(
                  {
                    aliasPath: path.aliasPath,
                    pathEndQueryRecordEntry: path.queryRecordEntry,
                    parentFilters: [
                      {
                        id: parentId,
                        property: propertyName,
                      },
                    ],
                  }
                );

                if (
                  !cacheEntriesWhichRequireUpdate ||
                  cacheEntriesWhichRequireUpdate.length === 0
                )
                  return this.logSubscriptionError(
                    'No parent cache entries found'
                  );

                cacheEntriesWhichRequireUpdate.forEach(stateCacheEntry => {
                  const stateEntry = stateCacheEntry.relationalStateEntry;
                  const parentProxy =
                    stateCacheEntry.parentStateEntry.proxyCache[parentId].proxy;

                  if (!stateEntry)
                    return this.logSubscriptionError('No state entry found');

                  if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                    return this.logSubscriptionError(
                      'idsOrIdInCurrentResult is not an array'
                    );

                  if (
                    !stateEntry.idsOrIdInCurrentResult.includes(
                      nodeInsertedData.id
                    )
                  ) {
                    stateEntry.idsOrIdInCurrentResult.push(nodeInsertedData.id);
                    stateEntry.proxyCache[nodeInsertedData.id] =
                      newCacheEntry.proxyCache[nodeInsertedData.id];
                  }

                  this.applyClientSideFilterAndSortToStateEntry({
                    stateEntryWhichMayRequireUpdate: stateEntry,
                    queryRecordEntry: path.queryRecordEntry,
                  });

                  if (!parentProxy)
                    return this.logSubscriptionError('No parent proxy found');

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
          } else if (messageMeta.type === 'Removed') {
            const { parentNodeType, childNodeType } = messageMeta;

            if (!nodeRemovePaths[`${parentNodeType}.${childNodeType}`])
              return this.logSubscriptionError(
                `No node remove handler found for ${parentNodeType}.${childNodeType}`
              );

            const parentId = message.data[rootLevelAlias].target?.id;

            const propertyName = message.data[rootLevelAlias].target?.property;
            const parentRelationshipWhichWasUpdated = propertyName
              ? camelCasePropertyName(propertyName)
              : null;

            if (!parentId)
              return this.logSubscriptionError('No parentId found');
            if (!parentRelationshipWhichWasUpdated || !propertyName)
              return this.logSubscriptionError(
                'No parentRelationshipWhichWasUpdated found'
              );

            nodeRemovePaths[`${parentNodeType}.${childNodeType}`].forEach(
              path => {
                const { parentQueryRecordEntry } = path;
                if (!parentQueryRecordEntry)
                  return this.logSubscriptionError(
                    `No parentQueryRecord found for ${messageType}`
                  );

                if (!parentQueryRecordEntry.relational)
                  return this.logSubscriptionError(
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
                    pathEndQueryRecordEntry: path.queryRecordEntry,
                    parentFilters: [
                      {
                        id: parentId,
                        property: propertyName,
                      },
                    ],
                  }
                );

                if (
                  !cacheEntriesWhichRequireUpdate ||
                  cacheEntriesWhichRequireUpdate.length === 0
                )
                  return this.logSubscriptionError(
                    'No parent cache entries found'
                  );

                cacheEntriesWhichRequireUpdate.forEach(stateCacheEntry => {
                  const stateEntry = stateCacheEntry.relationalStateEntry;
                  const parentProxy =
                    stateCacheEntry.parentStateEntry.proxyCache[parentId].proxy;

                  if (!stateEntry)
                    return this.logSubscriptionError('No state entry found');

                  if (!Array.isArray(stateEntry.idsOrIdInCurrentResult))
                    return this.logSubscriptionError(
                      'idsOrIdInCurrentResult is not an array'
                    );

                  const indexOfRemovedId = stateEntry.idsOrIdInCurrentResult.findIndex(
                    id => id === nodeRemovedId
                  );

                  if (indexOfRemovedId === -1)
                    return this.logSubscriptionError(
                      `Could not find index of removed id ${nodeRemovedId}`
                    );

                  stateEntry.idsOrIdInCurrentResult.splice(indexOfRemovedId, 1);
                  delete stateEntry.proxyCache[nodeRemovedId];
                  if (stateEntry.totalCount != null) {
                    stateEntry.totalCount--;
                  }

                  if (!parentProxy)
                    return this.logSubscriptionError('No parent proxy found');

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
          } else if (messageMeta.type === 'UpdatedAssociation') {
            const { parentNodeType, childNodeType } = messageMeta;

            if (
              !nodeUpdateAssociationPaths[`${parentNodeType}.${childNodeType}`]
            )
              return this.logSubscriptionError(
                `No node update association handler found for ${parentNodeType}.${childNodeType}`
              );

            const parentId = message.data[rootLevelAlias].target?.id;
            const propertyName = message.data[rootLevelAlias].target?.property;
            const parentRelationshipWhichWasUpdated = propertyName
              ? camelCasePropertyName(propertyName)
              : null;

            if (!parentId)
              return this.logSubscriptionError('No parentId found');
            if (!parentRelationshipWhichWasUpdated || !propertyName)
              return this.logSubscriptionError(
                'No parentRelationshipWhichWasUpdated found'
              );

            nodeUpdateAssociationPaths[
              `${parentNodeType}.${childNodeType}`
            ].forEach((path, i) => {
              const { parentQueryRecordEntry } = path;
              if (!parentQueryRecordEntry)
                return this.logSubscriptionError(
                  `No parentQueryRecord found for ${messageType}`
                );

              if (!parentQueryRecordEntry.relational)
                return this.logSubscriptionError(
                  `No parentQueryRecordEntry.relational found for ${messageType}`
                );

              const nodeAssociatedData = message.data[rootLevelAlias].value as {
                id: Id;
              } & Record<string, any>;

              const relationalAlias = path.aliasPath[path.aliasPath.length - 1];

              let newRelationalStateEntry:
                | QueryManagerStateEntry
                | null
                | undefined = undefined;
              if (nodeAssociatedData) {
                if (i === 0) {
                  // we don't need to call this for every path
                  // since it's targeting the same node repository instance
                  path.queryRecordEntry.def.repository.onDataReceived(
                    nodeAssociatedData
                  );
                }

                if (path.queryRecordEntry.relational) {
                  this.notifyRepositories({
                    data: nodeAssociatedData,
                    queryRecord: path.queryRecordEntry.relational,
                    isFromSubscriptionMessage: true,
                  });
                }

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
                  isFromSubscriptionMessage: true,
                });

                if (!newCacheEntry)
                  return this.logSubscriptionError('No new cache entry found');

                newRelationalStateEntry = newCacheEntry;
              } else if (nodeAssociatedData === null) {
                // must be a strict null check, and not loose
                // since we may receive messages with an undefined `value`, which should not set this relationship to null
                newRelationalStateEntry = null;
              }

              if (newRelationalStateEntry !== undefined) {
                const cacheEntriesWhichRequireUpdate = this.getStateCacheEntriesForAliasPath(
                  {
                    aliasPath: path.aliasPath,
                    pathEndQueryRecordEntry: path.queryRecordEntry,
                    parentFilters: [
                      {
                        id: parentId,
                        property: propertyName,
                      },
                    ],
                  }
                );

                if (
                  !cacheEntriesWhichRequireUpdate ||
                  cacheEntriesWhichRequireUpdate.length === 0
                )
                  return this.logSubscriptionError(
                    'No parent cache entries found'
                  );

                cacheEntriesWhichRequireUpdate.forEach(stateCacheEntry => {
                  const stateEntry = stateCacheEntry.relationalStateEntry;
                  const parentProxy =
                    stateCacheEntry.parentStateEntry.proxyCache[parentId].proxy;

                  if (!stateEntry)
                    return this.logSubscriptionError('No state entry found');

                  stateEntry.idsOrIdInCurrentResult = nodeAssociatedData
                    ? nodeAssociatedData.id
                    : null;

                  if (nodeAssociatedData && newRelationalStateEntry) {
                    stateEntry.proxyCache[nodeAssociatedData.id] =
                      newRelationalStateEntry.proxyCache[nodeAssociatedData.id];
                  }

                  if (!parentProxy)
                    return this.logSubscriptionError('No parent proxy found');

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

    // https://github.com/radialreview/sm-js/wiki/Dev-docs/_edit#client-side-filtering-and-sorting
    applyClientSideFilterAndSortToState = (opts: {
      stateWhichMayRequireUpdate: QueryManagerState;
      queryRecord: QueryRecord | RelationalQueryRecord;
    }) => {
      Object.keys(opts.stateWhichMayRequireUpdate).forEach(alias => {
        const queryRecordEntry = opts.queryRecord[alias];

        if (!queryRecordEntry) return; // nothing to do here

        this.applyClientSideFilterAndSortToStateEntry({
          stateEntryWhichMayRequireUpdate:
            opts.stateWhichMayRequireUpdate[alias],
          queryRecordEntry,
        });
      });
    };

    applyClientSideFilterAndSortToStateEntry = (opts: {
      stateEntryWhichMayRequireUpdate: QueryManagerStateEntry;
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
    }) => {
      const { stateEntryWhichMayRequireUpdate, queryRecordEntry } = opts;
      const currentIds = stateEntryWhichMayRequireUpdate.idsOrIdInCurrentResult;

      if (Array.isArray(currentIds)) {
        const filteredIds = getIdsThatPassFilter({
          queryRecordEntry,
          // it's important to retain the order we acquired from the query
          // in case no client side sorting/filtering is applied
          // so that we don't accidentally change the order of the results
          // when we receive a subscription message
          data: currentIds.map(id => ({
            ...stateEntryWhichMayRequireUpdate.proxyCache[id].proxy,
            // overwrite with the id we have stored in idsOrIdInCurrentResult
            // to prevent the id as string from the proxy from being used
            // which simplifies "includes" checks
            // can be removed when https://winterinternational.atlassian.net/browse/TTD-1707 is merged
            id,
          })),
        });

        const filteredAndSortedIds = getSortedIds({
          queryRecordEntry,
          data: filteredIds.map(id => ({
            ...stateEntryWhichMayRequireUpdate.proxyCache[id].proxy,
            // overwrite with the id we have stored in idsOrIdInCurrentResult
            // to prevent the id as string from the proxy from being used
            // which simplifies "includes" checks
            // can be removed when https://winterinternational.atlassian.net/browse/TTD-1707 is merged
            id,
          })),
        });

        stateEntryWhichMayRequireUpdate.idsOrIdInCurrentResult = filteredAndSortedIds;
        stateEntryWhichMayRequireUpdate.totalCount =
          filteredAndSortedIds.length;
      }
    };

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
          // While the subscription is active, a new user may be created, and that new user may get some todos assigned to them.
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

    /**
     * Returns all state entries for a given alias path,
     * taking the parentFilters into consideration when they are provided
     *
     * For example, may be called with
     * aliasPath: ['users','todos']
     * and a parentFilters: [{id: 'user1-id', property: 'TODOS'}]
     * for Updated, Inserted, Removed, Deleted, UpdatedAssociation type events
     *
     * in that case, if that property is found in the queryRecordEntry
     * should return the stateCacheEntry for any alias using the relationship "todos" for the user with the id 'user-id-1'
     *
     *
     * May also be called with a path like ['users']
     * and no parentFilters
     * for Created and Deleted type events.
     *
     * in that case, should return the root level stateCacheEntry for that alias (this.state['users'])
     */
    public getStateCacheEntriesForAliasPath(opts: {
      aliasPath: Array<string>;
      // query record entry for the end of this path
      // used to check against the properties in the parentFilters
      // if one is provided
      pathEndQueryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
      parentFilters?: Array<{ id: Id; property: string }>;
      previousStateEntries?: Array<{
        parentStateEntry: QueryManagerStateEntry;
        idOfAffectedParent: Id | null;
        relationalStateEntry: Maybe<QueryManagerStateEntry>;
      }>;
    }): Array<{
      // the parent state entry which has a property that is potentially getting updated
      // for example, this could be the `users` collection of results, if a user has a new todo
      parentStateEntry: QueryManagerStateEntry;
      // The entire state entry may be affected if it's a root state entry
      // otherwise idOfTheAffectedParent will be set
      idOfAffectedParent: Id | null;
      relationalAlias: string | null;
      // the relational state entry for the node that was updated/inserted/removed
      // and is related to the target above
      // in the example used above, this would be the entry for user.todos
      // for the user with the id matching the one found in the targetFilter
      //
      // is null when aliasPath has length 1
      // since it is a message that affects a root level results set
      relationalStateEntry: QueryManagerStateEntry | null;
    }> {
      const {
        aliasPath,
        pathEndQueryRecordEntry,
        parentFilters,
        previousStateEntries,
      } = opts;
      const [firstAlias, ...restOfAliasPath] = aliasPath;

      // this is an event that affects a root level result set
      if (!previousStateEntries && restOfAliasPath.length === 0) {
        return [
          {
            parentStateEntry: this.state[firstAlias],
            idOfAffectedParent: null,
            relationalAlias: null,
            relationalStateEntry: null,
          },
        ];
      }

      if (!parentFilters)
        throw Error('parentFilters must be provided for non root level events');

      if (!('_relationshipName' in pathEndQueryRecordEntry)) {
        throw Error(
          'parentFilters provided but no relationship found in pathEndQueryRecordEntry'
        );
      }

      // at the end of this path, if the relationshipName used was not one included in any of the properties
      // within the parentFilters
      // then that means that state entries at the end of this path will not be affected
      // and we can safely return []
      if (
        !parentFilters.some(
          parentFilter =>
            camelCasePropertyName(parentFilter.property) ===
            pathEndQueryRecordEntry._relationshipName
        )
      ) {
        return [];
      }

      const getStateEntriesForFirstAlias = (): Array<{
        parentStateEntry: QueryManagerStateEntry;
        idOfAffectedParent: Id | null;
        relationalAlias: string | null;
        relationalStateEntry: Maybe<QueryManagerStateEntry>;
      }> => {
        if (previousStateEntries) {
          return previousStateEntries.reduce(
            (acc, stateEntry) => {
              const stateEntryToIterate =
                stateEntry.relationalStateEntry || stateEntry.parentStateEntry;

              if (!stateEntryToIterate) return acc;

              // if we are at the end of the alias path, we want to apply the id filter
              // otherwise, we want to return all state entries for this alias
              const shouldApplyIdFilter = restOfAliasPath.length === 0;

              Object.values(stateEntryToIterate.proxyCache).forEach(
                ({ proxy }) => {
                  if (shouldApplyIdFilter) {
                    const matchesSomeIdInTargets = parentFilters.find(
                      parentFilter => {
                        return proxy.id === parentFilter.id;
                      }
                    );

                    if (!matchesSomeIdInTargets) return;
                  }

                  const proxyCacheEntry =
                    stateEntryToIterate.proxyCache[proxy.id];

                  const relationalStateForAlias =
                    proxyCacheEntry.relationalState?.[firstAlias];
                  if (!relationalStateForAlias)
                    throw Error(
                      `No relational state found for alias path "${firstAlias}"`
                    );

                  acc.push({
                    parentStateEntry: stateEntryToIterate,
                    idOfAffectedParent: proxy.id,
                    relationalAlias: firstAlias,
                    relationalStateEntry: relationalStateForAlias,
                  });
                }
              );

              return acc;
            },
            [] as Array<{
              parentStateEntry: QueryManagerStateEntry;
              idOfAffectedParent: Id | null;
              relationalAlias: string | null;
              relationalStateEntry: QueryManagerStateEntry | null;
            }>
          );
        } else {
          if (!this.state[firstAlias])
            throw Error(`No state entry found for alias path "${firstAlias}`);

          return [
            {
              parentStateEntry: this.state[firstAlias],
              idOfAffectedParent: null,
              relationalAlias: null,
              relationalStateEntry: null,
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
          pathEndQueryRecordEntry,
          parentFilters,
        });
      }
    }

    public unsub() {
      Object.keys(this.unsubRecord).forEach(rootLevelAlias => {
        this.unsubRecord[rootLevelAlias]();
      });
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
              onPaginationRequestStateChanged: () =>
                this.opts.onResultsUpdated(this.getQueryResults()),
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
        } else if (idsOrId != null) {
          resultsAcc[resultsAlias] =
            stateForThisAlias.proxyCache[idsOrId].proxy;
        } else {
          resultsAcc[resultsAlias] = null;
        }

        return resultsAcc;
      }, {} as Record<string, any>);
    }

    public getQueryResults = () => {
      const currentResults = this.getResultsFromState({ state: this.state });

      Object.keys(currentResults).forEach(resultsAlias => {
        // NOLEY
        // useSub.spec
        // breaks this test ✓ updates data when paginating (238ms)...
        // fixed this test  ✕ if the query record provided is updated, performs a new query and returns the new set of results when that query resolves (1527ms)
        // QM.spec
        // fixes these tests:
        // ● QueryManager correctly updates the results object when a fitler/sorting/pagination param is updated in a relational query under a paginated list query
        // ● subscription handling › handles an ""UPDATED"" subscription message related to a node that was queried within a root collection, which includes new relational data with different aliases"
        // this.queryResults[resultsAlias] = currentResults[resultsAlias];

        // NOLEY BUG: so we can have the sameIds here, but we can have relational results with differing ids from filtering that are nested on
        // the same collection. So the ids will be the same, but the relational results are not. We could write a diffing algo that looks
        // deeply into the relational results and see if the filters have updated, but since we can have essentially infinitely deep relational results
        // (well really its like triple nested, but besides the point), then that algo will need to be recursive to detect if nodes colllections exist underneath it.
        if (this.queryResults[resultsAlias] == null) {
          this.queryResults[resultsAlias] = currentResults[resultsAlias];
        } else {
          // this would only be the case if the this.queryResults[resultsAlias] is a non paginated array of nodes
          if (Array.isArray(this.queryResults[resultsAlias])) {
            if (!this.queryRecord) throw Error('No query record initialized');
            const queryRecordForThisAlias = this.queryRecord[resultsAlias];

            if (queryRecordForThisAlias?.relational) {
              const {
                isSameIds,
                hasNullRelationalResults,
              } = this.isSameIdsOrHasNullRelationalResultsFromCurrentAndPreviousRelationalResults(
                {
                  relationalAliasesForThisQueryRecord: Object.keys(
                    queryRecordForThisAlias.relational
                  ),
                  previousQueryResults: this.queryResults[resultsAlias],
                  currentQueryResults: currentResults[resultsAlias],
                }
              );

              if (!isSameIds || hasNullRelationalResults) {
                this.queryResults[resultsAlias] = currentResults[resultsAlias];
              }
            }

            const idsFromPreviousQueryResults = this.queryResults[
              resultsAlias
            ].map((DoProxy: any) => DoProxy.id);
            const idsFromCurrentResutls = currentResults[resultsAlias].map(
              (DoProxy: any) => DoProxy.id
            );
            const isSameIds = arrayEquals(
              idsFromPreviousQueryResults,
              idsFromCurrentResutls
            );
            if (!isSameIds) {
              this.queryResults[resultsAlias] = currentResults[resultsAlias];
            }
          } else if (
            // this would be the case if the this.queryResults[resultsAlias] is an array of nodes
            this.queryResults[resultsAlias] instanceof NodesCollection
          ) {
            if (!this.queryRecord) throw Error('No query record initialized');
            const queryRecordForThisAlias = this.queryRecord[resultsAlias];

            if (queryRecordForThisAlias?.relational) {
              const {
                isSameIds,
                hasNullRelationalResults,
              } = this.isSameIdsOrHasNullRelationalResultsFromCurrentAndPreviousRelationalResults(
                {
                  relationalAliasesForThisQueryRecord: Object.keys(
                    queryRecordForThisAlias.relational
                  ),
                  previousQueryResults: this.queryResults[resultsAlias].items,
                  currentQueryResults: currentResults[resultsAlias].items,
                }
              );

              if (!isSameIds || hasNullRelationalResults) {
                this.queryResults[resultsAlias] = currentResults[resultsAlias];
              }
            }

            const idsFromPreviousQueryResults = this.queryResults[
              resultsAlias
            ].items.map((DoProxy: any) => DoProxy.id);
            const idsFromCurrentResutls = currentResults[
              resultsAlias
            ].items.map((DoProxy: any) => DoProxy.id);
            const isSameIds = arrayEquals(
              idsFromPreviousQueryResults,
              idsFromCurrentResutls
            );
            if (!isSameIds) {
              this.queryResults[resultsAlias] = currentResults[resultsAlias];
            }
          } else {
            this.queryResults[resultsAlias] = currentResults[resultsAlias];
          }
        }
      });

      return this.queryResults;
    };

    public isSameIdsOrHasNullRelationalResultsFromCurrentAndPreviousRelationalResults = (opts: {
      relationalAliasesForThisQueryRecord: Array<string>;
      previousQueryResults: Array<Record<string, any>>;
      currentQueryResults: Array<Record<string, any>>;
    }) => {
      const {
        relationalAliasesForThisQueryRecord,
        previousQueryResults,
        currentQueryResults,
      } = opts;

      let hasNullRelationalResults = false;

      const relationalIdsFromPreviousQueryResults = previousQueryResults.reduce(
        (acc: Array<Id>, DoProxy) => {
          relationalAliasesForThisQueryRecord.forEach(relationalAlias => {
            if (DoProxy[relationalAlias] == null) {
              hasNullRelationalResults = true;
              return;
            } else if (Array.isArray(DoProxy[relationalAlias])) {
              const relationalProxyIds = DoProxy[relationalAlias].map(
                (DoRelationalProxy: Record<string, any>) => DoRelationalProxy.id
              );
              return acc.push(...relationalProxyIds);
            } else if (DoProxy[relationalAlias] instanceof NodesCollection) {
              const relationalProxyIds = DoProxy[relationalAlias].items.map(
                (DoRelationalProxy: Record<string, any>) => {
                  return DoRelationalProxy.id;
                }
              );
              return acc.push(...relationalProxyIds);
            } else {
              return acc.push(DoProxy[relationalAlias].id);
            }
          });

          return acc;
        },
        [] as Array<Id>
      );

      const relationalIdsFromCurrentQueryResults = currentQueryResults.reduce(
        (acc: Array<Id>, DoProxy) => {
          relationalAliasesForThisQueryRecord.forEach(relationalAlias => {
            if (DoProxy[relationalAlias] == null) {
              hasNullRelationalResults = true;
              return;
            } else if (Array.isArray(DoProxy[relationalAlias])) {
              const relationalProxyIds = DoProxy[relationalAlias].map(
                (DoRelationalProxy: Record<string, any>) => DoRelationalProxy.id
              );
              return acc.push(...relationalProxyIds);
            } else if (DoProxy[relationalAlias] instanceof NodesCollection) {
              const relationalProxyIds = DoProxy[relationalAlias].items.map(
                (DoRelationalProxy: Record<string, any>) => {
                  return DoRelationalProxy.id;
                }
              );
              return acc.push(...relationalProxyIds);
            } else {
              return acc.push(DoProxy[relationalAlias].id);
            }
          });

          return acc;
        },
        [] as Array<Id>
      );

      const isSameIds = arrayEquals(
        relationalIdsFromPreviousQueryResults,
        relationalIdsFromCurrentQueryResults
      );

      //NOLEY BUG: failing test has the same ids, and same relational aliases.
      // need to look into what updated before on mm-gql and find the source.
      console.log(
        'NOLEY',
        isSameIds,
        hasNullRelationalResults,
        relationalIdsFromPreviousQueryResults,
        relationalIdsFromCurrentQueryResults
      );

      return { isSameIds, hasNullRelationalResults };
    };

    /**
     * Takes a queryRecord and the data that resulted from that query
     * notifies the appropriate repositories so that DOs can be constructed or updated
     */
    public notifyRepositories(opts: {
      data: Record<string, any>;
      queryRecord: {
        [key: string]: QueryRecordEntry | RelationalQueryRecordEntry | null;
      };
      isFromSubscriptionMessage: boolean;
    }) {
      Object.keys(opts.queryRecord).forEach(queryAlias => {
        const queryRecordEntry = opts.queryRecord[queryAlias];

        if (!queryRecordEntry) return;

        const dataAlias = getAliasForData({
          queryRecordEntry,
          isFromSubscriptionMessage: opts.isFromSubscriptionMessage,
          originalAlias: queryAlias,
        });

        const dataForThisAlias = getDataFromQueryResponsePartial({
          queryRecordEntry,
          queryResponsePartial: opts.data[dataAlias],
          collectionsIncludePagingInfo: !opts.isFromSubscriptionMessage,
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
            const relationalQuery = relationalQueries[relationalAlias];

            const relationalDataAlias = getAliasForData({
              queryRecordEntry: relationalQuery,
              isFromSubscriptionMessage: opts.isFromSubscriptionMessage,
              originalAlias: relationalAlias,
            });

            let relationalDataForThisAlias = Array.isArray(dataForThisAlias)
              ? dataForThisAlias.flatMap(
                  (dataEntry: any) => dataEntry[relationalDataAlias]
                )
              : dataForThisAlias[relationalDataAlias];

            // makes it easier to simply handle this as an array below
            if (!Array.isArray(relationalDataForThisAlias)) {
              relationalDataForThisAlias = [relationalDataForThisAlias];
            }

            relationalDataForThisAlias.forEach((relationalDataEntry: any) => {
              if (relationalAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
                const node = relationalDataEntry;
                if (node && node.type !== relationalQuery.def.type) return;
              }

              this.notifyRepositories({
                data: {
                  [relationalDataAlias]: relationalDataEntry,
                },
                queryRecord: {
                  [relationalAlias]: relationalQuery,
                },
                isFromSubscriptionMessage: opts.isFromSubscriptionMessage,
              });
            });
          });
        }
      });
    }

    public getQueryManagerStateFromData(opts: {
      data: Record<string, any>;
      queryRecord: QueryRecord | RelationalQueryRecord;
      isFromSubscriptionMessage: boolean;
    }): QueryManagerState {
      return Object.keys(opts.queryRecord).reduce(
        (resultingStateAcc, queryAlias) => {
          const queryRecordEntry = opts.queryRecord[queryAlias];

          if (!queryRecordEntry)
            throw Error(`No query record entry found for ${queryAlias}`);

          const dataAlias = getAliasForData({
            queryRecordEntry,
            isFromSubscriptionMessage: opts.isFromSubscriptionMessage,
            originalAlias: queryAlias,
          });

          const dataForThisAlias = opts.data[dataAlias];

          if (dataForThisAlias == null) {
            resultingStateAcc[queryAlias] = getEmptyStateEntry();
            return resultingStateAcc;
          }

          const cacheEntry = this.buildCacheEntry({
            nodeData: getDataFromQueryResponsePartial({
              queryResponsePartial: dataForThisAlias,
              queryRecordEntry: opts.queryRecord[queryAlias],
              collectionsIncludePagingInfo: !opts.isFromSubscriptionMessage,
            }),
            pageInfoFromResults: this.getPageInfoFromResponse({
              dataForThisAlias: dataForThisAlias,
              queryRecordEntry,
              collectionsIncludePagingInfo: !opts.isFromSubscriptionMessage,
            }),
            totalCount: this.getTotalCountFromResponse({
              dataForThisAlias: dataForThisAlias,
            }),
            clientSidePageInfo: this.getInitialClientSidePageInfo({
              queryRecordEntry: opts.queryRecord[queryAlias],
            }),
            queryRecord: opts.queryRecord,
            queryAlias,
            aliasPath: [queryAlias],
            isFromSubscriptionMessage: opts.isFromSubscriptionMessage,
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
      isFromSubscriptionMessage: boolean;
    }): Maybe<QueryManagerStateEntry> {
      const { nodeData, queryAlias, isFromSubscriptionMessage } = opts;
      const queryRecord = opts.queryRecord;
      const queryRecordEntry = queryRecord[opts.queryAlias];

      if (!queryRecordEntry || !nodeData) {
        return getEmptyStateEntry();
      }

      const { relational: relationalQueryRecord } = queryRecordEntry;

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
        if (!relationalQueryRecord) return null;

        return Object.keys(relationalQueryRecord).reduce(
          (relationalStateAcc, relationalAlias) => {
            const queryRecordEntry = relationalQueryRecord[relationalAlias];

            const relationalDataAlias = getAliasForData({
              queryRecordEntry,
              isFromSubscriptionMessage: opts.isFromSubscriptionMessage,
              originalAlias: relationalAlias,
            });

            const relationalDataForThisAlias = getDataFromQueryResponsePartial({
              queryResponsePartial: node[relationalDataAlias],
              queryRecordEntry,
              collectionsIncludePagingInfo: !isFromSubscriptionMessage,
            });

            if (!relationalDataForThisAlias) {
              relationalStateAcc[relationalAlias] = getEmptyStateEntry();
              return relationalStateAcc;
            }

            const aliasPath = this.addIdToLastEntryInAliasPath({
              aliasPath: opts.aliasPath,
              id: node.id,
            });

            const getPageInfoFromResults = () => {
              const shouldBeWrappedInNodes = queryRecordEntryReturnsArrayOfDataNestedInNodes(
                { queryRecordEntry }
              );
              if (!isFromSubscriptionMessage && shouldBeWrappedInNodes) {
                return this.getPageInfoFromResponse({
                  dataForThisAlias: node[relationalDataAlias],
                  queryRecordEntry,
                  collectionsIncludePagingInfo: true,
                });
              } else if (isFromSubscriptionMessage && shouldBeWrappedInNodes) {
                return {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'mock-start-cursor-should-not-be-used',
                  endCursor: 'mock-end-cursor-should-not-be-used',
                  totalPages: Math.ceil(
                    relationalDataForThisAlias.length /
                      (relationalQueryRecord[relationalAlias].pagination
                        ?.itemsPerPage || DEFAULT_PAGE_SIZE)
                  ),
                };
              } else {
                return null;
              }
            };

            const pageInfoFromResults = getPageInfoFromResults();

            const totalCount = !isFromSubscriptionMessage
              ? this.getTotalCountFromResponse({
                  dataForThisAlias: node[relationalDataAlias],
                })
              : relationalDataForThisAlias.length;

            const cacheEntry = this.buildCacheEntry({
              nodeData: relationalDataForThisAlias,
              pageInfoFromResults,
              totalCount,
              clientSidePageInfo: this.getInitialClientSidePageInfo({
                queryRecordEntry: relationalQueryRecord[relationalAlias],
              }),
              queryAlias: relationalAlias,
              queryRecord: relationalQueryRecord,
              aliasPath: [...aliasPath, relationalAlias],
              isFromSubscriptionMessage,
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
        const relationalQueries = relationalQueryRecord
          ? this.getApplicableRelationalQueries({
              relationalQueries: relationalQueryRecord,
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
        } else if ('ids' in queryRecordEntry) {
          return {
            idsOrIdInCurrentResult: queryRecordEntry.ids as Array<string>,
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
            [(nodeData as { id: Id }).id]: buildProxyCacheEntryForNode({
              node: nodeData,
            }),
          },
          pageInfoFromResults: opts.pageInfoFromResults,
          totalCount: opts.totalCount,
          clientSidePageInfo: opts.clientSidePageInfo,
        };
      }
    }

    public removeUnionSuffix(alias: string) {
      if (alias.includes(RELATIONAL_UNION_QUERY_SEPARATOR))
        return alias.split(RELATIONAL_UNION_QUERY_SEPARATOR)[0];
      else return alias;
    }

    public getApplicableRelationalQueries(opts: {
      relationalQueries: RelationalQueryRecord;
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
        {} as RelationalQueryRecord
      );
    }

    public getPageInfoFromResponse(opts: {
      dataForThisAlias: any;
      queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
      collectionsIncludePagingInfo: boolean;
    }): Maybe<PageInfoFromResults> {
      if (
        !opts.collectionsIncludePagingInfo &&
        queryRecordEntryReturnsArrayOfData({
          queryRecordEntry: opts.queryRecordEntry,
        })
      ) {
        return {
          totalPages: Math.ceil(
            opts.dataForThisAlias.length /
              (opts.queryRecordEntry.pagination?.itemsPerPage ||
                DEFAULT_PAGE_SIZE)
          ),
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'mock-cursor-should-not-be-used',
          endCursor: 'mock-cursor-should-not-be-used',
        };
      }

      return opts.dataForThisAlias?.[PAGE_INFO_PROPERTY_KEY] || null;
    }

    public getTotalCountFromResponse(opts: {
      dataForThisAlias: any;
    }): Maybe<number> {
      return opts.dataForThisAlias?.[TOTAL_COUNT_PROPERTY_KEY];
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
        isFromSubscriptionMessage: false,
      });

      const newState = this.getQueryManagerStateFromData({
        data: opts.newData,
        queryRecord: opts.queryRecord,
        isFromSubscriptionMessage: false,
      });

      this.extendStateObject({
        aliasPath: opts.aliasPath,
        originalAliasPath: opts.aliasPath,
        state: this.state,
        newState,
        mergeStrategy: opts.event === 'LOAD_MORE' ? 'CONCAT' : 'REPLACE',
      });

      this.opts.onResultsUpdated(this.getQueryResults());
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

      if (this.opts.subscribe) {
        this.subscriptionMessageHandlers = this.getSubscriptionMessageHandlers({
          queryRecord: this.queryRecord,
        });

        const subscriptionGQLDocs = getSubscriptionGQLDocumentsFromQueryRecord({
          queryId: this.opts.queryId,
          queryRecord: this.queryRecord,
          useServerSidePaginationFilteringSorting: this.opts
            .useServerSidePaginationFilteringSorting,
        });

        Object.keys(minimalQueryRecord).forEach(rootLevelAlias => {
          if (!subscriptionGQLDocs[rootLevelAlias])
            return this.logSubscriptionError(
              `No subscription GQL document found for root level alias ${rootLevelAlias}`
            );

          if (!this.subscriptionMessageHandlers[rootLevelAlias])
            return this.logSubscriptionError(
              `No subscription message handler found for root level alias ${rootLevelAlias}`
            );

          const existingSubCanceller = this.unsubRecord[rootLevelAlias];

          this.unsubRecord[rootLevelAlias] = subscribe({
            queryGQL: subscriptionGQLDocs[rootLevelAlias],
            // @TODO revert after BE no longer throwing errors for missing fields in subs
            // onError: this.opts.onSubscriptionError,
            onError: error => {
              this.logSubscriptionError(error);
            },
            onMessage: this.onSubscriptionMessage,
            mmGQLInstance: mmGQLInstance,
          });

          if (existingSubCanceller) {
            // this query changed
            // cancel the previous query definition subscription
            // it's important that this happens after the new subscription is created
            // otherwise some subscription messages may be missed
            //
            // this will happen for example if a subscription gets notified of a message that alters the queryDefinition
            // which then causes the subscription to be cancelled and a new one to be created
            // if the cancellation happens before all messages pertaining that event are received
            // some messages may be missed
            setTimeout(() => {
              existingSubCanceller();
              // long enough that all messages pertaining a certain even should definitely be received
              // not so long that we end up with lots of dead active subscriptions
            }, 5000);
          }
        });
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
        isFromSubscriptionMessage: false,
      });

      const newState = this.getQueryManagerStateFromData({
        data: opts.queryResult,
        queryRecord: opts.minimalQueryRecord,
        isFromSubscriptionMessage: false,
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

      this.opts.onResultsUpdated(this.getQueryResults());
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
          // happens in this case https://winterinternational.atlassian.net/browse/TTD-2096
          return;

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
      id: Id;
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
  if (opts.mmGQLInstance.logging.gqlQueries) {
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

  if (opts.mmGQLInstance.generateMockData) {
    await new Promise(res => setTimeout(res, opts.getMockDataDelay?.() || 0));
  }

  if (opts.mmGQLInstance.logging.gqlQueries) {
    console.log('query response', JSON.stringify(response, null, 2));
  }
  return response;
}

function subscribe(opts: {
  queryGQL: DocumentNode;
  mmGQLInstance: IMMGQL;
  onMessage: (message: SubscriptionMessage) => void;
  onError: (error: any) => void;
}) {
  if (opts.mmGQLInstance.generateMockData) {
    return () => {
      // purposely no-op
    };
  }

  return opts.mmGQLInstance.gqlClient.subscribe({
    gql: opts.queryGQL,
    onMessage: opts.onMessage,
    onError: opts.onError,
  });
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

function addIdToAliasPathEntry(opts: { aliasPathEntry: string; id: Id }) {
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

function getMessageMetaFromType(messageType: string) {
  type SingleNodeMessageMeta = {
    type: 'Updated' | 'Created' | 'Deleted';
    nodeType: string;
  };

  type RelationshipMessageMeta = {
    type: 'Inserted' | 'Removed' | 'UpdatedAssociation';
    parentNodeType: string;
    childNodeType: string;
  };

  let type: SingleNodeMessageMeta['type'] | RelationshipMessageMeta['type'];
  let isSingleNodeMessage = false;
  let isRelationshipMessage = false;

  if (messageType.startsWith('Updated_')) {
    type = 'Updated';
    isSingleNodeMessage = true;
  } else if (messageType.startsWith('Created_')) {
    type = 'Created';
    isSingleNodeMessage = true;
  } else if (messageType.startsWith('Deleted_')) {
    type = 'Deleted';
    isSingleNodeMessage = true;
  } else if (messageType.startsWith('Inserted_')) {
    type = 'Inserted';
    isRelationshipMessage = true;
  } else if (messageType.startsWith('Removed_')) {
    type = 'Removed';
    isRelationshipMessage = true;
  } else if (messageType.startsWith('UpdatedAssociation_')) {
    type = 'UpdatedAssociation';
    isRelationshipMessage = true;
  } else {
    throw new UnreachableCaseError(messageType as never);
  }

  if (isSingleNodeMessage) {
    return {
      type,
      nodeType: lowerCaseFirstLetter(messageType.split('_')[1]),
    } as SingleNodeMessageMeta;
  } else if (isRelationshipMessage) {
    return {
      type,
      ...getNodeTypeAndParentNodeTypeFromRelationshipSubMessage(messageType),
    } as RelationshipMessageMeta;
  } else {
    throw new UnreachableCaseError(messageType as never);
  }
}

function camelCasePropertyName(property: string) {
  // Takes a property name in the format "SOME_PROPERTY_NAME"
  // and returns "somePropertyName"
  // taking into account that some properties may already be camel cased
  // and should not be modified
  if (property === property.toLowerCase()) return property;

  const split = property.split('_');
  if (split.length === 1) return property.toLowerCase();
  return split.reduce((acc, curr, i) => {
    if (i === 0) return curr.toLowerCase();
    return `${acc}${curr.charAt(0).toUpperCase()}${curr
      .slice(1)
      .toLowerCase()}`;
  }, '');
}

function getAliasForData(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  isFromSubscriptionMessage: boolean;
  originalAlias: string;
}) {
  const relationshipName =
    '_relationshipName' in opts.queryRecordEntry
      ? opts.queryRecordEntry._relationshipName
      : null;
  if (opts.isFromSubscriptionMessage && relationshipName) {
    // collections in subscriptions cannot be filtered, sorted, or paginated
    // because of that, it would be redundant to subscribe to the same related collection twice
    // to avoid this, we group all data being accessed for a collection of nodes
    // under the same alias, using the relationshipName
    return relationshipName;
  } else {
    return opts.originalAlias;
  }
}
