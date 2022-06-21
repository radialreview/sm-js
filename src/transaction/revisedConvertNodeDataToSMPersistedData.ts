import {
  OBJECT_IDENTIFIER,
  OBJECT_PROPERTY_SEPARATOR,
  SMData,
} from '../smDataTypes';
import { Maybe, SMDataDefaultFn, SM_DATA_TYPES } from '../types';
import { AdditionalEdgeProperties } from './edges/types';

// NOLEY NOTES: this should be the revised version of prepareForBE that accurately handles record data.
// Goal is to have a better prepareForBE which takes in the node's data so that later on we can fix the transaction issue.
// This should fix the problem with record data:
// problem with records is they need to be stored in the old format. So like recordData: `__JSON__{'Lucas': 'iAmADefaultStringInARecord'}`,
// currently, the prepareForBE function doesn't have awareness on if the data coming in is a record or an object,
// so it is doing the __object__dot__recordData which will not work cuz we can't spread records into multiple root properties because at
// the time of querying we don't know all the properties in a record.

//NOLEY NOTES: removed all exports from this file to prevent confusion revisit
const JSON_TAG = '__JSON__';

/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @returns stringified params ready for mutation
 */
export function revisedConvertNodeDataToSMPersistedData(
  nodeData: Record<string, any>,
  ISMDataRecord: Record<string, SMData<any, any, any> | SMDataDefaultFn>, //NOLEY NOTES: consider moving this into opts, shouldn't be optional though
  opts?: { skipBooleanStringWrapping?: boolean }
): string {
  const parsedData = revisedPrepareForBE({
    obj: nodeData,
    ISMDataRecord,
  });

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
export function revisedPrepareObjectForBE(
  obj: Record<string, any>,
  ISMDataRecordForKey: SMData<any, any, any>,
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
            ...revisedConvertPropertyToBE({
              key: `${preparedKey}${OBJECT_PROPERTY_SEPARATOR}${key}`,
              value: val,
              ISMDataRecordForKey,
              ...opts,
            }),
          };
        }, {}),
      };
    } else {
      acc = {
        ...acc,
        ...revisedConvertPropertyToBE({
          key: preparedKey,
          value: val,
          ISMDataRecordForKey,
          ...opts,
        }),
      };
    }

    return acc;
  }, {} as Record<string, any>);
}

function revisedConvertPropertyToBE(opts: {
  key: string;
  value: any;
  ISMDataRecordForKey: SMData<any, any, any>;
  omitObjectIdentifier?: boolean;
}): Record<string, Maybe<string | boolean>> {
  if (opts.value === null) {
    return { [opts.key]: null };
  } else if (Array.isArray(opts.value)) {
    console.log(
      'NOLEY opts.value in converprops',
      opts.value,
      `${JSON_TAG}${escapeText(JSON.stringify(opts.value))}`
    );
    return {
      [opts.key]: `${JSON_TAG}${escapeText(JSON.stringify(opts.value))}`,
    };
  } else if (typeof opts.value === 'object') {
    if (
      opts.ISMDataRecordForKey.type === SM_DATA_TYPES.record ||
      opts.ISMDataRecordForKey.type === SM_DATA_TYPES.maybeRecord
    ) {
      console.log('NOLEY THIS IS A RECORD SUP SUP SUP', opts.value);
      return {
        [opts.key]: `${JSON_TAG}${JSON.stringify(opts.value)}`, //NOLEY NOTES: escape text errors for records consider
      };
    } else {
      return revisedPrepareObjectForBE(
        { [opts.key]: opts.value },
        opts.ISMDataRecordForKey,
        { omitObjectIdentifier: opts.omitObjectIdentifier }
      );
    }
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

function revisedConvertEdgeDirectionNames(edgeItem: AdditionalEdgeProperties) {
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

export function revisedPrepareForBE(opts: {
  obj: Record<string, any>;
  ISMDataRecord: Record<string, SMData<any, any, any> | SMDataDefaultFn>; //NOLEY NOTES: optional for now...
}) {
  const { ISMDataRecord, obj } = opts;

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const ISMDataRecordForKey =
      typeof ISMDataRecord[key] === 'function'
        ? (ISMDataRecord[key] as any)._default
        : ISMDataRecord[key];
    // console.log(
    //   'NOLEY NODEDATA at key {',
    //   key,
    //   ':',
    //   value,
    //   '}',
    //   ' ISMDataRecord:',
    //   ISMDataRecordForKey
    // );

    if (key === 'childNodes') {
      if (!Array.isArray(value)) {
        throw new Error(`"childNodes" is supposed to be an array`);
      }

      return {
        ...acc,
        childNodes: value.map(item =>
          revisedConvertNodeDataToSMPersistedData(item, ISMDataRecord)
        ),
      };
    }

    if (key === 'additionalEdges') {
      if (!Array.isArray(value)) {
        throw new Error(`"additionalEdges" is supposed to be an array`);
      }
      return {
        ...acc,
        additionalEdges: value.map(item =>
          revisedConvertNodeDataToSMPersistedData(
            revisedConvertEdgeDirectionNames(item),
            ISMDataRecord,
            {
              skipBooleanStringWrapping: true,
            }
          )
        ),
      };
    }

    return {
      ...acc,
      ...revisedConvertPropertyToBE({ key, value, ISMDataRecordForKey }),
    };
  }, {} as Record<string, any>);
}
