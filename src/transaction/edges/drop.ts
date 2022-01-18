import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import {
  DropEdgeOpts,
  DropEdgeOperation,
  DropEdgeProperties,
  DropEdgesOperation,
} from './types';

export function dropEdge(edge: DropEdgeOpts): DropEdgeOperation {
  return {
    type: 'dropEdge',
    ...edge,
  };
}

export function dropEdges(
  edges: Array<DropEdgeProperties & { name?: string }>
): DropEdgesOperation {
  return {
    type: 'dropEdges',
    edges,
  };
}

export function getMutationsFromEdgeDropOperations(
  operations: Array<DropEdgeOperation | DropEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.type === 'dropEdge') {
      return convertEdgeDropOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.type === 'dropEdges') {
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
