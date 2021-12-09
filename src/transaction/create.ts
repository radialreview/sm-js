import { DocumentNode, gql } from '@apollo/client/core';

type NodeData = {
  type: string;
  childNodes: Array<NodeData>;
} & Record<string, any>;

export type CreateNodeOperation = {
  type: 'createNode';
  data: NodeData;
  under?: string | Array<string>;
  mutationName?: string;
};

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
            result: CreateNodes([
                ${allCreateNodeOperations.map(
                  convertCreateNodeOperationToMutationArguments
                )}
            ]) {
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
  const { childNodes, ...restOfData } = operation.data;

  return `
        node: {
            ${convertJSONToSMPersistedData(restOfData)}
        }
    `;
}
