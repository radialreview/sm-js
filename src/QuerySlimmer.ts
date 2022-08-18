import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
} from './types';

export interface IQuerySlimmerConfig {
  enableLogging: boolean;
}

export interface IFetchedQueryData {
  subscriptionsByProperty: Record<string, number>;
  results: any | Array<any> | null;
}

export type IQueryDataByContextMap = Record<string, IFetchedQueryData>;

/*
// Capture results from a slimmedQuery (returned form onQueryExecuted).
// Stitch this together with the results from slimmedQueryResults.
// Get originalQuery results from cache (the ones that matched).
// Update queriesByContext with all data from both queries.
// Increment number of active subscriptions at each property of the original query if subscriptionsEstablished is true.
*/
export class QuerySlimmer {
  constructor(config: IQuerySlimmerConfig) {
    this.loggingEnabled = config.enableLogging;
  }

  private loggingEnabled: boolean;

  public queriesByContext: IQueryDataByContextMap = {};

  public onResultsReceived(opts: {
    slimmedQuery: QueryRecord;
    originalQuery: QueryRecord;
    slimmedQueryResults: Record<string, any>;
    subscriptionEstablished: boolean;
  }) {
    this.populateQueriesByContext(opts.slimmedQuery, opts.slimmedQueryResults);
  }

  // TODO PIOTR: CHECK SUB COUNTS WHEN LOOKING AT CACHED PROPERTIES
  public onNewQueryReceived(
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
          const slimmedNewRelationalQueryRecord = this.onNewQueryReceived(
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
}
