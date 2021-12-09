// import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
// import { SMQueryManager } from './SMQueryManager';
// import { extend } from './dataUtilities';
// import { throwLocallyLogInProd } from './exceptions';

// interface IQueryContext {
//   results: any;
//   hasResolved: boolean;
//   queryPromise: Promise<any>;
//   queryError: any;
//   subscriptionError: any;
// }
// interface ISMDataContext {
//   // returns a promise if it had to make a new query due to a query definitions change
//   setQuery(
//     queryDefinitions: QueryDefinitions,
//     opts: UseQueryOpts<boolean>
//   ): Maybe<Promise<void>>;
//   clearQuery(queryId: string): void;
//   getQueryById(queryId: string): IQueryContext;
//   // any useSMQuery hook that is mounted calls this method to inform the SMQueryContextManager that the query is being used
//   reportBeingUsed(queryId: string): void;
//   // once the useSMQuery hook unmounts, it calls this method to inform SMQueryContextManager that the query is no longer being used
//   // SMQueryContextManager can then decide to delete that query and cancel any ongoing subscriptions
//   reportNotBeingUsed(queryId: string): void;
// }

// const SMDataContext = {}

// /**
//  * How long an SM query (and its subscriptions) stay alive for when not being used.
//  * Too low of a value can cause issues with our WithLastRenderedUntilReady mechanism,
//  *   which will attempt to render a component then hide and show the previously loaded page
//  *   until the query for the necessary data has resolved.
//  *   It also causes lots of unnecessary work if the user is hoping back and forth between 2 pages.
//  * Too high of a value will cause subscriptions to remain active when they are maybe no longer necessary.
//  */
// const QUERY_CONTEXT_TTL_MS = 30000;
// class SMQueryContextManager {
//   /**
//    * used to store loading and error states, current results, suspender promises, and a few more details
//    * about every ongoing query
//    */

//   private queriesByQueryId: Record<string, IQueryContext> = {};

//   /**
//    * stores SMQueryManagers by query id. Check SMQueryManager.ts for more details
//    */

//   private queryManagersByQueryId: Record<string, SMQueryManager> = {};

//   /**
//    * multiple subscriptions are ongoing per each query (one subscription per each alias)
//    * this is a record that maps queryIds to arrays of methods that cancel each of those subscriptions
//    */

//   private subscriptionCancellersByQueryId: Record<
//     string,
//     Array<() => void>
//   > = {};

//   /**
//    * keep track of how many useSMQuery hooks are currently watching this queryId
//    * allows us to avoid duplicate ids and clean subscriptions and state at appropriate times
//    */

//   private queryUsersByQueryId: Record<string, number> = {};

//   /**
//    * store the timeouts to clear a query indexed by their queryId,
//    * so they can be cancelled if the query becomes used again
//    */

//   private queryClearerTimeoutsByQueryId: Record<string, NodeJS.Timeout> = {};

//   public updateQuery(opts: { queryId: string } & Partial<IQueryContext>) {
//     const { queryId, ...update } = opts;
//     this.queriesByQueryId[queryId] = this.queriesByQueryId[queryId] || {};

//     extend({
//       object: this.queriesByQueryId[queryId],
//       extension: update,
//       deleteKeysNotInExtension: false,
//       extendNestedObjects: false,
//     });
//   }

//   public getQueryByQueryId(queryId: string) {
//     this.queriesByQueryId[queryId] = this.queriesByQueryId[queryId] || {
//       results: {},
//       hasResolved: false,
//       queryError: null,
//       subscriptionError: null,
//     };
//     return this.queriesByQueryId[queryId];
//   }

//   public getQueryManagerByQueryId(queryId: string) {
//     this.queryManagersByQueryId[queryId] =
//       this.queryManagersByQueryId[queryId] || new SMQueryManager();
//     return this.queryManagersByQueryId[queryId];
//   }

//   public cancelSubscriptionsForQuery(queryId: string) {
//     this.subscriptionCancellersByQueryId[queryId]?.forEach(cancel => cancel());
//     delete this.subscriptionCancellersByQueryId[queryId];
//   }

//   public setSubscriptionCancellersForQuery(opts: {
//     queryId: string;
//     cancellers: Array<() => void>;
//   }) {
//     this.subscriptionCancellersByQueryId[opts.queryId] = opts.cancellers;
//   }

//   public clearQueryByQueryId(queryId: string) {
//     this.cancelSubscriptionsForQuery(queryId);
//     delete this.queriesByQueryId[queryId];
//   }

//   public reportBeingUsed(queryId: string) {
//     this.queryUsersByQueryId[queryId] =
//       this.queryUsersByQueryId[queryId] != null
//         ? this.queryUsersByQueryId[queryId] + 1
//         : 1;

//     if (this.queryUsersByQueryId[queryId] > 1) {
//       throwLocallyLogInProd(
//         Error(
//           `smData - multiple queries are using the queryId "${queryId}". Query ids should be unique for better error logging and debugging.`
//         )
//       );
//     }
//   }

//   public reportNotBeingUsed(queryId: string) {
//     const newNumberOfUsers = Math.max(this.queryUsersByQueryId[queryId] - 1, 0);
//     this.queryUsersByQueryId[queryId] = newNumberOfUsers;

//     if (newNumberOfUsers === 0) {
//       this.queryClearerTimeoutsByQueryId[queryId] = setTimeout(() => {
//         if (this.queryUsersByQueryId[queryId] === 0) {
//           this.clearQueryByQueryId(queryId);
//         }
//       }, QUERY_CONTEXT_TTL_MS);
//     }
//   }
// }

// async function smQuery(queryDefinitions: QueryDefinitions, opts: SMQueryOpts) {
//          const newQueryInfo = convertQueryDefinitionToQueryInfo({
//            queryDefinitions,
//            queryId: opts.queryId,
//          });

//          props.gqlClient
//           .queryGQL({
//             gql: newQueryInfo.queryGQL,
//             token: opts.token,
//             tokenValidTo: opts.tokenValidTo,
//             batched: opts.batched,
//           })
//           .then(queryResult => {
//             queryManager.onQueryResult({
//               queryId: opts.queryId,
//               queryRecord: newQueryInfo.queryRecord,
//               queryResult,
//             });
//             contextManager.updateQuery({
//               queryId: opts.queryId,
//               results: queryManager.results,
//             });

//             const subscriptionCancellers = newQueryInfo.subscriptionConfigs
//               .map(subscriptionConfig => {
//                 return props.gqlClient.subscribeGQL({
//                   gql: subscriptionConfig.gql,
//                   token: opts.token,
//                   tokenValidTo: opts.tokenValidTo,
//                   onMessage: message => {
//                     const node = subscriptionConfig.extractNodeFromSubscriptionMessage(
//                       message
//                     );
//                     const operation = subscriptionConfig.extractOperationFromSubscriptionMessage(
//                       message
//                     );

//                     queryManager.onSubscriptionMessage({
//                       node,
//                       operation,
//                       queryId: opts.queryId,
//                       queryRecord: newQueryInfo.queryRecord,
//                       subscriptionAlias: subscriptionConfig.alias,
//                     });

//                     contextManager.updateQuery({
//                       queryId: opts.queryId,
//                       results: queryManager.results,
//                     });
// }

// export const Provider = observer(function SMProvider(props: {
//   gqlClient: IGQLClient;
//   children: React.ReactNode;
// }) {
//   const existingContext = useContext(SMDataContext);

//   if (existingContext) {
//     // @TODO add docs link to error message
//     throw Error(
//       'Another instance of an SM Provider was already detected higher up the render tree.\nHaving multiple instances of SM Providers being rendered prevents helpful errors and warnings, like waterfall prevention, from working as intended.'
//     );
//   }

//   const { current: contextManager } = useRef(new SMQueryContextManager());

//   const setQuery = useCallback(
//     (queryDefinitions: QueryDefinitions, opts: UseQueryOpts<boolean>) => {
//       const queryInfo = contextManager.getQueryByQueryId(opts.queryId);
//       const newQueryInfo = convertQueryDefinitionToQueryInfo({
//         queryDefinitions,
//         queryId: opts.queryId,
//       });
//       const queryManager = contextManager.getQueryManagerByQueryId(
//         opts.queryId
//       );

//       const queryHasChanged =
//         queryInfo.queryGQL?.loc?.source.body !==
//         newQueryInfo.queryGQL.loc?.source.body;
//       if (!queryHasChanged) return null;

//       // cancel old subscriptions if the query changed, they'll be reinitialized below
//       contextManager.cancelSubscriptionsForQuery(opts.queryId);

//       const queryPromise = new Promise((res, rej) => {
//         props.gqlClient
//           .queryGQL({
//             gql: newQueryInfo.queryGQL,
//             token: opts.token,
//             tokenValidTo: opts.tokenValidTo,
//             batched: opts.batched,
//           })
//           .then(queryResult => {
//             queryManager.onQueryResult({
//               queryId: opts.queryId,
//               queryRecord: newQueryInfo.queryRecord,
//               queryResult,
//             });
//             contextManager.updateQuery({
//               queryId: opts.queryId,
//               results: queryManager.results,
//             });

//             const subscriptionCancellers = newQueryInfo.subscriptionConfigs
//               .map(subscriptionConfig => {
//                 return props.gqlClient.subscribeGQL({
//                   gql: subscriptionConfig.gql,
//                   token: opts.token,
//                   tokenValidTo: opts.tokenValidTo,
//                   onMessage: message => {
//                     const node = subscriptionConfig.extractNodeFromSubscriptionMessage(
//                       message
//                     );
//                     const operation = subscriptionConfig.extractOperationFromSubscriptionMessage(
//                       message
//                     );

//                     queryManager.onSubscriptionMessage({
//                       node,
//                       operation,
//                       queryId: opts.queryId,
//                       queryRecord: newQueryInfo.queryRecord,
//                       subscriptionAlias: subscriptionConfig.alias,
//                     });

//                     contextManager.updateQuery({
//                       queryId: opts.queryId,
//                       results: queryManager.results,
//                     });
//                   },
//                   onError: error => {
//                     contextManager.updateQuery({
//                       queryId: opts.queryId,
//                       subscriptionError: error,
//                     });
//                     contextManager.cancelSubscriptionsForQuery(opts.queryId);
//                   },
//                 });
//               })
//               .map(sub => () => sub.unsubscribe());

//             contextManager.setSubscriptionCancellersForQuery({
//               queryId: opts.queryId,
//               cancellers: subscriptionCancellers,
//             });
//             res();
//           })
//           .catch(error => {
//             contextManager.updateQuery({
//               queryId: opts.queryId,
//               queryError: error,
//             });
//             contextManager.cancelSubscriptionsForQuery(opts.queryId);
//             rej(error);
//           })
//           .finally(() => {
//             contextManager.updateQuery({
//               queryId: opts.queryId,
//               hasResolved: true,
//             });
//           });
//       });

//       contextManager.updateQuery({
//         queryId: opts.queryId,
//         queryPromise: queryInfo.queryPromise || queryPromise,
//         queryGQL: newQueryInfo.queryGQL,
//       });

//       return queryPromise as Promise<void>;
//     },
//     [props.gqlClient, contextManager]
//   );

//   return (
//     <SMDataContext.Provider
//       value={{
//         getQueryById: contextManager.getQueryByQueryId.bind(contextManager),
//         clearQuery: contextManager.clearQueryByQueryId.bind(contextManager),
//         reportBeingUsed: contextManager.reportBeingUsed.bind(contextManager),
//         reportNotBeingUsed: contextManager.reportNotBeingUsed.bind(
//           contextManager
//         ),
//         setQuery,
//       }}
//     >
//       {props.children}
//     </SMDataContext.Provider>
//   );
// });

// export type SMQueryOpts<TReturnType> = {
//   queryId: string;
//   token: string;
//   tokenValidTo: string;
//   batched?: boolean;
//   onUpdateReceived?: (newData: TReturnType) => void
//   onErrorReceived?: (error: any) => void

// };

// export type UseSMQueryReturn<
//   TQueryDefinitions extends QueryDefinitions,
//   Suspend extends boolean
// > = Suspend extends true
//   ? QueryDataReturn<TQueryDefinitions>
//   :
//       | QueryDataReturn<TQueryDefinitions>
//       | Record<keyof QueryDataReturn<TQueryDefinitions>, null>;

// export function useQuery<
//   TQueryDefinitions extends QueryDefinitions,
//   Suspend extends boolean
// >(
//   queryDefinitions: TQueryDefinitions,
//   opts: UseQueryOpts<Suspend>
// ): UseSMQueryReturn<TQueryDefinitions, Suspend> {
//   const smDataContextValue = useContext(SMDataContext);
//   const { isShowingDueToFallback } = useCurrentRoute();
//   if (!smDataContextValue) {
//     throw Error(
//       `Please wrap your app code with SMProvider.\nSee the section in smData's readme titled "Wrap your app with SMProvider"`
//     );
//   }

//   const {
//     getQueryById,
//     setQuery,
//     reportBeingUsed,
//     reportNotBeingUsed,
//   } = smDataContextValue;

//   React.useEffect(() => {
//     // this "if" check prevents routes being shown as fallback while a query is ongoing
//     // from making the context tool believe that the same queryId is being used multiple times
//     if (!isShowingDueToFallback) {
//       reportBeingUsed(opts.queryId);
//       return () => reportNotBeingUsed(opts.queryId);
//     }
//   }, [
//     reportBeingUsed,
//     reportNotBeingUsed,
//     isShowingDueToFallback,
//     opts.queryId,
//   ]);

//   const thisQuery = getQueryById(opts.queryId);
//   if (thisQuery.queryError) throw thisQuery.queryError;
//   if (thisQuery.subscriptionError) throw thisQuery.subscriptionError;

//   const queryPromise = setQuery(queryDefinitions, opts);

//   if (queryPromise && opts.suspend) throw queryPromise;
//   else if (opts.suspend && !thisQuery.hasResolved && thisQuery.queryPromise)
//     throw thisQuery.queryPromise;

//   return thisQuery.results;
// }
