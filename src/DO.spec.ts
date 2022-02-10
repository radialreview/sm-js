import { SMJS } from '.';
import * as smData from './smDataTypes';
import {
  TodoNode,
  generateTodoNode,
  generateDOInstance,
  getMockConfig,
} from './specUtilities';
import { IChildrenQueryBuilder, ISMData } from './types';

describe('smData.DO', () => {
  test('that DO class will automatically parse and validate data it receives when constructed based on the expected data structure', () => {
    const { doInstance } = generateDOInstance({
      properties: {
        id: smData.string,
        dueDate: smData.number,
        settings: smData.object({
          show: smData.boolean(true),
          color: smData.string,
        }),
        items: smData.array(smData.number),
      },
      initialData: {
        id: '123',
        version: '1',
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
        id: smData.string,
        dueDate: smData.number,
      },
      initialData: {
        id: '321',
        version: '1',
        dueDate: ('100' as unknown) as number,
      },
    });

    expect(doInstance.id).toBe('321');
    expect(doInstance.dueDate).toBe(100);
  });

  test('data in nested object is coerced correctly', () => {
    const { doInstance } = generateDOInstance({
      properties: {
        settings: smData.object({
          schedule: smData.object({
            startTime: smData.number,
            endTime: smData.number,
          }),
        }),
      },
      initialData: {
        id: '321',
        version: '1',
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
      id: smData.string,
      task: smData.string,
      // including this meeting prop and not marking it as up to date to check that we only need the absolute minimum set of data
      // available and up to date to calculate computed properties
      meetingId: smData.string,
    };

    const { doInstance } = generateDOInstance<
      typeof properties,
      { dropdownOpt: { value: string; display: string } },
      {},
      {}
    >({
      properties,
      initialData: {
        id: 'test-id',
        version: '1',
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
      task: smData.string,
    };

    const { doInstance } = generateDOInstance<
      typeof properties,
      { taskWithTest: string; taskWithTestAndTest2: string },
      {},
      {}
    >({
      properties,
      initialData: {
        id: '321',
        version: '1',
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
    const smJSInstance = new SMJS(getMockConfig());
    const { doInstance } = generateDOInstance<
      {},
      {},
      { todos: IChildrenQueryBuilder<TodoNode> },
      {}
    >({
      properties: {},
      initialData: {
        id: '321',
        version: '1',
      },
      relational: {
        todos: () => smData.children({ def: generateTodoNode(smJSInstance) }),
      },
    });

    expect(doInstance.todos).toBeInstanceOf(Function);
    const queryFn = ({ id }: { id: ISMData<string> }) => ({ id });
    expect(doInstance.todos({ map: queryFn })).toEqual(
      expect.objectContaining({
        map: queryFn,
        _smRelational: smData.SM_RELATIONAL_TYPES.children,
      })
    );
  });

  test('maybe types are parsed correctly', () => {
    const properties = {
      maybeStr: smData.string.optional,
      maybeBool: smData.boolean.optional,
      maybeNum: smData.number.optional,
      maybeObj: smData.object.optional({
        nested: smData.boolean.optional,
        doubleNested: smData.object.optional({
          doubleNestedNested: smData.boolean.optional,
        }),
      }),
      maybeArr: smData.array(smData.number.optional).optional,
    };

    const { doInstance } = generateDOInstance<typeof properties, {}, {}, {}>({
      properties,
      initialData: {
        version: '1',
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
      rootLevelRecord: smData.record(smData.string),
      object: smData.object({
        nestedRecord: smData.record(smData.string),
        nestedObject: smData.object({
          doubleNestedRecord: smData.record(smData.string),
        }),
      }),
    };

    const { doInstance } = generateDOInstance<typeof properties, {}, {}, {}>({
      properties,
      initialData: {
        id: '321',
        version: '1',
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
        object: smData.object({
          nested: smData.object({
            nestedNumber: smData.number,
          }),
          someNumber: smData.number,
        }),
      },
      initialData: {
        id: '123',
        version: '1',
        object: { nested: { nestedNumber: '1' } },
      },
    });

    doInstance.onDataReceived({
      version: '2',
      object: { someNumber: 3 },
    });

    expect(doInstance.object.nested.nestedNumber).toBe(1);
  });
});
