import { getGQLCLient } from './gqlClient';
import { Config } from './types';

export function getDefaultConfig(): Config {
  return {
    gqlClient: getGQLCLient({
      httpUrl:
        'http://bloom-app-loadbalancer-dev-524448015.us-west-2.elb.amazonaws.com/graphql/',
      wsUrl:
        'ws://bloom-app-loadbalancer-dev-524448015.us-west-2.elb.amazonaws.com/graphql/',
    }),
    generateMockData: false,
  };
}
