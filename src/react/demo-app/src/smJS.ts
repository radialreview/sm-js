import { children, getDefaultConfig, SMJS, string } from 'sm-js';

const smJS = new SMJS(getDefaultConfig());

export default smJS;

export const todoNode = smJS.def({
  type: 'todo',
  properties: {
    id: string,
    task: string,
  },
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
    todos: () => children({ def: todoNode }),
  },
});
