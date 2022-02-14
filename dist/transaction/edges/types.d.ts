export declare type EdgePermissions = {
    view?: boolean;
    edit?: boolean;
    manage?: boolean;
    terminate?: boolean;
    addChild?: boolean;
};
export declare type EdgeProperties = {
    type?: string;
    from: string;
    to: string;
    permissions: EdgePermissions;
};
export declare type CreateEdgeOperation = {
    type: 'createEdge';
    smOperationName: 'AttachEdge';
    name?: string;
    edge: EdgeProperties;
    onSuccess?: () => any;
};
export declare type CreateEdgesOperation = {
    type: 'createEdges';
    smOperationName: 'AttachEdge';
    edges: Array<{
        edge: EdgeProperties & {
            name?: string;
        };
        onSuccess?: () => any;
    }>;
};
export declare type CreateEdgeOpts = Omit<CreateEdgeOperation, 'type' | 'smOperationName'>;
export declare type CreateEdgesOpts = Omit<CreateEdgesOperation, 'type' | 'smOperationName'>;
export declare type DropEdgeProperties = {
    from: string;
    to: string;
    type?: string;
};
export declare type DropEdgeOperation = {
    type: 'dropEdge';
    smOperationName: 'DropEdge';
    name?: string;
    edge: DropEdgeProperties;
    onSuccess?: () => any;
};
export declare type DropEdgesOperation = {
    type: 'dropEdges';
    smOperationName: 'DropEdge';
    edges: Array<{
        edge: DropEdgeProperties;
        onSuccess?: () => any;
        name?: string;
    }>;
};
export declare type DropEdgeOpts = Omit<DropEdgeOperation, 'type' | 'smOperationName'>;
export declare type DropEdgesOpts = Omit<DropEdgesOperation, 'type' | 'smOperationName'>;
export declare type ReplaceEdgeProperties = EdgeProperties & {
    current: string;
};
export declare type ReplaceEdgeOperation = {
    type: 'replaceEdge';
    smOperationName: 'ReplaceEdge';
    name?: string;
    edge: ReplaceEdgeProperties;
    onSuccess?: () => any;
};
export declare type ReplaceEdgesOperation = {
    type: 'replaceEdges';
    smOperationName: 'ReplaceEdge';
    edges: Array<{
        edge: ReplaceEdgeProperties & {
            name?: string;
        };
        onSuccess?: () => any;
    }>;
};
export declare type ReplaceEdgeOpts = Omit<ReplaceEdgeOperation, 'type' | 'smOperationName'>;
export declare type ReplaceEdgesOpts = Omit<ReplaceEdgesOperation, 'type' | 'smOperationName'>;
export declare type UpdateEdgeOperation = {
    type: 'updateEdge';
    smOperationName: 'UpdateEdge';
    name?: string;
    edge: EdgeProperties;
    onSuccess?: () => any;
};
export declare type UpdateEdgesOperation = {
    type: 'updateEdges';
    smOperationName: 'UpdateEdge';
    edges: Array<{
        edge: EdgeProperties & {
            name?: string;
        };
        onSuccess?: () => any;
    }>;
};
export declare type UpdateEdgeOpts = Omit<UpdateEdgeOperation, 'type' | 'smOperationName'>;
export declare type UpdateEdgesOpts = Omit<UpdateEdgesOperation, 'type' | 'smOperationName'>;
