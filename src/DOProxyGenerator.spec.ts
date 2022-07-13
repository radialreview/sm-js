import { generateDOInstance } from './specUtilities';
import * as data from './dataTypes';
import {
  NotUpToDateException,
  NotUpToDateInComputedException,
  ImpliedNodePropertyException,
} from './exceptions';
import {
  DeepPartial,
  GetAllAvailableNodeDataType,
  IData,
  Maybe,
  NodeComputedFns,
  RelationalQueryRecordEntry,
  DataDefaultFn,
} from './types';
import { OBJECT_PROPERTY_SEPARATOR } from './dataTypes';

describe('DOProxyGenerator', () => {
  // basic sanity check
  it('returns a proxied version of a DO', () => {
    const doProxy = generateDOProxy({
      properties: {},
      initialData: {
        version: '1',
        id: 'mockId',
      },
      allPropertiesQueried: ['id'],
    });

    expect(doProxy.id).toBe('mockId');
  });

  it('adds getters for relational results', () => {
    const todos = new Array(5).fill(0).map((_, idx) =>
      generateDOProxy({
        properties: {},
        initialData: {
          version: '1',
          id: `mockId${idx}`,
        },
      })
    );

    const doProxy = generateDOProxy({
      properties: {},
      initialData: {
        version: '1',
        id: 'mockId',
      },
      relationalResults: {
        todos: todos,
      },
      relationalQueries: {
        todos: {
          oneToMany: true,
        } as RelationalQueryRecordEntry,
      },
    });

    expect(doProxy.todos).toBe(todos);
  });

  it(`throws a helpful exception when a property that isn't guaranteed to be up to date is read`, () => {
    const doProxy = generateDOProxy({
      properties: {},
      initialData: {
        version: '1',
        id: 'mockId',
      },
      allPropertiesQueried: [],
    });

    expect(() => doProxy.id).toThrow(NotUpToDateException);
  });

  it(`throws a helpful exception when a property within a nested object that isn't guaranteed to be up to date is read`, () => {
    const doProxy = generateDOProxy({
      properties: {
        object: data.object({
          nestedString: data.string,
          nestedNumber: data.number,
        }),
      },
      initialData: {
        version: '1',
        id: 'mockId',
      },
      allPropertiesQueried: [
        'object',
        `object${OBJECT_PROPERTY_SEPARATOR}nestedString`,
      ],
    });

    expect(() => doProxy.object.nestedString).not.toThrow();
    expect(() => doProxy.object.nestedNumber).toThrow(NotUpToDateException);
  });

  it(`throws a helpful exception when a property is attempted to be read from within a computed property but isn't guaranteed to be up to date`, () => {
    const doProxy = generateDOProxy({
      properties: {
        name: data.string,
        object: data.object({
          nestedString: data.string,
          nestedNumber: data.number,
        }),
      },
      initialData: {
        version: '1',
        id: 'mockId',
      },
      computed: {
        computedValue: data => {
          return data.object.nestedNumber;
        },
      },
      allPropertiesQueried: [
        'object',
        `object${OBJECT_PROPERTY_SEPARATOR}nestedString`,
      ],
    });

    expect(() => doProxy.computedValue).toThrow(NotUpToDateInComputedException);
  });

  it(`throws a helpful exception when a default property is redefined`, () => {
    expect(() =>
      generateDOProxy({
        properties: {
          id: data.string,
          dateCreated: data.number,
          dateLastModified: data.number,
          lastUpdatedBy: data.string,
          lastUpdatedClientTimestamp: data.number,
        },
        initialData: {
          version: '1',
          id: 'mockId',
        },
      })
    ).toThrow(ImpliedNodePropertyException);
  });

  it(`allows spreading data from results, and avoids enumerating properties which are not up to date`, () => {
    const doProxy = generateDOProxy({
      properties: {
        name: data.string,
        object: data.object({
          nestedString: data.string,
          nestedNumber: data.number,
        }),
      },
      initialData: {
        version: '1',
        id: 'mockId',
      },
      computed: {
        computedValue: data => {
          return data.object.nestedString;
        },
        computedValue2: data => {
          return data.object.nestedNumber; // not up to date, since it wasn't queried, so it's skipped in the snapshot below
        },
      },
      allPropertiesQueried: [
        'object',
        `object${OBJECT_PROPERTY_SEPARATOR}nestedString`,
        'id',
        'lastUpdatedBy',
      ],
    });

    expect({ ...doProxy }).toMatchInlineSnapshot(`
      Object {
        "computedValue": "",
        "id": "mockId",
        "lastUpdatedBy": undefined,
        "object": Object {
          "nestedString": "",
        },
        "type": "mockNodeType",
        "version": 1,
      }
    `);
  });
});

function generateDOProxy<
  TNodeData extends Record<string, IData | DataDefaultFn>
>(opts: {
  properties: TNodeData;
  initialData: DeepPartial<GetAllAvailableNodeDataType<TNodeData, {}>> & {
    id: string;
    version: string;
  };
  computed?: NodeComputedFns<TNodeData, Record<string, any>>;
  allPropertiesQueried?: Array<string>;
  relationalResults?: Record<string, any>;
  relationalQueries?: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) {
  const { doInstance, mmGQLInstance } = generateDOInstance({
    properties: opts.properties,
    initialData: opts.initialData,
    computed: opts.computed,
  });

  return mmGQLInstance.DOProxyGenerator({
    do: doInstance,
    queryId: 'mockQueryId',
    node: mmGQLInstance.def({
      type: 'mockNodeType',
      properties: opts.properties,
      computed: opts.computed,
    }),
    allPropertiesQueried: opts.allPropertiesQueried || [],
    relationalResults: opts.relationalResults || {},
    relationalQueries: opts.relationalQueries || {},
  });
}
