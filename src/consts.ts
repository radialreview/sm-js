import { string, number } from './smDataTypes';
import { FilterCondition } from './types';

// These are the properties that are essential for sm-js to function and are queried automatically with each query.
export const PROPERTIES_QUERIED_FOR_ALL_NODES = [
  'id',
  'version',
  'lastUpdatedBy',
  'type',
];

export const RELATIONAL_UNION_QUERY_SEPARATOR = '__rU__';

export const DEFAULT_TOKEN_NAME = 'default';

// These properties are ensuring that every node definition built with smJS.def now has these properties auto added to their data.
// They are not queried automatically and must be explicitly defined on the node definition, unless they also appear on PROPERTIES_QUERIED_FOR_ALL_NODES.
export const DEFAULT_NODE_PROPERTIES = {
  id: string,
  dateCreated: number,
  dateLastModified: number,
  lastUpdatedBy: string,
  lastUpdatedClientTimestamp: number,
};

const FILTER_CONDITIONS_MAP: Record<FilterCondition, FilterCondition> = {
  contains: 'contains',
  equal: 'equal',
  greaterThan: 'greaterThan',
  greaterThanOrEqual: 'greaterThanOrEqual',
  lessThan: 'lessThan',
  lessThanOrEqual: 'lessThanOrEqual',
  notEqual: 'notEqual',
  doesNotContain: 'doesNotContain',
};

export const FILTER_CONDITIONS: Array<FilterCondition> = Object.values(
  FILTER_CONDITIONS_MAP
);
