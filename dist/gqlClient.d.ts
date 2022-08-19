import { IGQLClient } from './types';
interface IGetGQLClientOpts {
    httpUrl: string;
    wsUrl: string;
}
export declare function getGQLCLient(gqlClientOpts: IGetGQLClientOpts): IGQLClient;
export {};
