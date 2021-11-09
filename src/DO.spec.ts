import { autorun } from 'mobx'

import { DIResolver } from '@mm/core/di/resolver'

import * as smData from './smDataTypes'
import { TodoNode, getTodoNode, generateDOInstance } from './specUtilities'

const diResolver = new DIResolver()

describe('smData.DO', () => {
  test('that DO class will automatically parse and validate data it receives when constructed based on the expected data structure', () => {
    const doInstance = generateDOInstance({
      properties: {
        id: smData.string,
        dueDate: smData.number,
        settings: smData.object({
          show: smData.boolean,
          color: smData.string,
        }),
        items: smData.array(smData.number),
      },
      initialData: {
        id: '123',
        dueDate: ('295791241' as unknown) as number, // this is wrong but expected
        settings: {
          show: ('true' as unknown) as boolean,
        },
      },
    })

    expect(doInstance.id).toBe('123')
    expect(doInstance.dueDate).toBe(295791241)
    expect(doInstance.settings.show).toBe(true)
  })

  test('that DO class will automatically coerce data it receives on an update based on the expected data structure', () => {
    const doInstance = generateDOInstance({
      properties: {
        id: smData.string,
        dueDate: smData.number,
      },
    })

    doInstance.onDataReceived({
      id: '321',
      dueDate: ('100' as unknown) as number,
    })

    expect(doInstance.id).toBe('321')
    expect(doInstance.dueDate).toBe(100)
  })

  test('data in nested object is coerced correctly', () => {
    const doInstance = generateDOInstance({
      properties: {
        settings: smData.object({
          schedule: smData.object({
            startTime: smData.number,
            endTime: smData.number,
          }),
        }),
      },
    })

    doInstance.onDataReceived({
      settings: {
        schedule: {
          startTime: ('321' as unknown) as number,
        },
      },
    })

    expect(doInstance.settings.schedule.startTime).toBe(321)
  })

  test('data in a DO instance is observable', (done) => {
    const doInstance = generateDOInstance({
      properties: {
        task: smData.string,
        nested: smData.object({
          nestedData: smData.string,
        }),
      },
      initialData: {
        task: 'mock task',
        nested: {
          nestedData: 'mock nested data',
        },
      },
    })

    autorun((r) => {
      if (
        doInstance.task === 'updated task' &&
        doInstance.nested.nestedData === 'updated nested data'
      ) {
        done()
        r.dispose()
      }
    })

    doInstance.onDataReceived({
      task: 'updated task',
      nested: { nestedData: 'updated nested data' },
    })
  })

  test('basic computed props return the expected value', () => {
    const properties = {
      id: smData.string,
      task: smData.string,
      // including this meeting prop and not marking it as up to date to check that we only need the absolute minimum set of data
      // available and up to date to calculate computed properties
      meetingId: smData.string,
    }

    const doInstance = generateDOInstance<
      typeof properties,
      { dropdownOpt: { value: string; display: string } },
      {},
      {}
    >({
      properties,
      initialData: {
        id: 'test-id',
        task: 'get it done',
      },
      computed: {
        dropdownOpt: (data) => ({
          value: data.id,
          display: data.task,
        }),
      },
    })

    expect(doInstance.dropdownOpt).toEqual({
      value: 'test-id',
      display: 'get it done',
    })
  })

  test('computed properties can use other computed properties', () => {
    const properties = {
      task: smData.string,
    }

    const doInstance = generateDOInstance<
      typeof properties,
      { taskWithTest: string; taskWithTestAndTest2: string },
      {},
      {}
    >({
      properties,
      initialData: {
        task: 'get it done',
      },
      computed: {
        taskWithTest: (data) => {
          return data.task + ' test'
        },
        taskWithTestAndTest2: (data) => {
          return data.taskWithTest + ' test2'
        },
      },
    })

    expect(doInstance.taskWithTestAndTest2).toEqual('get it done test test2')
  })

  test('computed properties do not recalculate unless the data they use has changed, when consumed within a reactive context', (done) => {
    const properties = {
      task: smData.string,
    }

    const computedDataGetter = jest.fn((nodeData: { task: string }) => {
      return nodeData.task + ' is done!'
    })

    const doInstance = generateDOInstance<
      typeof properties,
      { doneText: string },
      {},
      {}
    >({
      properties,
      initialData: {
        task: 'get it done',
      },
      computed: {
        doneText: computedDataGetter,
      },
    })

    // this only works within a reactive context
    // making it work outside a reactive context would entail using computed values with keepAlive: true
    // which leads to memory leaks
    autorun(() => {
      expect(doInstance.doneText).toEqual('get it done is done!')
      expect(computedDataGetter).toHaveBeenCalledTimes(1)
      expect(doInstance.doneText).toEqual('get it done is done!')
      expect(computedDataGetter).toHaveBeenCalledTimes(1)
      done()
    })
  })

  test('relational properties are available on the DO', () => {
    const doInstance = generateDOInstance<
      {},
      {},
      { todos: IChildrenQueryBuilder<TodoNode> },
      {}
    >({
      properties: {},
      relational: {
        todos: () => smData.children({ node: getTodoNode(diResolver) }),
      },
    })

    expect(doInstance.todos).toBeInstanceOf(Function)
    const queryFn = ({ id }: { id: ISMData<string> }) => ({ id })
    expect(doInstance.todos({ query: queryFn })).toEqual(
      expect.objectContaining({
        query: queryFn,
        _smRelational: smData.SM_RELATIONAL_TYPES.children,
      })
    )
  })

  test('maybe types are parsed correctly', () => {
    const properties = {
      maybeStr: smData.maybeString,
      maybeBool: smData.maybeBoolean,
      maybeNum: smData.maybeNumber,
      maybeObj: smData.maybeObject({
        nested: smData.maybeBoolean,
        doubleNested: smData.maybeObject({
          doubleNestedNested: smData.maybeBoolean,
        }),
      }),
      maybeArr: smData.maybeArray(smData.maybeNumber),
    }

    const doInstance = generateDOInstance<typeof properties, {}, {}, {}>({
      properties,
      initialData: {
        maybeStr: null,
        maybeBool: null,
        maybeNum: null,
        maybeObj: null,
        maybeArr: null,
      },
    })

    expect(doInstance.maybeStr).toBe(null)
    expect(doInstance.maybeBool).toBe(null)
    expect(doInstance.maybeNum).toBe(null)
    expect(doInstance.maybeObj).toEqual(null)
    expect(doInstance.maybeArr).toBe(null)

    doInstance.onDataReceived({
      maybeObj: {
        nested: ('true' as unknown) as boolean,
        doubleNested: null,
      },
      maybeArr: [('1' as unknown) as number],
    })

    expect(doInstance.maybeObj).toEqual({ nested: true, doubleNested: null })
    expect(doInstance.maybeArr).toEqual([1])
  })

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
    }

    const doInstance = generateDOInstance<typeof properties, {}, {}, {}>({
      properties,
      initialData: {
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
    })

    doInstance.onDataReceived({
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
    })

    expect(doInstance.rootLevelRecord.foo).toBe(undefined)
    expect(doInstance.object.nestedRecord.nestedFoo).toBe(undefined)
    expect(
      doInstance.object.nestedObject.doubleNestedRecord.doubleNesteFoo
    ).toBe(undefined)

    expect(doInstance.rootLevelRecord.baz).toBe('baz')
    expect(doInstance.object.nestedRecord.nestedBaz).toBe('nestedBaz')
    expect(
      doInstance.object.nestedObject.doubleNestedRecord.doubleNestedBaz
    ).toBe('doubleNestedBaz')
  })
})
