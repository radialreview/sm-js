import { DocumentNode, gql } from '@apollo/client/core';

import { convertJSONToSMPersistedData } from './convertJSONToSMPersistedData';
import { NodeData } from './types';

export type CreateNodesOperation = {
  type: 'createNodes';
  nodes: Array<{ data: NodeData; under?: string | Array<string> }>;
  mutationName?: string;
};

export function createNodes(
  nodes: Array<{ data: NodeData; under?: string | Array<string> }>
): CreateNodesOperation {
  return {
    type: 'createNodes',
    nodes,
  };
}

export type CreateNodeOperation = {
  type: 'createNode';
  data: NodeData;
  under?: string | Array<string>;
  mutationName?: string;
};

export function createNode(node: {
  data: NodeData;
  under?: string | Array<string>;
}): CreateNodeOperation {
  return {
    type: 'createNode',
    ...node,
  };
}

export function getMutationsFromTransactionCreateOperations(
  operations: Array<CreateNodeOperation | CreateNodesOperation>
): Array<DocumentNode> {
  const allCreateNodeOperations = operations.flatMap(operation => {
    if (operation.type === 'createNode') {
      return { data: operation.data, under: operation.under };
    } else if (operation.type === 'createNodes') {
      return operation.nodes;
    } else {
      throw Error(`Operation not recognized: "${operation}"`);
    }
  });

  function getMutationName() {
    return 'MyMutation'; // @TODO, how should I name this? Join all mutation names?
  }

  // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations
  return [
    gql`
      mutation ${getMutationName()} {
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
  const dataToPersistInSM = convertJSONToSMPersistedData(operation.data);

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
