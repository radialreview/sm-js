import { QueryDefinitions, QueryDataReturn } from '../types';
export declare function useSubscription<TQueryDefinitions extends QueryDefinitions>(queryDefinitions: TQueryDefinitions, opts?: {
    tokenName?: string;
}): {
    data: QueryDataReturn<TQueryDefinitions>;
    querying: boolean;
};
