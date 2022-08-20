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
    case '_contains': {
      return (
        String(itemValue)
          .toLowerCase()
          .indexOf(String(filterValue).toLowerCase()) !== -1
      );
    }
    case '_ncontains': {
      return (
        String(itemValue)
          .toLowerCase()
          .indexOf(String(filterValue).toLowerCase()) === -1
      );
    }
    case '_eq': {
      return (
        String(itemValue).toLowerCase() === String(filterValue).toLowerCase()
      );
    }
    case '_neq':
      return (
        String(itemValue).toLowerCase() !== String(filterValue).toLowerCase()
      );
    case '_gt':
      return itemValue > filterValue;
    case '_gte':
      return itemValue >= filterValue;
    case '_lt':
      return itemValue < filterValue;
    case '_lte':
      return itemValue <= filterValue;
    default:
      throw new FilterOperatorNotImplementedException({
        operator: operator,
      });
  }
}

export function applyClientSideFilterToData({
  queryRecordEntry,
  data,
  alias,
  filter: queryRecordEntryFilter,
}: {
  queryRecordEntry: QueryRecordEntry;
  filter: FilterObjectForNode<INode>;
  data: any;
  alias: string;
}) {
  const filterObject = getFlattenedNodeFilterObject(queryRecordEntryFilter);

  if (filterObject && data[alias]) {
    const filterProperties = Object.keys(filterObject).map<{
      dotSeparatedPropName: string;
      underscoreSeparatedPropName: string;
      propNotInQuery: boolean;
      operators: Array<{ operator: FilterOperator; value: any }>;
      condition: FilterCondition;
    }>(dotSeparatedPropName => {
      const propertyFilter: FilterValue<any> =
        filterObject[dotSeparatedPropName];
      const operators = (Object.keys(propertyFilter).filter(
        x => x !== '_condition'
      ) as Array<FilterOperator>).map<{ operator: FilterOperator; value: any }>(
        operator => {
          return { operator, value: propertyFilter[operator] };
        }
      );
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
        propNotInQuery: propNotInQuery,
        operators,
        condition: propertyFilter._condition,
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
            x => x.condition === 'OR'
          );
          const andConditions = filterProperties.filter(
            x => x.condition === 'AND'
          );

          const hasPassOrConditions =
            orConditions.some(filter => {
              const itemValue =
                item[filter.underscoreSeparatedPropName] === NULL_TAG
                  ? null
                  : item[filter.underscoreSeparatedPropName];
              return filter.operators.some(({ operator, value }) => {
                return checkFilter({ operator, filterValue: value, itemValue });
              });
            }) || orConditions.length === 0;

          const hasPassAndConditions =
            andConditions.every(filter => {
              const itemValue =
                item[filter.underscoreSeparatedPropName] === NULL_TAG
                  ? null
                  : item[filter.underscoreSeparatedPropName];
              return filter.operators.every(({ operator, value }) => {
                return checkFilter({ operator, filterValue: value, itemValue });
              });
            }) || andConditions.length === 0;

          return hasPassAndConditions && hasPassOrConditions;
        });
      });
    }
  }
}

export function applyClientSideSortToData({
  queryRecordEntry,
  data,
  alias,
  sort: queryRecordEntrySort,
}: {
  queryRecordEntry: QueryRecordEntry;
  sort: ValidSortForNode<INode>;
  data: any;
  alias: string;
}) {
  const sortObject = getFlattenedNodeSortObject(queryRecordEntrySort);
  if (sortObject && data[alias]) {
    const sorting: Array<{
      sortFn: (d: any) => any;
      priority?: number;
      direction: SortDirection;
      propertyPath: string;
      underscoreSeparatedPropertyPath: string;
    }> = orderBy(
      Object.keys(sortObject).map((propertyPath, index) => {
        const underscoreSeparatedPropertyPath = propertyPath.replaceAll(
          '.',
          OBJECT_PROPERTY_SEPARATOR
        );
        return {
          sortFn: item =>
            Number(item[underscoreSeparatedPropertyPath]) ||
            item[underscoreSeparatedPropertyPath],
          direction: sortObject[propertyPath]._direction || 'asc',
          underscoreSeparatedPropertyPath,
          propertyPath,
          priority: sortObject[propertyPath]._priority || (index + 1) * 10000,
        };
      }),
      x => x.priority,
      'asc'
    );

    const sortPropertiesNotDefinedInSorting = sorting.filter(
      i =>
        queryRecordEntry.properties.includes(
          i.underscoreSeparatedPropertyPath
        ) === false
    );

    if (sortPropertiesNotDefinedInSorting.length > 0) {
      throw new SortPropertyNotDefinedInQueryException({
        sortPropName: sortPropertiesNotDefinedInSorting[0].propertyPath,
      });
    }

    update(data, `${alias}.${NODES_PROPERTY_KEY}`, currentValue => {
      if (!isArray(currentValue)) {
        return currentValue;
      }
      return orderBy(
        currentValue,
        sorting.map(item => item.sortFn),
        sorting.map(item => item.direction)
      );
    });
  }
}

export function applyClientSideSortAndFilterToData(
  queryRecord: QueryRecord,
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
        sort: queryRecordEntry.sort,
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
