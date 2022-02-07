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
  MapFn,
  MapFnForNode,
} from './types';

/**
 * This function exists for the sole purpose of having TS check it to ensure our type inferrence system is working as intended
 */
export async function TStests() {
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

  // @ts-expect-error invalid type, the test below does not catch if "id" is never (meaning TS assumes "never as string" is fine)
  targetOmmissionResults.data.users[0].id as never;
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

  const user = withRelationalResults.data.users[0];
  withRelationalResults.data.users[0].id as string;
  // @ts-expect-error not queried
  withRelationalResults.data.users[0].firstName as string;
  withRelationalResults.data.users[0].todos[0].id as string;
  withRelationalResults.data.users[0].todos[0].dueDate as number;
  // @ts-expect-error not queried
  withRelationalResults.data.users[0].todos[0].task as string;

  const mapFn: MapFnForNode<typeof userNode> = ({ id, todos }) => ({
    id,
    // @ts-expect-error
    bleh: '',
    todos: todos({
      map: todoData => ({ id: todoData.id, task: todoData.task }),
    }),
  });

  const returnedData: ExtractQueriedDataFromMapFn<
    typeof mapFn,
    typeof userNode
  > = {
    id: '',
    shouldError: '',
  };
}
