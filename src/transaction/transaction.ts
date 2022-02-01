import { DocumentNode } from '@apollo/client/core';
import { mergeWith, sortBy } from 'lodash';
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

type TIndexedOperationType = OperationType & { position: number };

type TOperationsByType = Record<
  OperationType['type'],
  Array<TIndexedOperationType>
>;

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

  let operationsCount = 0;

  function pushOperation(operation: OperationType) {
    if (!operationsByType[operation.type]) {
      throw Error(
        `No operationsByType array initialized for "${operation.type}"`
      );
    }
    /**
     * Keeps track of the number of operations performed in this transaction.
     * This is used to store each operation's order in the transaction so that we can map it to the response we get back from SM.
     * SM responds with each operation in the order they were sent up.
     */

    operationsCount += 1;

    /**
     * createNodes creates multiple nodes in a single operation,
     * therefore we need to track the position of these nodes instead of just the position of the operation itself
     */
    if (operation.type === 'createNodes') {
      operationsByType[operation.type].push({
        ...operation,
        position: operationsCount,
        nodes: operation.nodes.map((node, idx) => {
          return {
            ...node,
            position: idx === 0 ? operationsCount : (operationsCount += 1),
          };
        }),
      });
    } else {
      operationsByType[operation.type].push({
        ...operation,
        position: operationsCount,
      });
    }
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

  function sortMutationsByTransactionPosition<T>(
    operations: Array<TIndexedOperationType>
  ) {
    return (sortBy(
      operations,
      operation => operation.position
    ) as unknown) as T;
  }

  function getAllMutations(operations: TOperationsByType): Array<DocumentNode> {
    return [
      ...getMutationsFromTransactionCreateOperations(
        sortMutationsByTransactionPosition([
          ...(operations.createNode as Array<
            CreateNodeOperation & { position: number }
          >),
          ...(operations.createNodes as Array<
            CreateNodesOperation & { position: number }
          >),
        ])
      ),
      ...getMutationsFromTransactionUpdateOperations(
        sortMutationsByTransactionPosition([
          ...(operations.updateNode as Array<
            UpdateNodeOperation & { position: number }
          >),
          ...(operations.updateNodes as Array<
            UpdateNodesOperation & { position: number }
          >),
        ])
      ),
      ...getMutationsFromTransactionDropOperations(
        sortMutationsByTransactionPosition([
          ...(operations.dropNode as Array<
            DropNodeOperation & { position: number }
          >),
        ])
      ),
      ...getMutationsFromEdgeCreateOperations(
        sortMutationsByTransactionPosition([
          ...(operations.createEdge as Array<
            CreateEdgeOperation & { position: number }
          >),
          ...(operations.createEdges as Array<
            CreateEdgesOperation & { position: number }
          >),
        ])
      ),
      ...getMutationsFromEdgeDropOperations(
        sortMutationsByTransactionPosition([
          ...(operations.dropEdge as Array<
            DropEdgeOperation & { position: number }
          >),
          ...(operations.dropEdges as Array<
            DropEdgesOperation & { position: number }
          >),
        ])
      ),
      ...getMutationsFromEdgeReplaceOperations(
        sortMutationsByTransactionPosition([
          ...(operations.replaceEdge as Array<
            ReplaceEdgeOperation & { position: number }
          >),
          ...(operations.replaceEdges as Array<
            ReplaceEdgesOperation & { position: number }
          >),
        ])
      ),
      ...getMutationsFromEdgeUpdateOperations(
        sortMutationsByTransactionPosition([
          ...(operations.updateEdge as Array<
            UpdateEdgeOperation & { position: number }
          >),
          ...(operations.updateEdges as Array<
            UpdateEdgesOperation & { position: number }
          >),
        ])
      ),
    ];
  }

  const tokenName = opts?.tokenName || 'default';
  const token = getToken({ tokenName });

  // TODO: make more semantic
  function groupBySMOperationName(operations: TOperationsByType) {
    const result = Object.entries(operations).reduce((acc, [_, val]) => {
      val.forEach((op: any) => {
        if (acc.hasOwnProperty(op.smOperationName)) {
          acc[op.smOperationName] = [...acc[op.smOperationName], op];
        } else {
          acc[op.smOperationName] = [op];
        }
      });
      return acc;
    }, {} as Record<string, Array<any>>);

    Object.entries(result).forEach(([smOperationName, operations]) => {
      result[smOperationName] = sortBy(
        operations,
        operation => operation.position
      );
    });

    return result;
  }

  if (Array.isArray(callback)) {
    return transactionGroup(callback);
  }

  const result = callback(context);

  function handleSuccessCallbacks(opts: {
    executionResult: Array<{ data: Record<string, any> }>;
    operationsByType: TOperationsByType;
  }) {
    const { executionResult, operationsByType } = opts;

    const operationsBySMOperationName = groupBySMOperationName(
      operationsByType
    );

    const resultData = executionResult[0].data;
    /**
     * Loop through the operations, map the operation to each result sent back from SM,
     * then pass the result into the callback if it exists
     */
    Object.entries(operationsBySMOperationName).forEach(
      ([smOperationName, operations]) => {
        if (resultData.hasOwnProperty(smOperationName)) {
          operations.forEach(operation => {
            const groupedResult = resultData[smOperationName];
            // for createNodes, execute callback on each individual node rather than top-level operation
            if (operation.hasOwnProperty('nodes')) {
              operation.nodes.forEach((node: any) => {
                if (node.hasOwnProperty('onSuccess')) {
                  const operationResult = groupedResult[node.position - 1];
                  node.onSuccess(operationResult);
                }
              });
            } else if (operation.hasOwnProperty('onSuccess')) {
              const operationResult = groupedResult[operation.position - 1];
              operation.onSuccess(operationResult);
            }
          });
        }
      }
    );
  }

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

      if (executionResult) {
        handleSuccessCallbacks({ executionResult, operationsByType });
      }

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

        if (executionResult) {
          handleSuccessCallbacks({ executionResult, operationsByType });
        }

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
