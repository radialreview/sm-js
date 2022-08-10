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
    operationName: 'DropEdge',
    ...edge,
  };
}

export function dropEdges(edges: Array<DropEdgeOpts>): DropEdgesOperation {
  return {
    type: 'dropEdges',
    operationName: 'DropEdge',
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
      return operation.edges.map(operation =>
        convertEdgeDropOperationToMutationArguments({
          ...operation.edge,
          name: operation.name,
        })
      );
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
            transactional: true
        )
    }`;
}
