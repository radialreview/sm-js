import {
  DEFAULT_PAGE_SIZE,
  NODES_PROPERTY_KEY,
  PAGE_INFO_PROPERTY_KEY,
} from '../consts';
import { UnreachableCaseError } from '../exceptions';
import { PageInfoFromResults } from '../nodesCollection';
import {
  QueryRecord,
  QueryRecordEntry,
  RelationalQueryRecord,
  RelationalQueryRecordEntry,
} from '../types';
import { applyClientSideSortAndFilterToData } from './clientSideOperators';

export type StaticData = Record<
  string, // node type
  Record<
    string, // node id
    Record<
      string, // field name
      any // field value
    >
  >
>;

export function getResponseFromStaticData(opts: {
  queryRecord: QueryRecord;
  staticData: StaticData;
}) {
  const { queryRecord, staticData } = opts;

  const response: Record<string, any> = {};

  Object.keys(queryRecord).forEach(alias => {
    const queryRecordEntry = queryRecord[alias];
    if (!queryRecordEntry) {
      response[alias] = null;
      return;
    }

    const { def, id, ids, relational } = queryRecordEntry;
    const type = def.type;

    if (!staticData[type]) {
      throw new Error(`No static data for type ${type}`);
    }

    function agumentNodeWithRelationalData(node: Record<string, any>) {
      if (!node) {
        return null;
      }

      if (relational) {
        return augmentWithRelational({
          dataToAugment: node,
          allStaticData: staticData,
          relational,
        });
      } else {
        return node;
      }
    }

    if (id != null) {
      if (!staticData[type][id]) {
        throw new Error(
          `No static data for node of type ${type} with id "${id}"`
        );
      }

      response[alias] = agumentNodeWithRelationalData(staticData[type][id]);
      return;
    } else if (ids != null) {
      const data = ids.map(id => {
        if (!staticData[type][id]) {
          throw new Error(
            `No static data for node of type ${type} with id "${id}"`
          );
        }

        return agumentNodeWithRelationalData(staticData[type][id]);
      });

      response[alias] = addPaginationData({
        filteredNodes: data,
        queryRecordEntry,
      });

      return;
    } else {
      const nodes = Object.values(staticData[type]).map(
        agumentNodeWithRelationalData
      );

      const data = {
        [alias]: nodes,
      };

      applyClientSideSortAndFilterToData({ [alias]: queryRecordEntry }, data);

      response[alias] = addPaginationData({
        filteredNodes: data[alias],
        queryRecordEntry,
      });
      return;
    }
  });

  return response;
}

function augmentWithRelational(opts: {
  dataToAugment: Record<string, any>;
  allStaticData: StaticData;
  relational: RelationalQueryRecord;
}) {
  const { dataToAugment, allStaticData, relational } = opts;

  const relationalData: Record<string, any> = {};
  Object.keys(relational).forEach(alias => {
    const {
      def,
      _relationshipName,
      properties,
      relational: relationalDataForThisRelationalData,
    } = relational[alias];

    if (
      !dataToAugment[_relationshipName] ||
      !dataToAugment[_relationshipName][STATIC_RELATIONAL]
    ) {
      throw Error(
        `The relationship ${_relationshipName} was queried for the node with the id ${dataToAugment.id} but it was not included in the static data.`
      );
    }

    const ownPropName: string =
      dataToAugment[_relationshipName][STATIC_RELATIONAL];
    if (!dataToAugment[ownPropName]) {
      throw Error(
        `The relationship ${_relationshipName} was queried for the node with the id ${dataToAugment.id} but the static relational property ${ownPropName} was not included in the static data.`
      );
    }

    const idOrIds = dataToAugment[ownPropName];

    const queryRecordEntry: QueryRecordEntry = {
      def,
      id: typeof idOrIds === 'string' ? idOrIds : undefined,
      ids: Array.isArray(idOrIds) ? idOrIds : undefined,
      properties,
      relational: relationalDataForThisRelationalData,
      tokenName: '',
    };

    const unfilteredResponse = getResponseFromStaticData({
      queryRecord: {
        [alias]: queryRecordEntry,
      },
      staticData: allStaticData,
    });

    // when a oneToMany relationship is queried, we must return back a paginated nodes collection
    // however to avoid having "getResponseFromStaticData" know about relational queries, we just
    // do that work here
    if ('oneToMany' in relational[alias]) {
      const data = {
        [alias]: {
          [NODES_PROPERTY_KEY]: unfilteredResponse[alias],
        },
      };

      applyClientSideSortAndFilterToData({ [alias]: relational[alias] }, data);

      relationalData[alias] = addPaginationData({
        filteredNodes: data[alias][NODES_PROPERTY_KEY],
        queryRecordEntry: relational[alias],
      });
    } else if ('oneToOne' in relational[alias]) {
      relationalData[alias] = unfilteredResponse[alias];
    } else if ('nonPaginatedOneToMany' in relational[alias]) {
      const data = {
        [alias]: unfilteredResponse[alias],
      };

      applyClientSideSortAndFilterToData({ [alias]: relational[alias] }, data);

      relationalData[alias] = data[alias];
    } else {
      throw new UnreachableCaseError(relational[alias] as never);
    }
  });

  return { ...dataToAugment, ...relationalData };
}

function addPaginationData(opts: {
  filteredNodes: Array<unknown>;
  queryRecordEntry: QueryRecordEntry | RelationalQueryRecordEntry;
}) {
  const { filteredNodes, queryRecordEntry } = opts;
  const pageSize =
    queryRecordEntry.pagination?.itemsPerPage || DEFAULT_PAGE_SIZE;
  const pageNumber = queryRecordEntry.pagination?.startCursor
    ? Number(queryRecordEntry.pagination.startCursor)
    : 1;
  const totalPages = Math.ceil(filteredNodes.length / pageSize);

  const pageInfo: PageInfoFromResults = {
    totalPages: Math.ceil(filteredNodes.length / pageSize),
    hasNextPage: totalPages > pageNumber,
    totalCount: filteredNodes.length,
    hasPreviousPage: pageNumber > 1,
    endCursor: String(pageNumber + 1),
    startCursor: String(pageNumber),
  };

  const thisPageOfNodes = filteredNodes.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize
  );

  return {
    [NODES_PROPERTY_KEY]: thisPageOfNodes,
    [PAGE_INFO_PROPERTY_KEY]: pageInfo,
  };
}

const STATIC_RELATIONAL = '__staticRelational';

export function staticRelational(ownPropName: string) {
  return {
    [STATIC_RELATIONAL]: ownPropName,
  };
}
