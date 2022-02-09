import { autoIndentGQL } from '../../specUtilities';
import {
  getMutationsFromEdgeDropOperations,
  dropEdge,
  dropEdges,
} from './drop';
import { DropEdgeOperation, DropEdgesOperation } from './types';

describe('dropEdge', () => {
  test('getMutationsFromEdgeDropOperations returns a single mutation for each edge provided', () => {
    const operations: Array<DropEdgeOperation | DropEdgesOperation> = [
      dropEdge({
        name: 'dropEdgeFromTaskToUser',
        edge: {
          from: '123',
          to: '456',
        },
      }),
      dropEdges([
        {
          edge: {
            type: 'namedEdge',
            from: '456',
            to: '789',
          },
          name: 'namedEdgeDrop',
        },
        {
          edge: {
            from: '444',
            to: '555',
          },
        },
      ]),
    ];

    const mutations = getMutationsFromEdgeDropOperations(operations);

    expect(autoIndentGQL(mutations[0].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation dropEdgeFromTaskToUser {
       DropEdge(
         sourceId: \\"123\\"
         targetId: \\"456\\"
         edgeType: \\"access\\"
       )
      }"
    `);

    expect(autoIndentGQL(mutations[1].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation namedEdgeDrop {
       DropEdge(
         sourceId: \\"456\\"
         targetId: \\"789\\"
         edgeType: \\"namedEdge\\"
       )
      }"
    `);

    expect(autoIndentGQL(mutations[2].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation DropEdge {
       DropEdge(
         sourceId: \\"444\\"
         targetId: \\"555\\"
         edgeType: \\"access\\"
       )
      }"
    `);
  });
});
