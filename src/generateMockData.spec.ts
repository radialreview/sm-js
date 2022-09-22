import { createMockQueryDefinitions, getMockConfig } from './specUtilities';
import { queryDefinition, MMGQL } from '.';
import { DEFAULT_TOKEN_NAME } from './consts';
import {
  boolean,
  number,
  object,
  oneToMany,
  oneToOne,
  record,
  string,
  stringEnum,
} from './dataTypes';
import {
  EPaginationFilteringSortingInstance,
  GetResultingDataTypeFromProperties,
} from './types';

test('setupTest correctly returns mmGQLInstance.generateMockData as true', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  expect(mmGQLInstance.generateMockData).toEqual(true);
});

test('it correctly generates a single mock node when an id target is specified', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const mockNode = mmGQLInstance.def({
    type: 'mock',
    properties: {},
  });

  const { data } = await mmGQLInstance.query({
    mock: queryDefinition({
      def: mockNode,
      map: undefined,
      target: { id: 'some-id' },
    }),
  });

  expect(Array.isArray(data.mock)).toBeFalsy();
  expect(typeof data.mock.id === 'string').toBeTruthy();
});

test('it correctly generates multiple mock nodes when no id target is specified', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const mockNode = mmGQLInstance.def({
    type: 'mock',
    properties: {
      stringProp: string,
    },
  });

  const { data } = await mmGQLInstance.query({
    mock: queryDefinition({
      def: mockNode,
      map: undefined,
    }),
  });

  expect(Array.isArray(data.mock.nodes)).toBeTruthy();
  data.mock.nodes.forEach(test => {
    expect(typeof test.id === 'string').toBeTruthy();
  });
});

test('it correctly generates mock data for non optional properties on nodes', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const mockNode = mmGQLInstance.def({
    type: 'mock',
    properties: {
      stringProp: string,
      stringEnumProp: stringEnum(['foo', 'bar']),
      numberProp: number,
      booleanProp: boolean(false),
      recordProp: record(string),
      objectProp: object({
        nestedString: string,
        nestedNumber: number,
        nestedBoolean: boolean(false),
        nestedObject: object({
          doubleNestedString: string,
        }),
      }),
      recordOfNumberProp: record(number),
      recordOfObjectProp: record(
        object({
          nestedProp: string,
        })
      ),
    },
  });

  const { data } = await mmGQLInstance.query({
    mock: queryDefinition({
      def: mockNode,
      map: undefined,
    }),
  });

  data.mock.nodes.forEach(mockNode => {
    expect(typeof mockNode.stringProp === 'string').toBeTruthy();
    expect(typeof mockNode.stringEnumProp === 'string').toBeTruthy();
    expect(
      mockNode.stringEnumProp === 'foo' || mockNode.stringEnumProp === 'bar'
    ).toBeTruthy();
    expect(typeof mockNode.numberProp === 'number').toBeTruthy();
    expect(typeof mockNode.booleanProp === 'boolean').toBeTruthy();
    expect(typeof mockNode.recordProp === 'object').toBeTruthy();
    Object.entries(mockNode.recordProp).forEach(([key, value]) => {
      expect(typeof key === 'string').toBeTruthy();
      expect(typeof value === 'string').toBeTruthy();
    });
    expect(typeof mockNode.objectProp === 'object').toBeTruthy();
    expect(typeof mockNode.objectProp.nestedString === 'string').toBeTruthy();
    expect(typeof mockNode.objectProp.nestedNumber === 'number').toBeTruthy();
    expect(typeof mockNode.objectProp.nestedBoolean === 'boolean').toBeTruthy();
    expect(typeof mockNode.objectProp.nestedObject === 'object').toBeTruthy();
    expect(
      typeof mockNode.objectProp.nestedObject.doubleNestedString === 'string'
    ).toBeTruthy();
    expect(typeof mockNode.recordOfNumberProp === 'object').toBeTruthy();
    Object.entries(mockNode.recordOfNumberProp).forEach(([key, value]) => {
      expect(typeof key === 'string').toBeTruthy();
      expect(typeof value === 'number').toBeTruthy();
    });
    expect(typeof mockNode.recordOfObjectProp === 'object').toBeTruthy();
    Object.entries(mockNode.recordOfObjectProp).forEach(([key, value]) => {
      expect(typeof key === 'string').toBeTruthy();
      expect(typeof value === 'object').toBeTruthy();
      expect(typeof value.nestedProp === 'string').toBeTruthy();
    });
  });
});

test('it correctly generates mock data for optional properties on nodes', async done => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const mockNodeProperties = {
    stringProp: string.optional,
    stringEnumProp: stringEnum.optional(['foo', 'bar']),
    numberProp: number.optional,
    booleanProp: boolean.optional,
    recordProp: record.optional(string.optional),
    objectProp: object.optional({
      nestedString: string.optional,
      nestedNumber: number.optional,
      nestedBoolean: boolean.optional,
      nestedObject: object.optional({
        doubleNestedString: string.optional,
      }),
    }),
    recordOfNumberProp: record.optional(number.optional),
    recordOfObjectProp: record.optional(
      object.optional({
        nestedProp: string.optional,
      })
    ),
  };

  const mockNodeDef = mmGQLInstance.def({
    type: 'mock',
    properties: mockNodeProperties,
  });

  async function generateMockNode() {
    return (
      await mmGQLInstance.query({
        mockNodes: queryDefinition({
          def: mockNodeDef,
          map: undefined,
          target: { id: 'some-id' },
        }),
      })
    ).data.mockNodes;
  }

  /**
   * Creating tests for this was a bit tricky, since I wanted to verify that optional properties
   * will randomly return null or a valid value
   * The approach I took was to create 2 functions:
   * one returns all the tests for when the data is filled, or not null
   * another one returns the tests for when the data is null
   *
   * Both return arrays of functions, so that the execution of the `expect` functions can be delayed until the number of total tests is known
   */
  function generateDataFilledTestsForMockNode(
    mockNode: GetResultingDataTypeFromProperties<typeof mockNodeProperties>
  ): Array<Function> {
    return [
      () => expect(typeof mockNode.stringProp === 'string').toBeTruthy(),
      () => expect(typeof mockNode.stringEnumProp === 'string').toBeTruthy(),
      () =>
        expect(
          mockNode.stringEnumProp === 'foo' || mockNode.stringEnumProp === 'bar'
        ).toBeTruthy(),
      () => expect(typeof mockNode.numberProp === 'number').toBeTruthy(),
      () => expect(typeof mockNode.booleanProp === 'boolean').toBeTruthy(),
      () => expect(typeof mockNode.recordProp === 'object').toBeTruthy(),
      () =>
        Object.entries(mockNode.recordProp as Record<string, string>).forEach(
          ([key, value]) => {
            expect(typeof key === 'string').toBeTruthy();
            expect(typeof value === 'string').toBeTruthy();
          }
        ),
      () => expect(typeof mockNode.objectProp === 'object').toBeTruthy(),
      () =>
        expect(
          typeof mockNode.objectProp?.nestedString === 'string'
        ).toBeTruthy(),
      () =>
        expect(
          typeof mockNode.objectProp?.nestedNumber === 'number'
        ).toBeTruthy(),
      () =>
        expect(
          typeof mockNode.objectProp?.nestedBoolean === 'boolean'
        ).toBeTruthy(),
      () =>
        expect(
          typeof mockNode.objectProp?.nestedObject === 'object'
        ).toBeTruthy(),
      () =>
        expect(
          typeof mockNode.objectProp?.nestedObject?.doubleNestedString ===
            'string'
        ).toBeTruthy(),
      () =>
        expect(typeof mockNode.recordOfNumberProp === 'object').toBeTruthy(),
      () =>
        Object.entries(
          mockNode.recordOfNumberProp as Record<string, number>
        ).forEach(([key, value]) => {
          expect(typeof key === 'string').toBeTruthy();
          expect(typeof value === 'number').toBeTruthy();
        }),
      () =>
        expect(typeof mockNode.recordOfObjectProp === 'object').toBeTruthy(),
      () =>
        Object.entries(
          mockNode.recordOfObjectProp as Record<string, { nestedProp: string }>
        ).forEach(([key, value]) => {
          expect(typeof key === 'string').toBeTruthy();
          expect(typeof value === 'object').toBeTruthy();
          expect(typeof value.nestedProp === 'string').toBeTruthy();
        }),
    ];
  }

  function generateDataNullTestsForMockNode(
    mockNode: GetResultingDataTypeFromProperties<typeof mockNodeProperties>
  ): Array<Function> {
    return [
      () => expect(mockNode.stringProp === null).toBeTruthy(),
      () => expect(mockNode.stringEnumProp === null).toBeTruthy(),
      () => expect(mockNode.stringEnumProp === null).toBeTruthy(),
      () => expect(mockNode.numberProp === null).toBeTruthy(),
      () => expect(mockNode.booleanProp === null).toBeTruthy(),
      () => expect(mockNode.recordProp === null).toBeTruthy(),
      () => expect(mockNode.recordProp === null).toBeTruthy(),
      () => expect(mockNode.objectProp === null).toBeTruthy(),
      () => expect(mockNode.objectProp?.nestedString === null).toBeTruthy(),
      () => expect(mockNode.objectProp?.nestedNumber === null).toBeTruthy(),
      () => expect(mockNode.objectProp?.nestedBoolean === null).toBeTruthy(),
      () => expect(mockNode.objectProp?.nestedObject === null).toBeTruthy(),
      () =>
        expect(
          mockNode.objectProp?.nestedObject?.doubleNestedString === null
        ).toBeTruthy(),
      () => expect(mockNode.recordOfNumberProp === null).toBeTruthy(),
      () => expect(mockNode.recordOfNumberProp === null).toBeTruthy(),
      () => expect(mockNode.recordOfObjectProp === null).toBeTruthy(),
    ];
  }

  /**
   * The rest of the code in this test is responsible for running each of the expectations from the functions above
   * while capturing exceptions (when the data is null and is being expected to not be null or vice versa)
   * WITHOUT repeating all the expectations that had already been validated, since for ALL properties on the node to pass ALL the expectations
   * would be extremely unlikely and would require a very high number of iterations
   *
   * It also ensures that if after the max number of iterations set by maxIterations not all tests have passed
   * the test fails with the last exception thrown by an expectation
   */
  let iterations = 0;
  const maxIterations = 200;
  let currentDataFilledTestIndex = 0;
  let currentDataNullTestIndex = 0;

  let mockNode = await generateMockNode();
  let lastException;
  let allTestsPassed = false;

  do {
    try {
      const dataFilledTests = generateDataFilledTestsForMockNode(mockNode);
      for (
        currentDataFilledTestIndex;
        currentDataFilledTestIndex < dataFilledTests.length - 1;
        currentDataFilledTestIndex++
      ) {
        dataFilledTests[currentDataFilledTestIndex]();
      }

      const dataNullTests = generateDataNullTestsForMockNode(mockNode);
      for (
        currentDataNullTestIndex;
        currentDataNullTestIndex < dataNullTests.length - 1;
        currentDataNullTestIndex++
      ) {
        dataNullTests[currentDataNullTestIndex]();
      }

      // double check that we did indeed run through each of the tests
      if (
        currentDataFilledTestIndex === dataFilledTests.length - 1 &&
        currentDataNullTestIndex === dataNullTests.length - 1
      ) {
        done();
        allTestsPassed = true;
      }
    } catch (e) {
      mockNode = await generateMockNode();
      lastException = e;
      iterations++;
    }
  } while (iterations < maxIterations && !allTestsPassed);

  if (!allTestsPassed) {
    throw lastException;
  }
});

/**
 * Specific mocked values tests
 */
test('it correctly generates mock data when a gen mock data fn is added to the node definition', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const nodeWithSpecificMockData = mmGQLInstance.def({
    type: 'mockNodeType',
    properties: {
      testString: string,
      testNumber: number,
      testObject: object({
        nestedNumber: number,
        nestedNonSpecifiedNumber: number,
      }),
    },
    generateMockData: () => {
      return {
        testString: 'some string',
        testNumber: 1,
        testObject: {
          nestedNumber: 2,
        },
      };
    },
  });

  const { data } = await mmGQLInstance.query({
    mockNodes: queryDefinition({
      def: nodeWithSpecificMockData,
      map: ({ testString, testNumber, testObject }) => ({
        testString,
        testNumber,
        testObject: testObject({
          map: testObjectData => ({
            nestedNumber: testObjectData.nestedNumber,
            nestedNonSpecifiedNumber: testObjectData.nestedNonSpecifiedNumber,
          }),
        }),
      }),
    }),
  });

  data.mockNodes.nodes.forEach(node => {
    expect(node.testString).toBe('some string');
    expect(node.testNumber).toBe(1);
    expect(node.testObject.nestedNumber).toBe(2);
    expect(typeof node.testObject.nestedNonSpecifiedNumber).toBe('number');
  });
});

/**
 * Relational tests
 */
test('it correctly generates mock data for oneToOne relational queries', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const childNode = mmGQLInstance.def({
    type: 'child',
    properties: {
      testProp: string,
    },
  });
  const parentNode = mmGQLInstance.def({
    type: 'parent',
    properties: {},
    relational: {
      child: () => oneToOne(childNode),
    },
  });

  const { data } = await mmGQLInstance.query({
    parent: queryDefinition({
      def: parentNode,
      map: ({ child }) => ({
        child: child({
          map: ({ testProp }) => ({ testProp }),
        }),
      }),
      target: { id: 'some-id' },
    }),
  });

  expect(typeof data.parent.child.testProp === 'string').toBeTruthy();
});

test('it correctly generates mock data for oneToMany relational queries', async () => {
  const { mmGQLInstance } = setupTest({
    generateMockData: true,
  });

  const childNode = mmGQLInstance.def({
    type: 'child',
    properties: {
      testProp: string,
    },
  });
  const parentNode = mmGQLInstance.def({
    type: 'parent',
    properties: {},
    relational: {
      children: () => oneToMany(childNode),
    },
  });

  const { data } = await mmGQLInstance.query({
    parent: queryDefinition({
      def: parentNode,
      map: ({ children }) => ({
        children: children({
          map: ({ testProp }) => ({ testProp }),
        }),
      }),
      target: { id: 'some-id' },
    }),
  });

  expect(Array.isArray(data.parent.children.nodes)).toBeTruthy();
  data.parent.children.nodes.forEach(child => {
    expect(typeof child.testProp === 'string').toBeTruthy();
  });
});

function setupTest(opts?: { generateMockData: boolean }) {
  const mmGQLInstance = new MMGQL(
    opts?.generateMockData
      ? getMockConfig({
          generateMockData: opts.generateMockData,
          paginationFilteringSortingInstance:
            EPaginationFilteringSortingInstance.CLIENT,
        })
      : getMockConfig()
  );

  mmGQLInstance.setToken({
    tokenName: DEFAULT_TOKEN_NAME,
    token: 'mock token',
  });
  const queryDefinitions = createMockQueryDefinitions(mmGQLInstance);

  return { mmGQLInstance, queryDefinitions, createMockQueryDefinitions };
}
