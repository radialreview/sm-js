import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import {
  EdgeProperties,
  UpdateEdgeOperation,
  UpdateEdgeOpts,
  UpdateEdgesOperation,
} from './types';
import { getEdgePermissionsString } from './utilities';

export function updateEdge(edge: UpdateEdgeOpts): UpdateEdgeOperation {
  return {
    type: 'updateEdge',
    ...edge,
  };
}

export function updateEdges(
  edges: Array<EdgeProperties & { name?: string }>
): UpdateEdgesOperation {
  return {
    type: 'updateEdges',
    edges,
  };
}

export function getMutationsFromEdgeUpdateOperations(
  operations: Array<UpdateEdgeOperation | UpdateEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.type === 'updateEdge') {
      return convertEdgeUpdateOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.type === 'updateEdges') {
      return operation.edges.map(convertEdgeUpdateOperationToMutationArguments);
    }

    throw Error(`Operation not recognized: "${operation}"`);
  });
}

function convertEdgeUpdateOperationToMutationArguments(
  opts: EdgeProperties & { name?: string }
): DocumentNode {
  const edge = `{\ntype: "${opts.type || 'access'}", ${getEdgePermissionsString(
    opts.permissions
  )}}`;
  const name = getMutationNameFromOperations([opts], 'UpdateEdge');

  return gql`
    mutation ${name} {
        UpdateEdge(
            sourceId: "${opts.from}"
            targetId: "${opts.to}"
            edge: ${edge}
        )
    }`;
}
