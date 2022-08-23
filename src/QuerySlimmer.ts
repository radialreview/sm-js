import { observable } from 'mobx';

import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
  QueryDefinitions,
  QueryOpts,
  IMMGQL,
} from './types';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

export interface IQuerySlimmerConfig {
  enableLogging: boolean;
}

export interface IFetchedQueryData {
  subscriptionsByProperty: Record<string, number>;
  results: any | Array<any> | null;
}

export type TQueryDataByContextMap = Record<string, IFetchedQueryData>;

export type TInFlightQueriesByContextMap = Record<string, QueryRecord[]>;

export type TQueryRecordByContextMap = Record<string, QueryRecord>;

export class QuerySlimmer {
  constructor(mmGQLInstance: IMMGQL) {
    this.mmGQLInstance = mmGQLInstance;
  }

  private mmGQLInstance: IMMGQL;

  public queriesByContext: TQueryDataByContextMap = observable({});
  public inFlightQueryRecords: TInFlightQueriesByContextMap = {};

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
    tokenName: string;
    opts?: QueryOpts<TQueryDefinitions>;
  }) {
    const { queryRecord } = convertQueryDefinitionToQueryInfo(opts);
    const newQuerySlimmedByCache = this.getSlimmedQueryAgainstQueriesByContext(
      queryRecord
    );

    if (newQuerySlimmedByCache === null) {
      return this.getDataForQueryFromQueriesByContext(queryRecord);
    }

    const newQuerySlimmedByInFlightQueries = this.slimNewQueryAgainstInFlightQueries(
      newQuerySlimmedByCache as QueryRecord
    );

    if (newQuerySlimmedByInFlightQueries === null) {
      // If null, no slimming against in flight queries was done. We can send a request for this query as is.
    } else {
      // Send a request for the slimmed query.
      // Wait for this request and all dependent slimmed queries to resolve.
      // Once all requests are done we stich back the full query and return the data.
    }
  }

  public onResultsReceived(opts: {
    slimmedQuery: QueryRecord;
    originalQuery: QueryRecord;
    slimmedQueryResults: Record<string, any>;
    subscriptionEstablished: boolean;
  }) {
    this.populateQueriesByContext(opts.slimmedQuery, opts.slimmedQueryResults);
  }

  public getDataForQueryFromQueriesByContext(
    newQuery: QueryRecord | RelationalQueryRecord,
    parentContextKey?: string
  ) {
    const queryData: Record<string, any> = {};
    const newQueryKeys = Object.keys(newQuery);

    newQueryKeys.forEach(newQueryKey => {
      const queryRecordEntry = newQuery[newQueryKey];
      const contextKey = this.createContextKeyForQuery(
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
                inFlightQueryRecord,
                false
              );
              if (slimmed !== null) {
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

    return Object.keys(newQuerySlimmed).length === 0 ? null : newQuerySlimmed;
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
          if (queryRecordBaseKey in inFlightQueryRecord) {
            const inFlightQueryRecordEntry =
              inFlightQueryRecord[queryRecordBaseKey];
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
   * This function assumes both queries have already been matched by context.
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

      const newQueryContextKey = this.createContextKeyForQuery(
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

    const queryRecordToReturn =
      Object.keys(
        isNewQueryARootQuery ? slimmedQueryRecord : slimmedRelationalQueryRecord
      ).length > 0
        ? isNewQueryARootQuery
          ? slimmedQueryRecord
          : slimmedRelationalQueryRecord
        : null;

    if (isNewQueryARootQuery) {
      this.log({ originalQuery: newQuery, slimmedQuery: queryRecordToReturn });
    }

    return queryRecordToReturn;
  }

  public onSubscriptionCancelled(
    queryRecord: QueryRecord,
    parentContextKey?: string
  ) {
    Object.keys(queryRecord).forEach(queryRecordKey => {
      const queryRecordEntry = queryRecord[queryRecordKey];
      const currentQueryContextKey = this.createContextKeyForQuery(
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
      const currentQueryContextKey = this.createContextKeyForQuery(
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

  private createContextKeyForQuery(
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
        const contextKey = this.createContextKeyForQuery(queryRecordEntry);
        const queryRecordSlice: QueryRecord = {
          [queryRecordKey]: queryRecordEntry,
        };
        queryRecordsByContext[contextKey] = queryRecordSlice;
        return queryRecordsByContext;
      },
      {} as TQueryRecordByContextMap
    );
  }

  private log(opts: {
    originalQuery: QueryRecord | RelationalQueryRecord;
    slimmedQuery: QueryRecord | RelationalQueryRecord | null;
  }) {
    if (this.mmGQLInstance.enableQuerySlimmingLogging) {
      console.log(
        `QuerySlimmer`,
        `Received Query: ${JSON.stringify(opts.originalQuery)}`,
        `Slimmed Exectued Query: ${JSON.stringify(opts.slimmedQuery)}`
      );
    }
  }
}
