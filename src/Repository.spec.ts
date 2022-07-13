import * as data from './dataTypes';
import { NotCachedException } from './exceptions';
import { UserNode, generateUserNode, getMockConfig } from './specUtilities';
import { RepositoryFactory } from './Repository';
import { getDefaultConfig, MMGQL } from '.';
import {
  NodeRelationalQueryBuilderRecord,
  NodeMutationFn,
  NodeComputedFns,
  NodeRelationalFns,
  DataDefaultFn,
  IOneToOneQueryBuilder,
} from './types';
import { NULL_TAG } from './dataConversions';

function generateRepositoryInstance<
  TNodeData extends Record<string, any>,
  TNodeComputedData extends Record<string, any>,
  // the tsignore here is necessary
  // because the generic that NodeRelationalQueryBuilderRecord needs is
  // the node definition for the origin of the relational queries
  // which when defining a node, is the node being defined
  // attempting to replicate the node here would always end up in a loop
  // since we need the relational data to construct a node
  // and need the node to construct the relational data (without this ts ignore)
  // @ts-ignore
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<
    string,
    /*NodeMutationFn<TNodeData, any>*/ NodeMutationFn
  >
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  // @ts-ignore
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
}) {
  const mmGQL = new MMGQL(getDefaultConfig());
  const def = {
    type: 'mockNodeType',
    properties: opts.properties,
    computed: opts.computed,
    relational: opts.relational,
  };

  const DOClass = mmGQL.def(def).do;

  return RepositoryFactory({
    DOClass,
    def,
    onDataReceived: ({ applyUpdateToDO }) => {
      applyUpdateToDO();
    },
  });
}

describe('data.repository', () => {
  it('exposes a method to cache new data being received for a def', () => {
    const repository = generateRepositoryInstance({
      properties: {
        task: data.string,
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
        task: data.string,
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
        task: data.string,
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
        settings: data.object({
          schedule: data.object({
            startTime: data.number,
          }),
        }),
      },
    });

    repository.onDataReceived({
      id: 'mock-id',
      type: 'mockNodeType',
      version: '1',
      settings: data.OBJECT_IDENTIFIER,
      settings__dot__schedule: data.OBJECT_IDENTIFIER,
      settings__dot__schedule__dot__startTime: '321',
    } as { id: string });

    const DO = repository.byId('mock-id');
    expect(DO.settings.schedule.startTime).toBe(321);
  });

  it('converts data received with __JSON__ array format to a regular array', () => {
    const repository = generateRepositoryInstance({
      properties: {
        people: data.array(data.string),
        peopleOptional: data.array(data.string).optional,
        object: data.object({
          nestedArray: data.array(data.string),
          nestedOptionalArray: data.array(data.string).optional,
        }),
      },
    });

    repository.onDataReceived({
      id: 'mock-id',
      type: 'mockNodeType',
      people: `__JSON__["joe", "bob"]`,
      peopleOptional: `__JSON__["user1", "user2"]`,
      object: data.OBJECT_IDENTIFIER,
      [`object${data.OBJECT_PROPERTY_SEPARATOR}nestedArray`]: '__JSON__["joe", "bob"]',
      [`object${data.OBJECT_PROPERTY_SEPARATOR}nestedOptionalArray`]: `__JSON__["user1", "user2"]`,
    } as { id: string });

    const DO = repository.byId('mock-id');

    expect(DO.people).toEqual(['joe', 'bob']);
    expect(DO.peopleOptional).toEqual(['user1', 'user2']);
    expect(DO.object.nestedArray).toEqual(['joe', 'bob']);
    expect(DO.object.nestedOptionalArray).toEqual(['user1', 'user2']);
  });

  it('converts data received in old object format to a regular object', () => {
    const repository = generateRepositoryInstance({
      properties: {
        settings: data.object({
          schedule: data.object({
            startTime: data.number,
          }),
        }),
        recordProp: data.record(
          data.object({
            stringProp: data.string,
            optionalNumberProp: data.number.optional,
          })
        ),
        optionalRecordProp: data.record.optional(
          data.object({
            stringProp: data.string,
            optionalNumberProp: data.number.optional,
          })
        ),
      },
    });

    repository.onDataReceived({
      id: 'mock-id',
      type: 'mockNodeType',
      version: '1',
      settings:
        '__JSON__{\u0022schedule\u0022:{\u0022startTime\u0022:\u0022321\u0022}}',
      recordProp:
        '__JSON__{\u0022foo\u0022:{\u0022stringProp\u0022:\u0022mock string\u0022, \u0022optionalNumberProp\u0022:null}}',
      optionalRecordProp: null,
      settings__dot__schedule: null,
      settings__dot__schedule__dot__startTime: null, // mimicking what the BE would return from querying this bit of the object
    } as { id: string });

    const DO = repository.byId('mock-id');
    expect(DO.settings.schedule.startTime).toBe(321);
    expect(DO.recordProp.foo).toEqual({
      stringProp: 'mock string',
      optionalNumberProp: null,
    });
    expect(DO.optionalRecordProp).toBe(null);
  });

  // When we get back data from a query, we want to call DO.onDataReceived without having to manually parse the data
  // to remove the relational results. This ensures the DO is responsible for that.
  test('data received that is not part of node data or is relational is ignored', () => {
    const mmGQL = new MMGQL(getMockConfig());
    const repository = generateRepositoryInstance<
      {
        task: DataDefaultFn;
      },
      {},
      { assignee: IOneToOneQueryBuilder<UserNode> },
      {}
    >({
      properties: {
        task: data.string,
      },
      relational: {
        assignee: () => data.oneToOne(generateUserNode(mmGQL)),
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
        task: data.string,
      },
    });

    expect(() => repository.byId('123')).toThrow(NotCachedException);
  });

  it('exposes a method to delete cached data by id', () => {
    const repository = generateRepositoryInstance({
      properties: {
        task: data.string,
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

    expect(() => repository.byId('123')).toThrow(NotCachedException);
  });

  it('handles null nested objects', () => {
    const repository = generateRepositoryInstance({
      properties: {
        object: data.object({
          nested: data.object({
            foo: data.string,
          }),
        }),
        optionalObject: data.object.optional({
          string: data.string,
          oldStyleString: data.string.optional,
          requiredString2: data.string,
          nestedOptional: data.object.optional({
            foo: data.string,
          }),
        }),
      },
    });

    repository.onDataReceived({
      id: '123',
      type: 'mockNodeType',
      version: '1',
      object: null,
      optionalObject: data.OBJECT_IDENTIFIER,
      optionalObject__dot__string: 'hello',
      optionalObject__dot__oldStyleString: NULL_TAG,
      optionalObject__dot__requiredString2: NULL_TAG,
      optionalObject__dot__nestedOptional: null,
      optionalObject__dot__nestedOptional__dot__foo: null,
    });

    const cached = repository.byId('123');

    expect(cached.object).toEqual({
      nested: { foo: '' },
    });

    expect(cached.optionalObject).toEqual({
      string: 'hello',
      oldStyleString: null,
      requiredString2: '',
      nestedOptional: null,
    });
  });
});
