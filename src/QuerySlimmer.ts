import { gql } from '@apollo/client/core';
import { observable, when } from 'mobx';

import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
  QueryDefinitions,
  QueryOpts,
  IMMGQL,
  IGQLClient,
} from './types';
import {
  convertQueryDefinitionToQueryInfo,
  getQueryGQLStringFromQueryRecord,
} from './queryDefinitionAdapters';

export interface IFetchedQueryData {
  subscriptionsByProperty: Record<string, number>;
  results: any | Array<any> | null;
}

export interface IInFlightQueryRecord {
  queryId: string;
  queryRecord: QueryRecord;
}

export type TQueryDataByContextMap = Record<string, IFetchedQueryData>;

export type TInFlightQueriesByContextMap = Record<
  string,
  IInFlightQueryRecord[]
>;

export type TQueryRecordByContextMap = Record<string, QueryRecord>;

export class QuerySlimmer {
  constructor(mmGQLInstance: IMMGQL) {
    this.mmGQLInstance = mmGQLInstance;
  }

  private mmGQLInstance: IMMGQL;

  public queriesByContext: TQueryDataByContextMap = {};
  public inFlightQueryRecords: TInFlightQueriesByContextMap = observable({});

  public async query<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TNode,
      TMapFn,
      TQueryDefinitionTarget
    >
  >(opts: {
    queryId: string;
    queryDefinitions: TQueryDefinitions;
    queryOpts?: QueryOpts<TQueryDefinitions>;
    tokenName: string;
  }) {
    const { queryRecord } = convertQueryDefinitionToQueryInfo(opts);
    const newQuerySlimmedByCache = this.getSlimmedQueryAgainstQueriesByContext(
      queryRecord
    );

    if (newQuerySlimmedByCache === null) {
      const data = this.getDataForQueryFromQueriesByContext(queryRecord);
      this.log(
        `QUERYSLIMMER: NEW QUERY FULLY CACHED`,
        `ORIGINAL QUERY: ${JSON.stringify(queryRecord)}`,
        `CACHE: ${JSON.stringify(this.queriesByContext)}`,
        `DATA RETURNED: ${JSON.stringify(data)}`
      );
      return data;
    }

    const newQuerySlimmedByInFlightQueries = this.slimNewQueryAgainstInFlightQueries(
      newQuerySlimmedByCache
    );

    // TODO PIOTR ADD:
    // TIMEOUTS
    // ERROR HANDLING (SEND ORIGINAL REQUEST)
    if (newQuerySlimmedByInFlightQueries === null) {
      await this.sendQueryRequest({
        queryId: opts.queryId,
        queryRecord: newQuerySlimmedByCache,
        tokenName: opts.tokenName,
        batchKey: opts.queryOpts?.batchKey,
      });
      const data = this.getDataForQueryFromQueriesByContext(queryRecord);
      this.log(
        `QUERYSLIMMER: NEW QUERY SLIMMED BY CACHE`,
        `ORIGINAL QUERY: ${JSON.stringify(queryRecord)}`,
        `SLIMMED QUERY: ${JSON.stringify(newQuerySlimmedByCache)}`,
        `CACHE: ${JSON.stringify(this.queriesByContext)}`,
        `DATA RETURNED: ${JSON.stringify(data)}`
      );
      return data;
    } else {
      this.log(
        `QUERYSLIMMER: AWAITING IN-FLIGHT QUERIES SLIMMED AGAINST`,
        `ORIGINAL QUERY: ${JSON.stringify(queryRecord)}`,
        `IN-FLIGHT QUERIES: ${JSON.stringify(this.inFlightQueryRecords)}`,
        `CACHE: ${JSON.stringify(this.queriesByContext)}`
      );
      await this.sendQueryRequest({
        queryId: opts.queryId,
        queryRecord: newQuerySlimmedByInFlightQueries.slimmedQueryRecord,
        tokenName: opts.tokenName,
        batchKey: opts.queryOpts?.batchKey,
      });

      // PIOTR TODO: THIS RETURNS A PROMISE THAT CAN BE CANCELLED. CANCEL IT WHEN DOING ERROR/TIMEOUT HANDLING.
      await when(
        () =>
          !this.areDependentQueriesStillInFlight({
            queryIds: newQuerySlimmedByInFlightQueries.queryIdsSlimmedAgainst,
            querySlimmedByInFlightQueries:
              newQuerySlimmedByInFlightQueries.slimmedQueryRecord,
          })
      );

      const data = this.getDataForQueryFromQueriesByContext(queryRecord);
      this.log(
        `QUERYSLIMMER: NEW QUERY SLIMMED BY CACHE AND IN-FLIGHT QUERIES`,
        `ORIGINAL QUERY: ${JSON.stringify(queryRecord)}`,
        `SLIMMED QUERY: ${JSON.stringify(
          newQuerySlimmedByInFlightQueries.slimmedQueryRecord
        )}`,
        `CACHE: ${JSON.stringify(this.queriesByContext)}`,
        `DATA RETURNED: ${JSON.stringify(data)}`
      );
      return data;
    }
  }

  public getDataForQueryFromQueriesByContext(
    newQuery: QueryRecord | RelationalQueryRecord,
    parentContextKey?: string
  ) {
    const queryData: Record<string, any> = {};
    const newQueryKeys = Object.keys(newQuery);

    newQueryKeys.forEach(newQueryKey => {
      const queryRecordEntry = newQuery[newQueryKey];
      const contextKey = this.createContextKeyForQueryRecordEntry(
        queryRecordEntry,
        parentContextKey
      );
      const cachedQueryData = this.queriesByContext[contextKey];
      const newQueryData: Record<string, any | Array<any> | null> = {};
      let newQueryRelationalData: Record<string, any | Array<any> | null> = {};

      queryRecordEntry.properties.forEach(property => {
        newQueryData[property] = { nodes: cachedQueryData.results[property] };
      });

      if (queryRecordEntry.relational !== undefined) {
        newQueryRelationalData = this.getDataForQueryFromQueriesByContext(
          queryRecordEntry.relational,
          contextKey
        );
      }

      queryData[newQueryKey] = {
        ...newQueryData,
        ...newQueryRelationalData,
      };
    });

    return queryData;
  }

  public slimNewQueryAgainstInFlightQueries(newQuery: QueryRecord) {
    const newQueryByContextMap = this.getQueryRecordsByContextMap(newQuery);
    const inFlightQueriesToSlimAgainst = this.getInFlightQueriesToSlimAgainst(
      newQueryByContextMap
    );

    if (inFlightQueriesToSlimAgainst === null) {
      return null;
    }

    const queryIdsSlimmedAgainst: string[] = [];
    let newQuerySlimmed: QueryRecord = {};

    Object.keys(inFlightQueriesToSlimAgainst).forEach(
      inFlightQueryContextKey => {
        if (inFlightQueryContextKey in newQueryByContextMap) {
          let newQueryRecordPieceSlimmed: QueryRecord = {
            ...newQueryByContextMap[inFlightQueryContextKey],
          };

          inFlightQueriesToSlimAgainst[inFlightQueryContextKey].forEach(
            inFlightQueryRecord => {
              const slimmed = this.getSlimmedQueryAgainstInFlightQuery(
                newQueryRecordPieceSlimmed,
                inFlightQueryRecord.queryRecord,
                false
              );
              if (slimmed !== null) {
                queryIdsSlimmedAgainst.push(inFlightQueryRecord.queryId);
                newQueryRecordPieceSlimmed = slimmed;
              }
            }
          );

          newQuerySlimmed = {
            ...newQuerySlimmed,
            ...newQueryRecordPieceSlimmed,
          };
        }
      }
    );

    if (Object.keys(newQuerySlimmed).length === 0) {
      return null;
    } else {
      return {
        queryIdsSlimmedAgainst,
        slimmedQueryRecord: newQuerySlimmed,
      };
    }
  }

  /**
   * Returns in flight QueryRecordEntries by context that can slim down a new query.
   * The new query should wait for an in flight query to slim against if:
   *   - At least one QueryRecordEntry ContextKey in the inFlightQuery matches the QueryRecordEntry ContextKey of the newQuery.
   *   - At least one property that is being requested by the new query is already being requested by the in flight query.
   *   - The matched in flight QueryRecordEntry (from above) is not requesting relational data deeper than the newQuery QueryRecordEntry.
   */
  public getInFlightQueriesToSlimAgainst(newQuery: TQueryRecordByContextMap) {
    const inFlightQueriesToSlimAgainst: TInFlightQueriesByContextMap = {};
    const newQueryCtxtKeys = Object.keys(newQuery);

    newQueryCtxtKeys.forEach(newQueryCtxKey => {
      const queryRecordBaseKey = Object.keys(newQuery[newQueryCtxKey])[0];
      const newQueryRecordEntry = newQuery[newQueryCtxKey][queryRecordBaseKey];
      const newQueryRecordDepth = this.getRelationalDepthOfQueryRecordEntry(
        newQueryRecordEntry
      );

      if (newQueryCtxKey in this.inFlightQueryRecords) {
        const inFlightQueriesForCtxKey = this.inFlightQueryRecords[
          newQueryCtxKey
        ];

        inFlightQueriesForCtxKey.forEach(inFlightQueryRecord => {
          if (queryRecordBaseKey in inFlightQueryRecord.queryRecord) {
            const inFlightQueryRecordEntry =
              inFlightQueryRecord.queryRecord[queryRecordBaseKey];
            const inFlightRecordHasSomePropsInNewQuery = inFlightQueryRecordEntry.properties.some(
              inFlightProp =>
                newQueryRecordEntry.properties.includes(inFlightProp)
            );

            if (inFlightRecordHasSomePropsInNewQuery) {
              const inFlightRecordEntryDepth = this.getRelationalDepthOfQueryRecordEntry(
                inFlightQueryRecordEntry
              );

              if (inFlightRecordEntryDepth <= newQueryRecordDepth) {
                if (newQueryCtxKey in inFlightQueriesToSlimAgainst) {
                  inFlightQueriesToSlimAgainst[newQueryCtxKey].push(
                    inFlightQueryRecord
                  );
                } else {
                  inFlightQueriesToSlimAgainst[newQueryCtxKey] = [
                    inFlightQueryRecord,
                  ];
                }
              }
            }
          }
        });
      }
    });

    return Object.keys(inFlightQueriesToSlimAgainst).length === 0
      ? null
      : inFlightQueriesToSlimAgainst;
  }

  /**
   * Slims the new query against an in flight query.
   * This function assumes queries have already been matched by context.
   */
  public getSlimmedQueryAgainstInFlightQuery(
    newQuery: QueryRecord | RelationalQueryRecord,
    inFlightQuery: QueryRecord | RelationalQueryRecord,
    isRelationalQueryRecord: boolean
  ) {
    const slimmedQueryRecord: QueryRecord = {};
    const slimmedRelationalQueryRecord: RelationalQueryRecord = {};

    Object.keys(newQuery).forEach(newQueryKey => {
      const newQueryRecordEntry = newQuery[newQueryKey];
      const newRootRecordEntry = newQueryRecordEntry as QueryRecordEntry;
      const newRelationalRecordEntry = newQueryRecordEntry as RelationalQueryRecordEntry;

      if (newQueryKey in inFlightQuery) {
        // If the inFlightQuery does not contain a record for the newQueryContextKey we need to keep that data as it needs to be fetched.
        if (isRelationalQueryRecord) {
          slimmedQueryRecord[newQueryKey] = newRootRecordEntry;
        } else {
          slimmedRelationalQueryRecord[newQueryKey] = newRelationalRecordEntry;
        }
      } else {
        // If a newQueryContextKey is present we want to slim what we can from the in flight query.
        const inFlightQueryRecordEntry = inFlightQuery[newQueryKey];
        const newRequestedProperties = this.getPropertiesNotCurrentlyBeingRequested(
          {
            newQueryProps: newQueryRecordEntry.properties,
            inFlightProps: inFlightQueryRecordEntry.properties,
          }
        );

        // If there are no further child relational queries to deal with and there are properties being requested that are not cached
        // we can just return the new query with only the newly requested properties.
        if (
          newRequestedProperties !== null &&
          newQueryRecordEntry.relational === undefined
        ) {
          if (isRelationalQueryRecord) {
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

        // If both queries contain relational queries we need to try slimming against those as well.
        // If there are child relational queries we still need to handle those even if the parent query is requesting properties that are already in flight.
        if (
          newQueryRecordEntry.relational !== undefined &&
          inFlightQueryRecordEntry.relational !== undefined
        ) {
          const slimmedNewRelationalQueryRecord = this.getSlimmedQueryAgainstInFlightQuery(
            newQueryRecordEntry.relational,
            inFlightQueryRecordEntry.relational,
            true
          );

          // If there are any properties being requested in the child relational query
          // we will still need to return the query record even if the parent is requesting properties that are already in flight.
          // In this scenario we return an empty array for the properties of the parent query while the child relational query is populated.
          if (slimmedNewRelationalQueryRecord !== null) {
            if (isRelationalQueryRecord) {
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

    const queryRecordToReturn =
      Object.keys(
        isRelationalQueryRecord
          ? slimmedQueryRecord
          : slimmedRelationalQueryRecord
      ).length > 0
        ? isRelationalQueryRecord
          ? slimmedQueryRecord
          : slimmedRelationalQueryRecord
        : null;

    return queryRecordToReturn;
  }

  public getSlimmedQueryAgainstQueriesByContext(
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
          const slimmedNewRelationalQueryRecord = this.getSlimmedQueryAgainstQueriesByContext(
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

    if (isNewQueryARootQuery) {
      return Object.keys(slimmedQueryRecord).length === 0
        ? null
        : slimmedQueryRecord;
    } else {
      return Object.keys(slimmedRelationalQueryRecord).length === 0
        ? null
        : slimmedRelationalQueryRecord;
    }
  }

  // TODO PIOTR: WHEN TO CALL THIS?
  public onSubscriptionCancelled(
    queryRecord: QueryRecord,
    parentContextKey?: string
  ) {
    Object.keys(queryRecord).forEach(queryRecordKey => {
      const queryRecordEntry = queryRecord[queryRecordKey];
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

        const doesRecordStillHaveSubscriptions = Object.values(
          cachedQuerySubsByProperty
        ).some(numberOfSubs => numberOfSubs !== 0);

        if (!doesRecordStillHaveSubscriptions) {
          delete this.queriesByContext[currentQueryContextKey];
        }
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

  private populateQueriesByContext(
    queryRecord: QueryRecord,
    results: Record<string, any>,
    parentContextKey?: string
  ) {
    Object.keys(queryRecord).forEach(alias => {
      const queryRecordEntry = queryRecord[alias];
      const currentQueryContextKey = this.createContextKeyForQueryRecordEntry(
        queryRecordEntry,
        parentContextKey
      );

      this.queriesByContext[currentQueryContextKey] = {
        subscriptionsByProperty: queryRecordEntry.properties.reduce(
          (previous: Record<string, number>, current: string) => {
            previous[current] = previous[current] ? previous[current] + 1 : 1;
            return previous;
          },
          this.queriesByContext[currentQueryContextKey]
            ?.subscriptionsByProperty || {}
        ),
        results: results[alias],
      };

      if (queryRecordEntry.relational) {
        const resultsForRelationalQueries = Object.keys(
          queryRecordEntry.relational
        ).reduce((previous: Record<string, any>, current: string) => {
          // do array vs object check here before map in case there's only a single id
          previous[current] = results[alias].map((user: any) => user[current]);
          return previous;
        }, {});

        this.populateQueriesByContext(
          queryRecordEntry.relational,
          resultsForRelationalQueries,
          currentQueryContextKey
        );
      }
    });
  }

  private createContextKeyForQueryRecordEntry(
    queryRecordEntry: QueryRecordEntry,
    parentContextKey?: string
  ) {
    const doesQueryHaveIdProperty = !!queryRecordEntry.id;
    const parentContextKeyPrefix = !!parentContextKey
      ? `${parentContextKey}.`
      : '';
    const currentQueryTypeProperty = `${queryRecordEntry.def.type}${
      doesQueryHaveIdProperty ? '' : 's'
    }`;
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
      newQueryProperty =>
        newQueryProperty in opts.cachedQuerySubsByProperty &&
        opts.cachedQuerySubsByProperty[newQueryProperty] !== 0
    );
    return newRequestedProperties.length === 0 ? null : newRequestedProperties;
  }

  private getPropertiesNotCurrentlyBeingRequested(opts: {
    newQueryProps: string[];
    inFlightProps: string[];
  }) {
    const newRequestedProperties = opts.newQueryProps.filter(
      newQueryProperty => !opts.inFlightProps.includes(newQueryProperty)
    );
    return newRequestedProperties.length === 0 ? null : newRequestedProperties;
  }

  private stringifyQueryParams(entry: QueryRecordEntry) {
    // https://tractiontools.atlassian.net/browse/TTD-315
    // Handle filter/pagination/sorting query params
    const params = { ids: entry.ids, id: entry.id };
    if (!Object.values(params).some(value => value != null)) {
      return 'NO_PARAMS';
    }
    return JSON.stringify(params);
  }

  private getQueryRecordsByContextMap(queryRecord: QueryRecord) {
    return Object.keys(queryRecord).reduce(
      (queryRecordsByContext, queryRecordKey) => {
        const queryRecordEntry = queryRecord[queryRecordKey];
        const contextKey = this.createContextKeyForQueryRecordEntry(
          queryRecordEntry
        );
        const queryRecordSlice: QueryRecord = {
          [queryRecordKey]: queryRecordEntry,
        };
        queryRecordsByContext[contextKey] = queryRecordSlice;
        return queryRecordsByContext;
      },
      {} as TQueryRecordByContextMap
    );
  }

  private async sendQueryRequest(opts: {
    queryId: string;
    queryRecord: QueryRecord;
    tokenName: string;
    batchKey?: string | undefined;
  }) {
    const inFlightQuery: IInFlightQueryRecord = {
      queryId: opts.queryId,
      queryRecord: opts.queryRecord,
    };
    const queryGQLString = getQueryGQLStringFromQueryRecord({
      queryId: opts.queryId,
      queryRecord: opts.queryRecord,
    });
    const queryOpts: Parameters<IGQLClient['query']>[0] = {
      gql: gql(queryGQLString),
      token: opts.tokenName,
    };

    if ('batchKey' in opts && opts.batchKey !== undefined) {
      queryOpts.batchKey = opts.batchKey;
    }

    try {
      this.setInFlightQuery(inFlightQuery);
      const results = await this.mmGQLInstance.gqlClient.query(queryOpts);
      this.removeInFlightQuery(inFlightQuery);
      this.populateQueriesByContext(opts.queryRecord, results);
    } catch (e) {
      // TODO PIOTR: LOGGING && ERROR HANDLING
      this.removeInFlightQuery(inFlightQuery);
    }
  }

  private setInFlightQuery(inFlightQueryRecord: IInFlightQueryRecord) {
    const queryRecordsByContext = this.getQueryRecordsByContextMap(
      inFlightQueryRecord.queryRecord
    );
    Object.keys(queryRecordsByContext).forEach(queryRecordContextKey => {
      if (queryRecordContextKey in this.inFlightQueryRecords) {
        this.inFlightQueryRecords[queryRecordContextKey].push(
          inFlightQueryRecord
        );
      } else {
        this.inFlightQueryRecords[queryRecordContextKey] = [
          inFlightQueryRecord,
        ];
      }
    });
  }

  private removeInFlightQuery(inFlightQueryToRemove: IInFlightQueryRecord) {
    const queryRecordsByContext = this.getQueryRecordsByContextMap(
      inFlightQueryToRemove.queryRecord
    );
    Object.keys(queryRecordsByContext).forEach(queryToRemoveCtxKey => {
      if (queryToRemoveCtxKey in this.inFlightQueryRecords) {
        this.inFlightQueryRecords[
          queryToRemoveCtxKey
        ] = this.inFlightQueryRecords[queryToRemoveCtxKey].filter(
          inFlightRecord =>
            inFlightRecord.queryId === inFlightQueryToRemove.queryId
        );
        if (this.inFlightQueryRecords[queryToRemoveCtxKey].length === 0) {
          delete this.inFlightQueryRecords[queryToRemoveCtxKey];
        }
      }
    });
  }

  private areDependentQueriesStillInFlight(opts: {
    queryIds: string[];
    querySlimmedByInFlightQueries: QueryRecord;
  }) {
    let isStillWaitingOnInFlightQueries = false;

    const queryRecordsByContext = this.getQueryRecordsByContextMap(
      opts.querySlimmedByInFlightQueries
    );

    Object.keys(queryRecordsByContext).forEach(ctxKey => {
      if (!isStillWaitingOnInFlightQueries) {
        if (ctxKey in this.inFlightQueryRecords) {
          const inFlightQueryHasDepedentId = this.inFlightQueryRecords[
            ctxKey
          ].some(inFlightQuery =>
            opts.queryIds.includes(inFlightQuery.queryId)
          );
          if (inFlightQueryHasDepedentId) {
            isStillWaitingOnInFlightQueries = true;
          }
        }
      }
    });

    return isStillWaitingOnInFlightQueries;
  }

  private log(message?: any, ...optionalParams: any[]) {
    if (this.mmGQLInstance.enableQuerySlimmingLogging) {
      console.log(message, ...optionalParams);
    }
  }
}
