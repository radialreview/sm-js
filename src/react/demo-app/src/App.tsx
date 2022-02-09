import React from 'react';

import smJS, { userNode } from './smJS';
import { useSubscription, queryDefinition } from 'sm-js';

smJS.setToken({
  tokenName: 'default',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImY5ZGIxYjA5LTdiMGItNDMzYy1iZDg2LTg5M2MzZmQxNDFmMCIsIk5hbWVzcGFjZUFwcGxpY2F0aW9uSWQiOiIyIiwibmJmIjoxNjQ0NDM4NDg4LCJleHAiOjE2NDQ1MjQ4ODgsImlhdCI6MTY0NDQzODQ4OH0.kt1mR159rr7r4YlABL3k_t7vr_ZnzAz-UUdX6hUYSDg',
});

function MyComponent() {
  const { data } = useSubscription({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
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
