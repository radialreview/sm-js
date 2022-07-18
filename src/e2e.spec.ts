import { getDefaultConfig } from './config';
import { MMGQL } from './index';
import { oneToMany, queryDefinition, string } from './dataTypes';
import { DEFAULT_TOKEN_NAME } from './consts';

const client = new MMGQL(getDefaultConfig());

const measurableDef = client.def({
  type: 'measurable',
  properties: {
    id: string,
    title: string,
  },
});

const userDef = client.def({
  type: 'user',
  properties: {
    id: string,
    firstName: string,
  },
  relational: {
    measurables: () => oneToMany(measurableDef),
  },
});

client.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'test' });

// test('makes a query', async () => {
//   const { data } = await client.query({
//     measurables: measurableDef,
//   });

//   console.log('data', data);
// });

test('queries users and measurables', async () => {
  const { data } = await client.query({
    users: queryDefinition({
      def: userDef,
      map: ({ id, measurables, firstName }) => ({
        id,
        firstName,
        // measurables: measurables({
        //   map: ({ id, title }) => ({ id, title }),
        // }),
      }),
    }),
  });

  `
    query SomeTitle {
        users {
            id
         
        }
    }
 `;

  console.log('data', data);
});
