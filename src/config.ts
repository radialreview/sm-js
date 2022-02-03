import { getGQLCLient } from './gqlClient';
import { SMConfig } from './types';

export function getDefaultConfig(): SMConfig {
  return {
    gqlClient: getGQLCLient({
      httpUrl: 'https://saasmaster.dev02.tt-devs.com/playground/..',
      wsUrl: 'wss://saasmaster.dev02.tt-devs.com/',
    }),
  };
}
