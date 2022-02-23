/* eslint @typescript-eslint/no-unused-vars: 0, @typescript-eslint/no-unused-expressions: 0 */
import {
  getDefaultConfig,
  queryDefinition,
  SMJS,
  string,
  number,
  children,
} from './';
import { object, record, reference } from './smDataTypes';
import {
  ExtractQueriedDataFromMapFn,
  IByReferenceQueryBuilder,
  IChildrenQueryBuilder,
  ISMNode,
  MapFnForNode,
  Maybe,
  SMDataEnum,
} from './types';

/**
 * This file should only contain TS tests
 */
const smJS = new SMJS(getDefaultConfig());
const todoProperties = {
  id: string,
  task: string,
  dueDate: number,
  assignee: string,
};
const todoRelational = {
  assignee: () =>
    reference<typeof todoNode, typeof userNode>({
      def: userNode,
      idProp: 'assignee',
    }),
};

type TodoNode = ISMNode<
  typeof todoProperties,
  {},
  { assignee: IByReferenceQueryBuilder<UserNode> }
>;
const todoNode: TodoNode = smJS.def({
  type: 'todo',
  properties: todoProperties,
  relational: todoRelational,
});

const objectUnion = {
  type: string('number'),
  number: number,
  string: string,
} as
  | { type: SMDataEnum<'number'>; number: typeof number }
  | {
      type: SMDataEnum<'string'>;
      string: typeof string;
    };

const userProperties = {
  id: string,
  firstName: string,
  lastName: string,
  address: object({
    state: string,
  }),
  fooBarEnum: string('FOO' as 'FOO' | 'BAR'),
  optionalBarBazEnum: string.optional as SMDataEnum<Maybe<'BAR' | 'BAZ'>>,
  recordEnum: record(string('FOO' as 'FOO' | 'BAR')),
  objectUnion: object(objectUnion),
};
const userRelational = {
  todos: () => children({ def: todoNode }) as IChildrenQueryBuilder<TodoNode>,
};

type UserNode = ISMNode<
  typeof userProperties,
  { fullName: string; avatar: string },
  { todos: IChildrenQueryBuilder<TodoNode> }
>;
const userNode: UserNode = smJS.def({
  type: 'user',
  properties: userProperties,
  relational: userRelational,
  computed: {
    fullName: ({ firstName, lastName }) => {
      return firstName + ' ' + lastName;
    },
    avatar: ({ fullName }) => {
      return fullName + '.jpg';
    },
  },
});

(async function MapFnTests() {
  // @ts-ignore
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

  // @ts-ignore
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
})();

(async function QueryDataReturnTests() {
  const randomMapFn = () => ({ id: string });

  // @ts-ignore
  const returnedDataFromRandomFn: ExtractQueriedDataFromMapFn<
    typeof randomMapFn,
    typeof userNode
  > = {
    id: 'test',
    // @ts-expect-error
    bogus: '',
  };

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

  // @ts-ignore
  const returnedData: ExtractQueriedDataFromMapFn<
    typeof mapFnWithRelationalQueries,
    typeof userNode
  > = {
    // "id" seems to be falling through the never case in ExtractQueriedDataFromMapFnReturn
    // however doesn't seem to be causing issues in the resulting dev experience tests
    // id: '',
    //
    // "shouldError" is not even a valid property on a user, and was not included in the map fn above but doesn't throw an error here.
    // however doesn't seem to be causing issues in the resulting dev experience tests
    // shouldError: '',
    //
    // firstName: '',
  };
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

  const withFooAndBar = { FOO: 1, BAR: 2 };
  withFooAndBar[shorthandQueryResults.data.users[0].fooBarEnum];
  const withFooOnly = { FOO: 1 };
  // @ts-expect-error property 'BAR' is in the enum `fooBarEnum` but "BAR" was omitted from the object above
  withFooOnly[shorthandQueryResults.data.users[0].fooBarEnum];

  withFooAndBar[shorthandQueryResults.data.users[0].recordEnum['some-key']];

  // @ts-expect-error property 'BAR' is in the enum used in the boxed value of the record `recordEnum` but "BAR" was omitted from the object above
  withFooOnly[shorthandQueryResults.data.users[0].recordEnum['some-key']];

  const objUni = shorthandQueryResults.data.users[0].objectUnion;
  if (objUni.type === 'string') {
    objUni.string as string;
    // @ts-expect-error not in uni when type is string
    objUni.number as number;
  } else {
    objUni.number;
    // @ts-expect-error no in uni when type is number
    objUni.string as string;
  }

  const withBarAndBaz = { BAR: 1, BAZ: 2 };
  const withBarOnly = { BAR: 1 };
  const optionalEnum = shorthandQueryResults.data.users[0].optionalBarBazEnum;
  // @ts-expect-error no null check
  withBarAndBaz[optionalEnum];
  if (optionalEnum) {
    withBarAndBaz[optionalEnum];

    // @ts-expect-error 'BAZ' in enum but omitted from the object above
    withBarOnly[optionalEnum];
  }

  // @ts-expect-error invalid type
  shorthandQueryResults.data.users[0].id as number;

  // @ts-expect-error wasn't queried
  shorthandQueryResults.data.users[0].nonqueried as number;

  // computed data test
  shorthandQueryResults.data.users[0].fullName as string;
  // @ts-expect-error invalid type
  shorthandQueryResults.data.users[0].fullName as number;

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

  // def and map and a filter defined in this query
  // but no specific ids or "under" provided
  const targetWithFilters = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({ id: userData.id }),
      params: {
        filter: {
          firstName: 'Meida',
          // @ts-expect-error doesn't exist in user data
          bogus: '',
        },
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
        fooBarEnum: userData.fooBarEnum,
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

  const withOnlyRelationalResults = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
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
  // @ts-expect-error not queried
  withOnlyRelationalResults.data.users[0].firstName as string;
  withOnlyRelationalResults.data.users[0].todos[0].id as string;
  // @ts-expect-error not queried
  withOnlyRelationalResults.data.users[0].todos[0].bogus as string;

  const withPartialObject = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        address: userData.address({
          map: addressData => ({ state: addressData.state }),
        }),
      }),
    }),
  });

  withPartialObject.data.users[0].address.state as string;
  // @ts-expect-error
  withPartialObject.data.users[0].address.bogus as string;

  const byId = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
      }),
      params: {
        id: 'some-user-id',
      },
    }),
  });

  byId.data.users.id as string;
  // @ts-expect-error
  byId.data.users.bogus as string;
})();
