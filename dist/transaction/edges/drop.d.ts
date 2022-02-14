import { DocumentNode } from '@apollo/client/core';
import { DropEdgeOpts, DropEdgeOperation, DropEdgesOperation } from './types';
export declare function dropEdge(edge: DropEdgeOpts): DropEdgeOperation;
export declare function dropEdges(edges: Array<DropEdgeOpts>): DropEdgesOperation;
export declare function getMutationsFromEdgeDropOperations(operations: Array<DropEdgeOperation | DropEdgesOperation>): Array<DocumentNode>;
