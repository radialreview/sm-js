import { QueryRecord, QueryRecordEntry } from './types';

export class QuerySlimmer {
  public resultsByContext: Record<
    string,
    {
      subscriptionsByProperty: Record<string, number>;
      results: Object | Array<Object> | null;
    }
  > = {};
  // public onQueryExecuted ({originalQuery: {queryRecord}, slimmedQuery: {queryRecord}}) {
  // should return a new queryRecord
  // if no matches for queryRecord are found in resultsByContext, return original query
  // if partial match for queryRecord is found in resultsByContext, return a new query record with only the properties that DID NOT match
  // if complete match for queryRecord is found in resultsByContext, return null

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
    console.log('AIDAN results: ', results);
    Object.keys(queryRecord).forEach(alias => {
      const queryRecordEntry = queryRecord[alias];
      const contextKey = `${
        queryRecordEntry.def.type
      }s(${this.stringifyQueryParams(queryRecordEntry)})`;
      this.resultsByContext[contextKey] = {
        subscriptionsByProperty: queryRecordEntry.properties.reduce(
          (previous: Record<string, number>, current: string) => {
            previous[current] = previous[current] ? previous[current] + 1 : 1;
            console.log('AIDAN previous: ', previous);
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
    //nothing is being returned from this atm:
    this.populateResultsByContext(opts.slimmedQuery, opts.slimmedQueryResults);
    console.log(
      'AIDAN populateResultsByContext is returning: ',
      this.populateResultsByContext(opts.slimmedQuery, opts.slimmedQueryResults)
    );
    //capture results from slimmedQuery (returned form onQueryExecuted)
    // stitch this together with the rsults from slimmedQueryResults
    // get originalQuery results from cache (the ones that matched)
    //update resultsByContext with all data from both queries
    // increment number of active subscriptions at each property of the original query if subscriptionsEstablished is true
  }
}
