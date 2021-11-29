import * as smData from './smDataTypes';
import { DOFactory } from './DO';
import { queryDefinition } from './smDataTypes';
import { IS_NULL_IDENTIFIER } from '.';
import { convertQueryDefinitionToQueryInfo } from './queryDefinitionAdapters';

const userProperties = {
  id: smData.string,
  firstName: smData.string,
  lastName: smData.string,
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

export const userNode: UserNode = smData.def({
  type: 'tt-user',
  properties: userProperties,
  relational: {
    todos: () => smData.children({ def: todoNode }),
  },
});

const todoProperties = {
  id: smData.string,
  task: smData.string,
  done: smData.boolean,
  assigneeId: smData.string,
  meetingId: smData.maybeString,
  settings: smData.maybeObject({
    archiveAfterMeeting: smData.maybeBoolean,
    nestedSettings: smData.maybeObject({
      nestedNestedMaybe: smData.maybeString,
    }),
  }),
  dataSetIds: smData.array(smData.string),
  comments: smData.maybeArray(smData.maybeString),
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

export const todoNode: TodoNode = smData.def({
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

export function generateDOInstance<
  TNodeData extends Record<string, ISMData>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
  initialData?: DeepPartial<GetExpectedNodeDataType<TNodeData>>;
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
  opts?: { useIds: true } | { useUnder: true }
) {
  return {
    users: queryDefinition({
      def: userNode,
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
      ...(opts && 'useIds' in opts
        ? { ids: ['mock-id'] }
        : { underIds: ['mock-id'] }),
    }),
  };
}

export const mockQueryDataReturn = {
  users: [
    {
      id: 'mock-user-id',
      address: null,
      [`address${IS_NULL_IDENTIFIER}`]: false,
      address_state: 'FL',
      address_apt_floor: '1',
      address_apt_number: '1',
      todos: [
        {
          id: 'mock-todo-id',
          assignee: [{ id: 'mock-user-id', firstName: 'Joe' }],
        },
      ],
    },
  ],
};

const expectedAssignee = {
  id: 'mock-user-id',
  firstName: 'Joe',
};
const expectedTodo = {
  id: 'mock-todo-id',
  assignee: expectedAssignee,
};
const expectedUsers = [
  {
    id: 'mock-user-id',
    address: { state: 'FL', apt: { number: 1, floor: 1 } },
    todos: [expectedTodo],
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
    node: { id: 'mock-user-id', address_state: 'FL' },
    operation: {
      action: 'UpdateNode' as 'UpdateNode',
      path: 'some-mock-user-id',
    },
    queryId,
    queryRecord,
    subscriptionAlias: 'users',
  },
};
