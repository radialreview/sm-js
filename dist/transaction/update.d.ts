import { DocumentNode } from '@apollo/client/core';
import { DeepPartial, GetResultingDataTypeFromNodeDefinition, INode } from '../types';
export declare type UpdateNodesOperation = {
    type: 'updateNodes';
    operationName: 'UpdateNodes';
    nodes: Array<{
        data: {
            id: string;
        } & Record<string, any>;
        position?: number;
        onSuccess?: (data: any) => void;
        onFail?: () => void;
    }>;
    name?: string;
};
export declare function updateNodes(operation: Omit<UpdateNodesOperation, 'type' | 'operationName'>): UpdateNodesOperation;
export declare type UpdateNodeOperation<TNode extends INode = INode<any, Record<string, any>>> = {
    type: 'updateNode';
    operationName: 'UpdateNodes';
    data: {
        id: string;
    } & DeepPartial<GetResultingDataTypeFromNodeDefinition<TNode>>;
    name?: string;
    onSuccess?: (data: any) => void;
    onFail?: () => void;
};
export declare function updateNode<TNode extends INode = INode<any, Record<string, any>>>(operation: Omit<UpdateNodeOperation<TNode>, 'type' | 'operationName'>): UpdateNodeOperation<TNode>;
export declare function getMutationsFromTransactionUpdateOperations(operations: Array<UpdateNodeOperation | UpdateNodesOperation>): Array<DocumentNode>;
