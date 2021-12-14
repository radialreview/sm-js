import { autoIndentGQL } from '../specUtilities';

import { dropNode, getMutationsFromTransactionDropOperations } from './drop';

test('getMutationsFromTransactionDropOperations returns multiple drop node mutations', () => {
  const mutations = getMutationsFromTransactionDropOperations([
    dropNode({
      id: 'mock-todo-id',
      name: 'DropTodo',
    }),
    dropNode({
      id: 'mock-issue-id',
      name: 'DropIssue',
    }),
  ]);
  expect(mutations.length).toBe(2);
  expect(
    mutations.map(mutation =>
      autoIndentGQL(mutation.loc?.source.body as string)
    )
  ).toMatchInlineSnapshot(`
    Array [
      "
    mutation DropTodo {
     DropNode(nodeId: \\"mock-todo-id\\")
    }
    ",
      "
    mutation DropIssue {
     DropNode(nodeId: \\"mock-issue-id\\")
    }
    ",
    ]
  `);
});
