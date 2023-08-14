import { MMGQL, QueryRecord, QueryRecordEntry } from '..';
import { DEFAULT_TOKEN_NAME } from '../consts';
import { string, boolean } from '../dataTypes';
import { QuerySlimmer } from './QuerySlimmer';
import { getMockConfig } from '../specUtilities';

// import {
//   QuerySlimmer,
//   TInFlightQueriesByContextMap,
//   TQueryRecordByContextMap,
// } from './QuerySlimmer';

function setupTests() {
  const mmGQL = new MMGQL(getMockConfig());

  const userNode = mmGQL.def({
    type: 'user',
    properties: {
      firstName: string,
      lastName: string,
      email: string,
    },
  });
  const meetingNode = mmGQL.def({
    type: 'meeting',
    properties: {
      name: string,
      archived: boolean,
      isAgendaInitialized: boolean,
    },
  });
  const todoNode = mmGQL.def({
    type: 'todo',
    properties: {
      task: string,
      done: boolean,
    },
  });
  const headlineNode = mmGQL.def({
    type: 'headline',
    properties: {
      title: string,
      archived: boolean,
    },
  });

  const pageInfo = {
    endCursor: 'MA==',
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: 'MA==',
    __typename: 'PageInfo',
  };

  return {
    QuerySlimmer: new QuerySlimmer(mmGQL),
    userNode,
    meetingNode,
    todoNode,
    headlineNode,
    pageInfo,
  };
}

describe('cacheNewData', () => {
  test('it should cache all QueryRecordEntries and relational entries under their own separate context keys and correctly update subscription counts for each property', () => {
    const {
      QuerySlimmer,
      userNode,
      todoNode,
      meetingNode,
      headlineNode,
      pageInfo,
    } = setupTests();

    const mockQueryRecord: QueryRecord = {
      user: {
        def: userNode,
        id: 'aidan-id',
        properties: ['id', 'firstName', 'lastName'],
        relational: {
          todos: {
            def: todoNode,
            oneToMany: true,
            _relationshipName: 'todos',
            properties: ['id', 'task'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName', 'lastName'],
              },
            },
          },
          headlines: {
            def: headlineNode,
            oneToMany: true,
            _relationshipName: 'headlines',
            properties: ['id', 'title'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName', 'lastName'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
      users: {
        def: userNode,
        ids: ['aidan-id', 'piotr-id'],
        properties: ['id', 'firstName', 'lastName'],
        relational: {
          meeting: {
            def: meetingNode,
            oneToOne: true,
            _relationshipName: 'meeting',
            properties: ['id', 'name'],
            relational: {
              todos: {
                def: todoNode,
                oneToMany: true,
                _relationshipName: 'todos',
                properties: ['id', 'task'],
              },
              headlines: {
                def: headlineNode,
                oneToMany: true,
                _relationshipName: 'headlines',
                properties: ['id', 'title'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockRequestResponse = {
      user: {
        id: 'aidan-id',
        type: userNode,
        firstName: 'Aidan',
        lastName: 'Goodman',
        todos: {
          pageInfo: pageInfo,
          nodes: [
            {
              id: 'aidan-todo-id-1',
              type: todoNode.type,
              task: 'aidan-todo-task-1',
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
            {
              id: 'aidan-todo-id-2',
              type: todoNode.type,
              task: 'aidan-todo-task-2',
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
          ],
        },
        headlines: {
          pageInfo: pageInfo,
          nodes: [
            {
              id: 'aidan-headline-id-1',
              type: headlineNode.type,
              title: 'aidan-headline-title-1',
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
            {
              id: 'aidan-headline-id-2',
              type: headlineNode.type,
              title: 'aidan-headline-title-2',
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
          ],
        },
      },
      users: {
        pageInfo: pageInfo,
        nodes: [
          {
            id: 'aidan-id',
            type: userNode.type,
            firstName: 'Aidan',
            lastName: 'Goodman',
            meeting: {
              id: 'aidan-meeting-id-1',
              type: meetingNode,
              name: 'aidan-meeting-1',
              todos: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'aidan-todo-id-1',
                    type: todoNode.type,
                    task: 'aidan-todo-task-1',
                  },
                  {
                    id: 'aidan-todo-id-2',
                    type: todoNode.type,
                    task: 'aidan-todo-task-2',
                  },
                ],
              },
              headlines: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'aidan-headline-id-1',
                    type: headlineNode.type,
                    title: 'aidan-headline-task-1',
                  },
                  {
                    id: 'aidan-headline-id-2',
                    type: headlineNode.type,
                    title: 'aidan-headline-task-2',
                  },
                ],
              },
            },
          },
          {
            id: 'piotr-id',
            type: userNode.type,
            firstName: 'Piotr',
            lastName: 'Bogun',
            meeting: {
              id: 'piotr-meeting-id-1',
              type: meetingNode,
              name: 'piotr-meeting-1',
              todos: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'piotr-todo-id-1',
                    type: todoNode.type,
                    task: 'piotr-todo-task-1',
                  },
                  {
                    id: 'piotr-todo-id-2',
                    type: todoNode.type,
                    task: 'piotr-todo-task-2',
                  },
                ],
              },
              headlines: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'piotr-headline-id-1',
                    type: headlineNode.type,
                    title: 'piotr-headline-task-1',
                  },
                  {
                    id: 'piotr-headline-id-2',
                    type: headlineNode.type,
                    title: 'piotr-headline-task-2',
                  },
                ],
              },
            },
          },
        ],
      },
    };

    QuerySlimmer.cacheNewData(mockQueryRecord, mockRequestResponse);

    const expectedCache = {
      'user({"id":"aidan-id"})': {
        subscriptionsByProperty: { id: 1, firstName: 1, lastName: 1 },
        results: {
          byParentId: false,
          user: {
            id: 'aidan-id',
            firstName: 'Aidan',
            lastName: 'Goodman',
          },
        },
      },
      'user({"id":"aidan-id"}).todos(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, task: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            todos: {
              pageInfo: pageInfo,
              nodes: [
                {
                  id: 'aidan-todo-id-1',
                  task: 'aidan-todo-task-1',
                },
                {
                  id: 'aidan-todo-id-2',
                  task: 'aidan-todo-task-2',
                },
              ],
            },
          },
        },
      },
      'user({"id":"aidan-id"}).headlines(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, title: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            headlines: {
              pageInfo: pageInfo,
              nodes: [
                {
                  id: 'aidan-headline-id-1',
                  title: 'aidan-headline-title-1',
                },
                {
                  id: 'aidan-headline-id-2',
                  title: 'aidan-headline-title-2',
                },
              ],
            },
          },
        },
      },
      'user({"id":"aidan-id"}).todos(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1, lastName: 1 },
        results: {
          byParentId: true,
          'aidan-todo-id-1': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
          'aidan-todo-id-2': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
        },
      },
      'user({"id":"aidan-id"}).headlines(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1, lastName: 1 },
        results: {
          byParentId: true,
          'aidan-headline-id-1': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
          'aidan-headline-id-2': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]})': {
        subscriptionsByProperty: { id: 1, firstName: 1, lastName: 1 },
        results: {
          byParentId: false,
          users: {
            pageInfo: pageInfo,
            nodes: [
              {
                id: 'aidan-id',
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
              {
                id: 'piotr-id',
                firstName: 'Piotr',
                lastName: 'Bogun',
              },
            ],
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, name: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            meeting: {
              id: 'aidan-meeting-id-1',
              name: 'aidan-meeting-1',
            },
          },
          'piotr-id': {
            meeting: {
              id: 'piotr-meeting-id-1',
              name: 'piotr-meeting-1',
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS).todos(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, task: 1 },
        results: {
          byParentId: true,
          'aidan-meeting-id-1': {
            todos: {
              pageInfo: pageInfo,
              nodes: [
                {
                  id: 'aidan-todo-id-1',
                  task: 'aidan-todo-task-1',
                },
                {
                  id: 'aidan-todo-id-2',
                  task: 'aidan-todo-task-2',
                },
              ],
            },
          },
          'piotr-meeting-id-1': {
            todos: {
              pageInfo: pageInfo,
              nodes: [
                {
                  id: 'piotr-todo-id-1',
                  task: 'piotr-todo-task-1',
                },
                {
                  id: 'piotr-todo-id-2',
                  task: 'piotr-todo-task-2',
                },
              ],
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS).headlines(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, title: 1 },
        results: {
          byParentId: true,
          'aidan-meeting-id-1': {
            headlines: {
              pageInfo: pageInfo,
              nodes: [
                {
                  id: 'aidan-headline-id-1',
                  title: 'aidan-headline-task-1',
                },
                {
                  id: 'aidan-headline-id-2',
                  title: 'aidan-headline-task-2',
                },
              ],
            },
          },
          'piotr-meeting-id-1': {
            headlines: {
              pageInfo: pageInfo,
              nodes: [
                {
                  id: 'piotr-headline-id-1',
                  title: 'piotr-headline-task-1',
                },
                {
                  id: 'piotr-headline-id-2',
                  title: 'piotr-headline-task-2',
                },
              ],
            },
          },
        },
      },
    };

    expect(QuerySlimmer.queriesByContext).toEqual(expectedCache);
  });

  test('it should not remove any data that is already cached, only adding/updating new data', () => {
    const {
      QuerySlimmer,
      userNode,
      todoNode,
      meetingNode,
      headlineNode,
      pageInfo,
    } = setupTests();

    QuerySlimmer.queriesByContext = {
      'user({"id":"aidan-id"})': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: false,
          user: {
            id: 'aidan-id',
            firstName: 'Aidan',
          },
        },
      },
      'user({"id":"aidan-id"}).todos(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, task: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            todos: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-todo-id-1',
                  task: 'aidan-todo-task-1',
                },
                {
                  id: 'aidan-todo-id-2',
                  task: 'aidan-todo-task-2',
                },
              ],
            },
          },
        },
      },
      'user({"id":"aidan-id"}).headlines(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, title: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            headlines: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-headline-id-1',
                  title: 'aidan-headline-title-1',
                },
                {
                  id: 'aidan-headline-id-2',
                  title: 'aidan-headline-title-2',
                },
              ],
            },
          },
        },
      },
      'user({"id":"aidan-id"}).todos(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: true,
          'aidan-todo-id-1': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
            },
          },
          'aidan-todo-id-2': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
            },
          },
        },
      },
      'user({"id":"aidan-id"}).headlines(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: true,
          'aidan-headline-id-1': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
            },
          },
          'aidan-headline-id-2': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]})': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: false,
          users: {
            pageInfo,
            nodes: [
              {
                id: 'aidan-id',
                firstName: 'Aidan',
              },
              {
                id: 'piotr-id',
                firstName: 'Piotr',
              },
            ],
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, name: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            meeting: {
              id: 'aidan-meeting-id-1',
              name: 'aidan-meeting-1',
            },
          },
          'piotr-id': {
            meeting: {
              id: 'piotr-meeting-id-1',
              name: 'piotr-meeting-1',
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS).todos(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, task: 1 },
        results: {
          byParentId: true,
          'aidan-meeting-id-1': {
            todos: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-todo-id-1',
                  task: 'aidan-todo-task-1',
                },
                {
                  id: 'aidan-todo-id-2',
                  task: 'aidan-todo-task-2',
                },
              ],
            },
          },
          'piotr-meeting-id-1': {
            todos: {
              pageInfo,
              nodes: [
                {
                  id: 'piotr-todo-id-1',
                  task: 'piotr-todo-task-1',
                },
                {
                  id: 'piotr-todo-id-2',
                  task: 'piotr-todo-task-2',
                },
              ],
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS).headlines(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, title: 1 },
        results: {
          byParentId: true,
          'aidan-meeting-id-1': {
            headlines: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-headline-id-1',
                  title: 'aidan-headline-task-1',
                },
                {
                  id: 'aidan-headline-id-2',
                  title: 'aidan-headline-task-2',
                },
              ],
            },
          },
          'piotr-meeting-id-1': {
            headlines: {
              pageInfo,
              nodes: [
                {
                  id: 'piotr-headline-id-1',
                  title: 'piotr-headline-task-1',
                },
                {
                  id: 'piotr-headline-id-2',
                  title: 'piotr-headline-task-2',
                },
              ],
            },
          },
        },
      },
    };

    const mockQueryRecord: QueryRecord = {
      user: {
        def: userNode,
        id: 'aidan-id',
        properties: ['id', 'lastName'],
        relational: {
          todos: {
            def: todoNode,
            oneToMany: true,
            _relationshipName: 'todos',
            properties: ['id', 'done'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'lastName'],
              },
            },
          },
          headlines: {
            def: headlineNode,
            oneToMany: true,
            _relationshipName: 'headlines',
            properties: ['id', 'archived'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'lastName'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
      users: {
        def: userNode,
        ids: ['aidan-id', 'piotr-id'],
        properties: ['id', 'lastName'],
        relational: {
          meeting: {
            def: meetingNode,
            oneToOne: true,
            _relationshipName: 'meeting',
            properties: ['id', 'archived'],
            relational: {
              todos: {
                def: todoNode,
                oneToMany: true,
                _relationshipName: 'todos',
                properties: ['id', 'done'],
              },
              headlines: {
                def: headlineNode,
                oneToMany: true,
                _relationshipName: 'headlines',
                properties: ['id', 'archived'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockRequestResponse = {
      user: {
        id: 'aidan-id',
        type: userNode,
        lastName: 'Goodman',
        todos: {
          pageInfo,
          nodes: [
            {
              id: 'aidan-todo-id-1',
              type: todoNode.type,
              done: false,
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                lastName: 'Goodman',
              },
            },
            {
              id: 'aidan-todo-id-2',
              type: todoNode.type,
              done: false,
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                lastName: 'Goodman',
              },
            },
          ],
        },
        headlines: {
          pageInfo,
          nodes: [
            {
              id: 'aidan-headline-id-1',
              type: headlineNode.type,
              archived: false,
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                lastName: 'Goodman',
              },
            },
            {
              id: 'aidan-headline-id-2',
              type: headlineNode.type,
              archived: false,
              assignee: {
                id: 'aidan-id',
                type: userNode.type,
                lastName: 'Goodman',
              },
            },
          ],
        },
      },
      users: {
        pageInfo,
        nodes: [
          {
            id: 'aidan-id',
            type: userNode.type,
            lastName: 'Goodman',
            meeting: {
              id: 'aidan-meeting-id-1',
              type: meetingNode,
              archived: false,
              todos: {
                pageInfo,
                nodes: [
                  {
                    id: 'aidan-todo-id-1',
                    type: todoNode.type,
                    done: false,
                  },
                  {
                    id: 'aidan-todo-id-2',
                    type: todoNode.type,
                    done: false,
                  },
                ],
              },
              headlines: {
                pageInfo,
                nodes: [
                  {
                    id: 'aidan-headline-id-1',
                    type: headlineNode.type,
                    archived: false,
                  },
                  {
                    id: 'aidan-headline-id-2',
                    type: headlineNode.type,
                    archived: false,
                  },
                ],
              },
            },
          },
          {
            id: 'piotr-id',
            type: userNode.type,
            lastName: 'Bogun',
            meeting: {
              id: 'piotr-meeting-id-1',
              type: meetingNode,
              archived: false,
              todos: {
                pageInfo,
                nodes: [
                  {
                    id: 'piotr-todo-id-1',
                    type: todoNode.type,
                    done: false,
                  },
                  {
                    id: 'piotr-todo-id-2',
                    type: todoNode.type,
                    done: false,
                  },
                ],
              },
              headlines: {
                pageInfo,
                nodes: [
                  {
                    id: 'piotr-headline-id-1',
                    type: headlineNode.type,
                    archived: false,
                  },
                  {
                    id: 'piotr-headline-id-2',
                    type: headlineNode.type,
                    archived: false,
                  },
                ],
              },
            },
          },
        ],
      },
    };

    QuerySlimmer.cacheNewData(mockQueryRecord, mockRequestResponse);

    const expectedCache = {
      'user({"id":"aidan-id"})': {
        subscriptionsByProperty: { id: 2, firstName: 1, lastName: 1 },
        results: {
          byParentId: false,
          user: {
            id: 'aidan-id',
            firstName: 'Aidan',
            lastName: 'Goodman',
          },
        },
      },
      'user({"id":"aidan-id"}).todos(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, task: 1, done: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            todos: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-todo-id-1',
                  task: 'aidan-todo-task-1',
                  done: false,
                },
                {
                  id: 'aidan-todo-id-2',
                  task: 'aidan-todo-task-2',
                  done: false,
                },
              ],
            },
          },
        },
      },
      'user({"id":"aidan-id"}).headlines(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, title: 1, archived: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            headlines: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-headline-id-1',
                  title: 'aidan-headline-title-1',
                  archived: false,
                },
                {
                  id: 'aidan-headline-id-2',
                  title: 'aidan-headline-title-2',
                  archived: false,
                },
              ],
            },
          },
        },
      },
      'user({"id":"aidan-id"}).todos(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, firstName: 1, lastName: 1 },
        results: {
          byParentId: true,
          'aidan-todo-id-1': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
          'aidan-todo-id-2': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
        },
      },
      'user({"id":"aidan-id"}).headlines(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, firstName: 1, lastName: 1 },
        results: {
          byParentId: true,
          'aidan-headline-id-1': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
          'aidan-headline-id-2': {
            assignee: {
              id: 'aidan-id',
              firstName: 'Aidan',
              lastName: 'Goodman',
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]})': {
        subscriptionsByProperty: { id: 2, firstName: 1, lastName: 1 },
        results: {
          byParentId: false,
          users: {
            pageInfo,
            nodes: [
              {
                id: 'aidan-id',
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
              {
                id: 'piotr-id',
                firstName: 'Piotr',
                lastName: 'Bogun',
              },
            ],
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, name: 1, archived: 1 },
        results: {
          byParentId: true,
          'aidan-id': {
            meeting: {
              id: 'aidan-meeting-id-1',
              name: 'aidan-meeting-1',
              archived: false,
            },
          },
          'piotr-id': {
            meeting: {
              id: 'piotr-meeting-id-1',
              name: 'piotr-meeting-1',
              archived: false,
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS).todos(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, task: 1, done: 1 },
        results: {
          byParentId: true,
          'aidan-meeting-id-1': {
            todos: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-todo-id-1',
                  task: 'aidan-todo-task-1',
                  done: false,
                },
                {
                  id: 'aidan-todo-id-2',
                  task: 'aidan-todo-task-2',
                  done: false,
                },
              ],
            },
          },
          'piotr-meeting-id-1': {
            todos: {
              pageInfo,
              nodes: [
                {
                  id: 'piotr-todo-id-1',
                  task: 'piotr-todo-task-1',
                  done: false,
                },
                {
                  id: 'piotr-todo-id-2',
                  task: 'piotr-todo-task-2',
                  done: false,
                },
              ],
            },
          },
        },
      },
      'users({"ids":["aidan-id","piotr-id"]}).meeting(NO_PARAMS).headlines(NO_PARAMS)': {
        subscriptionsByProperty: { id: 2, title: 1, archived: 1 },
        results: {
          byParentId: true,
          'aidan-meeting-id-1': {
            headlines: {
              pageInfo,
              nodes: [
                {
                  id: 'aidan-headline-id-1',
                  title: 'aidan-headline-task-1',
                  archived: false,
                },
                {
                  id: 'aidan-headline-id-2',
                  title: 'aidan-headline-task-2',
                  archived: false,
                },
              ],
            },
          },
          'piotr-meeting-id-1': {
            headlines: {
              pageInfo,
              nodes: [
                {
                  id: 'piotr-headline-id-1',
                  title: 'piotr-headline-task-1',
                  archived: false,
                },
                {
                  id: 'piotr-headline-id-2',
                  title: 'piotr-headline-task-2',
                  archived: false,
                },
              ],
            },
          },
        },
      },
    };

    expect(QuerySlimmer.queriesByContext).toEqual(expectedCache);
  });

  test('it should handle caching data that returns null and not creat cache records for child relational data', () => {
    const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

    const mockQueryRecord: QueryRecord = {
      meeting: {
        id: 'meeting_id',
        def: meetingNode,
        properties: ['id', 'name'],
        tokenName: DEFAULT_TOKEN_NAME,
        relational: {
          assignee: {
            def: userNode,
            oneToOne: true,
            _relationshipName: 'assignee',
            properties: ['id', 'firstName'],
            relational: {
              todos: {
                def: todoNode,
                oneToMany: true,
                _relationshipName: 'todos',
                properties: ['id', 'task'],
              },
            },
          },
        },
      },
    };
    const mockRequestResponse = {
      meeting: {
        id: 'meeting_id',
        name: 'Meeting Name',
        assignee: null,
      },
    };

    QuerySlimmer.cacheNewData(mockQueryRecord, mockRequestResponse);

    const expectedCache = {
      'meeting({"id":"meeting_id"})': {
        subscriptionsByProperty: { id: 1, name: 1 },
        results: {
          byParentId: false,
          meeting: {
            id: 'meeting_id',
            name: 'Meeting Name',
          },
        },
      },
      'meeting({"id":"meeting_id"}).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: true,
          meeting_id: {
            assignee: null,
          },
        },
      },
    };

    expect(QuerySlimmer.queriesByContext).toEqual(expectedCache);
  });

  test.only('it should handle non paginated array relationships', () => {
    const {
      QuerySlimmer,
      meetingNode,
      todoNode,
      headlineNode,
      userNode,
    } = setupTests();

    const mockQueryRecord: QueryRecord = {
      meeting: {
        id: 'meeting_id',
        def: meetingNode,
        properties: ['id', 'name'],
        tokenName: DEFAULT_TOKEN_NAME,
        relational: {
          todos: {
            def: todoNode,
            nonPaginatedOneToMany: true,
            _relationshipName: 'todos_nonPaginated',
            properties: ['id', 'task'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName'],
              },
            },
          },
          headlines: {
            def: headlineNode,
            nonPaginatedOneToMany: true,
            _relationshipName: 'headlines_nonPaginated',
            properties: ['id', 'title'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName'],
              },
            },
          },
        },
      },
    };
    const mockRequestResponse = {
      meeting: {
        id: 'meeting-id',
        name: 'Meeting Name',
        todos: [
          {
            id: 'todo-id-1',
            task: 'todo-task-1',
            assignee: { id: 'todo-assignee-1', firstName: 'Peter' },
          },
          {
            id: 'todo-id-2',
            task: 'todo-task-2',
            assignee: { id: 'todo-assignee-2', firstName: 'Peter' },
          },
        ],
        headlines: [
          {
            id: 'headline-id-1',
            title: 'headline-title-1',
            assignee: { id: 'headline-assignee-1', firstName: 'Peter' },
          },
          {
            id: 'headline-id-2',
            title: 'headline-title-2',
            assignee: { id: 'headline-assignee-2', firstName: 'Peter' },
          },
        ],
      },
    };

    QuerySlimmer.cacheNewData(mockQueryRecord, mockRequestResponse);

    const expectedCache = {
      'meeting({"id":"meeting_id"})': {
        subscriptionsByProperty: { id: 1, name: 1 },
        results: {
          byParentId: false,
          meeting: {
            id: 'meeting-id',
            name: 'Meeting Name',
          },
        },
      },
      'meeting({"id":"meeting_id"}).todos_nonPaginated(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, task: 1 },
        results: {
          byParentId: true,
          'meeting-id': {
            todos: [
              {
                id: 'todo-id-1',
                task: 'todo-task-1',
              },
              {
                id: 'todo-id-2',
                task: 'todo-task-2',
              },
            ],
          },
        },
      },
      'meeting({"id":"meeting_id"}).headlines_nonPaginated(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, title: 1 },
        results: {
          byParentId: true,
          'meeting-id': {
            headlines: [
              {
                id: 'headline-id-1',
                title: 'headline-title-1',
              },
              {
                id: 'headline-id-2',
                title: 'headline-title-2',
              },
            ],
          },
        },
      },
      'meeting({"id":"meeting_id"}).todos_nonPaginated(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: true,
          'todo-id-1': {
            assignee: { id: 'todo-assignee-1', firstName: 'Peter' },
          },
          'todo-id-2': {
            assignee: { id: 'todo-assignee-2', firstName: 'Peter' },
          },
        },
      },
      'meeting({"id":"meeting_id"}).headlines_nonPaginated(NO_PARAMS).assignee(NO_PARAMS)': {
        subscriptionsByProperty: { id: 1, firstName: 1 },
        results: {
          byParentId: true,
          'headline-id-1': {
            assignee: { id: 'headline-assignee-1', firstName: 'Peter' },
          },
          'headline-id-2': {
            assignee: { id: 'headline-assignee-2', firstName: 'Peter' },
          },
        },
      },
    };

    expect(QuerySlimmer.queriesByContext).toEqual(expectedCache);
  });
});

describe('getSlimmedQueryAgainstCache', () => {
  describe('when the new query contains no requests for relational data', () => {
    test('it should return the whole new query record without changes if none of the query record entries are found in queriesByContext', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockQueryRecord)).toEqual(
        mockQueryRecord
      );
    });

    test('it should return null if the query record entries and the properties of each entry are already cached', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockResults = {
        users: {
          nodes: [
            {
              id: '0',
              type: userNode.type,
              firstName: 'Banana',
              lastName: 'Man',
            },
          ],
        },
        todos: {
          nodes: [
            {
              id: '0',
              type: todoNode.type,
              task: 'Eat a banana',
            },
          ],
        },
      };

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockQueryRecord)).toEqual(
        mockQueryRecord
      );

      QuerySlimmer.cacheNewData(mockQueryRecord, mockResults);

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockQueryRecord)).toEqual(
        null
      );
    });

    test('it should not slim properties that are cached but have no live subscriptions', () => {
      const { QuerySlimmer, userNode, todoNode } = setupTests();

      QuerySlimmer.queriesByContext = {
        'users(NO_PARAMS)': {
          subscriptionsByProperty: { id: 1, firstName: 1, lastName: 0 },
          results: [],
        },
        'todos(NO_PARAMS)': {
          subscriptionsByProperty: { id: 1, task: 1, done: 0 },
          results: [],
        },
      };

      const mockQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['id', 'firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'task', 'done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      const expectedSlimmedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['id', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['id', 'done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockQueryRecord)).toEqual(
        expectedSlimmedQuery
      );
    });

    test('it should return a slimmed query record where query record entries are returned with only non cached properties', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        meetings: {
          def: meetingNode,
          properties: ['name', 'archived'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['task'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedResults = {
        users: [
          {
            id: '0',
            type: userNode.type,
            firstName: 'Banana',
            lastName: 'Man',
          },
        ],
        meetings: [
          {
            id: '0',
            type: meetingNode.type,
            name: 'Banana Meeting',
            archived: false,
          },
        ],
        todos: [
          {
            id: '0',
            type: todoNode.type,
            task: 'Eat a banana',
          },
        ],
      };

      const mockNewQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName', 'email'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        meetings: {
          def: meetingNode,
          properties: ['name', 'archived'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['task', 'done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      const expectedSlimmedNewQueryRecord: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
        todos: {
          def: todoNode,
          properties: ['done'],
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      expect(
        QuerySlimmer.getSlimmedQueryAgainstCache(mockNewQueryRecord)
      ).toEqual(mockNewQueryRecord);

      QuerySlimmer.cacheNewData(mockCachedQueryRecord, mockCachedResults);

      expect(
        QuerySlimmer.getSlimmedQueryAgainstCache(mockNewQueryRecord)
      ).toEqual(expectedSlimmedNewQueryRecord);
    });
  });

  describe('when the new query is requesting relational data', () => {
    test('it should return null if both the base query and relational queries are completely cached', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedQueryData = {
        users: {
          nodes: [
            {
              id: '0',
              type: userNode.type,
              firstName: 'Banana',
              lastName: 'Man',
              meetings: {
                nodes: [
                  {
                    id: '0',
                    name: 'Banana Meeting',
                    archived: false,
                    todos: [
                      {
                        id: '0',
                        type: todoNode.type,
                        task: 'Eat a banana',
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      };

      QuerySlimmer.cacheNewData(mockCachedQuery, mockCachedQueryData);

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockCachedQuery)).toBe(
        null
      );
    });

    test('it should return a query with only non cached properties for the entire query tree', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedQueryData = {
        users: {
          nodes: [
            {
              id: '0',
              type: userNode.type,
              firstName: 'Banana',
              lastName: 'Man',
              meetings: {
                nodes: [
                  {
                    id: '0',
                    name: 'Banana Meeting',
                    todos: [
                      {
                        id: '0',
                        type: todoNode.type,
                        task: 'Eat a banana',
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      };

      const mockNewQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName', 'email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task', 'done'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const expectedSlimmedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['done'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      QuerySlimmer.cacheNewData(mockCachedQuery, mockCachedQueryData);

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockNewQuery)).toEqual(
        expectedSlimmedQuery
      );
    });

    test('it should return the query record entry with an empty properties array when those properties are cached but the relational query`s are not', () => {
      const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

      const mockCachedQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['firstName', 'lastName'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['task'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const mockCachedQueryData = {
        users: {
          nodes: [
            {
              id: '0',
              type: userNode.type,
              firstName: 'Banana',
              lastName: 'Man',
              meetings: {
                nodes: [
                  {
                    id: '0',
                    name: 'Banana Meeting',
                    archived: false,
                    todos: [{ id: '0', task: 'Eat a banana' }],
                  },
                ],
              },
            },
            {
              id: '1',
              type: userNode.type,
              firstName: 'Apple',
              lastName: 'Woman',
              meetings: {
                nodes: [
                  {
                    id: '1',
                    name: 'Apple Meeting',
                    archived: false,
                    todos: [{ task: 'Eat an apple' }],
                  },
                ],
              },
            },
          ],
        },
      };

      const mockNewQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: ['name', 'archived'],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['done'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };
      const expectedSlimmedNewQuery: QueryRecord = {
        users: {
          def: userNode,
          properties: ['email'],
          relational: {
            meetings: {
              _relationshipName: 'meetings',
              def: meetingNode,
              properties: [],
              oneToMany: true,
              relational: {
                todos: {
                  _relationshipName: 'todos',
                  def: todoNode,
                  properties: ['done'],
                  oneToMany: true,
                },
              },
            },
          },
          tokenName: DEFAULT_TOKEN_NAME,
        },
      };

      QuerySlimmer.cacheNewData(mockCachedQuery, mockCachedQueryData);

      expect(QuerySlimmer.getSlimmedQueryAgainstCache(mockNewQuery)).toEqual(
        expectedSlimmedNewQuery
      );
    });
  });
});

describe('getDataForQueryFromCache', () => {
  test('it should get cached data for all QueryRecordEntries and relational entries', () => {
    const {
      QuerySlimmer,
      userNode,
      todoNode,
      meetingNode,
      headlineNode,
      pageInfo,
    } = setupTests();

    const mockQueryRecord: QueryRecord = {
      user: {
        def: userNode,
        id: 'aidan-id',
        properties: ['id', 'firstName', 'lastName'],
        relational: {
          todos: {
            def: todoNode,
            oneToMany: true,
            _relationshipName: 'todos',
            properties: ['id', 'task'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName', 'lastName'],
              },
            },
          },
          headlines: {
            def: headlineNode,
            oneToMany: true,
            _relationshipName: 'headlines',
            properties: ['id', 'title'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName', 'lastName'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
      users: {
        def: userNode,
        ids: ['aidan-id', 'piotr-id'],
        properties: ['id', 'firstName', 'lastName'],
        relational: {
          meeting: {
            def: meetingNode,
            oneToOne: true,
            _relationshipName: 'meeting',
            properties: ['id', 'name'],
            relational: {
              todos: {
                def: todoNode,
                oneToMany: true,
                _relationshipName: 'todos',
                properties: ['id', 'task'],
              },
              headlines: {
                def: headlineNode,
                oneToMany: true,
                _relationshipName: 'headlines',
                properties: ['id', 'title'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockRequestResponse = {
      user: {
        id: 'aidan-id',
        firstName: 'Aidan',
        lastName: 'Goodman',
        todos: {
          pageInfo: pageInfo,
          nodes: [
            {
              id: 'aidan-todo-id-1',
              task: 'aidan-todo-task-1',
              assignee: {
                id: 'aidan-id',
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
            {
              id: 'aidan-todo-id-2',
              task: 'aidan-todo-task-2',
              assignee: {
                id: 'aidan-id',
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
          ],
        },
        headlines: {
          pageInfo: pageInfo,
          nodes: [
            {
              id: 'aidan-headline-id-1',
              title: 'aidan-headline-title-1',
              assignee: {
                id: 'aidan-id',
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
            {
              id: 'aidan-headline-id-2',
              title: 'aidan-headline-title-2',
              assignee: {
                id: 'aidan-id',
                firstName: 'Aidan',
                lastName: 'Goodman',
              },
            },
          ],
        },
      },
      users: {
        pageInfo: pageInfo,
        nodes: [
          {
            id: 'aidan-id',
            firstName: 'Aidan',
            lastName: 'Goodman',
            meeting: {
              id: 'aidan-meeting-id-1',
              name: 'aidan-meeting-1',
              todos: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'aidan-todo-id-1',
                    task: 'aidan-todo-task-1',
                  },
                  {
                    id: 'aidan-todo-id-2',
                    task: 'aidan-todo-task-2',
                  },
                ],
              },
              headlines: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'aidan-headline-id-1',
                    title: 'aidan-headline-task-1',
                  },
                  {
                    id: 'aidan-headline-id-2',
                    title: 'aidan-headline-task-2',
                  },
                ],
              },
            },
          },
          {
            id: 'piotr-id',
            firstName: 'Piotr',
            lastName: 'Bogun',
            meeting: {
              id: 'piotr-meeting-id-1',
              name: 'piotr-meeting-1',
              todos: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'piotr-todo-id-1',
                    task: 'piotr-todo-task-1',
                  },
                  {
                    id: 'piotr-todo-id-2',
                    task: 'piotr-todo-task-2',
                  },
                ],
              },
              headlines: {
                pageInfo: pageInfo,
                nodes: [
                  {
                    id: 'piotr-headline-id-1',
                    title: 'piotr-headline-task-1',
                  },
                  {
                    id: 'piotr-headline-id-2',
                    title: 'piotr-headline-task-2',
                  },
                ],
              },
            },
          },
        ],
      },
    };

    QuerySlimmer.cacheNewData(mockQueryRecord, mockRequestResponse);

    const actualDataFromCache = QuerySlimmer.getDataForQueryFromCache(
      mockQueryRecord
    );

    expect(actualDataFromCache).toEqual(mockRequestResponse);
  });

  test('it should get cached data properly when data somewhere in the tree was returned as null', () => {
    const {
      QuerySlimmer,
      userNode,
      todoNode,
      meetingNode,
      headlineNode,
      pageInfo,
    } = setupTests();

    const mockQueryRecord: QueryRecord = {
      user: {
        def: userNode,
        id: 'aidan-id',
        properties: ['id', 'firstName', 'lastName'],
        relational: {
          todos: {
            def: todoNode,
            oneToMany: true,
            _relationshipName: 'todos',
            properties: ['id', 'task'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName', 'lastName'],
              },
            },
          },
          headlines: {
            def: headlineNode,
            oneToMany: true,
            _relationshipName: 'headlines',
            properties: ['id', 'title'],
            relational: {
              assignee: {
                def: userNode,
                oneToOne: true,
                _relationshipName: 'assignee',
                properties: ['id', 'firstName', 'lastName'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
      users: {
        def: userNode,
        ids: ['aidan-id', 'piotr-id'],
        properties: ['id', 'firstName', 'lastName'],
        relational: {
          meeting: {
            def: meetingNode,
            oneToOne: true,
            _relationshipName: 'meeting',
            properties: ['id', 'name'],
            relational: {
              todos: {
                def: todoNode,
                oneToMany: true,
                _relationshipName: 'todos',
                properties: ['id', 'task'],
              },
              headlines: {
                def: headlineNode,
                oneToMany: true,
                _relationshipName: 'headlines',
                properties: ['id', 'title'],
              },
            },
          },
        },
        tokenName: DEFAULT_TOKEN_NAME,
      },
    };

    const mockRequestResponse = {
      user: {
        id: 'aidan-id',
        firstName: 'Aidan',
        lastName: 'Goodman',
        todos: null,
        headlines: {
          pageInfo: pageInfo,
          nodes: [
            {
              id: 'aidan-headline-id-1',
              title: 'aidan-headline-title-1',
              assignee: null,
            },
            {
              id: 'aidan-headline-id-2',
              title: 'aidan-headline-title-2',
              assignee: null,
            },
          ],
        },
      },
      users: {
        pageInfo: pageInfo,
        nodes: [
          {
            id: 'aidan-id',
            firstName: 'Aidan',
            lastName: 'Goodman',
            meeting: null,
          },
          {
            id: 'piotr-id',
            firstName: 'Piotr',
            lastName: 'Bogun',
            meeting: null,
          },
        ],
      },
    };

    QuerySlimmer.cacheNewData(mockQueryRecord, mockRequestResponse);

    const actualDataFromCache = QuerySlimmer.getDataForQueryFromCache(
      mockQueryRecord
    );

    expect(actualDataFromCache).toEqual(mockRequestResponse);
  });
});

// describe('getInFlightQueriesToSlimAgainst', () => {
//   test('it should return in flight queries that match by root level context keys and are requesting at least one of the same properties', () => {
//     const { QuerySlimmer, userNode, todoNode } = setupTests();

//     const newQueryMock: TQueryRecordByContextMap = {
//       [`users(NO_PARAMS)`]: {
//         users: {
//           def: userNode,
//           properties: ['firstName', 'email'],
//           tokenName: DEFAULT_TOKEN_NAME,
//         },
//       },
//       [`todos(NO_PARAMS)`]: {
//         todos: {
//           def: todoNode,
//           properties: ['task', 'done'],
//           tokenName: DEFAULT_TOKEN_NAME,
//         },
//       },
//     };
//     const inFlightQueriesMock: TInFlightQueriesByContextMap = {
//       [`users(NO_PARAMS)`]: [
//         {
//           queryId: '1',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//         {
//           queryId: '2',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['lastName'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//       ],
//       [`todos(NO_PARAMS)`]: [
//         {
//           queryId: '3',
//           queryRecord: {
//             todos: {
//               def: todoNode,
//               properties: ['task'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//       ],
//     };
//     const expectedReturnValue: TInFlightQueriesByContextMap = {
//       [`users(NO_PARAMS)`]: [
//         {
//           queryId: '1',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//       ],
//       [`todos(NO_PARAMS)`]: [
//         {
//           queryId: '3',
//           queryRecord: {
//             todos: {
//               def: todoNode,
//               properties: ['task'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//       ],
//     };

//     QuerySlimmer.inFlightQueryRecords = inFlightQueriesMock;

//     expect(QuerySlimmer.getInFlightQueriesToSlimAgainst(newQueryMock)).toEqual(
//       expectedReturnValue
//     );
//   });

//   test('it should only return in flight queries that have a relational depth that is less than or equal to that of the new query', () => {
//     const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

//     const newQueryMock: TQueryRecordByContextMap = {
//       [`users(NO_PARAMS)`]: {
//         users: {
//           def: userNode,
//           properties: ['firstName', 'email'],
//           relational: {
//             meetings: {
//               _relationshipName: 'meetings',
//               def: meetingNode,
//               properties: ['name', 'archived', 'isAgendaInitialized'],
//               oneToMany: true,
//             },
//           },
//           tokenName: DEFAULT_TOKEN_NAME,
//         },
//       },
//     };

//     const inFlightQueriesMock: TInFlightQueriesByContextMap = {
//       [`users(NO_PARAMS)`]: [
//         {
//           queryId: '1',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName', 'lastName'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//         {
//           queryId: '2',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName', 'lastName'],
//               relational: {
//                 meetings: {
//                   _relationshipName: 'meetings',
//                   def: meetingNode,
//                   properties: ['name', 'archived'],
//                   oneToMany: true,
//                 },
//               },
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//         {
//           queryId: '3',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName', 'email'],
//               relational: {
//                 meetings: {
//                   _relationshipName: 'meetings',
//                   def: meetingNode,
//                   properties: ['name', 'archived'],
//                   oneToMany: true,
//                   relational: {
//                     todos: {
//                       _relationshipName: 'todos',
//                       def: todoNode,
//                       properties: ['task', 'done'],
//                       oneToMany: true,
//                     },
//                   },
//                 },
//               },
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//       ],
//     };

//     const expectedReturnValue: TInFlightQueriesByContextMap = {
//       [`users(NO_PARAMS)`]: [
//         {
//           queryId: '1',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName', 'lastName'],
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//         {
//           queryId: '2',
//           queryRecord: {
//             users: {
//               def: userNode,
//               properties: ['firstName', 'lastName'],
//               relational: {
//                 meetings: {
//                   _relationshipName: 'meetings',
//                   def: meetingNode,
//                   properties: ['name', 'archived'],
//                   oneToMany: true,
//                 },
//               },
//               tokenName: DEFAULT_TOKEN_NAME,
//             },
//           },
//         },
//       ],
//     };

//     QuerySlimmer.inFlightQueryRecords = inFlightQueriesMock;

//     expect(QuerySlimmer.getInFlightQueriesToSlimAgainst(newQueryMock)).toEqual(
//       expectedReturnValue
//     );
//   });
// });

// describe('getSlimmedQueryAgainstInFlightQuery', () => {
//   test('should slim the new query against an in flight query that have already been matched by context', () => {
//     const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

//     const newQueryMock: QueryRecord = {
//       users: {
//         def: userNode,
//         properties: ['firstName', 'lastName', 'email'],
//         relational: {
//           meetings: {
//             _relationshipName: 'meetings',
//             def: meetingNode,
//             properties: ['name', 'archived'],
//             oneToMany: true,
//             relational: {
//               todos: {
//                 _relationshipName: 'todos',
//                 def: todoNode,
//                 properties: ['task', 'done'],
//                 oneToMany: true,
//               },
//             },
//           },
//         },
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//       todos: {
//         def: todoNode,
//         properties: ['task', 'done'],
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//     };
//     const inFlightQueryMock: QueryRecord = {
//       users: {
//         def: userNode,
//         properties: ['firstName', 'lastName'],
//         relational: {
//           meetings: {
//             _relationshipName: 'meetings',
//             def: meetingNode,
//             properties: ['name'],
//             oneToMany: true,
//             relational: {
//               todos: {
//                 _relationshipName: 'todos',
//                 def: todoNode,
//                 properties: ['done'],
//                 oneToMany: true,
//               },
//             },
//           },
//         },
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//       todos: {
//         def: todoNode,
//         properties: ['task'],
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//     };
//     const expectedSlimmedQuery: QueryRecord = {
//       users: {
//         def: userNode,
//         properties: ['email'],
//         relational: {
//           meetings: {
//             _relationshipName: 'meetings',
//             def: meetingNode,
//             properties: ['archived'],
//             oneToMany: true,
//             relational: {
//               todos: {
//                 _relationshipName: 'todos',
//                 def: todoNode,
//                 properties: ['task'],
//                 oneToMany: true,
//               },
//             },
//           },
//         },
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//       todos: {
//         def: todoNode,
//         properties: ['done'],
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//     };

//     expect(
//       QuerySlimmer.getSlimmedQueryAgainstInFlightQuery(
//         newQueryMock,
//         inFlightQueryMock,
//         false
//       )
//     ).toEqual(expectedSlimmedQuery);
//   });
// });

// describe('onSubscriptionCancelled', () => {
//   test(`when a query subscription is cancelled the subcription counts for the query's properties should be decremented`, () => {
//     const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

//     const mockCachedQuery: QueryRecord = {
//       users: {
//         def: userNode,
//         properties: ['firstName', 'lastName'],
//         relational: {
//           meetings: {
//             _relationshipName: 'meetings',
//             def: meetingNode,
//             properties: ['name', 'archived'],
//             oneToMany: true,
//             relational: {
//               todos: {
//                 _relationshipName: 'todos',
//                 def: todoNode,
//                 properties: ['task', 'done'],
//                 oneToMany: true,
//               },
//             },
//           },
//         },
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//     };
//     const mockCachedQueryData = {
//       users: [
//         {
//           id: '0',
//           type: userNode.type,
//           firstName: 'Banana',
//           lastName: 'Man',
//           meetings: [
//             {
//               id: '0',
//               name: 'Banana Meeting',
//               archived: false,
//               todos: [
//                 {
//                   id: '0',
//                   type: todoNode.type,
//                   task: 'Eat a banana',
//                   done: false,
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     };

//     const mockCachedQueryUsersContextKey = `users(NO_PARAMS)`;
//     const mockCachedQueryMeetingsContextKey = `${mockCachedQueryUsersContextKey}.meetings(NO_PARAMS)`;
//     const mockCachedQueryTodosContextKey = `${mockCachedQueryMeetingsContextKey}.todos(NO_PARAMS)`;

//     const mockUnsubbedQuery: QueryRecord = {
//       users: {
//         def: userNode,
//         properties: ['firstName'],
//         relational: {
//           meetings: {
//             _relationshipName: 'meetings',
//             def: meetingNode,
//             properties: ['name'],
//             oneToMany: true,
//             relational: {
//               todos: {
//                 _relationshipName: 'todos',
//                 def: todoNode,
//                 properties: ['task'],
//                 oneToMany: true,
//               },
//             },
//           },
//         },
//         tokenName: DEFAULT_TOKEN_NAME,
//       },
//     };

//     QuerySlimmer.cacheNewData(mockCachedQuery, mockCachedQueryData);

//     expect(
//       QuerySlimmer.queriesByContext[mockCachedQueryUsersContextKey]
//         .subscriptionsByProperty
//     ).toEqual({
//       firstName: 1,
//       lastName: 1,
//     });
//     expect(
//       QuerySlimmer.queriesByContext[mockCachedQueryMeetingsContextKey]
//         .subscriptionsByProperty
//     ).toEqual({
//       name: 1,
//       archived: 1,
//     });
//     expect(
//       QuerySlimmer.queriesByContext[mockCachedQueryTodosContextKey]
//         .subscriptionsByProperty
//     ).toEqual({
//       task: 1,
//       done: 1,
//     });

//     QuerySlimmer.onSubscriptionCancelled(mockUnsubbedQuery);

//     expect(
//       QuerySlimmer.queriesByContext[mockCachedQueryUsersContextKey]
//         .subscriptionsByProperty
//     ).toEqual({
//       firstName: 0,
//       lastName: 1,
//     });
//     expect(
//       QuerySlimmer.queriesByContext[mockCachedQueryMeetingsContextKey]
//         .subscriptionsByProperty
//     ).toEqual({
//       name: 0,
//       archived: 1,
//     });
//     expect(
//       QuerySlimmer.queriesByContext[mockCachedQueryTodosContextKey]
//         .subscriptionsByProperty
//     ).toEqual({
//       task: 0,
//       done: 1,
//     });
//   });
// });

describe('getRelationalDepthOfQueryRecordEntry', () => {
  test('should return 0 when a QueryRecordEntry has no relational child queries', () => {
    const { QuerySlimmer, userNode } = setupTests();

    const mockQueryRecordEntry: QueryRecordEntry = {
      def: userNode,
      properties: ['firstName', 'lastName'],
      tokenName: DEFAULT_TOKEN_NAME,
    };
    const actualValue = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry
    );

    expect(actualValue).toBe(0);
  });

  test('should return number of relational queries nested in a QueryRecordEntry', () => {
    const { QuerySlimmer, userNode, meetingNode, todoNode } = setupTests();

    const mockQueryRecordEntry1: QueryRecordEntry = {
      def: userNode,
      properties: ['firstName', 'lastName'],
      relational: {
        meetings: {
          _relationshipName: 'meetings',
          def: meetingNode,
          properties: ['name', 'archived'],
          oneToMany: true,
        },
      },
      tokenName: DEFAULT_TOKEN_NAME,
    };
    const mockQueryRecordEntry2: QueryRecordEntry = {
      def: userNode,
      properties: ['firstName', 'lastName'],
      relational: {
        meetings: {
          _relationshipName: 'meetings',
          def: meetingNode,
          properties: ['name', 'archived'],
          oneToMany: true,
          relational: {
            todos: {
              _relationshipName: 'todos',
              def: todoNode,
              properties: ['task', 'done'],
              oneToMany: true,
            },
          },
        },
      },
      tokenName: DEFAULT_TOKEN_NAME,
    };
    const mockQueryRecordEntry3: QueryRecordEntry = {
      def: userNode,
      properties: ['firstName', 'lastName'],
      relational: {
        meetings: {
          _relationshipName: 'meetings',
          def: meetingNode,
          properties: ['name', 'archived'],
          oneToMany: true,
          relational: {
            todos: {
              _relationshipName: 'todos',
              def: todoNode,
              properties: ['task', 'done'],
              oneToMany: true,
            },
          },
        },
        todos: {
          _relationshipName: 'todos',
          def: todoNode,
          properties: ['task', 'done'],
          oneToMany: true,
          relational: {
            users: {
              _relationshipName: 'users',
              def: userNode,
              properties: ['firstName', 'lastName'],
              oneToMany: true,
              relational: {
                meetings: {
                  _relationshipName: 'meetings',
                  def: meetingNode,
                  properties: ['name', 'archived'],
                  oneToMany: true,
                  relational: {
                    todos: {
                      _relationshipName: 'todos',
                      def: todoNode,
                      properties: ['task', 'done'],
                      oneToMany: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      tokenName: DEFAULT_TOKEN_NAME,
    };

    const actualValue1 = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry1
    );
    const actualValue2 = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry2
    );
    const actualValue3 = QuerySlimmer.getRelationalDepthOfQueryRecordEntry(
      mockQueryRecordEntry3
    );

    expect(actualValue1).toBe(1);
    expect(actualValue2).toBe(2);
    expect(actualValue3).toBe(5);
  });
});

describe('mergeQueryResults', () => {
  test('should merge two results that are not organized by parentId', () => {
    const { QuerySlimmer, pageInfo } = setupTests();

    const mockCachedResult = {
      byParentId: false,
      user: {
        id: '0',
        firstName: 'Bob',
        meeting: {
          id: '1',
          name: 'Bob Saget Meeting',
          todos: {
            pageInfo,
            nodes: [
              {
                id: 0,
                task: 'todo 1',
                assignee: {
                  id: '0',
                  firstName: 'Bob',
                },
              },
              {
                id: 1,
                task: 'todo 2',
                assignee: {
                  id: '0',
                  firstName: 'Bob',
                },
              },
            ],
          },
        },
      },
    };
    const mockNewResult = {
      byParentId: false,
      user: {
        id: '0',
        lastName: 'Saget',
        meeting: {
          id: '1',
          archived: false,
          todos: {
            pageInfo,
            nodes: [
              {
                id: 0,
                done: false,
                assignee: {
                  id: '0',
                  lastName: 'Saget',
                },
              },
              {
                id: 1,
                done: true,
                assignee: {
                  id: '0',
                  lastName: 'Saget',
                },
              },
            ],
          },
        },
      },
    };
    const expectedMergedResult = {
      byParentId: false,
      user: {
        id: '0',
        firstName: 'Bob',
        lastName: 'Saget',
        meeting: {
          id: '1',
          name: 'Bob Saget Meeting',
          archived: false,
          todos: {
            pageInfo,
            nodes: [
              {
                id: 0,
                task: 'todo 1',
                done: false,
                assignee: {
                  id: '0',
                  firstName: 'Bob',
                  lastName: 'Saget',
                },
              },
              {
                id: 1,
                task: 'todo 2',
                done: true,
                assignee: {
                  id: '0',
                  firstName: 'Bob',
                  lastName: 'Saget',
                },
              },
            ],
          },
        },
      },
    };

    expect(
      QuerySlimmer.mergeQueryResults({
        cachedResult: mockCachedResult,
        newResult: mockNewResult,
      })
    ).toEqual(expectedMergedResult);
  });

  test('should merge two results that are organized by parentId', () => {
    const { QuerySlimmer } = setupTests();

    const mockCachedResult = {
      byParentId: true,
      'todo-id-1': {
        assignee: {
          firstName: 'Bob',
          lastName: 'Smith',
        },
      },
      'todo-id-2': {
        assignee: {
          firstName: 'Mary',
          lastName: 'Jones',
        },
      },
      'todo-id-3': {
        assignee: {
          firstName: 'Todd',
          lastName: 'Packer',
        },
      },
      'todo-id-4': {
        assignee: {
          firstName: 'Mona',
          lastName: 'Lisa',
        },
      },
    };
    const mockNewResult = {
      byParentId: true,
      'todo-id-5': {
        assignee: {
          firstName: 'Mr',
          lastName: 'Pink',
        },
      },
      'todo-id-6': {
        assignee: {
          firstName: 'Mr',
          lastName: 'Brown',
        },
      },
      'todo-id-7': {
        assignee: {
          firstName: 'Mr',
          lastName: 'White',
        },
      },
      'todo-id-8': {
        assignee: {
          firstName: 'Mr',
          lastName: 'Black',
        },
      },
    };
    const expectedMergedResult = {
      byParentId: true,
      'todo-id-1': {
        assignee: {
          firstName: 'Bob',
          lastName: 'Smith',
        },
      },
      'todo-id-2': {
        assignee: {
          firstName: 'Mary',
          lastName: 'Jones',
        },
      },
      'todo-id-3': {
        assignee: {
          firstName: 'Todd',
          lastName: 'Packer',
        },
      },
      'todo-id-4': {
        assignee: {
          firstName: 'Mona',
          lastName: 'Lisa',
        },
      },
      'todo-id-5': {
        assignee: {
          firstName: 'Mr',
          lastName: 'Pink',
        },
      },
      'todo-id-6': {
        assignee: {
          firstName: 'Mr',
          lastName: 'Brown',
        },
      },
      'todo-id-7': {
        assignee: {
          firstName: 'Mr',
          lastName: 'White',
        },
      },
      'todo-id-8': {
        assignee: {
          firstName: 'Mr',
          lastName: 'Black',
        },
      },
    };

    expect(
      QuerySlimmer.mergeQueryResults({
        cachedResult: mockCachedResult,
        newResult: mockNewResult,
      })
    ).toEqual(expectedMergedResult);
  });

  test('it should handle regular fields that can be null', () => {
    const { QuerySlimmer } = setupTests();

    const mockCachedResult = {
      lastUpdatedBy: null,
      firstName: 'Joey',
      email: null,
    };
    const mockNewResult = {
      lastUpdatedBy: null,
      lastName: 'Diaz',
      timezone: null,
    };
    const expectedMergedResult = {
      lastUpdatedBy: null,
      firstName: 'Joey',
      email: null,
      lastName: 'Diaz',
      timezone: null,
    };

    const actualResult = QuerySlimmer.mergeQueryResults({
      cachedResult: mockCachedResult,
      newResult: mockNewResult,
    });

    expect(actualResult).toEqual(expectedMergedResult);
  });

  test('when the cached result object was null and the new one is not, it should save the new non null results', () => {
    const { QuerySlimmer } = setupTests();

    const mockCachedResult = {
      byParentId: true,
      'user-id': {
        meeting: null,
      },
    };
    const mockNewResult = {
      byParentId: true,
      'user-id': {
        meeting: {
          name: 'Meeting Name',
          archived: false,
        },
      },
    };
    const expectedMergedResult = {
      byParentId: true,
      'user-id': {
        meeting: {
          name: 'Meeting Name',
          archived: false,
        },
      },
    };

    expect(
      QuerySlimmer.mergeQueryResults({
        cachedResult: mockCachedResult,
        newResult: mockNewResult,
      })
    ).toEqual(expectedMergedResult);
  });

  test('when the cached node collection was null and the new one is not, it should save the new non null results', () => {
    const { QuerySlimmer, pageInfo } = setupTests();

    const mockCachedResult = {
      byParentId: true,
      'user-id': {
        todos: null,
      },
    };
    const mockNewResult = {
      byParentId: true,
      'user-id': {
        todos: {
          pageInfo,
          nodes: [
            { task: 'todo task 1', done: false },
            { task: 'todo task 2', done: false },
          ],
        },
      },
    };
    const expectedMergedResult = {
      byParentId: true,
      'user-id': {
        todos: {
          pageInfo,
          nodes: [
            { task: 'todo task 1', done: false },
            { task: 'todo task 2', done: false },
          ],
        },
      },
    };

    expect(
      QuerySlimmer.mergeQueryResults({
        cachedResult: mockCachedResult,
        newResult: mockNewResult,
      })
    ).toEqual(expectedMergedResult);
  });
});

describe('getPropertiesNotAlreadyCached', () => {
  test('if none of the requested properties are already cached it should return all the new requested properties', () => {
    const { QuerySlimmer } = setupTests();

    const mockNewProperties = ['id', 'type', 'firstName', 'lastName'];
    const mockCachedProperties = {};

    const actualResult = QuerySlimmer.getPropertiesNotAlreadyCached({
      newQueryProps: mockNewProperties,
      cachedQuerySubsByProperty: mockCachedProperties,
    });

    expect(actualResult).toEqual(mockNewProperties);
  });

  test('it should return all properties not cached along with required properties', () => {
    const { QuerySlimmer } = setupTests();

    const mockNewProperties = ['id', 'type', 'firstName', 'lastName'];
    const mockCachedProperties = {
      id: 1,
      type: 1,
      firstName: 1,
    };

    const actualResult = QuerySlimmer.getPropertiesNotAlreadyCached({
      newQueryProps: mockNewProperties,
      cachedQuerySubsByProperty: mockCachedProperties,
    });

    expect(actualResult).toEqual(['id', 'type', 'lastName']);
  });

  test('it should return null when all non required properties are already cached', () => {
    const { QuerySlimmer } = setupTests();

    const mockNewProperties = ['id', 'type', 'firstName', 'lastName'];
    const mockCachedProperties = {
      id: 1,
      type: 1,
      firstName: 1,
      lastName: 1,
    };

    const actualResult = QuerySlimmer.getPropertiesNotAlreadyCached({
      newQueryProps: mockNewProperties,
      cachedQuerySubsByProperty: mockCachedProperties,
    });

    expect(actualResult).toBe(null);
  });
});
