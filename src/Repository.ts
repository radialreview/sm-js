import {
  JSON_TAG,
  NULL_TAG,
  parseJSONFromBE,
  prepareValueForFE,
} from './dataConversions';
import { SMNotCachedException, SMDataParsingException } from './exceptions';
import { PROPERTIES_QUERIED_FOR_ALL_NODES } from './queryDefinitionAdapters';
import {
  SM_DATA_TYPES,
  OBJECT_PROPERTY_SEPARATOR,
  OBJECT_IDENTIFIER,
} from './smDataTypes';
import {
  ISMData,
  SMDataDefaultFn,
  NodeDO,
  ISMNodeRepository,
  DeepPartial,
  GetExpectedNodeDataType,
} from './types';

/**
 * Returns an initialized instance of a repository for an SMNode
 */
export function RepositoryFactory<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>
>(opts: {
  def: {
    type: string;
    properties: TNodeData;
  };
  DOClass: new (initialData?: Record<string, any>) => NodeDO;
  onDataReceived(opts: {
    data: { id: string } & Record<string, any>;
    applyUpdateToDO: () => void;
  }): void;
  onDOConstructed?(DO: NodeDO): void;
  onDODeleted?(DO: NodeDO): void;
}): ISMNodeRepository {
  // silences the error "A class can only implement an object type or intersection of object types with statically known members."
  // wich happens because NodeDO has non statically known members (each property on a node in SM is mapped to a non-statically known property on the DO)
  // eslint-disable-next-line
  // @ts-ignore
  class Repository implements ISMNodeRepository {
    private cached: Record<string, NodeDO> = {};

    public onDataReceived(
      data: { id: string; type: string } & Record<string, any>
    ) {
      if (opts.def.type !== data.type) {
        throw Error(
          `Attempted to query a node with an id belonging to a different type - Expected: ${opts.def.type} Received: ${data.type}`
        );
      }
      const cached = this.cached[data.id];

      const parsedData = this.parseDataFromSM<TNodeData>(data);

      if (!cached) {
        const newDO = new opts.DOClass(parsedData);
        this.cached[data.id] = newDO;
        opts.onDOConstructed && opts.onDOConstructed(newDO);
      }

      // applyUpdateToDO is called conditionally by OptimisticUpdatesOrchestrator
      // see comments in that class to understand why
      opts.onDataReceived({
        data: parsedData,
        applyUpdateToDO: () => {
          // if there was no cached node it was already initialized with this data
          // calling onDataReceived again would be wasted CPU cycles
          cached && cached.onDataReceived(parsedData);
        },
      });
    }

    public byId(id: string) {
      const cached = this.cached[id];

      if (!cached) {
        throw new SMNotCachedException({
          nodeType: opts.def.type,
          id,
        });
      }

      return cached;
    }

    public onNodeDeleted(id: string) {
      if (this.cached[id]) {
        if (opts.onDODeleted) {
          opts.onDODeleted(this.cached[id]);
        }
        delete this.cached[id];
      }
    }
    /**
     * This method takes data that comes in from SM and is about to be applied to this DO's instance. It needs to:
     * 1) ignore data not specified in the smNode definition for this node
     *     this is so that the querier in smDataContext can call onDataReceived on the DO with the data it receives from SM without having to ignore the relational aliases there
     *     without doing this, we'd get errors about attempting to set a property on a DO which is read only
     * 2) take objects spread into root properties and convert them to regular objects
     *     for example, if we are trying to store `settings: { show: true }` in SM, what is actually stored in the DB is
     *     settings__dot__show: 'true'
     *     since all data must be a string (we don't need to worry about coercing strings to booleans or numbers though, that's handled by the smDataTypes)
     */
    private parseDataFromSM<
      TNodeData extends Record<string, ISMData | SMDataDefaultFn>
    >(
      receivedData: any
    ): { id: string; version: number } & DeepPartial<
      GetExpectedNodeDataType<TNodeData, {}>
    > {
      const oldStyleObjects: Record<string, any> = {};
      return Object.keys(receivedData).reduce((parsed, key: string) => {
        const isDataStoredOnAllNodes = PROPERTIES_QUERIED_FOR_ALL_NODES.includes(
          key
        );
        if (isDataStoredOnAllNodes) {
          return {
            ...parsed,
            [key]: receivedData[key],
          };
        }

        // point 1) above
        const isDataStoredOnTheNode = key.includes(OBJECT_PROPERTY_SEPARATOR)
          ? Object.keys(opts.def.properties).includes(
              key.split(OBJECT_PROPERTY_SEPARATOR)[0]
            )
          : Object.keys(opts.def.properties).includes(key);

        if (!isDataStoredOnTheNode) return parsed;

        const isObjectData =
          key.includes(OBJECT_PROPERTY_SEPARATOR) ||
          (opts.def.properties[key] as ISMData).type === SM_DATA_TYPES.object ||
          (opts.def.properties[key] as ISMData).type ===
            SM_DATA_TYPES.maybeObject;

        const isArrayData = (() => {
          if (isObjectData) {
            return false;
          }

          const receivedDataValue = opts.def.properties[key];

          const smDataType =
            typeof receivedDataValue === 'function'
              ? ((receivedDataValue as any)._default as ISMData).type
              : (receivedData as ISMData).type;

          return (
            smDataType === SM_DATA_TYPES.array ||
            smDataType === SM_DATA_TYPES.maybeArray
          );
        })();

        // point 2 above
        if (isObjectData) {
          const [root, ...nests] = key.split(OBJECT_PROPERTY_SEPARATOR);

          // it it was set to __NULL__ it means this
          // node is using the old style of storing nested objects
          if (receivedData[root] === NULL_TAG || receivedData[root] === null) {
            parsed[root as keyof TNodeData] = null as any;
            return parsed;
          } else if (
            typeof receivedData[root] === 'string' &&
            receivedData[root].startsWith(JSON_TAG)
          ) {
            // https://tractiontools.atlassian.net/browse/TT-2905
            // will ensure this would've been set to null if this object was updated
            //
            // this means 3 things
            // 1 we can acquire all the data for this object from this one property
            // 2 we have to ignore the "null" values coming in when we're querying for the new style propeties (root_nestedProperty)
            // 3 we have to ensure we only return from this object data that was queried
            //   otherwise we risk hitting the DO class with data that is not documented in the node definition, leading to errors
            try {
              oldStyleObjects[root] =
                oldStyleObjects[root] || parseJSONFromBE(receivedData[root]);
            } catch (e) {
              throw new SMDataParsingException({
                receivedData,
                message: 'Could not parse json stored in old format',
              });
            }
          }

          if (oldStyleObjects[root]) {
            parsed[root as keyof TNodeData] =
              parsed[root] ||
              (this.getOnlyQueriedData({
                allDataReceived: receivedData,
                dataPreviouslyParsedForThisObject: oldStyleObjects[root],
                rootProp: root,
              }) as any);

            return parsed;
          }

          if (parsed[root] == null) {
            parsed[root as keyof TNodeData] = {} as any;
          }

          this.nest({
            nests,
            root: parsed[root] as Record<string, any>,
            val:
              receivedData[key] === OBJECT_IDENTIFIER ? {} : receivedData[key],
          });

          return parsed;
        } else if (isArrayData) {
          parsed[key as keyof TNodeData] = prepareValueForFE(receivedData[key]);
          return parsed;
        } else {
          parsed[key as keyof TNodeData] = receivedData[key];
          return parsed;
        }
      }, {} as { id: string; version: number } & DeepPartial<GetExpectedNodeDataType<TNodeData, {}>>);
    }

    private getOnlyQueriedData(opts: {
      allDataReceived: Record<string, any>;
      dataPreviouslyParsedForThisObject: Record<string, any>;
      rootProp: string;
    }) {
      const newStylePropertiesQueriedForThisObject = Object.keys(
        opts.allDataReceived
      ).filter(key =>
        key.startsWith(`${opts.rootProp}${OBJECT_PROPERTY_SEPARATOR}`)
      );

      return newStylePropertiesQueriedForThisObject.reduce((acc, prop) => {
        const [root, ...nests] = prop.split(OBJECT_PROPERTY_SEPARATOR);
        this.nest({
          nests,
          root: acc,
          val: this.getDataForProp({
            prop,
            object: { [root]: opts.dataPreviouslyParsedForThisObject },
          }),
        });

        return acc;
      }, {} as Record<string, any>);
    }

    // with a "prop" in the format root__dot__nestedKey__dot__evenMoreNestedKey
    // returns the correct value from an "object" of previously parsed data { root: { nestedKey: { evenMoreNestedKey: true } } }
    private getDataForProp(opts: {
      object: Record<string, any>;
      prop: string;
    }): any {
      if (opts.object == null) {
        return undefined; // the prop is not set on the object at all
      }

      if (opts.prop.includes(OBJECT_PROPERTY_SEPARATOR)) {
        const [root, ...rest] = opts.prop.split(OBJECT_PROPERTY_SEPARATOR);
        return this.getDataForProp({
          object: opts.object[root],
          prop: rest.join(OBJECT_PROPERTY_SEPARATOR),
        });
      }

      return opts.object[opts.prop];
    }

    private nest(opts: {
      nests: Array<string>;
      root: Record<string, any>;
      val: any;
    }) {
      const parsedVal = opts.val === NULL_TAG ? null : opts.val;

      if (opts.nests.length === 0) {
        opts.root = parsedVal;
      } else if (opts.nests.length === 1) {
        const nextNest = opts.nests[0];
        opts.root[nextNest] = parsedVal;
      } else {
        const [nextNest, ...remainingNests] = opts.nests;

        if (opts.root[nextNest] == null) {
          opts.root[nextNest] = null;
        } else {
          this.nest({
            nests: remainingNests,
            root: opts.root[nextNest],
            val: parsedVal,
          });
        }
      }
    }
  }

  // eslint-disable-next-line
  // @ts-ignore
  return new Repository();
}
