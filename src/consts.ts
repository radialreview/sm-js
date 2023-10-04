import { string, number, stringOrNumber } from './dataTypes';

// These are the properties that are essential for mm-gql to function and are queried automatically with each query.
export const PROPERTIES_QUERIED_FOR_ALL_NODES = {
  id: stringOrNumber,
  version: number,
  lastUpdatedBy: string,
  type: string,
};

export const RELATIONAL_UNION_QUERY_SEPARATOR = '__rU__';

export const DEFAULT_TOKEN_NAME = 'default';

export const DO_PROXY_GENERATOR_ESCAPED_KEYS = [
  'nodeType',
  'toJSON',
  '$$typeof',
  'constructor',
  '@@__IMMUTABLE_ITERABLE__@@',
  '@@__IMMUTABLE_RECORD__@@',
  '_isMockFunction',
  'asymmetricMatch',
  'isMobXAtom',
  'isMobXReaction',
  'isMobXComputedValue',
];

// In the doProxyGenerator.spec.ts file, we use the .toMatchInlineSnapshot() function to test results. .toMatchInlineSnapshot adds DO_PROXY_GENERATOR_ESCAPED_KEYS as a key to
// the get traps. We have to escape that key, and we want to prevent it from being used as a property name which would break the DOProxyGenerator,
// since these are purposely excluded from the get traps.
export const PROTECTED_NODE_PROPTERY_NAMES = DO_PROXY_GENERATOR_ESCAPED_KEYS.reduce(
  (acc, item) => {
    acc[item] = string;
    return acc;
  },
  {} as Record<string, typeof string>
);

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
export const PAGE_INFO_PROPERTY_KEY = 'pageInfo';
export const TOTAL_COUNT_PROPERTY_KEY = 'totalCount';
export const DEFAULT_PAGE_SIZE = 2000;
