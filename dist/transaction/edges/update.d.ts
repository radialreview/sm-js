import { DocumentNode } from '@apollo/client/core';
import { EdgeProperties, UpdateEdgeOperation, UpdateEdgeOpts, UpdateEdgesOperation } from './types';
export declare function updateEdge(edge: UpdateEdgeOpts): UpdateEdgeOperation;
export declare function updateEdges(edges: Array<{
    edge: EdgeProperties & {
        name?: string;
    };
    onSuccess?: () => any;
}>): UpdateEdgesOperation;
export declare function getMutationsFromEdgeUpdateOperations(operations: Array<UpdateEdgeOperation | UpdateEdgesOperation>): Array<DocumentNode>;
