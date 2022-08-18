import { observable } from 'mobx';

import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
  QueryDefinitions,
  QueryOpts,
} from './types';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

export interface IQuerySlimmerConfig {
  enableLogging: boolean;
}

export interface IFetchedQueryData {
  subscriptionsByProperty: Record<string, number>;
  results: any | Array<any> | null;
}

export type IQueryDataByContextMap = Record<string, IFetchedQueryData>;

export type IQueryRecordEntriesByContextMap = Record<string, QueryRecordEntry>;

export class QuerySlimmer {
  constructor(config: IQuerySlimmerConfig) {
    this.loggingEnabled = config.enableLogging;
  }

  private loggingEnabled: boolean;

  public queriesByContext: IQueryDataByContextMap = observable({});
  public inFlightQueryRecords: Array<QueryRecord> = [];

  // Slim given query before it gets sents to the BE:
  //   1: First slim the new query against the cache.
  //      A: If the query is fully cached we return that data with a call to gqlClient.query.
  //   2: If a query is not fully cached, attempt to slim the query against a similar query already sent out to the BE.
  //      A: If an in flight query completely matches the new query, wait for that data to come back and call gqlClient.query with the data. (BEST CASE)
  //      B: If an in flight query partially matches the new query:
  //         1: If the in flight query has a lower or same relational depth, we send out the new query with only fields not already being requested. (REGULAR CASE)
  //              - When in flight query finishes we immediately populate populateQueriesByContext.
  //              - When new query data comes back, populate populateQueriesByContext with new query data and return it with data needed from the in flight query.
  //         2: If the in flight query gas a higher relational depth than the newer query, just send out the new query (WORST CASE)
  //              - When new query data comes back, populate populateQueriesByContext with new query data and return it.
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
    const slimmedQueryRecord = this.getSlimmedQueryAgainstQueriesByContext(
      queryRecord
    );

    if (slimmedQueryRecord === null) {
      // If the slimmedQueryRecord is null then all the data being requested is cached and we can return those results.
      console.log('PIOTR TODO');
    }

    // Attempt to slim against in flight queries
    return null;
  }

  // public getSlimmedQueryAgainstInFlightQueries(newQuery: QueryRecord) {
  //   const slimmedQueryRecord: QueryRecord = {};

  //   // We want to slim against an in flight query IF:
  //   // At least one context key matches

  //   Object.keys(newQuery).forEach(newQueryKey => {
  //     const newQueryRecordEntry = newQuery[newQueryKey];
  //     const newQueryContextKey = this.createContextKeyForQuery(
  //       newQueryRecordEntry
  //     );

  //     this.inFlightQueriesByContext.forEach(inFlightQueriesByContextKey => {
  //       if (inFlightQueriesByContextKey[newQueryContextKey]) {
  //         // If an in flight query is matched by context key we can try slimming the query
  //         const inFlightQuery = inFlightQueriesByContextKey[newQueryContextKey];
  //       }
  //     });
  //   });
  // }

  /**
   * Returns a partial QueryRecord by context map of the given inFlightQuery containing entries that we are able to slim the new query against.
   * The new query should wait for an in flight query to slim against if:
   *   - At least one QueryRecordEntry ContextKey in the inFlightQuery matches the QueryRecordEntry ContextKey of the newQuery.
   *   - The matched in flight QueryRecordEntry (from above) is not requesting relational data deeper than the newQuery QueryRecordEntry.
   */
  public getInFlightQueriesToSlimAgainst(
    newQuery: IQueryRecordEntriesByContextMap
  ) {
    const inFlightQueriesToSlimAgainst: Array<IQueryRecordEntriesByContextMap> = [];
    const newQueryCtxtKeys = Object.keys(newQuery);

    this.inFlightQueryRecords.forEach(inFlightRecord => {
      const inFlightQueryContextMap = this.getQueryRecordEntriesByContextMap(
        inFlightRecord
      );
      const inFlightQueryCtxKeys = Object.keys(inFlightQueryContextMap);
      const matchedCtxKeys = inFlightQueryCtxKeys.filter(inFlightCtxKey =>
        newQueryCtxtKeys.includes(inFlightCtxKey)
      );

      if (matchedCtxKeys.length !== 0) {
        const partialOfInFlightQueryWeCanSlimAgainst = matchedCtxKeys.reduce(
          (recordToSlimAgainst, matchedCtxKey) => {
            const newRecordEntry = newQuery[matchedCtxKey];
            const inFlightRecordEntry = inFlightQueryContextMap[matchedCtxKey];
            const newRecordDepth = this.getRelationalDepthOfQueryRecordEntry(
              newRecordEntry
            );
            const inFlightRecordDepth = this.getRelationalDepthOfQueryRecordEntry(
              inFlightRecordEntry
            );

            if (inFlightRecordDepth <= newRecordDepth) {
              recordToSlimAgainst[matchedCtxKey] = inFlightRecordEntry;
            }

            return recordToSlimAgainst;
          },
          {} as IQueryRecordEntriesByContextMap
        );

        if (Object.keys(partialOfInFlightQueryWeCanSlimAgainst).length !== 0) {
          inFlightQueriesToSlimAgainst.push(
            partialOfInFlightQueryWeCanSlimAgainst
          );
        }
      }
    });

    return Object.keys(inFlightQueriesToSlimAgainst).length === 0
      ? null
      : inFlightQueriesToSlimAgainst;
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

  // private slimNewQueryAgainstExistingQuery(
  //   newQuery: QueryRecord | RelationalQueryRecord,
  //   existingQuery: QueryRecord | RelationalQueryRecord,
  //   parentContextKey?: string
  // ) {
  //   if (parentContextKey === undefined) {
  //     const slimmedQueryRecord: QueryRecord = {};

  //     Object.keys(newQuery).forEach(newQueryKey => {
  //       if (existingQuery[newQueryKey] !== undefined) {
  //         const newQueryRecordEntry = newQuery[newQueryKey];
  //         const inFlightQueryRecordEntry = existingQuery[newQueryKey];

  //         const slimmedProperties = this.getPropertiesNotAlreadyCached({
  //           newQueryProps: newQueryRecordEntry.properties,
  //           cachedQueryProps: inFlightQueryRecordEntry.properties,
  //         });

  //         if (bothEntriesHaveRelationalQueries) {
  //         } else {
  //         }

  //         slimmedQueryRecord[newQueryKey] = {
  //           ...newQueryRecordEntry,
  //           properties: slimmedProperties ?? newQueryRecordEntry.properties,
  //           relational,
  //         };

  //         slimmedQueryRecord[newQueryKey] = {
  //           ...newQuery[newQueryKey],
  //           properties: this.getPropertiesNotAlreadyCached({
  //             newQueryProps: newQuery[newQueryKey].properties,
  //             cachedQueryProps: existingQuery[newQueryKey].properties,
  //           }),
  //         };
  //         slimmedQueryRecord[
  //           newQueryKey
  //         ].properties = getPropertiesNotAlreadyCached();
  //       }
  //       const newQueryRecordEntry = newQuery[newQueryKey];
  //       const newRootRecordEntry = newQueryRecordEntry as QueryRecordEntry;
  //       const newRelationalRecordEntry = newQueryRecordEntry as RelationalQueryRecordEntry;
  //       const newQueryContextKey = this.createContextKeyForQuery(
  //         newQueryRecordEntry
  //       );

  //       // if (existingQuery[newQueryContextKey] === undefined) {

  //       // }
  //     });
  //   }

  //   const slimmedRelationalQueryRecord: RelationalQueryRecord = {};

  //   Object.keys(newQuery).forEach(newQueryKey => {
  //     const newQueryRecordEntry = newQuery[newQueryKey];
  //     const newRootRecordEntry = newQueryRecordEntry as QueryRecordEntry;
  //     const newRelationalRecordEntry = newQueryRecordEntry as RelationalQueryRecordEntry;
  //     const newQueryContextKey = this.createContextKeyForQuery(
  //       newQueryRecordEntry
  //     );

  //     // if (existingQuery[newQueryContextKey] === undefined) {

  //     // }
  //   });
  // }

  public onResultsReceived(opts: {
    slimmedQuery: QueryRecord;
    originalQuery: QueryRecord;
    slimmedQueryResults: Record<string, any>;
    subscriptionEstablished: boolean;
  }) {
    this.populateQueriesByContext(opts.slimmedQuery, opts.slimmedQueryResults);
  }

  // TODO PIOTR: CHECK SUB COUNTS WHEN LOOKING AT CACHED PROPERTIES
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
          cachedQueryProps: Object.keys(cachedQuery.subscriptionsByProperty),
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
    cachedQueryProps: string[];
  }) {
    const newRequestedProperties = opts.newQueryProps.filter(
      newQueryProperty => !opts.cachedQueryProps.includes(newQueryProperty)
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

  private getQueryRecordEntriesByContextMap(queryRecord: QueryRecord) {
    return Object.values(queryRecord).reduce(
      (entriesByContext, queryRecordEntry) => {
        const contextKey = this.createContextKeyForQuery(queryRecordEntry);
        entriesByContext[contextKey] = queryRecordEntry;
        return entriesByContext;
      },
      {} as IQueryRecordEntriesByContextMap
    );
  }

  private log(opts: {
    originalQuery: QueryRecord | RelationalQueryRecord;
    slimmedQuery: QueryRecord | RelationalQueryRecord | null;
  }) {
    if (this.loggingEnabled) {
      console.log(
        `QuerySlimmer`,
        `Received Query: ${JSON.stringify(opts.originalQuery)}`,
        `Slimmed Exectued Query: ${JSON.stringify(opts.slimmedQuery)}`
      );
    }
  }
}
