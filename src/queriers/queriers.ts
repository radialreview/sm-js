import {
  IMMGQL,
  QueryDefinitions,
  QueryOpts,
  QueryReturn,
  QueryDataReturn,
  SubscriptionOpts,
  SubscriptionMeta,
  EPaginationFilteringSortingInstance,
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
    const queryId =
      opts?.queryId || startStack.split('\n')[1] || `query${queryIdx++}`;

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
          subscribe: false,
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
          onSubscriptionError: () => {
            throw new Error(
              `Should neven happen, query method does not subscribe`
            );
          },
          queryId,
          useServerSidePaginationFilteringSorting:
            mmGQLInstance.paginationFilteringSortingInstance ===
            EPaginationFilteringSortingInstance.SERVER,
          batchKey: opts?.batchKey || null,
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
    const queryId =
      opts?.queryId || startStack.split('\n')[1] || `query${queryIdx++}`;

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
          subscribe: true,
          onResultsUpdated: () => {
            res({
              data: dataToReturn,
              unsub: () => qM.unsub(),
              onQueryDefinitionsUpdated: newQueryDefinitionRecord =>
                handlers.onQueryDefinitionsUpdated(newQueryDefinitionRecord),
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
                unsub: () => qM.unsub(),
                onQueryDefinitionsUpdated: newQueryDefinitionRecord =>
                  handlers.onQueryDefinitionsUpdated(newQueryDefinitionRecord),
                error: e,
              } as ReturnType);
              return;
            }

            rej(error);
          },
          onSubscriptionError: e => {
            const error = getError(
              new Error(`Error subscribing to data`),
              (e as any).stack
            );

            if (opts.onError) {
              opts.onError(error);
              res({
                data: dataToReturn,
                unsub: () => qM.unsub(),
                onQueryDefinitionsUpdated: newQueryDefinitionRecord =>
                  handlers.onQueryDefinitionsUpdated(newQueryDefinitionRecord),
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
          onQueryStateChange: opts.onQueryManagerQueryStateChange,
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
            unsub: () => {
              const error = getError(
                new Error(
                  `unsub called when there was an error initializing query manager`
                ),
                (e as any).stack
              );
              throw error;
            },
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
