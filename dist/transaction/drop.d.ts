import { DocumentNode } from '@apollo/client/core';
export declare type DropNodeOperation = {
    type: 'dropNode';
    smOperationName: 'DropNode';
    id: string;
    name?: string;
    onSuccess?: () => any;
};
export declare function dropNode(operation: Omit<DropNodeOperation, 'type' | 'smOperationName'>): DropNodeOperation;
export declare function getMutationsFromTransactionDropOperations(operations: Array<DropNodeOperation>): Array<DocumentNode>;
