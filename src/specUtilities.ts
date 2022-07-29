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
  NodeMutationFn,
  NodeComputedFns,
  NodeRelationalFns,
  Config,
  QueryDefinitionTarget,
  NodeDefaultProps,
} from './types';

const userProperties = {
  firstName: data.string,
  lastName: data.string('joe'),
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
export type UserNode = INode<
  'user',
  UserProperties,
  { displayName: string },
  UserRelationalData,
  {}
>;

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
};

export type TodoProperties = typeof todoProperties;

export type TodoRelationalData = {
  assignee: IOneToOneQueryBuilder<UserNode>;
};

export type TodoMutations = {};

export type TodoNode = INode<
  'todo',
  TodoProperties,
  {},
  TodoRelationalData,
  TodoMutations
>;

export function generateTodoNode(
  mmGQLInstance: IMMGQL,
  cachedUserNode?: UserNode
): TodoNode {
  const todoNode = mmGQLInstance.def({
    type: 'todo',
    properties: todoProperties,
    relational: {
      assignee: () => data.oneToOne<UserNode>(userNode),
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
  // the tsignore here is necessary
  // because the generic that NodeRelationalQueryBuilderRecord needs is
  // the node definition for the origin of the relational queries
  // which when defining a node, is the node being defined
  // attempting to replicate the node here would always end up in a loop
  // since we need the relational data to construct a node
  // and need the node to construct the relational data (without this ts ignore)
  // @ts-ignore
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<
    string,
    /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn
  >
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData & NodeDefaultProps, TNodeComputedData>;
  // @ts-ignore
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
  initialData: {
    id: string;
    version: string;
  } & Record<string, any>;
}) {
  const mmGQL = new MMGQL(getDefaultConfig());
  const DOclass = mmGQL.def<
    TNodeType,
    TNodeData,
    TNodeComputedData,
    TNodeRelationalData,
    TNodeMutations
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
      map: ({ id, todos, address }) => ({
        id,
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
          map: ({ id, assignee }) => ({
            id,
            assignee: assignee({
              map: ({ id, firstName }) => ({ id, firstName }),
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
        },
      },
    ],
  },
};

const expectedAssignee = {
  id: 'mock-user-id',
  type: 'user',
  displayName: 'User display name',
  lastUpdatedBy: undefined,
  firstName: 'Joe',
  version: 1,
};
const expectedTodo = {
  id: 'mock-todo-id',
  type: 'todo',
  assignee: expectedAssignee,
  lastUpdatedBy: undefined,
  version: 1,
};
const expectedUsers = [
  {
    id: 'mock-user-id',
    type: 'user',
    displayName: 'User display name',
    lastUpdatedBy: undefined,
    address: { state: 'FL', apt: { number: 1, floor: 1 } },
    todos: [expectedTodo],
    version: 1,
  },
];

export const mockQueryResultExpectations = { users: expectedUsers };

export function getMockQueryRecord(mmGQLInstance: IMMGQL) {
  const queryId = 'MockQuery';
  const { queryRecord } = convertQueryDefinitionToQueryInfo({
    queryDefinitions: createMockQueryDefinitions(mmGQLInstance),
    queryId,
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

export function getMockConfig(opts?: { generateMockData: boolean }): Config {
  return {
    gqlClient: {
      query: () => new Promise(res => res(mockQueryDataReturn)),
      subscribe: () => () => {},
      mutate: () => new Promise(res => res([])),
    },
    generateMockData: !!opts?.generateMockData,
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

export function generateTestNode(mmGQLInstance: IMMGQL): TestNode {
  const testNode = mmGQLInstance.def({
    type: 'testNode',
    properties: testProperties,
  }) as TestNode;

  return testNode;
}

const testProperties = {
  stringData: data.string,
  optionalString: data.string.optional,
  defaultString: data.string('iAmADefaultString'),
  numberData: data.number,
  optionalNumber: data.number.optional,
  defaultNumber: data.number(22),
  booleanData: data.boolean(true),
  optionalBoolean: data.boolean.optional,
  defaultBoolean: data.boolean(true),
  objectData: data.object({
    recordInObject: data.record(data.string),
    stringInObject: data.string.optional,
  }),
  optionalObject: data.object.optional({
    defaultStringInOptionalObject: data.string(
      'iAmADefaultStringInAnOptionalObject'
    ),

    recordInOptionalObject: data.record(data.number),
  }),
  arrayData: data.array(data.string),
  optionalArray: data.array(data.boolean.optional).optional,
  recordData: data.record(data.string('iAmADefaultStringInARecord')),
  optionalRecord: data.record.optional(data.array(data.number)),
};

type TestProperties = typeof testProperties;

type TestNode = INode<'testNode', TestProperties, {}, {}, {}>;

export const mockDataGenerationExpectedResultsForTodoNodeAllProperties = {
  task: expect.any(String),
  id: expect.any(String),
  dateCreated: expect.any(Number),
  dateLastModified: expect.any(Number),
  lastUpdatedBy: expect.any(String),
  lastUpdatedClientTimestamp: expect.any(Number),
  type: expect.any(String),
  done: expect.any(Boolean),
  assigneeId: expect.any(String),
  meetingId: expect.any(String),
  settings: expect.objectContaining({
    archiveAfterMeeting: expect.any(Boolean),
    nestedSettings: expect.objectContaining({
      nestedNestedMaybe: expect.any(String),
    }),
    nestedRecord: expect.any(Object),
  }),
  dataSetIds: expect.arrayContaining([expect.any(String)]),
  comments: expect.arrayContaining([expect.any(String)]),
  record: expect.any(Object),
};

export const mockedDataGenerationExpectedResultsForUserNodeAllProperties = {
  id: expect.any(String),
  dateCreated: expect.any(Number),
  dateLastModified: expect.any(Number),
  lastUpdatedBy: expect.any(String),
  lastUpdatedClientTimestamp: expect.any(Number),
  firstName: expect.any(String),
  lastName: expect.stringMatching('joe'),
  displayName: expect.any(String),
  address: expect.objectContaining({
    streetName: expect.any(String),
    zipCode: expect.any(String),
    state: expect.any(String),
    apt: expect.objectContaining({
      number: expect.any(Number),
      floor: expect.any(Number),
    }),
  }),
};

export const mockedDataGenerationExpectedResultsForTestNodeAllProperties = {
  test: {
    id: expect.any(String),
    dateCreated: expect.any(Number),
    dateLastModified: expect.any(Number),
    lastUpdatedBy: expect.any(String),
    lastUpdatedClientTimestamp: expect.any(Number),
    stringData: expect.any(String),
    optionalString: expect.any(String),
    defaultString: expect.stringMatching('iAmADefaultString'),
    numberData: expect.any(Number),
    optionalNumber: expect.any(Number),
    defaultNumber: expect.any(Number),
    booleanData: expect.any(Boolean),
    optionalBoolean: expect.any(Boolean),
    defaultBoolean: expect.any(Boolean),
    objectData: expect.objectContaining({
      stringInObject: expect.any(String),
      recordInObject: expect.any(Object),
    }),
    optionalObject: expect.objectContaining({
      defaultStringInOptionalObject: expect.stringMatching(
        'iAmADefaultStringInAnOptionalObject'
      ),
      recordInOptionalObject: expect.any(Object),
    }),
    arrayData: expect.arrayContaining([expect.any(String)]),
    optionalArray: expect.arrayContaining([expect.any(Boolean)]),
    type: expect.stringMatching('testNode'),
    version: expect.any(Number),
    recordData: expect.any(Object),
    optionalRecord: expect.any(Object),
  },
};

export const mockedDataGenerationExpectedResultsWithMapAndRelationalPropertiesDefined = {
  users: expect.arrayContaining([
    expect.objectContaining({
      address: expect.objectContaining({
        apt: expect.objectContaining({
          number: expect.any(Number),
          floor: expect.any(Number),
        }),
        state: expect.any(String),
      }),
      displayName: expect.stringMatching('User display name'),
      id: expect.any(String),
      lastUpdatedBy: expect.any(String),
      type: expect.stringMatching('user'),
      version: expect.any(Number),
      todos: expect.arrayContaining([
        expect.objectContaining({
          assignee: expect.objectContaining({
            displayName: expect.stringMatching('User display name'),
            firstName: expect.any(String),
            id: expect.any(String),
            lastUpdatedBy: expect.any(String),
            type: expect.stringMatching('user'),
            version: expect.any(Number),
          }),
          id: expect.any(String),
          lastUpdatedBy: expect.any(String),
          type: expect.stringMatching('todo'),
          version: expect.any(Number),
        }),
      ]),
    }),
  ]),
};
