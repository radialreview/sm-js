import {
  createMockQueryDefinitions,
  getMockConfig,
  generateUserNode,
  generateTodoNode,
  generateTestNode,
  mockedDataGenerationExpectedResultsWithAllSmDataTypes,
  mockedDataGenerationExpectedResultsWithMultipleQds,
  mockedDataGenerationExpectedResultsWithAllProperties,
  mockedDataGenerationExpectedResultsWithMapAndRelationalPropertiesDefined,
  mockedDataGenerationExpectedResultsWithTargetUnderIds,
  mockedDataGenerationExpectedResultsWithTargetIds,
} from './specUtilities';
import { queryDefinition, SMJS } from '.';
import { DEFAULT_TOKEN_NAME } from './consts';

test('setupTest correctly returns smJSInstance.generateMockData as true', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  expect(smJSInstance.generateMockData).toEqual(true);
});

test('sm.query with mock data generates the correct results for qDs with mapped and relational properties', async () => {
  const { smJSInstance, queryDefinitions } = setupTest({
    generateMockData: true,
  });

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toMatchObject(
    mockedDataGenerationExpectedResultsWithMapAndRelationalPropertiesDefined
  );
});

test('sm.query with mock data generates all node properties when the qD is just the node definition', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  const userNode = generateUserNode(smJSInstance);
  const queryDefinitions = {
    user: userNode,
  };

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toEqual(mockedDataGenerationExpectedResultsWithAllProperties);
});

test('sm.query with mock data generates all node properties when the qD has an undefined map', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    user: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: undefined,
    }),
  };

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toEqual(mockedDataGenerationExpectedResultsWithAllProperties);
});

test('sm.query with mock data generates node properites for multiple queryDefinitions', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    user: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: undefined,
    }),
    todo: generateTodoNode(smJSInstance),
  };

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toEqual(mockedDataGenerationExpectedResultsWithMultipleQds);
});

test('sm.query with mock data generates node properites for all smData types with default values', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    test: queryDefinition({
      def: generateTestNode(smJSInstance),
      map: undefined,
    }),
  };

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toMatchObject(
    mockedDataGenerationExpectedResultsWithAllSmDataTypes
  );
});

test('sm.query with mock data generates multiple results when underIds are passed to target', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    users: queryDefinition({
      def: generateUserNode(smJSInstance),
      map: undefined,
      target: { underIds: ['1', '2', '3', '4'] },
    }),
  };

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toEqual(mockedDataGenerationExpectedResultsWithTargetUnderIds);
});

test('sm.query with mock data generates multiple results when ids are passed to target', async () => {
  const { smJSInstance } = setupTest({
    generateMockData: true,
  });

  const queryDefinitions = {
    tests: queryDefinition({
      def: generateTestNode(smJSInstance),
      map: undefined,
      target: { ids: ['1', '2', '3', '4'] },
    }),
  };

  const { data } = await smJSInstance.query(queryDefinitions);

  expect(data).toEqual(mockedDataGenerationExpectedResultsWithTargetIds);
});

function setupTest(opts?: { generateMockData: boolean }) {
  const smJSInstance = new SMJS(
    opts?.generateMockData
      ? getMockConfig({ generateMockData: opts.generateMockData })
      : getMockConfig()
  );

  smJSInstance.setToken({ tokenName: DEFAULT_TOKEN_NAME, token: 'mock token' });
  const queryDefinitions = createMockQueryDefinitions(smJSInstance);

  return { smJSInstance, queryDefinitions, createMockQueryDefinitions };
}
