import * as data from './dataTypes';
import { NotCachedException } from './exceptions';
import { UserNode, generateUserNode, getMockConfig } from './specUtilities';
import { RepositoryFactory } from './Repository';
import { getDefaultConfig, MMGQL } from '.';
import {
  NodeRelationalQueryBuilderRecord,
  NodeComputedFns,
  NodeRelationalFns,
  DataDefaultFn,
  IOneToOneQueryBuilder,
  Id,
} from './types';

function generateRepositoryInstance<
  TNodeData extends Record<string, any>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord
>(opts: {
  properties: TNodeData;
  computed?: NodeComputedFns<{
    TNodeData: TNodeData;
    TNodeComputedData: TNodeComputedData;
  }>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
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

  // When we get back data from a query, we want to call DO.onDataReceived without having to manually parse the data
  // to remove the relational results. This ensures the DO is responsible for that.
  test('data received that is not part of node data or is relational is ignored', () => {
    const mmGQL = new MMGQL(getMockConfig());
    const repository = generateRepositoryInstance<
      {
        task: DataDefaultFn;
      },
      {},
      { assignee: IOneToOneQueryBuilder<UserNode> }
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
      } as { id: Id })
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
      optionalObject: {
        string: 'hello',
        oldStyleString: null,
        requiredString2: null,
        nestedOptional: null,
      },
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
