import { SMData } from './smDataTypes';
import {
  // IByReferenceArrayQuery,
  // IByReferenceQuery,
  // IChildrenQueryBuilder,
  // ISMData,
  ISMNode,
  // Maybe,
  QueryDefinition,
  QueryDefinitions,
  SMDataDefaultFn,
  // SM_DATA_TYPES,
} from './types';

// const mockString = [
//   'Billy',
//   'Nancy',
//   'Max',
//   'Will',
//   'Dustin',
//   'Jim',
//   'Eleven',
//   'Steve',
//   'Robin',
//   'Lucas',
// ];
// const mockNumber = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
// // NOLEY NOTES: or could do...
// // function generateRandomNumber(min: number, max: number) {
// //   return Math.floor(Math.random() * (max - min + 1) + min)
// // }

export function generateMockData<
  TSMNode,
  TMapFn,
  TQueryDefinitionTarget,
  TQueryDefinitions extends QueryDefinitions<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget
  >
>(opts: { queryDefinitions: TQueryDefinitions }) {
  const { queryDefinitions } = opts;
  let mockedQueries: Record<string, Array<Record<string, any>>> = {};

  Object.keys(queryDefinitions).forEach(queryDefinitionsAlias => {
    const queryDefinition: QueryDefinition<any, any, any> | ISMNode | null =
      queryDefinitions[queryDefinitionsAlias];

    const formattedQueryRecordWithValues = generateMockValuesForQueryDefinitions(
      {
        queryDefinition,
      }
    );

    mockedQueries[queryDefinitionsAlias] = [formattedQueryRecordWithValues];
  });

  return mockedQueries;
}
// 1). if the qD is just the node definition (todos: useTodoNode()), generate mock data using all of the nodes properties
// 2). if the qD has a map fn but it's undefined, also generate mock data using all of the nodes properties
// 3). if the qD has a map fn that's defined, generate mock data for the node properties being queried, but also,
// discover if there's any relational queries in the map fn and return mock data for those as well

function generateMockValuesForQueryDefinitions(opts: {
  queryDefinition: QueryDefinition<any, any, any> | ISMNode | null;
}) {
  const queryDefinition = opts.queryDefinition;

  let queryRecord: any = {};

  console.log('NOLEY queryDefinition raw', queryDefinition);

  if (!queryDefinition) {
    throw new Error(`No query definition is defined`);
  } else if ('_isSMNodeDef' in queryDefinition) {
    return console.log('NOLEY I AM A _isSMNodeDef', queryDefinition);
  } else {
    console.log('NOLEY QUERYDEF.def', queryDefinition.def);
    if (queryDefinition.map) {
      //NOLEY NOTES: recursively call this function drilled into the mapped properties
      // queriedProps = getQueriedProperties({
      //   mapFn: queryDefinition.map,
      //   queryId: opts.queryId,
      //   smData: queryDefinition.def.smData,
      //   smComputed: queryDefinition.def.smComputed,
      //   smRelational: queryDefinition.def.smRelational,
      //   isRootLevel: true,
      // });
      //   //NOLEY NOTES: recursively call this function drilled into the relational properties
      //   relational = getRelationalQueries({
      //     mapFn: queryDefinition.map,
      //     queryId: opts.queryId,
      //     smData: nodeDef.smData,
      //     smComputed: nodeDef.smComputed,
      //     smRelational: nodeDef.smRelational,
      //   });
      // } else {
      //   queriedProps = generateValuesForQueryDefinitions({
      //     nodeProperties: queryDefinition.def.smData,
      //     //NOLEY NOTES: ask Meida what root level is
      //     isRootLevel: true,
      //   });
      // }
    }

    return queryRecord;
  }
}

export function generateValuesForNodeData(
  data: Record<string, SMData<any, any, any> | SMDataDefaultFn>
) {
  console.log('NOLEY DATA', data);

  //NOLEY NOTES: expectedReturnType would be an object with values subsituted in, so passing in
  // {
  //   id: [Function: string] { _default: [SMData], optional: [SMData] },
  //   firstName: [Function: string] { _default: [SMData], optional: [SMData] },
  //   lastName: SMData {
  //     type: 's',
  //     parser: [Function: parser],
  //     boxedValue: undefined,
  //     defaultValue: 'joe',
  //     isOptional: false
  //   },
  //   address: SMData {
  //     type: 'o',
  //     parser: [Function: parser],
  //     boxedValue: [Object],
  //     defaultValue: null,
  //     isOptional: false
  //   }
  // }
  // this ^^^ should return something like:
  const result = {
    id: '1234',
    firstName: 'Earl',
    lastName: 'Johnson',
    address: { state: 'OR', apt: { floor: '1', number: '123' } },
  };

  return result;
}

// if (value.type === SM_DATA_TYPES.string) {
//   console.log('STRING');
//   if (value.defaultValue.length) {
//   }
// }
// if (value.type === SM_DATA_TYPES.maybeString) {
// }
// if (value.type === SM_DATA_TYPES.number) {
// }
// if (value.type === SM_DATA_TYPES.maybeNumber) {
// }
// if (value.type === SM_DATA_TYPES.boolean) {
// }
// if (value.type === SM_DATA_TYPES.maybeBoolean) {
// }
// if (value.type === SM_DATA_TYPES.object) {
// }
// if (value.type === SM_DATA_TYPES.maybeObject) {
// }
// if (value.type === SM_DATA_TYPES.record) {
// }
// if (value.type === SM_DATA_TYPES.maybeRecord) {
// }
// if (value.type === SM_DATA_TYPES.array) {
// }
// if (value.type === SM_DATA_TYPES.maybeArray) {
// }
