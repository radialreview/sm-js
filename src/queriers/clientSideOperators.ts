import { update, isArray, isObject, orderBy } from 'lodash';
import { NODES_PROPERTY_KEY } from '../consts';
import {
  OBJECT_PROPERTY_SEPARATOR,
  queryRecordEntryReturnsArrayOfDataNestedInNodes,
} from '../queriers/queryDefinitionAdapters';

import {
  FilterPropertyNotDefinedInQueryException,
  FilterOperatorNotImplementedException,
  SortPropertyNotDefinedInQueryException,
} from '../exceptions';
import { getDataFromQueryResponsePartial } from './queryDefinitionAdapters';

import {
  FilterValue,
  FilterOperator,
  QueryRecordEntry,
  SortDirection,
  QueryRecord,
  NodeFilterCondition,
  CollectionFilterCondition,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
  IData,
  DATA_TYPES,
  EStringFilterOperator,
  SortObject,
  Id,
} from '../types';

function checkFilter({
  operator,
  itemValue,
  filterValue,
}: {
  operator: FilterOperator;
  filterValue: any;
  itemValue: any;
}) {
  switch (operator) {
    case 'contains': {
      return (
        String(itemValue)
          .toLowerCase()
          .indexOf(String(filterValue).toLowerCase()) !== -1
      );
    }
    case 'ncontains': {
      return (
        String(itemValue)
          .toLowerCase()
          .indexOf(String(filterValue).toLowerCase()) === -1
      );
    }
    case 'eq': {
      return (
        String(itemValue).toLowerCase() === String(filterValue).toLowerCase()
      );
    }
    case 'neq':
      return (
        String(itemValue).toLowerCase() !== String(filterValue).toLowerCase()
      );
    case 'gt':
    case 'nlte':
      return itemValue > filterValue;
    case 'gte':
    case 'nlt':
      return itemValue >= filterValue;
    case 'lt':
    case 'ngte':
      return itemValue < filterValue;
    case 'lte':
    case 'ngt':
      return itemValue <= filterValue;
    case 'startsWith':
      return String(itemValue)
        .toLowerCase()
        .startsWith(String(filterValue).toLowerCase());
    case 'nstartsWith':
      return !String(itemValue)
        .toLowerCase()
        .startsWith(String(filterValue).toLowerCase());
    case 'endsWith':
      return String(itemValue)
        .toLowerCase()
        .endsWith(String(filterValue).toLowerCase());
    case 'nendsWith':
      return !String(itemValue)
        .toLowerCase()
        .endsWith(String(filterValue).toLowerCase());

    default:
      throw new FilterOperatorNotImplementedException({
        operator: operator,
      });
  }
}

function checkRelationalItems({
  relationalItems,
  operator,
  filterValue,
  underscoreSeparatedPropName,
}: {
  relationalItems: Array<any>;
  underscoreSeparatedPropName: string;
  operator: FilterOperator;
  filterValue: any;
}) {
  return relationalItems.some(relationalItem => {
    const relationalItemValue = getValueWithUnderscoreSeparatedPropName({
      item: relationalItem,
      underscoreSeparatedPropName,
    });

    return checkFilter({
      operator: operator,
      filterValue,
      itemValue: relationalItemValue,
    });
  });
}

export function applyClientSideFilterToData({
  queryRecordEntry,
  data,
  alias,
}: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  data: any;
  alias: string;
}) {
  const filterObject = getFlattenedNodeFilterObject({
    queryRecordEntry,
    skipRelationalFilters: false,
  });

  if (filterObject && data[alias]) {
    const filterProperties: Array<{
      dotSeparatedPropName: string;
      underscoreSeparatedPropName: string;
      propNotInQuery: boolean;
      operators: Array<{ operator: FilterOperator; value: any }>;
      condition: NodeFilterCondition | CollectionFilterCondition;
      isRelational: boolean;
      relationalKey?: string;
      oneToOne?: boolean;
      oneToMany?: boolean;
      nonPaginatedOneToMany?: boolean;
    }> = Object.keys(filterObject).map(dotSeparatedPropName => {
      const [possibleRelationalKey, ...relationalProperties] = String(
        dotSeparatedPropName
      ).split('.');
      const relational =
        possibleRelationalKey &&
        queryRecordEntry.relational &&
        queryRecordEntry.relational[possibleRelationalKey];
      const propertyFilter: FilterValue<any, boolean> =
        filterObject[dotSeparatedPropName];
      const operators = (Object.keys(propertyFilter).filter(
        x => x !== 'condition'
      ) as Array<FilterOperator>).map<{ operator: FilterOperator; value: any }>(
        operator => {
          return { operator, value: propertyFilter[operator] };
        }
      );
      const isRelationalProperty = !!relational;
      const underscoreSeparatedPropName = isRelationalProperty
        ? relationalProperties.join(OBJECT_PROPERTY_SEPARATOR)
        : dotSeparatedPropName.replaceAll('.', OBJECT_PROPERTY_SEPARATOR);

      const propNotInQuery = isRelationalProperty
        ? relational.properties.includes(underscoreSeparatedPropName) === false
        : queryRecordEntry.properties.includes(underscoreSeparatedPropName) ===
          false;

      return {
        dotSeparatedPropName,
        underscoreSeparatedPropName,
        propNotInQuery: propNotInQuery,
        operators,
        condition: propertyFilter.condition,
        isRelational: isRelationalProperty,
        relationalKey: possibleRelationalKey,
        oneToOne: (relational && 'oneToOne' in relational) || undefined,
        oneToMany: (relational && 'oneToMany' in relational) || undefined,
        nonPaginatedOneToMany:
          (relational && 'nonPaginatedOneToMany' in relational) || undefined,
      };
    });

    if (filterProperties.length > 0) {
      let pathToDataArray = `${alias}`;
      if (
        queryRecordEntryReturnsArrayOfDataNestedInNodes({ queryRecordEntry })
      ) {
        pathToDataArray += `.${NODES_PROPERTY_KEY}`;
      }

      update(data, pathToDataArray, items => {
        if (!isArray(items)) {
          return items;
        }

        return items.filter(item => {
          const propertyNotInQuery = filterProperties.find(
            x => x.propNotInQuery
          );
          if (!!propertyNotInQuery) {
            throw new FilterPropertyNotDefinedInQueryException({
              filterPropName: propertyNotInQuery.dotSeparatedPropName,
            });
          }
          const orConditions = filterProperties.filter(
            x => x.condition === 'or'
          );
          const andConditions = filterProperties.filter(
            x => x.condition === 'and' || x.condition === 'some'
          );

          const hasPassedEveryANDConditions =
            andConditions.every(filter => {
              if (filter.isRelational) {
                return filter.operators.every(({ operator, value }) => {
                  if (filter.oneToOne) {
                    const itemValue = filter.relationalKey
                      ? getValueWithUnderscoreSeparatedPropName({
                          item: item[filter.relationalKey],
                          underscoreSeparatedPropName:
                            filter.underscoreSeparatedPropName,
                        })
                      : '';

                    return checkFilter({
                      operator,
                      filterValue: value,
                      itemValue,
                    });
                  } else if (filter.nonPaginatedOneToMany) {
                    const relationalItems: Array<any> = filter.relationalKey
                      ? item[filter.relationalKey] || []
                      : [];
                    return checkRelationalItems({
                      relationalItems,
                      operator,
                      filterValue: value,
                      underscoreSeparatedPropName:
                        filter.underscoreSeparatedPropName,
                    });
                  } else if (filter.oneToMany) {
                    const relationalItems: Array<any> = filter.relationalKey
                      ? item[filter.relationalKey][NODES_PROPERTY_KEY] || []
                      : [];
                    return checkRelationalItems({
                      relationalItems,
                      operator,
                      filterValue: value,
                      underscoreSeparatedPropName:
                        filter.underscoreSeparatedPropName,
                    });
                  } else {
                    throw new Error('Unrecognized relational filter type.');
                  }
                });
              } else {
                const itemValue = getValueWithUnderscoreSeparatedPropName({
                  item: item,
                  underscoreSeparatedPropName:
                    filter.underscoreSeparatedPropName,
                });
                return filter.operators.every(({ operator, value }) => {
                  return checkFilter({
                    operator,
                    filterValue: value,
                    itemValue,
                  });
                });
              }
            }) || andConditions.length === 0;

          if (!hasPassedEveryANDConditions) {
            return false;
          }

          const hasPassedSomeORConditions =
            orConditions.some(filter => {
              if (filter.isRelational) {
                return filter.operators.some(({ operator, value }) => {
                  if (filter.oneToOne) {
                    const itemValue = filter.relationalKey
                      ? getValueWithUnderscoreSeparatedPropName({
                          item: item[filter.relationalKey],
                          underscoreSeparatedPropName:
                            filter.underscoreSeparatedPropName,
                        })
                      : '';

                    return checkFilter({
                      operator,
                      filterValue: value,
                      itemValue,
                    });
                  } else if (filter.nonPaginatedOneToMany) {
                    const relationalItems: Array<any> = filter.relationalKey
                      ? item[filter.relationalKey] || []
                      : [];
                    return checkRelationalItems({
                      relationalItems,
                      operator,
                      filterValue: value,
                      underscoreSeparatedPropName:
                        filter.underscoreSeparatedPropName,
                    });
                  } else if (filter.oneToMany) {
                    const relationalItems: Array<any> = filter.relationalKey
                      ? item[filter.relationalKey][NODES_PROPERTY_KEY] || []
                      : [];
                    return checkRelationalItems({
                      relationalItems,
                      operator,
                      filterValue: value,
                      underscoreSeparatedPropName:
                        filter.underscoreSeparatedPropName,
                    });
                  } else {
                    throw new Error('Unrecognized relational filter type.');
                  }
                });
              } else {
                const itemValue = filter.relationalKey
                  ? getValueWithUnderscoreSeparatedPropName({
                      item,
                      underscoreSeparatedPropName:
                        filter.underscoreSeparatedPropName,
                    })
                  : '';
                return filter.operators.some(({ operator, value }) => {
                  return checkFilter({
                    operator,
                    filterValue: value,
                    itemValue,
                  });
                });
              }
            }) || orConditions.length === 0;

          return hasPassedEveryANDConditions && hasPassedSomeORConditions;
        });
      });
    }
  }
}

export function getIdsThatPassFilter({
  queryRecordEntry,
  data,
}: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  data: Array<any>;
}): Array<string> {
  const filterObject = getFlattenedNodeFilterObject({
    queryRecordEntry,
    skipRelationalFilters: true,
  });

  const filterProperties: Array<{
    dotSeparatedPropName: string;
    underscoreSeparatedPropName: string;
    propNotInQuery: boolean;
    operators: Array<{ operator: FilterOperator; value: any }>;
    condition: NodeFilterCondition | CollectionFilterCondition;
  }> = Object.keys(filterObject).map(dotSeparatedPropName => {
    const propertyFilter: FilterValue<any, boolean> =
      filterObject[dotSeparatedPropName];
    const operators = (Object.keys(propertyFilter).filter(
      x => x !== 'condition'
    ) as Array<FilterOperator>).map<{ operator: FilterOperator; value: any }>(
      operator => {
        return { operator, value: propertyFilter[operator] };
      }
    );

    const underscoreSeparatedPropName = dotSeparatedPropName.replaceAll(
      '.',
      OBJECT_PROPERTY_SEPARATOR
    );

    const propNotInQuery = !queryRecordEntry.properties.includes(
      underscoreSeparatedPropName
    );

    return {
      dotSeparatedPropName,
      underscoreSeparatedPropName,
      propNotInQuery: propNotInQuery,
      operators,
      condition: propertyFilter.condition,
    };
  });

  if (!filterProperties.length) return data.map(item => item.id);

  return data
    .filter(item => {
      const propertyNotInQuery = filterProperties.find(x => x.propNotInQuery);
      if (!!propertyNotInQuery) {
        throw new FilterPropertyNotDefinedInQueryException({
          filterPropName: propertyNotInQuery.dotSeparatedPropName,
        });
      }

      const andConditions = filterProperties.filter(
        x => x.condition === 'and' || x.condition === 'some'
      );

      const hasPassedEveryANDConditions =
        andConditions.every(filter => {
          const itemValue = getValueWithUnderscoreSeparatedPropName({
            item: item,
            underscoreSeparatedPropName: filter.underscoreSeparatedPropName,
          });

          return filter.operators.every(({ operator, value }) => {
            return checkFilter({
              operator,
              filterValue: value,
              itemValue,
            });
          });
        }) || andConditions.length === 0;

      if (!hasPassedEveryANDConditions) {
        return false;
      }

      const orConditions = filterProperties.filter(x => x.condition === 'or');

      const hasPassedSomeORConditions =
        orConditions.some(filter => {
          const itemValue = getValueWithUnderscoreSeparatedPropName({
            item,
            underscoreSeparatedPropName: filter.underscoreSeparatedPropName,
          });
          return filter.operators.some(({ operator, value }) => {
            return checkFilter({
              operator,
              filterValue: value,
              itemValue,
            });
          });
        }) || orConditions.length === 0;

      return hasPassedEveryANDConditions && hasPassedSomeORConditions;
    })
    .map(item => item.id);
}

export function getSortedIds({
  queryRecordEntry,
  data,
}: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  data: Array<{ id: Id }>;
}) {
  if (!queryRecordEntry.sort) return data.map(item => item.id);

  const sortObject = getFlattenedNodeSortObject({
    queryRecordEntry,
    skipRelationalSorts: true,
  });

  const sorting = orderBy(
    Object.keys(sortObject).map<{
      dotSeparatedPropName: string;
      underscoreSeparatedPropName: string;
      propNotInQuery: boolean;
      priority?: number;
      direction: SortDirection;
    }>((dotSeparatedPropName, index) => {
      const underscoreSeparatedPropName = dotSeparatedPropName.replaceAll(
        '.',
        OBJECT_PROPERTY_SEPARATOR
      );

      const propNotInQuery =
        queryRecordEntry.properties.includes(underscoreSeparatedPropName) ===
        false;

      return {
        dotSeparatedPropName,
        underscoreSeparatedPropName,
        propNotInQuery,
        priority:
          sortObject[dotSeparatedPropName].priority || (index + 1) * 10000,
        direction: sortObject[dotSeparatedPropName].direction || 'asc',
      };
    }),
    x => x.priority,
    'asc'
  );

  const sortPropertiesNotDefinedInQuery = sorting.filter(i => i.propNotInQuery);

  if (sortPropertiesNotDefinedInQuery.length > 0) {
    throw new SortPropertyNotDefinedInQueryException({
      sortPropName: sortPropertiesNotDefinedInQuery[0].dotSeparatedPropName,
    });
  }

  return data
    .sort((first, second) => {
      return sorting
        .map(sort => {
          return getSortPosition(
            getNodeSortPropertyValue({
              node: first,
              direction: sort.direction,
              underscoreSeparatedPropName: sort.underscoreSeparatedPropName,
              isRelational: false,
              oneToMany: false,
              nonPaginatedOneToMany: false,
            }),
            getNodeSortPropertyValue({
              node: second,
              direction: sort.direction,
              underscoreSeparatedPropName: sort.underscoreSeparatedPropName,
              isRelational: false,
              oneToMany: false,
            }),
            sort.direction === 'asc'
          );
        })
        .reduce((acc, current) => {
          return acc || current;
        }, undefined as never);
    })
    .map(item => item.id);
}

function getSortPosition(first: Id, second: Id, ascending: boolean) {
  // equal items sort equally
  if (first === second) {
    return 0;
  }

  // nulls sort after anything else
  if (first === null) {
    return 1;
  }
  if (second === null) {
    return -1;
  }

  // otherwise, if we're ascending, lowest sorts first
  if (ascending) {
    return first < second ? -1 : 1;
  }

  // if descending, highest sorts first
  return first < second ? 1 : -1;
}

function getNodeSortPropertyValue(opts: {
  node: any;
  direction: SortDirection;
  oneToMany?: boolean;
  nonPaginatedOneToMany?: boolean;
  isRelational: boolean;
  relationalKey?: string;
  underscoreSeparatedPropName: string;
}) {
  function getData() {
    if (opts.isRelational && opts.relationalKey) {
      if (opts.oneToMany) {
        return opts.node[opts.relationalKey][NODES_PROPERTY_KEY] || [];
      } else if (opts.nonPaginatedOneToMany) {
        return opts.node[opts.relationalKey] || [];
      } else {
        return opts.node[opts.relationalKey];
      }
    } else {
      return opts.node;
    }
  }

  const data = getData();
  return Array.isArray(data)
    ? data
        .sort((a, b) => {
          return getSortPosition(
            getItemSortValue(a, opts.underscoreSeparatedPropName),
            getItemSortValue(b, opts.underscoreSeparatedPropName),
            opts.direction === 'asc'
          );
        })
        .map(x => x[opts.underscoreSeparatedPropName])
        .join('')
    : getItemSortValue(data, opts.underscoreSeparatedPropName);
}

function getItemSortValue(item: any, underscoreSeparatedPropertyPath: string) {
  const value = getValueWithUnderscoreSeparatedPropName({
    item,
    underscoreSeparatedPropName: underscoreSeparatedPropertyPath,
  });
  const isValueNull = value === null;
  if (isValueNull) return null;
  return Number(value) || value;
}

export function applyClientSideSortToData({
  queryRecordEntry,
  data,
  alias,
}: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  data: any;
  alias: string;
}) {
  const sortObject = getFlattenedNodeSortObject({
    queryRecordEntry,
    skipRelationalSorts: false,
  });
  if (sortObject && data[alias]) {
    const sorting = orderBy(
      Object.keys(sortObject).map<{
        dotSeparatedPropName: string;
        underscoreSeparatedPropName: string;
        propNotInQuery: boolean;
        isRelational: boolean;
        relationalKey?: string;
        oneToOne?: boolean;
        oneToMany?: boolean;
        nonPaginatedOneToMany?: boolean;
        priority?: number;
        direction: SortDirection;
      }>((dotSeparatedPropName, index) => {
        const [possibleRelationalKey, ...relationalProperties] = String(
          dotSeparatedPropName
        ).split('.');
        const relational =
          possibleRelationalKey &&
          queryRecordEntry.relational &&
          queryRecordEntry.relational[possibleRelationalKey];
        const isRelational = !!relational;
        const underscoreSeparatedPropName = isRelational
          ? relationalProperties.join(OBJECT_PROPERTY_SEPARATOR)
          : dotSeparatedPropName.replaceAll('.', OBJECT_PROPERTY_SEPARATOR);

        const propNotInQuery = isRelational
          ? relational.properties.includes(underscoreSeparatedPropName) ===
            false
          : queryRecordEntry.properties.includes(
              underscoreSeparatedPropName
            ) === false;

        return {
          dotSeparatedPropName,
          underscoreSeparatedPropName,
          propNotInQuery,
          isRelational,
          relationalKey: possibleRelationalKey,
          oneToOne: (relational && 'oneToOne' in relational) || undefined,
          oneToMany: (relational && 'oneToMany' in relational) || undefined,
          nonPaginatedOneToMany:
            (relational && 'nonPaginatedOneToMany' in relational) || undefined,
          priority:
            sortObject[dotSeparatedPropName].priority || (index + 1) * 10000,
          direction: sortObject[dotSeparatedPropName].direction || 'asc',
        };
      }),
      x => x.priority,
      'asc'
    );

    const sortPropertiesNotDefinedInQuery = sorting.filter(
      i => i.propNotInQuery
    );

    if (sortPropertiesNotDefinedInQuery.length > 0) {
      throw new SortPropertyNotDefinedInQueryException({
        sortPropName: sortPropertiesNotDefinedInQuery[0].dotSeparatedPropName,
      });
    }

    let pathToDataArray = `${alias}`;
    if (queryRecordEntryReturnsArrayOfDataNestedInNodes({ queryRecordEntry })) {
      pathToDataArray += `.${NODES_PROPERTY_KEY}`;
    }

    update(data, pathToDataArray, items => {
      if (!isArray(items)) {
        return items;
      }

      return items.sort((first, second) => {
        return sorting
          .map(sort => {
            return getSortPosition(
              getNodeSortPropertyValue({
                node: first,
                direction: sort.direction,
                isRelational: sort.isRelational,
                oneToMany: sort.oneToMany,
                nonPaginatedOneToMany: sort.nonPaginatedOneToMany,
                underscoreSeparatedPropName: sort.underscoreSeparatedPropName,
                relationalKey: sort.relationalKey,
              }),
              getNodeSortPropertyValue({
                node: second,
                direction: sort.direction,
                isRelational: sort.isRelational,
                oneToMany: sort.oneToMany,
                underscoreSeparatedPropName: sort.underscoreSeparatedPropName,
                relationalKey: sort.relationalKey,
              }),
              sort.direction === 'asc'
            );
          })
          .reduce((acc, current) => {
            return acc || current;
          }, undefined as never);
      });
    });
  }
}

export function applyClientSideSortAndFilterToData(
  queryRecord: QueryRecord | RelationalQueryRecord,
  data: any
) {
  Object.keys(queryRecord).forEach(alias => {
    const queryRecordEntry = queryRecord[alias];

    if (queryRecordEntry?.filter) {
      applyClientSideFilterToData({
        queryRecordEntry,
        data,
        alias,
      });
    }

    if (queryRecordEntry?.sort) {
      applyClientSideSortToData({
        queryRecordEntry,
        data,
        alias,
      });
    }

    const relational = queryRecordEntry?.relational;
    if (relational != null) {
      const dataForThisAlias = getDataFromQueryResponsePartial({
        queryResponsePartial: data[alias],
        queryRecordEntry,
        collectionsIncludePagingInfo: true,
      });

      if (Array.isArray(dataForThisAlias)) {
        dataForThisAlias.forEach((item: any) => {
          applyClientSideSortAndFilterToData(relational, item);
        });
      } else {
        applyClientSideSortAndFilterToData(relational, dataForThisAlias);
      }
    }
  });
}

/**
 * Returns flattened keys of the filter object
 *
 * ```
 * getFlattenedNodeFilterObject({
 *  settings: {
 *    time: {_lte: Date.now()},
 *    nested: {
 *      prop: {_contains: "text"}
 *    }
 *  },
 *  firstName: {_eq: 'John'}
 * })
 * ```
 *
 * Returns
 *
 * ```
 * {
 *  "settings.time": {_lte: Date.now()},
 *  "settings.nested.prop": {_contains: "text"},
 *  "firstName": {_eq: 'John'}
 * }
 * ```
 * @param filterObject : ;
 * @returns
 */
function getFlattenedNodeFilterObject(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  skipRelationalFilters: boolean;
}) {
  const result: Record<
    string,
    Partial<Record<FilterOperator, any>> & {
      condition: NodeFilterCondition | CollectionFilterCondition;
    }
  > = {};

  const filterObject = opts.queryRecordEntry.filter;

  if (!filterObject) return result;

  const queriedRelations = opts.queryRecordEntry.relational;
  const nodeData = opts.queryRecordEntry.def.data;

  for (const filteredProperty in filterObject) {
    const filterValue = filterObject[filteredProperty] as FilterValue<
      string,
      boolean
    >;

    const isObjectInNodeData =
      nodeData[filteredProperty] &&
      ((nodeData[filteredProperty] as IData).type === DATA_TYPES.object ||
        (nodeData[filteredProperty] as IData).type === DATA_TYPES.maybeObject);
    const isAQueriedRelationalProp = queriedRelations
      ? queriedRelations[filteredProperty] != null
      : false;

    const filterIsTargettingNestedObjectOrRelationalData =
      isObject(filterValue) && (isAQueriedRelationalProp || isObjectInNodeData);

    if (
      filterIsTargettingNestedObjectOrRelationalData &&
      opts.skipRelationalFilters
    ) {
      continue;
    }

    if (
      typeof filterValue == 'object' &&
      filterValue !== null &&
      filterIsTargettingNestedObjectOrRelationalData
    ) {
      const queryRecordEntry = {
        ...opts.queryRecordEntry,
        def: isObjectInNodeData
          ? {
              ...opts.queryRecordEntry.def,
              data: nodeData[filteredProperty].boxedValue,
            }
          : (queriedRelations as RelationalQueryRecord)[filteredProperty].def,
        properties: isObjectInNodeData
          ? opts.queryRecordEntry.properties
              .filter(prop => prop.startsWith(filteredProperty))
              .map(prop => {
                const [, ...remainingPath] = prop.split(
                  OBJECT_PROPERTY_SEPARATOR
                );
                return remainingPath.join(OBJECT_PROPERTY_SEPARATOR);
              })
          : (queriedRelations as RelationalQueryRecord)[filteredProperty]
              .properties,
        filter: filterValue,
      };

      const flatObject = getFlattenedNodeFilterObject({
        queryRecordEntry,
        skipRelationalFilters: opts.skipRelationalFilters,
      });
      Object.keys(flatObject).forEach(key => {
        result[filteredProperty + '.' + key] = flatObject[key];
      });
    } else {
      if (isObject(filterValue)) {
        result[filteredProperty] = {
          ...filterValue,
          condition: filterValue.condition || 'and',
        };
      } else if (filterValue !== undefined) {
        result[filteredProperty] = {
          [EStringFilterOperator.eq]: filterValue,
          condition: 'and',
        } as Partial<Record<FilterOperator, any>> & {
          condition: NodeFilterCondition | CollectionFilterCondition;
        };
      }
    }
  }
  return result;
}

function getFlattenedNodeSortObject(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  skipRelationalSorts: boolean;
}) {
  const { queryRecordEntry } = opts;
  const result: Record<string, SortObject> = {};

  const sort = queryRecordEntry.sort;
  const nodeData = queryRecordEntry.def.data;
  const queriedRelations = queryRecordEntry.relational;

  if (!sort) return result;

  for (const sortKey in sort) {
    const sortObject = sort as Record<string, any>;
    const value = sortObject[sortKey];
    const valueIsNotASortObject =
      isObject(value) && !Object.keys(value).includes('direction');

    const isObjectInNodeData =
      nodeData[sortKey] &&
      ((nodeData[sortKey] as IData).type === DATA_TYPES.object ||
        (nodeData[sortKey] as IData).type === DATA_TYPES.maybeObject);
    const isAQueriedRelationalProp = queriedRelations
      ? queriedRelations[sortKey] != null
      : false;

    const sortIsTargettingNestedObjectOrRelationalData =
      isObject(value) && (isAQueriedRelationalProp || isObjectInNodeData);

    if (
      sortIsTargettingNestedObjectOrRelationalData &&
      opts.skipRelationalSorts
    ) {
      continue;
    }

    if (
      typeof sortObject[sortKey] == 'object' &&
      sortObject[sortKey] !== null &&
      valueIsNotASortObject
    ) {
      const queryRecordEntry = {
        ...opts.queryRecordEntry,
        def: isObjectInNodeData
          ? {
              ...opts.queryRecordEntry.def,
              data: nodeData[sortKey].boxedValue,
            }
          : (queriedRelations as RelationalQueryRecord)[sortKey].def,
        properties: isObjectInNodeData
          ? opts.queryRecordEntry.properties
              .filter(prop => prop.startsWith(sortKey))
              .map(prop => {
                const [, ...remainingPath] = prop.split(
                  OBJECT_PROPERTY_SEPARATOR
                );
                return remainingPath.join(OBJECT_PROPERTY_SEPARATOR);
              })
          : (queriedRelations as RelationalQueryRecord)[sortKey].properties,
        sort: value,
      };

      const flatObject = getFlattenedNodeSortObject({
        queryRecordEntry,
        skipRelationalSorts: opts.skipRelationalSorts,
      });

      for (const x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        result[sortKey + '.' + x] = flatObject[x];
      }
    } else {
      if (isObject(value)) {
        result[sortKey] = value as SortObject;
      } else if (value !== undefined) {
        const filter: SortObject = {
          direction: value,
        };
        result[sortKey] = filter;
      }
    }
  }
  return result;
}

function getValueWithUnderscoreSeparatedPropName(opts: {
  item: any;
  underscoreSeparatedPropName: string;
}): any {
  const { item, underscoreSeparatedPropName } = opts;
  const [currentProperty, ...remainingPath] = underscoreSeparatedPropName.split(
    OBJECT_PROPERTY_SEPARATOR
  );
  if (remainingPath.length === 0) {
    return item[currentProperty];
  } else {
    return getValueWithUnderscoreSeparatedPropName({
      item: item[currentProperty],
      underscoreSeparatedPropName: remainingPath.join(
        OBJECT_PROPERTY_SEPARATOR
      ),
    });
  }
}
