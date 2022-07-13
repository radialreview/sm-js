import { children, getDefaultConfig, MMGQL, string } from 'mm-gql';
import { gql } from '@apollo/client/core';

const config = getDefaultConfig();

const mmGQL = new MMGQL(config);

export default mmGQL;

export const todoNode = mmGQL.def({
  type: 'todo',
  properties: {
    id: string,
    task: string,
  },
});

export const userNode = mmGQL.def({
  type: 'user',
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
