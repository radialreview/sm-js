import { QueryRecord, QueryRecordEntry } from './types';

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

  public onQueryExectued(originalQuery: QueryRecord) {
    // Return a new QueryRecord
    // - if no matches for the originalQuery are found in queriesByContext, return original query [X]
    // - if partial match for queryRecord is found in queriesByContext, return a new query record with only the properties that DID NOT match
    // - if complete match for queryRecord is found in queriesByContext, return null [X]

    const slimmedQueryRecord: QueryRecord = {};

    Object.keys(originalQuery).forEach(originalQueryKey => {
      const originalQueryRecordEntry = originalQuery[originalQueryKey];
      const originalQueryContextKey = this.createContextKeyForQuery(
        originalQueryRecordEntry
      );

      if (this.queriesByContext[originalQueryContextKey] === undefined) {
        slimmedQueryRecord[originalQueryKey] = originalQueryRecordEntry;
      }
    });

    return Object.keys(slimmedQueryRecord).length > 0
      ? slimmedQueryRecord
      : null;
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
}
