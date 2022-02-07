import { getDefaultConfig, queryDefinition, SMJS, string, children } from './';

/**
 * This function exists for the sole purpose of having TS check it to ensure our type inferrence system is working as intended
 */
export async function TStests() {
  const smJS = new SMJS(getDefaultConfig());
  const userProperties = {
    id: string,
    firstName: string,
  };
  const todoNode = smJS.def({
    type: 'todo',
    properties: {
      id: string,
      task: string,
    },
  });
  const userNode = smJS.def({
    type: 'user',
    properties: userProperties,
    relational: {
      todos: () => children({ def: todoNode }),
    },
  });

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
      }),
    }),
  });

  targetOmmissionResults.data.users[0].id as string;
  // @ts-expect-error invalid type
  targetOmmissionResults.data.users[0].id as number;
  // @ts-expect-error not queried
  targetOmmissionResults.data.users[0].notqueried as number;

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
        todos: userData.todos({
          map: todoData => ({ id: todoData.id }),
        }),
      }),
    }),
  });

  withRelationalResults.data.users[0].todos[0].id;
}
