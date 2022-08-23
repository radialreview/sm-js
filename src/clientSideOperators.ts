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
  ValidFilterForNode,
  INode,
  SortDirection,
  ValidSortForNode,
  QueryRecord,
} from './types';

export function applyClientSideFilterToData({
  queryRecordEntry,
  data,
  alias,
  filter: queryRecordEntryFilter,
}: {
  queryRecordEntry: QueryRecordEntry;
  filter: ValidFilterForNode<INode>;
  data: any;
  alias: string;
}) {
  const filterObject = getFlattenedNodeFilterObject(queryRecordEntryFilter);
  if (filterObject && data[alias]) {
    Object.keys(filterObject).forEach(filterPropertyName => {
      const underscoreSeparatedPropertyPath = filterPropertyName.replaceAll(
        '.',
        OBJECT_PROPERTY_SEPARATOR
      );

      const filterPropertyIsNotDefinedInTheQuery =
        queryRecordEntry.properties.includes(
          underscoreSeparatedPropertyPath
        ) === false;

      if (filterPropertyIsNotDefinedInTheQuery) {
        throw new FilterPropertyNotDefinedInQueryException({
          filterPropName: filterPropertyName,
        });
      }

      if (filterPropertyName) {
        update(data, `${alias}.${NODES_PROPERTY_KEY}`, currentValue => {
          if (!isArray(currentValue)) {
            return currentValue;
          }
          return currentValue.filter(item => {
            const propertyFilter: FilterValue<any> =
              filterObject[filterPropertyName];

            // Handle null filtering since backend returns "__NULL__" string instead of null
            const value =
              item[underscoreSeparatedPropertyPath] === NULL_TAG
                ? null
                : item[underscoreSeparatedPropertyPath];

            return (Object.keys(propertyFilter) as Array<FilterOperator>).every(
              filterOperator => {
                switch (filterOperator) {
                  case '_contains': {
                    return (
                      String(value)
                        .toLowerCase()
                        .indexOf(
                          String(propertyFilter[filterOperator]).toLowerCase()
                        ) !== -1
                    );
                  }
                  case '_ncontains': {
                    return (
                      String(value)
                        .toLowerCase()
                        .indexOf(
                          String(propertyFilter[filterOperator]).toLowerCase()
                        ) === -1
                    );
                  }
                  case '_eq': {
                    return (
                      String(value).toLowerCase() ===
                      String(propertyFilter[filterOperator]).toLowerCase()
                    );
                  }
                  case '_neq':
                    return (
                      String(value).toLowerCase() !==
                      String(propertyFilter[filterOperator]).toLowerCase()
                    );
                  case '_gt':
                    return value > propertyFilter[filterOperator];
                  case '_gte':
                    return value >= propertyFilter[filterOperator];
                  case '_lt':
                    return value < propertyFilter[filterOperator];
                  case '_lte':
                    return value <= propertyFilter[filterOperator];
                  default:
                    throw new FilterOperatorNotImplementedException({
                      operator: filterOperator,
                    });
                }
              }
            );
          });
        });
      }
    });
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
