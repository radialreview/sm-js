import { autoIndentGQL } from '../../specUtilities';
import { UpdateEdgeOperation, UpdateEdgesOperation } from './types';
import {
  getMutationsFromEdgeUpdateOperations,
  updateEdge,
  updateEdges,
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
          edge: {
            type: 'renamedEdge',
            from: '456',
            to: '789',
            permissions: {
              view: true,
            },
            name: 'namedEdgeUpdate',
          },
        },
        {
          edge: {
            from: '444',
            to: '555',
            permissions: {
              view: true,
              edit: true,
            },
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
         sourceId: \\"123\\"
         targetId: \\"456\\"
         edge: {
           type: \\"access\\",
           view: true,
           edit: false,
           manage: false,
           terminate: false,
           addChild: false
         }
         transactional: true
       )
      }"
    `);

    expect(autoIndentGQL(mutations[1].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation namedEdgeUpdate {
       UpdateEdge(
         sourceId: \\"456\\"
         targetId: \\"789\\"
         edge: {
           type: \\"renamedEdge\\",
           view: true,
           edit: false,
           manage: false,
           terminate: false,
           addChild: false
         }
         transactional: true
       )
      }"
    `);

    expect(autoIndentGQL(mutations[2].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation UpdateEdge {
       UpdateEdge(
         sourceId: \\"444\\"
         targetId: \\"555\\"
         edge: {
           type: \\"access\\",
           view: true,
           edit: true,
           manage: false,
           terminate: false,
           addChild: false
         }
         transactional: true
       )
      }"
    `);
  });
});
