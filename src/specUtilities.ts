import * as smData from './smDataTypes';
import { queryDefinition } from './smDataTypes';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';
import { getDefaultConfig, SMJS } from '.';
import {
  IChildrenQueryBuilder,
  ISMNode,
  ISMJS,
  IByReferenceQueryBuilder,
  ISMData,
  SMDataDefaultFn,
  NodeRelationalQueryBuilderRecord,
  NodeMutationFn,
  NodeComputedFns,
  NodeRelationalFns,
  SMConfig,
  QueryDefinitionTarget,
  SMNodeDefaultProps,
} from './types';
import { NULL_TAG } from './dataConversions';

const userProperties = {
  firstName: smData.string,
  lastName: smData.string('joe'),
  score: smData.number,
  archived: smData.boolean(false),
  optionalProp: smData.string.optional,
  address: smData.object({
    streetName: smData.string,
    zipCode: smData.string,
    state: smData.string,
    apt: smData.object({
      number: smData.number,
      floor: smData.number,
    }),
  }),
};

type UserProperties = typeof userProperties;

type UserRelationalData = {
  todos: IChildrenQueryBuilder<TodoNode>;
};

// Reason why we need to declare explicit types for these, instead of relying on type inference
// https://github.com/microsoft/TypeScript/issues/35546
export type UserNode = ISMNode<
  'tt-user',
  UserProperties,
  { displayName: string },
  UserRelationalData,
  {}
>;

// factory functions so that tests don't share DO repositories
export function generateUserNode(
  smJSInstance: ISMJS,
  cachedTodoNode?: TodoNode
): UserNode {
  const userNode: UserNode = smJSInstance.def({
    type: 'tt-user',
    properties: userProperties,
    computed: {
      displayName: () => {
        return 'User display name';
      },
    },
    relational: {
      todos: () => smData.children({ def: todoNode }),
    },
  });

  const todoNode: TodoNode =
    cachedTodoNode || generateTodoNode(smJSInstance, userNode);

  return userNode;
}

const todoProperties = {
  task: smData.string,
  done: smData.boolean(false),
  assigneeId: smData.string,
  meetingId: smData.string.optional,
  settings: smData.object.optional({
    archiveAfterMeeting: smData.boolean.optional,
    nestedSettings: smData.object.optional({
      nestedNestedMaybe: smData.string.optional,
    }),
    nestedRecord: smData.record(smData.boolean(false)),
  }),
  dataSetIds: smData.array(smData.string),
  comments: smData.array(smData.string.optional).optional,
  record: smData.record(smData.string),
  numberProp: smData.number,
};

export type TodoProperties = typeof todoProperties;

export type TodoRelationalData = {
  assignee: IByReferenceQueryBuilder<TodoNode, UserNode>;
  users: IChildrenQueryBuilder<UserNode>;
};

export type TodoMutations = {};

export type TodoNode = ISMNode<
  'todo',
  TodoProperties,
  {},
  TodoRelationalData,
  TodoMutations
>;

export function generateTodoNode(
  smJSInstance: ISMJS,
  cachedUserNode?: UserNode
): TodoNode {
  const todoNode = smJSInstance.def({
    type: 'todo',
    properties: todoProperties,
    relational: {
      assignee: () =>
        smData.reference<TodoNode, UserNode>({
          def: userNode,
          idProp: 'assigneeId',
        }),
      users: () =>
        smData.children<UserNode>({
          def: userNode,
          depth: 1,
        }),
    },
  }) as TodoNode;

  const userNode: UserNode =
    cachedUserNode || generateUserNode(smJSInstance, todoNode);

  return todoNode;
}

export function generateDOInstance<
  TNodeType extends string,
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
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
  computed?: NodeComputedFns<TNodeData & SMNodeDefaultProps, TNodeComputedData>;
  // @ts-ignore
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
  initialData: {
    id: string;
    version: string;
  } & Record<string, any>;
}) {
  const smJS = new SMJS(getDefaultConfig());
  const DOclass = smJS.def<
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
  return { doInstance: new DOclass(opts.initialData), smJSInstance: smJS };
}

export function createMockQueryDefinitions(
  smJSInstance: ISMJS,
  opts: ({ useIds?: true } | { useUnder?: true } | { useNoUnder?: true }) & {
    tokenName?: string;
    doNotSuspend?: boolean;
  } = {
    useUnder: true,
  }
) {
  let target = {} as QueryDefinitionTarget;
  if ('useIds' in opts) {
    target = { ids: ['mock-id'] };
  } else if ('useUnder' in opts) {
    target = { underIds: ['mock-id'] };
  } else if ('useNoUnder' in opts) {
    // do nothing, leave target empty
  }

  return {
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
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
  type: 'tt-user',
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

export const mockQueryDataReturn = {
  users: [
    {
      id: 'mock-user-id',
      type: 'tt-user',
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
              type: 'tt-user',
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
  type: 'tt-user',
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
    type: 'tt-user',
    displayName: 'User display name',
    lastUpdatedBy: undefined,
    address: { state: 'FL', apt: { number: 1, floor: 1 } },
    todos: [expectedTodo],
    version: 1,
  },
];

export const mockQueryResultExpectations = { users: expectedUsers };

export function getMockQueryRecord(smJSInstance: ISMJS) {
  const queryId = 'MockQuery';
  const { queryRecord } = convertQueryDefinitionToQueryInfo({
    queryDefinitions: createMockQueryDefinitions(smJSInstance),
    queryId,
  });

  return queryRecord;
}

export function getMockSubscriptionMessage(smJSInstance: ISMJS) {
  const queryId = 'MockQuery';
  const queryRecord = getMockQueryRecord(smJSInstance);
  return {
    users: {
      node: {
        // same prop values
        id: 'mock-user-id',
        type: 'tt-user',
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
                type: 'tt-user',
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

export function getMockConfig(mockData?: any): SMConfig {
  return {
    gqlClient: {
      query: () => new Promise(res => res(mockData ?? mockQueryDataReturn)),
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
