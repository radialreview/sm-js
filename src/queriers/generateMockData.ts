import {
  DEFAULT_PAGE_SIZE,
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
  TOTAL_COUNT_PROPERTY_KEY,
} from '../consts';
import { deepClone, extend } from '../dataUtilities';
import { UnreachableCaseError } from '../exceptions';
import {
  generateRandomBoolean,
  generateRandomId,
  generateRandomNumber,
  generateRandomString,
} from './generateMockDataUtilities';
import { PageInfoFromResults } from '../nodesCollection';
import { queryRecordEntryReturnsArrayOfData } from './queryDefinitionAdapters';

import {
  IData,
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecordEntry,
  DataDefaultFn,
  DATA_TYPES,
  RelationalQueryRecord,
  ValidFilterForNode,
  INode,
} from '../types';

type MockValuesIDataReturnType =
  | Record<string, any>
  | number
  | string
  | boolean
  | Array<any>;

const MAX_NUMBER_DEVIATION = 1000;

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

function getMockDataThatConformsToFilter(opts: {
  filter: ValidFilterForNode<INode>;
  data: Record<string, IData | DataDefaultFn>;
}) {
  const { filter, data } = opts;
  const mockData = {} as Record<string, any>;

  Object.entries(filter).forEach(([filterKey, filterValue]) => {
    // this function does not need to deal with relational filters
    // since those are moved down to the relational queries themselves when generating the mock data
    const isFilterOnDataOnNode =
      (data[filterKey] as IData | DataDefaultFn) != null;

    const iData = isFilterOnDataOnNode
      ? typeof data[filterKey] === 'function'
        ? (data[filterKey] as DataDefaultFn)._default
        : (data[filterKey] as IData)
      : null;
    const dataType = iData ? iData.type : null;

    if (iData) {
      if (filterValue !== null && typeof filterValue === 'object') {
        if (
          dataType === DATA_TYPES.object ||
          dataType === DATA_TYPES.maybeObject
        ) {
          mockData[filterKey] = getMockDataThatConformsToFilter({
            filter: filterValue as Record<string, any>,
            data: iData.boxedValue,
          });
          return;
        }

        const { condition, ...restOfFilter } = filterValue;

        if (Object.keys(restOfFilter).length !== 1) {
          // @TODO ignoring the rest of the filter for now
          // since handling a complex filter with multiple properties would be somewhat complex
          // and I don't think it's necessary for the mock data generator
          // the side effect of this is that some of the mock data may not match the filter
          // if more than 1 filter condition is used (which is rare)
        }

        const operator = Object.keys(restOfFilter)[0];
        const operatorValue = restOfFilter[operator];

        switch (operator) {
          case 'eq': {
            mockData[filterKey] = operatorValue;
            break;
          }
          case 'neq': {
            let valueSet = false;
            do {
              const proposedValue = getMockValueForIData(iData);
              if (proposedValue !== operatorValue) {
                valueSet = true;
                mockData[filterKey] = proposedValue;
              }
            } while (!valueSet);
            break;
          }
          case 'gt':
          case 'nlte': {
            mockData[filterKey] =
              operatorValue + generateRandomNumber(1, MAX_NUMBER_DEVIATION);
            break;
          }
          case 'ngt':
          case 'lte': {
            mockData[filterKey] =
              operatorValue -
              generateRandomNumber(
                0,
                // if the operator value is above 0, try to return an int that is also positive
                // otherwise all bets are off, return a negative number up to MAX_NUMBER_DEVIATION
                operatorValue > 0 ? operatorValue : MAX_NUMBER_DEVIATION
              );
            break;
          }
          case 'gte':
          case 'nlt': {
            mockData[filterKey] =
              operatorValue + generateRandomNumber(0, MAX_NUMBER_DEVIATION);
            break;
          }
          case 'ngte':
          case 'lt': {
            mockData[filterKey] =
              operatorValue -
              generateRandomNumber(
                1,
                // if the operator value is above 0, try to return an int that is also positive
                // otherwise all bets are off, return a negative number up to MAX_NUMBER_DEVIATION
                operatorValue > 0 ? operatorValue : MAX_NUMBER_DEVIATION
              );
            break;
          }
          case 'contains': {
            let valueSet = false;
            do {
              const proposedValue = getMockValueForIData(iData);
              if (proposedValue != null && typeof proposedValue === 'string') {
                if (!proposedValue.includes(operatorValue)) {
                  const indexToInjectOperatorValue = generateRandomNumber(
                    0,
                    proposedValue.length - 1
                  );
                  mockData[filterKey] = `${proposedValue.slice(
                    0,
                    indexToInjectOperatorValue
                  )}${operatorValue}${proposedValue.slice(
                    indexToInjectOperatorValue
                  )}`;
                } else {
                  mockData[filterKey] = proposedValue;
                }
                valueSet = true;
              }
            } while (!valueSet);
            break;
          }
          case 'ncontains': {
            let valueSet = false;
            // if not equal, generate random values until we get one that is not equal
            do {
              const proposedValue = getMockValueForIData(iData);
              if (
                proposedValue == null ||
                (typeof proposedValue === 'string' &&
                  !proposedValue.includes(operatorValue))
              ) {
                valueSet = true;
                mockData[filterKey] = proposedValue;
              }
            } while (!valueSet);
            break;
          }
          case 'startsWith': {
            const proposedValue = getMockValueForIData(iData);
            mockData[filterKey] = operatorValue + proposedValue;
            break;
          }
          case 'nstartsWith': {
            let valueSet = false;
            // if not equal, generate random values until we get one that is not equal
            do {
              const proposedValue = getMockValueForIData(iData);
              if (
                proposedValue == null ||
                (typeof proposedValue === 'string' &&
                  !proposedValue.startsWith(operatorValue))
              ) {
                valueSet = true;
                mockData[filterKey] = proposedValue;
              }
            } while (!valueSet);
            break;
          }
          case 'endsWith': {
            const proposedValue = getMockValueForIData(iData);
            mockData[filterKey] = proposedValue + operatorValue;
            break;
          }
          case 'nendsWith': {
            let valueSet = false;
            // if not equal, generate random values until we get one that is not equal
            do {
              const proposedValue = getMockValueForIData(iData);
              if (
                proposedValue == null ||
                (typeof proposedValue === 'string' &&
                  !proposedValue.endsWith(operatorValue))
              ) {
                valueSet = true;
                mockData[filterKey] = proposedValue;
              }
            } while (!valueSet);
            break;
          }
        }
      } else if (filterValue !== undefined) {
        mockData[filterKey] = filterValue;
      }
    }
  });

  return mockData;
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

function generateMockNodeDataForQueryRecordEntry(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const queryRecordEntry = opts.queryRecordEntry;
  const nodePropertiesToMock = Object.keys(queryRecordEntry.def.data)
    .filter(nodeProperty => {
      return queryRecordEntry.properties.some(prop =>
        prop.startsWith(nodeProperty)
      );
    })
    .reduce((acc, item) => {
      acc[item] = (queryRecordEntry.def.data as Record<
        string,
        IData | DataDefaultFn
      >)[item];
      return acc;
    }, {} as Record<string, IData | DataDefaultFn>);

  const mockedValues = {
    ...getMockValuesForIDataRecord(nodePropertiesToMock),
    type: opts.queryRecordEntry.def.type,
    id: generateRandomId(),
    version: '1',
  };

  if (queryRecordEntry.def.generateMockData) {
    const queryRecordEntryMockData = queryRecordEntry.def.generateMockData();
    const mockDataPropertiesToAddToExtension = Object.keys(
      queryRecordEntryMockData
    ).reduce(
      (acc, item) => {
        if (queryRecordEntry.properties.some(prop => prop.startsWith(item))) {
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

  if (queryRecordEntry.filter) {
    const mockDataThatConformsToFilter = getMockDataThatConformsToFilter({
      data: queryRecordEntry.def.data,
      filter: queryRecordEntry.filter,
    });

    extend({
      object: mockedValues,
      extension: mockDataThatConformsToFilter,
      extendNestedObjects: true,
      deleteKeysNotInExtension: false,
    });
  }

  return mockedValues;
}

export function generateMockNodeDataForQueryRecord(opts: {
  queryRecord: QueryRecord | RelationalQueryRecord;
}) {
  const { queryRecord } = opts;
  const mockedNodeData: Record<string, any> = {};

  Object.keys(queryRecord).forEach(queryRecordAlias => {
    const queryRecordEntryForThisAlias:
      | QueryRecordEntry
      | RelationalQueryRecordEntry
      | null = queryRecord[queryRecordAlias];

    if (!queryRecordEntryForThisAlias) {
      mockedNodeData[queryRecordAlias] = null;
      return;
    }
    const returnValueShouldBeAnArray = queryRecordEntryReturnsArrayOfData({
      queryRecordEntry: queryRecordEntryForThisAlias,
    });

    let mockedNodeDataReturnValues;

    // to facilitate generating mock data that conforms to the relational filters
    // we simply move relational filters to the relational query they apply to
    const relationalQueryRecordWithSetFilters = Object.entries(
      queryRecordEntryForThisAlias.relational || {}
    ).reduce(
      (acc, [relationalQueryRecordAlias, relationalQueryRecordEntry]) => {
        // deep cloning to avoid mutating the original query record
        // which leads to infinite loops in querymanager's query record diffing algorithm
        acc[relationalQueryRecordAlias] = deepClone(relationalQueryRecordEntry);
        if (
          queryRecordEntryForThisAlias.filter &&
          Object.keys(queryRecordEntryForThisAlias.filter).includes(
            relationalQueryRecordAlias
          )
        ) {
          acc[relationalQueryRecordAlias].filter = {
            ...(acc[relationalQueryRecordAlias].filter || {}),
            ...deepClone(
              queryRecordEntryForThisAlias.filter[relationalQueryRecordAlias]
            ),
          };
        }

        return acc;
      },
      {} as RelationalQueryRecord
    );

    if (returnValueShouldBeAnArray) {
      const pageSize =
        queryRecordEntryForThisAlias.pagination?.itemsPerPage ||
        DEFAULT_PAGE_SIZE;
      // must generate at least 1 result, otherwise may return an empty array for a oneToMany relationship which expects at least 1 result
      const numOfResultsToGenerate = generateRandomNumber(1, pageSize * 5);
      const arrayOfMockNodeValues = [];

      for (let i = 0; i < numOfResultsToGenerate; i++) {
        const mockNodeDataForQueryRecordEntry = generateMockNodeDataForQueryRecordEntry(
          {
            queryRecordEntry: queryRecordEntryForThisAlias,
          }
        );

        const relationalMockNodeProperties = generateMockNodeDataForQueryRecord(
          {
            queryRecord: relationalQueryRecordWithSetFilters,
          }
        );

        arrayOfMockNodeValues.push({
          ...mockNodeDataForQueryRecordEntry,
          ...relationalMockNodeProperties,
        });
      }

      const pageInfo: PageInfoFromResults = {
        endCursor: 'xyz',
        startCursor: 'yzx',
        hasPreviousPage: false,
        hasNextPage: pageSize < arrayOfMockNodeValues.length,
        totalPages: Math.ceil(arrayOfMockNodeValues.length / pageSize),
        totalCount: arrayOfMockNodeValues.length,
      };

      mockedNodeDataReturnValues = {
        [NODES_PROPERTY_KEY]: arrayOfMockNodeValues,
        [TOTAL_COUNT_PROPERTY_KEY]: arrayOfMockNodeValues.length,
        [PAGE_INFO_PROPERTY_KEY]: pageInfo,
      };
    } else {
      const mockNodeDataForQueryRecordEntry = generateMockNodeDataForQueryRecordEntry(
        {
          queryRecordEntry: queryRecordEntryForThisAlias,
        }
      );

      const relationalMockNodeProperties = generateMockNodeDataForQueryRecord({
        queryRecord: relationalQueryRecordWithSetFilters,
      });

      mockedNodeDataReturnValues = {
        ...mockNodeDataForQueryRecordEntry,
        ...relationalMockNodeProperties,
        id:
          'id' in queryRecordEntryForThisAlias
            ? queryRecordEntryForThisAlias.id
            : mockNodeDataForQueryRecordEntry.id,
      };
    }

    mockedNodeData[queryRecordAlias] = mockedNodeDataReturnValues;
  });

  return mockedNodeData;
}

function getRandomItemFromArray(array: Array<any>) {
  return array[Math.floor(Math.random() * array.length)];
}
