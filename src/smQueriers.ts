import { getToken } from './auth';
import { getConfig } from './config';
import {
  convertQueryDefinitionToQueryInfo,
  SubscriptionConfig,
} from './queryDefinitionAdapters';
import { SMQueryManager } from './SMQueryManager';

// @TODO things to consider implementing
// 1) skipInitialQuery logic in sm.subscribe
//    Cannot currently support this, since we require a full set of results to build the SMQueryManager state
//    To support it, SMQueryManager must be refactored to build its initial state from just a queryRecord (no actual SM data)
//    Then, queries and subscriptions must update that state
// 2) retry logic for queries
// 3) automatic subscription cancellation in "subscription" method, when initial query fails.
//    Also, should all subscriptions initialized as the result of a call to sm.subscribe be cancelled when one of them receives an error?
//    Or would we expect to continue receiving updates for other ongoing subscriptions?
// 4) subscriptions received between query initialization and query response must be applied conditionally
//    Meaning, we shouldn't apply subscription deltas that are older than the data we received in the query

let queryIdx = 0;

type QueryOpts<TQueryDefinitions extends QueryDefinitions> = {
  onData?: (info: { results: QueryDataReturn<TQueryDefinitions> }) => void;
  // When onError is provided, we pass it any errors encountered instead of throwing them.
  // This is by design, for consistency with the interface of sm.subscribe
  onError?: (...args: any) => void;
  queryId?: string;
  tokenName?: string;
  batched?: boolean;
};
type QueryReturn<TQueryDefinitions extends QueryDefinitions> = {
  data: QueryDataReturn<TQueryDefinitions>;
  error: any;
};

/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */
function generateQuerier<TQueryDefinitions extends QueryDefinitions>(
  queryManager?: SMQueryManager
) {
  return async function query(
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
      const error = new Error(
        `No token registered with the name "${tokenName}".\n` +
          'Please register this token prior to using it with sm.setToken(tokenName, { token })) '
      );
      if (opts?.onError) {
        opts.onError(error);
        return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
      } else {
        throw error;
      }
    }

    return getConfig()
      .gqlClient.query({
        gql: queryGQL,
        token: token,
        batched: opts?.batched,
      })
      .then(queryResult => {
        let results;
        try {
          const qM = queryManager || new SMQueryManager(queryRecord);
          qM.onQueryResult({
            queryId,
            queryResult,
          });

          results = qM.getResults() as QueryDataReturn<TQueryDefinitions>;
        } catch (e) {
          const error = new Error(`Error applying query results\n${e}`);
          if (opts?.onError) {
            opts.onError(error);
            return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
          } else {
            throw error;
          }
        }

        opts?.onData && opts.onData({ results });
        return { data: results, error: null };
      })
      .catch(e => {
        const error = new Error(`Error querying data\n${e}`);
        if (opts?.onError) {
          opts.onError(error);
          return { data: {} as QueryDataReturn<TQueryDefinitions>, error };
        } else {
          throw error;
        }
      });
  };
}

export const query = generateQuerier();

type SubscriptionOpts<TQueryDefinitions extends QueryDefinitions> = {
  onData: (info: { results: QueryDataReturn<TQueryDefinitions> }) => void;
  // To catch an error in a subscription, you must provide an onError handler,
  // since we resolve this promise as soon as the subscriptions are initialized and the query is resolved (if it wasn't skipped)
  //
  // This means you can use the try/catch syntax try { await sm.subscription } catch (e) {}
  // to catch errors querying or initializing subscriptions.
  //
  // However, when onError is given, errors will no longer be thrown
  // They will instead all be passed to the onError handler
  onError?: (...args: any) => void;
  skipInitialQuery?: boolean;
  queryId?: string;
  tokenName?: string;
  batched?: boolean;
};

type SubscriptionCanceller = () => void;
type SubscriptionMeta = { unsub: SubscriptionCanceller; error: any };

export async function subscribe<
  TQueryDefinitions extends QueryDefinitions,
  TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>
>(
  queryDefinitions: TQueryDefinitions,
  opts: TSubscriptionOpts
): Promise<
  TSubscriptionOpts extends { skipInitialQuery: true }
    ? SubscriptionMeta
    : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta
> {
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

  function handleError(...args: Array<any>) {
    if (opts.onError) {
      opts.onError(...args);
    } else {
      const error = args[0];
      // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
      error.stack =
        error.stack + '\n' + startStack.substring(startStack.indexOf('\n') + 1);

      console.error(error);
    }
  }

  const tokenName = opts?.tokenName || 'default';
  const token = getToken({ tokenName });

  if (!token) {
    const error = new Error(
      `No token registered with the name "${tokenName}".\n` +
        'Please register this token prior to using it with sm.setToken(tokenName, { token })) '
    );
    if (opts.onError) {
      opts.onError(error);
      return { data: {}, unsub, error } as {
        data: QueryDataReturn<TQueryDefinitions>;
      } & SubscriptionMeta;
    } else {
      throw error;
    }
  }

  const queryManager = new SMQueryManager(queryRecord);

  function updateQueryManagerWithSubscriptionMessage(data: {
    message: Record<string, any>;
    subscriptionConfig: SubscriptionConfig;
  }) {
    let node;
    let operation;
    try {
      node = data.subscriptionConfig.extractNodeFromSubscriptionMessage(
        data.message
      );
      operation = data.subscriptionConfig.extractOperationFromSubscriptionMessage(
        data.message
      );
      queryManager.onSubscriptionMessage({
        node,
        operation,
        queryId: queryId,
        subscriptionAlias: data.subscriptionConfig.alias,
      });
    } catch (e) {
      handleError(new Error(`Error applying subscription message\n${e}`));
    }
  }

  let subscriptionCancellers: Array<SubscriptionCanceller> = [];
  // Subscriptions are initialized immediately, rather than after the query resolves, to prevent an edge case where an update to a node happens
  // while the data for that node is being transfered from SM to the client. This would result in a missed update.
  // However, we must be careful to not call opts.onData with any subscription messages before the query resolves,
  // because a subscription message only includes info about the node that changed, not all data being subscribed to,
  // which means the consumer of this API would receive and incomplete data set in this edge case.
  // This flag prevents that, by short-circuiting opts.onData in subscription messages, if the query has not resolved
  let mustAwaitQuery = !opts.skipInitialQuery;
  const messageQueue: Array<{
    message: Record<string, any>;
    subscriptionConfig: SubscriptionConfig;
  }> = [];
  function initSubs() {
    try {
      subscriptionCancellers = subscriptionConfigs.map(subscriptionConfig => {
        return getConfig().gqlClient.subscribe({
          gql: subscriptionConfig.gql,
          token: token,
          onMessage: message => {
            if (mustAwaitQuery) {
              messageQueue.push({ message, subscriptionConfig });
              return;
            }

            updateQueryManagerWithSubscriptionMessage({
              message,
              subscriptionConfig,
            });

            // @TODO When called with skipInitialQuery, results should be null
            // and we should simply expose a "delta" from the message
            // probably don't need a query manager in that case either.
            opts.onData({
              results: queryManager.getResults() as QueryDataReturn<
                TQueryDefinitions
              >,
            });
          },
          onError: e => {
            // Can never throw here. The dev consuming this would have no way of catching it
            // To catch an error in a subscription they must provide onError
            handleError(new Error(`Error in a subscription message\n${e}`));
          },
        });
      });
    } catch (e) {
      const error = new Error(`Error initializating subscriptions\n${e}`);
      if (opts?.onError) {
        opts.onError(error);
      } else {
        throw error;
      }
    }
  }

  function unsub() {
    subscriptionCancellers.forEach(cancel => cancel());
  }

  if (opts.skipInitialQuery) {
    initSubs();
    return { unsub } as TSubscriptionOpts extends { skipInitialQuery: true }
      ? SubscriptionMeta
      : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta;
  } else {
    const query = generateQuerier(queryManager);
    initSubs();
    try {
      // this query method will post its results to the queryManager declared above
      await query(queryDefinitions, {
        queryId: opts.queryId,
        tokenName: opts.tokenName,
        batched: opts.batched,
      });
    } catch (e) {
      const error = new Error(`Error querying initial data set\n${e}`);
      if (opts?.onError) {
        opts.onError(error);
        return { data: {}, unsub, error } as {
          data: QueryDataReturn<TQueryDefinitions>;
        } & SubscriptionMeta;
      } else {
        throw error;
      }
    }

    if (mustAwaitQuery) {
      mustAwaitQuery = false;
      messageQueue.forEach(updateQueryManagerWithSubscriptionMessage);
      messageQueue.length = 0;
    }

    const data = queryManager.getResults() as QueryDataReturn<
      TQueryDefinitions
    >;

    opts.onData({ results: data as QueryDataReturn<TQueryDefinitions> });

    return { data, unsub, error: null } as {
      data: QueryDataReturn<TQueryDefinitions>;
    } & SubscriptionMeta;
  }
}
