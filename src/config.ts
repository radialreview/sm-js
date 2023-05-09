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
      httpUrl: 'https://dev.bloomgrowth.com/graphql',
      wsUrl: 'wss://dev.bloomgrowth.com/graphql',
      logging,
      getCookie: () => '',
    }),
    generateMockData: false,
    mockDataType: 'random',
    staticData: undefined,
    enableQuerySlimming: false,
    paginationFilteringSortingInstance:
      EPaginationFilteringSortingInstance.SERVER,
    logging,
  };
}
