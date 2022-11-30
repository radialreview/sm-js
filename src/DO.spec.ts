import { MMGQL } from '.';
import * as data from './dataTypes';
import {
  TodoNode,
  generateTodoNode,
  generateDOInstance,
  getMockConfig,
} from './specUtilities';
import { IOneToManyQueryBuilder, IData, RELATIONAL_TYPES } from './types';

describe('data.DO', () => {
  test('that DO class will automatically parse and validate data it receives when constructed based on the expected data structure', () => {
    const { doInstance } = generateDOInstance({
      properties: {
        dueDate: data.number,
        settings: data.object({
          show: data.boolean(true),
          color: data.string,
        }),
        items: data.array(data.number),
      },
      initialData: {
        id: '123',
        version: 1,
        dueDate: ('295791241' as unknown) as number, // this is wrong but expected
        settings: {
          show: ('true' as unknown) as boolean,
        },
      },
    });

    expect(doInstance.id).toBe('123');
    expect(doInstance.dueDate).toBe(295791241);
    expect(doInstance.settings.show).toBe(true);
  });

  test('that DO class will automatically coerce data it receives on an update based on the expected data structure', () => {
    const { doInstance } = generateDOInstance({
      properties: {
        dueDate: data.number,
      },
      initialData: {
        id: '321',
        version: 1,
        dueDate: ('100' as unknown) as number,
      },
    });

    expect(doInstance.id).toBe('321');
    expect(doInstance.dueDate).toBe(100);
  });

  test('data in nested object is coerced correctly', () => {
    const { doInstance } = generateDOInstance({
      properties: {
        settings: data.object({
          schedule: data.object({
            startTime: data.number,
            endTime: data.number,
          }),
        }),
      },
      initialData: {
        id: '321',
        version: 1,
        settings: {
          schedule: {
            startTime: ('321' as unknown) as number,
          },
        },
      },
    });

    expect(doInstance.settings.schedule.startTime).toBe(321);
  });

  test('basic computed props return the expected value', () => {
    const properties = {
      task: data.string,
      // including this meeting prop and not marking it as up to date to check that we only need the absolute minimum set of data
      // available and up to date to calculate computed properties
      meetingId: data.string,
    };

    const { doInstance } = generateDOInstance<
      'mock-type',
      typeof properties,
      { dropdownOpt: { value: string; display: string } },
      {}
    >({
      properties,
      initialData: {
        id: 'test-id',
        version: 1,
        task: 'get it done',
      },
      computed: {
        dropdownOpt: data => ({
          value: data.id,
          display: data.task,
        }),
      },
    });

    expect(doInstance.dropdownOpt).toEqual({
      value: 'test-id',
      display: 'get it done',
    });
  });

  test('computed properties can use other computed properties', () => {
    const properties = {
      task: data.string,
    };

    const { doInstance } = generateDOInstance<
      'mock-type',
      typeof properties,
      { taskWithTest: string; taskWithTestAndTest2: string },
      {}
    >({
      properties,
      initialData: {
        id: '321',
        version: 1,
        task: 'get it done',
      },
      computed: {
        taskWithTest: data => {
          return data.task + ' test';
        },
        taskWithTestAndTest2: data => {
          return data.taskWithTest + ' test2';
        },
      },
    });

    expect(doInstance.taskWithTestAndTest2).toEqual('get it done test test2');
  });

  test('relational properties are available on the DO', () => {
    const mmGQLInstance = new MMGQL(getMockConfig());
    const { doInstance } = generateDOInstance<
      'mock-type',
      {},
      {},
      { todos: IOneToManyQueryBuilder<TodoNode> }
    >({
      properties: {},
      initialData: {
        id: '321',
        version: 1,
      },
      relational: {
        todos: () => data.oneToMany(generateTodoNode(mmGQLInstance)),
      },
    });

    expect(doInstance.todos).toBeInstanceOf(Function);
    const queryFn = ({ id }: { id: IData }) => ({ id });
    expect(doInstance.todos({ map: queryFn })).toEqual(
      expect.objectContaining({
        queryBuilderOpts: expect.objectContaining({
          map: queryFn,
        }),
        _relational: RELATIONAL_TYPES.oneToMany,
      })
    );
  });

  test('maybe types are parsed correctly', () => {
    const properties = {
      maybeStr: data.string.optional,
      maybeBool: data.boolean.optional,
      maybeNum: data.number.optional,
      maybeObj: data.object.optional({
        nested: data.boolean.optional,
        doubleNested: data.object.optional({
          doubleNestedNested: data.boolean.optional,
        }),
      }),
      maybeArr: data.array(data.number.optional).optional,
    };

    const { doInstance } = generateDOInstance<
      'mock-type',
      typeof properties,
      {},
      {}
    >({
      properties,
      initialData: {
        version: 1,
        id: '321',
        maybeStr: null,
        maybeBool: null,
        maybeNum: null,
        maybeObj: null,
        maybeArr: null,
      },
    });

    expect(doInstance.maybeStr).toBe(null);
    expect(doInstance.maybeBool).toBe(null);
    expect(doInstance.maybeNum).toBe(null);
    expect(doInstance.maybeObj).toEqual(null);
    expect(doInstance.maybeArr).toBe(null);

    doInstance.onDataReceived({
      version: '2',
      maybeObj: {
        nested: ('true' as unknown) as boolean,
        doubleNested: null,
      },
      maybeArr: [('1' as unknown) as number],
    });

    expect(doInstance.maybeObj).toEqual({ nested: true, doubleNested: null });
    expect(doInstance.maybeArr).toEqual([1]);
  });

  // tests fix for https://tractiontools.atlassian.net/browse/MIO-326
  test('an update for a record will delete properties not included in the new record', () => {
    const properties = {
      rootLevelRecord: data.record(data.string),
      object: data.object({
        nestedRecord: data.record(data.string),
        nestedObject: data.object({
          doubleNestedRecord: data.record(data.string),
        }),
      }),
    };

    const { doInstance } = generateDOInstance<
      'mock-type',
      typeof properties,
      {},
      {}
    >({
      properties,
      initialData: {
        id: '321',
        version: 1,
        rootLevelRecord: {
          foo: 'foo',
        },
        object: {
          nestedRecord: {
            nestedFoo: 'nestedFoo',
          },
          nestedObject: {
            doubleNestedRecord: {
              doubleNestedFoo: 'doubleNestedFoo',
            },
          },
        },
      },
    });

    doInstance.onDataReceived({
      version: '2',
      rootLevelRecord: {
        baz: 'baz',
      },
      object: {
        nestedRecord: {
          nestedBaz: 'nestedBaz',
        },
        nestedObject: {
          doubleNestedRecord: {
            doubleNestedBaz: 'doubleNestedBaz',
          },
        },
      },
    });

    expect(doInstance.rootLevelRecord.foo).toBe(undefined);
    expect(doInstance.object.nestedRecord.nestedFoo).toBe(undefined);
    expect(
      doInstance.object.nestedObject.doubleNestedRecord.doubleNesteFoo
    ).toBe(undefined);

    expect(doInstance.rootLevelRecord.baz).toBe('baz');
    expect(doInstance.object.nestedRecord.nestedBaz).toBe('nestedBaz');
    expect(
      doInstance.object.nestedObject.doubleNestedRecord.doubleNestedBaz
    ).toBe('doubleNestedBaz');
  });

  test('does not delete properties within objects that are not included within an update', () => {
    const { doInstance } = generateDOInstance({
      properties: {
        object: data.object({
          nested: data.object({
            nestedNumber: data.number,
          }),
          someNumber: data.number,
        }),
      },
      initialData: {
        id: '123',
        version: 1,
        object: { nested: { nestedNumber: '1' } },
      },
    });

    doInstance.onDataReceived({
      version: '2',
      object: { someNumber: 3 },
    });

    expect(doInstance.object.nested.nestedNumber).toBe(1);
  });

  test('records with objects are parsed correctly', () => {
    const properties = {
      rootLevelRecord: data.record(
        data.object({
          testString: data.string,
          testOptionalNumber: data.number.optional,
        })
      ),
    };

    const { doInstance } = generateDOInstance<
      'mock-type',
      typeof properties,
      {},
      {}
    >({
      properties,
      initialData: {
        id: '321',
        version: 1,
        rootLevelRecord: {
          foo: {
            testString: 'test string value',
            testOptionalNumber: null,
          },
        },
      },
    });

    expect(doInstance.rootLevelRecord).toEqual({
      foo: {
        testString: 'test string value',
        testOptionalNumber: null,
      },
    });
  });
});
