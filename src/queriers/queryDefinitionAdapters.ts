import { gql } from '@apollo/client/core';

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
  EStringFilterOperator,
  NodeFilterCondition,
  CollectionFilterCondition,
  ENumberFilterOperator,
  ValidSortForNode,
  SortObject,
  DocumentNode,
  RelationalQueryRecord,
} from '../types';
import {
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
  PROPERTIES_QUERIED_FOR_ALL_NODES,
  RELATIONAL_UNION_QUERY_SEPARATOR,
  TOTAL_COUNT_PROPERTY_KEY,
} from '../consts';

export const OBJECT_PROPERTY_SEPARATOR = '__dot__';

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
  mapFn: MapFn<any>;
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
      mapFnOpts[key] = (opts: { map: MapFn<any> }) => opts.map;
    }
  });

  return opts.mapFn
    ? (opts.mapFn(mapFnOpts) as Record<
        string,
        IData | MapFn<any> | NodeRelationalQuery<INode>
      >)
    : opts.properties;
}

function getQueriedProperties(opts: {
  queryId: string;
  mapFn: MapFn<any>;
  data: Record<string, any>;
  computed?: NodeComputedFns<{
    TNodeData: Record<string, any>;
    TNodeComputedData: Record<string, any>;
  }>;
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
      if (
        opts.isRootLevel &&
        Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(key)
      ) {
        return acc;
      }

      const data = opts.data[key] as IData;
      if (
        data.type === DATA_TYPES.object ||
        data.type === DATA_TYPES.maybeObject
      ) {
        // objects have their queried properties saved in this array with __dot__ notation
        acc.push(
          ...getQueriedProperties({
            queryId: opts.queryId,
            mapFn: (mapFnReturn && typeof mapFnReturn[key] === 'function'
              ? mapFnReturn[key]
              : undefined) as MapFn<any>,
            data: (data.boxedValue as unknown) as Record<string, IData>,
          }).map(nestedKey => `${key}${OBJECT_PROPERTY_SEPARATOR}${nestedKey}`)
        );

        return acc;
      }

      return [...acc, key];
    },
    opts.isRootLevel
      ? [...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES)]
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
      if (
        opts.isRootLevel &&
        Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(key)
      ) {
        return acc;
      }

      const data = opts.nodeProperties[key] as IData;
      if (
        data.type === DATA_TYPES.object ||
        data.type === DATA_TYPES.maybeObject
      ) {
        // objects have their queried properties saved in this array with __dot__ notation
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
      ? [...Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES)]
      : ([] as Array<string>)
  );
}

function getRelationalQueries(opts: {
  queryId: string;
  mapFn: MapFn<any>;
  data: Record<string, any>;
  computed?: NodeComputedFns<{
    TNodeData: Record<string, any>;
    TNodeComputedData: Record<string, any>;
  }>;
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
        relationalQuery._relational === RELATIONAL_TYPES.oneToMany ||
        relationalQuery._relational === RELATIONAL_TYPES.nonPaginatedOneToMany
      ) {
        if (
          'map' in relationalQuery.queryBuilderOpts &&
          (typeof relationalQuery.queryBuilderOpts.map === 'function' ||
            relationalQuery.queryBuilderOpts.map === undefined)
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
        mapFn: MapFn<any>;
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
          if (
            relationalQuery.queryBuilderOpts &&
            relationalQuery.queryBuilderOpts.pagination
          ) {
            (relationalQueryRecord as RelationalQueryRecordEntry).pagination =
              relationalQuery.queryBuilderOpts.pagination;
          }
          if (
            relationalQuery.queryBuilderOpts &&
            relationalQuery.queryBuilderOpts.sort
          ) {
            (relationalQueryRecord as RelationalQueryRecordEntry).sort =
              relationalQuery.queryBuilderOpts.sort;
          }
        } else if (relationalType === RELATIONAL_TYPES.nonPaginatedOneToMany) {
          (relationalQueryRecord as RelationalQueryRecordEntry & {
            nonPaginatedOneToMany: true;
          }).nonPaginatedOneToMany = true;
          if (
            relationalQuery.queryBuilderOpts &&
            relationalQuery.queryBuilderOpts.filter
          ) {
            (relationalQueryRecord as RelationalQueryRecordEntry).filter =
              relationalQuery.queryBuilderOpts.filter;
          }
          if (
            relationalQuery.queryBuilderOpts &&
            relationalQuery.queryBuilderOpts.sort
          ) {
            (relationalQueryRecord as RelationalQueryRecordEntry).sort =
              relationalQuery.queryBuilderOpts.sort;
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
    const queryDefinition: QueryDefinition<any> | INode | null =
      opts.queryDefinitions[queryDefinitionsAlias];

    let queriedProps;
    let nodeDef;
    let relational;
    let allowNullResult;
    let tokenName;
    if (!queryDefinition) {
      queryRecord[queryDefinitionsAlias] = null;
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
      tokenName = queryDefinition.tokenName;
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
      tokenName,
    };

    if ('target' in queryDefinition && queryDefinition.target != null) {
      if (
        'ids' in queryDefinition.target &&
        queryDefinition.target.ids != null
      ) {
        if (
          (queryDefinition.target.ids as Array<string>).some(
            id => typeof id !== 'string' && typeof id !== 'number'
          )
        ) {
          throw Error('Invalid id in target.ids');
        }

        (queryRecordEntry as QueryRecordEntry & { ids: Array<string> }).ids =
          queryDefinition.target.ids;
      }
      if ('id' in queryDefinition.target) {
        if (
          typeof queryDefinition.target.id !== 'string' &&
          typeof queryDefinition.target.id !== 'number'
        ) {
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
    if ('sort' in queryDefinition && queryDefinition.sort != null) {
      (queryRecordEntry as QueryRecordEntry).sort = queryDefinition.sort;
    }

    queryRecord[queryDefinitionsAlias] = queryRecordEntry as QueryRecordEntry;
  });
  return queryRecord;
}

function getIdsString(ids: Array<string>) {
  return `[${ids.map(id => `"${id}"`).join(',')}]`;
}

function wrapInQuotesIfString(value: any) {
  if (typeof value === 'string') return `"${value}"`;
  return value;
}

export function getBEFilterString<TNode extends INode>(opts: {
  filter: ValidFilterForNode<TNode, boolean>;
  def: INode;
  relational?: Record<string, RelationalQueryRecordEntry>;
  // indicates whether this is a filter that applies to a collection of nodes
  isCollectionFilter: boolean;
}) {
  type FilterForBE = {
    key: keyof ValidFilterForNode<TNode, boolean>;
    operatorValueCombos: Array<{
      operator: EStringFilterOperator | ENumberFilterOperator;
      value: any;
    }>;
  };
  const readyForBE = Object.keys(opts.filter).reduce(
    (acc, current) => {
      const key = current as keyof ValidFilterForNode<TNode, boolean>;
      let filterForBE: FilterForBE;
      if (
        opts.filter[key] === null ||
        typeof opts.filter[key] === 'string' ||
        typeof opts.filter[key] === 'number' ||
        typeof opts.filter[key] === 'boolean'
      ) {
        filterForBE = {
          key,
          operatorValueCombos: [
            {
              operator: EStringFilterOperator.eq,
              value: opts.filter[key],
            },
          ],
        };
      } else {
        if (opts.relational && key in opts.relational) {
          // filter data returned based on data on a relationship
          // format is this (when querying "meetings", where meetings has a relationship to "todos")
          // filter: { todos: { task: 'get it done' } }
          filterForBE = {
            key,
            operatorValueCombos: [
              {
                operator: EStringFilterOperator.eq,
                value: opts.filter[key],
              },
            ],
          };
        } else {
          // complex filter with potentially not just straight equality checks
          // that filters against data on the node
          // format is
          // filter: { task: { eq: 'some task' }, dueDate: { lte: 13412313, gte: 12312313 } }
          const { condition, ...rest } = opts.filter[key];
          const operatorValueCombos = Object.keys(rest).reduce(
            (acc, operator) => {
              const value = rest[operator as keyof typeof rest];
              acc.push({
                operator: operator as
                  | EStringFilterOperator
                  | ENumberFilterOperator,
                value,
              });
              return acc;
            },
            [] as FilterForBE['operatorValueCombos']
          );

          filterForBE = {
            key,
            operatorValueCombos,
          };
        }
      }

      const defaultCondition:
        | NodeFilterCondition
        | CollectionFilterCondition = opts.isCollectionFilter ? 'some' : 'and';
      const condition = (opts.filter[key]?.condition || defaultCondition) as
        | NodeFilterCondition
        | CollectionFilterCondition;

      const conditionArray = acc[condition] || [];
      conditionArray.push(filterForBE);

      acc[condition] = conditionArray;

      return acc;
    },
    {} as {
      and?: Array<FilterForBE>;
      or?: Array<FilterForBE>;
      some?: Array<FilterForBE>;
      all?: Array<FilterForBE>;
      none?: Array<FilterForBE>;
    }
  );

  Object.keys(readyForBE).forEach(condition => {
    if (readyForBE[condition as keyof typeof readyForBE]?.length === 0) {
      delete readyForBE[condition as keyof typeof readyForBE];
    }
  });

  return (
    Object.entries(readyForBE).reduce((acc, [condition, filters], index) => {
      if (index > 0) acc += ', ';

      const stringifiedFilters = filters.reduce((acc, filter, index) => {
        if (index > 0) acc += ', ';

        if (filter.key in opts.def.data) {
          // filtering on a prop that is part of the node's own data
          const isStringEnum =
            opts.def.data[filter.key].type === DATA_TYPES.stringEnum ||
            opts.def.data[filter.key].type === DATA_TYPES.maybeStringEnum;

          const operatorValueCombosStringified = filter.operatorValueCombos.reduce(
            (acc, operatorValueCombo, index) => {
              if (index > 0) acc += ', ';

              const value = isStringEnum
                ? operatorValueCombo.value
                : wrapInQuotesIfString(operatorValueCombo.value);

              acc += `${operatorValueCombo.operator}: ${value}`;
              return acc;
            },
            ''
          );

          acc += `{${filter.key}: {${operatorValueCombosStringified}}}`;
        } else {
          // filtering on a prop that's part of a relational query
          if (!opts.relational || !(filter.key in opts.relational)) {
            throw Error(`Invalid filter key: ${filter.key}`);
          }

          if (filter.operatorValueCombos.length > 1) {
            throw Error(
              `Invalid filter for relational query: ${filter.key}, more than 1 operatorValue combo found`
            );
          }

          acc += `{${filter.key}: ${getBEFilterString({
            filter: filter.operatorValueCombos[0].value,
            def: opts.relational[filter.key].def,
            relational: opts.relational[filter.key].relational,
            isCollectionFilter: true,
          })}}`;
        }

        return acc;
      }, '');

      function wrapInArrayIfNecessary(stringifiedFilters: string) {
        if (opts.isCollectionFilter) {
          return stringifiedFilters;
        } else {
          return `[${stringifiedFilters}]`;
        }
      }

      acc += `${condition}: ${wrapInArrayIfNecessary(stringifiedFilters)}`;

      return acc;
    }, '{') + '}'
  );
}

function getBEOrderArrayString<TNode extends INode>(
  sort: ValidSortForNode<TNode>
) {
  return (
    Object.keys(sort)
      .reduce((acc, key, sortIndex, sortKeys) => {
        let direction: 'ASC' | 'DESC';
        let priority: number;
        const sortValue = sort[key as keyof ValidSortForNode<TNode>];
        if (sortValue == null) return acc;

        if (typeof sortValue === 'string') {
          // ensure that items which were not given priority
          // are placed at the end of the array
          // in the order in which they were received
          priority = sortKeys.length + sortIndex;
          direction = sortValue === 'asc' ? 'ASC' : 'DESC';
          acc[priority] = `{${key}: ${direction}}`;
        } else {
          const sortObject = sortValue as SortObject;
          if ('direction' in sortObject) {
            priority =
              sortObject.priority != null
                ? sortObject.priority
                : sortKeys.length + sortIndex;
            direction = sortObject.direction === 'asc' ? 'ASC' : 'DESC';
            acc[priority] = `{${key}: ${direction}}`;
          } else {
            priority =
              sortObject.priority != null
                ? sortObject.priority
                : sortKeys.length + sortIndex;
            const nestedSorts = getBEOrderArrayString(
              (sortObject as unknown) as ValidSortForNode<TNode>
            );
            acc[priority] = `{${key}: ${nestedSorts}}`;
          }
        }

        return acc;
      }, [] as Array<string>)
      // because we use priority to index sort objects
      // we must filter out any indicies we left empty
      .filter(item => item != null)
      .join(', ')
  );
}

function getGetNodeOptions(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  useServerSidePaginationFilteringSorting: boolean;
}) {
  if (!opts.useServerSidePaginationFilteringSorting) return '';

  const options: Array<string> = [];

  if (opts.queryRecordEntry.filter != null) {
    options.push(
      `where: ${getBEFilterString({
        filter: opts.queryRecordEntry.filter,
        def: opts.queryRecordEntry.def,
        relational: opts.queryRecordEntry.relational,
        isCollectionFilter: false,
      })}`
    );
  }

  if (opts.queryRecordEntry.sort != null) {
    const orderString = getBEOrderArrayString(opts.queryRecordEntry.sort);
    if (orderString !== '') {
      options.push(`order: [${orderString}]`);
    }
  }

  if (opts.queryRecordEntry.pagination != null) {
    if (opts.queryRecordEntry.pagination.endCursor) {
      options.push(`before: "${opts.queryRecordEntry.pagination.endCursor}"`);
    }
    if (opts.queryRecordEntry.pagination.startCursor) {
      options.push(`after: "${opts.queryRecordEntry.pagination.startCursor}"`);
    }
    if (opts.queryRecordEntry.pagination.itemsPerPage) {
      options.push(
        `${opts.queryRecordEntry.pagination.endCursor ? 'last' : 'first'}: ${
          opts.queryRecordEntry.pagination.itemsPerPage
        }`
      );
    }
  }

  return options.join(', ');
}

function getSpaces(numberOfSpaces: number) {
  return ' '.repeat(numberOfSpaces);
}

// we receive props to query in __dot__ notation
// for example, address, address__dot__city, address__dot__state
// from that dot notation, we need to build a query fragment
// that looks like this:
// {
//   address {
//     city
//     state
//   }
// }
function getObjectQueryString(opts: {
  previousRoots: Array<string>;
  root: string;
  allQueriedProps: Array<string>;
  baseSpacing: number;
}) {
  const { previousRoots, root, allQueriedProps, baseSpacing } = opts;
  const start = `${previousRoots.length ? '\n' : ''}${getSpaces(
    baseSpacing
  )}${root} {`;
  const previousRootsString = previousRoots.join(OBJECT_PROPERTY_SEPARATOR);
  const propertiesForThisRootStart = `${
    previousRootsString.length
      ? previousRootsString + OBJECT_PROPERTY_SEPARATOR
      : ''
  }${root}`;

  let handledNestedlRoots: Array<string> = [];
  return (
    allQueriedProps.reduce((acc, prop) => {
      const isRelatedToThisRoot = prop.startsWith(
        `${propertiesForThisRootStart}${OBJECT_PROPERTY_SEPARATOR}`
      );
      if (!isRelatedToThisRoot) return acc;

      const restOfProp = prop.replace(
        `${propertiesForThisRootStart}${OBJECT_PROPERTY_SEPARATOR}`,
        ''
      );

      if (restOfProp.includes(OBJECT_PROPERTY_SEPARATOR)) {
        const nextRoot = restOfProp.split(OBJECT_PROPERTY_SEPARATOR)[0];

        if (handledNestedlRoots.includes(nextRoot)) return acc;
        handledNestedlRoots.push(nextRoot);

        acc += getObjectQueryString({
          previousRoots: [...opts.previousRoots, root],
          root: nextRoot,
          allQueriedProps,
          baseSpacing: baseSpacing + 2,
        });
      } else {
        acc += `\n${getSpaces(baseSpacing + 2)}${restOfProp}`;
      }

      return acc;
    }, start) + `\n${getSpaces(baseSpacing)}}`
  );
}

function getQueryPropertiesString(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
  nestLevel: number;
  useServerSidePaginationFilteringSorting: boolean;
}) {
  let handledObjectProps: Array<string> = [];
  let propsString = `${getSpaces(opts.nestLevel * 2)}`;
  propsString += opts.queryRecordEntry.properties.reduce((acc, prop) => {
    if (prop.includes(OBJECT_PROPERTY_SEPARATOR)) {
      const root = prop.split(OBJECT_PROPERTY_SEPARATOR)[0];
      if (handledObjectProps.includes(root)) return acc;

      handledObjectProps.push(root);

      acc +=
        '\n' +
        getObjectQueryString({
          previousRoots: [],
          root,
          allQueriedProps: opts.queryRecordEntry.properties,
          baseSpacing: opts.nestLevel * 2,
        });
      return acc;
    }

    acc += `\n${getSpaces(opts.nestLevel * 2)}${prop}`;
    return acc;
  }, '');

  if (opts.queryRecordEntry.relational) {
    propsString += getRelationalQueryString({
      relationalQueryRecord: opts.queryRecordEntry.relational,
      nestLevel: opts.nestLevel,
      useServerSidePaginationFilteringSorting:
        opts.useServerSidePaginationFilteringSorting,
    });
  }

  return propsString;
}

function getRelationalQueryString(opts: {
  relationalQueryRecord: Record<string, RelationalQueryRecordEntry>;
  nestLevel: number;
  useServerSidePaginationFilteringSorting: boolean;
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

    const resolver = `${relationalQueryRecordEntry._relationshipName}`;
    const options = getGetNodeOptions({
      queryRecordEntry: relationalQueryRecordEntry,
      useServerSidePaginationFilteringSorting:
        opts.useServerSidePaginationFilteringSorting,
    });
    const operation = `${resolver}${options !== '' ? `(${options})` : ''}`;

    return (
      acc +
      `\n${getSpaces(opts.nestLevel * 2)}${alias}: ${operation} {` +
      ('oneToMany' in relationalQueryRecordEntry
        ? getNodesCollectionQuery({
            propertiesString:
              getQueryPropertiesString({
                queryRecordEntry: relationalQueryRecordEntry,
                nestLevel: opts.nestLevel + 2,
                useServerSidePaginationFilteringSorting:
                  opts.useServerSidePaginationFilteringSorting,
              }) + '\n',
            nestLevel: opts.nestLevel + 1,
            includeTotalCount:
              relationalQueryRecordEntry.pagination?.includeTotalCount || false,
          })
        : getQueryPropertiesString({
            queryRecordEntry: relationalQueryRecordEntry,
            nestLevel: opts.nestLevel + 1,
            useServerSidePaginationFilteringSorting:
              opts.useServerSidePaginationFilteringSorting,
          })) +
      `\n${getSpaces(opts.nestLevel * 2)}}`
    );
  }, '');
}

function getOperationFromQueryRecordEntry(
  opts: { useServerSidePaginationFilteringSorting: boolean } & QueryRecordEntry
) {
  const nodeType = opts.def.type;
  let operation: string;
  if ('ids' in opts && opts.ids != null) {
    operation = `${nodeType}s(ids: ${getIdsString(opts.ids)})`;
  } else if ('id' in opts && opts.id != null) {
    operation = `${nodeType}(id: "${opts.id}")`;
  } else {
    const options = getGetNodeOptions({
      queryRecordEntry: opts,
      useServerSidePaginationFilteringSorting:
        opts.useServerSidePaginationFilteringSorting,
    });
    operation = `${nodeType}s${options !== '' ? `(${options})` : ''}`;
  }

  return operation;
}

// queries a collection of nodes by wrapping the properties queried with "nodes"
// and also includes other necessary paging information in the query
function getNodesCollectionQuery(opts: {
  propertiesString: string;
  nestLevel: number;
  includeTotalCount: boolean;
}) {
  const openNodesFragment = `\n${getSpaces(opts.nestLevel * 2)}nodes {`;
  const closeFragment = `${getSpaces(opts.nestLevel * 2)}}`;
  const nodesFragment = `${openNodesFragment}${opts.propertiesString}${closeFragment}`;

  const totalCountFragment = opts.includeTotalCount
    ? `\n${getSpaces(opts.nestLevel * 2)}${TOTAL_COUNT_PROPERTY_KEY}`
    : '';

  const openPageInfoFragment = `\n${getSpaces(
    opts.nestLevel * 2
  )}${PAGE_INFO_PROPERTY_KEY} {\n`;
  const pageInfoProps = [
    'endCursor',
    'startCursor',
    'hasNextPage',
    'hasPreviousPage',
  ];
  const pageInfoProperties = pageInfoProps
    .map(prop => `${getSpaces((opts.nestLevel + 1) * 2)}${prop}`)
    .join(`\n`);
  const pageInfoFragment = `${openPageInfoFragment}${pageInfoProperties}\n${closeFragment}`;

  return `${nodesFragment}${totalCountFragment}${pageInfoFragment}`;
}

function getRootLevelQueryString(
  opts: {
    alias: string;
    useServerSidePaginationFilteringSorting: boolean;
  } & QueryRecordEntry
) {
  const operation = getOperationFromQueryRecordEntry(opts);

  return (
    `  ${opts.alias}: ${operation} {` +
    `${
      opts.id == null
        ? getNodesCollectionQuery({
            propertiesString:
              getQueryPropertiesString({
                queryRecordEntry: opts,
                nestLevel: 3,
                useServerSidePaginationFilteringSorting:
                  opts.useServerSidePaginationFilteringSorting,
              }) + '\n',
            nestLevel: 2,
            includeTotalCount: opts.pagination?.includeTotalCount || false,
          })
        : getQueryPropertiesString({
            queryRecordEntry: opts,
            nestLevel: 2,
            useServerSidePaginationFilteringSorting:
              opts.useServerSidePaginationFilteringSorting,
          })
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

export function getQueryGQLDocumentFromQueryRecord(opts: {
  queryId: string;
  queryRecord: QueryRecord;
  useServerSidePaginationFilteringSorting: boolean;
}) {
  if (!Object.values(opts.queryRecord).some(value => value != null))
    return null;

  const queryString = (
    `query ${getSanitizedQueryId({ queryId: opts.queryId })} {\n` +
    Object.keys(opts.queryRecord)
      .map(alias => {
        const queryRecordEntry = opts.queryRecord[alias];

        if (!queryRecordEntry) return '';

        return getRootLevelQueryString({
          ...queryRecordEntry,
          alias,
          useServerSidePaginationFilteringSorting:
            opts.useServerSidePaginationFilteringSorting,
        });
      })
      .join('\n    ') +
    '\n}'
  ).trim();

  return gql(queryString);
}

export function queryRecordEntryReturnsArrayOfData(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}) {
  return (
    opts.queryRecordEntry &&
    (!('id' in opts.queryRecordEntry) || opts.queryRecordEntry.id == null) &&
    !('oneToOne' in opts.queryRecordEntry)
  );
}

export function queryRecordEntryReturnsArrayOfDataNestedInNodes(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}) {
  return (
    opts.queryRecordEntry &&
    queryRecordEntryReturnsArrayOfData(opts) &&
    !('nonPaginatedOneToMany' in opts.queryRecordEntry)
  );
}

// When we query for paginated arrays, the response is an object containing
// a "nodes" property which is an array of the nodes
// Otherwise the response is the node, or the list of nodes, itself
export function getDataFromQueryResponsePartial(opts: {
  queryResponsePartial: Record<string, any>;
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry | null;
}) {
  if (!opts.queryRecordEntry) return null;

  if (queryRecordEntryReturnsArrayOfDataNestedInNodes(opts)) {
    return opts.queryResponsePartial[NODES_PROPERTY_KEY];
  } else {
    return opts.queryResponsePartial;
  }
}

//
// subscription stuff starts here
//

// a query record will initialize n subscriptions, where n is the number of
// root level aliases on the query record
export function getSubscriptionGQLDocumentsFromQueryRecord(opts: {
  queryId: string;
  queryRecord: QueryRecord;
  useServerSidePaginationFilteringSorting: boolean;
}) {
  return Object.keys(opts.queryRecord).reduce(
    (subscriptionDocRecord, rootAlias) => {
      const queryRecordEntry = opts.queryRecord[rootAlias];

      if (!queryRecordEntry) return subscriptionDocRecord;

      const subscriptionString = getQueryRecordEntrySubscriptionFragment({
        queryId: opts.queryId,
        queryRecordEntry,
        alias: rootAlias,
      });

      const docString = `
      subscription ${getSanitizedQueryId({
        queryId: `${opts.queryId}_${rootAlias}`,
      })} {
        ${subscriptionString}
      }`;

      const subscriptionDoc = gql(docString);

      return {
        ...subscriptionDocRecord,
        [rootAlias]: subscriptionDoc,
      };
    },
    {} as Record<string, DocumentNode>
  );
}

function getQueryRecordEntrySubscriptionFragment(opts: {
  queryId: string;
  queryRecordEntry: QueryRecordEntry;
  alias: string;
}) {
  const operation = getOperationFromQueryRecordEntry({
    ...opts.queryRecordEntry,
    useServerSidePaginationFilteringSorting: false,
  });

  return (
    `${opts.alias}: ${operation} {` +
    getQueryRecordEntrySubscriptionFragmentInnerContents({
      queryRecordEntry: opts.queryRecordEntry,
    }) +
    `}`
  );
}

function getSubscriptionPropsString(opts: {
  ownProps: Array<string>;
  relational: RelationalQueryRecord | undefined;
}) {
  const ownPropsString = getSubscriptionOwnPropsString({
    ownProps: opts.ownProps,
  });

  const relationalPropsString = opts.relational
    ? getSubscriptionRelationalPropsString({
        relational: flattenNestedRelationshipRecords([opts.relational]),
      })
    : '';

  return ownPropsString + relationalPropsString;
}

function getSubscriptionOwnPropsString(opts: { ownProps: Array<string> }) {
  let propsString = ``;
  const handledObjectProps: Array<string> = [];
  propsString += opts.ownProps.reduce((acc, prop) => {
    if (prop.includes(OBJECT_PROPERTY_SEPARATOR)) {
      const root = prop.split(OBJECT_PROPERTY_SEPARATOR)[0];
      if (handledObjectProps.includes(root)) return acc;

      handledObjectProps.push(root);

      acc +=
        '\n' +
        getObjectQueryString({
          previousRoots: [],
          root,
          allQueriedProps: opts.ownProps,
          baseSpacing: 1,
        });
      return acc;
    }

    acc += `\n${prop}`;
    return acc;
  }, '');

  return propsString !== '' ? `${propsString}\n` : '';
}

function getSubscriptionRelationalPropsString(opts: {
  relational: RelationalQueryRecord;
}): string {
  return Object.keys(opts.relational).reduce((acc, alias, index) => {
    const relationalQueryRecordEntry = opts.relational[alias];

    if (!relationalQueryRecordEntry._relationshipName) {
      throw Error(
        `relationalQueryRecordEntry is invalid\n${JSON.stringify(
          relationalQueryRecordEntry,
          null,
          2
        )}`
      );
    }

    const resolver = relationalQueryRecordEntry._relationshipName;

    return (
      acc +
      (index > 0 ? `\n` : '') +
      `${resolver} {` +
      ('oneToMany' in relationalQueryRecordEntry
        ? getNodesCollectionQuery({
            propertiesString: getSubscriptionPropsString({
              ownProps: relationalQueryRecordEntry.properties,
              relational: relationalQueryRecordEntry.relational,
            }),
            nestLevel: 1,
            includeTotalCount: !!relationalQueryRecordEntry.pagination
              ?.includeTotalCount,
          }) + '\n'
        : getSubscriptionPropsString({
            ownProps: relationalQueryRecordEntry.properties,
            relational: relationalQueryRecordEntry.relational,
          })) +
      `}\n`
    );
  }, '');
}

function getQueryRecordEntrySubscriptionFragmentInnerContents(opts: {
  queryRecordEntry: QueryRecordEntry;
}) {
  const ownPropsString = getSubscriptionOwnPropsString({
    ownProps: opts.queryRecordEntry.properties,
  });

  const ownPropsAndRelationalString = getSubscriptionPropsString({
    ownProps: opts.queryRecordEntry.properties,
    relational: opts.queryRecordEntry.relational,
  });

  const ownNodeUpdatedString = `...on Updated_${capitalizeFirstLetter(
    opts.queryRecordEntry.def.type
  )} {
      __typename
      id
      value {${ownPropsString}}
  }
  `;

  const ownNodeCreatedString = `...on Created_${capitalizeFirstLetter(
    opts.queryRecordEntry.def.type
  )} {
      __typename
      id
      value {${ownPropsAndRelationalString}}
  }
  `;

  const ownNodeDeletedString = `...on Deleted_${capitalizeFirstLetter(
    opts.queryRecordEntry.def.type
  )} {
      __typename
      id
  }
  `;

  const relationalSubscriptionMetadatas = getRelationalSubscriptionMetadatas({
    queryRecordEntry: opts.queryRecordEntry,
  });

  const relationalSubscriptionStrings = getRelationalSubscriptionString({
    relationalSubscriptionMetadatas,
  });

  return `
    ${ownNodeCreatedString}
    ${ownNodeUpdatedString} 
    ${ownNodeDeletedString}
    ${relationalSubscriptionStrings}`;
}

type RelationalSubscriptionMetadata = {
  relationalType: 'oneToOne' | 'oneToMany';
  nodeType: string;
  properties: Array<string>;
  relational: Record<string, RelationalQueryRecordEntry> | undefined;
  parentNodeType: string;
};

/**
 * Flattens relational queries into an array of RelationalSubscriptionMetadata
 */
function getRelationalSubscriptionMetadatas(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}): Array<RelationalSubscriptionMetadata> {
  const relationalQueries = opts.queryRecordEntry.relational;
  if (!relationalQueries) return [];

  const parentNodeType = opts.queryRecordEntry.def.type;

  return Object.keys(relationalQueries).reduce(
    (subscriptionMetadatas, relationalAlias) => {
      const relationalQueryRecordEntry = relationalQueries[relationalAlias];
      if (!relationalQueryRecordEntry) return subscriptionMetadatas;

      const nodeType = relationalQueryRecordEntry.def.type;
      const { properties, relational } = relationalQueryRecordEntry;

      subscriptionMetadatas.push({
        relationalType:
          'oneToOne' in relationalQueryRecordEntry &&
          relationalQueryRecordEntry.oneToOne
            ? 'oneToOne'
            : 'oneToMany',
        nodeType,
        properties,
        relational,
        parentNodeType,
      });

      if (relationalQueryRecordEntry.relational) {
        const nestedSubscriptionMetadatas = getRelationalSubscriptionMetadatas({
          queryRecordEntry: relationalQueryRecordEntry,
        });
        subscriptionMetadatas.push(...nestedSubscriptionMetadatas);
      }

      return subscriptionMetadatas;
    },
    [] as Array<RelationalSubscriptionMetadata>
  );
}

/**
 * Taking the flattened array of relationalSubscriptionMetadata built in getRelationalSubscriptionMetadatas
 * we build the gql string for the relational subscriptions
 */
function getRelationalSubscriptionString(opts: {
  relationalSubscriptionMetadatas: Array<RelationalSubscriptionMetadata>;
}) {
  // When building the gql string for relational subscriptions
  // we try to not subscribe to the same node, or relation, twice
  // this record groups the subscriptions by node type, parent node type, and relational type
  const mergedRecordOfMetadatas = {} as Record<
    // nodeType
    string,
    // we keep an array of all properties for the merged root Updated/Created node subscription fragments
    // so for example, in the relationship headline.assignee
    // this would be all the properties that we'd need to subscribe to pertaining the assignee
    { _allProperties: Array<string> } & Record<
      // parentNodeType
      string,
      // we keen an array of all properties queried in this relationship
      // for the merged Inserted subscription fragmenet
      { _allProperties: Array<string> } & Record<
        // relationalType
        string,
        {
          properties: Array<string>;
          relational: RelationalQueryRecord | undefined;
        }
      >
    >
  >;

  opts.relationalSubscriptionMetadatas.forEach(subMetadata => {
    // initialize the record if it doesn't exist
    if (!mergedRecordOfMetadatas[subMetadata.nodeType]) {
      mergedRecordOfMetadatas[subMetadata.nodeType] = {
        _allProperties: [] as Array<string>,
      } as typeof mergedRecordOfMetadatas[string];
    }

    if (
      !mergedRecordOfMetadatas[subMetadata.nodeType]?.[
        subMetadata.parentNodeType
      ]
    ) {
      mergedRecordOfMetadatas[subMetadata.nodeType][
        subMetadata.parentNodeType
      ] = {
        _allProperties: [] as Array<string>,
      } as typeof mergedRecordOfMetadatas[string][string];
    }

    if (
      !mergedRecordOfMetadatas[subMetadata.nodeType]?.[
        subMetadata.parentNodeType
      ]?.[subMetadata.relationalType]
    ) {
      mergedRecordOfMetadatas[subMetadata.nodeType][subMetadata.parentNodeType][
        subMetadata.relationalType
      ] = {
        properties: [],
        relational: undefined,
      };
    }

    subMetadata.properties.forEach(property => {
      if (
        !mergedRecordOfMetadatas[subMetadata.nodeType]._allProperties.includes(
          property
        )
      ) {
        mergedRecordOfMetadatas[subMetadata.nodeType]._allProperties.push(
          property
        );
      }

      if (
        !mergedRecordOfMetadatas[subMetadata.nodeType][
          subMetadata.parentNodeType
        ][subMetadata.relationalType].properties.includes(property)
      ) {
        mergedRecordOfMetadatas[subMetadata.nodeType][
          subMetadata.parentNodeType
        ][subMetadata.relationalType].properties.push(property);
      }
    });

    if (subMetadata.relational) {
      const existingRecord =
        mergedRecordOfMetadatas[subMetadata.nodeType][
          subMetadata.parentNodeType
        ][subMetadata.relationalType].relational;

      mergedRecordOfMetadatas[subMetadata.nodeType][subMetadata.parentNodeType][
        subMetadata.relationalType
      ].relational = flattenNestedRelationshipRecords(
        existingRecord
          ? [existingRecord, subMetadata.relational]
          : [subMetadata.relational]
      );
    }
  });

  let subscriptionString = ``;
  Object.keys(mergedRecordOfMetadatas).forEach(nodeType => {
    subscriptionString += `
      ...on Updated_${capitalizeFirstLetter(nodeType)} {
        __typename
        id
        value {${getSubscriptionOwnPropsString({
          ownProps: mergedRecordOfMetadatas[nodeType]._allProperties,
        })}}
      }
    `;

    Object.keys(mergedRecordOfMetadatas[nodeType]).forEach(parentNodeType => {
      if (parentNodeType === '_allProperties') return;

      Object.keys(mergedRecordOfMetadatas[nodeType][parentNodeType]).forEach(
        relationalType => {
          if (relationalType === '_allProperties') return;

          const ownProps =
            mergedRecordOfMetadatas[nodeType][parentNodeType][relationalType]
              .properties;
          const relational =
            mergedRecordOfMetadatas[nodeType][parentNodeType][relationalType]
              .relational;
          const isOneToMany = relationalType === 'oneToMany';
          const isOneToOne = relationalType === 'oneToOne';

          subscriptionString += getNestedRelationalSubscriptionString({
            isOneToMany,
            isOneToOne,
            parentNodeType,
            nodeType,
            ownProps,
            relational,
          });
        }
      );
    });
  });

  return subscriptionString;
}

/**
 * This function takes 2 relationalQueryRecords and flattens/merges them
 * into a single relationalQueryRecord
 * it does not take aliases into account, since we don't use them in the subscriptions
 * we simply rely on the relationship name, and will join together all the properties and relationalQueryRecords
 * that have the same relationship name
 */
function flattenNestedRelationshipRecords(
  records: Array<RelationalQueryRecord>
): RelationalQueryRecord {
  const flattenedRecord = {} as RelationalQueryRecord;

  const handleRelationalQueryRecordEntry = (
    relationalQueryRecordEntry: RelationalQueryRecordEntry
  ) => {
    const { _relationshipName } = relationalQueryRecordEntry;

    if (!flattenedRecord[_relationshipName]) {
      flattenedRecord[_relationshipName] = {
        ...relationalQueryRecordEntry,
        relational: relationalQueryRecordEntry.relational
          ? flattenNestedRelationshipRecords([
              relationalQueryRecordEntry.relational,
            ])
          : undefined,
      };
    } else {
      const ongoingFlattenedRelationalRecord =
        flattenedRecord[_relationshipName].relational || {};

      const newProperties = [
        ...(flattenedRecord[_relationshipName].properties || []),
      ];

      relationalQueryRecordEntry.properties.forEach(property => {
        if (!newProperties.includes(property)) {
          newProperties.push(property);
        }
      });

      flattenedRecord[_relationshipName] = {
        ...flattenedRecord[_relationshipName],
        properties: newProperties,
        relational: relationalQueryRecordEntry.relational
          ? flattenNestedRelationshipRecords([
              relationalQueryRecordEntry.relational,
              ongoingFlattenedRelationalRecord,
            ])
          : ongoingFlattenedRelationalRecord,
      };
    }
  };

  records.forEach(record => {
    Object.keys(record).forEach(relationalAlias => {
      const relationalQueryRecordEntry = record[relationalAlias];

      handleRelationalQueryRecordEntry(relationalQueryRecordEntry);
    });
  });

  return flattenedRecord;
}

function getNestedRelationalSubscriptionString(opts: {
  isOneToMany: boolean;
  isOneToOne: boolean;
  parentNodeType: string;
  nodeType: string;
  ownProps: Array<string>;
  relational: RelationalQueryRecord | undefined;
}) {
  let subscriptionString = ``;

  const {
    isOneToMany,
    isOneToOne,
    parentNodeType,
    nodeType,
    ownProps,
    relational,
  } = opts;

  const propsString = getSubscriptionPropsString({
    ownProps,
    relational,
  });

  if (isOneToMany) {
    subscriptionString += `
      ...on Inserted_${capitalizeFirstLetter(
        parentNodeType
      )}_${capitalizeFirstLetter(nodeType)} {
        __typename
        target {
          id
          property
        }
        value {${propsString}}
      }
    `;

    subscriptionString += `
      ...on Removed_${capitalizeFirstLetter(
        parentNodeType
      )}_${capitalizeFirstLetter(nodeType)} {
        __typename
        target {
          id
          property
        }
        id
        value {
          id
        }
      }
    `;
  } else if (isOneToOne) {
    subscriptionString += `
      ...on UpdatedAssociation_${capitalizeFirstLetter(
        parentNodeType
      )}_${capitalizeFirstLetter(nodeType)} {
        __typename
        target {
          id
          property
        }
        value {${propsString}}
      }
    `;
  }

  return subscriptionString;
}

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getSanitizedQueryId(opts: { queryId: string }): string {
  return opts.queryId.replace(/-/g, '_');
}
