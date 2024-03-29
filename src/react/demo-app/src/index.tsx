import React from 'react';
import ReactDOM from 'react-dom';
import { MMGQLProvider } from 'mm-gql';
import App from './App';
import reportWebVitals from './reportWebVitals';

import mmGQL from './mmGQL';

ReactDOM.render(
  <React.StrictMode>
    <React.Suspense fallback={'loading'}>
      <MMGQLProvider mmGQL={mmGQL}>
        <App />
      </MMGQLProvider>
    </React.Suspense>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
