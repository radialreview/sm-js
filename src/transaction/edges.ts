import { DocumentNode, gql } from '@apollo/client/core';

export type EdgePermissions = {
  view?: boolean;
  edit?: boolean;
  manage?: boolean;
  terminate?: boolean;
  addChild?: boolean;
};

export type EdgeProperties = {
  type?: string;
  from: string;
  to: string;
  permissions: EdgePermissions;
};

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
    }
    return operation.edges.map(convertEdgeCreationOperationToMutationArguments);
  });
}

function convertEdgeCreationOperationToMutationArguments(
  opts: EdgeProperties & { name?: string }
): DocumentNode {
  const edge = `{${getEdgePermissionsString(opts.permissions)}}`;
  return gql`
    mutation ${getName(opts)} {
        AttachEdge(
            type: "${opts.type || 'access'}"
            newSourceId: "${opts.from}"
            targetId: "${opts.to}"
            edge: ${edge}
        )
    }`;
}

function getName(opts: EdgeProperties & { name?: string }) {
  return opts.name ? `${opts.name}Mutation` : 'edgeCreationMutation';
}

function getEdgePermissionsString(permissions: EdgePermissions): string {
  return `
    view: ${permissions.view ? 'true' : 'false'},
    edit: ${permissions.edit ? 'true' : 'false'},
    manage: ${permissions.manage ? 'true' : 'false'},
    terminate: ${permissions.terminate ? 'true' : 'false'},
    addChild: ${permissions.addChild ? 'true' : 'false'}
  `;
}
