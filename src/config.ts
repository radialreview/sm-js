import { DocumentNode } from 'graphql';
import { extend } from './dataUtilities';
import { SMPlugin } from './plugins';
// import {
//   ApolloClient,
//   InMemoryCache,

// } from '@apollo/client';

export type SMConfig = {
  gqlClient: {
    query(opts: {
      gql: DocumentNode;
      token: string;
      batched?: boolean;
    }): Promise<any>;
    // returns a subscription canceller
    subscribe(opts: {
      gql: any;
      token: string;
      onMessage: (message: Record<string, any>) => void;
      onError: (error: any) => void;
    }): () => void;
  };
  plugins?: Array<SMPlugin>;
};

const defaultConfig: SMConfig = {
  gqlClient: {
    query: async function defaultGQLClientQuery() {
      // @TODO
    },
    subscribe: () => {
      // @TODO
      return () => {};
    },
  },
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
