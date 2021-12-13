import { DocumentNode, gql } from '@apollo/client/core';
import { convertNodeDataToSMPersistedData } from './convertNodeDataToSMPersistedData';
import { getMutationNameFromOperations } from './getMutationNameFromOperations';
import { NodeData } from './types';

export type UpdateNodesOperation = {
  type: 'updateNodes';
  nodes: Array<{ id: string } & NodeData>;
  name?: string;
};

export function updateNodes(
  operation: Omit<UpdateNodesOperation, 'type'>
): UpdateNodesOperation {
  return {
    type: 'updateNodes',
    ...operation,
  };
}

export type UpdateNodeOperation = {
  type: 'updateNode';
  data: { id: string } & NodeData;
  name?: string;
};

export function updateNode(
  operation: Omit<UpdateNodeOperation, 'type'>
): UpdateNodeOperation {
  return {
    type: 'updateNode',
    ...operation,
  };
}

export function getMutationsFromTransactionUpdateOperations(
  operations: Array<UpdateNodeOperation | UpdateNodesOperation>
): Array<DocumentNode> {
  const allUpdateNodeOperations: Array<{
    id: string;
  } & NodeData> = operations.flatMap(operation => {
    if (operation.type === 'updateNode') {
      return operation.data;
    } else if (operation.type === 'updateNodes') {
      return operation.nodes;
    } else {
      throw Error(`Operation not recognized: "${operation}"`);
    }
  });

  const name = getMutationNameFromOperations(operations, 'UpdateNodes');

  // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations
  return [
    gql`
        mutation ${name} {
          UpdateNodes(
            nodes: [
              ${allUpdateNodeOperations
                .map(convertUpdateNodeOperationToUpdateNodesMutationArguments)
                .join('\n')}
            ] 
          ) {
            id
          }
        }
      `,
  ];
}

function convertUpdateNodeOperationToUpdateNodesMutationArguments(
  operation: {
    id: string;
  } & NodeData
): string {
  const dataToPersistInSM = convertNodeDataToSMPersistedData(operation);

  return `{
      ${dataToPersistInSM}
    }`;
}
