import { DocumentNode } from '../types';
import { NodeData } from './types';
export declare type CreateNodesOperation = {
    type: 'createNodes';
    smOperationName: 'CreateNodes';
    nodes: Array<{
        data: NodeData;
        under?: string | Array<string>;
        position?: number;
        onSuccess?: (data: any) => any;
    }>;
    name?: string;
};
export declare function createNodes(operation: Omit<CreateNodesOperation, 'type' | 'smOperationName'>): CreateNodesOperation;
export declare type CreateNodeOperation = {
    type: 'createNode';
    smOperationName: 'CreateNodes';
    data: NodeData;
    under?: string | Array<string>;
    name?: string;
    position?: number;
    onSuccess?: (data: any) => any;
};
export declare function createNode(operation: Omit<CreateNodeOperation, 'type' | 'smOperationName'>): CreateNodeOperation;
export declare function getMutationsFromTransactionCreateOperations(operations: Array<CreateNodeOperation | CreateNodesOperation>): Array<DocumentNode>;
