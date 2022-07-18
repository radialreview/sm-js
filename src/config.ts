import { getGQLCLient } from './gqlClient';
import { Config } from './types';

export function getDefaultConfig(): Config {
  return {
    gqlClient: getGQLCLient({
      httpUrl: 'https://saasmaster.dev02.tt-devs.com/playground/..',
      wsUrl: 'wss://saasmaster.dev02.tt-devs.com/',
    }),
  };
}
