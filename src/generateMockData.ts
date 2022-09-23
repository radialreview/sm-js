import {
  DEFAULT_PAGE_SIZE,
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
  TOTAL_COUNT_PROPERTY_KEY,
} from './consts';
import { extend } from './dataUtilities';
import { UnreachableCaseError } from './exceptions';
import {
  generateRandomBoolean,
  generateRandomNumber,
  generateRandomString,
} from './generateMockDataUtilities';
import { PageInfoFromResults } from './nodesCollection';
import { queryRecordEntryReturnsArrayOfData } from './queryDefinitionAdapters';
import { revisedPrepareForBE } from './transaction/revisedConvertNodeDataToSMPersistedData';

import {
  IData,
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecordEntry,
  DataDefaultFn,
  DATA_TYPES,
  RelationalQueryRecord,
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
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const queryRecordEntry = opts.queryRecordEntry;
  const nodePropertiesToMock = Object.keys(queryRecordEntry.def.data)
    .filter(nodeProperty => {
      return queryRecordEntry.properties.includes(nodeProperty);
    })
    .reduce((acc, item) => {
      acc[item] = (queryRecordEntry.def.data as Record<
        string,
        IData | DataDefaultFn
      >)[item];
      return acc;
    }, {} as Record<string, IData | DataDefaultFn>);

  const mockedValues = {
    type: opts.queryRecordEntry.def.type,
    version: '1',
    ...getMockValuesForIDataRecord(nodePropertiesToMock),
  };

  if (queryRecordEntry.def.generateMockData) {
    const queryRecordEntryMockData = queryRecordEntry.def.generateMockData();
    const mockDataPropertiesToAddToExtension = Object.keys(
      queryRecordEntryMockData
    ).reduce(
      (acc, item) => {
        if (queryRecordEntry.properties.includes(item)) {
          acc[item] = queryRecordEntryMockData[item];
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

export function generateMockNodeDataForQueryRecord(opts: {
  queryRecord: QueryRecord | RelationalQueryRecord;
}) {
  const { queryRecord } = opts;
  const mockedNodeData: Record<string, any> = {};

  Object.keys(queryRecord).forEach(queryRecordAlias => {
    const queryRecordEntryForThisAlias:
      | QueryRecordEntry
      | RelationalQueryRecordEntry = queryRecord[queryRecordAlias];
    const returnValueShouldBeAnArray = queryRecordEntryReturnsArrayOfData({
      queryRecordEntry: queryRecordEntryForThisAlias,
    });

    let mockedNodeDataReturnValues;
    let relationalMockNodeProperties: Record<string, any> = {};

    if (returnValueShouldBeAnArray) {
      const pageSize =
        queryRecordEntryForThisAlias.pagination?.itemsPerPage ||
        DEFAULT_PAGE_SIZE;
      const numOfResultsToGenerate = generateRandomNumber(0, pageSize * 5);
      const arrayOfMockNodeValues = [];

      for (let i = 0; i < numOfResultsToGenerate; i++) {
        const mockNodeDataForQueryRecord = generateMockNodeDataFromQueryRecordForQueriedProperties(
          {
            queryRecordEntry: queryRecordEntryForThisAlias,
          }
        );

        if (queryRecordEntryForThisAlias.relational) {
          relationalMockNodeProperties = generateMockNodeDataForQueryRecord({
            queryRecord: queryRecordEntryForThisAlias.relational,
          });
        }
        arrayOfMockNodeValues.push({
          ...mockNodeDataForQueryRecord,
          ...relationalMockNodeProperties,
        });
      }

      mockedNodeDataReturnValues = {
        [NODES_PROPERTY_KEY]: arrayOfMockNodeValues,
        [TOTAL_COUNT_PROPERTY_KEY]: arrayOfMockNodeValues.length,
        [PAGE_INFO_PROPERTY_KEY]: {
          endCursor: 'xyz',
          startCursor: 'yzx',
          hasPreviousPage: false,
          hasNextPage: pageSize < arrayOfMockNodeValues.length,
        } as PageInfoFromResults,
      };
    } else {
      const mockNodeDataForQueryRecord = generateMockNodeDataFromQueryRecordForQueriedProperties(
        {
          queryRecordEntry: queryRecordEntryForThisAlias,
        }
      );

      if (queryRecordEntryForThisAlias.relational) {
        relationalMockNodeProperties = generateMockNodeDataForQueryRecord({
          queryRecord: queryRecordEntryForThisAlias.relational as RelationalQueryRecord,
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

function getRandomItemFromArray(array: Array<any>) {
  return array[Math.floor(Math.random() * array.length)];
}
