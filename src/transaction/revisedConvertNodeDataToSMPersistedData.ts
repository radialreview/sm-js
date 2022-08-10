import {
  OBJECT_IDENTIFIER,
  OBJECT_PROPERTY_SEPARATOR,
  Data,
} from '../dataTypes';
import { Maybe, DataDefaultFn, DATA_TYPES } from '../types';
import { AdditionalEdgeProperties } from './edges/types';

const JSON_TAG = '__JSON__';

/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @param IDataRecord a record of Data types to identify objects vs records
 * @param generatingMockData a boolean to determine if escape text should be utilized
 * @returns stringified params ready for mutation
 */
export function revisedConvertNodeDataToSMPersistedData(opts: {
  nodeData: Record<string, any>;
  IDataRecord: Record<string, Data<any, any, any> | DataDefaultFn>;
  generatingMockData: boolean;
  skipBooleanStringWrapping?: boolean;
}): string {
  const {
    nodeData,
    IDataRecord,
    generatingMockData,
    skipBooleanStringWrapping,
  } = opts;
  const parsedData = revisedPrepareForBE({
    obj: nodeData,
    IDataRecord,
    generatingMockData,
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
        (value === 'true' || value === 'false') && !!skipBooleanStringWrapping;

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
 * @param IDataRecordForKey a record of Data type for specific key to identify objects vs records
 * @param generatingMockData a boolean to determine if escape text should be utilized
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
export function revisedPrepareObjectForBE(opts: {
  obj: Record<string, any>;
  IDataRecordForKey: Data<any, any, any>;
  generatingMockData: boolean;
  parentKey?: string;
  omitObjectIdentifier?: boolean;
}) {
  const { obj, parentKey, omitObjectIdentifier } = opts;
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const preparedKey = parentKey
      ? `${parentKey}${OBJECT_PROPERTY_SEPARATOR}${key}`
      : key;

    if (typeof val === 'object' && val != null && !Array.isArray(val)) {
      if (!omitObjectIdentifier) {
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
  IDataRecordForKey: Data<any, any, any>;
  generatingMockData: boolean;
  omitObjectIdentifier?: boolean;
}): Record<string, Maybe<string | boolean>> {
  const {
    key,
    value,
    IDataRecordForKey,
    generatingMockData,
    omitObjectIdentifier,
  } = opts;
  if (value === null) {
    return { [key]: null };
  } else if (Array.isArray(value)) {
    return {
      [key]: `${JSON_TAG}${
        generatingMockData
          ? JSON.stringify(value)
          : escapeText(JSON.stringify(value))
      }`,
    };
  } else if (typeof value === 'object') {
    if (
      IDataRecordForKey.type === DATA_TYPES.record ||
      IDataRecordForKey.type === DATA_TYPES.maybeRecord
    ) {
      return {
        [key]: `${JSON_TAG}${
          generatingMockData
            ? JSON.stringify(value)
            : escapeText(JSON.stringify(value))
        }`,
      };
    } else {
      return revisedPrepareObjectForBE({
        obj: { [key]: value },
        IDataRecordForKey,
        generatingMockData,
        omitObjectIdentifier,
      });
    }
  } else if (typeof value === 'string') {
    return { [key]: escapeText(value) };
  } else if (typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && isNaN(value)) {
      return { [key]: null };
    }
    return { [key]: String(value) };
  } else {
    throw Error(
      `I don't yet know how to handle feData of type "${typeof value}"`
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
  IDataRecord: Record<string, Data<any, any, any> | DataDefaultFn>;
  generatingMockData: boolean;
}) {
  const { IDataRecord, obj, generatingMockData } = opts;

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const IDataRecordForKey =
      typeof IDataRecord[key] === 'function'
        ? (IDataRecord[key] as any)._default
        : IDataRecord[key];

    if (key === 'childNodes') {
      if (!Array.isArray(value)) {
        throw new Error(`"childNodes" is supposed to be an array`);
      }

      return {
        ...acc,
        childNodes: value.map(item =>
          revisedConvertNodeDataToSMPersistedData({
            nodeData: item,
            IDataRecord,
            generatingMockData,
          })
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
          revisedConvertNodeDataToSMPersistedData({
            nodeData: revisedConvertEdgeDirectionNames(item),
            IDataRecord,
            generatingMockData,
            skipBooleanStringWrapping: true,
          })
        ),
      };
    }

    return {
      ...acc,
      ...revisedConvertPropertyToBE({
        key,
        value,
        IDataRecordForKey,
        generatingMockData,
      }),
    };
  }, {} as Record<string, any>);
}
