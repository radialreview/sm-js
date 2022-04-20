import React from 'react';

import { queryDefinition, useSubscription, useSubscriptions } from 'sm-js';
import smJS, {
  userNode,
  authenticate,
  todoNode,
  authenticateWithAPI,
} from './smJS';

function MyComponent() {
  const {
    data: { users, todos },
  } = useSubscription(
    {
      // regular: {
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
      // },
      // nonSuspended: {
      todos: queryDefinition({
        def: todoNode,
        map: undefined,
      }),
      // },
    }
    // {
    //   nonSuspended: {
    //     doNotSuspend: true,
    //   },
    // }
  );

  console.log('nonSuspended', users);
  console.log('regular', todos);
  return null;
  // return (
  //   <div className="App">
  //     {regular.data.users.map(user => (
  //       <div key={user.id}>
  //         {user.firstName} {user.lastName}
  //         <br />
  //         todos:{' '}
  //         {user.todos.length
  //           ? user.todos.map(todo => todo.task).join(', ')
  //           : 'None.'}
  //         <br />
  //         <br />
  //       </div>
  //     ))}
  //   </div>
  // );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    !!smJS.getToken({ tokenName: DEFAULT_TOKEN_NAME })
  );
  const [showData, setShowData] = React.useState(isAuthenticated);

  React.useEffect(() => {
    async function authenticateAndSetToken() {
      // const res = await authenticate({
      //   username: 'meida.m+60@meetings.io',
      //   password: 'Password1!',
      // });

      // if (!res[0].data.Authenticate) {
      //   throw new Error('Authentication failed');
      // }

      // const {
      //   data: {
      //     Authenticate: { token },
      //   },
      // } = res[0];

      const token = await authenticateWithAPI({
        email: 'meida.m+60@meetings.io',
        password: 'Password1!',
      });

      smJS.setToken({
        tokenName: DEFAULT_TOKEN_NAME,
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
