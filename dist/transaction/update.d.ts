import { DocumentNode } from '@apollo/client/core';
import { DeepPartial, GetResultingNodeDataTypeFromNodeDefinition, ISMNode } from '../types';
export declare type UpdateNodesOperation = {
    type: 'updateNodes';
    smOperationName: 'UpdateNodes';
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
export declare function updateNodes(operation: Omit<UpdateNodesOperation, 'type' | 'smOperationName'>): UpdateNodesOperation;
export declare type UpdateNodeOperation<TSMNode extends ISMNode = ISMNode<Record<string, any>>> = {
    type: 'updateNode';
    smOperationName: 'UpdateNodes';
    data: {
        id: string;
    } & DeepPartial<GetResultingNodeDataTypeFromNodeDefinition<TSMNode>>;
    name?: string;
    onSuccess?: (data: any) => void;
    onFail?: () => void;
};
export declare function updateNode<TSMNode extends ISMNode = ISMNode<Record<string, any>>>(operation: Omit<UpdateNodeOperation<TSMNode>, 'type' | 'smOperationName'>): UpdateNodeOperation<TSMNode>;
export declare function getMutationsFromTransactionUpdateOperations(operations: Array<UpdateNodeOperation | UpdateNodesOperation>): Array<DocumentNode>;
