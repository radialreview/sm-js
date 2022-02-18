import { QueryDefinitions, QueryDataReturn } from '../types';
export declare function useSubscription<TQueryDefinitions extends QueryDefinitions>(queryDefinitions: TQueryDefinitions): {
    data: QueryDataReturn<TQueryDefinitions>;
    querying: boolean;
};
