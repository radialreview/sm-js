import { DocumentNode } from '@apollo/client/core';
import {
  createEdge,
  createEdges,
  getMutationsFromEdgeCreateOperations,
  dropEdge,
  dropEdges,
  getMutationsFromEdgeDropOperations,
  replaceEdge,
  replaceEdges,
  getMutationsFromEdgeReplaceOperations,
  updateEdge,
  updateEdges,
  getMutationsFromEdgeUpdateOperations,
} from './edges';
import {
  CreateEdgeOperation,
  CreateEdgesOperation,
  DropEdgeOperation,
  DropEdgesOperation,
  ReplaceEdgeOperation,
  ReplaceEdgesOperation,
  UpdateEdgeOperation,
  UpdateEdgesOperation,
} from './edges/types';
import {
  createNode,
  CreateNodeOperation,
  createNodes,
  CreateNodesOperation,
  getMutationsFromTransactionCreateOperations,
} from './create';
import {
  getMutationsFromTransactionUpdateOperations,
  updateNode,
  UpdateNodeOperation,
  updateNodes,
  UpdateNodesOperation,
} from './update';
import {
  dropNode,
  DropNodeOperation,
  getMutationsFromTransactionDropOperations,
} from './drop';

interface ITransactionContext {
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

type OperationType =
  | CreateNodeOperation
  | CreateNodesOperation
  | UpdateNodeOperation
  | UpdateNodesOperation
  | DropNodeOperation
  | CreateEdgeOperation
  | CreateEdgesOperation
  | DropEdgeOperation
  | DropEdgesOperation
  | UpdateEdgeOperation
  | UpdateEdgesOperation
  | ReplaceEdgeOperation
  | ReplaceEdgesOperation;

export function createTransaction(smJSInstance: ISMJS) {
  /**
   * A transaction allows developers to build groups of mutations that execute with transactional integrity
   *   this means if one mutation fails, others are cancelled and any graph state changes are rolled back.
   *
   * The callback function can return a promise if the transaction requires some data fetching to build its list of operations.
   */
  return async function transaction(
    callback: (context: ITransactionContext) => void | Promise<void>,
    opts?: { tokenName: string }
  ) {
    const operationsByType: Record<
      OperationType['type'],
      Array<OperationType>
    > = {
      createNode: [],
      createNodes: [],
      updateNode: [],
      updateNodes: [],
      dropNode: [],
      createEdge: [],
      createEdges: [],
      dropEdge: [],
      dropEdges: [],
      replaceEdge: [],
      replaceEdges: [],
      updateEdge: [],
      updateEdges: [],
    };

    function pushOperation(operation: OperationType) {
      if (!operationsByType[operation.type]) {
        throw Error(
          `No operationsByType array initialized for "${operation.type}"`
        );
      }
      operationsByType[operation.type].push(operation);
    }

    const context: ITransactionContext = {
      createNode: opts => {
        const operation = createNode(opts);
        pushOperation(operation);
        return operation;
      },
      createNodes: opts => {
        const operation = createNodes(opts);
        pushOperation(operation);
        return operation;
      },
      updateNode: opts => {
        const operation = updateNode(opts);
        pushOperation(operation);
        return operation;
      },
      updateNodes: opts => {
        const operation = updateNodes(opts);
        pushOperation(operation);
        return operation;
      },
      dropNode: opts => {
        const operation = dropNode(opts);
        pushOperation(operation);
        return operation;
      },
      createEdge: opts => {
        const operation = createEdge(opts);
        pushOperation(operation);
        return operation;
      },
      createEdges: opts => {
        const operation = createEdges(opts);
        pushOperation(operation);
        return operation;
      },
      dropEdge: opts => {
        const operation = dropEdge(opts);
        pushOperation(operation);
        return operation;
      },
      dropEdges: opts => {
        const operation = dropEdges(opts);
        pushOperation(operation);
        return operation;
      },
      updateEdge: opts => {
        const operation = updateEdge(opts);
        pushOperation(operation);
        return operation;
      },
      updateEdges: opts => {
        const operation = updateEdges(opts);
        pushOperation(operation);
        return operation;
      },
      replaceEdge: opts => {
        const operation = replaceEdge(opts);
        pushOperation(operation);
        return operation;
      },
      replaceEdges: opts => {
        const operation = replaceEdges(opts);
        pushOperation(operation);
        return operation;
      },
    };

    const result = callback(context);

    if (result instanceof Promise) {
      await result;
    }

    const mutations: Array<DocumentNode> = [
      ...getMutationsFromTransactionCreateOperations([
        ...(operationsByType.createNode as Array<CreateNodeOperation>),
        ...(operationsByType.createNodes as Array<CreateNodesOperation>),
      ]),
      ...getMutationsFromTransactionUpdateOperations([
        ...(operationsByType.updateNode as Array<UpdateNodeOperation>),
        ...(operationsByType.updateNodes as Array<UpdateNodesOperation>),
      ]),
      ...getMutationsFromTransactionDropOperations([
        ...(operationsByType.dropNode as Array<DropNodeOperation>),
      ]),
      ...getMutationsFromEdgeCreateOperations([
        ...(operationsByType.createEdge as Array<CreateEdgeOperation>),
        ...(operationsByType.createEdges as Array<CreateEdgesOperation>),
      ]),
      ...getMutationsFromEdgeDropOperations([
        ...(operationsByType.dropEdge as Array<DropEdgeOperation>),
        ...(operationsByType.dropEdges as Array<DropEdgesOperation>),
      ]),
      ...getMutationsFromEdgeReplaceOperations([
        ...(operationsByType.replaceEdge as Array<ReplaceEdgeOperation>),
        ...(operationsByType.replaceEdges as Array<ReplaceEdgesOperation>),
      ]),
      ...getMutationsFromEdgeUpdateOperations([
        ...(operationsByType.updateEdge as Array<UpdateEdgeOperation>),
        ...(operationsByType.updateEdges as Array<UpdateEdgesOperation>),
      ]),
    ];

    const tokenName = opts?.tokenName || 'default';
    const token = smJSInstance.getToken({ tokenName });

    return await smJSInstance.gqlClient.mutate({
      mutations,
      token,
    });
  };
}
