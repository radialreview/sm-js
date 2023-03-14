import { QueryRecord } from '../types';

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

    const { def, id, ids } = queryRecordEntry;
    const type = def.type;

    if (!staticData[type]) {
      throw new Error(`No static data for type ${type}`);
    }

    if (id != null) {
      response[alias] = staticData[type][id] || null;
      return;
    } else if (ids != null) {
      response[alias] = ids.map(id => staticData[type][id]);
      return;
    } else {
      response[alias] = {
        nodes: Object.values(staticData[type]),
      };
      return;
    }
  });

  return response;
}
