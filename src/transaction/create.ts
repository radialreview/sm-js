import { gql } from '@apollo/client/core';
import { INode } from '..';

import {
  DocumentNode,
  DeepPartial,
  GetResultingDataTypeFromNodeDefinition,
} from '../types';
import { convertNodeDataToSMPersistedData } from './convertNodeDataToSMPersistedData';
import { getMutationNameFromOperations } from './getMutationNameFromOperations';
import { RequiredNodeDataForCreate, OptionalNodeDataForCreate } from './types';

export type CreateNodesOperation = {
  type: 'createNodes';
  operationName: 'CreateNodes';
  nodes: Array<{
    data: RequiredNodeDataForCreate &
      Partial<OptionalNodeDataForCreate> &
      Record<string, any>;
    under?: string | Array<string>;
    position?: number;
    onSuccess?: (data: any) => any;
  }>;
  name?: string;
};

export function createNodes(
  operation: Omit<CreateNodesOperation, 'type' | 'operationName'>
): CreateNodesOperation {
  return {
    type: 'createNodes',
    operationName: 'CreateNodes',
    ...operation,
  };
}

export type CreateNodeOperation<
  TNode extends INode = INode<any, Record<string, any>>
> = {
  type: 'createNode';
  operationName: 'CreateNodes';
  data: RequiredNodeDataForCreate &
    Partial<OptionalNodeDataForCreate> &
    // when creating a node, all we need is a deep partial of all the node's data
    // since, at query time, sm-js will fill any properties which were not provided on create
    DeepPartial<GetResultingDataTypeFromNodeDefinition<TNode>>;
  under?: string | Array<string>;
  name?: string;
  position?: number;
  onSuccess?: (data: any) => any;
};

export function createNode<
  TNode extends INode = INode<any, Record<string, any>>
>(
  operation: Omit<CreateNodeOperation<TNode>, 'type' | 'operationName'>
): CreateNodeOperation<TNode> {
  return {
    type: 'createNode',
    operationName: 'CreateNodes',
    ...operation,
  };
}

export function getMutationsFromTransactionCreateOperations(
  operations: Array<CreateNodeOperation | CreateNodesOperation>
): Array<DocumentNode> {
  if (!operations.length) return [];
  const allCreateNodeOperations: Array<{
    data: RequiredNodeDataForCreate;
    under?: string | Array<string>;
  }> = operations.flatMap(operation => {
    if (operation.type === 'createNode') {
      return operation;
    } else if (operation.type === 'createNodes') {
      return operation.nodes;
    } else {
      throw Error(`Operation not recognized: "${operation}"`);
    }
  });

  const name = getMutationNameFromOperations(operations, 'CreateNodes');

  // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations
  return [
    gql`
      mutation ${name} {
        CreateNodes(
          createOptions: [
            ${allCreateNodeOperations
              .map(convertCreateNodeOperationToCreateNodesMutationArguments)
              .join('\n')}
          ]
          transactional: true
        ) {
          id
        }
      }
    `,
  ];
}

function convertCreateNodeOperationToCreateNodesMutationArguments(operation: {
  data: RequiredNodeDataForCreate;
  under?: string | Array<string>;
}): string {
  const dataToPersist = convertNodeDataToSMPersistedData(operation.data);
  let mutationArgs: Array<string> = [
    `node: {
        ${dataToPersist}
      }`,
  ];

  if (operation.under) {
    const value =
      typeof operation.under === 'string'
        ? `["${operation.under}"]`
        : `["${operation.under.join('", "')}"]`;

    mutationArgs.push(`underIds: ${value}`);
  }

  return `{
    ${mutationArgs.join('\n')}
  }`;
}
