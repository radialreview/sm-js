import React from 'react';
import * as sm from 'sm-js';

const userNode = sm.def({
  type: 'tt-user',
  properties: {
    id: sm.string,
    firstName: sm.string,
  },
});

sm.setToken('default', {
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImY5ZGIxYjA5LTdiMGItNDMzYy1iZDg2LTg5M2MzZmQxNDFmMCIsIk5hbWVzcGFjZUFwcGxpY2F0aW9uSWQiOiIyIiwibmJmIjoxNjQzNjU5MTc4LCJleHAiOjE2NDM3NDU1NzgsImlhdCI6MTY0MzY1OTE3OH0.xqtLXnNH3JnfZr8Tw3XPCsOY8gUvzDi8BvrX7ynhawg',
});

function App() {
  const { users } = sm.useSubscription({
    users: userNode,
  });

  console.log('users', users);

  return (
    <div className="App">
      {users.map((user: any) => (
        <div key={user.id}>{user.firstName}</div>
      ))}
    </div>
  );
}

export default App;
