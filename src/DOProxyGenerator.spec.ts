import { generateDOInstance } from './specUtilities';
import * as smData from './smDataTypes';
import {
  SMNotUpToDateException,
  SMNotUpToDateInComputedException,
} from './exceptions';

describe('DOProxyGenerator', () => {
  // basic sanity check
  it('returns a proxied version of a DO', () => {
    const doProxy = generateDOProxy({
      properties: {
        id: smData.string,
      },
      initialData: {
        version: '1',
        id: 'mockId',
      },
      allPropertiesQueried: ['id'],
    });

    expect(doProxy.id).toBe('mockId');
  });

  it('adds getters for relational results', () => {
    const todos = new Array(5)
      .fill(0)
      .map(() => generateDOProxy({ properties: { id: smData.string } }));

    const doProxy = generateDOProxy({
      properties: {
        id: smData.string,
      },
      relationalResults: {
        todos: todos,
      },
      relationalQueries: {
        todos: {
          children: true,
        } as RelationalQueryRecordEntry,
      },
    });

    expect(doProxy.todos).toBe(todos);
  });

  it(`throws a helpful exception when a property that isn't guaranteed to be up to date is read`, () => {
    const doProxy = generateDOProxy({
      properties: {
        id: smData.string,
      },
      allPropertiesQueried: [],
    });

    expect(() => doProxy.id).toThrow(SMNotUpToDateException);
  });

  it(`throws a helpful exception when a property within a nested object that isn't guaranteed to be up to date is read`, () => {
    const doProxy = generateDOProxy({
      properties: {
        object: smData.object({
          nestedString: smData.string,
          nestedNumber: smData.number,
        }),
      },
      allPropertiesQueried: ['object', 'object__dot__nestedString'],
    });

    expect(() => doProxy.object.nestedString).not.toThrow();
    expect(() => doProxy.object.nestedNumber).toThrow(SMNotUpToDateException);
  });

  it(`throws a helpful exception when a property is attempted to be read from within a computed property but isn't guaranteed to be up to date`, () => {
    const doProxy = generateDOProxy({
      properties: {
        name: smData.string,
        object: smData.object({
          nestedString: smData.string,
          nestedNumber: smData.number,
        }),
      },
      computed: {
        computedValue: data => {
          return data.object.nestedNumber;
        },
      },
      allPropertiesQueried: ['object', 'object_nestedString'],
    });

    expect(() => doProxy.computedValue).toThrow(
      SMNotUpToDateInComputedException
    );
  });
});

function generateDOProxy<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>
>(opts: {
  properties: TNodeData;
  initialData?: DeepPartial<GetExpectedNodeDataType<TNodeData>> & {
    version: string;
  };
  computed?: NodeComputedFns<TNodeData, Record<string, any>>;
  allPropertiesQueried?: Array<string>;
  relationalResults?: Record<string, any>;
  relationalQueries?: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) {
  const { doInstance, smJSInstance } = generateDOInstance({
    properties: opts.properties,
    initialData: opts.initialData,
    computed: opts.computed,
  });

  return smJSInstance.DOProxyGenerator({
    do: doInstance,
    queryId: 'mockQueryId',
    node: smJSInstance.def({
      type: 'mockNodeType',
      properties: opts.properties,
      computed: opts.computed,
    }),
    allPropertiesQueried: opts.allPropertiesQueried || [],
    relationalResults: opts.relationalResults || {},
    relationalQueries: opts.relationalQueries || {},
  });
}
