import { OBJECT_IDENTIFIER, OBJECT_PROPERTY_SEPARATOR } from '../smDataTypes';
import { Maybe } from '../types';
import { AdditionalEdgeProperties } from './edges/types';

export const JSON_TAG = '__JSON__';

/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @returns stringified params ready for mutation
 */
export function convertNodeDataToSMPersistedData(
  nodeData: Record<string, any>,
  opts?: { skipBooleanStringWrapping?: boolean }
): string {
  const parsedData = prepareForBE(nodeData);

  const stringified = Object.entries(parsedData).reduce(
    (acc, [key, value], i) => {
      if (i > 0) {
        acc += '\n';
      }
      if (key === 'childNodes' || key === 'additionalEdges') {
        return acc + `${key}: [\n{\n${value.join('\n}\n{\n')}\n}\n]`;
      }

      const shouldBeRawBoolean =
        (value === 'true' || value === 'false') &&
        !!opts?.skipBooleanStringWrapping;

      return (
        acc +
        `${key}: ${value === null || shouldBeRawBoolean ? value : `"${value}"`}`
      );
    },
    ``
  );
  return stringified;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Takes an object node value and flattens it to be sent to SM
 *
 * @param obj an object with arbitrary data
 * @param parentKey if the value is a nested object, the key of the parent is passed in order to prepend it to the child key
 * @param omitObjectIdentifier skip including __object__ for identifying parent objects,
 *  used to construct filters since there we don't care what the parent property is set to
 * @returns a flat object where the keys are of "key__dot__value" syntax
 *
 * For example:
 * ```typescript
 * const obj = {settings: {schedule: {day: 'Monday'} } }
 *  const result = prepareValueForBE(obj)
 * ```
 * The result will be:
 *  ```typescript
 *  {
 * settings: '__object__',
 * settings__dot__schedule: '__object__',
 * settings__dot__schedule__dot__day: 'Monday',
 * }
 * ```
 */
export function prepareObjectForBE(
  obj: Record<string, any>,
  opts?: {
    parentKey?: string;
    omitObjectIdentifier?: boolean;
  }
) {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const preparedKey = opts?.parentKey
      ? `${opts.parentKey}${OBJECT_PROPERTY_SEPARATOR}${key}`
      : key;

    if (typeof val === 'object' && val != null && !Array.isArray(val)) {
      if (!opts || !opts.omitObjectIdentifier) {
        acc[preparedKey] = OBJECT_IDENTIFIER;
      }

      acc = {
        ...acc,
        ...Object.entries(val).reduce((acc, [key, val]) => {
          return {
            ...acc,
            ...convertPropertyToBE({
              key: `${preparedKey}${OBJECT_PROPERTY_SEPARATOR}${key}`,
              value: val,
            }),
          };
        }, {}),
      };
    } else {
      acc = {
        ...acc,
        ...convertPropertyToBE({
          key: preparedKey,
          value: val,
        }),
      };
    }

    return acc;
  }, {} as Record<string, any>);
}

function convertPropertyToBE(opts: {
  key: string;
  value: any;
}): Record<string, Maybe<string | boolean>> {
  if (opts.value === null) {
    return { [opts.key]: null };
  } else if (Array.isArray(opts.value)) {
    return {
      [opts.key]: `${JSON_TAG}${escapeText(JSON.stringify(opts.value))}`,
    };
  } else if (typeof opts.value === 'object') {
    return prepareObjectForBE({ [opts.key]: opts.value });
  } else if (typeof opts.value === 'string') {
    return { [opts.key]: escapeText(opts.value) };
  } else if (
    typeof opts.value === 'boolean' ||
    typeof opts.value === 'number'
  ) {
    if (typeof opts.value === 'number' && isNaN(opts.value)) {
      return { [opts.key]: null };
    }
    return { [opts.key]: String(opts.value) };
  } else {
    throw Error(
      `I don't yet know how to handle feData of type "${typeof opts.value}"`
    );
  }
}

function convertEdgeDirectionNames(edgeItem: AdditionalEdgeProperties) {
  if (edgeItem.hasOwnProperty('to')) {
    const { to, ...restOfEdgeItem } = edgeItem;

    return {
      ...restOfEdgeItem,
      targetId: to,
    };
  } else if (edgeItem.hasOwnProperty('from')) {
    const { from, ...restOfEdgeItem } = edgeItem;

    return {
      ...restOfEdgeItem,
      sourceId: edgeItem.from,
    };
  }
  throw new Error('convertEdgeDirectionNames - received invalid data');
}

function prepareForBE(obj: Record<string, any>) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (key === 'childNodes') {
      if (!Array.isArray(value)) {
        throw new Error(`"childNodes" is supposed to be an array`);
      }

      return {
        ...acc,
        childNodes: value.map(item => convertNodeDataToSMPersistedData(item)),
      };
    }

    if (key === 'additionalEdges') {
      if (!Array.isArray(value)) {
        throw new Error(`"additionalEdges" is supposed to be an array`);
      }
      return {
        ...acc,
        additionalEdges: value.map(item =>
          convertNodeDataToSMPersistedData(convertEdgeDirectionNames(item), {
            skipBooleanStringWrapping: true,
          })
        ),
      };
    }

    return {
      ...acc,
      ...convertPropertyToBE({ key, value }),
    };
  }, {} as Record<string, any>);
}
