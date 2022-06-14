import { getQueryRecordFromQueryDefinition } from './queryDefinitionAdapters';
import { SMData } from './smDataTypes';
import { prepareForBE } from './transaction/convertNodeDataToSMPersistedData';

import {
  QueryDefinitions,
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecordEntry,
  SMDataDefaultFn,
} from './types';

// const mockString = [
//   'Billy',
//   'Nancy',
//   'Max',
//   'Will',
//   'Dustin',
//   'Jim',
//   'Eleven',
//   'Steve',
//   'Robin',
//   'Lucas',
// ];
// const mockNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
// // NOLEY NOTES: or could do...
// // function generateRandomNumber(min: number, max: number) {
// //   return Math.floor(Math.random() * (max - min + 1) + min)
// // }

export function generateMockData<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions }) {
  const { queryDefinitions } = opts;
  let mockedQueries: Record<string, Array<Record<string, any>>> = {};

  const queryRecords = getQueryRecordFromQueryDefinition({
    queryDefinitions: queryDefinitions,
    queryId: 'generatingMockDataId',
  });

  mockedQueries = generateMockValuesForQueryRecords({
    queryRecords,
    isRootLevel: true,
  });

  return mockedQueries;
}
// 1). if the qD is just the node definition (todos: useTodoNode()), generate mock data using all of the nodes properties
// 2). if the qD has a map fn but it's undefined, also generate mock data using all of the nodes properties
// 3). if the qD has a map fn that's defined, generate mock data for the node properties being queried, but also,
// discover if there's any relational queries in the map fn and return mock data for those as well

function generateMockValuesForQueryRecords(opts: {
  queryRecords: QueryRecord;
  isRootLevel?: boolean;
}) {
  const { queryRecords } = opts;
  let mockedQueries: Record<string, any> = {};

  Object.keys(queryRecords).forEach(queryRecordsAlias => {
    const queryRecord: QueryRecordEntry | RelationalQueryRecordEntry =
      queryRecords[queryRecordsAlias];
    let relational: Record<string, any> = {};

    const formattedQueryRecordWithValues = mapQueriedPropertiesToValues({
      queryRecord,
    });

    if (queryRecord.relational) {
      relational = generateMockValuesForQueryRecords({
        queryRecords: queryRecord.relational,
      });
    }

    const generatedRecord = {
      ...formattedQueryRecordWithValues,
      ...relational,
    };

    mockedQueries[queryRecordsAlias] =
      queryRecord.underIds ||
      queryRecord.ids ||
      'byReferenceArray' in queryRecord ||
      'children' in queryRecord
        ? [generatedRecord]
        : generatedRecord;
  });

  return mockedQueries;
}

function mapQueriedPropertiesToValues(opts: {
  queryRecord: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const queryRecord = opts.queryRecord;
  let queryMockResponse;

  const propertiesToMock = Object.keys(queryRecord.def.smData)
    .filter(nodeProperty => {
      //NOLEY NOTES: ...PROPERTIES_QUERIED_FOR_ALL_NODES
      return queryRecord.properties.includes(nodeProperty);
    })
    .reduce((acc, item) => {
      //NOLEY NOTES: fix anys
      acc[item] = (queryRecord.def.smData as any)[item];
      return acc;
    }, {} as Record<string, any>);

  queryMockResponse = generateValuesForNodeData(propertiesToMock);

  const propertiesPreparedForBE = prepareForBE(queryMockResponse);

  return propertiesPreparedForBE;
}

export function generateValuesForNodeData(
  data: Record<string, SMData<any, any, any> | SMDataDefaultFn>
) {
  console.log('NOLEY DATA', data);

  //NOLEY NOTES: expectedReturnType would be an object with values subsituted in, so passing in
  // {
  //   id: [Function: string] { _default: [SMData], optional: [SMData] },
  //   firstName: [Function: string] { _default: [SMData], optional: [SMData] },
  //   lastName: SMData {
  //     type: 's',
  //     parser: [Function: parser],
  //     boxedValue: undefined,
  //     defaultValue: 'joe',
  //     isOptional: false
  //   },
  //   address: SMData {
  //     type: 'o',
  //     parser: [Function: parser],
  //     boxedValue: [Object],
  //     defaultValue: null,
  //     isOptional: false
  //   }
  // }
  // this ^^^ should return something like:
  const result = {
    id: '1234',
    firstName: 'Earl',
    lastName: 'Johnson',
    address: { state: 'OR', apt: { floor: '1', number: '123' } },
  };

  return result;
}

// if (value.type === SM_DATA_TYPES.string) {
//   console.log('STRING');
//   if (value.defaultValue.length) {
//   }
// }
// if (value.type === SM_DATA_TYPES.maybeString) {
// }
// if (value.type === SM_DATA_TYPES.number) {
// }
// if (value.type === SM_DATA_TYPES.maybeNumber) {
// }
// if (value.type === SM_DATA_TYPES.boolean) {
// }
// if (value.type === SM_DATA_TYPES.maybeBoolean) {
// }
// if (value.type === SM_DATA_TYPES.object) {
// }
// if (value.type === SM_DATA_TYPES.maybeObject) {
// }
// if (value.type === SM_DATA_TYPES.record) {
// }
// if (value.type === SM_DATA_TYPES.maybeRecord) {
// }
// if (value.type === SM_DATA_TYPES.array) {
// }
// if (value.type === SM_DATA_TYPES.maybeArray) {
// }
