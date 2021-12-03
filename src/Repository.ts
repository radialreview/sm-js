import {
  NULL_TAG,
  parseJSONFromBE,
  prepareValueForFE,
} from './dataConversions';
import { SMNotCachedException, SMDataParsingException } from './exceptions';
import { SM_DATA_TYPES, IS_NULL_IDENTIFIER } from './smDataTypes';

/**
 * Returns an initialized instance of a repository for an SMNode
 */
export function RepositoryFactory<
  TNodeData extends Record<string, ISMData | TSMDataDefaultFn>
>(opts: {
  def: {
    type: string;
    properties: TNodeData;
  };
  DOClass: new (initialData?: Record<string, any>) => NodeDO;
}): ISMNodeRepository {
  // silences the error "A class can only implement an object type or intersection of object types with statically known members."
  // wich happens because NodeDO has non statically known members (each property on a node in SM is mapped to a non-statically known property on the DO)
  // eslint-disable-next-line
  // @ts-ignore
  class Repository implements ISMNodeRepository {
    private cached: Record<string, NodeDO> = {};

    public onDataReceived(data: { id: string } & Record<string, any>) {
      const cached = this.cached[data.id];

      const parsedData = this.parseDataFromSM<TNodeData>(data);

      if (cached) {
        cached.onDataReceived(parsedData);
      } else {
        this.cached[data.id] = new opts.DOClass(parsedData);
      }
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
      delete this.cached[id];
    }
    /**
     * This method takes data that comes in from SM and is about to be applied to this DO's instance. It needs to:
     * 1) ignore data not specified in the smNode definition for this node
     *     this is so that the querier in smDataContext can call onDataReceived on the DO with the data it receives from SM without having to ignore the relational aliases there
     *     without doing this, we'd get errors about attempting to set a property on a DO which is read only
     * 2) take objects spread into root properties and convert them to regular objects
     *     for example, if we are trying to store `settings: { show: true }` in SM, what is actually stored in the DB is
     *     settings_show: 'true'
     *     since all data must be a string (we don't need to worry about coercing strings to booleans or numbers though, that's handled by the smDataTypes)
     */
    private parseDataFromSM<
      TNodeData extends Record<string, ISMData | TSMDataDefaultFn>
    >(
      receivedData: any
    ): { id: string } & DeepPartial<GetExpectedNodeDataType<TNodeData>> {
      const oldStyleObjects: Record<string, any> = {};
      return Object.keys(receivedData).reduce((parsed, key: string) => {
        // point 1) above
        const isDataStoredOnTheNode = key.includes('_')
          ? Object.keys(opts.def.properties).includes(key.split('_')[0])
          : Object.keys(opts.def.properties).includes(key);

        const isNullIdentifierProp = key.endsWith(IS_NULL_IDENTIFIER);
        if (!isDataStoredOnTheNode || isNullIdentifierProp) return parsed;

        const isObjectData =
          key.includes('_') ||
          (opts.def.properties[key] as ISMData).type === SM_DATA_TYPES.object ||
          (opts.def.properties[key] as ISMData).type ===
            SM_DATA_TYPES.maybeObject;

        const isArrayData =
          !isObjectData &&
          ((opts.def.properties[key] as ISMData).type === SM_DATA_TYPES.array ||
            (opts.def.properties[key] as ISMData).type ===
              SM_DATA_TYPES.maybeArray);

        // point 2 above
        if (isObjectData) {
          const [root, ...nests] = key.split('_');

          // was set to __NULL__ which means this
          // node is using the old style of storing nested objects
          if (receivedData[root] === NULL_TAG) {
            parsed[root as keyof TNodeData] = null as any;
            return parsed;
          } else if (receivedData[root] != null) {
            // this node has the root property of this nested object defined
            // which means it's still using the old style of storing nested objects
            //
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

          const isMarkedNull = receivedData[`${root}${IS_NULL_IDENTIFIER}`];
          if (
            // if using the old style of storing json data and the root prop is set to null
            (isMarkedNull === null && receivedData[root] == null) ||
            // or if using the new style of storing json data and marked null
            isMarkedNull === true
          ) {
            parsed[root as keyof TNodeData] = null as any;
            return parsed;
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

          if (parsed[root] == null) parsed[root as keyof TNodeData] = {} as any;

          this.nest({
            nests,
            root: parsed[root] as Record<string, any>,
            val: receivedData[key],
          });

          return parsed;
        } else if (isArrayData) {
          parsed[key as keyof TNodeData] = prepareValueForFE(receivedData[key]);
          return parsed;
        } else {
          parsed[key as keyof TNodeData] = receivedData[key];
          return parsed;
        }
      }, {} as { id: string } & DeepPartial<GetExpectedNodeDataType<TNodeData>>);
    }

    private getOnlyQueriedData(opts: {
      allDataReceived: Record<string, any>;
      dataPreviouslyParsedForThisObject: Record<string, any>;
      rootProp: string;
    }) {
      const newStylePropertiesQueriedForThisObject = Object.keys(
        opts.allDataReceived
      ).filter(
        key =>
          key.startsWith(`${opts.rootProp}_`) &&
          !key.endsWith(IS_NULL_IDENTIFIER)
      );

      return newStylePropertiesQueriedForThisObject.reduce((acc, prop) => {
        const [root, ...nests] = prop.split('_');

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

    // with a "prop" in the format root_nestedKey_evenMoreNestedKey
    // returns the correct value from an "object" of previously parsed data { root: { nestedKey: { evenMoreNestedKey: true } } }
    private getDataForProp(opts: {
      object: Record<string, any>;
      prop: string;
    }): any {
      if (opts.object == null) {
        return undefined; // the prop is not set on the object at all
      }

      if (opts.prop.includes('_')) {
        const [root, ...rest] = opts.prop.split('_');
        return this.getDataForProp({
          object: opts.object[root],
          prop: rest.join('_'),
        });
      }

      return opts.object[opts.prop];
    }

    private nest(opts: {
      nests: Array<string>;
      root: Record<string, any>;
      val: any;
    }) {
      if (opts.nests.length === 0) {
        opts.root = opts.val;
      } else if (opts.nests.length === 1) {
        const nextNest = opts.nests[0];
        opts.root[nextNest] = opts.val;
      } else {
        const [nextNest, ...reaminingNests] = opts.nests;
        if (opts.root[nextNest] == null) opts.root[nextNest] = {};

        this.nest({
          nests: reaminingNests,
          root: opts.root[nextNest],
          val: opts.val,
        });
      }
    }
  }

  // eslint-disable-next-line
  // @ts-ignore
  return new Repository();
}
