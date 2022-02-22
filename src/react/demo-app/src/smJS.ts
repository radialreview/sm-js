import {
  relational,
  getDefaultConfig,
  SMJS,
  string,
  reference,
  IByReferenceQueryBuilder,
  IChildrenQueryBuilder,
  ISMNode,
} from 'sm-js';

const smJS = new SMJS(getDefaultConfig());

smJS.setToken({
  tokenName: 'default',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjRjYmNjMzA3LTZiZTMtMDdlMy1hOGJjLTJmOTBkZDZkNjUzNCIsIk5hbWVzcGFjZUFwcGxpY2F0aW9uSWQiOiIyIiwibmJmIjoxNjQ1NTUwNjMxLCJleHAiOjE2NDU2MzcwMzEsImlhdCI6MTY0NTU1MDYzMX0.Tk_59TCwefh5feKVdLBgba_AtxdUgthYiG7erF-4qI0',
});

export default smJS;

const todoProperties = {
  id: string,
  task: string,
  assigneeId: string.optional,
};

const userProperties = {
  id: string,
  firstName: string,
  lastName: string,
  address: string,
};

type TodoProperties = typeof todoProperties;

type TodoRelationalData = {
  assignee: IByReferenceQueryBuilder<UserNode>;
};

type TodoMutations = {};

type TodoNode = ISMNode<TodoProperties, {}, TodoRelationalData, TodoMutations>;

type UserProperties = typeof userProperties;

type UserRelationalData = {
  todos: IChildrenQueryBuilder<TodoNode>;
};

type UserNode = ISMNode<UserProperties, {}, UserRelationalData, {}>;

export const todoNode: TodoNode = smJS.def({
  type: 'todo',
  properties: todoProperties,
  relational: {
    assignee: () =>
      reference<TodoNode, UserNode>({
        def: userNode,
        idProp: 'assigneeId',
      }),
  },
});

export const userNode: UserNode = smJS.def({
  type: 'demo-user',
  properties: userProperties,
  relational: {
    todos: () => relational({ def: todoNode, name: 'assigned' }),
  },
});
