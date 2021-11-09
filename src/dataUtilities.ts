import { set, get, isArray, isObject, has } from 'lodash'

/**
 * Clones an object or array. Recurses into nested objects and arrays for deep clones.
 */
 export function deepClone<T extends Record<string, any> | Array<any>>(
  obj: T
): T {
  if (typeof obj !== 'object' || obj === null || obj === undefined) {
    return obj // return the value if obj is not an object
  }

  if (Array.isArray(obj)) {
    const outputArray = ([] as unknown) as T

    obj.forEach((item: any) => outputArray.push(deepClone(item)))

    return outputArray
  } else {
    const outputObject = ({} as unknown) as T
    for (const key in obj) {
      outputObject[key] = deepClone(obj[key])
    }

    return outputObject
  }
}


// clear an object (and nested objects)
// by deleting all of its props
export function clearObject(opts: { object: Record<string, any> }) {
  Object.keys(opts.object).forEach((objectProp) => {
    if (typeof opts.object[objectProp] === 'object') {
      clearObject({ object: opts.object[objectProp] })
    } else {
      delete opts.object[objectProp]
    }
  })
}

// extend an object by mutating its props in place
// based on the values received in "extension"
export function extend(opts: {
  object: Record<string, any>
  extension: Record<string, any>
  deleteKeysNotInExtension: boolean
  extendNestedObjects: boolean
}) {
  const handledExtensionProps: Array<string> = []

  // first loop over every key in the object to extend and
  // 1) if opts.deleteKeysNotInExtension, delete properties not in the extension object, whilst avoiding deleting nested objects within the object we're extending
  //    - clear those objects by deleting all properties instead
  // 2) copy properties that did get included in the extension value to the object being extended, whilst avoiding altering the reference to a nested object
  //    - extend those nested objects by calling this function recursively instead
  Object.keys(opts.object).forEach((objectProp) => {
    const extensionValue = opts.extension[objectProp]

    if (extensionValue === undefined) {
      if (!opts.deleteKeysNotInExtension) return

      if (
        opts.object[objectProp] != null &&
        typeof opts.object[objectProp] === 'object'
      ) {
        clearObject({ object: opts.object[objectProp] })
      } else {
        delete opts.object[objectProp]
      }
    } else {
      handledExtensionProps.push(objectProp)

      if (
        extensionValue != null &&
        typeof extensionValue === 'object' &&
        !Array.isArray(extensionValue)
      ) {
        if (opts.extendNestedObjects) {
          opts.object[objectProp] = opts.object[objectProp] || {}
          extend({
            object: opts.object[objectProp] || {},
            extension: extensionValue,
            deleteKeysNotInExtension: opts.deleteKeysNotInExtension,
            extendNestedObjects: true,
          })
        } else {
          opts.object[objectProp] = extensionValue
        }
      } else {
        opts.object[objectProp] = extensionValue
      }
    }
  })

  // then loop over every key in the extension that hasn't yet been handled in the loop above
  Object.keys(opts.extension)
    .filter((key) => !handledExtensionProps.includes(key))
    .map((extensionProp) => {
      const extensionValue = opts.extension[extensionProp]

      if (
        extensionValue != null &&
        typeof extensionValue === 'object' &&
        !Array.isArray(extensionValue)
      ) {
        if (opts.extendNestedObjects) {
          opts.object[extensionProp] = opts.object[extensionProp] || {}
          extend({
            object: opts.object[extensionProp],
            extension: extensionValue,
            deleteKeysNotInExtension: opts.deleteKeysNotInExtension,
            extendNestedObjects: true,
          })
        } else {
          opts.object[extensionProp] = extensionValue
        }
      } else {
        opts.object[extensionProp] = extensionValue
      }
    })
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
  const valuesByKeyPath = []
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) continue

    // Exclude array values to prevent returning keys with array indexes
    if (isObject(obj[prop]) && !isArray(obj[prop]) && obj[prop] !== null) {
      const flatObject: any = getFlattenedObjectKeys(obj[prop])
      for (let idx = 0; idx < flatObject.length; idx++) {
        valuesByKeyPath.push(`${prop}.${flatObject[idx]}`)
      }
    } else {
      valuesByKeyPath.push(prop)
    }
  }
  return valuesByKeyPath
}

/**
 * Extends the "object" by mutating the values
 * this can accept optional and ovewrite values to extend the "object"
 */
export function transformData(opts: {
  /** This is the original object. */
  object: Record<string, any>
  /**
   * Any value defined in this object will only be applied to the  "object"
   * if they are nullish or don't exist in the object
   */
  extensions: Record<string, any>
  /**
   * Any value defined in this object will overwrite the "object"
   */
  overwrites: Record<string, any>
  /*
   * By default, this function will add to the object any data in extensions or overwrites
   * regardless of whether they were present in the object to begin with
   *
   * By passing true here, only properties that exist in "object" are considered (including nested objects)
   */
  discardValuesNotInObject?: boolean
}) {
  const objectKeys = getFlattenedObjectKeys(opts.object)

  for (let index = 0; index < objectKeys.length; index++) {
    const property = objectKeys[index]

    if (has(opts.overwrites, property)) {
      set(opts.object, property, deepClone(get(opts.overwrites, property)))
    } else if (
      has(opts.extensions, property) &&
      get(opts.object, property) == null
    ) {
      set(opts.object, property, deepClone(get(opts.extensions, property)))
    }
  }

  if (opts.discardValuesNotInObject !== true) {
    const overwrittenProperties = getFlattenedObjectKeys(
      opts.overwrites
    ).filter((key) => !objectKeys.includes(key))
    for (let index = 0; index < overwrittenProperties.length; index++) {
      const property = overwrittenProperties[index]
      set(opts.object, property, deepClone(get(opts.overwrites, property)))
    }

    const extendedProperties = getFlattenedObjectKeys(opts.extensions).filter(
      (key) => !objectKeys.includes(key) && !overwrittenProperties.includes(key)
    )

    for (let index = 0; index < extendedProperties.length; index++) {
      const property = extendedProperties[index]
      set(opts.object, property, deepClone(get(opts.extensions, property)))
    }
  }
}
