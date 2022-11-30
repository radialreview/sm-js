export function prepareValueForFE(value: any): any {
  if (value === 'true' || value === 'false') {
    return value === 'true';
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
