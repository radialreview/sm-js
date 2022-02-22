import * as smData from './smDataTypes';
import { SMNotCachedException } from './exceptions';
import { UserNode, generateUserNode, getMockConfig } from './specUtilities';
import { RepositoryFactory } from './Repository';
import { getDefaultConfig, SMJS } from '.';
import {
  NodeRelationalQueryBuilderRecord,
  NodeMutationFn,
  NodeComputedFns,
  NodeRelationalFns,
  SMDataDefaultFn,
  IChildrenQueryBuilder,
} from './types';

function generateRepositoryInstance<
  TNodeData extends Record<string, any>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<
    string,
    /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn
  >
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
}) {
  const smJS = new SMJS(getDefaultConfig());
  const def = {
    type: 'mockNodeType',
    properties: opts.properties,
    computed: opts.computed,
    relational: opts.relational,
  };

  const DOClass = smJS.def(def).do;

  return RepositoryFactory({
    DOClass,
    def,
    onDataReceived: ({ applyUpdateToDO }) => {
      applyUpdateToDO();
    },
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
      type: 'mockNodeType',
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
      type: 'mockNodeType',
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
      type: 'mockNodeType',
      version: '1',
      task: 'test task',
    });

    const cachedAfterFirstData = repository.byId('123');

    repository.onDataReceived({
      id: '123',
      type: 'mockNodeType',
      version: '1',
      task: 'updated test task',
    });

    const cachedAfterSecondData = repository.byId('123');

    expect(cachedAfterFirstData).toBe(cachedAfterSecondData);
    expect(cachedAfterSecondData.task).toEqual('updated test task');
  });

  it('converts data received with __dot__ nested format to a regular object', () => {
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
      type: 'mockNodeType',
      version: '1',
      settings: smData.OBJECT_IDENTIFIER,
      settings__dot__schedule: smData.OBJECT_IDENTIFIER,
      settings__dot__schedule__dot__startTime: '321',
    } as { id: string });

    const DO = repository.byId('mock-id');
    expect(DO.settings.schedule.startTime).toBe(321);
  });

  it('converts data received with __JSON__ array format to a regular array', () => {
    const repository = generateRepositoryInstance({
      properties: {
        id: smData.string,
        people: smData.array(smData.string),
      },
    });

    repository.onDataReceived({
      id: 'mock-id',
      type: 'mockNodeType',
      people: `__JSON__["joe", "bob"]`,
    } as { id: string });

    const DO = repository.byId('mock-id');

    expect(DO.people).toEqual(['joe', 'bob']);
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
      type: 'mockNodeType',
      version: '1',
      settings:
        '__JSON__{\u0022schedule\u0022:{\u0022startTime\u0022:\u0022321\u0022}}',
      settings__dot__schedule: null,
      settings__dot__schedule__dot__startTime: null, // mimicking what the BE would return from querying this bit of the object
    } as { id: string });

    const DO = repository.byId('mock-id');
    expect(DO.settings.schedule.startTime).toBe(321);
  });

  // When we get back data from a query, we want to call DO.onDataReceived without having to manually parse the data
  // to remove the relational results. This ensures the DO is responsible for that.
  test('data received that is not part of node data or is relational is ignored', () => {
    const smJS = new SMJS(getMockConfig());
    const repository = generateRepositoryInstance<
      {
        id: SMDataDefaultFn;
        task: SMDataDefaultFn;
      },
      {},
      { assignee: IChildrenQueryBuilder<UserNode> },
      {}
    >({
      properties: {
        id: smData.string,
        task: smData.string,
      },
      relational: {
        assignee: () => smData.relational({ def: generateUserNode(smJS) }),
      },
    });

    expect(() =>
      repository.onDataReceived({
        id: 'mock-id',
        type: 'mockNodeType',
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
      type: 'mockNodeType',
      version: '1',
    });

    const cached = repository.byId('123');

    expect(cached).toBeTruthy();

    repository.onNodeDeleted('123');

    expect(() => repository.byId('123')).toThrow(SMNotCachedException);
  });

  it('handles null nested objects', () => {
    const repository = generateRepositoryInstance({
      properties: {
        object: smData.object({
          nested: smData.object({
            foo: smData.string,
          }),
        }),
        optionalObject: smData.object.optional({
          string: smData.string,
          nestedOptional: smData.object.optional({
            foo: smData.string,
          }),
        }),
      },
    });

    repository.onDataReceived({
      id: '123',
      type: 'mockNodeType',
      version: '1',
      object: null,
      optionalObject: smData.OBJECT_IDENTIFIER,
      optionalObject__dot__string: 'hello',
      optionalObject__dot__nestedOptional: null,
      optionalObject__dot__nestedOptional__dot__foo: null,
    });

    const cached = repository.byId('123');

    expect(cached.object).toEqual({
      nested: { foo: '' },
    });

    expect(cached.optionalObject).toEqual({
      string: 'hello',
      nestedOptional: null,
    });
  });
});
