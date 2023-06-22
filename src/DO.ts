import { PROPERTIES_QUERIED_FOR_ALL_NODES } from './consts';
import { Data } from './dataTypes';
import {
  IMMGQL,
  IData,
  DataDefaultFn,
  NodeRelationalQueryBuilderRecord,
  NodeDO,
  NodeComputedFns,
  NodeRelationalFns,
  DeepPartial,
  NodeRelationalQueryBuilder,
  INode,
  DATA_TYPES,
  MapFn,
  Id,
} from './types';

export function createDOFactory(mmGQLInstance: IMMGQL) {
  /**
   * Returns a DO class, since there is one instance of the DO class
   * for each instance of that node type that is fetched from the backend
   */
  return function DOFactory<
    TNodeData extends Record<string, IData | DataDefaultFn>,
    TNodeComputedData extends Record<string, any>,
    TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
    TDOClass = new (initialData?: Record<string, any>) => NodeDO
  >(node: {
    type: string;
    properties: TNodeData;
    computed?: NodeComputedFns<{
      TNodeData: TNodeData;
      TNodeComputedData: TNodeComputedData;
    }>;
    relational?: NodeRelationalFns<TNodeRelationalData>;
  }): TDOClass {
    // silences the error "A class can only implement an object type or intersection of object types with statically known members."
    // wich happens because NodeDO has non statically known members (each property on a node in the backend is mapped to a non-statically known property on the DO)
    // eslint-disable-next-line
    // @ts-ignore
    return class DO implements TDOClass {
      public parsedData: DeepPartial<TNodeData>;
      public version: number = -1;
      public id: Id;
      public lastUpdatedBy: string;
      public persistedData: Record<string, any> = {};
      private _defaults: Record<keyof TNodeData, any>;
      public type = node.type;

      constructor(
        initialData: DeepPartial<TNodeData> & {
          version: number;
          id: Id;
          lastUpdatedBy: string;
        }
      ) {
        this._defaults = this.getDefaultData(node.properties);
        this.id = initialData.id;
        this.lastUpdatedBy = initialData.lastUpdatedBy;
        if (initialData.version != null) {
          this.version = Number(initialData.version);
        }

        if (initialData) {
          this.persistedData = this.parseReceivedData({
            initialData,
            nodeProperties: node.properties,
          });
        }

        this.parsedData = this.getParsedData({
          data: node.properties,
          persistedData: this.persistedData,
          defaultData: this._defaults,
        });
        mmGQLInstance.plugins?.forEach(plugin => {
          if (plugin.DO?.onConstruct) {
            plugin.DO.onConstruct({
              DOInstance: this,
              parsedDataKey: 'parsedData',
            });
          }
        });

        this.initializeNodePropGetters();
        this.initializeNodeComputedGetters();
        this.initializeNodeRelationalGetters();
      }

      private parseReceivedData(opts: {
        initialData: Record<string, any>;
        nodeProperties: typeof node.properties;
      }) {
        const { initialData, nodeProperties } = opts;

        return Object.entries(nodeProperties).reduce(
          (acc, [propName, propValue]) => {
            const property = this.getData(propValue);

            const propExistsInInitialData =
              propName in initialData && initialData[propName] != null;

            if (this.isObjectType(property.type) && propExistsInInitialData) {
              acc[propName] = this.parseReceivedData({
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
            } else if (
              propName in initialData &&
              initialData[propName] === null
            ) {
              acc[propName] = null;
            } else if (propExistsInInitialData) {
              acc[propName] = property.parser(initialData[propName]);
            }

            return acc;
          },
          {} as Record<string, any>
        );
      }

      private getDefaultData = (
        nodePropertiesOrData:
          | typeof node.properties
          | Data<any>
          | ((_default: any) => Data<any>)
      ): Record<keyof TNodeData, any> => {
        if (nodePropertiesOrData instanceof Data) {
          if (this.isObjectType(nodePropertiesOrData.type)) {
            return this.getDefaultData(nodePropertiesOrData.boxedValue);
          }
          return nodePropertiesOrData.defaultValue;
        }

        const getDefaultFnValue = (
          propName?: keyof TNodeData,
          defaultData?: IData
        ) => {
          const defaultFn =
            defaultData ||
            ((nodePropertiesOrData as TNodeData)[
              propName as keyof TNodeData
            ] as any)._default;

          // if a boolean dataType is not passed a default value, it returns an error. We throw it here
          if (defaultFn instanceof Error) {
            throw defaultFn;
          }

          // if array type, we need to set the default value as an array containing the parent type's boxedValue
          if (this.isArrayType(defaultFn.type)) {
            if (this.isObjectType(defaultFn.boxedValue.type)) {
              return [this.getDefaultData(defaultFn.boxedValue.boxedValue)];
            }
            return [defaultFn.boxedValue.defaultValue];
          }

          return defaultFn.defaultValue;
        };

        if (typeof nodePropertiesOrData === 'function') {
          return getDefaultFnValue(
            undefined,
            (nodePropertiesOrData as any)._default as IData
          );
        }

        return Object.keys(nodePropertiesOrData).reduce(
          (acc, prop: keyof TNodeData) => {
            const propValue = nodePropertiesOrData[prop] as IData;
            if (
              this.isObjectType(propValue.type) ||
              this.isRecordType(propValue.type)
            ) {
              acc[prop] = this.getDefaultData(propValue.boxedValue);
            } else if (typeof propValue === 'function') {
              const defaultValue = getDefaultFnValue(prop);

              acc[prop] = defaultValue;
            } else {
              acc[prop] = (nodePropertiesOrData[prop] as IData).defaultValue;
            }
            return acc;
          },
          {} as Record<keyof TNodeData, any>
        );
      };

      private getParsedData(opts: {
        data: IData | Record<string, IData | DataDefaultFn>; // because it can be a single value (dataTypes.number, dataTypes.string, dataTypes.boolean, dataTypes.array, dataTypes.record) or an object (root node data, nested objects)
        persistedData: any;
        defaultData: any;
      }) {
        if (
          opts.data instanceof Data &&
          opts.data.isOptional &&
          opts.persistedData == null
        ) {
          return null;
        }

        const property = this.getData(opts.data as IData);

        if (property instanceof Data && property.boxedValue) {
          // sm.array, sm.object or sm.record
          if (this.isArrayType(property.type)) {
            if (opts.persistedData) {
              return (opts.persistedData || []).map((data: any) => {
                return this.getParsedData({
                  data: property.boxedValue,
                  persistedData: data,
                  defaultData:
                    property.type === DATA_TYPES.array
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

            const boxedValueData = this.getData(property.boxedValue);

            if (boxedValueData instanceof Data) {
              // sm.record
              return Object.keys(opts.persistedData).reduce((acc, key) => {
                acc[key] = this.getParsedData({
                  data: property.boxedValue,
                  persistedData: opts.persistedData[key],
                  defaultData: opts.defaultData, //opts.defaultData,
                }); // no default value for values in a record
                return acc;
              }, {} as Record<string, any>);
            } else {
              // if we're dealing with an object, lets loop over the keys in its boxed value
              return Object.keys(property.boxedValue).reduce((acc, key) => {
                acc[key] = this.getParsedData({
                  data: property.boxedValue[key],
                  persistedData: opts.persistedData[key],
                  defaultData: opts.defaultData?.[key],
                });
                return acc;
              }, {} as Record<string, any>);
            }
          }
        } else if (property instanceof Data) {
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
              data: property[prop],
              persistedData: opts.persistedData[prop],
              defaultData: opts.defaultData[prop],
            });
            return acc;
          }, {} as Record<string, any>);
        }
      }

      public onDataReceived = (
        receivedData: {
          version: number;
          lastUpdatedBy: string;
        } & DeepPartial<TNodeData>,
        opts?: { __unsafeIgnoreVersion: boolean }
      ) => {
        if (receivedData.version == null) {
          throw Error('Message received for a node was missing a version');
        }

        const newVersion = Number(receivedData.version);

        // __unsafeIgnoreVersion should used by OptimisticUpdatesOrchestrator ONLY
        // it allows setting the data on the DO to a version older than the last optimistic update
        // so that we can revert on a failed request
        if (opts?.__unsafeIgnoreVersion || newVersion >= this.version) {
          this.version = newVersion;
          this.lastUpdatedBy = receivedData.lastUpdatedBy;

          const newData = this.parseReceivedData({
            initialData: receivedData,
            nodeProperties: node.properties,
          });

          this.extendPersistedWithNewlyReceivedData({
            data: node.properties,
            object: this.persistedData,
            extension: newData,
          });

          this.parsedData = this.getParsedData({
            data: node.properties,
            persistedData: this.persistedData,
            defaultData: this._defaults,
          });
        }
      };

      private extendPersistedWithNewlyReceivedData(opts: {
        data: Record<string, IData | DataDefaultFn>;
        object: Record<string, any>;
        extension: Record<string, any>;
      }) {
        Object.entries(opts.extension).forEach(([key, value]) => {
          const dataForThisProp = this.getData(opts.data[key]);

          // if this is a record, completely overwrite the stored persisted data
          if (this.isRecordType(dataForThisProp.type)) {
            opts.object[key] = value;
          } else {
            // if it's an object, extend the persisted data we've received so far with the newly received data
            if (this.isObjectType(dataForThisProp.type)) {
              if (value == null) {
                opts.object[key] = null;
              } else {
                opts.object[key] = opts.object[key] || {};

                this.extendPersistedWithNewlyReceivedData({
                  data: dataForThisProp.boxedValue,
                  object: opts.object[key],
                  extension: value,
                });
              }
            } else {
              // otherwise no need to extend, simply overwrite the value
              opts.object[key] = value;
            }
          }
        });
      }

      /**
       * initializes getters for properties that are stored on this node in the backend
       * as properties on this DO instance
       */
      private initializeNodePropGetters() {
        Object.keys(node.properties).forEach(prop => {
          if (Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(prop)) {
            // do not create getters for any properties included in the node definition which are already being queried by sm-js regardless
            // since the code in this DO relies on setting those properties directly using this.version or this.lastUpdatedBy
            return;
          }

          const property = this.getData(node.properties[prop]);

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
          Object.keys(relationalData).forEach(relationshipName => {
            this.setRelationalProp({
              relationshipName,
              relationalQueryGetter: relationalData[
                relationshipName
              ] as () => NodeRelationalQueryBuilder<any>,
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
        mmGQLInstance.plugins?.forEach(plugin => {
          if (plugin.DO?.computedDecorator) {
            computedGetter = plugin.DO.computedDecorator({
              computedFn: computedGetter,
              DOInstance: this,
            });
          }
        });

        Object.defineProperty(this, opts.propName, {
          get: () => computedGetter(),
          configurable: true,
          enumerable: true,
        });
      }

      private setRelationalProp(opts: {
        relationshipName: string;
        relationalQueryGetter: () => NodeRelationalQueryBuilder<{
          TTargetNodeOrTargetNodeRecord: INode<{
            TNodeType: any;
            TNodeData: TNodeData;
            TNodeComputedData: TNodeComputedData;
            TNodeRelationalData: TNodeRelationalData;
          }>;
          TIncludeTotalCount: boolean;
          TMapFn: MapFn<any>;
        }>;
      }) {
        Object.defineProperty(this, opts.relationshipName, {
          configurable: true,
          get: () => {
            return opts.relationalQueryGetter();
          },
        });
      }

      private getData(prop: IData<any> | DataDefaultFn) {
        if (typeof prop === 'function') {
          return (prop as any)._default as IData;
        }
        return prop as IData;
      }

      private isArrayType(type: string) {
        return type === DATA_TYPES.array || type === DATA_TYPES.maybeArray;
      }

      private isObjectType(type: string) {
        return type === DATA_TYPES.object || type === DATA_TYPES.maybeObject;
      }

      private isRecordType(type: string) {
        return type === DATA_TYPES.record || type === DATA_TYPES.maybeRecord;
      }
    };
  };
}
