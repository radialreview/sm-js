import {
  EPaginationFilteringSortingInstance,
  getGQLCLient,
  gql,
  MMGQL,
} from './index';
import { oneToMany, queryDefinition, string } from './dataTypes';

test.skip('makes a query', async () => {
  const { mmGQLClient, userNode, orgUserId } = await setupE2ETests();

  const { data } = await mmGQLClient.query({
    user: queryDefinition({
      def: userNode,
      map: ({ meetings }) => ({
        meetings: meetings({
          map: ({ name }) => ({ name }),
        }),
      }),
      target: {
        id: orgUserId,
      },
    }),
  });

  expect(data).toMatchInlineSnapshot(`
    Object {
      "user": Object {
        "id": 635381,
        "lastUpdatedBy": null,
        "meetings": NodesCollection {
          "clientSidePageInfo": Object {
            "lastQueriedPage": 1,
            "pageSize": 10,
          },
          "items": Array [
            Object {
              "id": 88677,
              "lastUpdatedBy": null,
              "name": "WI Leadership Team",
              "type": "meeting",
              "version": 0,
            },
            Object {
              "id": 88685,
              "lastUpdatedBy": null,
              "name": "Meida's meeting by Chris",
              "type": "meeting",
              "version": 0,
            },
          ],
          "loadingError": null,
          "loadingState": "IDLE",
          "onGoToNextPage": [Function],
          "onGoToPreviousPage": [Function],
          "onLoadMoreResults": [Function],
          "onPaginationRequestStateChanged": [Function],
          "pageInfoFromResults": Object {
            "__typename": "PageInfo",
            "endCursor": "MQ==",
            "hasNextPage": false,
            "hasPreviousPage": false,
            "startCursor": "MA==",
          },
          "pagesBeingDisplayed": Array [
            1,
          ],
          "useServerSidePaginationFilteringSorting": true,
        },
        "type": "user",
        "version": 0,
      },
    }
  `);
});

test.skip('starts a subscription', async done => {
  const { gqlClient, cookie } = await setupE2ETests();

  gqlClient.subscribe({
    gql: gql`
      subscription {
        meeting(id: 88677) {
          ... on Updated_Meeting {
            __typename
            id
            value {
              id
              version
              lastUpdatedBy
              name
              archived
            }
          }

          ... on Created_Headline {
            __typename
            id
            value {
              id
              title
            }
          }

          ... on Updated_Headline {
            __typename
            id
            value {
              id
              title
              archived
            }
          }

          ... on Deleted_Headline {
            id
          }

          ... on Inserted_Meeting_Headline {
            __typename
            target {
              id
              property
            }
            value {
              id
              title
              archived
            }
          }

          ... on UpdatedAssociation_Headline_User {
            __typename
            target {
              id
              property
            }
            value {
              id
              attendeeId
            }
          }
        }
      }
    `,
    cookie,
    onMessage: message => {
      expect(message).toMatchSnapshot('subscription message');
      done();
    },
    onError: error => {
      console.log('error in sub', error);
      done(error);
    },
  });

  try {
    await gqlClient.mutate({
      mutations: [
        gql`
          mutation createHeadlineMutation {
            CreateHeadline(
              input: {
                title: "test headline"
                archived: false
                archivedTimestamp: null
                assignee: 635381
                notesId: "8677"
                meetings: [88677]
              }
            ) {
              id
            }
          }
        `,
      ],
      cookie,
    });
  } catch (error) {
    console.log('error in mutation', error);
    done(error);
  }
});

async function acquireCookie() {
  const loginPageRequest = await fetch(`${BASE_URL}/Account/Login`, {
    method: 'POST',
  });

  const loginPageCookie = (loginPageRequest.headers as any).raw()['set-cookie'];

  const antiforgeryTokenRegex = /<input name="__RequestVerificationToken" type="hidden" value="(.*)" \/>/;

  const antiforgeryTokenMatch = antiforgeryTokenRegex.exec(
    await loginPageRequest.text()
  );

  if (!antiforgeryTokenMatch) throw Error('Failed to aquire antiforgery token');

  const antiforgeryToken = antiforgeryTokenMatch?.[1];

  const loginCookieParsed = loginPageCookie.join('; ');

  const details = {
    UserName: 'meida.m+devtest2@winterinternational.io',
    Password: '*K1p^2VJvDiSyduRIxZu#vF2JX',
    RememberMe: false,
    __RequestVerificationToken: antiforgeryToken as string,
  };

  const formBody: Array<string> = [];
  for (const property in details) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(
      details[property as keyof typeof details]
    );
    formBody.push(encodedKey + '=' + encodedValue);
  }

  const response = await fetch(`${BASE_URL}/Account/SubmitLogin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: loginCookieParsed,
    },
    body: formBody.join('&'),
  });

  const loginResponseCookie = (response.headers as any).raw()['set-cookie'];

  const loginResponseCookieParsed = loginResponseCookie.join('; ');

  if (!loginResponseCookieParsed) throw Error('Failed to aquire cookie');

  return {
    cookie: loginResponseCookieParsed,
  };
}

const BASE_URL = 'https://dev.bloomgrowth.com';
const WS_BASE_URL = BASE_URL.replace('https', 'wss').replace('http', 'ws');

export async function setupE2ETests() {
  const { cookie } = await acquireCookie();

  const logging = {
    gqlQueries: false,
    gqlMutations: false,
    gqlSubscriptions: false,
    gqlSubscriptionErrors: false,
    querySlimming: false,
  };

  const gqlClient = getGQLCLient({
    httpUrl: `${BASE_URL}/graphql/`,
    wsUrl: `${WS_BASE_URL}/graphql/`,
    logging,
    getCookie: () => cookie,
  });

  const mmGQLClient = new MMGQL({
    gqlClient,
    generateMockData: false,
    enableQuerySlimming: false,
    paginationFilteringSortingInstance:
      EPaginationFilteringSortingInstance.SERVER,
    mockDataType: 'random',
    staticData: undefined,
    getMockDataDelay: () => 0,
    logging,
  });

  const getAuthenticatedUserIdResponse = await mmGQLClient.gqlClient.mutate({
    mutations: [
      gql`
        mutation {
          userId: getAuthenticatedUserId
        }
      `,
    ],
    cookie,
  });

  const orgUserId = String(getAuthenticatedUserIdResponse?.[0]?.data?.userId);

  if (!orgUserId) {
    throw new Error('User is not authenticated');
  }

  const userNode = mmGQLClient.def({
    type: 'user',
    properties: {
      firstName: string,
      lastName: string,
    },
    relational: {
      meetings: () => oneToMany(meetingNode),
    },
  });

  const meetingNode = mmGQLClient.def({
    type: 'meeting',
    properties: {
      name: string,
    },
  });

  return { mmGQLClient, meetingNode, userNode, orgUserId, gqlClient, cookie };
}
