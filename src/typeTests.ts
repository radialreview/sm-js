/* eslint @typescript-eslint/no-unused-vars: 0, @typescript-eslint/no-unused-expressions: 0 */
import { getDefaultConfig, queryDefinition, MMGQL, useSubscription } from './';
import {
  string,
  stringEnum,
  number,
  array,
  boolean,
  object,
  record,
  oneToMany,
  oneToOne,
  nonPaginatedOneToMany,
  stringOrNumber,
} from './dataTypes';
import {
  ExtractQueriedDataFromMapFn,
  GetResultingDataTypeFromNodeDefinition,
  GetResultingDataTypeFromProperties,
  IOneToOneQueryBuilder,
  IOneToManyQueryBuilder,
  INode,
  MapFnForNode,
  Maybe,
  ValidFilterForNode,
  QueryDefinition,
  GetResultingDataFromQueryDefinition,
  GetMapFnArgs,
  INonPaginatedOneToManyQueryBuilder,
  Id,
} from './types';

/**
 * This file should only contain TS tests
 */
const mmGQL = new MMGQL(getDefaultConfig());
const todoProperties = {
  id: stringOrNumber,
  task: string,
  dueDate: number,
  assigneeId: string,
  meetingId: string.optional,
  attendeeIds: array(string),
  // used to ensure that only arrays of strings are allowed as idProp for referenceArray
  invalidIdsProperty: array(number),
};
const todoRelational = {
  assignee: () => oneToOne(userNode),
  assignees: () => oneToMany(userNode),
  assignees_nonPaginated: () => nonPaginatedOneToMany(userNode),
  meeting: () => oneToOne(meetingNode),
  assigneeUnionNullable: () =>
    oneToOne<Maybe<{ meetingGuest: MeetingGuestNode; orgUser: UserNode }>>({
      meetingGuest: meetingGuestNode,
      orgUser: userNode,
    }),
  assigneeUnionNonNullable: () =>
    oneToOne<{ meetingGuest: MeetingGuestNode; orgUser: UserNode }>({
      meetingGuest: meetingGuestNode,
      orgUser: userNode,
    }),
};

const meetingProperties = {
  name: string,
  attendeeIds: array(string),
  invalidIdsProperty: array(number),
};

type MeetingRelational = {
  attendees: IOneToManyQueryBuilder<UserNode>;
};

type MeetingNode = INode<{
  TNodeType: 'meeting';
  TNodeData: typeof meetingProperties;
  TNodeComputedData: {};
  TNodeRelationalData: MeetingRelational;
}>;

type TodoNode = INode<{
  TNodeType: 'todo';
  TNodeData: typeof todoProperties;
  TNodeComputedData: {};
  TNodeRelationalData: {
    assignee: IOneToOneQueryBuilder<UserNode>;
    assignees: IOneToManyQueryBuilder<UserNode>;
    assignees_nonPaginated: INonPaginatedOneToManyQueryBuilder<UserNode>;
    meeting: IOneToOneQueryBuilder<Maybe<MeetingNode>>;
    assigneeUnionNullable: IOneToOneQueryBuilder<
      Maybe<{ meetingGuest: MeetingGuestNode; orgUser: UserNode }>
    >;
    assigneeUnionNonNullable: IOneToOneQueryBuilder<{
      meetingGuest: MeetingGuestNode;
      orgUser: UserNode;
    }>;
  };
}>;

const todoNode: TodoNode = mmGQL.def({
  type: 'todo',
  properties: todoProperties,
  relational: todoRelational,
});

const meetingNode: MeetingNode = mmGQL.def({
  type: 'meeting',
  properties: meetingProperties,
  relational: {
    attendees: () => oneToMany(userNode),
  },
});

const userProperties = {
  id: stringOrNumber,
  firstName: string,
  lastName: string,
  bool: boolean(true),
  maybeBool: boolean.optional,
  maybeStr: string.optional,
  address: object({
    state: string,
    nestedInAddress: object({
      nestedNestedInAddress: boolean(true),
    }),
  }),
  fooBarEnum: stringEnum(['FOO', 'BAR']),
  optionalBarBazEnum: stringEnum.optional(['BAR', 'BAZ']),
  recordEnum: record(stringEnum(['FOO', 'BAR'])),
  arrayOfString: array(string),
};
const userRelational = {
  todos: () => oneToMany(todoNode),
  state: () => oneToOne(stateNode),
  todos_nonPaginated: () => nonPaginatedOneToMany(todoNode),
};

type UserNode = INode<{
  TNodeType: 'user';
  TNodeData: typeof userProperties;
  TNodeComputedData: { fullName: string; avatar: string };
  TNodeRelationalData: {
    todos: IOneToManyQueryBuilder<TodoNode>;
    todos_nonPaginated: INonPaginatedOneToManyQueryBuilder<TodoNode>;
    state: IOneToOneQueryBuilder<StateNode>;
  };
}>;

const userNode: UserNode = mmGQL.def({
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

const meetingGuestProperties = {
  id: stringOrNumber,
  firstName: string,
};
type MeetingGuestNode = INode<{
  TNodeType: 'meeting-guest';
  TNodeData: typeof meetingGuestProperties;
  TNodeComputedData: {};
  TNodeRelationalData: {};
}>;
const meetingGuestNode: MeetingGuestNode = mmGQL.def({
  type: 'meeting-guest' as 'meeting-guest',
  properties: meetingGuestProperties,
});

const stateNodeProperties = {
  name: string,
};
type StateNode = INode<{
  TNodeType: 'state';
  TNodeData: typeof stateNodeProperties;
  TNodeComputedData: {};
  TNodeRelationalData: {};
}>;
const stateNode: StateNode = mmGQL.def({
  type: 'state',
  properties: stateNodeProperties,
});
(async function MapFnTests() {
  // @ts-ignore - 'bleh' is assigned a string which is not valid
  const mapFn: MapFnForNode<UserNode> = ({
    id,
    // @ts-expect-error
    yeahThisDoesntExist,
  }) => ({
    id,
    bleh: '',
  });

  // @ts-ignore
  const mapFnWithRelationalQueries: MapFnForNode<UserNode> = ({
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

    todos2: todos,
  });
})();

(async function QueryDataReturnTests() {
  const randomMapFn = () => ({ id: string });

  // @ts-ignore
  const returnedDataFromRandomFn: ExtractQueriedDataFromMapFn<
    typeof randomMapFn,
    UserNode
  > = {
    id: 'test',
    // @ts-expect-error
    bogus: '',
  };

  const mapFnWithRelationalQueries: MapFnForNode<UserNode> = ({
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
    UserNode
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

(function TypeInferrenceTests() {
  type UserNodeData = GetResultingDataTypeFromNodeDefinition<UserNode>;
  const validUserNodeData: UserNodeData = {
    id: '',
    firstName: '',
    bool: true,
    maybeBool: null,
    maybeStr: null,
    lastName: '',
    address: {
      state: '',
      nestedInAddress: {
        nestedNestedInAddress: true,
      },
    },
    fooBarEnum: 'FOO',
    optionalBarBazEnum: null,
    recordEnum: {
      someStringKey: 'FOO',
    },
    arrayOfString: [],
  };

  const invalidPropAtRoot: UserNodeData = {
    ...validUserNodeData,
    // @ts-expect-error
    someFakeProp: '',
  };
  invalidPropAtRoot;

  const invalidEnum: UserNodeData = {
    ...validUserNodeData,
    // @ts-expect-error
    fooBarEnum: 'bogus',
  };
  invalidEnum;

  const invalidNestedProp: UserNodeData = {
    ...validUserNodeData,
    address: {
      ...validUserNodeData.address,
      // @ts-expect-error
      badProp: '',
    },
  };
  invalidNestedProp;

  const filter1: ValidFilterForNode<UserNode, false> = {
    firstName: { contains: 's' },
  };
  filter1;
  const filter2: ValidFilterForNode<UserNode, false> = {
    address: { state: { contains: 's' }, nestedInAddress: {} },
  };
  filter2;
  const filter3: ValidFilterForNode<UserNode, false> = {
    // @ts-expect-error can't search enums
    recordEnum: { FOO: 'BAR' },
  };
  filter3;
  const filter4: ValidFilterForNode<UserNode, false> = {
    // @ts-expect-error can't search arrays
    arrayOfString: ['test'],
  };
  filter4;
  const filter5: ValidFilterForNode<UserNode, false> = {
    bool: { eq: true },
  };
  filter5;
  const filter6: ValidFilterForNode<UserNode, false> = {
    maybeBool: { eq: null },
  };
  filter6;
  const filter7: ValidFilterForNode<UserNode, false> = {
    maybeStr: { eq: null },
  };
  filter7;
  const filter8: ValidFilterForNode<UserNode, false> = {
    id: { neq: 123 },
  };
  filter8;
})();

(function DataTypeInferenceUtilTests() {
  const propertiesWithOptionalObject = {
    string: string,
    optionalString: string.optional,
    optional: object.optional({ foo: string }),
  };
  ({
    string: '',
    optionalString: null,
    optional: null,
  } as GetResultingDataTypeFromProperties<typeof propertiesWithOptionalObject>);
})();

// ResultingDevExperience tests are the most important
// While the other tests in this file check that the share generic types are doing what they're supposed to
// devs consuming this library will only notice changes in these test results
(async function ResultingDevExperienceQueryTests() {
  // shorthand syntax tests
  // no map fn or target defined
  const shorthandQueryResults = await mmGQL.query({
    users: userNode,
  });
  shorthandQueryResults.data.users.nodes[0].id as string;

  const withFooAndBar = { FOO: 1, BAR: 2 };
  withFooAndBar[shorthandQueryResults.data.users.nodes[0].fooBarEnum];
  const withFooOnly = { FOO: 1 };
  // @ts-expect-error property 'BAR' is in the enum `fooBarEnum` but "BAR" was omitted from the object above
  withFooOnly[shorthandQueryResults.data.users[0].fooBarEnum];

  withFooAndBar[
    shorthandQueryResults.data.users.nodes[0].recordEnum['some-key']
  ];

  // @ts-expect-error property 'BAR' is in the enum used in the boxed value of the record `recordEnum` but "BAR" was omitted from the object above
  withFooOnly[shorthandQueryResults.data.users[0].recordEnum['some-key']];

  const withBarAndBaz = { BAR: 1, BAZ: 2 };
  const withBarOnly = { BAR: 1 };
  const optionalEnum =
    shorthandQueryResults.data.users.nodes[0].optionalBarBazEnum;
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
  shorthandQueryResults.data.users.nodes[0].fullName as string;
  // @ts-expect-error invalid type
  shorthandQueryResults.data.users[0].fullName as number;

  // def and map defined in this query
  // but no specific ids or "under" provided
  const targetOmmissionResults = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      // @ts-expect-error bogus property in return
      map: userData => ({
        id: userData.id,
        // @ts-expect-error
        nonExisting: userData.nonExisting,
        bogus: '',
      }),
    }),
  });

  targetOmmissionResults.data.users.nodes[0].id as Id;
  // @ts-expect-error invalid type
  targetOmmissionResults.data.users.nodes[0].id as Function;
  // @ts-expect-error not queried
  targetOmmissionResults.data.users.nodes[0].notqueried as number;
  // @ts-expect-error not queried
  targetOmmissionResults.data.users.nodes[0].firstName as string;

  // def and map and a filter defined in this query
  // but no specific ids or "under" provided
  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({ id: userData.id, firstName: userData.firstName }),
      filter: {
        firstName: 'Meida',
        // @ts-expect-error not a property in the user node
        bogus: '',
      },
    }),
  });

  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        todos: userData.todos({ map: ({ task }) => ({ task }) }),
      }),
      filter: {
        // filter defined when there's also relational data being accessed
        firstName: 'Meida',
      },
    }),
  });

  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        todos: userData.todos({ map: ({ task }) => ({ task }) }),
      }),
      filter: {
        firstName: {
          // @ts-expect-error invalid condition, can only be used with collections
          condition: 'some',
          contains: 'Meida',
        },
      },
    }),
  });

  // testing relational filters
  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        todosForThisUser: userData.todos({ map: ({ task }) => ({ task }) }),
      }),
      filter: {
        todosForThisUser: {
          task: {
            contains: 'test',
          },
          // @ts-expect-error wrong data type, id is a string
          id: {
            eq: {},
          },
        },
      },
    }),
  });

  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        todosForThisUser: userData.todos({
          map: ({ task, assignee, assignees }) => ({
            task,
            assignee: assignee({
              map: ({ firstName }) => ({ firstName }),
            }),
            assignees: assignees({
              map: ({ firstName }) => ({ firstName }),
            }),
          }),
          filter: {
            assignee: {
              firstName: 'test',
            },
          },
        }),
      }),
    }),
  });

  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        todosForThisUser: userData.todos_nonPaginated({
          map: ({ task, assignee, assignees }) => ({
            task,
            assignee: assignee({
              map: ({ firstName }) => ({ firstName }),
            }),
            assignees: assignees({
              map: ({ firstName }) => ({ firstName }),
            }),
          }),
          filter: {
            assignee: {
              firstName: 'test',
            },
            assignees: {
              //@ts-expect-error Type 'true' is not assignable to type 'FilterValue<string, true> | undefined'.
              firstName: true,
            },
          },
        }),
      }),
    }),
  });

  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        todosForThisUser: userData.todos({ map: ({ task }) => ({ task }) }),
      }),
      filter: {
        todosForThisUser: {
          task: {
            condition: 'all',
            contains: 'test',
          },
        },
      },
    }),
  });

  // can't use the result of the query above, since it's invalid and breaks type checking
  const validTargetWithFilters = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({ id: userData.id }),
      filter: {
        firstName: {
          eq: 'Meida',
        },
      },
    }),
  });

  validTargetWithFilters.data.users.nodes[0].id as string;
  // @ts-expect-error invalid type
  validTargetWithFilters.data.users.nodes[0].id as Function;
  // @ts-expect-error not queried
  validTargetWithFilters.data.users.nodes[0].notqueried as number;

  const withRelationalResults = await mmGQL.query({
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
            meeting: todoData.meeting({
              map: ({ name }) => ({ name }),
            }),
            assignee: todoData.assignee({
              map: ({ firstName }) => ({ firstName }),
            }),
          }),
        }),
      }),
    }),
  });

  withRelationalResults.data.users.nodes[0].id as string;
  // @ts-expect-error not queried
  withRelationalResults.data.users.nodes[0].firstName as string;
  withRelationalResults.data.users.nodes[0].todos.nodes[0].id as string;
  withRelationalResults.data.users.nodes[0].todos.nodes[0].dueDate as number;
  // @ts-expect-error not queried
  withRelationalResults.data.users.nodes[0].todos.nodes[0].task as string;

  withRelationalResults.data.users.nodes[0].todos.nodes[0].assignee
    .firstName as string;

  // @ts-expect-error meeting should be nullable
  withRelationalResults.data.users.nodes[0].todos.nodes[0].meeting
    .name as string;

  withRelationalResults.data.users.nodes[0].todos.nodes[0].meeting
    ?.name as string;

  const withOnlyRelationalResults = await mmGQL.query({
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
  withOnlyRelationalResults.data.users.nodes[0].firstName as string;
  withOnlyRelationalResults.data.users.nodes[0].todos.nodes[0].id as string;
  // @ts-expect-error not queried
  withOnlyRelationalResults.data.users.nodes[0].todos.nodes[0].bogus as string;

  const withPartialObject = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        address: userData.address({
          map: addressData => ({
            state: addressData.state,
          }),
        }),
      }),
    }),
  });

  withPartialObject.data.users.nodes[0].address.state as string;
  // @ts-expect-error
  withPartialObject.data.users.nodes[0].address.bogus as string;

  const byId = await mmGQL.query({
    user: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
      }),
      target: {
        id: 'some-user-id',
      },
    }),
  });

  byId.data.user.id as string;
  // @ts-expect-error
  byId.data.user.bogus as string;

  const byIdWithNullResult = await mmGQL.query({
    user: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
      }),
      target: {
        id: 'some-user-id',
        allowNullResult: true,
      },
    }),
  });

  // @ts-expect-error no null check
  byIdWithNullResult.data.user.id as string;
  // @ts-expect-error
  byIdWithNullResult.data.user?.bogus as string;
  byIdWithNullResult.data.user?.id as string;

  const byIds = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
      }),
      target: {
        ids: ['some-user-id'],
      },
    }),
  });

  byIds.data.users.nodes[0].id as string;
  // @ts-expect-error
  byIds.data.users.nodes[0].bogus as string;

  const withMapFnFromObjectOmitted = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        address: userData.address,
      }),
    }),
  });

  withMapFnFromObjectOmitted.data.users.nodes[0].address.state as string;
  withMapFnFromObjectOmitted.data.users.nodes[0].address.nestedInAddress
    .nestedNestedInAddress as boolean;

  const withRelationalMapFnReturningAllData = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        todos: userData.todos({
          map: undefined,
        }),
      }),
    }),
  });

  const todos =
    withRelationalMapFnReturningAllData.data.users.nodes[0].todos.nodes;
  todos[0].id as string;
  todos[0].task as string;

  const mockNode = mmGQL.def({
    type: 'test',
    properties: {
      t: string,
    },
  });

  // This mock node is all inferred, without the use of explicit types
  const withExplicitTypesOmitted = await mmGQL.query({
    mock: queryDefinition({
      def: mockNode,
      map: ({ t }) => ({ t }),
    }),
  });

  withExplicitTypesOmitted.data.mock.nodes[0].t as string;
  // @ts-expect-error
  withExplicitTypesOmitted.data.mock.nodes[0].foo as string;

  const mockNodeWiuthExplicitTypes = mmGQL.defTyped<
    INode<{
      TNodeType: 'test';
      TNodeData: { t: typeof string };
      TNodeComputedData: {
        a: string;
        b: string;
      };
      TNodeRelationalData: {};
    }>
  >({
    type: 'test',
    properties: {
      t: string,
    },
    computed: {
      a: ({ t }) => t,
      // test that computed properties can use other computed properties
      b: ({ a }) => a,
    },
  });

  // This mock node is all inferred, without the use of explicit types
  const withWithExplicitTypes = await mmGQL.query({
    mock: queryDefinition({
      def: mockNodeWiuthExplicitTypes,
      map: ({ t }) => ({ t }),
    }),
  });

  withWithExplicitTypes.data.mock.nodes[0].t as string;
  // @ts-expect-error
  withWithExplicitTypes.data.mock.nodes[0].foo as string;

  const withRelationalUnion = await mmGQL.query({
    todos: queryDefinition({
      def: todoNode,
      map: todoData => ({
        assigneeNullable: todoData.assigneeUnionNullable({
          orgUser: {
            map: ({ id, lastName, address, todos }) => ({
              id,
              lastName,
              address,
              todos: todos({ map: undefined }),
            }),
          },
          meetingGuest: {
            map: ({ id, firstName }) => ({ id, firstName }),
          },
        }),
        assigneeNonNullable: todoData.assigneeUnionNonNullable({
          orgUser: {
            map: ({ id, lastName, address }) => ({
              id,
              lastName,
              address,
            }),
          },
          meetingGuest: {
            map: ({ id, firstName }) => ({ id, firstName }),
          },
        }),
      }),
    }),
  });

  const assigneeNullable =
    withRelationalUnion.data.todos.nodes[0].assigneeNullable;
  if (assigneeNullable && assigneeNullable.type === 'user') {
    assigneeNullable.id;
    // to ensure the depth param in ExtractQueriedDataFromOneToOneQuery does not mess with depths greater than 1
    assigneeNullable.todos.nodes[0].assigneeId;
    // @ts-expect-error no first name being queried for org user
    assigneeNullable.firstName;
    assigneeNullable.address as { state: string };
  } else if (assigneeNullable) {
    assigneeNullable.id;
    assigneeNullable.firstName as string;
    // @ts-expect-error no address for meeting guest being queried
    assigneeNullable.address;
  }

  // @ts-expect-error no null check
  withRelationalUnion.data.todos.nodes[0].assigneeNullable.id;
  // @ts-expect-error no type check/type guard
  withRelationalUnion.data.todos.nodes[0].assigneeNullable?.firstName;
  // common properties don't need type guards
  withRelationalUnion.data.todos.nodes[0].assigneeNullable?.id as string;
  withRelationalUnion.data.todos.nodes[0].assigneeNullable?.type as
    | 'meeting-guest'
    | 'user';

  // no need for a null check if the reference does not return a maybe type
  withRelationalUnion.data.todos.nodes[0].assigneeNonNullable.id;

  const withReferenceArray = await mmGQL.query({
    meeting: queryDefinition({
      def: meetingNode,
      map: meetingData => ({
        attendees: meetingData.attendees({
          map: ({ firstName, lastName }) => ({ firstName, lastName }),
        }),
      }),
      target: { id: 'mock-id' },
    }),
  });

  // @ts-expect-error attendees is an array
  withReferenceArray.data.meeting.attendees.nodes.firstName;
  withReferenceArray.data.meeting.attendees.nodes[0].firstName;
  // @ts-expect-error not a valid prop on each attendee
  withReferenceArray.data.meeting.attendees.nodes[0].bogus;

  // Validates that "GetResultingDataFromQueryDefinition" works
  // For this type inference to work, it's important that the return of the map function is inferred by TS completely
  // This means that we can not use
  // const userMapFn: MapFnForNode<UserNode> = ({firstName}) =>({firstName})
  // because the return type of a MapFnForNode is assumed as a random partial of the data on a node
  // by only typing the arguments of the map function, TS then infers the return from the actual function instead of assuming a random partial
  const userMapFn = ({ firstName }: GetMapFnArgs<UserNode>) => ({ firstName });
  type UserQueryDefinition = QueryDefinition<{
    TNode: UserNode;
    TMapFn: typeof userMapFn;
    TQueryDefinitionTarget: any;
    TIncludeTotalCount: false;
  }>;
  type UserData = GetResultingDataFromQueryDefinition<UserQueryDefinition>;
  const validUserData: UserData = {
    id: 'xyz',
    version: 1,
    lastUpdatedBy: 'xyz',
    type: 'user',
    firstName: 'UserFirstName',
    fullName: 'Full name',
    avatar: 'avatar.jpg',
  };
  validUserData;
  // @ts-expect-error missing firstName
  const invalidUserDataMissingQueriedData: UserData = {
    type: 'user',
    fullName: 'Full name',
    avatar: 'avatar.jpg',
  };
  invalidUserDataMissingQueriedData;
  // @ts-expect-error missing fullName
  const invalidUserDataMissingComputedProperty: UserData = {
    type: 'user',
    firstName: 'UserFirstName',
    avatar: 'avatar.jpg',
  };
  invalidUserDataMissingComputedProperty;

  const useSubscriptionsData = useSubscription({
    usersNotSuspended: queryDefinition({
      def: userNode,
      map: undefined,
      useSubOpts: {
        doNotSuspend: true,
      },
    }),
    users: queryDefinition({
      def: userNode,
      map: undefined,
    }),
  });

  useSubscriptionsData.data.users.nodes[0].avatar;
  // @ts-expect-error when not suspended, results may be null
  useSubscriptionsData.data.usersNotSuspended[0].avatar;
  // good with null check
  useSubscriptionsData.data.usersNotSuspended
    ? useSubscriptionsData.data.usersNotSuspended.nodes[0].avatar
    : null;

  // @ts-expect-error basic sanity check
  useSubscriptionsData.data.users[0].bogus;

  // verify error when an invalid prop is passed
  useSubscription({
    // @ts-expect-error
    badProp: 'test',
  });

  mmGQL.query({
    // @ts-expect-error
    badProp: 'test',
  });

  const queryThing = false;
  const withNull = useSubscription({
    results: queryThing
      ? queryDefinition({ def: userNode, map: undefined })
      : null,
  });

  // @ts-expect-error no null check
  withNull.data.results[0].address;
  withNull.data.results
    ? (withNull.data.results.nodes[0].address.state as string)
    : null;

  // ENUM TESTS
  const node = mmGQL.def({
    type: 'test',
    properties: {
      someEnum: stringEnum(['t', 't2']),
      someOptionalEnum: stringEnum.optional(['t', 't2']),
    },
  });

  const enumData = useSubscription({
    nodes: node,
  });

  const validEnumEntryRecord = { t: '', t2: '' };

  validEnumEntryRecord[enumData.data.nodes.nodes[0].someEnum];
  // @ts-expect-error returns a maybe type, needs null check first
  validEnumEntryRecord[enumData.data.nodes[0].someOptionalEnum];
  if (enumData.data.nodes.nodes[0].someOptionalEnum) {
    validEnumEntryRecord[enumData.data.nodes.nodes[0].someOptionalEnum];
  }

  // DEFAULT PROP TESTS
  const node2 = mmGQL.def({
    type: 'test',
    properties: {},
  });

  // shorthand syntax should query all expected properties
  const { data: resultDataShortHandSyntax } = await mmGQL.query({
    node2s: node2,
  });

  resultDataShortHandSyntax.node2s.nodes[0].id as string;
  resultDataShortHandSyntax.node2s.nodes[0].version as number;
  resultDataShortHandSyntax.node2s.nodes[0].type as 'test';
  resultDataShortHandSyntax.node2s.nodes[0].lastUpdatedBy as string;
  resultDataShortHandSyntax.node2s.nodes[0].dateCreated as number;
  resultDataShortHandSyntax.node2s.nodes[0].dateLastModified as number;
  resultDataShortHandSyntax.node2s.nodes[0]
    .lastUpdatedClientTimestamp as number;

  const { data: resultDataUndefinedMapFn } = await mmGQL.query({
    node2s: queryDefinition({
      def: node2,
      map: undefined,
    }),
  });

  resultDataUndefinedMapFn.node2s.nodes[0].id as string;
  resultDataUndefinedMapFn.node2s.nodes[0].version as number;
  resultDataUndefinedMapFn.node2s.nodes[0].type as 'test';
  resultDataUndefinedMapFn.node2s.nodes[0].lastUpdatedBy as string;
  resultDataUndefinedMapFn.node2s.nodes[0].dateCreated as number;
  resultDataUndefinedMapFn.node2s.nodes[0].dateLastModified as number;
  resultDataUndefinedMapFn.node2s.nodes[0].lastUpdatedClientTimestamp as number;

  const { data: resultDataTotalCount } = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      pagination: {
        includeTotalCount: true,
      },
      map: ({ todos }) => ({
        todos: todos({
          map: ({ task }) => ({ task }),
          pagination: {
            includeTotalCount: true,
          },
        }),
      }),
    }),
  });

  resultDataTotalCount.users.totalCount as number;
  resultDataTotalCount.users.nodes[0].todos.totalCount as number;

  const { data: resultDataNoTotalCount } = await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: ({ todos }) => ({
        todos: todos({
          map: ({ task }) => ({ task }),
          pagination: {
            itemsPerPage: 5,
          },
        }),
      }),
      pagination: {
        itemsPerPage: 5,
      },
    }),
  });

  // @ts-expect-error no total count queried for this top level query
  resultDataNoTotalCount.users.totalCount as number;
  // @ts-expect-error no total count queried for this relational query
  resultDataNoTotalCount.users.nodes[0].todos.totalCount as number;

  const { data: resultDataTargetAndMapFn } = await mmGQL.query({
    node2: queryDefinition({
      def: node2,
      map: ({ lastUpdatedClientTimestamp, dateCreated, dateLastModified }) => ({
        lastUpdatedClientTimestamp,
        dateCreated,
        dateLastModified,
      }),
      target: { id: 'string' },
    }),
  });

  resultDataTargetAndMapFn.node2.id as string;
  resultDataTargetAndMapFn.node2.version as number;
  resultDataTargetAndMapFn.node2.type as 'test';
  resultDataTargetAndMapFn.node2.lastUpdatedBy as string;
  resultDataTargetAndMapFn.node2.dateCreated as number;
  resultDataTargetAndMapFn.node2.dateLastModified as number;
  resultDataTargetAndMapFn.node2.lastUpdatedClientTimestamp as number;

  const { data: resultDataTargetUndefinedMapFn } = await mmGQL.query({
    node2: queryDefinition({
      def: node2,
      map: undefined,
      target: { id: 'string' },
    }),
  });

  resultDataTargetUndefinedMapFn.node2.id as string;
  resultDataTargetUndefinedMapFn.node2.version as number;
  resultDataTargetUndefinedMapFn.node2.type as 'test';
  resultDataTargetUndefinedMapFn.node2.lastUpdatedBy as string;
  resultDataTargetUndefinedMapFn.node2.dateCreated as number;
  resultDataTargetUndefinedMapFn.node2.dateLastModified as number;
  resultDataTargetUndefinedMapFn.node2.lastUpdatedClientTimestamp as number;

  // heavily nested query
  queryDefinition({
    def: userNode,
    map: ({ todos }) => ({
      todos: todos({
        map: ({ task, assignee }) => ({
          task,
          assignee: assignee({
            map: ({ todos }) => ({
              todos: todos({
                map: ({ assignee, assignees }) => ({
                  assignee: assignee({
                    // @ts-expect-error bogus is not a property on the user type
                    map: ({ firstName, bogus }) => ({
                      firstName,
                      bogus,
                    }),
                  }),
                  assignees: assignees({
                    map: ({ firstName, todos }) => ({
                      firstName,
                      todos: todos({
                        // @ts-expect-error bogus is not a property on the todo type
                        map: ({ task, bogus }) => ({ task, bogus }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  });

  // Tests for this bug https://winterinternational.atlassian.net/browse/TTD-1317
  const mockNode2Props = {
    id: string,
    name: string,
  };

  type MockNode2 = INode<{
    TNodeType: 'mock';
    TNodeData: typeof mockNode2Props;
    // Record<string,never> as computed and relational
    TNodeComputedData: Record<string, never>;
    TNodeRelationalData: Record<string, never>;
  }>;

  const mockNode2: MockNode2 = mmGQL.def({
    type: 'mock',
    properties: mockNode2Props,
    relational: {},
    computed: {},
  });

  queryDefinition({
    def: mockNode2,
    // @ts-expect-error bogus is not a property on the mock type
    map: ({ name, bogus }) => ({
      name,
      bogus,
    }),
  });

  const {
    data: { mockNode2: mockNode2Results },
  } = useSubscription({
    mockNode2: queryDefinition({
      def: mockNode2,
      map: ({ name }) => ({
        name,
      }),
    }),
  });

  // @ts-expect-error t is not a property on the mock type
  mockNode2Results.nodes[0].t;

  // testing bad properties on root queries and relational queries
  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        todosForThisUser: userData.todos({
          map: ({ task, assignee }) => ({
            task,
            assignee: assignee({
              map: ({ firstName }) => ({ firstName }),
              // @ts-expect-error "filter" is invalid here, this is a one to one relationship
              filter: {
                firstName: 'bob',
              },
            }),
          }),
          // @ts-expect-error "filters" is invalid, "filter" is correct
          filters: {
            task: 'get it done',
          },
        }),
      }),
      // @ts-expect-error "filters" is invalid, "filter" is correct
      filters: {},
    }),
  });

  await mmGQL.query({
    users: queryDefinition({
      def: userNode,
      // @ts-expect-error "bogus" is assigned a bad value
      map: userData => ({
        id: userData.id,
        bogus: '',
      }),
    }),
  });

  // nonPaginatedOneToMany tests
  const result = await mmGQL.query({
    todos: queryDefinition({
      def: todoNode,

      map: ({ assignees_nonPaginated }) => ({
        assignees: assignees_nonPaginated({
          map: ({ firstName, lastName }) => ({
            firstName,
            lastName,
          }),
        }),
      }),
    }),
  });

  result.data.todos.nodes[0].assignees as Array<any>;
  result.data.todos.nodes[0].assignees[0].firstName as string;
  result.data.todos.nodes[0].assignees[0].lastName as string;
  result.data.todos.nodes[0].assignees[0].fullName as string;
  // @ts-expect-error address was not queried
  result.data.todos.nodes[0].assignees[0].address as any;
})();
