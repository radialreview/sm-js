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

    constructor(initialData?: DeepPartial<TNodeData>) {
      const initialPersisted: DeepPartial<TNodeData> = {};

      this._defaults = this.getDefaultData(node.properties);

      extend({
        object: initialPersisted,
        extension: this._defaults,
        deleteKeysNotInExtension: false,
        extendNestedObjects: true,
      });

      if (initialData) {
        extend({
          object: initialPersisted,
          extension: initialData,
          deleteKeysNotInExtension: false,
          extendNestedObjects: true,
        });
      }

      const { parsedData } = this.getInitialState({
        smDataForThisObject: node.properties,
      });

      extend({
        object: initialPersisted,
        extension: parsedData,
        deleteKeysNotInExtension: false,
        extendNestedObjects: true,
      });

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

    private getDefaultData = (nodeProperties: TNodeData) => {
      return Object.keys(nodeProperties).reduce(
        (acc, prop: keyof TNodeData) => {
          const propValue = nodeProperties[prop];

          if (propValue.type === SM_DATA_TYPES.object) {
            acc[prop] = this.getDefaultData(propValue.boxedValue);
          } else if (typeof propValue === 'function') {
            const defaultFn = (nodeProperties[prop] as any)._default;

            if (defaultFn instanceof Error) {
              throw defaultFn;
            }

            acc[prop] = defaultFn.defaultValue;
          } else {
            acc[prop] = nodeProperties[prop].defaultValue;
          }
          return acc;
        },
        {} as Record<keyof TNodeData, any>
      );
    };

    public onDataReceived = (receivedData: DeepPartial<TNodeData>) => {
      extend({
        object: this,
        extension: receivedData,
        deleteKeysNotInExtension: false,
        /**
         * the setters for these nested objects will handle extending the object themselves by extending parsedData for that object
         * check objectDataSetter in this class for more details on that
         */
        extendNestedObjects: false,
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
        const property = (() => {
          if (typeof node.properties[prop] === 'function') {
            return (node.properties[prop] as any)._default as ISMData;
          }
          return node.properties[prop] as ISMData;
        })();

        if (
          property.type === SM_DATA_TYPES.object ||
          property.type === SM_DATA_TYPES.maybeObject
        ) {
          const parsedDataForThisObject = this.parsedData[prop] as Record<
            string,
            any
          >;

          this.setObjectProp({
            smDataForThisObject: property.boxedValue as Record<string, ISMData>,
            parsedDataForThisObject,
            propNameForThisObject: prop as string,
            parentObject: this,
          });
        } else if (
          property.type === SM_DATA_TYPES.array ||
          property.type === SM_DATA_TYPES.maybeArray
        ) {
          this.setArrayProp({
            parentObject: this,
            propName: prop,
            smDataForThisProp: property,
            parsedDataForParent: this.parsedData,
          });
        } else {
          this.setPrimitiveValueProp({
            parentObject: this,
            propName: prop,
            smDataForThisProp: property,
            parsedDataForParent: this.parsedData,
          });
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
      smData: ISMData | Record<string, ISMData>;
    }) => {
      if (opts.smData instanceof SMData) {
        return (opts.smData as ISMData).parser(opts.newValue);
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

    private objectDataSetter = (opts: {
      parsedDataForObject: Record<string, any>;
      smDataForObject: Record<string, ISMData>;
    }) => {
      return (newValue: any) => {
        // We intentionally prefer mutating objects to updating their reference
        // as updating their reference would mean we'd also have to re-instantiate property getters/setters
        if (newValue == null) {
          opts.parsedDataForObject[IS_NULL_IDENTIFIER] = true;
        } else {
          opts.parsedDataForObject[IS_NULL_IDENTIFIER] = false;

          extend({
            object: opts.parsedDataForObject,
            extension: this.getParsedNewValue({
              newValue,
              smData: opts.smDataForObject,
              currentParsedData: opts.parsedDataForObject,
            }),
            deleteKeysNotInExtension: true,
            extendNestedObjects: true,
          });
        }
      };
    };

    /**
     * Object type props have different getters and setters than non object type
     * because when an object property is set we extend the previous value, instead of replacing its reference entirely (we've seen great performance gains doing this)
     */
    private setObjectProp = (opts: {
      smDataForThisObject: Record<string, ISMData>;
      parsedDataForThisObject: Record<string, any>;
      propNameForThisObject: string;
      parentObject: Record<string, any>;
    }) => {
      Object.defineProperty(opts.parentObject, opts.propNameForThisObject, {
        configurable: true,
        enumerable: true,
        get: () => {
          // Because objects within nodes are spread to multiple properties, there is no easy way to make an object "null".
          // To define an object as "null", this library stores a boolean value within node.objectName[IS_NULL_IDENTIFIER]
          if (opts.parsedDataForThisObject[IS_NULL_IDENTIFIER]) {
            return null;
          }

          const objectToReturn: Record<string, any> = {};

          Object.keys(opts.parsedDataForThisObject).forEach(objectProp => {
            if (objectProp === IS_NULL_IDENTIFIER) return;

            Object.defineProperty(objectToReturn, objectProp, {
              configurable: true,
              enumerable: true,
              get: () => opts.parsedDataForThisObject[objectProp],
            });
          });

          return objectToReturn;
        },
        set: this.objectDataSetter({
          parsedDataForObject: opts.parsedDataForThisObject,
          smDataForObject: opts.smDataForThisObject,
        }),
      });
    };

    private getPrimitiveValueSetter = (opts: {
      smDataForThisProp: ISMData;
      propName: string;
      parsedDataForParent: Record<string, any>;
    }) => {
      const primitiveValueSetter = (newVal: any) => {
        const newState = {
          ...opts.parsedDataForParent,
          [opts.propName]: newVal ?? this._defaults[opts.propName],
        };

        extend({
          object: opts.parsedDataForParent,
          extension: newState,
          deleteKeysNotInExtension: false,
          extendNestedObjects: false,
        });
      };

      return primitiveValueSetter;
    };

    private setPrimitiveValueProp = (opts: {
      parentObject: Record<string, any>;
      propName: string;
      smDataForThisProp: ISMData;
      parsedDataForParent: Record<string, any>;
    }) => {
      Object.defineProperty(opts.parentObject, opts.propName, {
        configurable: true,
        enumerable: true,
        get: () => {
          return opts.parsedDataForParent[opts.propName];
        },
        set: this.getPrimitiveValueSetter(opts),
      });
    };

    private getArrayValueSetter = (opts: {
      smDataForThisProp: ISMData<any, any, ISMData>;
      propName: string;
      parsedDataForParent: Record<string, any>;
    }) => {
      const ArrayValueSetter = (newVal: any) => {
        if (newVal == null) {
          opts.parsedDataForParent[opts.propName] = newVal;
          return;
        }

        const newState = {
          ...opts.parsedDataForParent,
          [opts.propName]: newVal ?? this._defaults[opts.propName],
        };

        extend({
          object: opts.parsedDataForParent,
          extension: newState,
          deleteKeysNotInExtension: false,
          extendNestedObjects: false,
        });

        opts.parsedDataForParent[opts.propName] = newVal.map(
          opts.smDataForThisProp.boxedValue.parser
        );
      };

      return ArrayValueSetter;
    };

    private setArrayProp = (opts: {
      parentObject: Record<string, any>;
      propName: string;
      smDataForThisProp: ISMData;
      parsedDataForParent: Record<string, any>;
    }) => {
      Object.defineProperty(opts.parentObject, opts.propName, {
        configurable: true,
        enumerable: true,
        get: () => {
          return opts.parsedDataForParent[opts.propName];
        },
        set: this.getArrayValueSetter(opts),
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
  };
}
