import { Config, IGQLClient } from './types';
interface IGetGQLClientOpts {
    httpUrl: string;
    wsUrl: string;
    logging: Config['logging'];
}
export declare function getGQLCLient(gqlClientOpts: IGetGQLClientOpts): IGQLClient;
export {};
