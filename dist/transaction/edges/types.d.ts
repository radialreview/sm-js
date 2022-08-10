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
    operationName: 'AttachEdge';
    name?: string;
    edge: EdgeProperties;
    onSuccess?: () => any;
};
export declare type CreateEdgesOperation = {
    type: 'createEdges';
    operationName: 'AttachEdge';
    edges: Array<{
        edge: EdgeProperties & {
            name?: string;
        };
        onSuccess?: () => any;
    }>;
};
interface IAdditionalEdgesWithFrom extends EdgePermissions {
    from: string;
    to?: never;
}
interface IAdditionalEdgesWithTo extends EdgePermissions {
    to: string;
    from?: never;
}
export declare type AdditionalEdgeProperties = IAdditionalEdgesWithFrom | IAdditionalEdgesWithTo;
export declare type CreateEdgeOpts = Omit<CreateEdgeOperation, 'type' | 'operationName'>;
export declare type CreateEdgesOpts = Omit<CreateEdgesOperation, 'type' | 'operationName'>;
export declare type DropEdgeProperties = {
    from: string;
    to: string;
    type?: string;
};
export declare type DropEdgeOperation = {
    type: 'dropEdge';
    operationName: 'DropEdge';
    name?: string;
    edge: DropEdgeProperties;
    onSuccess?: () => any;
};
export declare type DropEdgesOperation = {
    type: 'dropEdges';
    operationName: 'DropEdge';
    edges: Array<{
        edge: DropEdgeProperties;
        onSuccess?: () => any;
        name?: string;
    }>;
};
export declare type DropEdgeOpts = Omit<DropEdgeOperation, 'type' | 'operationName'>;
export declare type DropEdgesOpts = Omit<DropEdgesOperation, 'type' | 'operationName'>;
export declare type ReplaceEdgeProperties = EdgeProperties & {
    current: string;
};
export declare type ReplaceEdgeOperation = {
    type: 'replaceEdge';
    operationName: 'ReplaceEdge';
    name?: string;
    edge: ReplaceEdgeProperties;
    onSuccess?: () => any;
};
export declare type ReplaceEdgesOperation = {
    type: 'replaceEdges';
    operationName: 'ReplaceEdge';
    edges: Array<{
        edge: ReplaceEdgeProperties & {
            name?: string;
        };
        onSuccess?: () => any;
    }>;
};
export declare type ReplaceEdgeOpts = Omit<ReplaceEdgeOperation, 'type' | 'operationName'>;
export declare type ReplaceEdgesOpts = Omit<ReplaceEdgesOperation, 'type' | 'operationName'>;
export declare type UpdateEdgeOperation = {
    type: 'updateEdge';
    operationName: 'UpdateEdge';
    name?: string;
    edge: EdgeProperties;
    onSuccess?: () => any;
};
export declare type UpdateEdgesOperation = {
    type: 'updateEdges';
    operationName: 'UpdateEdge';
    edges: Array<{
        edge: EdgeProperties & {
            name?: string;
        };
        onSuccess?: () => any;
    }>;
};
export declare type UpdateEdgeOpts = Omit<UpdateEdgeOperation, 'type' | 'operationName'>;
export declare type UpdateEdgesOpts = Omit<UpdateEdgesOperation, 'type' | 'operationName'>;
export {};
