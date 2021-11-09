
export const JSON_TAG = '__JSON__';
export const NULL_TAG = '__NULL__';

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

function stringifyJSONFromFE(json: Record<string, any>) {
  return JSON_TAG + escapeText(JSON.stringify(json));
}

export function prepareValueForBE(value: any) {
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

export function prepareForBE(
  feData: Record<string,string>
): Record<string, string> {
  return Object.keys(feData).reduce((prepared, key) => {
    const value = feData[key];
    const val = prepareValueForBE(value);
    if (val !== undefined) {
      prepared[key] = val;
    }
    return prepared;
  }, {} as Record<string, string>);
}

export function parseJSONFromBE(jsonString: string) {
  if (!jsonString.startsWith(JSON_TAG)) {
    throw Error(`parseJSONFromBE - invalid json received:\n${jsonString}`);
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

export function prepareForFE(beData: Record<string,any>) {
  return Object.keys(beData).reduce((prepared, key) => {
    const value = beData[key];
    return {
      ...prepared,
      [key]: prepareValueForFE(value),
    };
  }, {} as Record<string, any>);
}


