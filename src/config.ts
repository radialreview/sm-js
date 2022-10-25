import { getGQLCLient } from './gqlClient';
import { Config, EPaginationFilteringSortingInstance } from './types';

export function getDefaultConfig(): Config {
  const logging: Config['logging'] = {
    querySlimming: false,
    gqlClientQueries: false,
    gqlClientMutations: false,
    gqlClientSubscriptions: false,
  };

  return {
    gqlClient: getGQLCLient({
      httpUrl:
        'http://bloom-app-loadbalancer-dev-524448015.us-west-2.elb.amazonaws.com/graphql/',
      wsUrl:
        'ws://bloom-app-loadbalancer-dev-524448015.us-west-2.elb.amazonaws.com/graphql/',
      logging,
    }),
    generateMockData: false,
    enableQuerySlimming: false,
    paginationFilteringSortingInstance:
      EPaginationFilteringSortingInstance.SERVER,
    logging,
  };
}
