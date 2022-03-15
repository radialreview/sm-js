import React from 'react';

import { useSubscription, queryDefinition } from 'sm-js';
import smJS, { userNode, authenticate } from './smJS';

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
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    !!smJS.getToken({ tokenName: 'default' })
  );
  const [showData, setShowData] = React.useState(isAuthenticated);

  React.useEffect(() => {
    async function authenticateAndSetToken() {
      const res = await authenticate({
        username: 'INSERT APP USER ID HERE',
        password: 'INSERT PASSWORD HERE',
      });

      if (!res[0].data.Authenticate) {
        throw new Error('Authentication failed');
      }

      const {
        data: {
          Authenticate: { token },
        },
      } = res[0];

      if (!token) {
        console.log('no token');
      }

      smJS.setToken({
        tokenName: 'default',
        token,
      });

      setIsAuthenticated(true);
    }
    if (!isAuthenticated) {
      authenticateAndSetToken();
    }
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated && showData && <MyComponent />}
      <button
        disabled={!isAuthenticated}
        onClick={() => setShowData(showData => !showData)}
      >
        Toggle showing data
      </button>
    </>
  );
}

export default App;
