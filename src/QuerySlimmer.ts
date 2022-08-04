import { QueryRecord, QueryRecordEntry } from './types';

export class QuerySlimmer {
  public resultsByContext: Record<
    string,
    {
      subscriptionsByProperty: Record<string, number>;
      results: Object | Array<Object> | null;
    }
  > = {};
  // public onQueryExecuted (queryRecord: QueryRecord) {
  //                             //take in a query record and return a new query record(either we didn’t find any matches in the cache and we return the original query record, we found a partial match so we return out a new query record with only the properties we didn’t find a match for, etc., could return null if we find a complete match in the cache) – has original query record, has slimmed query record {originalQuery: {queryRecord}, slimmedQuery: {queryRecord} }
  //   Object.keys(queryRecord).map(el => {
  //     const queryDefinitionKey = el.
  //   })
  //
  private stringifyQueryParams(entry: QueryRecordEntry) {
    const params = { ids: entry.ids, id: entry.id };
    if (!Object.values(params).some(value => value != null)) {
      return 'NO_PARAMS';
    }
    return JSON.stringify(params);
  }

  private populateResultsByContext(
    queryRecord: QueryRecord,
    results: Record<string, any>
  ) {
    Object.keys(queryRecord).forEach(alias => {
      const queryRecordEntry = queryRecord[alias];
      const contextKey = `${
        queryRecordEntry.def.type
      }s(${this.stringifyQueryParams(queryRecordEntry)})`;
      this.resultsByContext[contextKey] = {
        subscriptionsByProperty: queryRecordEntry.properties.reduce(
          (previous: Record<string, number>, current: string) => {
            previous[current] = previous[current] ? previous[current] + 1 : 1;
            return previous;
          },
          this.resultsByContext[contextKey]?.subscriptionsByProperty || {}
        ),
        results: results[alias],
      };
    });
  }

  public onResultsReceived(opts: {
    slimmedQuery: QueryRecord;
    originalQuery: QueryRecord;
    slimmedQueryResults: Record<string, any>;
    subscriptionEstablished: boolean;
  }) {
    this.populateResultsByContext(opts.slimmedQuery, opts.slimmedQueryResults);
  }
}
