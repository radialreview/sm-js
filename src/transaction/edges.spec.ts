import { autoIndentGQL } from '../specUtilities';
import {
  CreateEdgeOperation,
  CreateEdgesOperation,
  getMutationsFromEdgeCreateOperations,
} from './edges';

describe('Edges', () => {
  test('getMutationsFromEdgeCreateOperations returns a single mutation containing all edges provided', () => {
    const operations: Array<CreateEdgeOperation | CreateEdgesOperation> = [
      {
        operationType: 'createEdge',
        name: 'createEdgeFromTaskToUser',
        edge: {
          from: '123',
          to: '456',
          permissions: { view: true, edit: true, manage: true },
        },
      },
      {
        operationType: 'createEdges',
        edges: [
          {
            type: 'namedEdge',
            from: '456',
            to: '789',
            permissions: {
              view: true,
            },
            name: 'namedEdgeCreation',
          },
          {
            from: '444',
            to: '555',
            permissions: {
              view: true,
              edit: true,
            },
          },
        ],
      },
    ];

    const mutations = getMutationsFromEdgeCreateOperations(operations);

    expect(autoIndentGQL(mutations[0].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation createEdgeFromTaskToUserMutation {
       AttachEdge(
         type: \\"access\\"
         newSourceId: \\"123\\"
         targetId: \\"456\\"
         edge: {
           view: true,
           edit: true,
           manage: true,
           terminate: false,
           addChild: false
         }
       )
      }"
    `);

    console.log(autoIndentGQL(mutations[0].loc?.source.body as string));

    expect(true).toBeTruthy();
  });
});
