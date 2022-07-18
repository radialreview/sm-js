import { string, number } from './dataTypes';

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
