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
  _gte: '_gte',
  _lte: '_lte',
  _eq: '_eq',
  _gt: '_gt',
  _lt: '_lt',
  _neq: '_neq',
  _contains: '_contains',
  _ncontains: '_ncontains',
};

export const FILTER_OPERATORS: Array<FilterCondition> = Object.values(
  FILTER_OPERATORS_MAP
);
