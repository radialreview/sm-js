import { ISMNode } from '..';
import { DocumentNode, DeepPartial, GetResultingNodeDataTypeFromNodeDefinition } from '../types';
import { RequiredNodeDataForCreate, OptionalNodeDataForCreate } from './types';
export declare type CreateNodesOperation = {
    type: 'createNodes';
    smOperationName: 'CreateNodes';
    nodes: Array<{
        data: RequiredNodeDataForCreate & Partial<OptionalNodeDataForCreate> & Record<string, any>;
        under?: string | Array<string>;
        position?: number;
        onSuccess?: (data: any) => any;
    }>;
    name?: string;
};
export declare function createNodes(operation: Omit<CreateNodesOperation, 'type' | 'smOperationName'>): CreateNodesOperation;
export declare type CreateNodeOperation<TSMNode extends ISMNode = ISMNode<Record<string, any>>> = {
    type: 'createNode';
    smOperationName: 'CreateNodes';
    data: RequiredNodeDataForCreate & Partial<OptionalNodeDataForCreate> & DeepPartial<GetResultingNodeDataTypeFromNodeDefinition<TSMNode>>;
    under?: string | Array<string>;
    name?: string;
    position?: number;
    onSuccess?: (data: any) => any;
};
export declare function createNode<TSMNode extends ISMNode = ISMNode<Record<string, any>>>(operation: Omit<CreateNodeOperation<TSMNode>, 'type' | 'smOperationName'>): CreateNodeOperation<TSMNode>;
export declare function getMutationsFromTransactionCreateOperations(operations: Array<CreateNodeOperation | CreateNodesOperation>): Array<DocumentNode>;
