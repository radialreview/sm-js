import React from 'react';
import { render } from '@testing-library/react';

import { C, Provider } from './test';

test('does it work?', () => {
  render(
    <Provider>
      <C />
    </Provider>
  );
});
