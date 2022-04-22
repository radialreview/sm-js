import { DocumentNode } from '@apollo/client/core';
import { ReplaceEdgeOperation, ReplaceEdgeOpts, ReplaceEdgeProperties, ReplaceEdgesOperation } from './types';
export declare function replaceEdge(edge: ReplaceEdgeOpts): ReplaceEdgeOperation;
export declare function replaceEdges(edges: Array<{
    edge: ReplaceEdgeProperties & {
        name?: string;
    };
    onSuccess?: () => any;
}>): ReplaceEdgesOperation;
export declare function getMutationsFromEdgeReplaceOperations(operations: Array<ReplaceEdgeOperation | ReplaceEdgesOperation>): Array<DocumentNode>;
