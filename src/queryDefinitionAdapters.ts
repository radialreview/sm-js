import { gql } from '@apollo/client/core';
import { OBJECT_PROPERTY_SEPARATOR } from './smDataTypes';
import { SMUnexpectedSubscriptionMessageException } from './exceptions';
import {
  NodeRelationalFns,
  NodeRelationalQueryBuilderRecord,
  MapFn,
  ISMData,
  NodeRelationalQuery,
  ISMNode,
  NodeComputedFns,
  RelationalQueryRecordEntry,
  QueryDefinitions,
  QueryRecord,
  QueryRecordEntry,
  ValidFilterForNode,
  SM_DATA_TYPES,
  SM_RELATIONAL_TYPES,
  QueryDefinition,
  SMDataDefaultFn,
  IOneToOneQueryBuilderOpts,
} from './types';
import { prepareObjectForBE } from './transaction/convertNodeDataToSMPersistedData';
import {
  PROPERTIES_QUERIED_FOR_ALL_NODES,
  RELATIONAL_UNION_QUERY_SEPARATOR,
} from './consts';

/**
 * Relational fns are specified when creating an smNode as fns that return a NodeRelationalQueryBuilder
 * so they can be evaluated lazily to avoid dependency loops between nodes related to each other.
 *
 * This fn executs those fns at query time, and returns a record of relational query builders
 */
function getRelationalQueryBuildersFromRelationalFns(
  relationaFns?: NodeRelationalFns<any>
) {
  if (!relationaFns) return {};

  return Object.keys(relationaFns).reduce((acc, relationshipName) => {
    const relationalQueryBuilder = relationaFns[relationshipName]();
    acc[relationshipName] = (opts: Record<string, any>) => ({
      ...relationalQueryBuilder(opts),
      _relationshipName: relationshipName,
    });

    return acc;
  }, {} as NodeRelationalQueryBuilderRecord);
}

function getMapFnReturn(opts: {
  mapFn: MapFn<any, any, any>;
  properties: Record<string, ISMData>;
  relational?: NodeRelationalFns<any>;
}) {
  const mapFnOpts: Record<string, any> = {
    ...opts.properties,
    ...getRelationalQueryBuildersFromRelationalFns(opts.relational),
  };

  Object.keys(opts.properties).forEach(key => {
    const data = opts.properties[key] as ISMData;

    if (
      data.type === SM_DATA_TYPES.object ||
      data.type === SM_DATA_TYPES.maybeObject
    ) {
      mapFnOpts[key] = (opts: { map: MapFn<any, any, any> }) => opts.map;
    }
  });

  return opts.mapFn(mapFnOpts) as Record<
    string,
    ISMData | MapFn<any, any, any> | NodeRelationalQuery<ISMNode>
  >;
}

/**
 * The functions in this file are responsible for translating queryDefinitionss to gql documents
 * only function that should be needed outside this file is convertQueryDefinitionToQueryInfo
 * other fns are exported for testing purposes only
 */
function getQueriedProperties(opts: {
  queryId: string;
  mapFn: (smData: Record<string, any>) => Record<string, any>;
  smData: Record<string, any>;
  smComputed?: NodeComputedFns<Record<string, any>, Record<string, any>>;
  smRelational?: NodeRelationalFns<NodeRelationalQueryBuilderRecord>;
  // this optional arg is only true the first time this fn is called
  // and is used to ensure we also query nested data that was stored in the old format (stringified json)
  isRootLevel?: true;
}): Array<string> {
  const mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.smData,
    relational: opts.smRelational,
  });

  /**
   * a mapFnReturn will be null when the dev returns an object type in a map fn, but does not specify a map fn for that object
   * for example:
   *
   * map: ({ settings }) => ({
   *   settings: settings
   * })
   *
   * instead of
   *
   * map: ({ settings }) => ({
   *   settings: settings({
   *     map: ({ flagEnabled }) => ({ flagEnabled })
   *   })
   * })
   *
   * in this case, we just assume they want to query the entire object
   */
  return Object.keys(mapFnReturn || opts.smData).reduce(
    (acc, key) => {
      const isData = !!opts.smData[key];

      if (!isData) return acc;

      // we always query these properties, can ignore any explicit requests for it
      if (opts.isRootLevel && PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)) {
        return acc;
      }

      const data = opts.smData[key] as ISMData;
      if (
        data.type === SM_DATA_TYPES.object ||
        data.type === SM_DATA_TYPES.maybeObject
      ) {
        // query for any data stored in old format (stringified json at the root of the node)
        acc.push(key);

        // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")
        acc.push(
          ...getQueriedProperties({
            queryId: opts.queryId,
            mapFn: (mapFnReturn && typeof mapFnReturn[key] === 'function'
              ? mapFnReturn[key]
              : () => null) as MapFn<any, any, any>,
            smData: (data.boxedValue as unknown) as Record<string, ISMData>,
          }).map(nestedKey => `${key}${OBJECT_PROPERTY_SEPARATOR}${nestedKey}`)
        );

        return acc;
      }

      return [...acc, key];
    },
    opts.isRootLevel
      ? [...PROPERTIES_QUERIED_FOR_ALL_NODES]
      : ([] as Array<string>)
  );
}

function getAllNodeProperties(opts: {
  nodeProperties: Record<string, ISMData | SMDataDefaultFn>;
  isRootLevel: boolean;
}) {
  return Object.keys(opts.nodeProperties).reduce(
    (acc, key) => {
      // we are already querying these properties, can ignore any explicit requests for it
      if (opts.isRootLevel && PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)) {
        return acc;
      }

      const data = opts.nodeProperties[key] as ISMData;
      if (
        data.type === SM_DATA_TYPES.object ||
        data.type === SM_DATA_TYPES.maybeObject
      ) {
        // query for any data stored in old format (stringified json at the root of the node)
        acc.push(key);
        // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")
        acc.push(
          ...getAllNodeProperties({
            nodeProperties: (opts.nodeProperties[key] as ISMData)
              .boxedValue as Record<string, ISMData>,
            isRootLevel: false,
          }).map(nestedKey => `${key}${OBJECT_PROPERTY_SEPARATOR}${nestedKey}`)
        );
        return acc;
      }

      return [...acc, key];
    },
    opts.isRootLevel
      ? [...PROPERTIES_QUERIED_FOR_ALL_NODES]
      : ([] as Array<string>)
  );
}

function getRelationalQueries(opts: {
  queryId: string;
  mapFn: (smData: Record<string, any>) => Record<string, any>;
  smData: Record<string, any>;
  smComputed?: NodeComputedFns<Record<string, any>, Record<string, any>>;
  smRelational?: NodeRelationalFns<NodeRelationalQueryBuilderRecord>;
}): Record<string, RelationalQueryRecordEntry> | undefined {
  const mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.smData,
    relational: opts.smRelational,
  });

  const relationalQueries = Object.keys(mapFnReturn).reduce((acc, alias) => {
    const isData = !!opts.smData[alias];
    const isComputed = opts.smComputed ? !!opts.smComputed[alias] : false;

    if (isData || isComputed) {
      return acc;
    } else {
      const relationalQuery = mapFnReturn[alias] as NodeRelationalQuery<
        ISMNode | Record<string, ISMNode>
      >;

      /**
       * happens when a map function for a relational query returns all the data for that node
       * example:
       *
       * users: queryDefinition({
       *   def: userNode,
       *   map: ({ todos }) => ({
       *     todos: todos({
       *       map: (allTodoData) => allTodoData
       *     })
       *   })
       * })
       *
       * this function will receive any relational properties in the todo node in the return of the map fn for that todo
       * but they will be functions, instead of the expected objects
       */
      if (typeof relationalQuery === 'function') {
        return acc;
      }

      if (relationalQuery._smRelational == null) {
        throw Error(
          `getRelationalQueries - the key "${alias}" is not a data property, not a computed property and does not contain a relational query.`
        );
      }

      if (
        relationalQuery._smRelational === SM_RELATIONAL_TYPES.oneToOne ||
        relationalQuery._smRelational === SM_RELATIONAL_TYPES.oneToMany
      ) {
        if (
          'map' in relationalQuery.queryBuilderOpts &&
          typeof relationalQuery.queryBuilderOpts.map === 'function'
        ) {
          // non union
          const queryBuilderOpts = relationalQuery.queryBuilderOpts as IOneToOneQueryBuilderOpts<
            ISMNode
          >;
          addRelationalQueryRecord({
            _smRelational: relationalQuery._smRelational,
            _relationshipName: relationalQuery._relationshipName,
            alias,
            def: relationalQuery.def as ISMNode,
            mapFn: queryBuilderOpts.map,
          });
        } else {
          // union
          const queryBuilderOpts = relationalQuery.queryBuilderOpts as IOneToOneQueryBuilderOpts<
            Record<string, ISMNode>
          >;
          Object.keys(queryBuilderOpts).forEach(unionType => {
            addRelationalQueryRecord({
              _smRelational: relationalQuery._smRelational,
              _relationshipName: relationalQuery._relationshipName,
              alias: `${alias}${RELATIONAL_UNION_QUERY_SEPARATOR}${unionType}`,
              def: (relationalQuery.def as Record<string, ISMNode>)[unionType],
              mapFn: queryBuilderOpts[unionType].map,
            });
          });
        }
      } else {
        throw Error(
          // @ts-expect-error relationalQuery is currently a never case here, since both existing types are being checked above
          `The relational query type ${relationalQuery._smRelational} is not valid`
        );
      }

      function addRelationalQueryRecord(queryRecord: {
        _smRelational: SM_RELATIONAL_TYPES;
        _relationshipName: string;
        def: ISMNode;
        mapFn: (data: any) => any;
        alias: string;
      }) {
        const relationalQueryRecord: Partial<RelationalQueryRecordEntry> = {
          def: queryRecord.def,
          _relationshipName: queryRecord._relationshipName,
          properties: getQueriedProperties({
            queryId: opts.queryId,
            mapFn: queryRecord.mapFn,
            smData: queryRecord.def.smData,
            smComputed: queryRecord.def.smComputed,
            smRelational: queryRecord.def.smRelational,
            isRootLevel: true,
          }),
        };

        const relationalQueriesWithinThisRelationalQuery = getRelationalQueries(
          {
            queryId: opts.queryId,
            mapFn: queryRecord.mapFn,
            smData: queryRecord.def.smData,
            smComputed: queryRecord.def.smComputed,
            smRelational: queryRecord.def.smRelational,
          }
        );

        if (relationalQueriesWithinThisRelationalQuery) {
          relationalQueryRecord.relational = relationalQueriesWithinThisRelationalQuery;
        }

        const relationalType = queryRecord._smRelational;
        if (relationalType === SM_RELATIONAL_TYPES.oneToOne) {
          (relationalQueryRecord as RelationalQueryRecordEntry & {
            oneToOne: true;
          }).oneToOne = true;
        } else if (relationalType === SM_RELATIONAL_TYPES.oneToMany) {
          (relationalQueryRecord as RelationalQueryRecordEntry & {
            oneToMany: true;
          }).oneToMany = true;
        } else {
          throw Error(`relationalType "${relationalType}" is not valid.`);
        }

        acc[
          queryRecord.alias
        ] = relationalQueryRecord as RelationalQueryRecordEntry;
      }

      return acc;
    }
  }, {} as Record<string, RelationalQueryRecordEntry>);

  if (Object.keys(relationalQueries).length === 0) return undefined;
  return relationalQueries;
}

export function getQueryRecordFromQueryDefinition<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryId: string; queryDefinitions: TQueryDefinitions }) {
  const queryRecord: QueryRecord = {};

  Object.keys(opts.queryDefinitions).forEach(queryDefinitionsAlias => {
    const queryDefinition: QueryDefinition<any, any, any> | ISMNode | null =
      opts.queryDefinitions[queryDefinitionsAlias];

    let queriedProps;
    let nodeDef;
    let relational;
    let allowNullResult;
    if (!queryDefinition) {
      return;
    } else if ('_isSMNodeDef' in queryDefinition) {
      // shorthand syntax where the dev only specified a node defition, nothing else
      nodeDef = queryDefinition as ISMNode;
      queriedProps = getAllNodeProperties({
        nodeProperties: nodeDef.smData,
        isRootLevel: true,
      });
    } else {
      nodeDef = queryDefinition.def;
      allowNullResult = queryDefinition.target?.allowNullResult;
      if (queryDefinition.map) {
        queriedProps = getQueriedProperties({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          smData: queryDefinition.def.smData,
          smComputed: queryDefinition.def.smComputed,
          smRelational: queryDefinition.def.smRelational,
          isRootLevel: true,
        });
        relational = getRelationalQueries({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          smData: nodeDef.smData,
          smComputed: nodeDef.smComputed,
          smRelational: nodeDef.smRelational,
        });
      } else {
        queriedProps = getAllNodeProperties({
          nodeProperties: nodeDef.smData,
          isRootLevel: true,
        });
      }
    }

    const queryRecordEntry = {
      def: nodeDef,
      properties: queriedProps,
      relational,
      allowNullResult,
    };

    if ('target' in queryDefinition && queryDefinition.target != null) {
      if (
        'ids' in queryDefinition.target &&
        queryDefinition.target.ids != null
      ) {
        if (
          (queryDefinition.target.ids as Array<string>).some(
            id => typeof id !== 'string'
          )
        ) {
          throw Error('Invalid id in target.ids');
        }

        (queryRecordEntry as QueryRecordEntry & { ids: Array<string> }).ids =
          queryDefinition.target.ids;
      }
      if ('id' in queryDefinition.target) {
        if (typeof queryDefinition.target.id !== 'string') {
          throw Error('Invalid id in target.id');
        }

        (queryRecordEntry as QueryRecordEntry & { id: string }).id =
          queryDefinition.target.id;
      }
    }

    if ('filter' in queryDefinition && queryDefinition.filter != null) {
      (queryRecordEntry as QueryRecordEntry & { filter: any }).filter =
        queryDefinition.filter;
    }

    queryRecord[queryDefinitionsAlias] = queryRecordEntry as QueryRecordEntry;
  });
  return queryRecord;
}

function getIdsString(ids: Array<string>) {
  return `[${ids.map(id => `"${id}"`).join(',')}]`;
}

export function getKeyValueFilterString<TSMNode extends ISMNode>(
  filter: ValidFilterForNode<TSMNode>
) {
  const convertedToDotFormat = prepareObjectForBE(filter, {
    omitObjectIdentifier: true,
  });
  return `{${Object.entries(convertedToDotFormat).reduce(
    (acc, [key, value], idx, entries) => {
      acc += `${key}: ${value == null ? null : `"${String(value)}"`}`;
      if (idx < entries.length - 1) {
        acc += `, `;
      }
      return acc;
    },
    ''
  )}}`;
}

function getGetNodeOptions<TSMNode extends ISMNode>(opts: {
  def: TSMNode;
  filter?: ValidFilterForNode<TSMNode>;
}) {
  const options: Array<string> = [];

  if (opts.filter !== null && opts.filter !== undefined) {
    options.push(`filter: ${getKeyValueFilterString(opts.filter)}`);
  }

  return options.join(', ');
}

function getSpaces(numberOfSpaces: number) {
  return new Array(numberOfSpaces).fill(' ').join('');
}

function getQueryPropertiesString(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  nestLevel: number;
}) {
  let propsString = `\n${getSpaces((opts.nestLevel + 2) * 2)}`;
  propsString += opts.queryRecordEntry.properties.join(
    `,\n${getSpaces((opts.nestLevel + 2) * 2)}`
  );

  if (opts.queryRecordEntry.relational) {
    propsString +=
      (propsString !== '' ? ',' : '') +
      getRelationalQueryString({
        relationalQueryRecord: opts.queryRecordEntry.relational,
        nestLevel: opts.nestLevel + 2,
      });
  }

  return propsString;
}

function getRelationalQueryString(opts: {
  relationalQueryRecord: Record<string, RelationalQueryRecordEntry>;
  nestLevel: number;
}) {
  return Object.keys(opts.relationalQueryRecord).reduce((acc, alias) => {
    const relationalQueryRecordEntry = opts.relationalQueryRecord[alias];

    if (!relationalQueryRecordEntry._relationshipName) {
      throw Error(
        `relationalQueryRecordEntry is invalid\n${JSON.stringify(
          relationalQueryRecordEntry,
          null,
          2
        )}`
      );
    }

    const operation = `${relationalQueryRecordEntry._relationshipName}`;

    return (
      acc +
      `\n${getSpaces(opts.nestLevel * 2)}${alias}: ${operation} {` +
      getQueryPropertiesString({
        queryRecordEntry: relationalQueryRecordEntry,
        nestLevel: opts.nestLevel,
      }) +
      `\n${getSpaces(opts.nestLevel * 2)}}`
    );
  }, '');
}

function getOperationFromQueryRecordEntry(queryRecordEntry: QueryRecordEntry) {
  const nodeType = queryRecordEntry.def.type;
  let operation: string;
  if ('ids' in queryRecordEntry && queryRecordEntry.ids != null) {
    operation = `${nodeType}s(ids: ${getIdsString(queryRecordEntry.ids)})`;
  } else if ('id' in queryRecordEntry && queryRecordEntry.id != null) {
    operation = `${nodeType}(id: "${queryRecordEntry.id}")`;
  } else {
    const options = getGetNodeOptions(queryRecordEntry);
    operation = `${nodeType}s${options !== '' ? `(${options})` : ''}`;
  }

  return operation;
}

function getRootLevelQueryString(
  opts: {
    alias: string;
  } & QueryRecordEntry
) {
  const operation = getOperationFromQueryRecordEntry(opts);

  return (
    `${opts.alias}: ${operation} {` +
    `${getQueryPropertiesString({ queryRecordEntry: opts, nestLevel: 1 })}` +
    `\n${getSpaces(4)}}`
  );
}

export type SubscriptionConfig = {
  alias: string;
  gqlString: string;
  extractNodeFromSubscriptionMessage: (
    subscriptionMessage: Record<string, any>
  ) => any;
  extractOperationFromSubscriptionMessage: (
    subscriptionMessage: Record<string, any>
  ) => any;
};

export function getQueryInfo<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions; queryId: string }) {
  const queryRecord: QueryRecord = getQueryRecordFromQueryDefinition(opts);
  const queryGQLString = `
    query ${getSanitizedQueryId({ queryId: opts.queryId })} {
        ${Object.keys(queryRecord)
          .map(alias =>
            getRootLevelQueryString({
              alias,
              ...queryRecord[alias],
            })
          )
          .join('\n    ')}
    }
  `.trim();

  const subscriptionConfigs: Array<SubscriptionConfig> = Object.keys(
    queryRecord
  ).reduce((subscriptionConfigsAcc, alias) => {
    const subscriptionName = getSanitizedQueryId({
      queryId: opts.queryId + '_' + alias,
    });
    const queryRecordEntry = queryRecord[alias];

    const operation = getOperationFromQueryRecordEntry(queryRecordEntry);

    const gqlStrings = [
      `
    subscription ${subscriptionName} {
      ${alias}: ${operation} {
        node {
          ${getQueryPropertiesString({ queryRecordEntry, nestLevel: 5 })}
        }
        operation { action, path }
      }
    }
        `.trim(),
    ];

    function extractNodeFromSubscriptionMessage(
      subscriptionMessage: Record<string, any>
    ) {
      if (!subscriptionMessage[alias].node) {
        throw new SMUnexpectedSubscriptionMessageException({
          subscriptionMessage,
          description: 'No "node" found in message',
        });
      }

      return subscriptionMessage[alias].node;
    }

    function extractOperationFromSubscriptionMessage(
      subscriptionMessage: Record<string, any>
    ) {
      if (!subscriptionMessage[alias].operation) {
        throw new SMUnexpectedSubscriptionMessageException({
          subscriptionMessage,
          description: 'No "operation" found in message',
        });
      }

      return subscriptionMessage[alias].operation;
    }

    gqlStrings.forEach(gqlString => {
      subscriptionConfigsAcc.push({
        alias,
        gqlString,
        extractNodeFromSubscriptionMessage,
        extractOperationFromSubscriptionMessage,
      });
    });

    return subscriptionConfigsAcc;
  }, [] as Array<SubscriptionConfig>);

  return {
    subscriptionConfigs: subscriptionConfigs,
    queryGQLString,
    queryRecord,
  };
}

/**
 * Converts a queryDefinitions into a gql doc that can be sent to the gqlClient
 * Returns a queryRecord for easily deduping requests based on the data that is being requested
 * Can later also be used to build a diff to request only the necessary data
 * taking into account the previous query record to avoid requesting data already in memory
 */
export function convertQueryDefinitionToQueryInfo<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions; queryId: string }) {
  const { queryGQLString, subscriptionConfigs, queryRecord } = getQueryInfo(
    opts
  );

  return {
    queryGQL: gql(queryGQLString),
    subscriptionConfigs: subscriptionConfigs.map(subscriptionConfig => ({
      ...subscriptionConfig,
      gql: gql(subscriptionConfig.gqlString),
    })),
    queryRecord,
  };
}

function getSanitizedQueryId(opts: { queryId: string }): string {
  return opts.queryId.replace(/-/g, '_');
}
