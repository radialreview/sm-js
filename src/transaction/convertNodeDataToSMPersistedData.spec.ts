import { autoIndentGQL } from '../specUtilities';
import { convertNodeDataToSMPersistedData } from './convertNodeDataToSMPersistedData';

test('convertNodeDataToSMPersistedData converts booleans', () => {
  expect(
    convertNodeDataToSMPersistedData({ test: true })
  ).toMatchInlineSnapshot(`"test: \\"true\\""`);
});

test('convertNodeDataToSMPersistedData converts numbers', () => {
  expect(convertNodeDataToSMPersistedData({ test: 2 })).toMatchInlineSnapshot(
    `"test: \\"2\\""`
  );
});

test('convertNodeDataToSMPersistedData passes through strings', () => {
  expect(
    convertNodeDataToSMPersistedData({ test: 'string' })
  ).toMatchInlineSnapshot(`"test: \\"string\\""`);
});

test('convertNodeDataToSMPersistedData escapes quotes and new lines', () => {
  expect(
    convertNodeDataToSMPersistedData({ test: '"yes"\n' })
  ).toMatchInlineSnapshot(`"test: \\"\\\\\\"yes\\\\\\"\\\\n\\""`);
});

test('convertNodeDataToSMPersistedData parses data in childNodes', () => {
  expect(
    autoIndentGQL(
      convertNodeDataToSMPersistedData({
        childNodes: [
          { type: 'mock-thing-child', boolean: true, number: 2, string: 'yes' },
        ],
      })
    )
  ).toMatchInlineSnapshot(`
    "childNodes: [
     {
       type: \\"mock-thing-child\\"
       boolean: \\"true\\"
       number: \\"2\\"
       string: \\"yes\\"
     }
    ]"
  `);
});
