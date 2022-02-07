import {
  getDefaultConfig,
  queryDefinition,
  SMJS,
  string,
  number,
  children,
} from './';
import {
  ExtractQueriedDataFromMapFn,
  IChildrenQueryBuilder,
  MapFnForNode,
} from './types';

/**
 * This file should only contain TS tests
 */
const smJS = new SMJS(getDefaultConfig());
const todoNode = smJS.def({
  type: 'todo',
  properties: {
    id: string,
    task: string,
    dueDate: number,
  },
});

const userProperties = {
  id: string,
  firstName: string,
};
const userRelational = {
  todos: () =>
    children({ def: todoNode }) as IChildrenQueryBuilder<typeof todoNode>,
};
const userNode = smJS.def({
  type: 'user',
  properties: userProperties,
  relational: userRelational,
});

(async function MapFnTests() {
  const mapFn: MapFnForNode<typeof userNode> = ({
    id,
    // @ts-expect-error
    yeahThisDoesntExist,
  }) => ({
    id,
    // // TS-TYPE-TEST-1
    // // @ts-expect-error
    // bleh: '',
  });
  mapFn;

  const mapFnWithRelationalQueries: MapFnForNode<typeof userNode> = ({
    id,
    todos,
    // @ts-expect-error
    yeahThisDoesntExist,
  }) => ({
    id,
    todos: todos({
      map: todoData => ({
        id: todoData.id,
        task: todoData.task,
      }),
    }),
    // // TS-TYPE-TEST-1
    // // @ts-expect-error
    todos2: todos,
  });
  mapFnWithRelationalQueries;
})();

(async function QueryDataReturnTests() {
  const randomMapFn = () => ({ id: string });

  const returnedDataFromRandomFn: ExtractQueriedDataFromMapFn<
    typeof randomMapFn,
    typeof userNode
  > = {
    id: 'test',
    // @ts-expect-error
    bogus: '',
  };
  returnedDataFromRandomFn;

  const mapFnWithRelationalQueries: MapFnForNode<typeof userNode> = ({
    id,
    todos,
  }) => ({
    id,
    todos: todos({
      map: todoData => ({
        id: todoData.id,
        task: todoData.task,
      }),
    }),
  });
  mapFnWithRelationalQueries;

  const returnedData: ExtractQueriedDataFromMapFn<
    typeof mapFnWithRelationalQueries,
    typeof userNode
  > = {
    // "id" seems to be falling through the never case in ExtractQueriedDataFromMapFnReturn
    // however doesn't seem to be causing issues in the resulting dev experience tests
    // id: '',

    // is not even a valid property on a user, and was not included in the map fn above but doesn't throw an error here.
    // however doesn't seem to be causing issues in the resulting dev experience tests
    // shouldError: '',

    // @ts-expect-error was not included in the map fn above
    firstName: '',
  };
  returnedData;
})();

// These are the most important
// While the other tests in this file check that the share generic types are doing what they're supposed to
// devs consuming this library will only notice changes in these test results
(async function ResultingDevExperienceTests() {
  // shorthand syntax tests
  // no map fn or target defined
  const shorthandQueryResults = await smJS.query({
    users: userNode,
  });
  shorthandQueryResults.data.users[0].id as string;
  // @ts-expect-error invalid type
  shorthandQueryResults.data.users[0].id as number;
  // @ts-expect-error wasn't queried
  shorthandQueryResults.data.users[0].nonqueried as number;

  // def and map defined in this query
  // but no specific ids or "under" provided
  const targetOmmissionResults = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        // @ts-expect-error
        nonExisting: userData.nonExisting,
        // // TS-TYPE-TEST-1
        // // @ts-expect-error
        bogus: '',
      }),
    }),
  });

  targetOmmissionResults.data.users[0].id as string;
  // @ts-expect-error invalid type
  targetOmmissionResults.data.users[0].id as number;
  // @ts-expect-error not queried
  targetOmmissionResults.data.users[0].notqueried as number;
  // @ts-expect-error not queried
  targetOmmissionResults.data.users[0].firstName as string;

  // def and map defined in this query
  // but no specific ids or "under" provided
  const targetWithFilters = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({ id: userData.id }),
      filter: {
        firstName: 'Meida',
        // @ts-expect-error
        nonExistingProp: 'Test',
      },
    }),
  });

  targetWithFilters.data.users[0].id as string;
  // @ts-expect-error invalid type
  targetWithFilters.data.users[0].id as number;
  // @ts-expect-error not queried
  targetWithFilters.data.users[0].notqueried as number;

  const withRelationalResults = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        todos: userData.todos({
          map: todoData => ({
            id: todoData.id,
            dueDate: todoData.dueDate,
            // @ts-expect-error doesn't exist in todo data
            nonExisting: todoData.doesntExist,
          }),
        }),
      }),
    }),
  });

  withRelationalResults.data.users[0].id as string;
  // @ts-expect-error not queried
  withRelationalResults.data.users[0].firstName as string;
  withRelationalResults.data.users[0].todos[0].id as string;
  withRelationalResults.data.users[0].todos[0].dueDate as number;
  // @ts-expect-error not queried
  withRelationalResults.data.users[0].todos[0].task as string;
})();
