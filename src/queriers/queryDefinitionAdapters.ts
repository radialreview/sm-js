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
  FilterCondition,
  ENumberFilterOperator,
  ValidSortForNode,
  SortObject,
} from '../types';
import {
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
        relationalQuery._relational === RELATIONAL_TYPES.oneToMany
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
  filter: ValidFilterForNode<TNode>;
  def: INode;
  relational?: Record<string, RelationalQueryRecordEntry>;
}) {
  type FilterForBE = {
    key: keyof ValidFilterForNode<TNode>;
    operator: EStringFilterOperator | ENumberFilterOperator;
    value: any;
  };
  const readyForBE = Object.keys(opts.filter).reduce(
    (acc, current) => {
      const key = current as keyof ValidFilterForNode<TNode>;
      let filterForBE: FilterForBE;
      if (
        opts.filter[key] === null ||
        typeof opts.filter[key] === 'string' ||
        typeof opts.filter[key] === 'number' ||
        typeof opts.filter[key] === 'boolean'
      ) {
        filterForBE = {
          key,
          operator: EStringFilterOperator.eq,
          value: opts.filter[key],
        };
      } else {
        if (opts.relational && key in opts.relational) {
          // format is
          // filter: { task: { id: { eq: 'some id' } } }
          filterForBE = {
            key,
            operator: EStringFilterOperator.eq,
            value: opts.filter[key],
          };
        } else {
          // format is
          // filter: { task: { eq: 'some task' }
          const { condition, ...rest } = opts.filter[key];
          const keys = Object.keys(rest);
          if (keys.length !== 1) {
            throw Error('Expected 1 property on this filter object');
          }
          const operator = (keys[0] as unknown) as
            | EStringFilterOperator
            | ENumberFilterOperator;
          const value = rest[operator as keyof typeof rest];

          filterForBE = {
            key,
            operator,
            value,
          };
        }
      }

      const condition = (opts.filter[key]?.condition ||
        'and') as FilterCondition;

      const conditionArray = acc[condition] || [];
      conditionArray.push(filterForBE);

      acc[condition] = conditionArray;

      return acc;
    },
    {} as {
      and?: Array<FilterForBE>;
      or?: Array<FilterForBE>;
    }
  );

  if (readyForBE.and?.length === 0) {
    delete readyForBE.and;
  }

  if (readyForBE.or?.length === 0) {
    delete readyForBE.or;
  }

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
          const value = isStringEnum
            ? filter.value
            : wrapInQuotesIfString(filter.value);

          acc += `{${filter.key}: {${filter.operator}: ${value}}}`;
        } else {
          // filtering on a prop that's part of a relational query
          if (!opts.relational || !(filter.key in opts.relational)) {
            throw Error(`Invalid filter key: ${filter.key}`);
          }

          acc += `{${filter.key}: ${getBEFilterString({
            filter: filter.value,
            def: opts.relational[filter.key].def,
            relational: opts.relational[filter.key].relational,
          })}}`;
        }

        return acc;
      }, '');

      acc += `${condition}: [${stringifiedFilters}]`;

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
            propertiesString: getQueryPropertiesString({
              queryRecordEntry: relationalQueryRecordEntry,
              nestLevel: opts.nestLevel + 2,
              useServerSidePaginationFilteringSorting:
                opts.useServerSidePaginationFilteringSorting,
            }),
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
  const nodesFragment = `${openNodesFragment}${opts.propertiesString}\n${closeFragment}`;

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
            propertiesString: getQueryPropertiesString({
              queryRecordEntry: opts,
              nestLevel: 3,
              useServerSidePaginationFilteringSorting:
                opts.useServerSidePaginationFilteringSorting,
            }),
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

// will need this when we enable subscriptions
// const subscriptionConfigs: Array<SubscriptionConfig> = Object.keys(
//   queryRecord
// ).reduce((subscriptionConfigsAcc, alias) => {
//   const subscriptionName = getSanitizedQueryId({
//     queryId: opts.queryId + '_' + alias,
//   });
//   const queryRecordEntry = queryRecord[alias];

//   if (!queryRecordEntry) return subscriptionConfigsAcc;

//   const operation = getOperationFromQueryRecordEntry({
//     ...queryRecordEntry,
//     useServerSidePaginationFilteringSorting:
//       opts.useServerSidePaginationFilteringSorting,
//   });

//   const gqlStrings = [
//     `
//   subscription ${subscriptionName} {
//     ${alias}: ${operation} {
//       node {
//         ${getQueryPropertiesString({
//           queryRecordEntry,
//           nestLevel: 5,
//           useServerSidePaginationFilteringSorting:
//             opts.useServerSidePaginationFilteringSorting,
//         })}
//       }
//       operation { action, path }
//     }
//   }
//       `.trim(),
//   ];

//   function extractNodeFromSubscriptionMessage(
//     subscriptionMessage: Record<string, any>
//   ) {
//     if (!subscriptionMessage[alias].node) {
//       throw new UnexpectedSubscriptionMessageException({
//         subscriptionMessage,
//         description: 'No "node" found in message',
//       });
//     }

//     return subscriptionMessage[alias].node;
//   }

//   function extractOperationFromSubscriptionMessage(
//     subscriptionMessage: Record<string, any>
//   ) {
//     if (!subscriptionMessage[alias].operation) {
//       throw new UnexpectedSubscriptionMessageException({
//         subscriptionMessage,
//         description: 'No "operation" found in message',
//       });
//     }

//     return subscriptionMessage[alias].operation;
//   }

//   gqlStrings.forEach(gqlString => {
//     subscriptionConfigsAcc.push({
//       alias,
//       gqlString,
//       extractNodeFromSubscriptionMessage,
//       extractOperationFromSubscriptionMessage,
//     });
//   });

function getSanitizedQueryId(opts: { queryId: string }): string {
  return opts.queryId.replace(/-/g, '_');
}
