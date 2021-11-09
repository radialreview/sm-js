import gql from 'graphql-tag'
import {
  SM_DATA_TYPES,
  SM_RELATIONAL_TYPES,
  IS_NULL_IDENTIFIER,
} from './smDataTypes'
import { SMUnexpectedSubscriptionMessageException } from './exceptions'
import { getKeyValueFilterString } from '../network/gql/queryHelpers'

/**
 * Relational fns are specified when creating an smNode as fns that return a NodeRelationalQueryBuilder
 * so they can be evaluated lazily to avoid dependency loops between nodes related to each other.
 *
 * This fn runs those a record of those relational fns at query time and returns a new record of relational query builders
 */
function getRelationalQueryBuildersFromRelationalFns(
  relationaFns?: NodeRelationalFns<any>
) {
  if (!relationaFns) return {}

  return Object.keys(relationaFns).reduce((acc, key) => {
    acc[key] = relationaFns[key]()

    return acc
  }, {} as NodeRelationalQueryBuilderRecord)
}

function getQueryFnReturn(opts: {
  queryFn: QueryFn<any, any, any>
  properties: Record<string, ISMData>
  relational?: NodeRelationalFns<any>
}) {
  const queryFnOpts: Record<string, any> = {
    ...opts.properties,
    ...getRelationalQueryBuildersFromRelationalFns(opts.relational),
  }

  Object.keys(opts.properties).forEach((key) => {
    const data = opts.properties[key] as ISMData

    if (
      data.type === SM_DATA_TYPES.object ||
      data.type === SM_DATA_TYPES.maybeObject
    ) {
      queryFnOpts[key] = (opts: { query: QueryFn<any, any, any> }) => opts.query
    }
  })

  return opts.queryFn(queryFnOpts) as Record<
    string,
    ISMData | QueryFn<any, any, any> | NodeRelationalQuery<ISMNode>
  >
}

/**
 * The functions in this file are responsible for translating queryDefinitionss to gql documents
 * only function that should be needed outside this file is convertQueryDefinitionToQueryInfo
 * other fns are exported for testing purposes only
 */
function getQueriedProperties(opts: {
  queryId: string
  query: (smData: Record<string, any>) => Record<string, any>
  smData: Record<string, any>
  smComputed?: NodeComputedFns<Record<string, any>, Record<string, any>>
  smRelational?: NodeRelationalFns<NodeRelationalQueryBuilderRecord>
  // this optional arg is only true the first time this fn is called
  // and is used to ensure we also query nested data that was stored in the old format (stringified json)
  isRootLevel?: true
}): Array<string> {
  const queryFnReturn = getQueryFnReturn({
    queryFn: opts.query,
    properties: opts.smData,
    relational: opts.smRelational,
  })

  if (queryFnReturn == null) {
    // @TODO ran into this issue when I forgot to call the query for a nested object, figure out a way to give a better error message
    // user: useAuthenticatedOrgUserData(
    //   ({ id, orgRole, accessLevel, preferences }) => ({
    //     id,
    //     orgRole,
    //     accessLevel,
    //     preferences: preferences({
    //       query: ({ universityLevel }) => ({ universityLevel }), => this university level is a nested object
    //     }),
    //   })
    // ),
    throw Error(
      `The query with the id '${opts.queryId}' has an unexpected value in the query result.`
    )
  }

  return Object.keys(queryFnReturn).reduce(
    (acc, key) => {
      const isData = !!opts.smData[key]

      if (!isData) return acc

      // we always query the id by default, can ignore any explicit requests for it
      if (key === 'id' && opts.isRootLevel) {
        return acc
      }

      const data = opts.smData[key] as ISMData
      if (
        data.type === SM_DATA_TYPES.object ||
        data.type === SM_DATA_TYPES.maybeObject
      ) {
        if (opts.isRootLevel) {
          // query for any data stored in old format (stringified json at the root of the node)
          acc.push(key)
          // why? check comment above the definition of IS_NULL_IDENTIFIER
          acc.push(`${key}${IS_NULL_IDENTIFIER}`)
        }

        // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")
        acc.push(
          ...getQueriedProperties({
            queryId: opts.queryId,
            query: queryFnReturn[key] as QueryFn<any, any, any>,
            smData: (data.boxedValue as unknown) as Record<string, ISMData>,
          }).map((nestedKey) => `${key}_${nestedKey}`)
        )
        return acc
      }

      return [...acc, key]
    },
    opts.isRootLevel ? ['id'] : ([] as Array<string>)
  )
}

function getAllNodeProperties(opts: {
  nodeProperties: Record<string, ISMData>
  isRootLevel: boolean
}) {
  return Object.keys(opts.nodeProperties).reduce(
    (acc, key) => {
      // we always query the id by default, can ignore any explicit requests for it
      if (key === 'id' && opts.isRootLevel) {
        return acc
      }

      const data = opts.nodeProperties[key] as ISMData
      if (
        data.type === SM_DATA_TYPES.object ||
        data.type === SM_DATA_TYPES.maybeObject
      ) {
        if (opts.isRootLevel) {
          // query for any data stored in old format (stringified json at the root of the node)
          acc.push(key)
          // why? check comment above the definition of IS_NULL_IDENTIFIER
          acc.push(`${key}${IS_NULL_IDENTIFIER}`)
        }

        // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")
        acc.push(
          ...getAllNodeProperties({
            nodeProperties: opts.nodeProperties[key].boxedValue as Record<
              string,
              ISMData
            >,
            isRootLevel: false,
          }).map((nestedKey) => `${key}_${nestedKey}`)
        )
        return acc
      }

      return [...acc, key]
    },
    opts.isRootLevel ? ['id'] : ([] as Array<string>)
  )
}

function getRelationalQueries(opts: {
  queryId: string
  query: (smData: Record<string, any>) => Record<string, any>
  smData: Record<string, any>
  smComputed?: NodeComputedFns<Record<string, any>, Record<string, any>>
  smRelational?: NodeRelationalFns<NodeRelationalQueryBuilderRecord>
}): Record<string, RelationalQueryRecordEntry> | undefined {
  const queryFnReturn = getQueryFnReturn({
    queryFn: opts.query,
    properties: opts.smData,
    relational: opts.smRelational,
  })

  const relationalQueries = Object.keys(queryFnReturn).reduce((acc, key) => {
    const isData = !!opts.smData[key]
    const isComputed = opts.smComputed ? !!opts.smComputed[key] : false

    if (isData || isComputed) {
      return acc
    } else {
      const relationalQuery = queryFnReturn[key] as NodeRelationalQuery<ISMNode>

      if (relationalQuery._smRelational == null) {
        throw Error(
          `getRelationalQueries - the key "${key}" is not a data property, not a computed property and does not contain a relational query.`
        )
      }

      const queryFn = (data: any) => relationalQuery.query(data)

      const relationalQueryRecord: BaseQueryRecordEntry = {
        node: relationalQuery.node,
        properties: getQueriedProperties({
          queryId: opts.queryId,
          query: queryFn,
          smData: relationalQuery.node.smData,
          smComputed: relationalQuery.node.smComputed,
          smRelational: relationalQuery.node.smRelational,
          isRootLevel: true,
        }),
      }

      const relationalQueriesWithinThisRelationalQuery = getRelationalQueries({
        queryId: opts.queryId,
        query: queryFn,
        smData: relationalQuery.node.smData,
        smComputed: relationalQuery.node.smComputed,
        smRelational: relationalQuery.node.smRelational,
      })

      if (relationalQueriesWithinThisRelationalQuery) {
        relationalQueryRecord.relational = relationalQueriesWithinThisRelationalQuery
      }

      const relationalType = relationalQuery._smRelational
      if (relationalType === SM_RELATIONAL_TYPES.byReference) {
        ;(relationalQueryRecord as RelationalQueryRecordEntry & {
          byReference: true
        }).byReference = true
        ;(relationalQueryRecord as RelationalQueryRecordEntry & {
          idProp: string
        }).idProp = (relationalQuery as IByReferenceQuery<ISMNode, any>).idProp
      } else if (relationalType === SM_RELATIONAL_TYPES.children) {
        ;(relationalQueryRecord as RelationalQueryRecordEntry & {
          children: true
        }).children = true
        if ('depth' in relationalQuery) {
          ;(relationalQueryRecord as RelationalQueryRecordEntry & {
            depth?: number
          }).depth = relationalQuery.depth
        }
      } else {
        throw Error(`relationalType "${relationalType}" is not valid.`)
      }

      acc[key] = relationalQueryRecord as RelationalQueryRecordEntry
      return acc
    }
  }, {} as Record<string, RelationalQueryRecordEntry>)

  if (Object.keys(relationalQueries).length === 0) return undefined
  return relationalQueries
}

export function getQueryRecordFromQueryDefinition(opts: {
  queryId: string
  queryDefinitions: QueryDefinitions
}) {
  const queryRecord: QueryRecord = {}

  Object.keys(opts.queryDefinitions).forEach((queryDefinitionsAlias) => {
    const queryDefinition = opts.queryDefinitions[queryDefinitionsAlias]

    let queriedProps
    let node
    let relational
    if (queryDefinition._isSMNodeDef) {
      node = queryDefinition as ISMNode
      queriedProps = getAllNodeProperties({
        nodeProperties: node.smData,
        isRootLevel: true,
      })
    } else {
      queriedProps = getQueriedProperties({
        query: queryDefinition.query,
        queryId: opts.queryId,
        smData: queryDefinition.node.smData,
        smComputed: queryDefinition.node.smComputed,
        smRelational: queryDefinition.node.smRelational,
        isRootLevel: true,
      })
      node = queryDefinition.node
      relational = getRelationalQueries({
        query: queryDefinition.query,
        queryId: opts.queryId,
        smData: queryDefinition.node.smData,
        smComputed: queryDefinition.node.smComputed,
        smRelational: queryDefinition.node.smRelational,
      })
    }

    const queryRecordEntry = {
      node: node,
      properties: queriedProps,
      relational,
    }

    if ('ids' in queryDefinition) {
      ;(queryRecordEntry as QueryRecordEntry & { ids: Array<string> }).ids =
        queryDefinition.ids
    } else if ('id' in queryDefinition) {
      ;(queryRecordEntry as QueryRecordEntry & { id: string }).id =
        queryDefinition.id
    } else if ('underIds' in queryDefinition) {
      ;(queryRecordEntry as QueryRecordEntry & {
        underIds: Array<string>
      }).underIds = queryDefinition.underIds
      if ('depth' in queryDefinition) {
        ;(queryRecordEntry as QueryRecordEntry & { depth?: string }).depth =
          queryDefinition.depth
      }
      if ('filter' in queryDefinition) {
        ;(queryRecordEntry as QueryRecordEntry & { filter: any }).filter =
          queryDefinition.filter
      }
    }

    queryRecord[queryDefinitionsAlias] = queryRecordEntry as QueryRecordEntry
  })
  return queryRecord
}

function getIdsString(ids: Array<string>) {
  return `[${ids.map((id) => `"${id}"`).join(',')}]`
}

function getGetNodeOptions(opts: {
  node: ISMNode
  underIds?: Array<string>
  depth?: number
  /** @TODO_TECH_DEBT_10_22 - https://tractiontools.atlassian.net/browse/MIO-335 */
  filter?:
    | Array<QueryFilterEqualsKeyValue<ISMNode>>
    | QueryFilterEqualsKeyValue<ISMNode>
}) {
  const options: Array<string> = [`type: "${opts.node.type}"`]

  if (opts.underIds) {
    options.push(
      `underIds: [${opts.underIds.map((id) => `"${id}"`).join(',')}]`
    )
  }

  if (opts.depth !== null && opts.depth !== undefined) {
    options.push(`depth: ${opts.depth}`)
  }

  if (opts.filter !== null && opts.filter !== undefined) {
    options.push(
      Array.isArray(opts.filter)
        ? `filter: [${opts.filter.map(getKeyValueFilterString).join(',')}]`
        : `filter: ${getKeyValueFilterString(opts.filter)}`
    )
  }

  return options.join(', ')
}

// subscriptions use a slightly different set of arguments for now
// https://tractiontools.atlassian.net/secure/RapidBoard.jspa?rapidView=53&projectKey=SMT&modal=detail&selectedIssue=SMT-636
function getSubscriptionGetNodeOptions(opts: {
  node: ISMNode
  under?: string
  depth?: number
}) {
  const options: Array<string> = [`type: "${opts.node.type}"`]

  if (opts.under) {
    options.push(`underIds: ["${opts.under}"]`)
  }

  // @TODO uncomment when subscriptions support depth params
  // if (opts.depth != null) {
  //   options.push(`depth: ${opts.depth}`)
  // }

  return options.join(', ')
}

function getSpaces(numberOfSpaces: number) {
  return new Array(numberOfSpaces).fill(' ').join('')
}

function getQueryPropertiesString(opts: {
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry
  nestLevel: number
}) {
  let propsString = `\n${getSpaces((opts.nestLevel + 2) * 2)}`
  propsString += opts.queryRecordEntry.properties.join(
    `,\n${getSpaces((opts.nestLevel + 2) * 2)}`
  )

  if (opts.queryRecordEntry.relational) {
    propsString +=
      (propsString !== '' ? ',' : '') +
      getRelationalQueryString({
        relationalQueryRecord: opts.queryRecordEntry.relational,
        nestLevel: opts.nestLevel + 2,
      })
  }

  return propsString
}

function getRelationalQueryString(opts: {
  relationalQueryRecord: Record<string, RelationalQueryRecordEntry>
  nestLevel: number
}) {
  return Object.keys(opts.relationalQueryRecord).reduce((acc, alias) => {
    const relationalQueryRecordEntry = opts.relationalQueryRecord[alias]

    let operation: string

    if ('byReference' in relationalQueryRecordEntry) {
      operation = `GetReferences(propertyNames: "${relationalQueryRecordEntry.idProp}")`
    } else if ('children' in relationalQueryRecordEntry) {
      const depthString =
        'depth' in relationalQueryRecordEntry
          ? relationalQueryRecordEntry.depth !== undefined
            ? `,depth: ${relationalQueryRecordEntry.depth}`
            : ''
          : ''
      operation = `GetChildren(type: "${relationalQueryRecordEntry.node.type}"${depthString})`
    } else {
      throw Error(
        `relationalQueryRecordEntry is invalid\n${JSON.stringify(
          relationalQueryRecordEntry,
          null,
          2
        )}`
      )
    }

    return (
      acc +
      `\n${getSpaces(opts.nestLevel * 2)}${alias}: ${operation} {` +
      getQueryPropertiesString({
        queryRecordEntry: relationalQueryRecordEntry,
        nestLevel: opts.nestLevel,
      }) +
      `\n${getSpaces(opts.nestLevel * 2)}}`
    )
  }, '')
}

function getRootLevelQueryString(
  opts: {
    alias: string
  } & QueryRecordEntry
) {
  let operation: string
  if ('ids' in opts) {
    operation = `GetNodesByIdNew(ids: ${getIdsString(opts.ids)})`
  } else if ('id' in opts) {
    operation = `GetNodesByIdNew(ids: ${getIdsString([opts.id])})`
  } else {
    operation = `GetNodesNew(${getGetNodeOptions(opts)})`
  }

  return (
    `${opts.alias}: ${operation} {` +
    `${getQueryPropertiesString({ queryRecordEntry: opts, nestLevel: 1 })}` +
    `\n${getSpaces(4)}}`
  )
}

export function getQueryInfo(opts: {
  queryDefinitions: QueryDefinitions
  queryId: string
}) {
  const queryRecord: QueryRecord = getQueryRecordFromQueryDefinition(opts)
  const queryGQLString = `
    query ${getSanitizedQueryId({ queryId: opts.queryId })} {
        ${Object.keys(queryRecord)
          .map((alias) =>
            getRootLevelQueryString({
              alias,
              ...queryRecord[alias],
            })
          )
          .join('\n    ')}
    }
  `.trim()

  type SubscriptionConfig = {
    alias: string
    gqlString: string
    extractNodeFromSubscriptionMessage: (
      subscriptionMessage: Record<string, any>
    ) => any
    extractOperationFromSubscriptionMessage: (
      subscriptionMessage: Record<string, any>
    ) => any
  }

  const subscriptionConfigs: Array<SubscriptionConfig> = Object.keys(
    queryRecord
  ).reduce((subscriptionConfigsAcc, alias) => {
    const subscriptionName = getSanitizedQueryId({
      queryId: opts.queryId + '_' + alias,
    })
    const queryRecordEntry = queryRecord[alias]

    let operations: Array<string>
    if ('ids' in queryRecordEntry) {
      operations = [
        `GetNodesById(ids: ${getIdsString(
          queryRecordEntry.ids
        )}, monitorChildEvents: true)`,
      ]
    } else if ('id' in queryRecordEntry) {
      operations = [
        `GetNodesById(ids: ${getIdsString([
          queryRecordEntry.id,
        ])}, monitorChildEvents: true)`,
      ]
    } else if ('underIds' in queryRecordEntry) {
      operations = queryRecordEntry.underIds.map((underId) => {
        return `GetNodesNew(${getSubscriptionGetNodeOptions({
          ...queryRecordEntry,
          under: underId,
        })}, monitorChildEvents: true)`
      })
    } else {
      operations = [
        `GetNodesNew(${getSubscriptionGetNodeOptions(
          queryRecordEntry
        )}, monitorChildEvents: true)`,
      ]
    }

    const gqlStrings = operations.map((operation) => {
      return `
    subscription ${subscriptionName} {
      ${alias}: ${operation} {
        node {
          ${getQueryPropertiesString({ queryRecordEntry, nestLevel: 5 })}
        }
        operation { action, path }
      }
    }
        `.trim()
    })

    function extractNodeFromSubscriptionMessage(
      subscriptionMessage: Record<string, any>
    ) {
      if (!subscriptionMessage[alias].node) {
        throw new SMUnexpectedSubscriptionMessageException({
          subscriptionMessage,
          description: 'No "node" found in message',
        })
      }

      return subscriptionMessage[alias].node
    }

    function extractOperationFromSubscriptionMessage(
      subscriptionMessage: Record<string, any>
    ) {
      if (!subscriptionMessage[alias].operation) {
        throw new SMUnexpectedSubscriptionMessageException({
          subscriptionMessage,
          description: 'No "operation" found in message',
        })
      }

      return subscriptionMessage[alias].operation
    }

    gqlStrings.forEach((gqlString) => {
      subscriptionConfigsAcc.push({
        alias,
        gqlString,
        extractNodeFromSubscriptionMessage,
        extractOperationFromSubscriptionMessage,
      })
    })

    return subscriptionConfigsAcc
  }, [] as Array<SubscriptionConfig>)

  return {
    subscriptionConfigs: subscriptionConfigs,
    queryGQLString,
    queryRecord,
  }
}

/**
 * Converts a queryDefinitions into a gql doc that can be sent to the gqlClient
 * Returns a queryRecord for easily deduping requests based on the data that is being requested
 * Can later also be used to build a diff to request only the necessary data
 * taking into account the previous query record to avoid requesting data already in memory
 */
export function convertQueryDefinitionToQueryInfo(opts: {
  queryDefinitions: QueryDefinitions
  queryId: string
}) {
  const { queryGQLString, subscriptionConfigs, queryRecord } = getQueryInfo(
    opts
  )

  return {
    queryGQL: gql(queryGQLString),
    subscriptionConfigs: subscriptionConfigs.map((subscriptionConfig) => ({
      ...subscriptionConfig,
      gql: gql(subscriptionConfig.gqlString),
    })),
    queryRecord,
  }
}

function getSanitizedQueryId(opts: { queryId: string }): string {
  return opts.queryId.replace(/-/g, '_')
}
