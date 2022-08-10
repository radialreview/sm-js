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
  operationName: 'AttachEdge';
  name?: string;
  edge: EdgeProperties;
  onSuccess?: () => any;
};

export type CreateEdgesOperation = {
  type: 'createEdges';
  operationName: 'AttachEdge';
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
  'type' | 'operationName'
>;
export type CreateEdgesOpts = Omit<
  CreateEdgesOperation,
  'type' | 'operationName'
>;

export type DropEdgeProperties = {
  from: string;
  to: string;
  type?: string;
};

export type DropEdgeOperation = {
  type: 'dropEdge';
  operationName: 'DropEdge';
  name?: string;
  edge: DropEdgeProperties;
  onSuccess?: () => any;
};

export type DropEdgesOperation = {
  type: 'dropEdges';
  operationName: 'DropEdge';
  edges: Array<{
    edge: DropEdgeProperties;
    onSuccess?: () => any;
    name?: string;
  }>;
};

export type DropEdgeOpts = Omit<DropEdgeOperation, 'type' | 'operationName'>;
export type DropEdgesOpts = Omit<DropEdgesOperation, 'type' | 'operationName'>;

export type ReplaceEdgeProperties = EdgeProperties & {
  current: string;
};

export type ReplaceEdgeOperation = {
  type: 'replaceEdge';
  operationName: 'ReplaceEdge';
  name?: string;
  edge: ReplaceEdgeProperties;
  onSuccess?: () => any;
};

export type ReplaceEdgesOperation = {
  type: 'replaceEdges';
  operationName: 'ReplaceEdge';
  edges: Array<{
    edge: ReplaceEdgeProperties & { name?: string };
    onSuccess?: () => any;
  }>;
};

export type ReplaceEdgeOpts = Omit<
  ReplaceEdgeOperation,
  'type' | 'operationName'
>;
export type ReplaceEdgesOpts = Omit<
  ReplaceEdgesOperation,
  'type' | 'operationName'
>;

export type UpdateEdgeOperation = {
  type: 'updateEdge';
  operationName: 'UpdateEdge';
  name?: string;
  edge: EdgeProperties;
  onSuccess?: () => any;
};

export type UpdateEdgesOperation = {
  type: 'updateEdges';
  operationName: 'UpdateEdge';
  edges: Array<{
    edge: EdgeProperties & { name?: string };
    onSuccess?: () => any;
  }>;
};

export type UpdateEdgeOpts = Omit<
  UpdateEdgeOperation,
  'type' | 'operationName'
>;
export type UpdateEdgesOpts = Omit<
  UpdateEdgesOperation,
  'type' | 'operationName'
>;
