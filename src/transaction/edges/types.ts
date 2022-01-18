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
  name?: string;
  edge: EdgeProperties;
};

export type CreateEdgesOperation = {
  type: 'createEdges';
  edges: Array<EdgeProperties & { name?: string }>;
};

export type CreateEdgeOpts = Omit<CreateEdgeOperation, 'type'>;
export type CreateEdgesOpts = Omit<CreateEdgesOperation, 'type'>;

export type DropEdgeProperties = {
  from: string;
  to: string;
  type?: string;
};

export type DropEdgeOperation = {
  type: 'dropEdge';
  name?: string;
  edge: DropEdgeProperties;
};

export type DropEdgesOperation = {
  type: 'dropEdges';
  edges: Array<DropEdgeProperties & { name?: string }>;
};

export type DropEdgeOpts = Omit<DropEdgeOperation, 'type'>;
export type DropEdgesOpts = Omit<DropEdgesOperation, 'type'>;

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
