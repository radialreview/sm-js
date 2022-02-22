import {
  relational,
  getDefaultConfig,
  SMJS,
  string,
  // reference,
  // IByReferenceQueryBuilder,
  // ISMNode,
} from 'sm-js';

const smJS = new SMJS(getDefaultConfig());

smJS.setToken({
  tokenName: 'default',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImY5ZGIxYjA5LTdiMGItNDMzYy1iZDg2LTg5M2MzZmQxNDFmMCIsIk5hbWVzcGFjZUFwcGxpY2F0aW9uSWQiOiIyIiwibmJmIjoxNjQ0NDM4NDg4LCJleHAiOjE2NDQ1MjQ4ODgsImlhdCI6MTY0NDQzODQ4OH0.kt1mR159rr7r4YlABL3k_t7vr_ZnzAz-UUdX6hUYSDg',
});

export default smJS;

const todoProperties = {
  id: string,
  task: string,
  assigneeId: string.optional,
};
export const todoNode = smJS.def({
  type: 'todo',
  properties: todoProperties,
  // relational: {
  //   assignee: () =>
  //     reference<any, any>({
  //       def: userNode,
  //       idProp: 'assigneeId',
  //     }),
  // },
});

export const userNode = smJS.def({
  type: 'tt-user',
  properties: {
    id: string,
    firstName: string,
    lastName: string,
    address: string,
  },
  relational: {
    todos: () => relational({ def: todoNode, name: 'assigned' }),
  },
});
