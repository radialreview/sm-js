import { autoIndentGQL } from '../../specUtilities';
import {
  createEdge,
  CreateEdgeOperation,
  createEdges,
  CreateEdgesOperation,
  getMutationsFromEdgeCreateOperations,
} from './create';

describe('Edges', () => {
  test('getMutationsFromEdgeCreateOperations returns a single mutation for each edge provided', () => {
    const operations: Array<CreateEdgeOperation | CreateEdgesOperation> = [
      createEdge({
        name: 'createEdgeFromTaskToUser',
        edge: {
          from: '123',
          to: '456',
          permissions: { view: true, edit: true, manage: true },
        },
      }),
      createEdges([
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
      ]),
    ];

    const mutations = getMutationsFromEdgeCreateOperations(operations);

    expect(autoIndentGQL(mutations[0].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation createEdgeFromTaskToUser {
       AttachEdge(
         newSourceId: \\"123\\"
         targetId: \\"456\\"
         edge: {
           type: \\"access\\",
           view: true,
           edit: true,
           manage: true,
           terminate: false,
           addChild: false
         }
       )
      }"
    `);

    expect(autoIndentGQL(mutations[1].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation namedEdgeCreation {
       AttachEdge(
         newSourceId: \\"456\\"
         targetId: \\"789\\"
         edge: {
           type: \\"namedEdge\\",
           view: true,
           edit: false,
           manage: false,
           terminate: false,
           addChild: false
         }
       )
      }"
    `);

    expect(autoIndentGQL(mutations[2].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation CreateEdge {
       AttachEdge(
         newSourceId: \\"444\\"
         targetId: \\"555\\"
         edge: {
           type: \\"access\\",
           view: true,
           edit: true,
           manage: false,
           terminate: false,
           addChild: false
         }
       )
      }"
    `);
  });
});
