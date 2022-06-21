import { string, number } from './smDataTypes';
import { FilterCondition } from './types';

export const PROPERTIES_QUERIED_FOR_ALL_NODES = [
  'id',
  'version',
  'lastUpdatedBy',
  'type',
];

export const RELATIONAL_UNION_QUERY_SEPARATOR = '__rU__';

export const DEFAULT_TOKEN_NAME = 'default';

export const DEFAULT_NODE_PROPERTIES = {
  id: string,
  dateCreated: number,
  dateLastModified: number,
  lastUpdatedBy: string,
  lastUpdatedClientTimestamp: number,
};

const FILTER_OPERATORS_MAP: Record<FilterCondition, FilterCondition> = {
  contains: 'contains',
  equal: 'equal',
  greaterThan: 'greaterThan',
  greaterThanOrEqual: 'greaterThanOrEqual',
  lessThan: 'lessThan',
  lessThanOrEqual: 'lessThanOrEqual',
  notEqual: 'notEqual',
  doesNotContain: 'doesNotContain',
};

export const FILTER_OPERATORS: Array<FilterCondition> = Object.values(
  FILTER_OPERATORS_MAP
);
