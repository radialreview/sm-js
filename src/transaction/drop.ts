import { DocumentNode, gql } from '@apollo/client/core';

import { getMutationNameFromOperations } from './getMutationNameFromOperations';

export type DropNodeOperation = {
  type: 'dropNode';
  operationName: 'DropNode';
  id: string;
  name?: string;
  onSuccess?: () => any;
};

export function dropNode(
  operation: Omit<DropNodeOperation, 'type' | 'operationName'>
): DropNodeOperation {
  return {
    type: 'dropNode',
    operationName: 'DropNode',
    ...operation,
  };
}

export function getMutationsFromTransactionDropOperations(
  operations: Array<DropNodeOperation>
): Array<DocumentNode> {
  if (!operations.length) return [];

  const allDropNodeOperations: Array<{
    id: string;
    name?: string;
  }> = operations.map(operation => {
    if (operation.type === 'dropNode') {
      return operation;
    } else {
      throw Error(`Operation not recognized: "${operation}"`);
    }
  });

  return allDropNodeOperations.map(operation => {
    const name = getMutationNameFromOperations([operation], 'DropNode');

    return gql`
      mutation ${name} {
        DropNode(nodeId: "${operation.id}", transactional: true)
      }    
    `;
  });
}
