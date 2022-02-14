import { DocumentNode } from '@apollo/client/core';
import { NodeData } from './types';
export declare type UpdateNodesOperation = {
    type: 'updateNodes';
    smOperationName: 'UpdateNodes';
    nodes: Array<{
        data: {
            id: string;
        } & NodeData;
        position?: number;
        onSuccess?: (data: any) => any;
    }>;
    name?: string;
};
export declare function updateNodes(operation: Omit<UpdateNodesOperation, 'type' | 'smOperationName'>): UpdateNodesOperation;
export declare type UpdateNodeOperation = {
    type: 'updateNode';
    smOperationName: 'UpdateNodes';
    data: {
        id: string;
    } & NodeData;
    name?: string;
    onSuccess?: (data: any) => any;
};
export declare function updateNode(operation: Omit<UpdateNodeOperation, 'type' | 'smOperationName'>): UpdateNodeOperation;
export declare function getMutationsFromTransactionUpdateOperations(operations: Array<UpdateNodeOperation | UpdateNodesOperation>): Array<DocumentNode>;
