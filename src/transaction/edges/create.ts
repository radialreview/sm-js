import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import {
  CreateEdgeOperation,
  CreateEdgeOpts,
  CreateEdgesOperation,
  EdgeProperties,
} from './types';
import { getEdgePermissionsString } from './utilities';

export function createEdge(edge: CreateEdgeOpts): CreateEdgeOperation {
  return {
    type: 'createEdge',
    ...edge,
    smOperationName: 'AttachEdge',
  };
}

export function createEdges(
  edges: CreateEdgesOperation['edges']
): CreateEdgesOperation {
  return {
    type: 'createEdges',
    smOperationName: 'AttachEdge',
    edges,
  };
}

export function getMutationsFromEdgeCreateOperations(
  operations: Array<CreateEdgeOperation | CreateEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.type === 'createEdge') {
      return convertEdgeCreationOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.type === 'createEdges') {
      return operation.edges.map(({ edge }) =>
        convertEdgeCreationOperationToMutationArguments(edge)
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
            transactional: true
        )
    }`;
}
