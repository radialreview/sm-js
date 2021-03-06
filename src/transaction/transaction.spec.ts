import { SMJS } from '..';
import { autoIndentGQL, getMockConfig } from '../specUtilities';
import { DocumentNode } from '../types';

test('transaction calls gqlClient.mutate with the expected operations', async done => {
  const smJSInstance = new SMJS(getMockConfig());

  smJSInstance.gqlClient.mutate = (opts: any) => {
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
         transactional: true
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
         transactional: true
         ) {
           id
         }
       }
       ",
        "
      mutation DropNode {
       DropNode(nodeId: \\"thing-to-drop\\", transactional: true)
      }
      ",
        "
      mutation DropNode {
       DropNode(nodeId: \\"other-thing-to-drop\\", transactional: true)
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
         transactional: true
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
         transactional: true
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
         transactional: true
       )
      }",
        "
      mutation dropEdgeFromTaskToUser {
       DropEdge(
         sourceId: \\"123\\"
         targetId: \\"456\\"
         edgeType: \\"access\\"
         transactional: true
       )
      }",
        "
      mutation namedEdgeDrop {
       DropEdge(
         sourceId: \\"456\\"
         targetId: \\"789\\"
         edgeType: \\"namedEdge\\"
         transactional: true
       )
      }",
        "
      mutation DropEdge {
       DropEdge(
         sourceId: \\"444\\"
         targetId: \\"555\\"
         edgeType: \\"access\\"
         transactional: true
       )
      }",
        "
      mutation replace {
       ReplaceEdge(
         currentSourceId: \\"abc\\"
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
         transactional: true
       )
      }",
        "
      mutation namedEdgeReplacement {
       ReplaceEdge(
         currentSourceId: \\"123\\"
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
         transactional: true
       )
      }",
        "
      mutation ReplaceEdge {
       ReplaceEdge(
         currentSourceId: \\"222\\"
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
         transactional: true
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
         transactional: true
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
         transactional: true
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
         transactional: true
       )
      }",
      ]
    `);
    done();
    return new Promise(res => res(null));
  };

  await smJSInstance
    .transaction(context => {
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
            data: {
              id: 'some-other-mock-id',
              title: 'new title for other mock thing',
            },
          },
          {
            data: {
              id: 'some-other-other-mock-id',
              title: 'new title for other other mock thing',
            },
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
          edge: {
            type: 'namedEdge',
            from: '456',
            to: '789',
            permissions: {
              view: true,
            },
            name: 'namedEdgeCreation',
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
          edge: {
            type: 'namedEdge',
            from: '456',
            to: '789',
          },
          name: 'namedEdgeDrop',
        },
        {
          edge: { from: '444', to: '555' },
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
          edge: {
            type: 'replacedEdge',
            current: '123',
            from: '456',
            to: '789',
            permissions: {
              view: true,
            },
            name: 'namedEdgeReplacement',
          },
        },
        {
          edge: {
            current: '222',
            from: '444',
            to: '555',
            permissions: {
              view: true,
              edit: true,
            },
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
      ]);
    })
    .execute();
});

// allows devs to fetch data when building a transaction
test('transaction awaits the callback if it returns a promise', async done => {
  const smJSInstance = new SMJS(getMockConfig());
  smJSInstance.gqlClient.mutate = (opts: any) => {
    expect(opts.mutations.length).toBe(1);
    done();
    return new Promise(res => res(null));
  };

  await smJSInstance
    .transaction(async ctx => {
      const dataFromServer: { id: string } = await new Promise(res => {
        res({ id: 'mock-todo-id' });
      });

      ctx.dropNode({ id: dataFromServer.id });
    })
    .execute();
});

test('transactions that receive an array of transaction results should group them all', async () => {
  try {
    const smJSInstance = new SMJS(getMockConfig());

    smJSInstance.gqlClient.mutate = () => {
      const result = [
        {
          data: {
            CreateNodes: [
              { id: 'tonycorleone', __typename: 'OutputNode' },
              { id: 'jeanpaul', __typename: 'OutputNode' },
              { id: 'joesmith', __typename: 'OutputNode' },
              { id: 'martyBanks', __typename: 'OutputNode' },
            ],
          },
        },
        {
          data: {
            DropNode: 1,
          },
        },
      ];

      return new Promise(res => res(result));
    };

    const mutateSpy = jest.spyOn(smJSInstance.gqlClient, 'mutate');

    const transaction1 = smJSInstance.transaction(ctx => {
      ctx.createNodes({
        nodes: [
          {
            data: {
              type: 'mock-person',
              name: 'Tony Corleone',
            },
          },
          {
            data: {
              type: 'mock-person',
              name: 'Jean Paul',
            },
          },
        ],
      });

      ctx.createNode({
        data: {
          type: 'mock-person',
          name: 'Joe Smith',
        },
      });

      ctx.createNode({
        data: {
          type: 'mock-person',
          name: 'Marty Banks',
        },
      });
    });

    const transaction2 = smJSInstance.transaction(async ctx => {
      try {
        const dataFromServer: { id: string } = await new Promise(res => {
          res({ id: 'mock-todo-id' });
        });

        ctx.dropNode({ id: dataFromServer.id });
      } catch (e) {
        console.log(e);
      }
    });

    await smJSInstance.transaction([transaction1, transaction2]).execute();

    expect(mutateSpy).toHaveBeenCalledTimes(2);
  } catch (e) {
    console.log(e);
  }
});

test('providing different tokens in a group of transactions throws an error', async () => {
  const smJSInstance = new SMJS(getMockConfig());

  smJSInstance.setToken({
    tokenName: 'user',
    token: '123',
  });

  smJSInstance.setToken({
    tokenName: 'admin',
    token: '456',
  });

  const t1 = smJSInstance.transaction(
    ctx => {
      ctx.createNode({
        data: {
          type: 'mockNode',
          name: 'test',
        },
      });
    },
    { tokenName: 'user' }
  );

  const t2 = smJSInstance.transaction(
    ctx => {
      ctx.createNode({
        data: {
          type: 'mockNode',
          name: 'test2',
        },
      });
    },
    { tokenName: 'admin' }
  );

  try {
    await smJSInstance.transaction([t1, t2]).execute();
  } catch (e) {
    expect((e as any).message).toBe(
      'transactionGroup - All grouped transactions must use the same authentication token.'
    );
  }
});

test('onSuccess callback is executed with correct argument', async done => {
  let dropNodeSpy;
  let createEdgeSpy;
  const createEdgesMock = jest.fn();
  const dropEdgeMock = jest.fn();
  const replaceEdgeMock = jest.fn();
  const updateEdgeMock = jest.fn();

  const smJSInstance = new SMJS(getMockConfig());

  smJSInstance.gqlClient.mutate = () => {
    const result = [
      {
        data: {
          CreateNodes: [
            { id: 'mikejones', __typename: 'OutputNode' },
            { id: 'jeanpaul', __typename: 'OutputNode' },
            { id: 'joesmith', __typename: 'OutputNode' },
          ],
        },
      },
      {
        data: {
          DropNode: 1,
        },
      },
      {
        data: {
          UpdateNodes: [
            { id: '444', __typename: 'OutputNode' },
            { id: '555', __typename: 'OutputNode' },
            { id: '666', __typename: 'OutputNode' },
          ],
        },
      },
      {
        data: {
          AttachEdge: 1,
        },
      },
      {
        data: {
          AttachEdge: 1,
        },
      },
      {
        data: {
          AttachEdge: 1,
        },
      },
      {
        data: {
          DropEdge: 1,
        },
      },
      {
        data: {
          DropEdge: 1,
        },
      },
      {
        data: {
          DropEdge: 1,
        },
      },
      {
        data: {
          ReplaceEdge: 1,
        },
      },
      {
        data: {
          ReplaceEdge: 1,
        },
      },
      {
        data: {
          ReplaceEdge: 1,
        },
      },
      {
        data: {
          UpdateEdge: 1,
        },
      },
      {
        data: {
          UpdateEdge: 1,
        },
      },
      {
        data: {
          UpdateEdge: 1,
        },
      },
    ];
    return new Promise(res => res(result));
  };

  await smJSInstance
    .transaction(ctx => {
      ctx.createNodes({
        nodes: [
          {
            data: { type: 'mock-person', name: 'Mike Jones' },
            onSuccess: (data: any) => {
              expect(data).toEqual({
                id: 'mikejones',
                __typename: 'OutputNode',
              });
            },
          },
          {
            data: {
              type: 'mock-person',
              name: 'Jean Paul',
            },
            onSuccess: (data: any) => {
              expect(data).toEqual({
                id: 'jeanpaul',
                __typename: 'OutputNode',
              });
            },
          },
        ],
      });

      const dropNode = {
        id: '123',
        onSuccess: () => {
          // no-op
        },
      };

      dropNodeSpy = jest.spyOn(dropNode, 'onSuccess');

      ctx.dropNode(dropNode);

      ctx.updateNode({
        data: {
          id: '444',
        },
        onSuccess: (data: any) => {
          expect(data).toEqual({ id: '444', __typename: 'OutputNode' });
        },
      });

      ctx.createNode({
        data: {
          type: 'mock-person',
          name: 'Joe Smith',
        },
        onSuccess: (data: any) => {
          expect(data).toEqual({ id: 'joesmith', __typename: 'OutputNode' });
        },
      });

      ctx.updateNodes({
        nodes: [
          {
            data: {
              id: '555',
            },
            onSuccess: (data: any) => {
              expect(data).toEqual({ id: '555', __typename: 'OutputNode' });
            },
          },
          {
            data: { id: '666' },
            onSuccess: (data: any) => {
              expect(data).toEqual({ id: '666', __typename: 'OutputNode' });
            },
          },
        ],
      });

      const createEdgeOpts = {
        edge: {
          from: '123',
          to: '456',
          permissions: {
            view: true,
          },
        },
        onSuccess: () => {
          // no-op
        },
      };

      createEdgeSpy = jest.spyOn(createEdgeOpts, 'onSuccess');

      ctx.createEdge(createEdgeOpts);

      const createEdgesOpts = [
        {
          edge: {
            from: '123',
            to: '456',
            permissions: {
              view: true,
            },
          },
          onSuccess: createEdgesMock,
        },
        {
          edge: {
            from: 'w123',
            to: '4w56',
            permissions: {
              view: true,
            },
          },
          onSuccess: createEdgesMock,
        },
      ];

      ctx.createEdges(createEdgesOpts);

      ctx.dropEdge({
        edge: {
          from: '123',
          to: '456',
        },
        onSuccess: dropEdgeMock,
      });

      ctx.dropEdges([
        {
          edge: {
            from: '12e3',
            to: '456w',
          },
          onSuccess: dropEdgeMock,
        },
        {
          edge: {
            from: '12e32e',
            to: '456we',
          },
          onSuccess: dropEdgeMock,
        },
      ]);

      ctx.replaceEdge({
        edge: {
          current: 'abc',
          from: '123',
          to: '456',
          permissions: { view: true },
        },
        onSuccess: replaceEdgeMock,
      });
      ctx.replaceEdges([
        {
          edge: {
            current: 'abc',
            from: '123',
            to: '456',
            permissions: { view: true },
          },
          onSuccess: replaceEdgeMock,
        },
        {
          edge: {
            current: 'aebc',
            from: '12e3',
            to: '45w6',
            permissions: { view: true },
          },
          onSuccess: replaceEdgeMock,
        },
      ]);

      ctx.updateEdge({
        name: 'updateEdgeFromTaskToUser',
        edge: {
          from: '123',
          to: '456',
          permissions: { view: true },
        },
        onSuccess: updateEdgeMock,
      });
      ctx.updateEdges([
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
          onSuccess: updateEdgeMock,
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
          onSuccess: updateEdgeMock,
        },
      ]);
    })
    .execute();

  expect(dropNodeSpy).toHaveBeenCalledTimes(1);
  expect(createEdgeSpy).toHaveBeenCalledTimes(1);
  expect(createEdgesMock).toHaveBeenCalledTimes(2);
  expect(dropEdgeMock).toHaveBeenCalledTimes(3);
  expect(replaceEdgeMock).toHaveBeenCalledTimes(3);
  expect(updateEdgeMock).toHaveBeenCalledTimes(3);
  done();
});
