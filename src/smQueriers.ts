import { getToken } from './auth';
import { getConfig } from './config';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { SMQueryManager } from './SMQueryManager';

type QueryReturn<TQueryDefinitions extends QueryDefinitions> = QueryDataReturn<
  TQueryDefinitions
> & {
  methods: {
    subscriptions: {
      cancel: () => void;
    };
  };
};

type QueryOpts<TQueryDefinitions extends QueryDefinitions> = {
  // @TODO in another task
  // add second param containing the change event, with only the data that changed, instead of the new set of results
  onUpdateReceived?: (newData: QueryDataReturn<TQueryDefinitions>) => void;
  // @QUESTION
  // should we enforce that when "onUpdateReceived" is provided
  // "onError" should also have to be provided?
  // Otherwise, this lib would have to throw the subscription error
  // and because it's thrown asynchronously, the stack trace would not
  // be helpful in finding the subscription that failed.
  // If instead we enforce an onError handler, the consumer can then choose how to deel with that error
  // and should have a helpful stack trace.
  onError?: (error: any) => void;
  queryId?: string;
  tokenName?: string;
  batched?: boolean;
};

let queryIdx = 0;

export async function query<TQueryDefinitions extends QueryDefinitions>(
  queryDefinitions: TQueryDefinitions,
  opts?: QueryOpts<TQueryDefinitions>
): Promise<QueryReturn<TQueryDefinitions>> {
  const queryId = opts?.queryId || `smQuery${queryIdx++}`;
  const {
    queryGQL,
    queryRecord,
    subscriptionConfigs,
  } = convertQueryDefinitionToQueryInfo({
    queryDefinitions,
    queryId,
  });

  const queryManager = new SMQueryManager();

  const tokenName = opts?.tokenName || 'default';
  const token = getToken({ tokenName });

  if (!token) {
    throw Error(`No token registered with the name "${token}".\n' + 
           'Please register this token prior to using it with sm.setTokenInfo(tokenName, { token })`);
  }

  return getConfig()
    .gqlClient.query({
      gql: queryGQL,
      token: token,
      batched: opts?.batched,
    })
    .then(queryResult => {
      queryManager.onQueryResult({
        queryRecord: queryRecord,
        queryId,
        queryResult,
      });

      let subscriptionCancellers: Maybe<Array<() => void>>;
      const onUpdateReceived = opts?.onUpdateReceived;
      if (onUpdateReceived) {
        subscriptionCancellers = subscriptionConfigs.map(subscriptionConfig => {
          return getConfig().gqlClient.subscribe({
            gql: subscriptionConfig.gql,
            token: token,
            onMessage: message => {
              const node = subscriptionConfig.extractNodeFromSubscriptionMessage(
                message
              );
              const operation = subscriptionConfig.extractOperationFromSubscriptionMessage(
                message
              );

              queryManager.onSubscriptionMessage({
                node,
                operation,
                queryId: queryId,
                queryRecord: queryRecord,
                subscriptionAlias: subscriptionConfig.alias,
              });

              onUpdateReceived(
                queryManager.getResults() as QueryDataReturn<TQueryDefinitions>
              );
            },
            onError: error => {
              opts && opts.onError && opts.onError(error);
            },
          });
        });
      }

      function cancelSubscriptions() {
        if (subscriptionCancellers) {
          subscriptionCancellers.forEach(cancel => cancel());
        }
      }

      const queryDataReturn = queryManager.getResults() as QueryDataReturn<
        TQueryDefinitions
      >;
      return {
        ...queryDataReturn,
        methods: {
          subscriptions: { cancel: cancelSubscriptions },
        },
      };
    });
}
