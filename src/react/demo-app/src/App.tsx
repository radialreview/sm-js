import React from 'react';

import smJS from './smJS';
import { string, useSubscription } from 'sm-js';

const userNode = smJS.def({
  type: 'tt-user',
  properties: {
    id: string,
    firstName: string,
  },
});

smJS.setToken({
  tokenName: 'default',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImY5ZGIxYjA5LTdiMGItNDMzYy1iZDg2LTg5M2MzZmQxNDFmMCIsIk5hbWVzcGFjZUFwcGxpY2F0aW9uSWQiOiIyIiwibmJmIjoxNjQzNjU5MTc4LCJleHAiOjE2NDM3NDU1NzgsImlhdCI6MTY0MzY1OTE3OH0.xqtLXnNH3JnfZr8Tw3XPCsOY8gUvzDi8BvrX7ynhawg',
});

function MyComponent() {
  const { data } = useSubscription({
    users: userNode,
  });

  return (
    <div className="App">
      {data.users.map(user => (
        <div key={user.id}>{user.firstName}</div>
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
