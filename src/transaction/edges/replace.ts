import { DocumentNode, gql } from '@apollo/client/core';
import { getMutationNameFromOperations } from '../getMutationNameFromOperations';
import { EdgeProperties } from './types';
import { getEdgePermissionsString } from './utilities';

export type ReplaceEdgeProperties = EdgeProperties & {
  current: string;
};

export type ReplaceEdgeOperation = {
  operationType: 'replaceEdge';
  name?: string;
  edge: ReplaceEdgeProperties;
};

export type ReplaceEdgesOperation = {
  operationType: 'replaceEdges';
  edges: Array<ReplaceEdgeProperties & { name?: string }>;
};

export type ReplaceEdgeOpts = Omit<ReplaceEdgeOperation, 'operationType'>;
export type ReplaceEdgesOpts = Omit<ReplaceEdgesOperation, 'operationType'>;

export function replaceEdge(edge: ReplaceEdgeOpts): ReplaceEdgeOperation {
  return {
    operationType: 'replaceEdge',
    ...edge,
  };
}

export function replaceEdges(
  edges: Array<ReplaceEdgeProperties & { name?: string }>
): ReplaceEdgesOperation {
  return {
    operationType: 'replaceEdges',
    edges,
  };
}

export function getMutationsFromEdgeReplaceOperations(
  operations: Array<ReplaceEdgeOperation | ReplaceEdgesOperation>
): Array<DocumentNode> {
  return operations.flatMap(operation => {
    if (operation.operationType === 'replaceEdge') {
      return convertEdgeReplaceOperationToMutationArguments({
        ...operation.edge,
        name: operation.name,
      });
    } else if (operation.operationType === 'replaceEdges') {
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
