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

// when creating additionalEdges, each edge can have either a "to" OR a "from", not both
interface IAdditionalEdgesWithFrom extends EdgePermissions {
  from: string;
  to?: never;
}
interface IAdditionalEdgesWithTo extends EdgePermissions {
  to: string;
  from?: never;
}

export type AdditionalEdgeProperties =
  | IAdditionalEdgesWithFrom
  | IAdditionalEdgesWithTo;

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
  smOperationName: 'ReplaceEdge';
  name?: string;
  edge: ReplaceEdgeProperties;
  onSuccess?: () => any;
};

export type ReplaceEdgesOperation = {
  type: 'replaceEdges';
  smOperationName: 'ReplaceEdge';
  edges: Array<{
    edge: ReplaceEdgeProperties & { name?: string };
    onSuccess?: () => any;
  }>;
};

export type ReplaceEdgeOpts = Omit<
  ReplaceEdgeOperation,
  'type' | 'smOperationName'
>;
export type ReplaceEdgesOpts = Omit<
  ReplaceEdgesOperation,
  'type' | 'smOperationName'
>;

export type UpdateEdgeOperation = {
  type: 'updateEdge';
  smOperationName: 'UpdateEdge';
  name?: string;
  edge: EdgeProperties;
  onSuccess?: () => any;
};

export type UpdateEdgesOperation = {
  type: 'updateEdges';
  smOperationName: 'UpdateEdge';
  edges: Array<{
    edge: EdgeProperties & { name?: string };
    onSuccess?: () => any;
  }>;
};

export type UpdateEdgeOpts = Omit<
  UpdateEdgeOperation,
  'type' | 'smOperationName'
>;
export type UpdateEdgesOpts = Omit<
  UpdateEdgesOperation,
  'type' | 'smOperationName'
>;
