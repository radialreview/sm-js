import { JSON_TAG, NULL_TAG } from '../dataConversions';

export function convertJSONToSMPersistedData(json: Record<string, any>) {
  const parsedData = Object.keys(json).reduce((acc, key) => {
    const value = json[key];
    return {
      ...acc,
      ...prepareForBE({ key, value }),
    };
  }, {} as Record<string, string>);

  const stringified = Object.keys(parsedData).reduce((acc, key) => {
    return acc + `\n${key}: "${parsedData[key]}"`;
  }, ``);

  return stringified;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

function stringifyJSONFromFE(json: Record<string, any>) {
  return JSON_TAG + escapeText(JSON.stringify(json));
}

function prepareForBE(opts: { key: string; value: any }) {
  if (value === null) {
    return NULL_TAG;
  } else if (typeof value === 'object') {
    return stringifyJSONFromFE(value);
  } else if (typeof value === 'string') {
    if (value.startsWith(JSON_TAG)) {
      return value;
    } else {
      return escapeText(value);
    }
  } else if (typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && isNaN(value)) {
      return NULL_TAG;
    }
    return String(value);
  } else if (typeof value === 'undefined') {
    return undefined;
  } else {
    throw Error(
      `I don't yet know how to handle feData of type "${typeof value}"`
    );
  }
}
