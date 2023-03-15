import {
  EPaginationFilteringSortingInstance,
  getGQLCLient,
  gql,
  MMGQL,
} from './index';
import { oneToMany, queryDefinition, string } from './dataTypes';
import { DEFAULT_TOKEN_NAME } from './consts';

test('makes a query', async () => {
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

test.only('starts a subscription', async done => {
  const { gqlClient, token } = await setupE2ETests();

  gqlClient.subscribe({
    gql: gql`
      subscription {
        meetings(prefix: "chris") {
          id
          version
          lastUpdatedBy
          lastUpdatedClientTimestamp
          name
          favoritedTimestamp
          favoritedSortingPosition
          userIsAttendee
          meetingType
          videoConferenceLink
          ratingPrivacy
          idsVoting
          expectedMeetingDurationFromAgendaInMinutes
          userId
          email
          scheduledStartTime
          scheduledEndTime
        }
      }
    `,
    token,
    onMessage: message => {
      console.log('message', message);
      done();
    },
    onError: error => {
      console.log('error in sub');
      console.log('error', error);
      done(error);
    },
  });

  try {
    await gqlClient.mutate({
      mutations: [
        gql`
          mutation {
            meida_fake_meeting(
              id: 1
              version: 1
              lastUpdatedBy: "chris"
              lastUpdatedClientTimestamp: 100
              name: "chris Leadership"
              favoritedTimestamp: 50.0
              favoritedSortingPosition: 1
              userIsAttendee: true
              meetingType: ""
              videoConferenceLink: "/link"
              ratingPrivacy: ""
              idsVoting: ""
              issueVoting: ""
              expectedMeetingDurationFromAgendaInMinutes: 5
              userId: 1
              email: "me@home.net"
              scheduledStartTime: 1.0
              scheduledEndTime: 2.0
            ) {
              id
              version
              lastUpdatedBy
              lastUpdatedClientTimestamp
              name
              favoritedTimestamp
              favoritedSortingPosition
              userIsAttendee
              meetingType
              videoConferenceLink
              ratingPrivacy
              idsVoting
              expectedMeetingDurationFromAgendaInMinutes
              userId
              email
              scheduledStartTime
              scheduledEndTime
            }
          }
        `,
      ],
      token,
    });
  } catch (e) {
    console.log('error in mutation');
    console.log('e', e);
    done(e);
  }
});

async function acquireToken() {
  const details = {
    userName: 'meida.m+devtest2@winterinternational.io',
    password: '*K1p^2VJvDiSyduRIxZu#vF2JX',
    grant_type: 'password',
  };

  const formBody: Array<string> = [];
  for (const property in details) {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(
      details[property as keyof typeof details]
    );
    formBody.push(encodedKey + '=' + encodedValue);
  }

  const response = await fetch(`${BASE_URL}/Token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.join('&'),
  });

  const token = (await response.json()).access_token;

  if (!token) throw Error('Failed to aquire token');

  console.log('/n TOKEN ', token);
  return token;
}

const BASE_URL = 'https://dev.bloomgrowth.com';
const WS_BASE_URL = BASE_URL.replace('https', 'wss').replace('http', 'ws');

export async function setupE2ETests() {
  const token = await acquireToken();

  const logging = {
    gqlClientQueries: false,
    gqlClientMutations: false,
    gqlClientSubscriptions: false,
    querySlimming: false,
  };

  const gqlClient = getGQLCLient({
    httpUrl: `${BASE_URL}/graphql/`,
    wsUrl: `${WS_BASE_URL}/graphql/`,
    logging,
  });

  const mmGQLClient = new MMGQL({
    gqlClient,
    generateMockData: false,
    enableQuerySlimming: false,
    paginationFilteringSortingInstance:
      EPaginationFilteringSortingInstance.SERVER,
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
    token,
  });

  const orgUserId = String(getAuthenticatedUserIdResponse?.[0]?.data?.userId);

  if (!orgUserId) {
    throw new Error('User is not authenticated');
  }

  mmGQLClient.setToken({
    tokenName: DEFAULT_TOKEN_NAME,
    token,
  });

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

  return { mmGQLClient, meetingNode, userNode, orgUserId, gqlClient, token };
}
