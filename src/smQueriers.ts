import { getToken } from './auth';
import { getConfig } from './config';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { SMQueryManager } from './SMQueryManager';

let queryIdx = 0;

type QueryOpts<TQueryDefinitions extends QueryDefinitions> = {
  onData?: (newData: QueryDataReturn<TQueryDefinitions>) => void;
  onError?: (...args: any) => void;
  queryId?: string;
  tokenName?: string;
  batched?: boolean;
};
type QueryReturn<TQueryDefinitions extends QueryDefinitions> = QueryDataReturn<
  TQueryDefinitions
>;

/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */
function generateQuerier(queryManager?: SMQueryManager) {
  return async function query<TQueryDefinitions extends QueryDefinitions>(
    queryDefinitions: TQueryDefinitions,
    opts?: QueryOpts<TQueryDefinitions>
  ): Promise<QueryReturn<TQueryDefinitions>> {
    const queryId = opts?.queryId || `smQuery${queryIdx++}`;
    const { queryGQL, queryRecord } = convertQueryDefinitionToQueryInfo({
      queryDefinitions,
      queryId,
    });

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
        const qM = queryManager || new SMQueryManager();
        qM.onQueryResult({
          queryRecord: queryRecord,
          queryId,
          queryResult,
        });

        const results = qM.getResults() as QueryDataReturn<TQueryDefinitions>;

        opts?.onData && opts.onData(results);
        return results;
      })
      .catch(e => {
        if (opts?.onError) {
          opts.onError(e);
          return e;
        } else {
          throw e;
        }
      });
  };
}

export const query = generateQuerier();

type SubscriptionOpts<TQueryDefinitions extends QueryDefinitions> = {
  onData: (newData: QueryDataReturn<TQueryDefinitions>) => void;
  // @TODO can onError be optional
  // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
  onError?: (...args: any) => void;
  skipInitialQuery?: boolean;
  queryId?: string;
  tokenName?: string;
  batched?: boolean;
};

type SubscriptionCanceller = () => void;
type SubscriptionReturn = SubscriptionCanceller;

export function subscribe<TQueryDefinitions extends QueryDefinitions>(
  queryDefinitions: TQueryDefinitions,
  opts: SubscriptionOpts<TQueryDefinitions>
): SubscriptionReturn {
  // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
  const startStack = new Error().stack as string;
  const queryId = opts?.queryId || `smQuery${queryIdx++}`;
  const {
    queryRecord,
    subscriptionConfigs,
  } = convertQueryDefinitionToQueryInfo({
    queryDefinitions,
    queryId,
  });

  const tokenName = opts?.tokenName || 'default';
  const token = getToken({ tokenName });

  if (!token) {
    throw Error(`No token registered with the name "${token}".\n' + 
           'Please register this token prior to using it with sm.setTokenInfo(tokenName, { token })`);
  }

  const queryManager = new SMQueryManager();

  function handleError(...args: Array<any>) {
    if (opts.onError) {
      opts.onError(...args);
      return;
    }

    // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
    const error = args[0];
    error.stack =
      error.stack + '\n' + startStack.substring(startStack.indexOf('\n') + 1);
    console.error(error);
  }

  let subscriptionCancellers: Array<SubscriptionCanceller> = [];
  function initSubscriptions() {
    try {
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

            opts?.onData(
              queryManager.getResults() as QueryDataReturn<TQueryDefinitions>
            );
          },
          onError: handleError,
        });
      });
    } catch (e) {
      handleError(e);
    }
  }

  if (!opts.skipInitialQuery) {
    try {
      const query = generateQuerier(queryManager);
      query(queryDefinitions, {
        ...opts,
        onData: (...args) => {
          opts.onData(...args);
          initSubscriptions();
        },
        onError: handleError,
      });
    } catch (e) {
      handleError(e);
    }
  } else {
    initSubscriptions();
  }

  return () => {
    subscriptionCancellers.forEach(cancel => cancel());
  };
}
