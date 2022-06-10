import {
  // IByReferenceArrayQuery,
  // IByReferenceQuery,
  // IChildrenQueryBuilder,
  // ISMData,
  ISMNode,
  // Maybe,
  QueryDefinition,
  QueryDefinitions,
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
  // const queryMockResults: any = {}; // NOLEY NOTES: fix this type in time

  Object.keys(queryDefinitions).forEach(queryDefinitionsAlias => {
    const queryDefinition: QueryDefinition<any, any, any> | ISMNode | null =
      queryDefinitions[queryDefinitionsAlias];

    // let nodeDef;
    // let queriedProps;
    // let relational;
    // let allowNullResult; // NOLEY NOTES: does this matter probs not
    if (!queryDefinition) {
      return console.log('NOLEY - there is no query def here');
    } else if ('_isSMNodeDef' in queryDefinition) {
      // nodeDef = queryDefinition as ISMNode;
      return console.log('NOLEY I AM A _isSMNodeDef', queryDefinition);
      //NOLEY NOTES: maybe don't need to use these returns a string array of all the properties...
      // but the funneling logic here can steal, remove export if not using...
      // queriedProps = getAllNodeProperties({
      //   nodeProperties: nodeDef.smData,
      //   isRootLevel: true,
      // });
    } else {
      // nodeDef = queryDefinition.def;
      // allowNullResult = queryDefinition.target?.allowNullResult;

      const mockQueryWithValues = Object.keys(queryDefinition.def.smData).map(
        key => {
          const value: any = queryDefinition.def.smData[key];

          console.log('NOLEY VALUE', value);
        }
      );
      console.log('NOLEY mockQueryWithValues', mockQueryWithValues);
      return null;
      // return console.log(
      //   'NOLEY queryDefinition.def.smData',
      //   queryDefinition.def.smData
      // );
      // if (queryDefinition.map) {
      //   queriedProps = getQueriedProperties({
      //     mapFn: queryDefinition.map,
      //     queryId: opts.queryId,
      //     smData: queryDefinition.def.smData,
      //     smComputed: queryDefinition.def.smComputed,
      //     smRelational: queryDefinition.def.smRelational,
      //     isRootLevel: true,
      //   });
      //   relational = getRelationalQueries({
      //     mapFn: queryDefinition.map,
      //     queryId: opts.queryId,
      //     smData: nodeDef.smData,
      //     smComputed: nodeDef.smComputed,
      //     smRelational: nodeDef.smRelational,
      //   });
      // } else {
      // queriedProps = getAllNodeProperties({
      //   nodeProperties: nodeDef.smData,
      //   isRootLevel: true,
      // });
      // }
    }
    // const queryRecordEntry = {
    //   def: nodeDef,
    //   properties: queriedProps,
    //   relational,
    //   allowNullResult,
    // };

    // console.log('NOLEY QUERIEDPROPS', queriedProps);
  });
}
// 1). if the qD is just the node definition (todos: useTodoNode()), generate mock data using all of the nodes properties
// 2). if the qD has a map fn but it's undefined, also generate mock data using all of the nodes properties
// 3). if the qD has a map fn that's defined, generate mock data for the node properties being queried, but also,
// discover if there's any relational queries in the map fn and return mock data for those as well

//NOLEY NOTES: to account for the above, we maybe need some kind of function that routes depending on contents of qD...
//NOLEY NOTES, this is what is passed into the map on 159 in smQueriers, guessing properties is TMapFn?
// will we need to consider target vs no target to return array vs single object, probably.

// export type QueryDefinition<
//   TSMNode extends ISMNode,
//   TMapFn extends MapFnForNode<TSMNode> | undefined,
//   TQueryDefinitionTarget extends QueryDefinitionTarget
// > = {
//   def: TSMNode;
//   map: TMapFn;
//   filter?: ValidFilterForNode<TSMNode>
//   target?: TQueryDefinitionTarget
//   tokenName?: string
// };

// export function determineQueryDefinitionContents(opts: {
//   queryDefinition: {
//     properties: Record<
//       string,
//       | ISMData
//       | IByReferenceQuery
//       | IByReferenceArrayQuery
//       | IChildrenQueryBuilder
//     >;
//   };
// }) {
//   const { queryDefinition } = opts;

//   // 1 & 2). if the qD has a map fn but it's undefined, also generate mock data using all of the nodes properties
//   // NOLEY NOTES: not sure how to account for it just being a node def useTodoNode().. circle back
//   if (!queryDefinition.properties) {
//     return 'I should query all the node properties';
//   } else if (queryDefinition?.properties) {
//     // NOLEY NOTES: maybe consider a different check here, like Object.keys(queryDefinition.properties).length or something
//     // 3). if the qD has a map fn that's defined, generate mock data for the node properties being queried, but also,
//     // discover if there's any relational queries in the map fn and return mock data for those as well
//     return 'I should query all the node properites you give me and any relational references supplied';
//     // return generateMockData({properties: queryDefinition.properties})
//   } else {
//     throw Error('IDK wut is going on');
//   }
// }

// export function generateMockDataValues(opts: {
//   properties: Maybe<
//     Record<
//       string,
//       | ISMData
//       | IByReferenceQuery
//       | IByReferenceArrayQuery
//       | IChildrenQueryBuilder
//     >
//   >;
//   node: ISMNode; // NOLEY NOTES: maybe this type idk
// }) {
//   const { properties } = opts;
//   const mockDataResults = Object.keys(properties || {}).map(key => {
//     return 'wut';
//   });

//   return mockDataResults;
// }
