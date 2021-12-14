require('isomorphic-fetch');

import { DocumentNode } from '@apollo/client/core';
import { extend } from './dataUtilities';
import { getGQLCLient } from './gqlClient';
import { SMPlugin } from './plugins';

export type SMGQLClient = {
  query(opts: {
    gql: DocumentNode;
    token: string;
    batched?: boolean;
  }): Promise<any>;
  // returns a subscription canceller
  subscribe(opts: {
    gql: DocumentNode;
    token: string;
    onMessage: (message: Record<string, any>) => void;
    onError: (error: any) => void;
  }): () => void;
  mutate(opts: { mutations: Array<DocumentNode>; token: string }): Promise<any>;
};

export type SMConfig = {
  gqlClient: SMGQLClient;
  plugins?: Array<SMPlugin>;
};

const defaultConfig: SMConfig = {
  gqlClient: getGQLCLient({
    httpUrl: 'https://saasmaster.dev02.tt-devs.com/playground/..',
    wsUrl: 'wss://saasmaster.dev02.tt-devs.com/',
    onErrors: e => {
      console.error('gql client errors:', e);
      return false;
    },
  }),
};

let _storedConfig: SMConfig = defaultConfig;

export function config(config: DeepPartial<SMConfig>) {
  extend({
    object: _storedConfig,
    extension: config,
    deleteKeysNotInExtension: false,
    extendNestedObjects: true,
  });
}

export function getConfig() {
  return _storedConfig;
}
