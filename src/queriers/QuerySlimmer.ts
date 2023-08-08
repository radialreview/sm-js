// PIOTR TODO
// - slim query record should not slim fields always requested
// - Use relationshipName
// - Snapshot tests
// - cacheNewData
//   - Confirm/test existing data is not overwritten
//   - Confirm/test existing subsByProp counts are correctly updated
// - Go through main fns being used and look into any cleanup/better naming
// - Add onSubscriptionMessageReceived method: https://tractiontools.atlassian.net/browse/TTD-377

// import { observable, when } from 'mobx';
import { observable } from 'mobx';

import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
  IMMGQL,
  IGQLClient,
} from '../types';
import { getQueryGQLDocumentFromQueryRecord } from './queryDefinitionAdapters';

export interface IFetchedQueryData {
  subscriptionsByProperty: Record<string, number>;
  results: any | Array<any> | null;
}

export interface IInFlightQueryRecord {
  queryId: string;
  queryRecord: QueryRecord | RelationalQueryRecord;
}

export type TQueryDataByContextMap = Record<string, IFetchedQueryData>;

export type TInFlightQueriesByContextMap = Record<
  string,
  IInFlightQueryRecord[]
>;

export type TQueryRecordByContextMap = Record<
  string,
  QueryRecord | RelationalQueryRecord
>;

// const IN_FLIGHT_TIMEOUT_MS = 1000;

export class QuerySlimmer {
  constructor(mmGQLInstance: IMMGQL) {
    this.mmGQLInstance = mmGQLInstance;
  }

  private mmGQLInstance: IMMGQL;

  public queriesByContext: TQueryDataByContextMap = {};
  public inFlightQueryRecords: TInFlightQueriesByContextMap = observable({});

  public async query(opts: {
    queryRecord: QueryRecord;
    queryId: string;
    useServerSidePaginationFilteringSorting: boolean;
    tokenName: string;
    batchKey?: string;
  }) {
    const newQuerySlimmedByCache = this.getSlimmedQueryAgainstCache(
      opts.queryRecord
    ) as QueryRecord | null;

    // If newQuerySlimmedByCache equals null, all data being requested by this query are already cached.
    // We stich this data up from queriesByContext and return it.
    if (newQuerySlimmedByCache === null) {
      const data = this.getDataForQueryFromCache(opts.queryRecord);

      this.log('[QuerySlimmer] query fully cached.', {
        originalQuery: opts.queryRecord,
        cache: this.queriesByContext,
        dataReturned: data,
      });

      return data;

      // If newQuerySlimmedByCache is not null, only a portion of the data being requested is cached.
      // We send a request containing only the fields that are not already cached.
      // Once this new data is returned, we saved the new results in the cache and rebuild the full query response from the cache.
    } else {
      await this.sendQueryRequest({
        queryId: opts.queryId,
        queryRecord: newQuerySlimmedByCache,
        useServerSidePaginationFilteringSorting:
          opts.useServerSidePaginationFilteringSorting,
        tokenName: opts.tokenName,
        batchKey: opts.batchKey,
      });

      const data = this.getDataForQueryFromCache(opts.queryRecord);

      this.log('[QuerySlimmer] query partially cached.', {
        originalQuery: opts.queryRecord,
        slimmedQuery: newQuerySlimmedByCache,
        cache: this.queriesByContext,
        dataReturned: data,
      });

      return data;
    }
  }

  // Given a QueryRecord and the results of the query, caches the results by context keys along
  // with how many current active subscriptions exist for each field in the query.
  public cacheNewData(
    queryRecordToCache: QueryRecord | RelationalQueryRecord,
    queryResponseToCache: Record<string, any>,
    parentContextKey?: string
  ) {
    Object.keys(queryRecordToCache).forEach(recordFieldToCache => {
      const queryRecordEntry = queryRecordToCache[recordFieldToCache];
      if (!queryRecordEntry) return;

      const currentQueryContextKey = this.createContextKeyForQueryRecordEntry(
        queryRecordEntry,
        parentContextKey
      );
      const currentCacheForThisContext = this.queriesByContext[
        currentQueryContextKey
      ];
      const subscriptionsByProperty = currentCacheForThisContext?.subscriptionsByProperty
        ? { ...currentCacheForThisContext?.subscriptionsByProperty }
        : {};

      const isResultsByParentId = parentContextKey !== undefined;

      const resultsToCache: Record<string, any> = {
        byParentId: isResultsByParentId,
      };

      // If we are dealing with relational data in a recursive call, the data will be organized under id keys of the parent object.
      // If we are getting todos under a user the results will look like this:
      // { [user-id]: { todos: { nodes: [...todos for this user] } }
      // We want to cache this data as is but with only the actual todo data.
      // For example, if the todos have further relational data (assignees), those should be cached under their own context.
      if (isResultsByParentId) {
        const parentIdKeys = Object.keys(queryResponseToCache);

        parentIdKeys.forEach((parentId, parentIndex) => {
          resultsToCache[parentId] = {};
          const dataToCacheForParent = resultsToCache[parentId];
          const responseDataForParent =
            queryResponseToCache[parentId][recordFieldToCache];

          // If the data for this field is a nodes collection, we loop over each result and only cache the data
          // for this particular model, leaving out any relational data.
          if ('nodes' in responseDataForParent) {
            dataToCacheForParent[recordFieldToCache] = {
              nodes: [],
            };

            responseDataForParent.nodes.forEach(
              (response: Record<string, any>, responseIndex: number) => {
                const dataToCache: Record<string, any> = {};

                queryRecordEntry.properties.forEach(property => {
                  dataToCache[property] = response[property];

                  if (responseIndex === 0 && parentIndex === 0) {
                    if (subscriptionsByProperty[property]) {
                      subscriptionsByProperty[property] += 1;
                    } else {
                      subscriptionsByProperty[property] = 1;
                    }
                  }
                });

                dataToCacheForParent[recordFieldToCache].nodes.push(
                  dataToCache
                );
              }
            );
            // This data is not a nodes collection. We can just look at the data object and cache only the data
            // for this particular model.
          } else {
            dataToCacheForParent[recordFieldToCache] = {};

            queryRecordEntry.properties.forEach(property => {
              dataToCacheForParent[recordFieldToCache][property] =
                responseDataForParent[property];

              if (parentIndex === 0) {
                if (subscriptionsByProperty[property]) {
                  subscriptionsByProperty[property] += 1;
                } else {
                  subscriptionsByProperty[property] = 1;
                }
              }
            });
          }
        });
        // Deal with data that is not relational (top level of a query).
      } else {
        resultsToCache[recordFieldToCache] = {};
        const resultObj = resultsToCache[recordFieldToCache];

        // Handle nodes collection
        if ('nodes' in queryResponseToCache[recordFieldToCache]) {
          resultObj['nodes'] = queryResponseToCache[recordFieldToCache][
            'nodes'
          ].map((response: Record<string, any>, responseIndex: number) => {
            const dataToCache: Record<string, any> = {};

            queryRecordEntry.properties.forEach(property => {
              dataToCache[property] = response[property];

              if (responseIndex === 0) {
                if (subscriptionsByProperty[property]) {
                  subscriptionsByProperty[property] += 1;
                } else {
                  subscriptionsByProperty[property] = 1;
                }
              }
            });

            return dataToCache;
          });
        } else {
          queryRecordEntry.properties.forEach(property => {
            resultObj[property] =
              queryResponseToCache[recordFieldToCache][property];

            if (subscriptionsByProperty[property]) {
              subscriptionsByProperty[property] += 1;
            } else {
              subscriptionsByProperty[property] = 1;
            }
          });
        }
      }

      const mergedResults = this.mergeQueryResults({
        cachedResult: currentCacheForThisContext?.results,
        newResult: resultsToCache,
      });

      // Cache the data we have organized for this specific query record (relational data is cached in its own context).
      this.queriesByContext[currentQueryContextKey] = {
        subscriptionsByProperty: subscriptionsByProperty,
        results: mergedResults,
      };

      // If this QueryRecord has relational data, we organize the specific relational data under each individual parent id.
      // relationalDataToCache will hold only relational.
      if (queryRecordEntry.relational !== undefined) {
        const relationalQueryRecord = queryRecordEntry.relational;
        const relationalFields = Object.keys(relationalQueryRecord);

        // The data we are given is organized under parent id keys.
        if (isResultsByParentId) {
          relationalFields.forEach(rField => {
            const parentIds = Object.keys(queryResponseToCache);
            const dataToCacheForField: Record<string, any> = {};

            parentIds.forEach(pId => {
              const dataForRecordField =
                queryResponseToCache[pId][recordFieldToCache];

              if ('nodes' in dataForRecordField) {
                dataForRecordField['nodes'].forEach(
                  (datum: Record<string, any>) => {
                    if (!dataToCacheForField[datum.id]) {
                      dataToCacheForField[datum.id] = {};
                    }
                    dataToCacheForField[datum.id][rField] = datum[rField];
                  }
                );
              } else {
                dataToCacheForField[dataForRecordField['id']] = {
                  [rField]: dataForRecordField[rField],
                };
              }
            });

            const queryRecordForThisRField = {
              [rField]: relationalQueryRecord[rField],
            };

            this.cacheNewData(
              queryRecordForThisRField,
              dataToCacheForField,
              currentQueryContextKey
            );
          });
        } else {
          const relationalDataToCache: Record<string, any> = {};

          if ('nodes' in queryResponseToCache[recordFieldToCache]) {
            queryResponseToCache[recordFieldToCache].nodes.forEach(
              (response: Record<string, any>) => {
                relationalDataToCache[response.id] = {};

                relationalFields.forEach(rField => {
                  relationalDataToCache[response.id][rField] = response[rField];
                });
              }
            );

            this.cacheNewData(
              relationalQueryRecord,
              relationalDataToCache,
              currentQueryContextKey
            );
          } else {
            relationalFields.forEach(rField => {
              const idOfQueryRecord =
                queryResponseToCache[recordFieldToCache].id;

              const rDataToCache: Record<string, any> = {
                [idOfQueryRecord]: {
                  [rField]: queryResponseToCache[recordFieldToCache][rField],
                },
              };

              const queryRecordForThisRField = {
                [rField]: relationalQueryRecord[rField],
              };

              this.cacheNewData(
                queryRecordForThisRField,
                rDataToCache,
                currentQueryContextKey
              );
            });
          }
        }
      }
    });
  }

  // Given a QueryRecord for a new query returns a QueryRecord that
  // has properties removed that are already cached.
  public getSlimmedQueryAgainstCache(
    newQuery: QueryRecord | RelationalQueryRecord,
    parentContextKey?: string
  ) {
    // The query record could be a root query (not relational), or a child relational query.
    // They have different types so we create/update a brand new query record depending the type of query we are dealing with:
    //   - Dealing with a root query (not relational): slimmedQueryRecord and newRootRecordEntry
    //   - Dealing with a relational query: slimmedRelationalQueryRecord and newRelationalRecordEntry
    // We know we are dealing with a relational query when parentContextKey is NOT undefined
    const slimmedQueryRecord: QueryRecord = {};
    const slimmedRelationalQueryRecord: RelationalQueryRecord = {};
    const isNewQueryARootQuery = parentContextKey === undefined;

    Object.keys(newQuery).forEach(newQueryKey => {
      const newQueryRecordEntry = newQuery[newQueryKey];
      const newRootRecordEntry = newQueryRecordEntry as QueryRecordEntry;
      const newRelationalRecordEntry = newQueryRecordEntry as RelationalQueryRecordEntry;

      if (!newQueryRecordEntry) return;

      const newQueryContextKey = this.createContextKeyForQueryRecordEntry(
        newQueryRecordEntry,
        parentContextKey
      );

      if (this.queriesByContext[newQueryContextKey] === undefined) {
        // If the context key of the new query is not found in queriesByContext we know there is no cached version of this query.
        if (isNewQueryARootQuery) {
          slimmedQueryRecord[newQueryKey] = newRootRecordEntry;
        } else {
          slimmedRelationalQueryRecord[newQueryKey] = newRelationalRecordEntry;
        }
      } else {
        // If a context key is found for the new query in queriesByContext we need to check if any of the properties being requested
        // by the new query are already cached.
        const cachedQuery = this.queriesByContext[newQueryContextKey];
        const newRequestedProperties = this.getPropertiesNotAlreadyCached({
          newQueryProps: newQueryRecordEntry.properties,
          cachedQuerySubsByProperty: cachedQuery.subscriptionsByProperty,
        });

        // If there are no further child relational queries to deal with and there are properties being requested that are not cached
        // we can just return the new query with only the newly requested properties.
        if (
          newRequestedProperties !== null &&
          newQueryRecordEntry.relational === undefined
        ) {
          if (isNewQueryARootQuery) {
            slimmedQueryRecord[newQueryKey] = {
              ...newRootRecordEntry,
              properties: newRequestedProperties,
            };
          } else {
            slimmedRelationalQueryRecord[newQueryKey] = {
              ...newRelationalRecordEntry,
              properties: newRequestedProperties,
            };
          }
        }

        // If there are child relational queries we still need to handle those even if the parent query is requesting only cached properties.
        if (newQueryRecordEntry.relational !== undefined) {
          const slimmedNewRelationalQueryRecord = this.getSlimmedQueryAgainstCache(
            newQueryRecordEntry.relational,
            newQueryContextKey
          );

          // If there are any non-cached properties being requested in the child relational query
          // we will still need to return the query record even if the parent is not requesting any un-cached properties.
          // In this scenario we return an empty array for the properties of the parent query while the child relational query is populated.
          if (slimmedNewRelationalQueryRecord !== null) {
            if (isNewQueryARootQuery) {
              slimmedQueryRecord[newQueryKey] = {
                ...newRootRecordEntry,
                properties: newRequestedProperties ?? [],
                relational: {
                  ...(slimmedNewRelationalQueryRecord as RelationalQueryRecord),
                },
              };
            } else {
              slimmedRelationalQueryRecord[newQueryKey] = {
                ...newRelationalRecordEntry,
                properties: newRequestedProperties ?? [],
                relational: {
                  ...(slimmedNewRelationalQueryRecord as RelationalQueryRecord),
                },
              };
            }
          }
        }
      }
    });

    const objectToReturn = isNewQueryARootQuery
      ? slimmedQueryRecord
      : slimmedRelationalQueryRecord;

    return Object.keys(objectToReturn).length === 0 ? null : objectToReturn;
  }

  // Returns all data from the cache for a given QueryRecord
  public getDataForQueryFromCache(
    newQuery: QueryRecord | RelationalQueryRecord,
    parentContextKey?: string
  ) {
    const queryDataToReturn: Record<string, any> = {};
    const newQueryKeys = Object.keys(newQuery);

    newQueryKeys.forEach(newQueryKey => {
      const queryRecordEntry = newQuery[newQueryKey];
      if (!queryRecordEntry) return;

      const contextKey = this.createContextKeyForQueryRecordEntry(
        queryRecordEntry,
        parentContextKey
      );

      const cachedDataForContext = this.queriesByContext[contextKey];
      let dataForNewQueryKey: Record<string, any> = {};

      if (cachedDataForContext.results.byParentId) {
        Object.entries(cachedDataForContext.results).forEach(
          ([parentId, resultsUnderParent]) => {
            if (parentId !== 'byParentId') {
              if (parentId in dataForNewQueryKey) {
                dataForNewQueryKey[parentId] = {
                  ...dataForNewQueryKey[parentId],
                  ...(resultsUnderParent as Record<string, any>),
                };
              } else {
                dataForNewQueryKey[parentId] = {
                  ...(resultsUnderParent as Record<string, any>),
                };
              }
            }
          }
        );
      } else {
        const cachedDataForKey = cachedDataForContext.results[newQueryKey];

        if ('nodes' in cachedDataForKey) {
          const nodesDataToReturn: Record<string, any>[] = [];

          cachedDataForKey.nodes.forEach((datum: Record<string, any>) => {
            const dataToReturnDatum: Record<string, any> = {};

            queryRecordEntry.properties.forEach(property => {
              dataToReturnDatum[property] = datum[property];
            });

            nodesDataToReturn.push(dataToReturnDatum);
          });

          dataForNewQueryKey = {
            nodes: nodesDataToReturn,
          };
        } else {
          queryRecordEntry.properties.forEach(property => {
            dataForNewQueryKey[property] = cachedDataForKey[property];
          });
        }
      }

      if (queryRecordEntry.relational !== undefined) {
        const relationalDataForNewQueryKey = this.getDataForQueryFromCache(
          queryRecordEntry.relational,
          contextKey
        );

        if (parentContextKey) {
          Object.entries(dataForNewQueryKey).forEach(
            ([parentId, dataUnderParentId]) => {
              let dataUnderParentForQueryKey = dataUnderParentId[newQueryKey];

              if ('nodes' in dataUnderParentForQueryKey) {
                dataUnderParentForQueryKey.nodes = dataUnderParentForQueryKey.nodes.map(
                  (datum: Record<string, any>) => {
                    if (datum.id in relationalDataForNewQueryKey) {
                      return {
                        ...datum,
                        ...relationalDataForNewQueryKey[datum.id],
                      };
                    } else {
                      return datum;
                    }
                  }
                );
              } else {
                dataForNewQueryKey[parentId][newQueryKey] = {
                  ...dataUnderParentId[newQueryKey],
                  ...relationalDataForNewQueryKey[
                    dataUnderParentForQueryKey.id
                  ],
                };
              }
            }
          );
        } else {
          if ('nodes' in dataForNewQueryKey) {
            dataForNewQueryKey.nodes = dataForNewQueryKey.nodes.map(
              (parentDatum: Record<string, any>) => {
                if (parentDatum.id in relationalDataForNewQueryKey) {
                  return {
                    ...parentDatum,
                    ...relationalDataForNewQueryKey[parentDatum.id],
                  };
                } else {
                  return parentDatum;
                }
              }
            );
          } else {
            dataForNewQueryKey = {
              ...dataForNewQueryKey,
              ...relationalDataForNewQueryKey[dataForNewQueryKey.id],
            };
          }
        }
      }

      if (parentContextKey) {
        Object.entries(dataForNewQueryKey).forEach(([parentKey, results]) => {
          if (queryDataToReturn[parentKey]) {
            queryDataToReturn[parentKey] = {
              ...queryDataToReturn[parentKey],
              ...results,
            };
          } else {
            queryDataToReturn[parentKey] = results;
          }
        });
      } else {
        queryDataToReturn[newQueryKey] = {
          ...dataForNewQueryKey,
        };
      }
    });

    return queryDataToReturn;
  }

  // public slimNewQueryAgainstInFlightQueries(
  //   newQuery: QueryRecord | RelationalQueryRecord
  // ) {
  //   const newQueryByContextMap = this.getQueryRecordsByContextMap(newQuery);
  //   const inFlightQueriesToSlimAgainst = this.getInFlightQueriesToSlimAgainst(
  //     newQueryByContextMap
  //   );

  //   if (inFlightQueriesToSlimAgainst === null) {
  //     return null;
  //   }

  //   const queryIdsSlimmedAgainst: string[] = [];
  //   let newQuerySlimmed = {};

  //   Object.keys(inFlightQueriesToSlimAgainst).forEach(
  //     inFlightQueryContextKey => {
  //       if (inFlightQueryContextKey in newQueryByContextMap) {
  //         let newQueryRecordPieceSlimmed:
  //           | QueryRecord
  //           | RelationalQueryRecord = {
  //           ...newQueryByContextMap[inFlightQueryContextKey],
  //         };

  //         inFlightQueriesToSlimAgainst[inFlightQueryContextKey].forEach(
  //           inFlightQueryRecord => {
  //             const slimmed = this.getSlimmedQueryAgainstInFlightQuery(
  //               newQueryRecordPieceSlimmed,
  //               inFlightQueryRecord.queryRecord,
  //               false
  //             );
  //             if (slimmed !== null) {
  //               queryIdsSlimmedAgainst.push(inFlightQueryRecord.queryId);
  //               newQueryRecordPieceSlimmed = slimmed;
  //             }
  //           }
  //         );

  //         newQuerySlimmed = {
  //           ...newQuerySlimmed,
  //           ...newQueryRecordPieceSlimmed,
  //         };
  //       }
  //     }
  //   );

  //   if (Object.keys(newQuerySlimmed).length === 0) {
  //     return null;
  //   } else {
  //     return {
  //       queryIdsSlimmedAgainst,
  //       slimmedQueryRecord: newQuerySlimmed,
  //     };
  //   }
  // }

  /**
   * Returns in flight QueryRecordEntries by context that can slim down a new query.
   * The new query should wait for an in flight query to slim against if:
   *   - At least one QueryRecordEntry ContextKey in the inFlightQuery matches the QueryRecordEntry ContextKey of the newQuery.
   *   - At least one property that is being requested by the new query is already being requested by the in flight query.
   *   - The matched in flight QueryRecordEntry (from above) is not requesting relational data deeper than the newQuery QueryRecordEntry.
   */
  // public getInFlightQueriesToSlimAgainst(newQuery: TQueryRecordByContextMap) {
  //   const inFlightQueriesToSlimAgainst: TInFlightQueriesByContextMap = {};
  //   const newQueryCtxtKeys = Object.keys(newQuery);

  //   newQueryCtxtKeys.forEach(newQueryCtxKey => {
  //     const queryRecordBaseKey = Object.keys(newQuery[newQueryCtxKey])[0];
  //     const newQueryRecordEntry = newQuery[newQueryCtxKey][queryRecordBaseKey];

  //     if (!newQueryRecordEntry) return;

  //     const newQueryRecordDepth = this.getRelationalDepthOfQueryRecordEntry(
  //       newQueryRecordEntry
  //     );

  //     if (newQueryCtxKey in this.inFlightQueryRecords) {
  //       const inFlightQueriesForCtxKey = this.inFlightQueryRecords[
  //         newQueryCtxKey
  //       ];

  //       inFlightQueriesForCtxKey.forEach(inFlightQueryRecord => {
  //         if (queryRecordBaseKey in inFlightQueryRecord.queryRecord) {
  //           const inFlightQueryRecordEntry =
  //             inFlightQueryRecord.queryRecord[queryRecordBaseKey];
  //           if (!inFlightQueryRecordEntry) return;

  //           const inFlightRecordHasSomePropsInNewQuery = inFlightQueryRecordEntry.properties.some(
  //             inFlightProp =>
  //               newQueryRecordEntry.properties.includes(inFlightProp)
  //           );

  //           if (inFlightRecordHasSomePropsInNewQuery) {
  //             const inFlightRecordEntryDepth = this.getRelationalDepthOfQueryRecordEntry(
  //               inFlightQueryRecordEntry
  //             );

  //             if (inFlightRecordEntryDepth <= newQueryRecordDepth) {
  //               if (newQueryCtxKey in inFlightQueriesToSlimAgainst) {
  //                 inFlightQueriesToSlimAgainst[newQueryCtxKey].push(
  //                   inFlightQueryRecord
  //                 );
  //               } else {
  //                 inFlightQueriesToSlimAgainst[newQueryCtxKey] = [
  //                   inFlightQueryRecord,
  //                 ];
  //               }
  //             }
  //           }
  //         }
  //       });
  //     }
  //   });

  //   return Object.keys(inFlightQueriesToSlimAgainst).length === 0
  //     ? null
  //     : inFlightQueriesToSlimAgainst;
  // }

  /**
   * Slims the new query against an in flight query.
   * This function assumes queries have already been matched by context.
   */
  // public getSlimmedQueryAgainstInFlightQuery(
  //   newQuery: QueryRecord | RelationalQueryRecord,
  //   inFlightQuery: QueryRecord | RelationalQueryRecord,
  //   isRelationalQueryRecord: boolean
  // ) {
  //   const slimmedQueryRecord: QueryRecord = {};
  //   const slimmedRelationalQueryRecord: RelationalQueryRecord = {};

  //   Object.keys(newQuery).forEach(newQueryKey => {
  //     const newQueryRecordEntry = newQuery[newQueryKey];
  //     if (!newQueryRecordEntry) return;
  //     const newRootRecordEntry = newQueryRecordEntry as QueryRecordEntry;
  //     const newRelationalRecordEntry = newQueryRecordEntry as RelationalQueryRecordEntry;

  //     if (inFlightQuery[newQueryKey] === undefined) {
  //       // If the inFlightQuery does not contain a record for the newQueryContextKey we need to keep that data as it needs to be fetched.
  //       if (isRelationalQueryRecord) {
  //         slimmedRelationalQueryRecord[newQueryKey] = newRelationalRecordEntry;
  //       } else {
  //         slimmedQueryRecord[newQueryKey] = newRootRecordEntry;
  //       }
  //     } else {
  //       // If a newQueryContextKey is present we want to slim what we can from the in flight query.
  //       const inFlightQueryRecordEntry = inFlightQuery[newQueryKey];
  //       if (!inFlightQueryRecordEntry) return;

  //       const newRequestedProperties = this.getPropertiesNotCurrentlyBeingRequested(
  //         {
  //           newQueryProps: newQueryRecordEntry.properties,
  //           inFlightProps: inFlightQueryRecordEntry.properties,
  //         }
  //       );

  //       // If there are no further child relational queries to deal with and there are properties being requested that are not cached
  //       // we can just return the new query with only the newly requested properties.
  //       if (
  //         newRequestedProperties !== null &&
  //         newQueryRecordEntry.relational === undefined
  //       ) {
  //         if (isRelationalQueryRecord) {
  //           slimmedRelationalQueryRecord[newQueryKey] = {
  //             ...newRelationalRecordEntry,
  //             properties: newRequestedProperties,
  //           };
  //         } else {
  //           slimmedQueryRecord[newQueryKey] = {
  //             ...newRootRecordEntry,
  //             properties: newRequestedProperties,
  //           };
  //         }
  //       }

  //       // If both queries contain relational queries we need to try slimming against those as well.
  //       // If there are child relational queries we still need to handle those even if the parent query is requesting properties that are already in flight.
  //       if (
  //         newQueryRecordEntry.relational !== undefined &&
  //         inFlightQueryRecordEntry.relational !== undefined
  //       ) {
  //         const slimmedNewRelationalQueryRecord = this.getSlimmedQueryAgainstInFlightQuery(
  //           newQueryRecordEntry.relational,
  //           inFlightQueryRecordEntry.relational,
  //           true
  //         );

  //         // If there are any properties being requested in the child relational query
  //         // we will still need to return the query record even if the parent is requesting properties that are already in flight.
  //         // In this scenario we return an empty array for the properties of the parent query while the child relational query is populated.
  //         if (slimmedNewRelationalQueryRecord !== null) {
  //           if (isRelationalQueryRecord) {
  //             slimmedRelationalQueryRecord[newQueryKey] = {
  //               ...newRelationalRecordEntry,
  //               properties: newRequestedProperties ?? [],
  //               relational: {
  //                 ...(slimmedNewRelationalQueryRecord as RelationalQueryRecord),
  //               },
  //             };
  //           } else {
  //             slimmedQueryRecord[newQueryKey] = {
  //               ...newRootRecordEntry,
  //               properties: newRequestedProperties ?? [],
  //               relational: {
  //                 ...(slimmedNewRelationalQueryRecord as RelationalQueryRecord),
  //               },
  //             };
  //           }
  //         }
  //       }
  //     }
  //   });

  //   const queryRecordToReturn = isRelationalQueryRecord
  //     ? slimmedRelationalQueryRecord
  //     : slimmedQueryRecord;

  //   return Object.keys(queryRecordToReturn).length === 0
  //     ? null
  //     : queryRecordToReturn;
  // }

  public onSubscriptionCancelled(
    queryRecord: QueryRecord | RelationalQueryRecord,
    parentContextKey?: string
  ) {
    Object.keys(queryRecord).forEach(queryRecordKey => {
      const queryRecordEntry = queryRecord[queryRecordKey];
      if (!queryRecordEntry) return;
      const currentQueryContextKey = this.createContextKeyForQueryRecordEntry(
        queryRecordEntry,
        parentContextKey
      );

      if (queryRecordEntry.relational !== undefined) {
        this.onSubscriptionCancelled(
          queryRecordEntry.relational,
          currentQueryContextKey
        );
      }

      if (currentQueryContextKey in this.queriesByContext) {
        const cachedQuerySubsByProperty = this.queriesByContext[
          currentQueryContextKey
        ].subscriptionsByProperty;

        queryRecordEntry.properties.forEach(property => {
          const propertySubCount = cachedQuerySubsByProperty[property];
          if (propertySubCount >= 1) {
            cachedQuerySubsByProperty[property] = propertySubCount - 1;
          }
        });
      }
    });
  }

  public getRelationalDepthOfQueryRecordEntry(
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry
  ) {
    let relationalDepth = 0;
    if (queryRecordEntry.relational !== undefined) {
      relationalDepth += 1;
      Object.values(queryRecordEntry.relational).forEach(relationalEntry => {
        relationalDepth += this.getRelationalDepthOfQueryRecordEntry(
          relationalEntry
        );
      });
    }
    return relationalDepth;
  }

  private createContextKeyForQueryRecordEntry(
    queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry,
    parentContextKey?: string
  ) {
    const doesQueryHaveIdProperty =
      'id' in queryRecordEntry && !!queryRecordEntry.id;

    const parentContextKeyPrefix = !!parentContextKey
      ? `${parentContextKey}.`
      : '';

    let currentQueryTypeProperty = '';

    if ((queryRecordEntry as any)['_relationshipName']) {
      currentQueryTypeProperty = (queryRecordEntry as any)['_relationshipName'];
    } else {
      currentQueryTypeProperty = `${queryRecordEntry.def.type}${
        doesQueryHaveIdProperty ? '' : 's'
      }`;
    }

    const currentQueryStringifiedParams = this.stringifyQueryParams(
      queryRecordEntry
    );

    return `${parentContextKeyPrefix}${currentQueryTypeProperty}(${currentQueryStringifiedParams})`;
  }

  private getPropertiesNotAlreadyCached(opts: {
    newQueryProps: string[];
    cachedQuerySubsByProperty: IFetchedQueryData['subscriptionsByProperty'];
  }) {
    const newRequestedProperties = opts.newQueryProps.filter(
      newQueryProperty => {
        if (newQueryProperty in opts.cachedQuerySubsByProperty) {
          return opts.cachedQuerySubsByProperty[newQueryProperty] === 0;
        }
        return true;
      }
    );
    return newRequestedProperties.length === 0 ? null : newRequestedProperties;
  }

  // private getPropertiesNotCurrentlyBeingRequested(opts: {
  //   newQueryProps: string[];
  //   inFlightProps: string[];
  // }) {
  //   const newRequestedProperties = opts.newQueryProps.filter(
  //     newQueryProperty => !opts.inFlightProps.includes(newQueryProperty)
  //   );
  //   return newRequestedProperties.length === 0 ? null : newRequestedProperties;
  // }

  private stringifyQueryParams(
    entry: QueryRecordEntry | RelationalQueryRecordEntry
  ) {
    // https://tractiontools.atlassian.net/browse/TTD-315
    // Handle filter/pagination/sorting query params
    const params = {
      ids: 'ids' in entry ? entry.ids : undefined,
      id: 'id' in entry ? entry.id : undefined,
    };
    if (!Object.values(params).some(value => value != null)) {
      return 'NO_PARAMS';
    }
    return JSON.stringify(params);
  }

  // private getQueryRecordsByContextMap(
  //   queryRecord: QueryRecord | RelationalQueryRecord
  // ) {
  //   return Object.keys(queryRecord).reduce(
  //     (queryRecordsByContext, queryRecordKey) => {
  //       const queryRecordEntry = queryRecord[queryRecordKey];
  //       if (!queryRecordEntry) return queryRecordsByContext;
  //       const contextKey = this.createContextKeyForQueryRecordEntry(
  //         queryRecordEntry
  //       );
  //       const queryRecordSlice = {
  //         [queryRecordKey]: queryRecordEntry,
  //       } as QueryRecord | RelationalQueryRecord;
  //       queryRecordsByContext[contextKey] = queryRecordSlice;
  //       return queryRecordsByContext;
  //     },
  //     {} as TQueryRecordByContextMap
  //   );
  // }

  private async sendQueryRequest(opts: {
    queryId: string;
    queryRecord: QueryRecord;
    tokenName: string;
    useServerSidePaginationFilteringSorting: boolean;
    batchKey?: string | undefined;
  }) {
    // const inFlightQuery: IInFlightQueryRecord = {
    //   queryId: opts.queryId,
    //   queryRecord: opts.queryRecord,
    // };
    const gqlDoc = getQueryGQLDocumentFromQueryRecord({
      queryId: opts.queryId,
      queryRecord: opts.queryRecord,
      useServerSidePaginationFilteringSorting:
        opts.useServerSidePaginationFilteringSorting,
    });

    if (!gqlDoc) return;

    const queryOpts: Parameters<IGQLClient['query']>[0] = {
      gql: gqlDoc,
      token: opts.tokenName,
    };

    if ('batchKey' in opts && opts.batchKey !== undefined) {
      queryOpts.batchKey = opts.batchKey;
    }

    try {
      // this.setInFlightQuery(inFlightQuery);
      const queryResponse = await this.mmGQLInstance.gqlClient.query(queryOpts);
      this.log(`[QuerySlimmer]: Query request response recieved`, {
        queryId: opts.queryId,
        queryRecord: opts.queryRecord,
        queryResponse: queryResponse,
      });
      // this.removeInFlightQuery(inFlightQuery);
      this.cacheNewData(opts.queryRecord, queryResponse);
    } catch (e) {
      // this.removeInFlightQuery(inFlightQuery);
      this.log(`QuerySlimmer: Error sending query request`, {
        queryId: opts.queryId,
        queryRecord: opts.queryRecord,
        error: e,
      });
      throw new Error(`[QuerySlimmer] sendQueryRequest error: ${e}`);
    }
  }

  // private setInFlightQuery(inFlightQueryRecord: IInFlightQueryRecord) {
  //   try {
  //     const queryRecordsByContext = this.getQueryRecordsByContextMap(
  //       inFlightQueryRecord.queryRecord
  //     );
  //     Object.keys(queryRecordsByContext).forEach(queryRecordContextKey => {
  //       if (queryRecordContextKey in this.inFlightQueryRecords) {
  //         this.inFlightQueryRecords[queryRecordContextKey].push(
  //           inFlightQueryRecord
  //         );
  //       } else {
  //         this.inFlightQueryRecords[queryRecordContextKey] = [
  //           inFlightQueryRecord,
  //         ];
  //       }
  //     });
  //   } catch (e) {
  //     throw new Error(`QuerySlimmer setInFlightQuery: ${e}`);
  //   }
  // }

  // private removeInFlightQuery(inFlightQueryToRemove: IInFlightQueryRecord) {
  //   try {
  //     const queryRecordsByContext = this.getQueryRecordsByContextMap(
  //       inFlightQueryToRemove.queryRecord
  //     );
  //     Object.keys(queryRecordsByContext).forEach(queryToRemoveCtxKey => {
  //       if (queryToRemoveCtxKey in this.inFlightQueryRecords) {
  //         this.inFlightQueryRecords[
  //           queryToRemoveCtxKey
  //         ] = this.inFlightQueryRecords[queryToRemoveCtxKey].filter(
  //           inFlightRecord =>
  //             inFlightRecord.queryId === inFlightQueryToRemove.queryId
  //         );
  //         if (this.inFlightQueryRecords[queryToRemoveCtxKey].length === 0) {
  //           delete this.inFlightQueryRecords[queryToRemoveCtxKey];
  //         }
  //       }
  //     });
  //   } catch (e) {
  //     throw new Error(`QuerySlimmer removeInFlightQuery: ${e}`);
  //   }
  // }

  // private areDependentQueriesStillInFlight(opts: {
  //   queryIds: string[];
  //   querySlimmedByInFlightQueries: QueryRecord;
  // }) {
  //   let isStillWaitingOnInFlightQueries = false;

  //   const queryRecordsByContext = this.getQueryRecordsByContextMap(
  //     opts.querySlimmedByInFlightQueries
  //   );

  //   Object.keys(queryRecordsByContext).forEach(ctxKey => {
  //     if (!isStillWaitingOnInFlightQueries) {
  //       if (ctxKey in this.inFlightQueryRecords) {
  //         const inFlightQueryHasDepedentId = this.inFlightQueryRecords[
  //           ctxKey
  //         ].some(inFlightQuery =>
  //           opts.queryIds.includes(inFlightQuery.queryId)
  //         );
  //         if (inFlightQueryHasDepedentId) {
  //           isStillWaitingOnInFlightQueries = true;
  //         }
  //       }
  //     }
  //   });

  //   return isStillWaitingOnInFlightQueries;
  // }

  // private stringify(obj: Record<string, any>) {
  //   return JSON.stringify(obj, undefined, 2);
  // }

  private log(message?: any, ...optionalParams: any[]) {
    if (this.mmGQLInstance.logging.querySlimming) {
      console.log(message, ...optionalParams);
    }
  }

  // private test1 = {
  //   byParentId: false,
  //   user: {
  //     id: 'ID',
  //     firstName: 'firstName',
  //   },
  // };

  // private test2 = {
  //   byParentId: false,
  //   user: {
  //     id: 'ID',
  //     lastName: 'lastName',
  //   },
  // };

  public mergeQueryResults(opts: {
    cachedResult: Record<string, any> | undefined;
    newResult: Record<string, any>;
  }) {
    if (opts.cachedResult == undefined) {
      return opts.newResult;
    }

    const mergedResult: Record<string, any> = { ...opts.cachedResult };

    Object.entries(opts.newResult).forEach(
      ([resultFieldKey, resultFieldValue]) => {
        if (resultFieldKey !== 'byParentId') {
          if ('nodes' in resultFieldValue) {
            const mergedNodes: Record<string, any> = [];

            resultFieldValue.nodes.forEach((datum: Record<string, any>) => {
              const result1NodeDatum = (mergedResult[resultFieldKey]
                .nodes as Record<string, any>[]).find(result1Datum => {
                return result1Datum.id === datum.id;
              });

              if (result1NodeDatum) {
                const mergedDatum: Record<string, any> = {
                  ...result1NodeDatum,
                };

                Object.entries(datum).forEach(([datumKey, datumValue]) => {
                  if (typeof datumValue === 'object') {
                    const childOpts = {
                      cachedResult: {
                        [datumKey]: mergedDatum[datumKey],
                      },
                      newResult: {
                        [datumKey]: datumValue,
                      },
                    };

                    const mergedDatums = this.mergeQueryResults(childOpts);

                    mergedDatum[datumKey] = mergedDatums[datumKey];
                  } else {
                    if (!(datumKey in mergedDatum)) {
                      mergedDatum[datumKey] = datumValue;
                    }
                  }
                });

                mergedNodes.push(mergedDatum);
              }
            });

            mergedResult[resultFieldKey]['nodes'] = mergedNodes;
          } else {
            Object.entries(resultFieldValue).forEach(
              ([valueKey, valueDatum]) => {
                if (typeof valueDatum === 'object') {
                  const childOpts = {
                    cachedResult: {
                      [valueKey]: mergedResult[resultFieldKey][valueKey],
                    },
                    newResult: {
                      [valueKey]: valueDatum,
                    },
                  };

                  const mergedDatums = this.mergeQueryResults(childOpts);

                  mergedResult[resultFieldKey][valueKey] =
                    mergedDatums[valueKey];
                } else {
                  if (!(valueKey in mergedResult[resultFieldKey])) {
                    mergedResult[resultFieldKey][valueKey] = valueDatum;
                  }
                }
              }
            );
          }
        }
      }
    );

    return mergedResult;
  }

  // function merge(obj1, obj2) {
  //   if (obj1 === null || obj2 === null) return obj1 || obj2;

  //   let result = { ...obj1 };

  //   for (let key in obj2) {
  //     if (obj2.hasOwnProperty(key)) {
  //       if (
  //         typeof obj2[key] === 'object' &&
  //         !Array.isArray(obj2[key]) &&
  //         obj1.hasOwnProperty(key) &&
  //         typeof obj1[key] === 'object'
  //       ) {
  //         if (key === 'nodes' && Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
  //           result[key] = obj1[key].map((node, index) => merge(node, obj2[key][index]));
  //         } else {
  //           result[key] = merge(obj1[key], obj2[key]);
  //         }
  //       } else {
  //         result[key] = obj2[key];
  //       }
  //     }
  //   }

  //   return result;
  // }
}
