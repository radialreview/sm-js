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
  type: 'createEdge';
  smOperationName: 'AttachEdge';
  name?: string;
  edge: EdgeProperties;
  onSuccess?: () => any;
};

export type CreateEdgesOperation = {
  type: 'createEdges';
  smOperationName: 'AttachEdge';
  edges: Array<{
    edge: EdgeProperties & { name?: string };
    onSuccess?: () => any;
  }>;
};

export type CreateEdgeOpts = Omit<
  CreateEdgeOperation,
  'type' | 'smOperationName'
>;
export type CreateEdgesOpts = Omit<
  CreateEdgesOperation,
  'type' | 'smOperationName'
>;

export type DropEdgeProperties = {
  from: string;
  to: string;
  type?: string;
};

export type DropEdgeOperation = {
  type: 'dropEdge';
  smOperationName: 'DropEdge';
  name?: string;
  edge: DropEdgeProperties;
  onSuccess?: () => any;
};

export type DropEdgesOperation = {
  type: 'dropEdges';
  smOperationName: 'DropEdge';
  edges: Array<{
    edge: DropEdgeProperties;
    onSuccess?: () => any;
    name?: string;
  }>;
};

export type DropEdgeOpts = Omit<DropEdgeOperation, 'type' | 'smOperationName'>;
export type DropEdgesOpts = Omit<
  DropEdgesOperation,
  'type' | 'smOperationName'
>;

export type ReplaceEdgeProperties = EdgeProperties & {
  current: string;
};

export type ReplaceEdgeOperation = {
  type: 'replaceEdge';
  name?: string;
  edge: ReplaceEdgeProperties;
};

export type ReplaceEdgesOperation = {
  type: 'replaceEdges';
  edges: Array<ReplaceEdgeProperties & { name?: string }>;
};

export type ReplaceEdgeOpts = Omit<ReplaceEdgeOperation, 'type'>;
export type ReplaceEdgesOpts = Omit<ReplaceEdgesOperation, 'type'>;

export type UpdateEdgeOperation = {
  type: 'updateEdge';
  name?: string;
  edge: EdgeProperties;
};

export type UpdateEdgesOperation = {
  type: 'updateEdges';
  edges: Array<EdgeProperties & { name?: string }>;
};

export type UpdateEdgeOpts = Omit<UpdateEdgeOperation, 'type'>;
export type UpdateEdgesOpts = Omit<UpdateEdgesOperation, 'type'>;
