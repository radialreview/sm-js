import {
  createMockQueryDefinitions,
  getMockConfig,
  generateUserNode,
  generateTodoNode,
  generateTestNode,
  mockedDataGenerationExpectedResultsForTestNodeAllProperties,
  mockedDataGenerationExpectedResultsWithMapAndRelationalPropertiesDefined,
  mockedDataGenerationExpectedResultsForUserNodeAllProperties,
  mockDataGenerationExpectedResultsForTodoNodeAllProperties,
} from './specUtilities';
import { queryDefinition, MMGQL } from '.';
import { DEFAULT_TOKEN_NAME } from './consts';

test('setupTest correctly returns mmGQLInstance.generateMockData as true', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  expect(mmGQLInstance.generateMockData).toEqual(true);
});

test('sm.query with mock data generates the correct results for qDs with mapped and relational properties', async () => {
  const { mmGQLInstance, queryDefinitions } = setupTest({
    generateMockData: true,
  });

  const { data } = await mmGQLInstance.query(queryDefinitions);

  data.users.forEach(userItem => {
    // this is testing that all string and number types are truthy
    expect(userItem.address.state).toBeTruthy();
    expect(userItem.address.apt.floor).toBeTruthy();
    expect(userItem.address.apt.number).toBeTruthy();
    expect(userItem.id).toBeTruthy();
    expect(userItem.type).toBeTruthy();

    userItem.todos.forEach(todo => {
      expect(todo.assignee.firstName).toBeTruthy();
      expect(todo.assignee.id).toBeTruthy();
      expect(todo.assignee.type).toBeTruthy();
      expect(todo.id).toBeTruthy();
      expect(todo.type).toBeTruthy();
    });
  });

  expect(data).toMatchObject(
    mockedDataGenerationExpectedResultsWithMapAndRelationalPropertiesDefined
  );
});

test('sm.query with mock data generates all node properties when the qD is just the node definition', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const userNode = generateUserNode(mmGQLInstance);
  const queryDefinitions = {
    users: userNode,
  };

  const { data } = await mmGQLInstance.query(queryDefinitions);

  // this is testing that all string and number types are truthy
  data.users.forEach(userItem => {
    expect(userItem.firstName).toBeTruthy();
    expect(userItem.lastName).toBeTruthy();
    expect(userItem.address.streetName).toBeTruthy();
    expect(userItem.address.zipCode).toBeTruthy();
    expect(userItem.address.state).toBeTruthy();
    expect(userItem.address.apt.floor).toBeTruthy();
    expect(userItem.address.apt.number).toBeTruthy();
  });

  expect(data).toEqual({
    users: expect.arrayContaining([
      expect.objectContaining(
        mockedDataGenerationExpectedResultsForUserNodeAllProperties
      ),
    ]),
  });
});

test('sm.query with mock data generates all node properties when the qD has an undefined map', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    user: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: undefined,
      target: { id: '1' },
    }),
  };

  const { data } = await mmGQLInstance.query(queryDefinitions);

  // this is testing that all string and number types are truthy
  expect(data.user.firstName).toBeTruthy();
  expect(data.user.lastName).toBeTruthy();
  expect(data.user.address.streetName).toBeTruthy();
  expect(data.user.address.zipCode).toBeTruthy();
  expect(data.user.address.state).toBeTruthy();
  expect(data.user.address.apt.floor).toBeTruthy();
  expect(data.user.address.apt.number).toBeTruthy();

  expect(data).toEqual({
    user: expect.objectContaining(
      mockedDataGenerationExpectedResultsForUserNodeAllProperties
    ),
  });
});

test('sm.query with mock data generates node properites for multiple queryDefinitions', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    user: queryDefinition({
      def: generateUserNode(mmGQLInstance),
      map: undefined,
      target: { id: '1' },
    }),
    todos: generateTodoNode(mmGQLInstance),
  };

  const { data } = await mmGQLInstance.query(queryDefinitions);

  data.todos.forEach(todoItem => {
    // this is testing that all string and number types are truthy, and records contain correct types
    expect(todoItem.id).toBeTruthy();
    expect(todoItem.task).toBeTruthy();
    expect(todoItem.meetingId).toBeTruthy();
    expect(todoItem.assigneeId).toBeTruthy();
    expect(todoItem.settings?.nestedSettings?.nestedNestedMaybe).toBeTruthy();

    // this is testing that a string is added to the record as the value
    expect(Object.values(todoItem.record)[0]).toEqual(expect.any(String));

    // this is testing that a boolean is added to the nestedRecord as the value
    expect(Object.values(todoItem.settings?.nestedRecord || [])[0]).toEqual(
      expect.any(Boolean)
    );
  });

  expect(data).toEqual({
    user: expect.objectContaining(
      mockedDataGenerationExpectedResultsForUserNodeAllProperties
    ),
    todos: expect.arrayContaining([
      expect.objectContaining(
        mockDataGenerationExpectedResultsForTodoNodeAllProperties
      ),
    ]),
  });
});

test('sm.query with mock data generates node properites for all smData types with default values', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    test: queryDefinition({
      def: generateTestNode(mmGQLInstance),
      map: undefined,
      target: { id: '1' },
    }),
  };

  const { data } = await mmGQLInstance.query(queryDefinitions);

  // this is testing that the record keys are truthy
  Object.keys({
    ...data.test.objectData.recordInObject,
    ...data.test.recordData,
    ...data.test.optionalRecord,
  }).forEach(key => {
    expect(key).toBeTruthy();
  });

  // this is testing that the default string is added to a record as the value
  expect(Object.values(data.test.recordData)[0]).toEqual(
    'iAmADefaultStringInARecord'
  );

  // this is testing that the array of numbers is added to a record as the value
  expect(Object.values(data.test.optionalRecord || [])[0]).toContainEqual(
    expect.any(Number)
  );

  // this is testing that all string and number types are truthy
  expect(data.test.id).toBeTruthy();
  expect(data.test.lastUpdatedBy).toBeTruthy();
  expect(data.test.stringData).toBeTruthy();
  expect(data.test.optionalString).toBeTruthy();
  expect(data.test.objectData.stringInObject).toBeTruthy();
  expect(data.test.numberData).toBeTruthy();
  expect(data.test.optionalNumber).toBeTruthy();
  expect(data.test.defaultNumber).toBeTruthy();

  expect(data).toMatchObject(
    mockedDataGenerationExpectedResultsForTestNodeAllProperties
  );
});

test('sm.query with mock data generates multiple results when ids are passed to target', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    tests: queryDefinition({
      def: generateTestNode(mmGQLInstance),
      map: undefined,
      target: { ids: ['1', '2', '3', '4'] },
    }),
  };

  const { data } = await mmGQLInstance.query(queryDefinitions);

  expect(data.tests.length).toBeGreaterThan(1);

  data.tests.forEach(testItem => {
    // this is testing that the record keys are truthy

    Object.keys({
      ...testItem.objectData.recordInObject,
      ...testItem.recordData,
      ...testItem.optionalRecord,
    }).forEach(item => {
      expect(item).toBeTruthy();
    });

    // this is testing that the default string is added to a record as the value
    expect(Object.values(testItem.recordData)[0]).toEqual(
      'iAmADefaultStringInARecord'
    );

    // this is testing that the array of numbers is added to a record as the value
    expect(Object.values(testItem.optionalRecord || [])[0]).toContainEqual(
      expect.any(Number)
    );

    // this is testing that all string and number types are truthy
    expect(testItem.id).toBeTruthy();
    expect(testItem.lastUpdatedBy).toBeTruthy();
    expect(testItem.stringData).toBeTruthy();
    expect(testItem.optionalString).toBeTruthy();
    expect(testItem.objectData.stringInObject).toBeTruthy();
    expect(testItem.numberData).toBeTruthy();
    expect(testItem.optionalNumber).toBeTruthy();
    expect(testItem.defaultNumber).toBeTruthy();
  });

  expect(data).toEqual({
    tests: expect.arrayContaining([
      expect.objectContaining(
        mockedDataGenerationExpectedResultsForTestNodeAllProperties.test
      ),
    ]),
  });
});

function setupTest(opts?: { generateMockData: boolean }) {
  const mmGQLInstance = new MMGQL(
    opts?.generateMockData
      ? getMockConfig({ generateMockData: opts.generateMockData })
      : getMockConfig()
  );

  mmGQLInstance.setToken({
    tokenName: DEFAULT_TOKEN_NAME,
    token: 'mock token',
  });
  const queryDefinitions = createMockQueryDefinitions(mmGQLInstance);

  return { mmGQLInstance, queryDefinitions, createMockQueryDefinitions };
}
