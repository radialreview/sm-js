import { UnreachableCaseError } from '../exceptions';
import { QueryRecord, QueryRecordEntry, RelationalQueryRecord } from '../types';

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

    function augmentEntryWithRelational(entry: Record<string, any>) {
      if (relational) {
        return augmentWithRelational({
          dataToAugment: entry,
          allStaticData: staticData,
          relational,
        });
      } else {
        return entry;
      }
    }

    if (id != null) {
      response[alias] =
        augmentEntryWithRelational(staticData[type][id]) || null;
      return;
    } else if (ids != null) {
      response[alias] = ids.map(id =>
        augmentEntryWithRelational(staticData[type][id])
      );
      return;
    } else {
      response[alias] = {
        nodes: Object.values(staticData[type]).map(augmentEntryWithRelational),
      };
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

    const unparsedResponse = getResponseFromStaticData({
      queryRecord: {
        [alias]: queryRecordEntry,
      },
      staticData: allStaticData,
    });

    // when a oneToMany relationship is queried, we must return back a paginated nodes collection
    // however to avoid having "getResposneFromStaticData" know about relational queries, we just
    // do that work here
    if ('oneToMany' in relational[alias]) {
      relationalData[alias] = {
        nodes: unparsedResponse[alias],
      };
    } else if ('oneToOne' in relational[alias]) {
      relationalData[alias] = unparsedResponse[alias];
    } else if ('nonPaginatedOneToMany' in relational[alias]) {
      relationalData[alias] = unparsedResponse[alias];
    } else {
      throw new UnreachableCaseError(relational[alias] as never);
    }
  });

  return { ...dataToAugment, ...relationalData };
}

const STATIC_RELATIONAL = '__staticRelational';

export function staticRelational(ownPropName: string) {
  return {
    [STATIC_RELATIONAL]: ownPropName,
  };
}
