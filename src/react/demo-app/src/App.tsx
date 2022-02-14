import React from 'react';

import { useSubscription, queryDefinition } from 'sm-js';
import { userNode } from './smJS';

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

  return (
    <div className="App">
      {data.users.map(user => (
        <div key={user.id}>
          {user.firstName} {user.lastName}
          <br />
          todos:{' '}
          {user.todos.length
            ? user.todos.map(todo => todo.task).join(', ')
            : 'None.'}
          <br />
          <br />
        </div>
      ))}
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
