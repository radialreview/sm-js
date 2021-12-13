export function getMutationNameFromOperations(
  operations: Array<{ name?: string }>,
  fallback: string
) {
  const operationNames = operations
    .filter(operation => 'name' in operation)
    .map(operation => {
      if ('name' in operation) {
        return operation.name;
      } else {
        throw Error('Expected an operation name here');
      }
    });

  if (operationNames.length) {
    return operationNames.join('__');
  }

  return fallback;
}
