import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';

export type DropEdgeProperties = {
  from: string;
  to: string;
  type?: string;
};

export type DropEdgeOperation = {
  operationType: 'dropEdge';
  name?: string;
  edge: DropEdgeProperties;
};

export type DropEdgesOperation = {
  operationType: 'dropEdges';
  edges: Array<DropEdgeProperties & { name?: string }>;
};

export type DropEdgeOpts = Omit<DropEdgeOperation, 'operationType'>;
export type DropEdgesOpts = Omit<DropEdgesOperation, 'operationType'>;

export function dropEdge(edge: DropEdgeOpts): DropEdgeOperation {
  return {
    operationType: 'dropEdge',
    ...edge,
  };
}

export function dropEdges(
  edges: Array<DropEdgeProperties & { name?: string }>
): DropEdgesOperation {
  return {
    operationType: 'dropEdges',
    edges,
  };
}

export function getMutationsFromEdgeDropOperations(
  operations: Array<DropEdgeOperation | DropEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.operationType === 'dropEdge') {
      return convertEdgeDropOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.operationType === 'dropEdges') {
      return operation.edges.map(convertEdgeDropOperationToMutationArguments);
    }

    throw Error(`Operation not recognized: "${operation}"`);
  });
}

function convertEdgeDropOperationToMutationArguments(
  opts: DropEdgeProperties & { name?: string }
): DocumentNode {
  const name = getMutationNameFromOperations([opts], 'DropEdge');

  return gql`
    mutation ${name} {
        DropEdge(
            sourceId: "${opts.from}"
            targetId: "${opts.to}"
            edgeType: "${opts.type || 'access'}"
        )
    }`;
}
