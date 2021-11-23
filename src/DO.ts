import { extend } from './dataUtilities';
import { SMData, SM_DATA_TYPES, IS_NULL_IDENTIFIER } from './smDataTypes';
import { SMDataParsingException } from './exceptions';
import { getConfig } from './config';

/**
 * Returns a DO class, since there is one instance of the DO class
 * for each instance of that node type that is fetched from SM
 */
export function DOFactory<
  TNodeData extends Record<string, ISMData>,
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

          if (
            (property.type === SM_DATA_TYPES.object ||
              property.type === SM_DATA_TYPES.maybeObject) &&
            propExistsInInitialData
          ) {
            acc[propName] = this.parseInitialData({
              initialData: initialData[propName],
              nodeProperties: property.boxedValue,
            });
          } else if (
            (property.type === SM_DATA_TYPES.array ||
              property.type === SM_DATA_TYPES.maybeArray) &&
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

    private getDefaultData = (nodeProperties: TNodeData) => {
      const getDefaultFnValue = (propName: keyof TNodeData) => {
        const defaultFn = (nodeProperties[propName] as any)._default;

        if (defaultFn instanceof Error) {
          throw defaultFn;
        }

        if (
          defaultFn.type === SM_DATA_TYPES.array ||
          defaultFn.type === SM_DATA_TYPES.maybeArray
        ) {
          if (defaultFn.boxedValue.type === SM_DATA_TYPES.object) {
            return [this.getDefaultData(defaultFn.boxedValue.boxedValue)];
          }

          return [defaultFn.boxedValue.defaultValue];
        }

        return defaultFn.defaultValue;
      };

      return Object.keys(nodeProperties).reduce(
        (acc, prop: keyof TNodeData) => {
          const propValue = nodeProperties[prop];

          if (
            propValue.type === SM_DATA_TYPES.object ||
            propValue.type === SM_DATA_TYPES.maybeObject
          ) {
            acc[prop] = this.getDefaultData(propValue.boxedValue);
          } else if (typeof propValue === 'function') {
            const defaultValue = getDefaultFnValue(prop);

            acc[prop] = defaultValue;
          } else {
            acc[prop] = nodeProperties[prop].defaultValue;
          }
          return acc;
        },
        {} as Record<keyof TNodeData, any>
      );
    };

    private getParsedData(opts: {
      smData:
        | ISMData
        | ISMDataConstructor<any, any, any>
        | Record<string, ISMData | ISMDataConstructor<any, any, any>>; // because it can be a single value (sm.number, sm.string, sm.boolean, sm.array, sm.record) or an object (root node data, nested objects)
      persistedData: any;
      defaultData: any;
    }) {
      if (
        opts.smData instanceof SMData &&
        opts.smData.isOptional &&
        opts.persistedData == null
      )
        return null;

      const property = this.getSMProperty(
        opts.smData as ISMData | ISMDataConstructor<any, any, any>
      );

      if (property instanceof SMData && property.boxedValue) {
        // sm.array, sm.object or sm.record

        if (
          property.type === SM_DATA_TYPES.array ||
          property.type === SM_DATA_TYPES.maybeArray
        ) {
          if (opts.persistedData) {
            return (opts.persistedData || []).map((data: any) => {
              return this.getParsedData({
                smData: property.boxedValue,
                persistedData: data,
                defaultData:
                  property.type === SM_DATA_TYPES.array
                    ? opts.defaultData[0]
                    : opts.persistedData,
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

          if (property.boxedValue instanceof SMData) {
            // sm.record
            return Object.keys(opts.persistedData).reduce((acc, key) => {
              acc[key] = this.getParsedData({
                smData: property.boxedValue,
                persistedData: opts.persistedData[key],
                defaultData: null,
              }); // no default value for values in a record
              return acc;
            }, {} as Record<string, any>);
          } else {
            // if we're dealing with an object, lets loop over the keys in its' boxed value
            return Object.keys(property.boxedValue).reduce((acc, key) => {
              acc[key] = this.getParsedData({
                smData: property.boxedValue[key],
                persistedData: opts.persistedData[key],
                defaultData: opts.defaultData[key],
              });
              return acc;
            }, {} as Record<string, any>);
          }
        }
      } else if (property instanceof SMData) {
        // sm.string, sm.boolean, sm.number
        return opts.persistedData != null
          ? property.parser(opts.persistedData)
          : opts.defaultData;
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
     * gets initial values for self.parsedData
     * calling itself recursively for nested objects
     */
    private getInitialState = (opts: {
      smDataForThisObject: Record<string, ISMData>;
    }) => {
      return Object.keys(opts.smDataForThisObject).reduce(
        (acc, prop) => {
          const data = opts.smDataForThisObject[prop] as ISMData;

          if (
            data.type === SM_DATA_TYPES.object ||
            data.type === SM_DATA_TYPES.maybeObject
          ) {
            const smDataForThisObject = data.boxedValue as Record<
              string,
              ISMData
            >;

            const initialStateForThisObject = this.getInitialState({
              smDataForThisObject,
            });

            acc.parsedData[prop] = initialStateForThisObject.parsedData;
          }

          return acc;
        },
        { parsedData: {} } as {
          parsedData: Record<string, Record<string, {}>>;
        }
      );
    };

    /**
     * initializes getters and setters for properties that are stored on this node in SM
     * as properties on this DO instance
     */
    private initializeNodePropGettersAndSetters() {
      Object.keys(node.properties).forEach(prop => {
        const property = this.getSMProperty(node.properties[prop]);

        if (
          property.type === SM_DATA_TYPES.object ||
          property.type === SM_DATA_TYPES.maybeObject
        ) {
          this.setObjectProp(prop);
        } else if (
          property.type === SM_DATA_TYPES.array ||
          property.type === SM_DATA_TYPES.maybeArray
        ) {
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

    private getParsedNewValue = (opts: {
      newValue: any;
      currentParsedData: any;
      smData:
        | ISMData
        | Record<string, ISMData>
        | ISMDataConstructor<any, any, any>;
    }) => {
      if (opts.smData instanceof SMData) {
        return (opts.smData as ISMData).parser(opts.newValue);
      } else if (typeof opts.smData === 'function') {
        return opts.smData(opts.newValue).parser(opts.newValue);
      } else {
        const smDataForThisObject = opts.smData as Record<string, ISMData>;

        if (opts.newValue == null) return opts.newValue;

        return Object.keys({
          ...opts.currentParsedData,
          ...opts.newValue,
        }).reduce((acc, dataKey) => {
          if (dataKey === IS_NULL_IDENTIFIER) return acc;

          const smDataForThisProp = smDataForThisObject[dataKey];

          if (!smDataForThisProp)
            throw new SMDataParsingException({
              receivedData: opts.newValue,
              message: `No smData for the prop ${dataKey} in the data for the node with the type ${node.type}.`,
            });

          if (opts.newValue[dataKey] !== undefined) {
            acc[dataKey] = this.getParsedNewValue({
              newValue: opts.newValue[dataKey],
              currentParsedData: opts.currentParsedData[dataKey],
              smData:
                smDataForThisProp.type === SM_DATA_TYPES.object ||
                smDataForThisProp.type === SM_DATA_TYPES.maybeObject
                  ? smDataForThisProp.boxedValue
                  : smDataForThisProp,
            });
          } else {
            acc[dataKey] = opts.currentParsedData[dataKey];
          }

          return acc;
        }, {} as Record<string, any>);
      }
    };

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
      prop: ISMData<any, any, any> | ISMDataConstructor<any, any, any>
    ) {
      if (typeof prop === 'function') {
        return (prop as any)._default as ISMData;
      }
      return prop as ISMData;
    }
  };
}
