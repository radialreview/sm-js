import { generateDOInstance } from './specUtilities';
import * as smData from './smDataTypes';
import {
  SMNotUpToDateException,
  SMNotUpToDateInComputedException,
  SMImpliedNodePropertyException,
} from './exceptions';
import {
  DeepPartial,
  GetAllAvailableNodeDataType,
  ISMData,
  Maybe,
  NodeComputedFns,
  RelationalQueryRecordEntry,
  SMDataDefaultFn,
} from './types';
import { OBJECT_PROPERTY_SEPARATOR } from './smDataTypes';

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
          children: true,
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

    expect(() => doProxy.computedValue).toThrow(
      SMNotUpToDateInComputedException
    );
  });

  it(`throws a helpful exception when a default property is redefined`, () => {
    expect(() =>
      generateDOProxy({
        properties: {
          id: smData.string,
          dateCreated: smData.number,
          dateLastModified: smData.number,
          lastUpdatedBy: smData.string,
          lastUpdatedClientTimestamp: smData.number,
        },
        initialData: {
          version: '1',
          id: 'mockId',
        },
      })
    ).toThrow(SMImpliedNodePropertyException);
  });

  it(`allows spreading data from results, and avoids enumerating properties which are not up to date`, () => {
    const doProxy = generateDOProxy({
      properties: {
        name: smData.string,
        object: smData.object({
          nestedString: smData.string,
          nestedNumber: smData.number,
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
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>
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
