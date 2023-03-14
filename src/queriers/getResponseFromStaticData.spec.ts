import { MMGQL } from '..';
import { DEFAULT_TOKEN_NAME } from '../consts';
import { oneToMany, oneToOne, string } from '../dataTypes';
import { getMockConfig } from '../specUtilities';
import { QueryRecord } from '../types';
import {
  getResponseFromStaticData,
  StaticData,
} from './getResponseFromStaticData';

function setupTest() {
  const client = new MMGQL(getMockConfig());
  const attendeeNode = client.def({
    type: 'attendee',
    properties: {
      firstName: string,
      lastName: string,
    },
  });

  const teamNode = client.def({
    type: 'team',
    properties: {
      teamName: string,
    },
    relational: {
      members: () => oneToMany(attendeeNode),
    },
  });

  const meetingNode = client.def({
    type: 'meeting',
    properties: {
      meetingName: string,
    },
    relational: {
      attendees: () => oneToMany(attendeeNode),
      team: () => oneToOne(teamNode),
    },
  });

  const mockStaticData: StaticData = {
    [meetingNode.type]: {
      'meeting-1': {
        id: 'meeting-1',
        meetingName: 'Meeting 1',
        attendeeIds: ['attendee-1', 'attendee-2'],
      },
      'meeting-2': {
        id: 'meeting-2',
        meetingName: 'Meeting 2',
      },
    },
    [attendeeNode.type]: {
      'attendee-1': {
        id: 'attendee-1',
        firstName: 'John',
        lastName: 'Doe',
      },
      'attendee-2': {
        id: 'attendee-2',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    },
    [teamNode.type]: {
      'team-1': {
        id: 'team-1',
        teamName: 'Team 1',
        memberIds: ['attendee-1', 'attendee-2'],
      },
    },
  };

  return { meetingNode, teamNode, attendeeNode, mockStaticData };
}

test('returns null for null queryRecordEntry', () => {
  const { mockStaticData } = setupTest();

  expect(
    getResponseFromStaticData({
      queryRecord: {
        meetings: null,
      },
      staticData: mockStaticData,
    })
  ).toEqual({
    meetings: null,
  });
});

test('returns the correct data when a collection of nodes is requested', () => {
  const { mockStaticData, meetingNode } = setupTest();

  const queryRecord: QueryRecord = {
    meetings: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
    },
  };

  expect(
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticData,
    })
  ).toEqual({
    meetings: {
      nodes: [
        expect.objectContaining({
          id: 'meeting-1',
          meetingName: 'Meeting 1',
        }),
        expect.objectContaining({
          id: 'meeting-2',
          meetingName: 'Meeting 2',
        }),
      ],
    },
  });
});

test('returns the correct data when nodes are requested by id', () => {
  const { mockStaticData, meetingNode } = setupTest();

  const queryRecord: QueryRecord = {
    meetings: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      ids: ['meeting-1', 'meeting-2'],
    },
  };

  expect(
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticData,
    })
  ).toEqual({
    meetings: [
      expect.objectContaining({
        id: 'meeting-1',
        meetingName: 'Meeting 1',
      }),
      expect.objectContaining({
        id: 'meeting-2',
        meetingName: 'Meeting 2',
      }),
    ],
  });
});

test('returns the correct data when a node is requested by id', () => {
  const { mockStaticData, meetingNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
    },
  };

  expect(
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticData,
    })
  ).toEqual({
    meeting: expect.objectContaining({
      id: 'meeting-1',
      meetingName: 'Meeting 1',
    }),
  });
});

test('returns null when a node is requested by id and not found in static data', () => {
  const { mockStaticData, meetingNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'bogus',
    },
  };

  expect(
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticData,
    })
  ).toEqual({
    meeting: null,
  });
});
