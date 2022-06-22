import { isArray, isObject } from 'lodash';
import { FILTER_OPERATORS } from './consts';
import {
  FilterOperator,
  FilterValue,
  ISMNode,
  ValidFilterForNode,
} from './types';

/**
 * Clones an object or array. Recurses into nested objects and arrays for deep clones.
 */
export function deepClone<T extends Record<string, any> | Array<any>>(
  obj: T
): T {
  if (typeof obj !== 'object' || obj === null || obj === undefined) {
    return obj; // return the value if obj is not an object
  }

  if (Array.isArray(obj)) {
    const outputArray = ([] as unknown) as T;

    obj.forEach((item: any) => outputArray.push(deepClone(item)));

    return outputArray;
  } else {
    const outputObject = ({} as unknown) as T;
    for (const key in obj) {
      outputObject[key] = deepClone(obj[key]);
    }

    return outputObject;
  }
}

// clear an object (and nested objects)
// by deleting all of its props
export function clearObject(opts: { object: Record<string, any> }) {
  Object.keys(opts.object).forEach(objectProp => {
    if (typeof opts.object[objectProp] === 'object') {
      clearObject({ object: opts.object[objectProp] });
    } else {
      delete opts.object[objectProp];
    }
  });
}

// extend an object by mutating its props in place
// based on the values received in "extension"
export function extend(opts: {
  object: Record<string, any>;
  extension: Record<string, any>;
  deleteKeysNotInExtension: boolean;
  extendNestedObjects: boolean;
}) {
  const handledExtensionProps: Array<string> = [];

  // first loop over every key in the object to extend and
  // 1) if opts.deleteKeysNotInExtension, delete properties not in the extension object, whilst avoiding deleting nested objects within the object we're extending
  //    - clear those objects by deleting all properties instead
  // 2) copy properties that did get included in the extension value to the object being extended, whilst avoiding altering the reference to a nested object
  //    - extend those nested objects by calling this function recursively instead
  Object.keys(opts.object).forEach(objectProp => {
    const extensionValue = opts.extension[objectProp];

    if (extensionValue === undefined) {
      if (!opts.deleteKeysNotInExtension) return;

      if (
        opts.object[objectProp] != null &&
        typeof opts.object[objectProp] === 'object'
      ) {
        clearObject({ object: opts.object[objectProp] });
      } else {
        delete opts.object[objectProp];
      }
    } else {
      handledExtensionProps.push(objectProp);

      if (
        extensionValue != null &&
        typeof extensionValue === 'object' &&
        !Array.isArray(extensionValue)
      ) {
        if (opts.extendNestedObjects) {
          opts.object[objectProp] = opts.object[objectProp] || {};
          extend({
            object: opts.object[objectProp] || {},
            extension: extensionValue,
            deleteKeysNotInExtension: opts.deleteKeysNotInExtension,
            extendNestedObjects: true,
          });
        } else {
          opts.object[objectProp] = extensionValue;
        }
      } else {
        opts.object[objectProp] = extensionValue;
      }
    }
  });

  // then loop over every key in the extension that hasn't yet been handled in the loop above
  Object.keys(opts.extension)
    .filter(key => !handledExtensionProps.includes(key))
    .forEach(extensionProp => {
      const extensionValue = opts.extension[extensionProp];

      if (
        extensionValue != null &&
        typeof extensionValue === 'object' &&
        !Array.isArray(extensionValue)
      ) {
        if (opts.extendNestedObjects) {
          opts.object[extensionProp] = opts.object[extensionProp] || {};
          extend({
            object: opts.object[extensionProp],
            extension: extensionValue,
            deleteKeysNotInExtension: opts.deleteKeysNotInExtension,
            extendNestedObjects: true,
          });
        } else {
          opts.object[extensionProp] = extensionValue;
        }
      } else {
        opts.object[extensionProp] = extensionValue;
      }
    });
}

/**
 * Returns all the keys of the object in a dot(.) separate format.
 *
 * Example.
 *
 * ```
 * getFlattenedObjectKeys({
 *  user: {
 *    firstName: 'John',
 *    lastName: 'Doe',
 *    meetings: [1,2,3],
 *    company: {
 *      name: 'Acme'
 *    }
 *  }
 * })
 * ```
 *
 * will return
 * ```
 * ['user.firstName', 'user.lastName', 'user.meetings', 'user.company.name']
 * ```
 *
 * Note: This won't flatten any array values
 *
 * @param obj - Object to flatten
 */
export function getFlattenedObjectKeys(obj: Record<string, any>) {
  const valuesByKeyPath = [];
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) continue;

    // Exclude array values to prevent returning keys with array indexes
    if (isObject(obj[prop]) && !isArray(obj[prop]) && obj[prop] !== null) {
      const flatObject: any = getFlattenedObjectKeys(obj[prop]);
      for (let idx = 0; idx < flatObject.length; idx++) {
        valuesByKeyPath.push(`${prop}.${flatObject[idx]}`);
      }
    } else {
      valuesByKeyPath.push(prop);
    }
  }
  return valuesByKeyPath;
}

/**
 * Returns flattened keys of the filter object
 *
 * ```
 * getFlattenedNodeFilterObject({
 *  settings: {
 *    time: {_lte: Date.now()},
 *    nested: {
 *      prop: {_contains: "text"}
 *    }
 *  },
 *  firstName: {_eq: 'John'}
 * })
 * ```
 *
 * Returns
 *
 * ```
 * {
 *  "settings.time": {_lte: Date.now()},
 *  "settings.nested.prop": {_contains: "text"},
 *  "firstName": {_eq: 'John'}
 * }
 * ```
 * @param filterObject : ;
 * @returns
 */
export function getFlattenedNodeFilterObject<TSMNode extends ISMNode>(
  filterObject: ValidFilterForNode<TSMNode>
) {
  const result: Record<string, FilterValue<any>> = {};

  for (const i in filterObject) {
    const value = filterObject[i] as any;
    const valueIsNotAFilterCondition = FILTER_OPERATORS.every(
      condition => isObject(value) && !value.hasOwnProperty(condition)
    );
    if (
      typeof filterObject[i] == 'object' &&
      filterObject[i] !== null &&
      valueIsNotAFilterCondition
    ) {
      const flatObject = getFlattenedNodeFilterObject(value);
      for (const x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        result[i + '.' + x] = flatObject[x];
      }
    } else {
      if (isObject(value)) {
        result[i] = value;
      } else {
        const filter: Partial<Record<FilterOperator, any>> = {
          _eq: value,
        };
        result[i] = filter;
      }
    }
  }
  return result;
}
