import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import { EdgeProperties } from './types';
import { getEdgePermissionsString } from './utilities';

export type UpdateEdgeOperation = {
  operationType: 'updateEdge';
  name?: string;
  edge: EdgeProperties;
};

export type UpdateEdgesOperation = {
  operationType: 'updateEdges';
  edges: Array<EdgeProperties & { name?: string }>;
};

export type UpdateEdgeOpts = Omit<UpdateEdgeOperation, 'operationType'>;
export type UpdateEdgesOpts = Omit<UpdateEdgesOperation, 'operationType'>;

export function updateEdge(edge: UpdateEdgeOpts): UpdateEdgeOperation {
  return {
    operationType: 'updateEdge',
    ...edge,
  };
}

export function updateEdges(
  edges: Array<EdgeProperties & { name?: string }>
): UpdateEdgesOperation {
  return {
    operationType: 'updateEdges',
    edges,
  };
}

export function getMutationsFromEdgeUpdateOperations(
  operations: Array<UpdateEdgeOperation | UpdateEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.operationType === 'updateEdge') {
      return convertEdgeUpdateOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.operationType === 'updateEdges') {
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
            currentSourceId: "${opts.from}"
            targetId: "${opts.to}"
            edge: ${edge}
        )
    }`;
}
