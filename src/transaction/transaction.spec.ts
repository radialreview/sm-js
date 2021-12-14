import { DocumentNode } from '@apollo/client/core';
import { config, SMConfig } from '../config';
import { autoIndentGQL } from '../specUtilities';
import { transaction } from './transaction';

test('transaction calls gqlClient.mutate with the expected operations', async done => {
  config({
    gqlClient: {
      mutate: (opts: any) => {
        // 1 for all creates, 1 for all updates, 1 per each drop
        expect(opts.mutations.length).toBe(4);
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
