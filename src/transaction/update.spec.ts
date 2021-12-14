import { autoIndentGQL } from '../specUtilities';
import {
  getMutationsFromTransactionUpdateOperations,
  updateNode,
  updateNodes,
} from './update';

test('getMutationsFromTransactionUpdateOperations returns a single mutation that updates every node specified', () => {
  const mutations = getMutationsFromTransactionUpdateOperations([
    updateNode({
      data: { id: 'mock-id', task: 'do the thing', done: false },
      name: 'UpdateTodo',
    }),
    updateNode({
      data: { id: 'other-mock-id', issue: `the thing wasn't done` },
      name: 'UpdateIssue',
    }),
    updateNodes({
      nodes: [
        {
          id: 'mock-headline-id',
          headline: 'thing may be done next week',
        },
        {
          id: 'mock-measurable-id',
          title: 'no of times thing was done',
        },
      ],
      name: 'UpdateHeadlineAndMeasurable',
    }),
  ]);
  expect(mutations.length).toBe(1);
  expect(autoIndentGQL(mutations[0].loc?.source.body as string))
    .toMatchInlineSnapshot(`
    "
    mutation UpdateTodo__UpdateIssue__UpdateHeadlineAndMeasurable {
     UpdateNodes(
       nodes: [
         {
           id: \\"mock-id\\"
           task: \\"do the thing\\"
           done: \\"false\\"
         }
         {
           id: \\"other-mock-id\\"
           issue: \\"the thing wasn't done\\"
         }
         {
           id: \\"mock-headline-id\\"
           headline: \\"thing may be done next week\\"
         }
         {
           id: \\"mock-measurable-id\\"
           title: \\"no of times thing was done\\"
         }
       ]
     ) {
       id
     }
    }
    "
  `);
});
