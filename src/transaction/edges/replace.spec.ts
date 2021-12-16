import { autoIndentGQL } from '../../specUtilities';
import {
  getMutationsFromEdgeReplaceOperations,
  replaceEdge,
  replaceEdges,
} from './replace';
import { ReplaceEdgeOperation, ReplaceEdgesOperation } from './types';

describe('replaceEdge', () => {
  test('getMutationsFromEdgeReplaceOperations returns a single mutation for each edge provided', () => {
    const operations: Array<ReplaceEdgeOperation | ReplaceEdgesOperation> = [
      replaceEdge({
        name: 'replace',
        edge: {
          current: 'abc',
          from: '123',
          to: '456',
          permissions: { view: true },
        },
      }),
      replaceEdges([
        {
          type: 'replacedEdge',
          current: '123',
          from: '456',
          to: '789',
          permissions: {
            view: true,
          },
          name: 'namedEdgeReplacement',
        },
        {
          current: '222',
          from: '444',
          to: '555',
          permissions: {
            view: true,
            edit: true,
          },
        },
      ]),
    ];

    const mutations = getMutationsFromEdgeReplaceOperations(operations);

    expect(autoIndentGQL(mutations[0].loc?.source.body as string))
      .toMatchInlineSnapshot(`
      "
      mutation replace {
       ReplaceEdge(
         sourceId: \\"abc\\"
         newSourceId: \\"123\\"
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
      mutation namedEdgeReplacement {
       ReplaceEdge(
         sourceId: \\"123\\"
         newSourceId: \\"456\\"
         targetId: \\"789\\"
         edge: {
           type: \\"replacedEdge\\",
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
      mutation ReplaceEdge {
       ReplaceEdge(
         sourceId: \\"222\\"
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
