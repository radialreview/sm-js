import { children, getDefaultConfig, SMJS, string } from 'sm-js';
import { gql } from '@apollo/client/core';

const config = getDefaultConfig();

const smJS = new SMJS(config);

export const setToken = (opts: { tokenName: string; token: string }) =>
  smJS.setToken({
    tokenName: opts.tokenName,
    token: opts.token,
  });

export default smJS;

export const todoNode = smJS.def({
  type: 'todo',
  properties: {
    id: string,
    task: string,
  },
});

export const userNode = smJS.def({
  type: 'tt-user',
  properties: {
    id: string,
    firstName: string,
    lastName: string,
    address: string,
  },
  relational: {
    todos: () => children({ def: todoNode, depth: 1 }),
  },
});

export async function authenticate(opts: {
  username: string;
  password: string;
}) {
  const mutation = gql`
    mutation {
       Authenticate(
        username: "${opts.username}",
	      password: "${opts.password}"
      )
       {
	      token,
	      validTo
        }
      }
  `;
  return config.gqlClient.mutate({ mutations: [mutation], token: '' });
}
