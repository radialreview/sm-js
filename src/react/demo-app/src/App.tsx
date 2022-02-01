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

function MyComponent() {
  const { data } = sm.useSubscription({
    users: userNode,
  });

  return (
    <div className="App">
      {data.users.map((user: any) => (
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
