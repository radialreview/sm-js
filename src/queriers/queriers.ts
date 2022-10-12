import {
  IMMGQL,
  QueryDefinitions,
  QueryOpts,
  QueryReturn,
  QueryDataReturn,
  SubscriptionOpts,
  SubscriptionMeta,
  EPaginationFilteringSortingInstance,
  SubscriptionCanceller,
} from '../types';

let queryIdx = 0;

export function generateQuerier({ mmGQLInstance }: { mmGQLInstance: IMMGQL }) {
  return async function query<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TNode,
      TMapFn,
      TQueryDefinitionTarget
    >
  >(
    queryDefinitions: TQueryDefinitions,
    opts?: QueryOpts<TQueryDefinitions>
  ): Promise<QueryReturn<TQueryDefinitions>> {
    const startStack = new Error().stack as string;
    const queryId = opts?.queryId || `query${queryIdx++}`;

    function getError(error: any, stack?: string) {
      // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
      error.stack =
        `\n` +
        (stack || error.stack) +
        '\n' +
        startStack.substring(startStack.indexOf('\n') + 1);

      return error;
    }

    return new Promise((res, rej) => {
      const dataToReturn = {} as QueryDataReturn<TQueryDefinitions>;

      try {
        new mmGQLInstance.QueryManager(queryDefinitions, {
          resultsObject: dataToReturn,
          onResultsUpdated: () => {
            res({ data: dataToReturn, error: undefined });
            opts?.onData && opts.onData({ results: dataToReturn });
          },
          onQueryError: e => {
            const error = getError(
              new Error(`Error querying data`),
              (e as any).stack
            );

            if (opts?.onError) {
              opts.onError(error);
              res({ data: dataToReturn, error });
              return;
            }

            rej(error);
          },
          queryId,
          useServerSidePaginationFilteringSorting:
            mmGQLInstance.paginationFilteringSortingInstance ===
            EPaginationFilteringSortingInstance.SERVER,
          batchKey: opts?.batchKey || null,
          getMockDataDelay: mmGQLInstance?.getMockDataDelay || null,
        });
      } catch (e) {
        const error = getError(
          new Error(`Error initializing query manager`),
          (e as any).stack
        );

        if (opts?.onError) {
          opts.onError(error);
          res({ data: dataToReturn, error });
          return;
        }

        rej(error);
      }
    });
  };
}

export function generateSubscriber(mmGQLInstance: IMMGQL) {
  return async function subscribe<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TQueryDefinitions extends QueryDefinitions<
      TNode,
      TMapFn,
      TQueryDefinitionTarget
    >,
    TSubscriptionOpts extends SubscriptionOpts<TQueryDefinitions>
  >(
    queryDefinitions: TQueryDefinitions,
    opts: TSubscriptionOpts
  ): Promise<
    TSubscriptionOpts extends { skipInitialQuery: true }
      ? SubscriptionMeta
      : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta
  > {
    type ReturnType = TSubscriptionOpts extends {
      skipInitialQuery: true;
    }
      ? SubscriptionMeta
      : { data: QueryDataReturn<TQueryDefinitions> } & SubscriptionMeta;

    const startStack = new Error().stack as string;
    const queryId = opts?.queryId || `query${queryIdx++}`;

    function getError(error: any, stack?: string) {
      // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
      error.stack =
        `\n` +
        (stack || error.stack) +
        '\n' +
        startStack.substring(startStack.indexOf('\n') + 1);

      return error;
    }

    return new Promise<ReturnType>((res, rej) => {
      const dataToReturn = {} as QueryDataReturn<TQueryDefinitions>;

      let subCancellers: Array<SubscriptionCanceller> = [];

      function unsub() {
        subCancellers.forEach(subCanceller => subCanceller());
        subCancellers.length = 0;
      }

      const handlers = {
        onQueryDefinitionsUpdated: (
          _: QueryDefinitions<any, any, any>
        ): Promise<void> => {
          throw Error('onQueryDefinitionsUpdated not initialized');
        },
      };

      try {
        const qM = new mmGQLInstance.QueryManager(queryDefinitions, {
          resultsObject: dataToReturn,
          onResultsUpdated: () => {
            res({
              data: dataToReturn,
              unsub,
              onQueryDefinitionsUpdated: newQueryDefinitions =>
                handlers.onQueryDefinitionsUpdated(newQueryDefinitions),
              error: undefined,
            } as ReturnType);
            opts.onData({ results: dataToReturn });
          },
          onQueryError: e => {
            const error = getError(
              new Error(`Error querying data`),
              (e as any).stack
            );

            if (opts.onError) {
              opts.onError(error);
              res({
                data: dataToReturn,
                unsub,
                onQueryDefinitionsUpdated: qM.onQueryDefinitionsUpdated,
                error: e,
              } as ReturnType);
              return;
            }

            rej(error);
          },
          queryId,
          useServerSidePaginationFilteringSorting:
            mmGQLInstance.paginationFilteringSortingInstance ===
            EPaginationFilteringSortingInstance.SERVER,
          batchKey: opts?.batchKey || null,
          getMockDataDelay: mmGQLInstance?.getMockDataDelay || null,
        });

        handlers.onQueryDefinitionsUpdated = qM.onQueryDefinitionsUpdated;
      } catch (e) {
        const error = getError(
          new Error(`Error initializing query manager`),
          (e as any).stack
        );

        if (opts.onError) {
          opts.onError(error);
          res(({
            data: dataToReturn,
            unsub,
            onQueryDefinitionsUpdated: () => {
              const error = getError(
                new Error(
                  `onQueryDefinitionsUpdated called when there was an error initializing query manager`
                ),
                (e as any).stack
              );
              throw error;
            },
            error: e,
          } as unknown) as ReturnType);
          return;
        }

        rej(error);
      }
    });
  };
}
