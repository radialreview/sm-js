import { INode } from '..';
import { DocumentNode, DeepPartial, GetResultingDataTypeFromNodeDefinition } from '../types';
import { RequiredNodeDataForCreate, OptionalNodeDataForCreate } from './types';
export declare type CreateNodesOperation = {
    type: 'createNodes';
    operationName: 'CreateNodes';
    nodes: Array<{
        data: RequiredNodeDataForCreate & Partial<OptionalNodeDataForCreate> & Record<string, any>;
        under?: string | Array<string>;
        position?: number;
        onSuccess?: (data: any) => any;
    }>;
    name?: string;
};
export declare function createNodes(operation: Omit<CreateNodesOperation, 'type' | 'operationName'>): CreateNodesOperation;
export declare type CreateNodeOperation<TNode extends INode = INode<any, Record<string, any>>> = {
    type: 'createNode';
    operationName: 'CreateNodes';
    data: RequiredNodeDataForCreate & Partial<OptionalNodeDataForCreate> & DeepPartial<GetResultingDataTypeFromNodeDefinition<TNode>>;
    under?: string | Array<string>;
    name?: string;
    position?: number;
    onSuccess?: (data: any) => any;
};
export declare function createNode<TNode extends INode = INode<any, Record<string, any>>>(operation: Omit<CreateNodeOperation<TNode>, 'type' | 'operationName'>): CreateNodeOperation<TNode>;
export declare function getMutationsFromTransactionCreateOperations(operations: Array<CreateNodeOperation | CreateNodesOperation>): Array<DocumentNode>;
