import React from 'react';

import { useSubscription, queryDefinition, NodeData } from 'sm-js';
import smJS, { userNode, todoNode } from './smJS';

function MyComponent() {
  const { data } = useSubscription({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        address: userData.address,
        todos: userData.todos({
          map: todoData => ({
            id: todoData.id,
            task: todoData.task,
          }),
        }),
      }),
    }),
  });

  const createUser = async (opts: {
    firstName: string;
    lastName: string;
    address: string;
  }) => {
    return smJS
      .transaction(ctx => {
        ctx.createNode({
          data: {
            type: userNode.type,
            firstName: opts.firstName,
            lastName: opts.lastName,
            address: opts.address,
          },
        });
      })
      .execute();
  };

  const createTodo = async (opts: { task: string; assigneeId?: string }) => {
    const createNodeData: NodeData = {
      type: todoNode.type,
      task: opts.task,
    };

    if (opts.assigneeId) {
      createNodeData.assigneeId = opts.assigneeId;
      createNodeData.additionalEdges = [
        {
          from: opts.assigneeId,
          view: true,
          edit: true,
          manage: true,
        },
      ];
    }

    return smJS
      .transaction(ctx => {
        ctx.createNode({ data: createNodeData });
      })
      .execute();
  };

  const handleCreateUser = async () => {
    await createUser({
      firstName: `user_${(data.users || []).length}`,
      lastName: 'Jones',
      address: '123 Main St.',
    });
  };

  const handleCreateTodo = async (assigneeId: string) => {
    await createTodo({
      task: 'Do this thing',
      assigneeId,
    });
  };

  return (
    <div className="App">
      {data.users.map(user => (
        <div
          key={user.id}
          style={{
            border: '1px solid',
            marginBottom: '16px',
            padding: '8px',
            width: '200px',
          }}
        >
          {user.firstName} {user.lastName}
          <br />
          todos:{' '}
          {user.todos.length
            ? user.todos.map(todo => todo.task).join(', ')
            : 'None.'}
          <br />
          <br />
          <button onClick={() => handleCreateTodo(user.id)}>Add Todo</button>
        </div>
      ))}
      <button onClick={handleCreateUser}>Create User</button>
      <br />
      <br />
    </div>
  );
}

function App() {
  const [showData, setShowData] = React.useState(true);

  return (
    <>
      {showData && <MyComponent />}

      <button onClick={() => setShowData(showData => !showData)}>
        Toggle showing data
      </button>
    </>
  );
}

export default App;
