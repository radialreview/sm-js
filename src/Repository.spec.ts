import { DOFactory } from './DO';
import * as smData from './smDataTypes';
import { SMNotCachedException } from './exceptions';
import { UserNode, generateUserNode } from './specUtilities';
import { RepositoryFactory } from './Repository';

function generateRepositoryInstance<
  TNodeData extends Record<string, any>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
  transformData?: (
    receivedData: DeepPartial<GetExpectedNodeDataType<TNodeData>>
  ) => {
    extendIfQueried?: DeepPartial<GetExpectedNodeDataType<TNodeData>>;
    overwriteIfQueried?: DeepPartial<GetExpectedNodeDataType<TNodeData>>;
  };
}) {
  const def = {
    type: 'mockNodeType',
    properties: opts.properties,
    computed: opts.computed,
    relational: opts.relational,
    transformData: opts.transformData,
  };

  const DOClass = DOFactory(def);

  return RepositoryFactory({
    DOClass,
    def,
  });
}

describe('smData.repository', () => {
  it('exposes a method to cache new data being received for a def', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        task: smData.string,
      },
    });

    repository.onDataReceived({
      id: '123',
      version: '1',
      task: 'test task',
    });
  });

  it('exposes a method to get cached data by id', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        task: smData.string,
      },
    });

    repository.onDataReceived({
      id: '123',
      version: '1',
      task: 'test task',
    });

    const DO = repository.byId('123');

    expect(DO.id).toBe('123');
    expect(DO.task).toBe('test task');
  });

  it('returns the same DO instance when by id is called after an update is received', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        task: smData.string,
      },
    });

    repository.onDataReceived({
      id: '123',
      version: '1',
      task: 'test task',
    });

    const cachedAfterFirstData = repository.byId('123');

    repository.onDataReceived({
      id: '123',
      version: '1',
      task: 'updated test task',
    });

    const cachedAfterSecondData = repository.byId('123');

    expect(cachedAfterFirstData).toBe(cachedAfterSecondData);
    expect(cachedAfterSecondData.task).toEqual('updated test task');
  });

  it('converts data received with _ nested format to a regular object', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        settings: smData.object({
          schedule: smData.object({
            startTime: smData.number,
          }),
        }),
      },
    });

    repository.onDataReceived({
      id: 'mock-id',
      version: '1',
      [`settings${smData.IS_NULL_IDENTIFIER}`]: false,
      settings: null,
      settings_schedule_startTime: '321',
    } as { id: string });

    const DO = repository.byId('mock-id');
    expect(DO.settings.schedule.startTime).toBe(321);
  });

  it('converts data received in old object format to a regular object', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        settings: smData.object({
          schedule: smData.object({
            startTime: smData.number,
          }),
        }),
      },
    });

    repository.onDataReceived({
      id: 'mock-id',
      version: '1',
      settings:
        '__JSON__{\u0022schedule\u0022:{\u0022startTime\u0022:\u0022321\u0022}}',
      settings_schedule_startTime: null, // mimicking what the BE would return from querying this bit of the object
    } as { id: string });

    const DO = repository.byId('mock-id');
    expect(DO.settings.schedule.startTime).toBe(321);
  });

  // When we get back data from a query, we want to call DO.onDataReceived without having to manually parse the data
  // to remove the relational results. This ensures the DO is responsible for that.
  test('data received that is not part of node data or is relational is ignored', () => {
    const repository = generateRepositoryInstance<
      { id: ISMData<string>; task: ISMData<string> },
      {},
      { assignee: IChildrenQueryBuilder<UserNode> },
      {}
    >({
      properties: {
        id: smData.string,
        task: smData.string,
      },
      relational: {
        assignee: () => smData.children({ def: generateUserNode() }),
      },
    });

    expect(() =>
      repository.onDataReceived({
        id: 'mock-id',
        version: '1',
        task: 'my task',
        assignee: 'test', // purposely adding a property which is relational to test that we don't throw "tried to set a property without a setter"
        otherProp: 'test2', // and a property not declared on the node
      } as { id: string })
    ).not.toThrow();

    const DO = repository.byId('mock-id');

    expect(DO.task).toBe('my task');
    expect(DO.assignee).toBeInstanceOf(Function); // test that assignee is still a relational query builder
    // eslint-disable-next-line
    // @ts-ignore
    expect(DO.otherProp).toBe(undefined);
  });

  it('throws an error when byId is called with an id that has not been cached', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        task: smData.string,
      },
    });

    expect(() => repository.byId('123')).toThrow(SMNotCachedException);
  });

  it('exposes a method to delete cached data by id', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        task: smData.string,
      },
    });

    repository.onDataReceived({
      id: '123',
      version: '1',
    });

    const cached = repository.byId('123');

    expect(cached).toBeTruthy();

    repository.onNodeDeleted('123');

    expect(() => repository.byId('123')).toThrow(SMNotCachedException);
  });

  it('extends received data with default data for nullish queried properties', () => {
    const properties = {
      id: smData.string,
      settings: smData.maybeObject({
        foo: smData.string,
        notQueried: smData.string,
        notNull: smData.string,
      }),
    };

    const repository = generateRepositoryInstance({
      properties,
      transformData: () => {
        const defaults: DeepPartial<GetExpectedNodeDataType<
          typeof properties
        >> = {
          settings: {
            foo: 'default foo',
            notQueried: 'default notQueried',
            notNull: 'default notNull',
          },
        };

        return {
          extendIfQueried: defaults,
        };
      },
    });

    repository.onDataReceived({
      id: '123',
      version: '1',
      settings: null as any,
      settings_foo: null, // mimicking what the BE would return from querying this bit of the object
      settings_notNull: 'persisted notNull',
    } as any);

    const cached = repository.byId('123');
    expect(cached.settings?.foo).toBe('default foo');
    expect(cached.settings?.notNull).toBe('persisted notNull');
    // Make sure properties that exists in the transformData are not applied
    // if they are not queried
    expect(cached.settings?.notQueried).toBe(undefined);
  });

  it('should overwrite received data with default data for queried properties', () => {
    const properties = {
      id: smData.string,
      settings: smData.maybeObject({
        foo: smData.string,
        notQueried: smData.string,
      }),
    };

    const repository = generateRepositoryInstance({
      properties,
      transformData: () => {
        const overwriteIfQueried: DeepPartial<GetExpectedNodeDataType<
          typeof properties
        >> = {
          settings: {
            foo: 'overwritten foo',
            notQueried: 'overwritten notQueried',
          },
        };

        return {
          overwriteIfQueried,
        };
      },
    });

    repository.onDataReceived({
      id: '123',
      version: '1',
      settings: null as any,
      settings_foo: 'persisted foo',
    } as any);

    const cached = repository.byId('123');
    expect(cached.settings?.foo).toBe('overwritten foo');
    // Make sure properties that exists in the transformData are not applied
    // if they are not queried
    expect(cached.settings?.notQueried).toBe(undefined);
  });
});
