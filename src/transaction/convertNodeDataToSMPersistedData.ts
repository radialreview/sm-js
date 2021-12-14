import { NodeData } from './types';

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
      return acc + `${key}: "${value}"`;
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
  } else if (typeof opts.value === 'object') {
    throw Error('Not supported');
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
