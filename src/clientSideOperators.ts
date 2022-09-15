import { update, isArray, orderBy } from 'lodash';
import { NODES_PROPERTY_KEY } from './consts';
import { NULL_TAG } from './dataConversions';
import { OBJECT_PROPERTY_SEPARATOR } from './dataTypes';
import {
  getFlattenedNodeFilterObject,
  getFlattenedNodeSortObject,
} from './dataUtilities';
import {
  FilterPropertyNotDefinedInQueryException,
  FilterOperatorNotImplementedException,
  SortPropertyNotDefinedInQueryException,
} from './exceptions';

import {
  FilterValue,
  FilterOperator,
  QueryRecordEntry,
  INode,
  SortDirection,
  ValidSortForNode,
  QueryRecord,
  FilterObjectForNode,
  FilterCondition,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
} from './types';

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
      return itemValue > filterValue;
    case 'gte':
      return itemValue >= filterValue;
    case 'lt':
      return itemValue < filterValue;
    case 'lte':
      return itemValue <= filterValue;
    default:
      throw new FilterOperatorNotImplementedException({
        operator: operator,
      });
  }
}

function convertNullStringValuesToNull({
  item,
  underscoreSeparatedPropName,
}: {
  item: any;
  underscoreSeparatedPropName: string;
}) {
  return item[underscoreSeparatedPropName] === NULL_TAG
    ? null
    : item[underscoreSeparatedPropName];
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
    const relationalItemValue = convertNullStringValuesToNull({
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
  filter: queryRecordEntryFilter,
}: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  filter: FilterObjectForNode<INode>;
  data: any;
  alias: string;
}) {
  const filterObject = getFlattenedNodeFilterObject({
    filterObject: queryRecordEntryFilter,
    nodeDataForThisProp: queryRecordEntry.def.data[alias],
  });

  if (filterObject && data[alias]) {
    const filterProperties = Object.keys(filterObject).map<{
      dotSeparatedPropName: string;
      underscoreSeparatedPropName: string;
      propNotInQuery: boolean;
      operators: Array<{ operator: FilterOperator; value: any }>;
      condition: FilterCondition;
      isRelational: boolean;
      relationalKey?: string;
      oneToOne?: boolean;
      oneToMany?: boolean;
    }>(dotSeparatedPropName => {
      const [possibleRelationalKey, ...relationalProperties] = String(
        dotSeparatedPropName
      ).split('.');
      const relational =
        possibleRelationalKey &&
        queryRecordEntry.relational &&
        queryRecordEntry.relational[possibleRelationalKey];
      const propertyFilter: FilterValue<any> =
        filterObject[dotSeparatedPropName];
      const operators = (Object.keys(propertyFilter).filter(
        x => x !== '_condition'
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
        condition: propertyFilter._condition,
        isRelational: isRelationalProperty,
        relationalKey: possibleRelationalKey,
        oneToOne: (relational && 'oneToOne' in relational) || undefined,
        oneToMany: (relational && 'oneToMany' in relational) || undefined,
      };
    });

    if (filterProperties.length > 0) {
      update(data, `${alias}.${NODES_PROPERTY_KEY}`, items => {
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
            x => x.condition === 'and'
          );

          const hasPassedEveryANDConditions =
            andConditions.every(filter => {
              if (filter.isRelational) {
                return filter.operators.every(({ operator, value }) => {
                  if (filter.oneToOne === true) {
                    const itemValue = filter.relationalKey
                      ? convertNullStringValuesToNull({
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
                  } else {
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
                  }
                });
              } else {
                const itemValue =
                  item[filter.underscoreSeparatedPropName] === NULL_TAG
                    ? null
                    : item[filter.underscoreSeparatedPropName];
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
                  if (filter.oneToOne === true) {
                    const itemValue = filter.relationalKey
                      ? convertNullStringValuesToNull({
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
                  } else {
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
                  }
                });
              } else {
                const itemValue = filter.relationalKey
                  ? convertNullStringValuesToNull({
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

function getSortPosition(
  first: string | number,
  second: string | number,
  ascending: boolean
) {
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
  isRelational: boolean;
  relationalKey?: string;
  underscoreSeparatedPropName: string;
}) {
  return opts.isRelational && opts.relationalKey
    ? opts.oneToMany
      ? ((opts.node[opts.relationalKey][NODES_PROPERTY_KEY] || []) as Array<
          any
        >)
          .sort((a, b) => {
            return getSortPosition(
              getItemSortValue(a, opts.underscoreSeparatedPropName),
              getItemSortValue(b, opts.underscoreSeparatedPropName),
              opts.direction === 'asc'
            );
          })
          .map(x => x[opts.underscoreSeparatedPropName])
          .join('')
      : getItemSortValue(
          opts.node[opts.relationalKey],
          opts.underscoreSeparatedPropName
        )
    : getItemSortValue(opts.node, opts.underscoreSeparatedPropName);
}

function getItemSortValue(item: any, underscoreSeparatedPropertyPath: string) {
  const isValueNull =
    item[underscoreSeparatedPropertyPath] === null ||
    item[underscoreSeparatedPropertyPath] === NULL_TAG;
  if (isValueNull) return null;
  return (
    Number(item[underscoreSeparatedPropertyPath]) ||
    item[underscoreSeparatedPropertyPath]
  );
}

export function applyClientSideSortToData({
  queryRecordEntry,
  data,
  alias,
  sort: queryRecordEntrySort,
}: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  sort: ValidSortForNode<INode>;
  data: any;
  alias: string;
}) {
  const sortObject = getFlattenedNodeSortObject(queryRecordEntrySort);
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

    update(data, `${alias}.${NODES_PROPERTY_KEY}`, items => {
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
    const containsArrayData = isArray(data[alias][NODES_PROPERTY_KEY]);

    if (queryRecordEntry.filter) {
      applyClientSideFilterToData({
        queryRecordEntry,
        filter: queryRecordEntry.filter,
        data: data,
        alias,
      });
    }

    if (queryRecordEntry.sort) {
      applyClientSideSortToData({
        queryRecordEntry,
        sort: queryRecordEntry.sort as ValidSortForNode<INode>,
        data: data,
        alias,
      });
    }

    const relational = queryRecordEntry.relational;

    if (relational != null) {
      if (containsArrayData) {
        if (data[alias] && data[alias][NODES_PROPERTY_KEY]) {
          data[alias][NODES_PROPERTY_KEY].forEach((item: any) => {
            applyClientSideSortAndFilterToData(relational, item);
          });
        }
      } else {
        applyClientSideSortAndFilterToData(relational, data[alias]);
      }
    }
  });
}
