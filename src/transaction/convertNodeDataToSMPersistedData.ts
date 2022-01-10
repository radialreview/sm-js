import { OBJECT_IDENTIFIER, OBJECT_PROPERTY_SEPARATOR } from '../smDataTypes';
import { NodeData } from './types';

export const JSON_TAG = '__JSON__';

/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @returns stringified params ready for mutation
 */
export function convertNodeDataToSMPersistedData(nodeData: NodeData): string {
  const parsedData = Object.entries(nodeData).reduce((acc, [key, value]) => {
    if (key === 'childNodes') {
      if (!Array.isArray(value)) {
        throw new Error(`"childNodes" is supposed to be an array`);
      }

      return {
        ...acc,
        childNodes: value.map(item => convertNodeDataToSMPersistedData(item)),
      };
    }

    return {
      ...acc,
      ...prepareForBE({ key, value }),
    };
  }, {} as Record<string, any>);

  const stringified = Object.entries(parsedData).reduce(
    (acc, [key, value], i) => {
      if (i > 0) {
        acc += '\n';
      }
      if (key === 'childNodes') {
        return acc + `${key}: [\n{\n${value.join('\n}\n{\n')}\n}\n]`;
      }
      return acc + `${key}: ${value === null ? value : `"${value}"`}`;
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

function prepareForBE(opts: {
  key: string;
  value: any;
}): Record<string, Maybe<string>> {
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

/**
 * Takes an object node value and flattens it to be sent to SM
 *
 * @param obj an object with arbitrary data
 * @param parentKey if the value is a nested object, the key of the parent is passed in order to prepend it to the child key
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
function prepareObjectForBE(obj: Record<string, any>, parentKey?: string) {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const preparedKey = parentKey
      ? `${parentKey}${OBJECT_PROPERTY_SEPARATOR}${key}`
      : key;

    if (typeof val === 'object' && val != null) {
      acc[preparedKey] = OBJECT_IDENTIFIER;
      acc = { ...acc, ...prepareObjectForBE(val, preparedKey) };
    } else {
      acc[preparedKey] = val;
    }

    return acc;
  }, {} as Record<string, any>);
}
