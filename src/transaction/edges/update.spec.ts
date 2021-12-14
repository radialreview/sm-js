import { autoIndentGQL } from '../../specUtilities';
import {
  getMutationsFromEdgeUpdateOperations,
  updateEdge,
  UpdateEdgeOperation,
  updateEdges,
  UpdateEdgesOperation,
} from './update';

describe('updateEdge', () => {
  test('getMutationsFromEdgeUpdateOperations returns a single mutation for each edge provided', () => {
    const operations: Array<UpdateEdgeOperation | UpdateEdgesOperation> = [
      updateEdge({
        name: 'updateEdgeFromTaskToUser',
        edge: {
          from: '123',
          to: '456',
          permissions: { view: true },
        },
      }),
      updateEdges([
        {
          type: 'renamedEdge',
          from: '456',
          to: '789',
          permissions: {
            view: true,
          },
          name: 'namedEdgeUpdate',
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

    const mutations = getMutationsFromEdgeUpdateOperations(operations);

    expect(autoIndentGQL(mutations[0].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation updateEdgeFromTaskToUser {
       UpdateEdge(
         currentSourceId: \\"123\\"
         targetId: \\"456\\"
         edge: {
           type: \\"access\\",
           view: true,
           edit: false,
           manage: false,
           terminate: false,
           addChild: false
         }
       )
      }"
    `);

    expect(autoIndentGQL(mutations[1].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation namedEdgeUpdate {
       UpdateEdge(
         currentSourceId: \\"456\\"
         targetId: \\"789\\"
         edge: {
           type: \\"renamedEdge\\",
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
      mutation UpdateEdge {
       UpdateEdge(
         currentSourceId: \\"444\\"
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
