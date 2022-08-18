import { DocumentNode } from '@apollo/client/core';
import { CreateEdgeOperation, CreateEdgeOpts, CreateEdgesOperation } from './types';
export declare function createEdge(edge: CreateEdgeOpts): CreateEdgeOperation;
export declare function createEdges(edges: CreateEdgesOperation['edges']): CreateEdgesOperation;
export declare function getMutationsFromEdgeCreateOperations(operations: Array<CreateEdgeOperation | CreateEdgesOperation>): Array<DocumentNode>;
