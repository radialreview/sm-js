import { QueryRecord, QueryRecordEntry } from './types';

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
  public queriesByContext: IQueryDataByContextMap = {};

  public onResultsReceived(opts: {
    slimmedQuery: QueryRecord;
    originalQuery: QueryRecord;
    slimmedQueryResults: Record<string, any>;
    subscriptionEstablished: boolean;
  }) {
    this.populateQueriesByContext(opts.slimmedQuery, opts.slimmedQueryResults);
  }

  // public onQueryExecuted ({originalQuery: {queryRecord}, slimmedQuery: {queryRecord}}) {
  // should return a new queryRecord
  // if no matches for queryRecord are found in queriesByContext, return original query
  // if partial match for queryRecord is found in queriesByContext, return a new query record with only the properties that DID NOT match
  // if complete match for queryRecord is found in queriesByContext, return null

  //   Object.keys(queryRecord).map(el => {
  //     const queryDefinitionKey = el.
  //   })
  //

  private populateQueriesByContext(
    queryRecord: QueryRecord,
    results: Record<string, any>,
    parentContextKey?: string
  ) {
    // console.log('AIDAN queryRecord: ', queryRecord);
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

  public onSubscriptionCancelled(
    queryRecord: QueryRecord,
    parentContextKey: string | undefined
  ) {
    Object.keys(queryRecord).forEach(alias => {
      const properties = queryRecord[alias].properties;
      const queryRecordEntry = queryRecord[alias];
      const doesQueryHaveIdProperty = !!queryRecordEntry.id;
      const parentContextKeyPrefix = parentContextKey
        ? `${parentContextKey}.`
        : '';
      const contextKey = `${parentContextKeyPrefix}${
        queryRecordEntry.def.type
      }${doesQueryHaveIdProperty ? '' : 's'}(${this.stringifyQueryParams(
        queryRecordEntry
      )})`;
      if (contextKey in this.queriesByContext) {
        properties.map(property => {
          const subscribedToPropertyCount = this.queriesByContext[contextKey]
            .subscriptionsByProperty[property];

          if (subscribedToPropertyCount === 1) {
            console.log('AIDAN in next if');
            delete this.queriesByContext[contextKey].subscriptionsByProperty[
              property
            ];
            if (Array.isArray(this.queriesByContext[contextKey].results)) {
              this.queriesByContext[contextKey].results.map(
                (el: any) => delete el[property]
              );
            }
            if (
              Object.keys(this.queriesByContext[contextKey].results[0])
                .length === 2 &&
              this.queriesByContext[contextKey].results[0].hasOwnProperty(
                'id'
              ) &&
              this.queriesByContext[contextKey].results[0].hasOwnProperty(
                'type'
              )
            ) {
              delete this.queriesByContext[contextKey];
            }
          }
          if (subscribedToPropertyCount > 1) {
            console.log('AIDAN in appropriate if: ', subscribedToPropertyCount);
            return subscribedToPropertyCount - 1;
          }
          console.log(
            'AIDAN after if: ',
            subscribedToPropertyCount,
            'property: ',
            property
          );

          return property;
        });
      }
    });
    return queryRecord;
  }
}
