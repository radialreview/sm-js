import { generateRandomNumber } from './dataUtilities';
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

export function generateMockNodeDataFromQueryDefinitions<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions; queryId: string }) {
  const { queryDefinitions, queryId } = opts;

  const queryRecords = getQueryRecordFromQueryDefinition({
    queryDefinitions: queryDefinitions,
    queryId: queryId,
  });

  return generateMockNodeDataFromQueryRecords({
    queryRecords,
  });
}
// NOLEY NOTES:
// 1). if the qD is just the node definition (todos: useTodoNode()), generate mock data using all of the nodes properties
// 2). if the qD has a map fn but it's undefined, also generate mock data using all of the nodes properties
// 3). if the qD has a map fn that's defined, generate mock data for the node properties being queried, but also,
// discover if there's any relational queries in the map fn and return mock data for those as well

function generateMockNodeDataFromQueryRecords(opts: {
  queryRecords: QueryRecord;
}) {
  const { queryRecords } = opts;
  const mockedNodeData: Record<string, any> = {};

  //NOLEY NOTES: might be a little icky here revisit
  Object.keys(queryRecords).forEach(queryRecordAlias => {
    const queryRecord: QueryRecordEntry | RelationalQueryRecordEntry =
      queryRecords[queryRecordAlias];
    const returnValueShouldBeAnArray =
      !!queryRecord.underIds ||
      !!queryRecord.ids ||
      'byReferenceArray' in queryRecord ||
      'children' in queryRecord;

    let mockedNodeDataReturnValues;
    let relationalProperties: Record<string, any> = {};

    if (returnValueShouldBeAnArray) {
      const numOfRecordsToGenerate = generateRandomNumber(2, 10);
      const arrayOfValues = [];

      for (let i = 0; i < numOfRecordsToGenerate; i++) {
        const formattedMockValues = generateMockValuesFromQueriedProperties({
          queryRecord,
        });

        if (queryRecord.relational) {
          relationalProperties = generateMockNodeDataFromQueryRecords({
            queryRecords: queryRecord.relational,
          });
        }
        arrayOfValues.push({
          ...formattedMockValues,
          ...relationalProperties,
        });
      }

      mockedNodeDataReturnValues = arrayOfValues;
    } else {
      const formattedMockValues = generateMockValuesFromQueriedProperties({
        queryRecord,
      });

      if (queryRecord.relational) {
        relationalProperties = generateMockNodeDataFromQueryRecords({
          queryRecords: queryRecord.relational,
        });
      }

      mockedNodeDataReturnValues = {
        ...formattedMockValues,
        ...relationalProperties,
      };
    }

    mockedNodeData[queryRecordAlias] = mockedNodeDataReturnValues;
  });

  return mockedNodeData;
}

function generateMockValuesFromQueriedProperties(opts: {
  queryRecord: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const queryRecord = opts.queryRecord;

  //NOLEY NOTES: consider:
  // 1). if the qD is just the node definition (todos: useTodoNode()), generate mock data using all of the nodes properties // believe this works
  // 2). if the qD has a map fn but it's undefined, also generate mock data using all of the nodes properties // think this works...
  const propertiesToMock = Object.keys(queryRecord.def.smData)
    .filter(nodeProperty => {
      return queryRecord.properties.includes(nodeProperty);
    })
    .reduce((acc, item) => {
      acc[item] = (queryRecord.def.smData as Record<
        string,
        SMData<any, any, any> | SMDataDefaultFn
      >)[item];
      return acc;
    }, {} as Record<string, SMData<any, any, any> | SMDataDefaultFn>);

  const valuesForNodeData = generateValuesForNodeData(propertiesToMock);
  const valuesForNodeDataPreparedForBE = prepareForBE(valuesForNodeData);

  return valuesForNodeDataPreparedForBE;
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
