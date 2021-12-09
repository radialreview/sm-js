import * as smData from './smDataTypes';
import { DOFactory } from './DO';
import { queryDefinition } from './smDataTypes';
import { IS_NULL_IDENTIFIER } from '.';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

const userProperties = {
  id: smData.string,
  firstName: smData.string,
  lastName: smData.string('joe'),
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
export type UserNode = ISMNode<UserProperties, {}, UserRelationalData, {}>;

// factory functions so that tests don't share DO repositories
export function generateUserNode(cachedTodoNode?: TodoNode): UserNode {
  const userNode = smData.def({
    type: 'tt-user',
    properties: userProperties,
    relational: {
      todos: () => smData.children({ def: todoNode }),
    },
  });
  const todoNode: TodoNode = cachedTodoNode || generateTodoNode(userNode);

  return userNode;
}

const todoProperties = {
  id: smData.string,
  task: smData.string,
  done: smData.boolean(false),
  assigneeId: smData.string,
  meetingId: smData.string.optional,
  settings: smData.object.optional({
    archiveAfterMeeting: smData.boolean.optional,
    nestedSettings: smData.object.optional({
      nestedNestedMaybe: smData.string.optional,
    }),
  }),
  dataSetIds: smData.array(smData.string),
  comments: smData.array(smData.string.optional).optional,
};

export type TodoProperties = typeof todoProperties;

export type TodoRelationalData = {
  assignee: IByReferenceQueryBuilder<UserNode>;
};

export type TodoMutations = {};

export type TodoNode = ISMNode<
  TodoProperties,
  {},
  TodoRelationalData,
  TodoMutations
>;

export function generateTodoNode(cachedUserNode?: UserNode): TodoNode {
  const todoNode = smData.def({
    type: 'todo',
    properties: todoProperties,
    relational: {
      assignee: () =>
        smData.reference<TodoNode, UserNode>({
          def: userNode,
          idProp: 'assigneeId',
        }),
    },
  });
  const userNode: UserNode = cachedUserNode || generateUserNode(todoNode);

  return todoNode;
}

export function generateDOInstance<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
  initialData?: { version: string } & Record<string, any>;
}) {
  const DO = DOFactory<
    TNodeData,
    TNodeComputedData,
    TNodeRelationalData,
    TNodeMutations
  >({
    type: 'mockNodeType',
    properties: opts.properties,
    computed: opts.computed,
    relational: opts.relational,
  });
  return new DO(opts.initialData);
}

export function createMockQueryDefinitions(
  opts: { useIds: true } | { useUnder: true } | { useNoUnder: true } = {
    useUnder: true,
  }
) {
  let target = {};
  if ('useIds' in opts) {
    target = { ids: ['mock-id'] };
  } else if ('useUnder' in opts) {
    target = { underIds: ['mock-id'] };
  } else if ('useNoUnder' in opts) {
    // do nothing, leave target empty
  }

  return {
    users: queryDefinition({
      def: generateUserNode(),
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
          map: ({ id, assignee }) => ({
            id,
            assignee: assignee({
              map: ({ id, firstName }) => ({ id, firstName }),
            }),
          }),
        }),
      }),
      ...target,
    }),
  };
}

export const mockQueryDataReturn = {
  users: [
    {
      id: 'mock-user-id',
      version: '1',
      address: null,
      [`address${IS_NULL_IDENTIFIER}`]: false,
      address_state: 'FL',
      address_apt_floor: '1',
      address_apt_number: '1',
      todos: [
        {
          version: '1',
          id: 'mock-todo-id',
          assignee: [{ id: 'mock-user-id', version: '1', firstName: 'Joe' }],
        },
      ],
    },
  ],
};

const expectedAssignee = {
  id: 'mock-user-id',
  firstName: 'Joe',
  version: 1,
};
const expectedTodo = {
  id: 'mock-todo-id',
  assignee: expectedAssignee,
  version: 1,
};
const expectedUsers = [
  {
    id: 'mock-user-id',
    address: { state: 'FL', apt: { number: 1, floor: 1 } },
    todos: [expectedTodo],
    version: 1,
  },
];

export const mockQueryResultExpectations = { users: expectedUsers };

const queryId = 'MockQuery';
const { queryRecord } = convertQueryDefinitionToQueryInfo({
  queryDefinitions: createMockQueryDefinitions(),
  queryId,
});

export const mockQueryRecord = queryRecord;

export const mockSubscriptionMessage = {
  users: {
    node: {
      // same prop values
      id: 'mock-user-id',
      address_state: 'AK',
      version: '2',
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
