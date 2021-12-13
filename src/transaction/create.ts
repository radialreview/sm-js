import { DocumentNode, gql } from '@apollo/client/core';

import { convertNodeDataToSMPersistedData } from './convertNodeDataToSMPersistedData';
import { NodeData } from './types';

export type CreateNodesOperation = {
  type: 'createNodes';
  nodes: Array<{ data: NodeData; under?: string | Array<string> }>;
  name?: string;
};

export function createNodes(
  operation: Omit<CreateNodesOperation, 'type'>
): CreateNodesOperation {
  return {
    type: 'createNodes',
    ...operation,
  };
}

export type CreateNodeOperation = {
  type: 'createNode';
  data: NodeData;
  under?: string | Array<string>;
  name?: string;
};

export function createNode(
  operation: Omit<CreateNodeOperation, 'type'>
): CreateNodeOperation {
  return {
    type: 'createNode',
    ...operation,
  };
}

export function getMutationsFromTransactionCreateOperations(
  operations: Array<CreateNodeOperation | CreateNodesOperation>
): Array<DocumentNode> {
  const allCreateNodeOperations = operations.flatMap(operation => {
    if (operation.type === 'createNode') {
      return operation;
    } else if (operation.type === 'createNodes') {
      return operation.nodes;
    } else {
      throw Error(`Operation not recognized: "${operation}"`);
    }
  });

  const allOperationNames = operations
    .filter(operation => 'name' in operation)
    .map(operation => {
      if ('name' in operation) {
        return operation.name;
      } else {
        throw Error('Expected an operation name here');
      }
    });

  const name = allOperationNames.length
    ? allOperationNames.join('__')
    : 'CreateNodes';

  // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations
  return [
    gql`
      mutation ${name} {
        CreateNodes(
          createOptions: [
            ${allCreateNodeOperations
              .map(convertCreateNodeOperationToMutationArguments)
              .join('\n')}
          ] 
        ) {
          id
        }
      }
    `,
  ];
}

function convertCreateNodeOperationToMutationArguments(operation: {
  data: NodeData;
  under?: string | Array<string>;
}): string {
  const dataToPersistInSM = convertNodeDataToSMPersistedData(operation.data);

  let mutationArgs: Array<string> = [
    `node: {
        ${dataToPersistInSM}
      }`,
  ];

  if (operation.under) {
    const value =
      typeof operation.under === 'string'
        ? `["${operation.under}"]`
        : `["${operation.under.join('", "')}"]`;

    mutationArgs.push(`underIds: ${value}`);
  }

  return `{
    ${mutationArgs.join('\n')}
  }`;
}
