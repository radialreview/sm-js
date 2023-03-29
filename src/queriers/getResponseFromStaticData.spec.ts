import { MMGQL } from '..';
import { DEFAULT_TOKEN_NAME } from '../consts';
import {
  nonPaginatedOneToMany,
  oneToMany,
  oneToOne,
  string,
} from '../dataTypes';
import { deepClone } from '../dataUtilities';
import { getMockConfig } from '../specUtilities';
import { QueryRecord } from '../types';
import {
  getResponseFromStaticData,
  StaticData,
  staticRelational,
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
      nonPaginatedAttendees: () => nonPaginatedOneToMany(attendeeNode),
      team: () => oneToOne(teamNode),
    },
  });

  const mockStaticData: StaticData = {
    [meetingNode.type]: {
      'meeting-1': {
        id: 'meeting-1',
        meetingName: 'Meeting 1',
        attendeeIds: ['attendee-1', 'attendee-2'],
        attendees: staticRelational('attendeeIds'),
        nonPaginatedAttendees: staticRelational('attendeeIds'),
        teamId: 'team-1',
        team: staticRelational('teamId'),
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
        members: staticRelational('memberIds'),
      },
    },
  };

  return { meetingNode, teamNode, attendeeNode, mockStaticData };
}

it('returns null for null queryRecordEntry', () => {
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

it('returns the correct data when a collection of nodes is requested', () => {
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
      pageInfo: {
        endCursor: '2',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '1',
        totalCount: 2,
        totalPages: 1,
      },
    },
  });
});

it('returns the correct data when nodes are requested by id', () => {
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
      pageInfo: {
        endCursor: '2',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '1',
        totalCount: 2,
        totalPages: 1,
      },
    },
  });
});

it('returns the correct data when a node is requested by id', () => {
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

it('returns the correct data when a node is requested by id and has relational data accessed', () => {
  const { mockStaticData, meetingNode, attendeeNode, teamNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
      relational: {
        attendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'attendees',
          oneToMany: true,
        },
        nonPaginatedAttendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'nonPaginatedAttendees',
          nonPaginatedOneToMany: true,
        },
        team: {
          def: teamNode,
          properties: ['id', 'teamName'],
          _relationshipName: 'team',
          oneToOne: true,
          relational: {
            members: {
              def: attendeeNode,
              properties: ['id', 'firstName', 'lastName'],
              _relationshipName: 'members',
              oneToMany: true,
            },
          },
        },
      },
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
      attendees: {
        nodes: [
          expect.objectContaining({
            id: 'attendee-1',
            firstName: 'John',
            lastName: 'Doe',
          }),
          expect.objectContaining({
            id: 'attendee-2',
            firstName: 'Jane',
            lastName: 'Doe',
          }),
        ],
        pageInfo: {
          endCursor: '2',
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          totalCount: 2,
          totalPages: 1,
        },
      },
      nonPaginatedAttendees: [
        expect.objectContaining({
          id: 'attendee-1',
          firstName: 'John',
          lastName: 'Doe',
        }),
        expect.objectContaining({
          id: 'attendee-2',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      ],
      team: expect.objectContaining({
        id: 'team-1',
        teamName: 'Team 1',
        members: {
          nodes: [
            expect.objectContaining({
              id: 'attendee-1',
              firstName: 'John',
              lastName: 'Doe',
            }),
            expect.objectContaining({
              id: 'attendee-2',
              firstName: 'Jane',
              lastName: 'Doe',
            }),
          ],
          pageInfo: {
            endCursor: '2',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '1',
            totalCount: 2,
            totalPages: 1,
          },
        },
      }),
    }),
  });
});

it('returns the correct data when switching through pages', () => {
  const { mockStaticData, meetingNode, attendeeNode, teamNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
      relational: {
        attendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'attendees',
          oneToMany: true,
          pagination: {
            startCursor: '1',
            endCursor: '2',
            itemsPerPage: 1,
          },
        },
        team: {
          def: teamNode,
          properties: ['id', 'teamName'],
          _relationshipName: 'team',
          oneToOne: true,
          relational: {
            members: {
              def: attendeeNode,
              properties: ['id', 'firstName', 'lastName'],
              _relationshipName: 'members',
              oneToMany: true,
              pagination: {
                startCursor: '1',
                endCursor: '2',
                itemsPerPage: 1,
              },
            },
          },
        },
      },
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
      attendees: {
        nodes: [
          expect.objectContaining({
            id: 'attendee-1',
            firstName: 'John',
            lastName: 'Doe',
          }),
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          totalCount: 2,
          totalPages: 2,
        },
      },
      team: expect.objectContaining({
        id: 'team-1',
        teamName: 'Team 1',
        members: {
          nodes: [
            expect.objectContaining({
              id: 'attendee-1',
              firstName: 'John',
              lastName: 'Doe',
            }),
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: '1',
            endCursor: '2',
            totalCount: 2,
            totalPages: 2,
          },
        },
      }),
    }),
  });

  const queryRecordClone = deepClone(queryRecord);
  if (queryRecordClone.meeting?.relational?.attendees.pagination) {
    queryRecordClone.meeting.relational.attendees.pagination.startCursor = '2';
  }
  if (
    queryRecordClone.meeting?.relational?.team?.relational?.members.pagination
  ) {
    queryRecordClone.meeting.relational.team.relational.members.pagination.startCursor =
      '2';
  }

  expect(
    getResponseFromStaticData({
      queryRecord: queryRecordClone,
      staticData: mockStaticData,
    })
  ).toEqual({
    meeting: expect.objectContaining({
      id: 'meeting-1',
      meetingName: 'Meeting 1',
      attendees: {
        nodes: [
          expect.objectContaining({
            id: 'attendee-2',
            firstName: 'Jane',
            lastName: 'Doe',
          }),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: '2',
          endCursor: '3',
          totalCount: 2,
          totalPages: 2,
        },
      },
      team: expect.objectContaining({
        id: 'team-1',
        teamName: 'Team 1',
        members: {
          nodes: [
            expect.objectContaining({
              id: 'attendee-2',
              firstName: 'Jane',
              lastName: 'Doe',
            }),
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: '2',
            endCursor: '3',
            totalCount: 2,
            totalPages: 2,
          },
        },
      }),
    }),
  });
});

it('returns the correct data when filtering a collection', () => {
  const { mockStaticData, meetingNode, attendeeNode, teamNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
      relational: {
        attendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'attendees',
          oneToMany: true,
          filter: {
            firstName: {
              eq: 'John',
            },
          },
        },
        nonPaginatedAttendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'nonPaginatedAttendees',
          nonPaginatedOneToMany: true,
          filter: {
            firstName: {
              eq: 'John',
            },
          },
        },
        team: {
          def: teamNode,
          properties: ['id', 'teamName'],
          _relationshipName: 'team',
          oneToOne: true,
          relational: {
            members: {
              def: attendeeNode,
              properties: ['id', 'firstName', 'lastName'],
              _relationshipName: 'members',
              oneToMany: true,
              filter: {
                firstName: {
                  eq: 'John',
                },
              },
            },
          },
        },
      },
    },
    meetings: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      filter: {
        meetingName: { eq: 'Meeting 1' },
      },
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
      attendees: {
        nodes: [
          expect.objectContaining({
            id: 'attendee-1',
            firstName: 'John',
            lastName: 'Doe',
          }),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          totalCount: 1,
          totalPages: 1,
        },
      },
      nonPaginatedAttendees: [
        expect.objectContaining({
          id: 'attendee-1',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ],
      team: expect.objectContaining({
        id: 'team-1',
        teamName: 'Team 1',
        members: {
          nodes: [
            expect.objectContaining({
              id: 'attendee-1',
              firstName: 'John',
              lastName: 'Doe',
            }),
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '1',
            endCursor: '2',
            totalCount: 1,
            totalPages: 1,
          },
        },
      }),
    }),
    meetings: {
      nodes: [
        expect.objectContaining({
          id: 'meeting-1',
          meetingName: 'Meeting 1',
        }),
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '1',
        endCursor: '2',
        totalCount: 1,
        totalPages: 1,
      },
    },
  });
});

it('returns the correct data when sorting a collection', () => {
  const { mockStaticData, meetingNode, attendeeNode, teamNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
      relational: {
        attendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'attendees',
          oneToMany: true,
          sort: {
            firstName: 'asc',
          },
        },
        nonPaginatedAttendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'nonPaginatedAttendees',
          nonPaginatedOneToMany: true,
          sort: {
            firstName: 'asc',
          },
        },
        team: {
          def: teamNode,
          properties: ['id', 'teamName'],
          _relationshipName: 'team',
          oneToOne: true,
          relational: {
            members: {
              def: attendeeNode,
              properties: ['id', 'firstName', 'lastName'],
              _relationshipName: 'members',
              oneToMany: true,
              sort: {
                firstName: 'asc',
              },
            },
          },
        },
      },
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
      attendees: {
        nodes: [
          expect.objectContaining({
            id: 'attendee-2',
            firstName: 'Jane',
            lastName: 'Doe',
          }),
          expect.objectContaining({
            id: 'attendee-1',
            firstName: 'John',
            lastName: 'Doe',
          }),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          totalCount: 2,
          totalPages: 1,
        },
      },
      nonPaginatedAttendees: [
        expect.objectContaining({
          id: 'attendee-2',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
        expect.objectContaining({
          id: 'attendee-1',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ],
      team: expect.objectContaining({
        id: 'team-1',
        teamName: 'Team 1',
        members: {
          nodes: [
            expect.objectContaining({
              id: 'attendee-2',
              firstName: 'Jane',
              lastName: 'Doe',
            }),
            expect.objectContaining({
              id: 'attendee-1',
              firstName: 'John',
              lastName: 'Doe',
            }),
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '1',
            endCursor: '2',
            totalCount: 2,
            totalPages: 1,
          },
        },
      }),
    }),
  });
});

it('returns the correct data when using an alias for a relationship', () => {
  const { mockStaticData, meetingNode, attendeeNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
      relational: {
        attendeesWithDifferentAlias: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'attendees',
          oneToMany: true,
        },
      },
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
      attendeesWithDifferentAlias: {
        nodes: [
          expect.objectContaining({
            id: 'attendee-1',
            firstName: 'John',
            lastName: 'Doe',
          }),
          expect.objectContaining({
            id: 'attendee-2',
            firstName: 'Jane',
            lastName: 'Doe',
          }),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '1',
          endCursor: '2',
          totalCount: 2,
          totalPages: 1,
        },
      },
    }),
  });
});

it('throws a helpful error when a node is not found using id', () => {
  const { mockStaticData, meetingNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'bogus-id',
    },
  };

  expect(() =>
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticData,
    })
  ).toThrow('No static data for node of type meeting with id "bogus-id"');
});

it('throws a helpful error when a related node is not found', () => {
  const { mockStaticData, meetingNode, attendeeNode, teamNode } = setupTest();

  const queryRecord: QueryRecord = {
    meeting: {
      def: meetingNode,
      properties: ['id', 'meetingName'],
      tokenName: DEFAULT_TOKEN_NAME,
      id: 'meeting-1',
      relational: {
        attendees: {
          def: attendeeNode,
          properties: ['id', 'firstName', 'lastName'],
          _relationshipName: 'attendees',
          oneToMany: true,
        },
        team: {
          def: teamNode,
          properties: ['id', 'teamName'],
          _relationshipName: 'team',
          oneToOne: true,
        },
      },
    },
  };

  const mockStaticDataWithNodeInOneToManyRelationship = deepClone(
    mockStaticData
  );
  delete mockStaticDataWithNodeInOneToManyRelationship[attendeeNode.type][
    'attendee-1'
  ];

  expect(() =>
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticDataWithNodeInOneToManyRelationship,
    })
  ).toThrow('No static data for node of type attendee with id "attendee-1"');

  const mockStaticDataWithMissingNodeInOneToOneRelationship = deepClone(
    mockStaticData
  );
  delete mockStaticDataWithMissingNodeInOneToOneRelationship[teamNode.type][
    'team-1'
  ];

  expect(() =>
    getResponseFromStaticData({
      queryRecord,
      staticData: mockStaticDataWithMissingNodeInOneToOneRelationship,
    })
  ).toThrow('No static data for node of type team with id "team-1"');
});
