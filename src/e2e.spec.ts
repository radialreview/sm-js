import { getDefaultConfig } from './config';
import { MMGQL } from './index';
import { queryDefinition, string } from './dataTypes';
import { DEFAULT_TOKEN_NAME } from './consts';
import { gql } from '@apollo/client';

test('queries users', async () => {
  const client = new MMGQL(getDefaultConfig());

  const userDef = client.def({
    type: 'user',
    properties: {
      firstName: string,
    },
  });

  const authResponse = await client.gqlClient.mutate({
    mutations: [
      gql`
        mutation authenticate {
          authenticate(
            username: "christopher.f+bloomdev@winterinternational.io"
            password: "Traction123$"
          ) {
            id
            token
          }
        }
      `,
    ],
    token: DEFAULT_TOKEN_NAME,
  });

  const token = authResponse[0].data.authenticate.token;

  client.setToken({ tokenName: DEFAULT_TOKEN_NAME, token });

  const { data } = await client.query({
    users: queryDefinition({
      def: userDef,
      map: ({ id, firstName }) => ({
        id,
        firstName,
      }),
    }),
  });

  console.log('data', data);
});
