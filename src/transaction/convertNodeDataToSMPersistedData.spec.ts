import { convertNodeDataToSMPersistedData } from './convertNodeDataToSMPersistedData';

test('convertNodeDataToSMPersistedData converts booleans', () => {
  expect(convertNodeDataToSMPersistedData({ type: 'mock-thing', test: true }))
    .toMatchInlineSnapshot(`
    "type: \\"mock-thing\\"
    test: \\"true\\""
  `);
});

test('convertNodeDataToSMPersistedData converts numbers', () => {
  expect(convertNodeDataToSMPersistedData({ type: 'mock-thing', test: 2 }))
    .toMatchInlineSnapshot(`
    "type: \\"mock-thing\\"
    test: \\"2\\""
  `);
});

test('convertNodeDataToSMPersistedData passes through strings', () => {
  expect(
    convertNodeDataToSMPersistedData({ type: 'mock-thing', test: 'string' })
  ).toMatchInlineSnapshot(`
    "type: \\"mock-thing\\"
    test: \\"string\\""
  `);
});

test('convertNodeDataToSMPersistedData escapes quotes and new lines', () => {
  expect(
    convertNodeDataToSMPersistedData({ type: 'mock-thing', test: '"yes"\n' })
  ).toMatchInlineSnapshot(`
    "type: \\"mock-thing\\"
    test: \\"\\\\\\"yes\\\\\\"\\\\n\\""
  `);
});
