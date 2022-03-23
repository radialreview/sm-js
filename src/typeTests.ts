/* eslint @typescript-eslint/no-unused-vars: 0, @typescript-eslint/no-unused-expressions: 0 */
import {
  getDefaultConfig,
  queryDefinition,
  SMJS,
  string,
  number,
  children,
} from './';
import { array, boolean, object, record, reference } from './smDataTypes';
import {
  ExtractQueriedDataFromMapFn,
  GetResultingDataTypeFromNodeDefinition,
  GetResultingDataTypeFromProperties,
  ValidReferenceIdPropFromNode,
  IByReferenceQueryBuilder,
  IChildrenQueryBuilder,
  ISMNode,
  MapFnForNode,
  Maybe,
  SMDataEnum,
  ValidFilterForNode,
} from './types';

/**
 * This file should only contain TS tests
 */
const smJS = new SMJS(getDefaultConfig());
const todoProperties = {
  id: string,
  task: string,
  dueDate: number,
  assigneeId: string,
  meetingId: string.optional,
};
const todoRelational = {
  assignee: () =>
    reference<TodoNode, UserNode>({
      def: userNode,
      idProp: 'assigneeId',
    }),
  meeting: () =>
    reference<TodoNode, Maybe<MeetingNode>>({
      def: meetingNode,
      idProp: 'meetingId',
    }),
  assigneeUnionNullable: () =>
    reference<
      TodoNode,
      Maybe<{ meetingGuest: MeetingGuestNode; orgUser: UserNode }>
    >({
      def: { meetingGuest: meetingGuestNode, orgUser: userNode },
      idProp: 'meetingId',
    }),
  assigneeUnionNonNullable: () =>
    reference<TodoNode, { meetingGuest: MeetingGuestNode; orgUser: UserNode }>({
      def: { meetingGuest: meetingGuestNode, orgUser: userNode },
      idProp: 'meetingId',
    }),
};

const meetingProperties = {
  name: string,
};

type MeetingNode = ISMNode<'meeting', typeof meetingProperties>;

type TodoNode = ISMNode<
  'todo',
  typeof todoProperties,
  {},
  {
    assignee: IByReferenceQueryBuilder<TodoNode, UserNode>;
    meeting: IByReferenceQueryBuilder<TodoNode, Maybe<MeetingNode>>;
    assigneeUnionNullable: IByReferenceQueryBuilder<
      TodoNode,
      Maybe<{ meetingGuest: MeetingGuestNode; orgUser: UserNode }>
    >;
    assigneeUnionNonNullable: IByReferenceQueryBuilder<
      TodoNode,
      { meetingGuest: MeetingGuestNode; orgUser: UserNode }
    >;
  }
>;

const todoNode: TodoNode = smJS.def({
  type: 'todo',
  properties: todoProperties,
  relational: todoRelational,
});

const meetingNode = smJS.def({
  type: 'meeting',
  properties: {
    name: string,
  },
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
  bool: boolean(true),
  maybeBool: boolean.optional,
  maybeStr: string.optional,
  address: object({
    state: string,
    nestedInAddress: object({
      nestedNestedInAddress: boolean(true),
    }),
  }),
  fooBarEnum: string('FOO' as 'FOO' | 'BAR'),
  optionalBarBazEnum: string.optional as SMDataEnum<Maybe<'BAR' | 'BAZ'>>,
  recordEnum: record(string('FOO' as 'FOO' | 'BAR')),
  objectUnion: object(objectUnion),
  arrayOfString: array(string),
};
const userRelational = {
  todos: () => children({ def: todoNode }) as IChildrenQueryBuilder<TodoNode>,
  state: () =>
    reference({
      def: stateNode,
      idProp: 'address.state',
    }) as IByReferenceQueryBuilder<UserNode, StateNode>,
  invalid: () =>
    reference({
      def: stateNode,
      // @ts-expect-error not a valid id prop in user node
      idProp: 'address.statesz',
    }) as IByReferenceQueryBuilder<UserNode, StateNode>,
};

type UserNode = ISMNode<
  'user',
  typeof userProperties,
  { fullName: string; avatar: string },
  {
    todos: IChildrenQueryBuilder<TodoNode>;
    state: IByReferenceQueryBuilder<UserNode, StateNode>;
    invalid: IByReferenceQueryBuilder<UserNode, StateNode>;
  }
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

const meetingGuestProperties = {
  id: string,
  firstName: string,
};
type MeetingGuestNode = ISMNode<'meeting-guest', typeof meetingGuestProperties>;
const meetingGuestNode: MeetingGuestNode = smJS.def({
  type: 'meeting-guest' as 'meeting-guest',
  properties: meetingGuestProperties,
});

const stateNodeProperties = {
  name: string,
};
type StateNode = ISMNode<'state', typeof stateNodeProperties>;
const stateNode: StateNode = smJS.def({
  type: 'state',
  properties: stateNodeProperties,
});
(async function MapFnTests() {
  // @ts-ignore
  const mapFn: MapFnForNode<UserNode> = ({
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
    objectUnion: {
      type: 'string',
      string: '',
    },
    arrayOfString: [],
  };

  const invalidPropAtRoot: UserNodeData = {
    ...validUserNodeData,
    // @ts-expect-error
    someFakeProp: '',
  };
  invalidPropAtRoot;

  const invalidNestedProp: UserNodeData = {
    ...validUserNodeData,
    address: {
      ...validUserNodeData.address,
      // @ts-expect-error
      badProp: '',
    },
  };
  invalidNestedProp;

  // @ts-expect-error array props are not valid id reference props
  const idProp1: ValidReferenceIdPropFromNode<UserNode> = 'arrayOfString';
  // @ts-expect-error objects are not valid id reference props
  const idProp2: ValidReferenceIdPropFromNode<UserNode> = 'address';

  const idProp3: ValidReferenceIdPropFromNode<UserNode> = 'address.state';
  idProp3;
  const idProp4: ValidReferenceIdPropFromNode<UserNode> =
    'address.nestedInAddress.nestedNestedInAddress';
  idProp4;
  const idProp5: ValidReferenceIdPropFromNode<UserNode> = 'firstName';
  idProp5;

  const filter1: ValidFilterForNode<UserNode> = {
    firstName: 'some first name',
  };
  filter1;
  const filter2: ValidFilterForNode<UserNode> = {
    address: { state: 'some state' },
  };
  filter2;
  const filter3: ValidFilterForNode<UserNode> = {
    // @ts-expect-error can't search enums
    recordEnum: { FOO: 'BAR' },
  };
  filter3;
  const filter4: ValidFilterForNode<UserNode> = {
    // @ts-expect-error can't search arrays
    arrayOfString: ['test'],
  };
  filter4;
  const filter5: ValidFilterForNode<UserNode> = {
    bool: true,
  };
  filter5;
  const filter6: ValidFilterForNode<UserNode> = {
    maybeBool: null,
  };
  filter6;
  const filter7: ValidFilterForNode<UserNode> = {
    maybeStr: null,
  };
  filter7;
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
  await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({ id: userData.id }),
      filter: {
        firstName: 'Meida',
        // @ts-expect-error not a property in the user node
        bogus: '',
      },
    }),
  });

  // can't use the result of the query above, since it's invalid and breaks type checking
  const validTargetWithFilters = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({ id: userData.id }),
      filter: {
        firstName: 'Meida',
      },
    }),
  });

  validTargetWithFilters.data.users[0].id as string;
  // @ts-expect-error invalid type
  validTargetWithFilters.data.users[0].id as number;
  // @ts-expect-error not queried
  validTargetWithFilters.data.users[0].notqueried as number;

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

  withRelationalResults.data.users[0].id as string;
  // @ts-expect-error not queried
  withRelationalResults.data.users[0].firstName as string;
  withRelationalResults.data.users[0].todos[0].id as string;
  withRelationalResults.data.users[0].todos[0].dueDate as number;
  // @ts-expect-error not queried
  withRelationalResults.data.users[0].todos[0].task as string;

  withRelationalResults.data.users[0].todos[0].assignee.firstName as string;

  // @ts-expect-error meeting should be nullable
  withRelationalResults.data.users[0].todos[0].meeting.name as string;

  withRelationalResults.data.users[0].todos[0].meeting?.name as string;

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

  const withMapFnFromObjectOmitted = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        address: userData.address,
      }),
    }),
  });

  withMapFnFromObjectOmitted.data.users[0].address.state as string;

  const withRelationalMapFnReturningAllData = await smJS.query({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        todos: userData.todos({
          map: allTodoData => allTodoData,
        }),
      }),
    }),
  });

  withRelationalMapFnReturningAllData.data.users[0].todos[0].id as string;
  // @ts-expect-error relational properties are not queried when all data is passed through in a map fn
  withRelationalMapFnReturningAllData.data.users[0].todos[0].assignee.id;

  const mockNode = smJS.def({
    type: 'test',
    properties: {
      t: string,
    },
  });

  // This mock node is all inferred, without the use of explicit types
  const withExplicitTypesOmitted = await smJS.query({
    mock: queryDefinition({
      def: mockNode,
      map: ({ t }) => ({ t }),
    }),
  });

  withExplicitTypesOmitted.data.mock[0].t as string;
  // @ts-expect-error
  withExplicitTypesOmitted.data.mock[0].foo as string;

  const withRelationalUnion = await smJS.query({
    users: queryDefinition({
      def: todoNode,
      map: todoData => ({
        assigneeNullable: todoData.assigneeUnionNullable({
          orgUser: {
            map: ({ id, lastName, address }) => ({ id, lastName, address }),
          },
          meetingGuest: {
            map: ({ id, firstName }) => ({ id, firstName }),
          },
        }),
        assigneeNonNullable: todoData.assigneeUnionNonNullable({
          orgUser: {
            map: ({ id, lastName, address }) => ({ id, lastName, address }),
          },
          meetingGuest: {
            map: ({ id, firstName }) => ({ id, firstName }),
          },
        }),
      }),
    }),
  });

  const assigneeNullable = withRelationalUnion.data.users[0].assigneeNullable;
  if (assigneeNullable && assigneeNullable.type === 'user') {
    assigneeNullable.id;
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
  withRelationalUnion.data.users[0].assigneeNullable.id;
  // @ts-expect-error no type check/type guard
  withRelationalUnion.data.users[0].assigneeNullable?.firstName;
  // common properties don't need type guards
  withRelationalUnion.data.users[0].assigneeNullable?.id as string;
  withRelationalUnion.data.users[0].assigneeNullable?.type as
    | 'meeting-guest'
    | 'user';

  // no need for a null check if the reference does not return a maybe type
  withRelationalUnion.data.users[0].assigneeNonNullable.id;
})();

(async function ResultingDevExperienceWriteTests() {
  const nodeProperties = {
    name: string,
    settings: object({
      flagEnabled: boolean(false),
    }),
  };
  type NodeType = ISMNode<'some-type', typeof nodeProperties>;

  smJS.transaction(ctx => {
    ctx.createNode<NodeType>({
      data: {
        type: 'some-type',
        name: 'some name',
        // @ts-expect-error not in nodeProperties
        badProp: '',
      },
    });

    ctx.createNode<NodeType>({
      data: {
        type: 'some-type',
        name: 'some name',
        settings: {
          // @ts-expect-error invalid type, should be boolean
          flagEnabled: null,
        },
      },
    });

    ctx.updateNode<NodeType>({
      data: {
        id: 'some-id',
        name: 'some-name',
        // @ts-expect-error not in nodeProperties
        badProp: '',
      },
    });

    ctx.updateNode<NodeType>({
      data: {
        type: 'some-type',
        name: 'some name',
        settings: {
          // @ts-expect-error invalid type, should be boolean
          flagEnabled: null,
        },
      },
    });
  });
})();
