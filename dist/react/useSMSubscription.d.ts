import { UseSubscriptionReturn, UseSubscriptionQueryDefinitions } from '../types';
export declare function useSubscription<TQueryDefinitions extends UseSubscriptionQueryDefinitions>(queryDefinitions: TQueryDefinitions, opts?: {
    subscriptionId: string;
}): UseSubscriptionReturn<TQueryDefinitions>;
