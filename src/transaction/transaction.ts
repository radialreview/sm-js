import { DocumentNode } from '@apollo/client/core';

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
}

type OperationType =
  | CreateNodeOperation
  | CreateNodesOperation
  | UpdateNodeOperation
  | UpdateNodesOperation
  | DropNodeOperation;

/**
 * A transaction allows developers to build groups of mutations that execute with transactional integrity
 *   this means if one mutation fails, others are cancelled and any graph state changes are rolled back.
 *
 * The callback function can return a promise if the transaction requires some data fetching to build its list of operations.
 */
export async function transaction(
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
  ];

  const tokenName = opts?.tokenName || 'default';
  const token = getToken({ tokenName });

  return await getConfig().gqlClient.mutate({
    mutations,
    token,
  });
}
