import { DocumentNode } from '@apollo/client/core';
import { sortBy } from 'lodash';
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

type TIndexedOperationType = OperationType & { position?: number };

type TExecutionResult =
  | Array<{
      data: Record<string, any>;
    }>
  | Array<
      Array<{
        data: Record<string, any>;
      }>
    >;

type TOperationsByType = Record<
  OperationType['type'],
  Array<TIndexedOperationType>
>;

export interface IPendingTransaction {
  operations: TOperationsByType;
  execute: () => Promise<any>;
  callbackResult?: void | Promise<any> | Array<IPendingTransaction>;
  token: string;
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

export function createTransaction(
  smJSInstance: ISMJS,
  globalOperationHandlers: {
    onUpdateRequested(update: {
      id: string;
      payload: Record<string, any>;
    }): { onUpdateFailed(): void; onUpdateSuccessful(): void };
  }
) {
  /**
   * A transaction allows developers to build groups of mutations that execute with transactional integrity
   *   this means if one mutation fails, others are cancelled and any graph state changes are rolled back.
   *
   * The callback function can return a promise if the transaction requires some data fetching to build its list of operations.
   */
  return function transaction(
    callback:
      | ((context: ITransactionContext) => void | Promise<void>)
      | Array<IPendingTransaction>,
    opts?: { tokenName: string }
  ) {
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

    /**
     * Keeps track of the number of operations performed in this transaction (for operations that we need to provide callback data for).
     * This is used to store each operation's order in the transaction so that we can map it to the response we get back from SM.
     * SM responds with each operation in the order they were sent up.
     */
    let createOperationsCount = 0;
    let updateOperationsCount = 0;

    function pushOperation(operation: OperationType) {
      if (!operationsByType[operation.type]) {
        throw Error(
          `No operationsByType array initialized for "${operation.type}"`
        );
      }
      /**
       * createNodes/updateNodes creates multiple nodes in a single operation,
       * therefore we need to track the position of these nodes instead of just the position of the operation itself
       */
      if (operation.type === 'createNodes') {
        createOperationsCount += 1;

        operationsByType[operation.type].push({
          ...operation,
          position: createOperationsCount,
          nodes: operation.nodes.map((node, idx) => {
            return {
              ...node,
              position:
                idx === 0
                  ? createOperationsCount
                  : (createOperationsCount += 1),
            };
          }),
        });
      } else if (operation.type === 'createNode') {
        createOperationsCount += 1;

        operationsByType[operation.type].push({
          ...operation,
          position: createOperationsCount,
        });
      } else if (operation.type === 'updateNodes') {
        updateOperationsCount += 1;

        operationsByType[operation.type].push({
          ...operation,
          position: updateOperationsCount,
          nodes: operation.nodes.map((node, idx) => {
            return {
              ...node,
              position:
                idx === 0
                  ? updateOperationsCount
                  : (updateOperationsCount += 1),
            };
          }),
        });
      } else if (operation.type === 'updateNode') {
        updateOperationsCount += 1;
        operationsByType[operation.type].push({
          ...operation,
          position: updateOperationsCount,
        });
      } else {
        operationsByType[operation.type].push(operation);
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
        const {
          onUpdateSuccessful,
          onUpdateFailed,
        } = globalOperationHandlers.onUpdateRequested({
          id: opts.data.id,
          payload: opts.data,
        });

        pushOperation({
          ...operation,
          onSuccess: data => {
            operation.onSuccess && operation.onSuccess(data);
            onUpdateSuccessful();
          },
          onFail: () => {
            operation.onFail && operation.onFail();
            onUpdateFailed();
          },
        });
        return operation;
      },
      updateNodes: opts => {
        const operation = updateNodes(opts);

        const globalHandlers = opts.nodes.map(node => {
          return globalOperationHandlers.onUpdateRequested({
            id: node.data.id,
            payload: node.data,
          });
        });
        pushOperation({
          ...operation,
          nodes: operation.nodes.map((node, nodeIdx) => ({
            ...node,
            onSuccess: data => {
              node.onSuccess && node.onSuccess(data);
              globalHandlers[nodeIdx].onUpdateSuccessful();
            },
            onFail: () => {
              node.onFail && node.onFail();
              globalHandlers[nodeIdx].onUpdateFailed();
            },
          })),
        });
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

    function getAllMutations(
      operations: TOperationsByType
    ): Array<DocumentNode> {
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
    const token = smJSInstance.getToken({ tokenName });

    /**
     * Group operations by their SM operation name, sorted by position if applicable
     */
    function groupBySMOperationName(operations: TOperationsByType) {
      const result = Object.entries(operations).reduce(
        (acc, [_, operations]) => {
          operations.forEach(
            (operation: TIndexedOperationType | OperationType) => {
              if (acc.hasOwnProperty(operation.smOperationName)) {
                acc[operation.smOperationName] = [
                  ...acc[operation.smOperationName],
                  operation,
                ];
              } else {
                acc[operation.smOperationName] = [operation];
              }
            }
          );
          return acc;
        },
        {} as Record<string, Array<any>>
      );

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

    function handleErrorCallbacks(opts: {
      operationsByType: TOperationsByType;
    }) {
      const { operationsByType } = opts;

      const operationsBySMOperationName = groupBySMOperationName(
        operationsByType
      );

      Object.entries(operationsBySMOperationName).forEach(
        ([smOperationName, operations]) => {
          operations.forEach(operation => {
            // we only need to gather the data for node create/update operations
            if (
              smOperationName === 'CreateNodes' ||
              smOperationName === 'UpdateNodes'
            ) {
              // for createNodes, execute callback on each individual node rather than top-level operation
              if (operation.hasOwnProperty('nodes')) {
                operation.nodes.forEach((node: any) => {
                  if (node.hasOwnProperty('onFail')) {
                    node.onFail();
                  }
                });
              } else if (operation.hasOwnProperty('onFail')) {
                operation.onFail();
              }
            }
          });
        }
      );
    }

    function handleSuccessCallbacks(opts: {
      executionResult: TExecutionResult;
      operationsByType: TOperationsByType;
    }) {
      const { executionResult, operationsByType } = opts;

      const operationsBySMOperationName = groupBySMOperationName(
        operationsByType
      );

      /**
       * Loop through the operations, map the operation to each result sent back from SM,
       * then pass the result into the callback if it exists
       */
      const executeCallbacksWithData = (executionResult: TExecutionResult) => {
        executionResult.forEach(
          (
            result:
              | {
                  data: Record<string, any>;
                }
              | {
                  data: Record<string, any>;
                }[]
          ) => {
            // if executionResult is 2d array
            if (Array.isArray(result)) {
              executeCallbacksWithData(result);
            } else {
              const resultData = result.data;

              Object.entries(operationsBySMOperationName).forEach(
                ([smOperationName, operations]) => {
                  if (resultData.hasOwnProperty(smOperationName)) {
                    operations.forEach(operation => {
                      // we only need to gather the data for node create/update operations
                      if (
                        smOperationName === 'CreateNodes' ||
                        smOperationName === 'UpdateNodes'
                      ) {
                        const groupedResult = resultData[smOperationName];
                        // for createNodes, execute callback on each individual node rather than top-level operation
                        if (operation.hasOwnProperty('nodes')) {
                          operation.nodes.forEach((node: any) => {
                            if (node.hasOwnProperty('onSuccess')) {
                              const operationResult =
                                groupedResult[node.position - 1];

                              node.onSuccess(operationResult);
                            }
                          });
                        } else if (operation.hasOwnProperty('onSuccess')) {
                          const operationResult =
                            groupedResult[operation.position - 1];
                          operation.onSuccess(operationResult);
                        }
                      }
                    });
                  }
                }
              );
            }
          }
        );
      };

      executeCallbacksWithData(executionResult);

      /**
       * For all other operations, just invoke the callback with no args.
       * Transactions will guarantee that all operations have succeeded, so this is safe to do
       */
      Object.entries(operationsBySMOperationName).forEach(
        ([smOperationName, operations]) => {
          if (
            smOperationName !== 'CreateNodes' &&
            smOperationName !== 'UpdateNodes'
          ) {
            operations.forEach(operation => {
              if (operation.hasOwnProperty('onSuccess')) {
                operation.onSuccess();
              } else if (operation.hasOwnProperty('edges')) {
                (operation.edges as CreateEdgesOperation['edges']).forEach(
                  edgeOperation => {
                    if (edgeOperation.hasOwnProperty('onSuccess')) {
                      edgeOperation.onSuccess!();
                    }
                  }
                );
              }
            });
          }
        }
      );
    }

    async function execute() {
      try {
        if (typeof callback === 'function') {
          if (result instanceof Promise) {
            await result;
          }
        }
        const mutations = getAllMutations(operationsByType);

        const executionResult: TExecutionResult = await smJSInstance.gqlClient.mutate(
          {
            mutations,
            token,
          }
        );

        if (executionResult) {
          handleSuccessCallbacks({
            executionResult,
            operationsByType,
          });
        }

        return executionResult;
      } catch (error) {
        handleErrorCallbacks({
          operationsByType,
        });
        throw error;
      }
    }

    return {
      operations: operationsByType,
      execute,
      callbackResult: result,
      token,
    };

    function transactionGroup(
      transactions: Array<IPendingTransaction>
    ): Omit<IPendingTransaction, 'callbackResult'> {
      const asyncCallbacks = transactions
        .filter(tx => tx.callbackResult instanceof Promise)
        .map(({ callbackResult }) => callbackResult);

      async function execute() {
        try {
          const allTokensMatch = transactions.every(
            ({ token }) => token === transactions[0].token
          );

          if (!allTokensMatch) {
            throw new Error(
              'transactionGroup - All grouped transactions must use the same authentication token.'
            );
          }

          if (asyncCallbacks.length) {
            await Promise.all(asyncCallbacks);
          }

          const allMutations = transactions.map(({ operations }) => {
            return smJSInstance.gqlClient.mutate({
              mutations: getAllMutations(operations),
              token,
            });
          });

          const executionResults: Array<TExecutionResult> = await Promise.all(
            allMutations
          );

          if (executionResults) {
            executionResults.forEach((result, idx) => {
              handleSuccessCallbacks({
                executionResult: result,
                operationsByType: transactions[idx].operations,
              });
            });
          }

          return executionResults.flat();
        } catch (error) {
          throw error;
        }
      }

      return {
        operations: operationsByType,
        execute,
        token,
      };
    }
  };
}
