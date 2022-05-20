import { autoIndentGQL } from '../specUtilities';
import {
  createNode,
  createNodes,
  getMutationsFromTransactionCreateOperations,
} from './create';

test('getMutationsFromTransactionCreateOperations returns a single mutation that creates every node specified', () => {
  const mutations = getMutationsFromTransactionCreateOperations([
    createNode({
      data: { type: 'mock-todo', task: 'do the thing', done: false },
      name: 'CreateTodo',
    }),
    createNode({
      data: {
        type: 'mock-issue',
        issue: `the thing wasn't done`,
        settings: { alerts: { statusUpdates: 'on' } },
        assignees: ['joe', 'bob'],
      },
      under: ['mock-id-1', 'mock-id-2'],
      name: 'CreateIssue',
    }),
    createNodes({
      nodes: [
        {
          data: {
            type: 'mock-headline',
            headline: 'thing may be done next week',
          },
          under: 'some-other-mock-id',
        },
        {
          data: {
            type: 'mock-measurable',
            title: 'no of times thing was done',
            childNodes: [
              { type: 'mock-score', value: 2 },
              { type: 'mock-score', value: 3 },
            ],
          },
          under: 'some-other-mock-id',
        },
      ],
      name: 'CreateHeadlineAndMeasurable',
    }),
  ]);

  expect(mutations.length).toBe(1);
  expect(autoIndentGQL(mutations[0].loc?.source.body as string))
    .toMatchInlineSnapshot(`
    "
    mutation CreateTodo__CreateIssue__CreateHeadlineAndMeasurable {
     CreateNodes(
       createOptions: [
         {
           node: {
             type: \\"mock-todo\\"
             task: \\"do the thing\\"
             done: \\"false\\"
           }
         }
         {
           node: {
             type: \\"mock-issue\\"
             issue: \\"the thing wasn't done\\"
             settings: \\"__object__\\"
             settings__dot__alerts: \\"__object__\\"
             settings__dot__alerts__dot__statusUpdates: \\"on\\"
             assignees: \\"__JSON__[\\\\\\"joe\\\\\\",\\\\\\"bob\\\\\\"]\\"
           }
           underIds: [\\"mock-id-1\\", \\"mock-id-2\\"]
         }
         {
           node: {
             type: \\"mock-headline\\"
             headline: \\"thing may be done next week\\"
           }
           underIds: [\\"some-other-mock-id\\"]
         }
         {
           node: {
             type: \\"mock-measurable\\"
             title: \\"no of times thing was done\\"
             childNodes: [
               {
                 type: \\"mock-score\\"
                 value: \\"2\\"
               }
               {
                 type: \\"mock-score\\"
                 value: \\"3\\"
               }
             ]
           }
           underIds: [\\"some-other-mock-id\\"]
         }
       ]
       transactional: true
       ) {
         id
       }
     }
     "
  `);
});
