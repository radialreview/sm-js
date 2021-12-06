import * as smData from './smDataTypes';
import { DOFactory } from './DO';

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
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
  initialData?: Record<string, any>; // DeepPartial<GetExpectedNodeDataType<TNodeData>>;
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
