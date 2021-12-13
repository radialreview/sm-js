import { getMutationsFromTransactionCreateOperations } from './create';

test('getMutationsFromTransactionCreateOperations returns a single mutation that creates every node specified', () => {
  const mutations = getMutationsFromTransactionCreateOperations([
    {
      type: 'createNode',
      data: { type: 'mock-todo', task: 'do the thing' },
    },
    {
      type: 'createNode',
      data: { type: 'mock-issue', issue: `the thing wasn't done` },
      under: ['mock-id-1', 'mock-id-2'],
    },
    {
      type: 'createNodes',
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
    },
  ]);
  expect(mutations[0].loc?.source.body).toMatchInlineSnapshot(`
    "
          mutation MyMutation {
            CreateNodes(
              createOptions: [
                {
        node: {
            type: \\"mock-todo\\"
    task: \\"do the thing\\"
          }
      }
    {
        node: {
            type: \\"mock-issue\\"
    issue: \\"the thing wasn't done\\"
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
    childNodes: [{type: \\"mock-score\\"
    value: \\"2\\"}
    {type: \\"mock-score\\"
    value: \\"3\\"}]
          }
    underIds: [\\"some-other-mock-id\\"]
      }
              ] 
            ) {
              id
            }
          }
        "
  `);
});
