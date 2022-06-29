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

type MockValuesISMDataReturnType =
  | Record<string, any>
  | number
  | string
  | boolean
  | Array<any>;

function getMockValueForISMData(smData: ISMData): MockValuesISMDataReturnType {
  switch (smData.type) {
    case SM_DATA_TYPES.string: {
      // We return the default value if it exists to account for cases where the string must be an enum.
      return smData.defaultValue ? smData.defaultValue : generateRandomString();
    }
    case SM_DATA_TYPES.maybeString: {
      return generateRandomString();
    }
    case SM_DATA_TYPES.number: {
      return generateRandomNumber(1, 100);
    }
    case SM_DATA_TYPES.maybeNumber: {
      return generateRandomNumber(1, 100);
    }
    case SM_DATA_TYPES.boolean: {
      return generateRandomBoolean();
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
      return new Array(generateRandomNumber(1, 10)).fill('').map(_ => {
        return typeof smData.boxedValue === 'function'
          ? getMockValueForISMData(
              (smData.boxedValue as any)._default as ISMData
            )
          : getMockValueForISMData(smData.boxedValue);
      });
    }
    case SM_DATA_TYPES.maybeArray: {
      return new Array(generateRandomNumber(1, 10)).fill('').map(_ => {
        return typeof smData.boxedValue === 'function'
          ? getMockValueForISMData(
              (smData.boxedValue as any)._default as ISMData
            )
          : getMockValueForISMData(smData.boxedValue);
      });
    }
    case SM_DATA_TYPES.record: {
      return {
        [generateRandomString()]:
          typeof smData.boxedValue === 'function'
            ? getMockValueForISMData(
                (smData.boxedValue as any)._default as ISMData
              )
            : getMockValueForISMData(smData.boxedValue),
      };
    }
    case SM_DATA_TYPES.maybeRecord: {
      return {
        [generateRandomString()]:
          typeof smData.boxedValue === 'function'
            ? getMockValueForISMData(
                (smData.boxedValue as any)._default as ISMData
              )
            : getMockValueForISMData(smData.boxedValue),
      };
    }
    default:
      throw new UnreachableCaseError(smData.type as never);
  }
}

export function getMockValuesForISMDataRecord(
  record: Record<string, SMData<any, any, any> | SMDataDefaultFn>
) {
  return Object.entries(record).reduce((acc, [key, value]) => {
    if (typeof value === 'function') {
      acc[key] = getMockValueForISMData((value as any)._default as ISMData);
    } else {
      acc[key] = getMockValueForISMData(value);
    }
    return acc;
  }, {} as Record<string, any>);
}

function generateMockNodeDataFromQueryRecordForQueriedProperties(opts: {
  queryRecord: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const queryRecord = opts.queryRecord;
  const nodePropertiesToMock = Object.keys(queryRecord.def.smData)
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

  const mockedValues = {
    type: opts.queryRecord.def.type,
    version: '1',
    ...getMockValuesForISMDataRecord(nodePropertiesToMock),
  };

  const valuesForNodeDataPreparedForBE = revisedPrepareForBE({
    obj: mockedValues,
    ISMDataRecord: nodePropertiesToMock,
    generatingMockData: true,
  });

  return valuesForNodeDataPreparedForBE;
}

function generateMockNodeDataForAllQueryRecords(opts: {
  queryRecords: QueryRecord;
}) {
  const { queryRecords } = opts;
  const mockedNodeData: Record<string, any> = {};

  Object.keys(queryRecords).forEach(queryRecordAlias => {
    const queryRecord: QueryRecordEntry | RelationalQueryRecordEntry =
      queryRecords[queryRecordAlias];
    const returnValueShouldBeAnArray = !!queryRecord.id === false;

    let mockedNodeDataReturnValues;
    let relationalMockNodeProperties: Record<string, any> = {};

    if (returnValueShouldBeAnArray) {
      const numOfResultsToGenerate = generateRandomNumber(2, 10);
      const arrayOfMockNodeValues = [];

      for (let i = 0; i < numOfResultsToGenerate; i++) {
        const mockNodeDataForQueryRecord = generateMockNodeDataFromQueryRecordForQueriedProperties(
          {
            queryRecord,
          }
        );

        if (queryRecord.relational) {
          relationalMockNodeProperties = generateMockNodeDataForAllQueryRecords(
            {
              queryRecords: queryRecord.relational,
            }
          );
        }
        arrayOfMockNodeValues.push({
          ...mockNodeDataForQueryRecord,
          ...relationalMockNodeProperties,
        });
      }

      mockedNodeDataReturnValues = arrayOfMockNodeValues;
    } else {
      const mockNodeDataForQueryRecord = generateMockNodeDataFromQueryRecordForQueriedProperties(
        {
          queryRecord,
        }
      );

      if (queryRecord.relational) {
        relationalMockNodeProperties = generateMockNodeDataForAllQueryRecords({
          queryRecords: queryRecord.relational,
        });
      }

      mockedNodeDataReturnValues = {
        ...mockNodeDataForQueryRecord,
        ...relationalMockNodeProperties,
      };
    }

    mockedNodeData[queryRecordAlias] = mockedNodeDataReturnValues;
  });

  return mockedNodeData;
}

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

  return generateMockNodeDataForAllQueryRecords({
    queryRecords,
  });
}
