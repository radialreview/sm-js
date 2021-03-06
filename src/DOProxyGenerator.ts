import { PROPERTIES_QUERIED_FOR_ALL_NODES } from './consts';
import {
  SMNotUpToDateException,
  SMNotUpToDateInComputedException,
} from './exceptions';
import { OBJECT_PROPERTY_SEPARATOR } from './smDataTypes';
import {
  ISMJS,
  ISMData,
  SMDataDefaultFn,
  IDOProxy,
  ISMNode,
  NodeDO,
  Maybe,
  RelationalQueryRecordEntry,
  SM_DATA_TYPES,
} from './types';

export function createDOProxyGenerator(smJSInstance: ISMJS) {
  /**
   * When some data fetcher like "useQuery" requests some data we do not directly return the DO instances
   * Instead, we decorate each DO instance with a bit of functionality
   * Firstly, we add getters for relational results
   *      For example, if I request a list of todos and an assignee for each of those todos
   *        this proxy generator would be adding an "assignee" getter to each todo and
   *        that assignee getter would return a PROXIED DO for that user
   *
   * Why not just store that data on the do instance directly?
   *      For this case I just described it wouldn't be a problem, since a todo has a single assignee
   *      But imagine a scenario in which a developer is querying for a specific meeting and all active todos in that meeting
   *        and then lazily querying all the archived todos for that meeting.
   *        If the developer isn't extremely careful with naming collision (activeTodos vs archivedTodos distinction, vs just calling them "todos")
   *        it's easy to see how this would create a problem if both query sources are getting the same DO instance
   *
   *      To get around this problem, EACH REQUEST RESULT WILL RETURN ITS OWN INSTANCE OF A PROXIED DO
   *         so naming collision is never a problem.
   *
   *      This also gives us the benefit of support different paging results being displayed simultaneously, since again, the relation results from different
   *         queries will never overwrite each other.
   *
   *
   * Another use for this proxy is to ensure the developer receives helpful errors when they try to read some data that is not being subscribed to
   *      This means that if I query a list of users, request their "firstName" and "id", but then attempt to read user.lastName from the result of that query
   *      we don't just return the cached value, or undefined, because this is likely unintentional. Most apps will want to have real time data.
   *
   *      Instead, we'll throw an error and tell them - hey, you tried to read this property from this node type in this query, but you didn't request it/aren't subscribed to it!
   */
  return function DOProxyGenerator<
    TNodeType extends string,
    TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
    TNodeComputedData extends Record<string, any>,
    TRelationalResults extends Record<string, Array<IDOProxy> | IDOProxy>
  >(opts: {
    node: ISMNode<TNodeType, TNodeData, TNodeComputedData>;
    queryId: string;
    do: NodeDO;
    // The DOProxy protects the dev from reading a property that we haven't actually queried from SM
    allPropertiesQueried: Array<string>;
    relationalResults: Maybe<TRelationalResults>;
    relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
  }): NodeDO & TRelationalResults & IDOProxy {
    let relationalResults = opts.relationalResults;

    // Casting to unknown here because we don't want type safety around structure of a node's data when building plugins
    // but completely losing type safety in opts.node.smComputed would break the return type inference in QueryDataReturn
    const nodeSMComputed = (opts.node.smComputed as unknown) as Record<
      string,
      (proxy: IDOProxy) => any
    >;
    const computedAccessors = nodeSMComputed
      ? Object.keys(nodeSMComputed).reduce((acc, computedKey) => {
          let computedFn = () => nodeSMComputed[computedKey](proxy as IDOProxy);
          smJSInstance.plugins?.forEach(plugin => {
            if (plugin.DOProxy?.computedDecorator) {
              computedFn = plugin.DOProxy.computedDecorator({
                ProxyInstance: proxy,
                computedFn,
              });
            }
          });

          acc[computedKey] = computedFn;

          return acc;
        }, {} as Record<string, () => any>)
      : {};

    const proxy = new Proxy(opts.do as Record<string, any>, {
      getOwnPropertyDescriptor: function(target, key: string) {
        // This gives better json stringify results
        // by preventing attempts to get properties which are not
        // guaranteed to be up to date
        if (
          opts.allPropertiesQueried.includes(key) ||
          (opts.relationalQueries &&
            Object.keys(opts.relationalQueries).includes(key)) ||
          PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)
        ) {
          return {
            ...Object.getOwnPropertyDescriptor(target, key),
            enumerable: true,
          };
        }

        // enumerate computed properties which have all the data they need queried
        // otherwise they throw SMNotUpToDateException and we don't enumerate
        if (nodeSMComputed && Object.keys(nodeSMComputed).includes(key)) {
          try {
            computedAccessors[key]();
            return {
              ...Object.getOwnPropertyDescriptor(target, key),
              enumerable: true,
            };
          } catch (e) {
            if (!(e instanceof SMNotUpToDateException)) throw e;

            return {
              ...Object.getOwnPropertyDescriptor(target, key),
              enumerable: false,
            };
          }
        }

        return {
          ...Object.getOwnPropertyDescriptor(target, key),
          enumerable: false,
        };
      },
      get: (target, key: string) => {
        if (key === 'updateRelationalResults') {
          return (newRelationalResults: Maybe<TRelationalResults>) => {
            relationalResults = {
              ...relationalResults,
              ...newRelationalResults,
            } as Maybe<TRelationalResults>;
          };
        }

        if (
          relationalResults &&
          opts.relationalQueries &&
          Object.keys(relationalResults).includes(key)
        ) {
          // SM returns an array when "byReference" is used
          // but we only care about the first result
          if ('byReference' in opts.relationalQueries[key]) {
            const results = relationalResults[key];
            if (!Array.isArray(results))
              throw Error(`Expected results to be an array but it wasn't`);
            return results[0];
          }
          return relationalResults[key];
        }

        if (Object.keys(opts.node.smData).includes(key)) {
          if (!opts.allPropertiesQueried.includes(key)) {
            throw new SMNotUpToDateException({
              propName: key,
              queryId: opts.queryId,
              nodeType: opts.node.type,
            });
          }

          const smDataForThisProp = opts.node.smData[key] as ISMData;
          if (
            smDataForThisProp.type === SM_DATA_TYPES.object ||
            smDataForThisProp.type === SM_DATA_TYPES.maybeObject
          ) {
            // do not return an object if this prop came back as null from SM
            if (opts.do[key] == null) return opts.do[key];

            return getNestedObjectWithNotUpToDateProtection({
              nodeType: opts.node.type,
              queryId: opts.queryId,
              allCachedData: opts.do[key],
              smDataForThisObject: smDataForThisProp.boxedValue,
              allPropertiesQueried: opts.allPropertiesQueried,
              parentObjectKey: key,
            });
          }

          return opts.do[key];
        } else if (computedAccessors[key]) {
          try {
            return computedAccessors[key]();
          } catch (e) {
            if (e instanceof SMNotUpToDateException) {
              throw new SMNotUpToDateInComputedException({
                computedPropName: key,
                propName: e.propName,
                nodeType: opts.node.type,
                queryId: opts.queryId,
              });
            }

            throw e;
          }
        }

        return target[key];
      },
    }) as NodeDO & TRelationalResults & IDOProxy;

    return proxy;
  };

  function getNestedObjectWithNotUpToDateProtection(opts: {
    nodeType: string;
    queryId: string;
    allCachedData: Record<string, any>;
    smDataForThisObject: Record<string, ISMData>;
    allPropertiesQueried: Array<string>;
    parentObjectKey: Maybe<string>;
  }) {
    const objectToReturn = {};

    Object.keys(opts.smDataForThisObject).forEach(objectProp => {
      const name = opts.parentObjectKey
        ? `${opts.parentObjectKey}${OBJECT_PROPERTY_SEPARATOR}${objectProp}`
        : objectProp;
      const smDataForThisProp = opts.smDataForThisObject[objectProp];
      const isUpToDate =
        opts.allPropertiesQueried.includes(name) ||
        // this second case handles ensuring that nested objects are enumerable
        // for example, if user matches the interface { address: { apt: { floor: number, unit: number } } }
        // and we request address_apt_floor and address_apt_unit
        // we need to make address.apt enumerable below
        opts.allPropertiesQueried.some(prop => prop.startsWith(name));

      Object.defineProperty(objectToReturn, objectProp, {
        // @TODO write tests for this enumeration
        enumerable: isUpToDate,
        get: () => {
          if (
            smDataForThisProp.type === SM_DATA_TYPES.object ||
            smDataForThisProp.type === SM_DATA_TYPES.maybeObject
          ) {
            if (opts.allCachedData[objectProp] == null)
              return opts.allCachedData[objectProp];

            return getNestedObjectWithNotUpToDateProtection({
              nodeType: opts.nodeType,
              queryId: opts.queryId,
              allCachedData: opts.allCachedData[objectProp],
              smDataForThisObject: smDataForThisProp.boxedValue,
              allPropertiesQueried: opts.allPropertiesQueried,
              parentObjectKey: name,
            });
          }

          if (!isUpToDate) {
            throw new SMNotUpToDateException({
              propName: name,
              nodeType: opts.nodeType,
              queryId: opts.queryId,
            });
          }

          return opts.allCachedData
            ? opts.allCachedData[objectProp]
            : undefined;
        },
      });
    });

    return objectToReturn;
  }
}
