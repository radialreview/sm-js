import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
} from './types';

export interface IFetchedQueryData {
  subscriptionsByProperty: Record<string, number>;
  results: Object | Array<Object> | null;
}

export type IQueryDataByContextMap = Record<string, IFetchedQueryData>;

/*
// Capture results from a slimmedQuery (returned form onQueryExecuted).
// Stitch this together with the results from slimmedQueryResults.
// Get originalQuery results from cache (the ones that matched).
// Update resultsByContext with all data from both queries.
// Increment number of active subscriptions at each property of the original query if subscriptionsEstablished is true.
*/
export class QuerySlimmer {
  public queriesByContext: IQueryDataByContextMap = {};

  public onResultsReceived(opts: {
    slimmedQuery: QueryRecord;
    originalQuery: QueryRecord;
    slimmedQueryResults: Record<string, any>;
    subscriptionEstablished: boolean;
  }) {
    this.populateQueriesByContext(opts.slimmedQuery, opts.slimmedQueryResults);
  }

  // onQueryExectued
  // Return a new QueryRecord
  // - if no matches for the originalQuery are found in queriesByContext, return original query [X]
  // - if partial match for queryRecord is found in queriesByContext, return a new query record with only the properties that DID NOT match
  // - if complete match for queryRecord is found in queriesByContext, return null [X]

  // PIOTR TODO:
  // - recursively handle relational data in queries

  public onNewQueryReceived(
    newQuery: QueryRecord | RelationalQueryRecord,
    parentContextKey?: string
  ) {
    const slimmedQueryRecord: QueryRecord = {};
    const slimmedRelationalQueryRecord: RelationalQueryRecord = {};

    Object.keys(newQuery).forEach(newQueryKey => {
      const newQueryRecordEntry = newQuery[newQueryKey];
      const newQueryContextKey = this.createContextKeyForQuery(
        newQueryRecordEntry,
        parentContextKey
      );

      if (this.queriesByContext[newQueryContextKey] === undefined) {
        // If the context key of the new query is not found in queriesByContext we know there is no cached version of this query.
        if (parentContextKey === undefined) {
          slimmedQueryRecord[newQueryKey] = newQueryRecordEntry;
        } else {
          const newRelationalQueryRecordEntry = newQueryRecordEntry as RelationalQueryRecordEntry;
          slimmedRelationalQueryRecord[
            newQueryKey
          ] = newRelationalQueryRecordEntry;
        }
      } else {
        // If a context key is found for the new query in queriesByContext we need to check if any of the requested properties are already cached.
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
          slimmedQueryRecord[newQueryKey] = {
            ...newQueryRecordEntry,
            properties: newRequestedProperties,
          };
        }

        // If there are child relational queries we still need to handle those even if the parent query is requesting only cached properties.
        if (newQueryRecordEntry.relational !== undefined) {
          const slimmedNewRelationalQueryRecord = this.onNewQueryReceived(
            newQueryRecordEntry.relational,
            newQueryContextKey
          );

          // If there are any non-cached properties being requested in the child relational query
          // we will still need to return the query record even if it is not requesting any un-cached properties.
          // In this scenario we return an empty array for properties while the child relational query is populated.
          if (slimmedNewRelationalQueryRecord !== null) {
            slimmedQueryRecord[newQueryKey] = {
              ...newQueryRecordEntry,
              properties: newRequestedProperties ?? [],
              relational: {
                ...(slimmedNewRelationalQueryRecord as RelationalQueryRecord),
              },
            };
          }
        }
      }
    });

    if (parentContextKey === undefined) {
      return Object.keys(slimmedQueryRecord).length > 0
        ? slimmedQueryRecord
        : null;
    } else {
      return Object.keys(slimmedRelationalQueryRecord).length > 0
        ? slimmedRelationalQueryRecord
        : null;
    }
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

  private stringifyQueryParams(entry: QueryRecordEntry) {
    const params = { ids: entry.ids, id: entry.id };
    if (!Object.values(params).some(value => value != null)) {
      return 'NO_PARAMS';
    }
    return JSON.stringify(params);
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
}
