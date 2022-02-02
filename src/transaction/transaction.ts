import { DocumentNode } from '@apollo/client/core';
import { mergeWith } from 'lodash';
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
import { getConfig } from '../config';
import { getToken } from '../auth';

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

type TOperationsByType = Record<OperationType['type'], Array<OperationType>>;

interface IPendingTransaction {
  operations: TOperationsByType;
  execute: () => Promise<any>;
  callbackResult?: void | Promise<any> | Array<IPendingTransaction>;
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

/**
 * A transaction allows developers to build groups of mutations that execute with transactional integrity
 *   this means if one mutation fails, others are cancelled and any graph state changes are rolled back.
 *
 * The callback function can return a promise if the transaction requires some data fetching to build its list of operations.
 */
export function transaction(
  callback:
    | ((context: ITransactionContext) => void | Promise<void>)
    | Array<IPendingTransaction>,
  opts?: { tokenName: string }
): IPendingTransaction {
  const operationsByType: TOperationsByType = {
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

  function getAllMutations(operations: TOperationsByType): Array<DocumentNode> {
    return [
      ...getMutationsFromTransactionCreateOperations([
        ...(operations.createNode as Array<CreateNodeOperation>),
        ...(operations.createNodes as Array<CreateNodesOperation>),
      ]),
      ...getMutationsFromTransactionUpdateOperations([
        ...(operations.updateNode as Array<UpdateNodeOperation>),
        ...(operations.updateNodes as Array<UpdateNodesOperation>),
      ]),
      ...getMutationsFromTransactionDropOperations([
        ...(operations.dropNode as Array<DropNodeOperation>),
      ]),
      ...getMutationsFromEdgeCreateOperations([
        ...(operations.createEdge as Array<CreateEdgeOperation>),
        ...(operations.createEdges as Array<CreateEdgesOperation>),
      ]),
      ...getMutationsFromEdgeDropOperations([
        ...(operations.dropEdge as Array<DropEdgeOperation>),
        ...(operations.dropEdges as Array<DropEdgesOperation>),
      ]),
      ...getMutationsFromEdgeReplaceOperations([
        ...(operations.replaceEdge as Array<ReplaceEdgeOperation>),
        ...(operations.replaceEdges as Array<ReplaceEdgesOperation>),
      ]),
      ...getMutationsFromEdgeUpdateOperations([
        ...(operations.updateEdge as Array<UpdateEdgeOperation>),
        ...(operations.updateEdges as Array<UpdateEdgesOperation>),
      ]),
    ];
  }

  const tokenName = opts?.tokenName || 'default';
  const token = getToken({ tokenName });

  if (Array.isArray(callback)) {
    return transactionGroup(callback);
  }

  const result = callback(context);

  async function execute() {
    try {
      if (result instanceof Promise) {
        await result;
      }

      const mutations = getAllMutations(operationsByType);

      const executionResult = await getConfig().gqlClient.mutate({
        mutations,
        token,
      });

      return executionResult;
    } catch (error) {
      throw error;
    }
  }

  return {
    operations: operationsByType,
    execute,
    callbackResult: result,
  };

  function transactionGroup(
    transactions: Array<IPendingTransaction>
  ): Omit<IPendingTransaction, 'callbackResult'> {
    const asyncCallbacks = transactions
      .filter(tx => tx.callbackResult instanceof Promise)
      .map(({ callbackResult }) => callbackResult);

    async function execute() {
      try {
        if (asyncCallbacks.length) {
          await Promise.all(asyncCallbacks);
        }

        const operationsByType: TOperationsByType = transactions.reduce(
          (acc, tx) => {
            return mergeWith(acc, tx.operations, (objValue, srcValue) => {
              if (Array.isArray(objValue)) {
                return objValue.concat(srcValue);
              }
              return srcValue;
            });
          },
          {} as TOperationsByType
        );

        const mutations = getAllMutations(operationsByType);

        const executionResult = await getConfig().gqlClient.mutate({
          mutations,
          token,
        });

        return executionResult;
      } catch (error) {
        throw error;
      }
    }

    return {
      operations: operationsByType,
      execute,
    };
  }
}
