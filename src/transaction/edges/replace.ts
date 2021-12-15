import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import {
  ReplaceEdgeOperation,
  ReplaceEdgeOpts,
  ReplaceEdgeProperties,
  ReplaceEdgesOperation,
} from './types';
import { getEdgePermissionsString } from './utilities';

export function replaceEdge(edge: ReplaceEdgeOpts): ReplaceEdgeOperation {
  return {
    type: 'replaceEdge',
    ...edge,
  };
}

export function replaceEdges(
  edges: Array<ReplaceEdgeProperties & { name?: string }>
): ReplaceEdgesOperation {
  return {
    type: 'replaceEdges',
    edges,
  };
}

export function getMutationsFromEdgeReplaceOperations(
  operations: Array<ReplaceEdgeOperation | ReplaceEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.type === 'replaceEdge') {
      return convertEdgeReplaceOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.type === 'replaceEdges') {
      return operation.edges.map(
        convertEdgeReplaceOperationToMutationArguments
      );
    }
    throw Error(`Operation not recognized: "${operation}"`);
  });
}

function convertEdgeReplaceOperationToMutationArguments(
  opts: ReplaceEdgeProperties & { name?: string }
): DocumentNode {
  const name = getMutationNameFromOperations([opts], 'ReplaceEdge');
  const edge = `{\ntype: "${opts.type || 'access'}", ${getEdgePermissionsString(
    opts.permissions
  )}}`;

  return gql`
    mutation ${name} {
        ReplaceEdge(
            currentSourceId: "${opts.current}"
            newSourceId: "${opts.from}"
            targetId: "${opts.to}"
            edge: ${edge}
        )
    }`;
}
