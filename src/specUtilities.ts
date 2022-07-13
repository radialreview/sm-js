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
  users: [
    {
      id: 'mock-user-id',
      type: 'user',
      version: '1',
      address: '__object__',
      address__dot__state: 'FL',
      address__dot__apt: '__object__',
      address__dot__apt__dot__floor: '1',
      address__dot__apt__dot__number: '1',
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
  ],
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

export function getMockConfig(): Config {
  return {
    gqlClient: {
      query: () => new Promise(res => res(mockQueryDataReturn)),
      subscribe: () => () => {},
      mutate: () => new Promise(res => res([])),
    },
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
