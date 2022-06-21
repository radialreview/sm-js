export const JSON_TAG = '__JSON__';
export const NULL_TAG = '__NULL__';

export function parseJSONFromBE(jsonString: string) {
  if (!jsonString.startsWith(JSON_TAG)) {
    throw Error(`parseJSONFromBE - invalid json received:\n${jsonString}`);
  }

  // convert string array into js array
  if (jsonString.startsWith(`${JSON_TAG}[`)) {
    console.log('NOLEY JSON STRING ERROR', jsonString);
    return JSON.parse(jsonString.replace('__JSON__', ''));
  }

  // Allow new line text (\n to \\n)
  // replacing prevents JSON.parse to complaining
  return JSON.parse(jsonString.replace(JSON_TAG, '').replace(/\n/g, '\\n'));
}

export function prepareValueForFE(value: any): any {
  if (value === NULL_TAG) {
    return null;
  } else if (value === 'true' || value === 'false') {
    return value === 'true';
  } else if (typeof value === 'string' && value.startsWith(JSON_TAG)) {
    return parseJSONFromBE(value);
  } else if (Array.isArray(value)) {
    return value.map(entry => {
      if (typeof entry === 'object') {
        return prepareValueForFE(entry);
      } else {
        return entry;
      }
    });
  } else if (value != null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return prepareForFE(value);
  } else {
    return value;
  }
}

export function prepareForFE(beData: Record<string, any>) {
  return Object.keys(beData).reduce((prepared, key) => {
    const value = beData[key];
    return {
      ...prepared,
      [key]: prepareValueForFE(value),
    };
  }, {} as Record<string, any>);
}
