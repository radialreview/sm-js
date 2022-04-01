import { createEdge, createEdges, dropEdge, dropEdges, replaceEdge, replaceEdges, updateEdge, updateEdges } from './edges';
import { CreateEdgeOperation, CreateEdgesOperation, DropEdgeOperation, DropEdgesOperation, ReplaceEdgeOperation, ReplaceEdgesOperation, UpdateEdgeOperation, UpdateEdgesOperation } from './edges/types';
import { createNode, CreateNodeOperation, createNodes, CreateNodesOperation } from './create';
import { updateNode, UpdateNodeOperation, updateNodes, UpdateNodesOperation } from './update';
import { dropNode, DropNodeOperation } from './drop';
import { ISMJS } from '../types';
export interface ITransactionContext {
    createNodes: typeof createNodes;
    createNode: typeof createNode;
    updateNodes: typeof updateNodes;
    updateNode: typeof updateNode;
    dropNode: typeof dropNode;
    createEdge: typeof createEdge;
    createEdges: typeof createEdges;
    dropEdge: typeof dropEdge;
    dropEdges: typeof dropEdges;
    updateEdge: typeof updateEdge;
    updateEdges: typeof updateEdges;
    replaceEdge: typeof replaceEdge;
    replaceEdges: typeof replaceEdges;
}
declare type TIndexedOperationType = OperationType & {
    position?: number;
};
declare type TExecutionResult = Array<{
    data: Record<string, any>;
}> | Array<Array<{
    data: Record<string, any>;
}>>;
declare type TOperationsByType = Record<OperationType['type'], Array<TIndexedOperationType>>;
export interface IPendingTransaction {
    operations: TOperationsByType;
    execute: () => Promise<any>;
    callbackResult?: void | Promise<any> | Array<IPendingTransaction>;
    token: string;
}
declare type OperationType = CreateNodeOperation | CreateNodesOperation | UpdateNodeOperation | UpdateNodesOperation | DropNodeOperation | CreateEdgeOperation | CreateEdgesOperation | DropEdgeOperation | DropEdgesOperation | UpdateEdgeOperation | UpdateEdgesOperation | ReplaceEdgeOperation | ReplaceEdgesOperation;
export declare function createTransaction(smJSInstance: ISMJS, globalOperationHandlers: {
    onUpdateRequested(update: {
        id: string;
        payload: Record<string, any>;
    }): {
        onUpdateFailed(): void;
        onUpdateSuccessful(): void;
    };
}): (callback: IPendingTransaction[] | ((context: ITransactionContext) => void | Promise<void>), opts?: {
    tokenName?: string | undefined;
} | undefined) => Omit<IPendingTransaction, "callbackResult"> | {
    operations: TOperationsByType;
    execute: () => Promise<TExecutionResult>;
    callbackResult: void | Promise<void>;
    token: string;
};
export {};
