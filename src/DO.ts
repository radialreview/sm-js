import { extend } from './dataUtilities';
import { SMData, SM_DATA_TYPES } from './smDataTypes';
import { getConfig } from './config';

/**
 * Returns a DO class, since there is one instance of the DO class
 * for each instance of that node type that is fetched from SM
 */
export function DOFactory<
  TNodeData extends Record<
    string,
    ISMData | ((_default: any) => ISMData | Error)
  >,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>,
  TDOClass = new (initialData?: Record<string, any>) => NodeDO
>(node: {
  type: string;
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
}): TDOClass {
  // silences the error "A class can only implement an object type or intersection of object types with statically known members."
  // wich happens because NodeDO has non statically known members (each property on a node in SM is mapped to a non-statically known property on the DO)
  // eslint-disable-next-line
  // @ts-ignore
  return class DO implements TDOClass {
    public parsedData: DeepPartial<TNodeData>;
    private _defaults: Record<keyof TNodeData, any>;
    private _persistedData: Record<string, any> = {};

    constructor(initialData?: DeepPartial<TNodeData>) {
      const initialPersisted: DeepPartial<TNodeData> = {};

      this._defaults = this.getDefaultData(node.properties);

      if (initialData) {
        this._persistedData = this.parseInitialData({
          initialData,
          nodeProperties: node.properties,
        });
      }

      this.parsedData = initialPersisted;

      getConfig().plugins?.forEach(plugin => {
        if (plugin.DO?.onConstruct) {
          plugin.DO.onConstruct({
            DOInstance: this,
            parsedDataKey: 'parsedData',
          });
        }
      });

      this.initializeNodePropGettersAndSetters();
      initialData && this.onDataReceived(initialData);

      this.initializeNodeComputedGetters();
      this.initializeNodeRelationalGetters();
      this.initializeNodeMutations();
    }

    private parseInitialData(opts: {
      initialData: Record<string, any>;
      nodeProperties: typeof node.properties;
    }) {
      const { initialData, nodeProperties } = opts;

      return Object.entries(nodeProperties).reduce(
        (acc, [propName, propValue]) => {
          const property = this.getSMProperty(propValue);

          const propExistsInInitialData =
            propName in initialData && initialData[propName] != null;

          if (this.isObjectType(property.type) && propExistsInInitialData) {
            acc[propName] = this.parseInitialData({
              initialData: initialData[propName],
              nodeProperties: property.boxedValue,
            });
          } else if (
            this.isArrayType(property.type) &&
            propExistsInInitialData
          ) {
            acc[propName] = initialData[propName].map(
              property.boxedValue.parser
            );
          } else if (propExistsInInitialData) {
            acc[propName] = property.parser(initialData[propName]);
          }

          return acc;
        },
        {} as Record<string, any>
      );
    }

    private getDefaultData = (
      nodePropertiesOrSMData:
        | typeof node.properties
        | SMData<any, any, any>
        | ((_default: any) => SMData<any, any, any>)
    ): Record<keyof TNodeData, any> => {
      if (nodePropertiesOrSMData instanceof SMData) {
        if (this.isObjectType(nodePropertiesOrSMData.type)) {
          return this.getDefaultData(nodePropertiesOrSMData.boxedValue);
        }
        return nodePropertiesOrSMData.defaultValue;
      }

      const getDefaultFnValue = (
        propNameOrBoxedValue?: keyof TNodeData | ISMData,
        defaultSMData?: ISMData
      ) => {
        const defaultFn =
          defaultSMData ||
          ((nodePropertiesOrSMData as TNodeData)[
            propNameOrBoxedValue as keyof TNodeData
          ] as any)._default;

        if (defaultFn instanceof Error) {
          throw defaultFn;
        }

        if (this.isArrayType(defaultFn.type)) {
          if (this.isObjectType(defaultFn.boxedValue.type)) {
            return [this.getDefaultData(defaultFn.boxedValue.boxedValue)];
          }

          return [defaultFn.boxedValue.defaultValue];
        }

        return defaultFn.defaultValue;
      };

      if (typeof nodePropertiesOrSMData === 'function') {
        return getDefaultFnValue(
          undefined,
          (nodePropertiesOrSMData as any)._default as ISMData
        );
      }

      return Object.keys(nodePropertiesOrSMData).reduce(
        (acc, prop: keyof TNodeData) => {
          const propValue = nodePropertiesOrSMData[prop] as ISMData;
          if (
            this.isObjectType(propValue.type) ||
            this.isRecordType(propValue.type)
          ) {
            acc[prop] = this.getDefaultData(propValue.boxedValue);
          } else if (typeof propValue === 'function') {
            const defaultValue = getDefaultFnValue(prop);

            acc[prop] = defaultValue;
          } else {
            acc[prop] = (nodePropertiesOrSMData[prop] as ISMData).defaultValue;
          }
          return acc;
        },
        {} as Record<keyof TNodeData, any>
      );
    };

    private getParsedData(opts: {
      smData:
        | ISMData
        | Record<string, ISMData | ((_default: any) => ISMData | Error)>; // because it can be a single value (sm.number, sm.string, sm.boolean, sm.array, sm.record) or an object (root node data, nested objects)
      persistedData: any;
      defaultData: any;
    }) {
      if (
        opts.smData instanceof SMData &&
        opts.smData.isOptional &&
        opts.persistedData == null
      )
        return null;

      const property = this.getSMProperty(opts.smData as ISMData);

      if (property instanceof SMData && property.boxedValue) {
        // sm.array, sm.object or sm.record
        if (this.isArrayType(property.type)) {
          if (opts.persistedData) {
            return (opts.persistedData || []).map((data: any) => {
              return this.getParsedData({
                smData: property.boxedValue,
                persistedData: data,
                defaultData:
                  property.type === SM_DATA_TYPES.array
                    ? opts.defaultData?.[0] || null // If property is a non-optional array and the boxed value is of type sm.object, the default data for an array should be an array with a single item, where that item is the default data for that object
                    : null,
              });
            });
          } else {
            return opts.defaultData;
          }
        } else {
          // sm.object, sm.record
          // safe to assume that if we made it this far, the expected data type is object and it's non optional, so lets default it to {}
          if (!opts.persistedData) {
            opts.persistedData = {};
          }

          const boxedValueSMProperty = this.getSMProperty(property.boxedValue);

          if (boxedValueSMProperty instanceof SMData) {
            // sm.record
            return Object.keys(opts.persistedData).reduce((acc, key) => {
              acc[key] = this.getParsedData({
                smData: property.boxedValue,
                persistedData: opts.persistedData[key],
                defaultData: opts.defaultData, //opts.defaultData,
              }); // no default value for values in a record
              return acc;
            }, {} as Record<string, any>);
          } else {
            // if we're dealing with an object, lets loop over the keys in its boxed value
            return Object.keys(property.boxedValue).reduce((acc, key) => {
              acc[key] = this.getParsedData({
                smData: property.boxedValue[key],
                persistedData: opts.persistedData[key],
                defaultData: opts.defaultData?.[key],
              });
              return acc;
            }, {} as Record<string, any>);
          }
        }
      } else if (property instanceof SMData) {
        // sm.string, sm.boolean, sm.number
        if (opts.persistedData != null) {
          return property.parser(opts.persistedData);
        }
        return opts.defaultData;
      } else {
        // root of node, simply loop over keys of data definition and call this function recursively
        return Object.keys(property).reduce((acc, prop) => {
          acc[prop] = this.getParsedData({
            // @ts-ignore
            smData: property[prop],
            persistedData: opts.persistedData[prop],
            defaultData: opts.defaultData[prop],
          });
          return acc;
        }, {} as Record<string, any>);
      }
    }

    public onDataReceived = (receivedData: DeepPartial<TNodeData>) => {
      const newData = this.parseInitialData({
        initialData: receivedData,
        nodeProperties: node.properties,
      });

      extend({
        object: this._persistedData,
        extension: newData,
        deleteKeysNotInExtension: false,
        extendNestedObjects: true,
      });

      this.parsedData = this.getParsedData({
        smData: node.properties,
        persistedData: this._persistedData,
        defaultData: this._defaults,
      });
    };

    /**
     * initializes getters and setters for properties that are stored on this node in SM
     * as properties on this DO instance
     */
    private initializeNodePropGettersAndSetters() {
      Object.keys(node.properties).forEach(prop => {
        const property = this.getSMProperty(node.properties[prop]);

        if (this.isObjectType(property.type)) {
          this.setObjectProp(prop);
        } else if (this.isArrayType(property.type)) {
          this.setArrayProp(prop);
        } else {
          this.setPrimitiveValueProp(prop);
        }
      });
    }

    private initializeNodeComputedGetters() {
      const computedData = node.computed;
      if (computedData) {
        Object.keys(computedData).forEach(computedProp => {
          this.setComputedProp({
            propName: computedProp,
            computedFn: computedData[computedProp] as (
              data: Record<string, any>
            ) => any,
          });
        });
      }
    }

    private initializeNodeRelationalGetters() {
      const relationalData = node.relational;
      if (relationalData) {
        Object.keys(relationalData).forEach(relationalProp => {
          this.setRelationalProp({
            propName: relationalProp,
            relationalQueryGetter: relationalData[
              relationalProp
            ] as () => NodeRelationalQueryBuilder<
              ISMNode<TNodeData, TNodeComputedData, TNodeRelationalData>
            >,
          });
        });
      }
    }

    private initializeNodeMutations() {
      const mutations = node.mutations;
      if (mutations) {
        Object.keys(mutations).forEach(mutationName => {
          Object.defineProperty(this, mutationName, {
            get: () => mutations[mutationName].bind(this),
          });
        });
      }
    }

    /**
     * Object type props have different getters and setters than non object type
     * because when an object property is set we extend the previous value, instead of replacing its reference entirely (we've seen great performance gains doing this)
     */
    private setObjectProp = (propNameForThisObject: string) => {
      Object.defineProperty(this, propNameForThisObject, {
        configurable: true,
        enumerable: true,
        get: () => {
          return this.parsedData[propNameForThisObject];
        },
      });
    };

    private setPrimitiveValueProp = (propName: string) => {
      Object.defineProperty(this, propName, {
        configurable: true,
        enumerable: true,
        get: () => {
          return this.parsedData[propName];
        },
      });
    };

    private setArrayProp = (propName: string) => {
      Object.defineProperty(this, propName, {
        configurable: true,
        enumerable: true,
        get: () => {
          return this.parsedData[propName];
        },
      });
    };

    private setComputedProp(opts: {
      propName: string;
      computedFn: (nodeData: Record<string, any>) => any;
    }) {
      let computedGetter = () => opts.computedFn(this);
      getConfig().plugins?.forEach(plugin => {
        if (plugin.DO?.computedDecorator) {
          computedGetter = plugin.DO.computedDecorator({
            computedFn: computedGetter,
            DOInstance: this,
          });
        }
      });

      Object.defineProperty(this, opts.propName, {
        get: () => computedGetter(),
        enumerable: true,
      });
    }

    private setRelationalProp(opts: {
      propName: string;
      relationalQueryGetter: () => NodeRelationalQueryBuilder<
        ISMNode<TNodeData, TNodeComputedData, TNodeRelationalData>
      >;
    }) {
      Object.defineProperty(this, opts.propName, {
        get: () => {
          return opts.relationalQueryGetter();
        },
      });
    }

    private getSMProperty(
      prop: ISMData<any, any, any> | ((_default: any) => ISMData | Error)
    ) {
      if (typeof prop === 'function') {
        return (prop as any)._default as ISMData;
      }
      return prop as ISMData;
    }

    private isArrayType(type: string) {
      return type === SM_DATA_TYPES.array || type === SM_DATA_TYPES.maybeArray;
    }

    private isObjectType(type: string) {
      return (
        type === SM_DATA_TYPES.object || type === SM_DATA_TYPES.maybeObject
      );
    }

    private isRecordType(type: string) {
      return (
        type === SM_DATA_TYPES.record || type === SM_DATA_TYPES.maybeRecord
      );
    }
  };
}
