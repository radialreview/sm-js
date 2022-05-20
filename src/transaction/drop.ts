import { DocumentNode, gql } from '@apollo/client/core';

import { getMutationNameFromOperations } from './getMutationNameFromOperations';

export type DropNodeOperation = {
  type: 'dropNode';
  smOperationName: 'DropNode';
  id: string;
  name?: string;
  onSuccess?: () => any;
};

export function dropNode(
  operation: Omit<DropNodeOperation, 'type' | 'smOperationName'>
): DropNodeOperation {
  return {
    type: 'dropNode',
    smOperationName: 'DropNode',
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
