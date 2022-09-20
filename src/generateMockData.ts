import { extend } from './dataUtilities';
import { UnreachableCaseError } from './exceptions';
import {
  generateRandomBoolean,
  generateRandomNumber,
  generateRandomString,
} from './generateMockDataUtilities';
import { getQueryRecordFromQueryDefinition } from './queryDefinitionAdapters';
import { revisedPrepareForBE } from './transaction/revisedConvertNodeDataToSMPersistedData';

import {
  IData,
  QueryDefinitions,
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecordEntry,
  DataDefaultFn,
  DATA_TYPES,
} from './types';

type MockValuesIDataReturnType =
  | Record<string, any>
  | number
  | string
  | boolean
  | Array<any>;

function getMockValueForIData(data: IData): MockValuesIDataReturnType {
  switch (data.type) {
    case DATA_TYPES.string: {
      return generateRandomString();
    }
    case DATA_TYPES.maybeString: {
      // 50/50 chance to get a value or null
      return getRandomItemFromArray([generateRandomString(), null]);
    }
    case DATA_TYPES.stringEnum: {
      return getRandomItemFromArray(data.acceptableValues as Array<any>);
    }
    case DATA_TYPES.maybeStringEnum: {
      return getRandomItemFromArray([
        getRandomItemFromArray(data.acceptableValues as Array<any>),
        null,
      ]);
    }
    case DATA_TYPES.number: {
      return generateRandomNumber(1, 100);
    }
    case DATA_TYPES.maybeNumber: {
      return getRandomItemFromArray([generateRandomNumber(1, 100), null]);
    }
    case DATA_TYPES.boolean: {
      return generateRandomBoolean();
    }
    case DATA_TYPES.maybeBoolean: {
      return getRandomItemFromArray([generateRandomBoolean(), null]);
    }
    case DATA_TYPES.object: {
      return getMockValuesForIDataRecord(data.boxedValue);
    }
    case DATA_TYPES.maybeObject: {
      return getRandomItemFromArray([
        getMockValuesForIDataRecord(data.boxedValue),
        null,
      ]);
    }
    case DATA_TYPES.array: {
      return new Array(generateRandomNumber(1, 10)).fill('').map(_ => {
        return typeof data.boxedValue === 'function'
          ? getMockValueForIData(data.boxedValue._default as IData)
          : getMockValueForIData(data.boxedValue);
      });
    }
    case DATA_TYPES.maybeArray: {
      return getRandomItemFromArray([
        new Array(generateRandomNumber(1, 10)).fill('').map(_ => {
          return typeof data.boxedValue === 'function'
            ? getMockValueForIData(data.boxedValue._default as IData)
            : getMockValueForIData(data.boxedValue);
        }),
        null,
      ]);
    }
    case DATA_TYPES.record: {
      return {
        [generateRandomString()]:
          typeof data.boxedValue === 'function'
            ? getMockValueForIData(data.boxedValue._default as IData)
            : getMockValueForIData(data.boxedValue),
      };
    }
    case DATA_TYPES.maybeRecord: {
      return getRandomItemFromArray([
        {
          [generateRandomString()]:
            typeof data.boxedValue === 'function'
              ? getMockValueForIData(data.boxedValue._default as IData)
              : getMockValueForIData(data.boxedValue),
        },
        null,
      ]);
    }
    default:
      throw new UnreachableCaseError(data.type as never);
  }
}

export function getMockValuesForIDataRecord(
  record: Record<string, IData | DataDefaultFn>
) {
  return Object.entries(record).reduce((acc, [key, value]) => {
    if (typeof value === 'function') {
      acc[key] = getMockValueForIData(value._default as IData);
    } else {
      acc[key] = getMockValueForIData(value);
    }
    return acc;
  }, {} as Record<string, any>);
}

function generateMockNodeDataFromQueryRecordForQueriedProperties(opts: {
  queryRecord: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const queryRecord = opts.queryRecord;
  const nodePropertiesToMock = Object.keys(queryRecord.def.data)
    .filter(nodeProperty => {
      return queryRecord.properties.includes(nodeProperty);
    })
    .reduce((acc, item) => {
      acc[item] = (queryRecord.def.data as Record<
        string,
        IData | DataDefaultFn
      >)[item];
      return acc;
    }, {} as Record<string, IData | DataDefaultFn>);

  const mockedValues = {
    type: opts.queryRecord.def.type,
    version: '1',
    ...getMockValuesForIDataRecord(nodePropertiesToMock),
  };

  if (queryRecord.def.generateMockData) {
    const queryRecordMockData = queryRecord.def.generateMockData();
    const mockDataPropertiesToAddToExtension = Object.keys(
      queryRecordMockData
    ).reduce(
      (acc, item) => {
        if (queryRecord.properties.includes(item)) {
          acc[item] = queryRecordMockData[item];
        }
        return acc;
      },
      {} as Partial<{
        [x: string]: any;
      }>
    );

    extend({
      object: mockedValues,
      extension: mockDataPropertiesToAddToExtension,
      extendNestedObjects: true,
      deleteKeysNotInExtension: false,
    });
  }

  const valuesForNodeDataPreparedForBE = revisedPrepareForBE({
    obj: mockedValues,
    IDataRecord: nodePropertiesToMock,
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
    const returnValueShouldBeAnArray =
      !!queryRecord.id === false && !('oneToOne' in queryRecord);

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

      mockedNodeDataReturnValues = { nodes: arrayOfMockNodeValues };
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

function getRandomItemFromArray(array: Array<any>) {
  return array[Math.floor(Math.random() * array.length)];
}
