import { UnreachableCaseError } from './exceptions';
import {
  generateRandomBoolean,
  generateRandomNumber,
  generateRandomString,
} from './generateMockDataUtilities';
import { getQueryRecordFromQueryDefinition } from './queryDefinitionAdapters';
import { SMData } from './smDataTypes';
import { revisedPrepareForBE } from './transaction/revisedConvertNodeDataToSMPersistedData';

import {
  ISMData,
  QueryDefinitions,
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecordEntry,
  SMDataDefaultFn,
  SM_DATA_TYPES,
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
        const formattedMockNodeValues = generateMockValuesFromQueriedProperties(
          {
            queryRecord,
          }
        );

        if (queryRecord.relational) {
          relationalProperties = generateMockNodeDataFromQueryRecords({
            queryRecords: queryRecord.relational,
          });
        }
        arrayOfValues.push({
          ...formattedMockNodeValues,
          ...relationalProperties,
        });
      }

      mockedNodeDataReturnValues = arrayOfValues;
    } else {
      const formattedMockNodeValues = generateMockValuesFromQueriedProperties({
        queryRecord,
      });

      if (queryRecord.relational) {
        relationalProperties = generateMockNodeDataFromQueryRecords({
          queryRecords: queryRecord.relational,
        });
      }

      mockedNodeDataReturnValues = {
        ...formattedMockNodeValues,
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

  const valuesForNodeData = getMockValuesForISMDataRecord(propertiesToMock);

  console.log('NOLEY valuesForNodeData', valuesForNodeData);

  const valuesForNodeDataPreparedForBE = revisedPrepareForBE({
    obj: valuesForNodeData,
    ISMDataRecord: propertiesToMock,
    generatingMockData: true,
  });

  console.log(
    'NOLEYvaluesForNodeDataPreparedForBE ',
    valuesForNodeDataPreparedForBE
  );

  return valuesForNodeDataPreparedForBE;
}

export function getMockValuesForISMDataRecord(
  record: Record<string, SMData<any, any, any> | SMDataDefaultFn>
) {
  const returnValue = Object.entries(record).reduce((acc, [key, value]) => {
    if (typeof value === 'function') {
      acc[key] = getMockValueForISMData((value as any)._default as ISMData);
    } else {
      acc[key] = getMockValueForISMData(value);
    }
    return acc;
  }, {} as Record<string, any>);

  return returnValue;
}

function getMockValueForISMData(smData: ISMData) {
  switch (smData.type) {
    case SM_DATA_TYPES.string: {
      return smData.defaultValue ? smData.defaultValue : generateRandomString();
    }
    case SM_DATA_TYPES.maybeString: {
      return generateRandomString();
    }
    case SM_DATA_TYPES.number: {
      return smData.defaultValue
        ? smData.defaultValue
        : generateRandomNumber(1, 100);
    }
    case SM_DATA_TYPES.maybeNumber: {
      return generateRandomNumber(1, 100);
    }
    case SM_DATA_TYPES.boolean: {
      return smData.defaultValue
        ? smData.defaultValue
        : generateRandomBoolean();
    }
    case SM_DATA_TYPES.maybeBoolean: {
      return generateRandomBoolean();
    }
    case SM_DATA_TYPES.object: {
      return getMockValuesForISMDataRecord(smData.boxedValue);
    }
    case SM_DATA_TYPES.maybeObject: {
      return getMockValuesForISMDataRecord(smData.boxedValue);
    }
    case SM_DATA_TYPES.array: {
      const arrayContents: any = [];
      for (let i = 0; i < generateRandomNumber(1, 10); i++) {
        arrayContents.push(getMockValueForISMData(smData.boxedValue));
      }
      return arrayContents;
    }
    case SM_DATA_TYPES.maybeArray: {
      const arrayContents: any = [];
      for (let i = 0; i < generateRandomNumber(1, 10); i++) {
        arrayContents.push(getMockValueForISMData(smData.boxedValue));
      }
      return arrayContents;
    }
    case SM_DATA_TYPES.record: {
      const record: Record<string, any> = {};
      record[generateRandomString()] =
        typeof smData.boxedValue === 'function'
          ? getMockValueForISMData(
              (smData.boxedValue as any)._default as ISMData
            )
          : getMockValueForISMData(smData.boxedValue);
      return record;
    }
    case SM_DATA_TYPES.maybeRecord: {
      const record: Record<string, any> = {};
      record[generateRandomString()] =
        typeof smData.boxedValue === 'function'
          ? getMockValueForISMData(
              (smData.boxedValue as any)._default as ISMData
            )
          : getMockValueForISMData(smData.boxedValue);
      return record;
    }
    default:
      throw new UnreachableCaseError(smData.type as never);
  }
}
