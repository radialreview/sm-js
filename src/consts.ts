import { string, number } from './dataTypes';

// These are the properties that are essential for mm-gql to function and are queried automatically with each query.
export const PROPERTIES_QUERIED_FOR_ALL_NODES = {
  id: string,
  version: number,
  lastUpdatedBy: string,
  type: string,
};

export const RELATIONAL_UNION_QUERY_SEPARATOR = '__rU__';

export const DEFAULT_TOKEN_NAME = 'default';

// These properties are ensuring that every node definition built with mmGQL.def now has these properties auto added to their data.
// They are not queried automatically and must be explicitly defined on the node definition, unless they also appear on PROPERTIES_QUERIED_FOR_ALL_NODES.
const {
  type,
  ...PROPERTIES_QUERIED_FOR_ALL_NODES_MINUS_TYPE
} = PROPERTIES_QUERIED_FOR_ALL_NODES;
// adding "type" to the default node properties causes it to be mocked by the mock data generator which is not desirable
export const DEFAULT_NODE_PROPERTIES = {
  ...PROPERTIES_QUERIED_FOR_ALL_NODES_MINUS_TYPE,
  dateCreated: number,
  dateLastModified: number,
  lastUpdatedClientTimestamp: number,
};

export const NODES_PROPERTY_KEY = 'nodes';
