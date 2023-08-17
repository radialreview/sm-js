import { Maybe } from './types';

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

export function arrayEquals<T extends Array<any>>(arr1: T, arr2: T) {
  if (arr1.length !== arr2.length) return false;
  return !arr1.find((el, index) => arr2[index] !== el);
}

//NOLEY TODO: if you can get around formating error, use inline snapshot instead
export const keys = Object.keys as <T>(o: T) => Extract<keyof T, string>[];

export function isDeepEqual<T extends Record<string, any>>(
  obj1: Maybe<T>,
  obj2: Maybe<T>
): boolean {
  if (!obj1 || !obj2) return false;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  // quick and dirty check
  // if they don't have the same keys, they can't be deep equal
  if (!arrayEquals(keys(obj1), keys(obj2))) return false;

  for (const key in obj1) {
    const valueInObj1 = obj1[key];
    const valueInObj2 = obj2[key];

    if (valueInObj1 == null || typeof valueInObj1 !== 'object') {
      // if the values in one of the objects is null or not an object, it's safe to use strict equality
      if (valueInObj1 !== valueInObj2) return false;
    } else if (typeof valueInObj1 !== typeof valueInObj2) {
      // if the values are different types the objects are definitely not deep equal
      return false;
    } else {
      // otherwise, value in obj1 is an object
      // if value in obj2 is not, they are not deep equal
      if (typeof valueInObj2 !== 'object') return false;

      const valueInObj1IsArray = Array.isArray(valueInObj1);
      const valueInObj2IsArray = Array.isArray(valueInObj2);

      // if one is an array and another is not, they are not deep equal
      if (valueInObj2IsArray !== valueInObj1IsArray) return false;
      else if (valueInObj1IsArray && valueInObj2IsArray) {
        // if they are both arrays but are not shallow equal, the objects are not deep equal
        if (!arrayEquals(valueInObj1, valueInObj2)) return false;
      }

      // otherwise both values are nested objects, return false if they are not deep equal
      if (!isDeepEqual(valueInObj1, valueInObj2)) return false;
    }
  }

  return true;
}
