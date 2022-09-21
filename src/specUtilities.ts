import { isObject } from 'lodash';

import * as data from './dataTypes';
import { queryDefinition } from './dataTypes';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { getDefaultConfig, MMGQL } from '.';

import {
  IOneToOneQueryBuilder,
  IOneToManyQueryBuilder,
  INode,
  IMMGQL,
  IData,
  DataDefaultFn,
  NodeRelationalQueryBuilderRecord,
  NodeComputedFns,
  NodeRelationalFns,
  Config,
  QueryDefinitionTarget,
  NodeDefaultProps,
  EPaginationFilteringSortingInstance,
  DocumentNode,
} from './types';
import { NULL_TAG } from './dataConversions';
import { NodesCollection, PageInfoFromResults } from './nodesCollection';

const userProperties = {
  firstName: data.string,
  lastName: data.string('joe'),
  score: data.number,
  archived: data.boolean(false),
  optionalProp: data.string.optional,
  address: data.object({
    streetName: data.string,
    zipCode: data.string,
    state: data.string,
    apt: data.object({
      number: data.number,
      floor: data.number,
    }),
  }),
};

type UserProperties = typeof userProperties;

type UserRelationalData = {
  todos: IOneToManyQueryBuilder<TodoNode>;
};

// Reason why we need to declare explicit types for these, instead of relying on type inference
// https://github.com/microsoft/TypeScript/issues/35546
export type UserNode = INode<{
  TNodeType: 'user';
  TNodeData: UserProperties;
  TNodeComputedData: { displayName: string };
  TNodeRelationalData: UserRelationalData;
}>;

// factory functions so that tests don't share DO repositories
export function generateUserNode(
  mmGQLInstance: IMMGQL,
  cachedTodoNode?: TodoNode
): UserNode {
  const userNode: UserNode = mmGQLInstance.def({
    type: 'user',
    properties: userProperties,
    computed: {
      displayName: () => {
        return 'User display name';
      },
    },
    relational: {
      todos: () => data.oneToMany(todoNode),
    },
  });

  const todoNode: TodoNode =
    cachedTodoNode || generateTodoNode(mmGQLInstance, userNode);

  return userNode;
}

const todoProperties = {
  task: data.string,
  done: data.boolean(false),
  assigneeId: data.string,
  meetingId: data.string.optional,
  settings: data.object.optional({
    archiveAfterMeeting: data.boolean.optional,
    nestedSettings: data.object.optional({
      nestedNestedMaybe: data.string.optional,
    }),
    nestedRecord: data.record(data.boolean(false)),
  }),
  dataSetIds: data.array(data.string),
  comments: data.array(data.string.optional).optional,
  record: data.record(data.string),
  numberProp: data.number,
};

export type TodoProperties = typeof todoProperties;

export type TodoRelationalData = {
  assignee: IOneToOneQueryBuilder<UserNode>;
  users: IOneToManyQueryBuilder<UserNode>;
};

export type TodoNode = INode<{
  TNodeType: 'todo';
  TNodeData: TodoProperties;
  TNodeComputedData: {};
  TNodeRelationalData: TodoRelationalData;
}>;

export function generateTodoNode(
  mmGQLInstance: IMMGQL,
  cachedUserNode?: UserNode
): TodoNode {
  const todoNode = mmGQLInstance.def({
    type: 'todo',
    properties: todoProperties,
    relational: {
      assignee: () => data.oneToOne<UserNode>(userNode),
      users: () => data.oneToMany<UserNode>(userNode),
    },
  }) as TodoNode;

  const userNode: UserNode =
    cachedUserNode || generateUserNode(mmGQLInstance, todoNode);

  return todoNode;
}

export function generateDOInstance<
  TNodeType extends string,
  TNodeData extends Record<string, IData | DataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<{
    TNodeData: TNodeData & NodeDefaultProps;
    TNodeComputedData: TNodeComputedData;
  }>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  initialData: {
    id: string;
    version: number;
  } & Record<string, any>;
}) {
  const mmGQL = new MMGQL(getDefaultConfig());
  const DOclass = mmGQL.def<
    TNodeType,
    TNodeData,
    TNodeComputedData,
    TNodeRelationalData
  >({
    type: 'mockNodeType' as TNodeType,
    properties: opts.properties,
    computed: opts.computed,
    relational: opts.relational,
  }).do;
  return { doInstance: new DOclass(opts.initialData), mmGQLInstance: mmGQL };
}

export function createMockQueryDefinitions(
  mmGQLInstance: IMMGQL,
  opts: { useIds?: true } & {
    tokenName?: string;
    doNotSuspend?: boolean;
  } = {}
) {
  let target = {} as QueryDefinitionTarget;
  if ('useIds' in opts) {
    target = { ids: ['mock-id'] };
  }

  return {
    users: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: ({ todos, address }) => ({
        address: address({
          map: ({ state, apt }) => ({
            state,
            apt: apt({
              map: ({ floor, number }) => ({
                floor,
                number,
              }),
            }),
          }),
        }),
        todos: todos({
          map: ({ assignee }) => ({
            assignee: assignee({
              map: ({ firstName }) => ({ firstName }),
            }),
          }),
        }),
      }),
      target,
      tokenName: opts.tokenName,
      useSubOpts: {
        doNotSuspend: opts.doNotSuspend,
      },
    }),
  };
}

export const mockTodoData = {
  version: '1',
  id: 'mock-todo-id',
  type: 'todo',
  task: 'My Todo',
  numberProp: 10,
  users: [
    {
      id: 'mock-user-id',
      type: 'tt-user',
      version: '1',
      firstName: 'Paul',
    },
    {
      id: 'mock-user-id-2',
      type: 'tt-user',
      version: '1',
      firstName: 'John',
    },
  ],
  assignee: [
    {
      id: 'mock-user-id',
      type: 'tt-user',
      version: '1',
      firstName: 'Paul',
    },
  ],
};

export const mockUserData = {
  id: 'mock-user-id',
  type: 'user',
  version: '1',
  address: '__object__',
  address__dot__state: 'FL',
  address__dot__apt: '__object__',
  address__dot__apt__dot__floor: '1',
  address__dot__apt__dot__number: '1',
  firstName: 'Paul',
  optionalProp: NULL_TAG,
  score: 12,
  archived: false,
  todos: [mockTodoData],
};

const mockPageInfo: PageInfoFromResults = {
  hasNextPage: true,
  endCursor: 'xyz',
  startCursor: 'zyx',
  totalPages: 2,
};

export const mockQueryDataReturn = {
  users: {
    nodes: [
      {
        id: 'mock-user-id',
        type: 'user',
        version: '1',
        address: '__object__',
        address__dot__state: 'FL',
        address__dot__apt: '__object__',
        address__dot__apt__dot__floor: '1',
        address__dot__apt__dot__number: '1',
        todos: {
          nodes: [
            {
              version: '1',
              id: 'mock-todo-id',
              type: 'todo',
              assignee: {
                id: 'mock-user-id',
                type: 'user',
                version: '1',
                firstName: 'Joe',
              },
            },
          ],
          pageInfo: { ...mockPageInfo },
        },
      },
    ],
    pageInfo: { ...mockPageInfo },
  },
};

const expectedAssignee = {
  version: 1,
  type: 'user',
  id: 'mock-user-id',
  firstName: 'Joe',
  displayName: 'User display name',
  lastUpdatedBy: undefined,
};
const expectedTodo = {
  version: 1,
  type: 'todo',
  id: 'mock-todo-id',
  assignee: expectedAssignee,
  lastUpdatedBy: undefined,
};
const expectedUsers = [
  {
    version: 1,
    type: 'user',
    id: 'mock-user-id',
    address: { state: 'FL', apt: { number: 1, floor: 1 } },
    displayName: 'User display name',
    lastUpdatedBy: undefined,
    todos: [expectedTodo],
  },
];

export const getMockQueryResultExpectations = (opts: {
  useServerSidePaginationFilteringSorting: boolean;
}) =>
  convertNodesCollectionValuesToArray({
    obj: { users: expectedUsers },
    useServerSidePaginationFilteringSorting:
      opts.useServerSidePaginationFilteringSorting,
  });

export function getMockQueryRecord(mmGQLInstance: IMMGQL) {
  const queryId = 'MockQuery';
  const { queryRecord } = convertQueryDefinitionToQueryInfo({
    queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
    queryId,
    useServerSidePaginationFilteringSorting: true,
  });

  return queryRecord;
}

export function getMockSubscriptionMessage(mmGQLInstance: IMMGQL) {
  const queryId = 'MockQuery';
  const queryRecord = getMockQueryRecord(mmGQLInstance);
  return {
    users: {
      node: {
        // same prop values
        id: 'mock-user-id',
        type: 'user',
        address__dot__state: 'AK',
        version: '2',
        todos: [
          {
            version: '1',
            id: 'mock-todo-id',
            type: 'todo',
            assignee: [
              {
                id: 'mock-user-id',
                type: 'user',
                version: '1',
                firstName: 'Joe',
              },
            ],
          },
        ],
      },
      operation: {
        action: 'UpdateNode' as 'UpdateNode',
        path: 'some-mock-user-id',
      },
      queryId,
      queryRecord,
      subscriptionAlias: 'users',
    },
  };
}

export function getMockConfig(opts?: {
  mockData?: any;
  getMockData?: () => any;
  generateMockData?: boolean;
  enableQuerySlimming?: boolean;
  enableQuerySlimmingLogging?: boolean;
  paginationFilteringSortingInstance: EPaginationFilteringSortingInstance;
  onQueryPerformed?: (query: DocumentNode) => void;
}): Config {
  if (opts?.mockData && opts?.getMockData) {
    throw Error('Pick one');
  }

  return {
    gqlClient: {
      query: ({ gql }) => {
        let response = mockQueryDataReturn;
        if (opts?.getMockData) {
          response = opts.getMockData();
        } else if (opts?.mockData) {
          response = opts.mockData;
        }

        opts?.onQueryPerformed && opts.onQueryPerformed(gql);
        return new Promise(res => res(response));
      },
      subscribe: () => () => {},
      mutate: () => new Promise(res => res([])),
    },
    generateMockData: !!opts?.generateMockData,
    enableQuerySlimming: opts?.enableQuerySlimming ?? false,
    enableQuerySlimmingLogging: opts?.enableQuerySlimmingLogging ?? false,
    paginationFilteringSortingInstance:
      opts?.paginationFilteringSortingInstance ??
      EPaginationFilteringSortingInstance.SERVER,
  };
}

function isTerminatingLine(line: string) {
  return (
    (line.endsWith('}') && !line.includes('{')) ||
    (line.endsWith(']') && !line.includes('[')) ||
    (line.endsWith(')') && !line.includes('(')) ||
    line.startsWith(')')
  );
}

function isInititingLine(line: string) {
  return line.endsWith('{') || line.endsWith('[') || line.endsWith('(');
}

export function autoIndentGQL(gqlString: string): string {
  let nextIndent = 0;
  return gqlString
    .split('\n')
    .map(string => string.trim())
    .map((line: string, lineIdx, lines) => {
      let indentOnThisLine = nextIndent;

      if (isInititingLine(line)) {
        nextIndent++;
      } else if (isTerminatingLine(line)) {
        indentOnThisLine--;
        const nextLine = lines[lineIdx + 1];
        if (
          nextLine &&
          isInititingLine(nextLine) &&
          isTerminatingLine(nextLine)
        ) {
          nextIndent -= 2;
        } else {
          nextIndent--;
        }
      }

      return `${
        indentOnThisLine > 0
          ? new Array(indentOnThisLine * 2).fill(null).join(' ')
          : ''
      }${line}`;
    })
    .join('\n');
}

export function getPrettyPrintedGQL(documentNode: DocumentNode) {
  const source = documentNode.loc?.source.body;
  if (!source) throw Error('No source on the document node');
  return autoIndentGQL(source);
}

export function convertNodesCollectionValuesToArray<
  T extends Record<string, any>
>(opts: { obj: T; useServerSidePaginationFilteringSorting: boolean }) {
  return Object.keys(opts.obj).reduce((acc, key) => {
    if (Array.isArray(acc[key])) {
      const arrayValue = new NodesCollection({
        items: acc[key].map((item: any) => {
          return isObject(item)
            ? convertNodesCollectionValuesToArray({
                obj: item,
                useServerSidePaginationFilteringSorting:
                  opts.useServerSidePaginationFilteringSorting,
              })
            : item;
        }),
        pageInfoFromResults: {
          ...mockPageInfo,
        },
        clientSidePageInfo: {
          lastQueriedPage: 1,
          pageSize: 5,
        },
        onLoadMoreResults: async () => ({
          ...mockPageInfo,
        }),
        onGoToNextPage: async () => ({
          ...mockPageInfo,
        }),
        onGoToPreviousPage: async () => ({
          ...mockPageInfo,
        }),
        useServerSidePaginationFilteringSorting:
          opts.useServerSidePaginationFilteringSorting,
      });
      acc[key] = arrayValue;
    }

    return acc;
  }, opts.obj as Record<string, any>);
}

export function createMockDataItems<T>(opts: {
  sampleMockData: T & { id: string };
  items: Array<Partial<any>>;
  pageInfo?: Partial<PageInfoFromResults>;
  totalCount?: number;
}) {
  const pageInfo: PageInfoFromResults = opts.pageInfo
    ? { ...mockPageInfo, ...opts.pageInfo }
    : {
        ...mockPageInfo,
      };

  return {
    nodes: opts.items.map((mockItem, index) => ({
      ...opts.sampleMockData,
      id: opts.sampleMockData.id + index,
      ...mockItem,
    })),
    pageInfo,
  };
}
