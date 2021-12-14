import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import { EdgeProperties } from './types';
import { getEdgePermissionsString } from './utilities';

export type CreateEdgeOperation = {
  operationType: 'createEdge';
  name?: string;
  edge: EdgeProperties;
};

export type CreateEdgesOperation = {
  operationType: 'createEdges';
  edges: Array<EdgeProperties & { name?: string }>;
};

export type CreateEdgeOpts = Omit<CreateEdgeOperation, 'operationType'>;
export type CreateEdgesOpts = Omit<CreateEdgesOperation, 'operationType'>;

export function createEdge(edge: CreateEdgeOpts): CreateEdgeOperation {
  return {
    operationType: 'createEdge',
    ...edge,
  };
}

export function createEdges(
  edges: Array<EdgeProperties & { name?: string }>
): CreateEdgesOperation {
  return {
    operationType: 'createEdges',
    edges,
  };
}

export function getMutationsFromEdgeCreateOperations(
  operations: Array<CreateEdgeOperation | CreateEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.operationType === 'createEdge') {
      return convertEdgeCreationOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.operationType === 'createEdges') {
      return operation.edges.map(
        convertEdgeCreationOperationToMutationArguments
      );
    }
    throw Error(`Operation not recognized: "${operation}"`);
  });
}

function convertEdgeCreationOperationToMutationArguments(
  opts: EdgeProperties & { name?: string }
): DocumentNode {
  const edge = `{\ntype: "${opts.type || 'access'}",${getEdgePermissionsString(
    opts.permissions
  )}}`;
  const name = getMutationNameFromOperations([opts], 'CreateEdge');

  return gql`
    mutation ${name} {
        AttachEdge(
            newSourceId: "${opts.from}"
            targetId: "${opts.to}"
            edge: ${edge}
        )
    }`;
}
