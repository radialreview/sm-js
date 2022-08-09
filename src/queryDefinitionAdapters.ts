import { gql } from '@apollo/client/core';
import { OBJECT_PROPERTY_SEPARATOR } from './dataTypes';
import { UnexpectedSubscriptionMessageException } from './exceptions';
import {
  NodeRelationalFns,
  NodeRelationalQueryBuilderRecord,
  MapFn,
  IData,
  NodeRelationalQuery,
  INode,
  NodeComputedFns,
  RelationalQueryRecordEntry,
  QueryDefinitions,
  QueryRecord,
  QueryRecordEntry,
  ValidFilterForNode,
  DATA_TYPES,
  RELATIONAL_TYPES,
  QueryDefinition,
  DataDefaultFn,
  IOneToOneQueryBuilderOpts,
} from './types';
import { prepareObjectForBE } from './transaction/convertNodeDataToSMPersistedData';
import {
  PROPERTIES_QUERIED_FOR_ALL_NODES,
  RELATIONAL_UNION_QUERY_SEPARATOR,
} from './consts';
import { getFlattenedNodeFilterObject } from './dataUtilities';
import { set as lodashSet } from 'lodash';
/**
 * The functions in this file are responsible for translating queryDefinitionss to gql documents
 * only function that should be needed outside this file is convertQueryDefinitionToQueryInfo
 * other fns are exported for testing purposes only
 */

/**
 * Relational fns are specified when creating a node as fns that return a NodeRelationalQueryBuilder
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
  properties: Record<string, IData>;
  relational?: NodeRelationalFns<any>;
}) {
  const mapFnOpts: Record<string, any> = {
    ...opts.properties,
    ...getRelationalQueryBuildersFromRelationalFns(opts.relational),
  };

  Object.keys(opts.properties).forEach(key => {
    const data = opts.properties[key] as IData;

    if (
      data.type === DATA_TYPES.object ||
      data.type === DATA_TYPES.maybeObject
    ) {
      mapFnOpts[key] = (opts: { map: MapFn<any, any, any> }) => opts.map;
    }
  });

  return opts.mapFn(mapFnOpts) as Record<
    string,
    IData | MapFn<any, any, any> | NodeRelationalQuery<INode>
  >;
}

function getQueriedProperties(opts: {
  queryId: string;
  mapFn: (data: Record<string, any>) => Record<string, any>;
  data: Record<string, any>;
  computed?: NodeComputedFns<Record<string, any>, Record<string, any>>;
  relational?: NodeRelationalFns<NodeRelationalQueryBuilderRecord>;
  // this optional arg is only true the first time this fn is called
  // and is used to ensure we also query nested data that was stored in the old format (stringified json)
  isRootLevel?: true;
}): Array<string> {
  const mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.data,
    relational: opts.relational,
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
  return Object.keys(mapFnReturn || opts.data).reduce(
    (acc, key) => {
      const isData = !!opts.data[key];

      if (!isData) return acc;

      // we always query these properties, can ignore any explicit requests for it
      if (opts.isRootLevel && PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)) {
        return acc;
      }

      const data = opts.data[key] as IData;
      if (
        data.type === DATA_TYPES.object ||
        data.type === DATA_TYPES.maybeObject
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
            data: (data.boxedValue as unknown) as Record<string, IData>,
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
  nodeProperties: Record<string, IData | DataDefaultFn>;
  isRootLevel: boolean;
}) {
  return Object.keys(opts.nodeProperties).reduce(
    (acc, key) => {
      // we are already querying these properties, can ignore any explicit requests for it
      if (opts.isRootLevel && PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)) {
        return acc;
      }

      const data = opts.nodeProperties[key] as IData;
      if (
        data.type === DATA_TYPES.object ||
        data.type === DATA_TYPES.maybeObject
      ) {
        // query for any data stored in old format (stringified json at the root of the node)
        acc.push(key);
        // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")
        acc.push(
          ...getAllNodeProperties({
            nodeProperties: (opts.nodeProperties[key] as IData)
              .boxedValue as Record<string, IData>,
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
  mapFn: (data: Record<string, any>) => Record<string, any>;
  data: Record<string, any>;
  computed?: NodeComputedFns<Record<string, any>, Record<string, any>>;
  relational?: NodeRelationalFns<NodeRelationalQueryBuilderRecord>;
}): Record<string, RelationalQueryRecordEntry> | undefined {
  const mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.data,
    relational: opts.relational,
  });

  const relationalQueries = Object.keys(mapFnReturn).reduce((acc, alias) => {
    const isData = !!opts.data[alias];
    const isComputed = opts.computed ? !!opts.computed[alias] : false;

    if (isData || isComputed) {
      return acc;
    } else {
      const relationalQuery = mapFnReturn[alias] as NodeRelationalQuery<
        INode | Record<string, INode>
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

      if (relationalQuery._relational == null) {
        throw Error(
          `getRelationalQueries - the key "${alias}" is not a data property, not a computed property and does not contain a relational query.`
        );
      }

      if (
        relationalQuery._relational === RELATIONAL_TYPES.oneToOne ||
        relationalQuery._relational === RELATIONAL_TYPES.oneToMany
      ) {
        if (
          'map' in relationalQuery.queryBuilderOpts &&
          typeof relationalQuery.queryBuilderOpts.map === 'function'
        ) {
          // non union
          const queryBuilderOpts = relationalQuery.queryBuilderOpts as IOneToOneQueryBuilderOpts<
            INode
          >;
          addRelationalQueryRecord({
            _relational: relationalQuery._relational,
            _relationshipName: relationalQuery._relationshipName,
            alias,
            def: relationalQuery.def as INode,
            mapFn: queryBuilderOpts.map,
          });
        } else {
          // union
          const queryBuilderOpts = relationalQuery.queryBuilderOpts as IOneToOneQueryBuilderOpts<
            Record<string, INode>
          >;
          Object.keys(queryBuilderOpts).forEach(unionType => {
            addRelationalQueryRecord({
              _relational: relationalQuery._relational,
              _relationshipName: relationalQuery._relationshipName,
              alias: `${alias}${RELATIONAL_UNION_QUERY_SEPARATOR}${unionType}`,
              def: (relationalQuery.def as Record<string, INode>)[unionType],
              mapFn: queryBuilderOpts[unionType].map,
            });
          });
        }
      } else {
        throw Error(
          // @ts-expect-error relationalQuery is currently a never case here, since both existing types are being checked above
          `The relational query type ${relationalQuery._relational} is not valid`
        );
      }

      function addRelationalQueryRecord(queryRecord: {
        _relational: RELATIONAL_TYPES;
        _relationshipName: string;
        def: INode;
        mapFn: (data: any) => any;
        alias: string;
      }) {
        const relationalQueryRecord: Partial<RelationalQueryRecordEntry> = {
          def: queryRecord.def,
          _relationshipName: queryRecord._relationshipName,
          properties: getQueriedProperties({
            queryId: opts.queryId,
            mapFn: queryRecord.mapFn,
            data: queryRecord.def.data,
            computed: queryRecord.def.computed,
            relational: queryRecord.def.relational,
            isRootLevel: true,
          }),
        };

        const relationalQueriesWithinThisRelationalQuery = getRelationalQueries(
          {
            queryId: opts.queryId,
            mapFn: queryRecord.mapFn,
            data: queryRecord.def.data,
            computed: queryRecord.def.computed,
            relational: queryRecord.def.relational,
          }
        );

        if (relationalQueriesWithinThisRelationalQuery) {
          relationalQueryRecord.relational = relationalQueriesWithinThisRelationalQuery;
        }

        const relationalType = queryRecord._relational;
        if (relationalType === RELATIONAL_TYPES.oneToOne) {
          (relationalQueryRecord as RelationalQueryRecordEntry & {
            oneToOne: true;
          }).oneToOne = true;
        } else if (relationalType === RELATIONAL_TYPES.oneToMany) {
          (relationalQueryRecord as RelationalQueryRecordEntry & {
            oneToMany: true;
          }).oneToMany = true;
          if (
            relationalQuery.queryBuilderOpts &&
            relationalQuery.queryBuilderOpts.filter
          ) {
            (relationalQueryRecord as RelationalQueryRecordEntry).filter =
              relationalQuery.queryBuilderOpts.filter;
          }
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
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryId: string; queryDefinitions: TQueryDefinitions }) {
  const queryRecord: QueryRecord = {};

  Object.keys(opts.queryDefinitions).forEach(queryDefinitionsAlias => {
    const queryDefinition: QueryDefinition<any, any, any> | INode | null =
      opts.queryDefinitions[queryDefinitionsAlias];

    let queriedProps;
    let nodeDef;
    let relational;
    let allowNullResult;
    if (!queryDefinition) {
      return;
    } else if ('_isNodeDef' in queryDefinition) {
      // shorthand syntax where the dev only specified a node defition, nothing else
      nodeDef = queryDefinition as INode;
      queriedProps = getAllNodeProperties({
        nodeProperties: nodeDef.data,
        isRootLevel: true,
      });
    } else {
      nodeDef = queryDefinition.def;
      allowNullResult = queryDefinition.target?.allowNullResult;
      if (queryDefinition.map) {
        queriedProps = getQueriedProperties({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          data: queryDefinition.def.data,
          computed: queryDefinition.def.computed,
          relational: queryDefinition.def.relational,
          isRootLevel: true,
        });
        relational = getRelationalQueries({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          data: nodeDef.data,
          computed: nodeDef.computed,
          relational: nodeDef.relational,
        });
      } else {
        queriedProps = getAllNodeProperties({
          nodeProperties: nodeDef.data,
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
      (queryRecordEntry as QueryRecordEntry).filter = queryDefinition.filter;
    }
    if ('pagination' in queryDefinition && queryDefinition.pagination != null) {
      (queryRecordEntry as QueryRecordEntry).pagination =
        queryDefinition.pagination;
    }

    queryRecord[queryDefinitionsAlias] = queryRecordEntry as QueryRecordEntry;
  });
  return queryRecord;
}

function getIdsString(ids: Array<string>) {
  return `[${ids.map(id => `"${id}"`).join(',')}]`;
}

export function getKeyValueFilterString<TNode extends INode>(
  filter: ValidFilterForNode<TNode>
) {
  const flattenedFilters = getFlattenedNodeFilterObject(filter);
  // @TODO https://tractiontools.atlassian.net/browse/TTD-316
  // Adding '{} || ' temporarily disable all server filters
  // Remove those line once backend filters are ready
  const filtersWithEqualCondition = Object.keys({} || flattenedFilters)
    .filter(x => {
      return flattenedFilters[x]._eq !== undefined;
    })
    .reduce((acc, current) => {
      lodashSet(acc, current, flattenedFilters[current]._eq);
      return acc;
    }, {} as ValidFilterForNode<TNode>);

  const convertedToDotFormat = prepareObjectForBE(filtersWithEqualCondition, {
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

function getGetNodeOptions<TNode extends INode>(opts: {
  def: TNode;
  filter?: ValidFilterForNode<TNode>;
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
  let propsString = `${getSpaces(opts.nestLevel * 2)}`;
  propsString += opts.queryRecordEntry.properties.join(
    `,\n${getSpaces(opts.nestLevel * 2)}`
  );

  if (opts.queryRecordEntry.relational) {
    propsString +=
      (propsString !== '' ? ',' : '') +
      getRelationalQueryString({
        relationalQueryRecord: opts.queryRecordEntry.relational,
        nestLevel: opts.nestLevel,
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
      `\n${getSpaces(opts.nestLevel * 2)}${alias}: ${operation} {\n` +
      ('oneToMany' in relationalQueryRecordEntry
        ? wrapInNodes({
            propertiesString: getQueryPropertiesString({
              queryRecordEntry: relationalQueryRecordEntry,
              nestLevel: opts.nestLevel + 2,
            }),
            nestLevel: opts.nestLevel + 1,
          })
        : getQueryPropertiesString({
            queryRecordEntry: relationalQueryRecordEntry,
            nestLevel: opts.nestLevel + 1,
          })) +
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

function wrapInNodes(opts: { propertiesString: string; nestLevel: number }) {
  return `${getSpaces(opts.nestLevel * 2)}nodes {\n${
    opts.propertiesString
  }\n${getSpaces(opts.nestLevel * 2)}}`;
}

function getRootLevelQueryString(
  opts: {
    alias: string;
  } & QueryRecordEntry
) {
  const operation = getOperationFromQueryRecordEntry(opts);

  return (
    `  ${opts.alias}: ${operation} {\n` +
    `${
      opts.id == null
        ? wrapInNodes({
            propertiesString: getQueryPropertiesString({
              queryRecordEntry: opts,
              nestLevel: 3,
            }),
            nestLevel: 2,
          })
        : getQueryPropertiesString({ queryRecordEntry: opts, nestLevel: 2 })
    }` +
    `\n  }`
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
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions; queryId: string }) {
  const queryRecord: QueryRecord = getQueryRecordFromQueryDefinition(opts);
  const queryGQLString = (
    `query ${getSanitizedQueryId({ queryId: opts.queryId })} {\n` +
    Object.keys(queryRecord)
      .map(alias =>
        getRootLevelQueryString({
          alias,
          ...queryRecord[alias],
        })
      )
      .join('\n    ') +
    '\n}'
  ).trim();

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
        throw new UnexpectedSubscriptionMessageException({
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
        throw new UnexpectedSubscriptionMessageException({
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
  TNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions; queryId: string }) {
  const { queryGQLString, subscriptionConfigs, queryRecord } = getQueryInfo(
    opts
  );
  //call plugin function here that takes in the queryRecord

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
