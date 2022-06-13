import { generateValuesForNodeData } from './generateMockData';
import { array, boolean, number, object, record, string } from './smDataTypes';

test('generateValuesForNodeData returns correct data type', () => {
  const result = generateValuesForNodeData({
    number: number,
    string: string,
    boolean: boolean,
    arrayOfString: array(string),
    object: object({
      string: string,
      boolean: boolean,
      objectNested: object({ string: string, boolean: boolean }),
    }),
    record: record,
  });

  expect(result.number).toBeInstanceOf(Number);
  expect(result.string).toBeInstanceOf(String);
  expect(result.boolean).toBeInstanceOf(Boolean);
  expect(result.array).toBeInstanceOf(Array);
  expect(result.object).toBeInstanceOf(Object);
  //NOLEY NOTES: not entirely sure this return type is correct for below
  expect(result.record).toBeInstanceOf(Object as Record<string, any>);
});
