import { gql } from '@apollo/client/core';
import { ISMNode } from '..';

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
  smOperationName: 'CreateNodes';
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
  operation: Omit<CreateNodesOperation, 'type' | 'smOperationName'>
): CreateNodesOperation {
  return {
    type: 'createNodes',
    smOperationName: 'CreateNodes',
    ...operation,
  };
}

export type CreateNodeOperation<
  TSMNode extends ISMNode = ISMNode<any, Record<string, any>>
> = {
  type: 'createNode';
  smOperationName: 'CreateNodes';
  data: RequiredNodeDataForCreate &
    Partial<OptionalNodeDataForCreate> &
    // when creating a node, all we need is a deep partial of all the node's data
    // since, at query time, sm-js will fill any properties which were not provided on create
    DeepPartial<GetResultingDataTypeFromNodeDefinition<TSMNode>>;
  under?: string | Array<string>;
  name?: string;
  position?: number;
  onSuccess?: (data: any) => any;
};

export function createNode<
  TSMNode extends ISMNode = ISMNode<any, Record<string, any>>
>(
  operation: Omit<CreateNodeOperation<TSMNode>, 'type' | 'smOperationName'>
): CreateNodeOperation<TSMNode> {
  return {
    type: 'createNode',
    smOperationName: 'CreateNodes',
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
  const dataToPersistInSM = convertNodeDataToSMPersistedData(operation.data);
  let mutationArgs: Array<string> = [
    `node: {
        ${dataToPersistInSM}
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
