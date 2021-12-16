import { DocumentNode } from '@apollo/client/core';
import { config, SMConfig } from '../config';
import { autoIndentGQL } from '../specUtilities';
import { transaction } from './transaction';

test('transaction calls gqlClient.mutate with the expected operations', async done => {
  config({
    gqlClient: {
      mutate: (opts: any) => {
        // 1 for all node creates, 1 for all node updates, 1 per each node drop and edge mutation
        expect(opts.mutations.length).toBe(16);
        expect(
          opts.mutations.map((document: DocumentNode) =>
            autoIndentGQL(document.loc?.source.body as string)
          )
        ).toMatchInlineSnapshot(`
        Array [
          "
        mutation CreateNodes {
         CreateNodes(
           createOptions: [
             {
               node: {
                 type: \\"todo\\"
                 task: \\"Do the thing\\"
               }
             }
             {
               node: {
                 type: \\"issue\\"
                 task: \\"Thing wasn't done\\"
               }
             }
             {
               node: {
                 type: \\"measurable\\"
                 title: \\"No of times thing was done\\"
               }
             }
           ]
         ) {
           id
         }
        }
        ",
          "
        mutation UpdateNodes {
         UpdateNodes(
           nodes: [
             {
               id: \\"some-mock-id\\"
               title: \\"new title for mock thing\\"
             }
             {
               id: \\"some-other-mock-id\\"
               title: \\"new title for other mock thing\\"
             }
             {
               id: \\"some-other-other-mock-id\\"
               title: \\"new title for other other mock thing\\"
             }
           ]
         ) {
           id
         }
        }
        ",
          "
        mutation DropNode {
         DropNode(nodeId: \\"thing-to-drop\\")
        }
        ",
          "
        mutation DropNode {
         DropNode(nodeId: \\"other-thing-to-drop\\")
        }
        ",
          "
        mutation createEdgeMutation {
         AttachEdge(
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
        }",
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
        }",
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
        }",
          "
        mutation dropEdgeFromTaskToUser {
         DropEdge(
           sourceId: \\"123\\"
           targetId: \\"456\\"
           edgeType: \\"access\\"
         )
        }",
          "
        mutation namedEdgeDrop {
         DropEdge(
           sourceId: \\"456\\"
           targetId: \\"789\\"
           edgeType: \\"namedEdge\\"
         )
        }",
          "
        mutation DropEdge {
         DropEdge(
           sourceId: \\"444\\"
           targetId: \\"555\\"
           edgeType: \\"access\\"
         )
        }",
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
        }",
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
        }",
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
        }",
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
         )
        }",
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
         )
        }",
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
         )
        }",
        ]
        `);
        done();
      },
    },
  } as DeepPartial<SMConfig>);

  await transaction(context => {
    context.createNode({
      data: { type: 'todo', task: 'Do the thing' },
    });
    context.createNodes({
      nodes: [
        { data: { type: 'issue', task: `Thing wasn't done` } },
        { data: { type: 'measurable', title: 'No of times thing was done' } },
      ],
    });
    context.updateNode({
      data: {
        id: 'some-mock-id',
        title: 'new title for mock thing',
      },
    });
    context.updateNodes({
      nodes: [
        {
          id: 'some-other-mock-id',
          title: 'new title for other mock thing',
        },
        {
          id: 'some-other-other-mock-id',
          title: 'new title for other other mock thing',
        },
      ],
    });
    context.dropNode({
      id: 'thing-to-drop',
    });
    context.dropNode({
      id: 'other-thing-to-drop',
    });

    context.createEdge({
      name: 'createEdgeMutation',
      edge: {
        from: '123',
        to: '456',
        permissions: {
          view: true,
        },
      },
    });

    context.createEdges([
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
    ]);

    context.dropEdge({
      name: 'dropEdgeFromTaskToUser',
      edge: {
        from: '123',
        to: '456',
      },
    });

    context.dropEdges([
      {
        type: 'namedEdge',
        from: '456',
        to: '789',
        name: 'namedEdgeDrop',
      },
      {
        from: '444',
        to: '555',
      },
    ]);
    context.replaceEdge({
      name: 'replace',
      edge: {
        current: 'abc',
        from: '123',
        to: '456',
        permissions: { view: true },
      },
    });
    context.replaceEdges([
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
    ]);
    context.updateEdge({
      name: 'updateEdgeFromTaskToUser',
      edge: {
        from: '123',
        to: '456',
        permissions: { view: true },
      },
    });
    context.updateEdges([
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
    ]);
  });
});

// allows devs to fetch data when building a transaction
test('transaction awaits the callback if it returns a promise', async done => {
  config({
    gqlClient: {
      mutate: (opts: any) => {
        expect(opts.mutations.length).toBe(1);
        done();
      },
    },
  });

  await transaction(async ctx => {
    const dataFromServer: { id: string } = await new Promise(res => {
      res({ id: 'mock-todo-id' });
    });

    ctx.dropNode({ id: dataFromServer.id });
  });
});
