import { children, getDefaultConfig, SMJS, string } from 'sm-js';
import { gql } from '@apollo/client/core';

const config = getDefaultConfig();

const smJS = new SMJS(config);

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

export async function authenticateWithAPI(opts: {
  email: string;
  password: string;
}): Promise<string> {
  const data = await fetch(
    'https://appservice.dev02.tt-devs.com/api/user/login',
    {
      method: 'POST',
      headers: {
        applicationId: '1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: opts.email,
        password: opts.password,
        timeZone: null,
      }),
    }
  )
    .then((res: any) => {
      return res.json();
    })
    .catch(console.log);

  if (!data.orgUserToken) throw Error('Failed to get token');
  return data.orgUserToken as string;
}
