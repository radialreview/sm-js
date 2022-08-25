import { getGQLCLient } from './gqlClient';
import { Config } from './types';

export function getDefaultConfig(): Config {
  return {
    gqlClient: getGQLCLient({
      httpUrl: 'http://dev.bloomgrowth.com/graphql/',
      wsUrl: 'ws://dev.bloomgrowth.com/graphql/',
    }),
    generateMockData: false,
  };
}
