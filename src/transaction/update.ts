import { DocumentNode, gql } from '@apollo/client/core';
import { OBJECT_PROPERTY_SEPARATOR } from '..';

import {
  DeepPartial,
  GetResultingNodeDataTypeFromNodeDefinition,
  ISMNode,
} from '../types';
import { convertNodeDataToSMPersistedData } from './convertNodeDataToSMPersistedData';
import { getMutationNameFromOperations } from './getMutationNameFromOperations';

export type UpdateNodesOperation = {
  type: 'updateNodes';
  smOperationName: 'UpdateNodes';
  nodes: Array<{
    data: { id: string } & Record<string, any>;
    position?: number;
    onSuccess?: (data: any) => void;
    onFail?: () => void;
  }>;
  name?: string;
};

export function updateNodes(
  operation: Omit<UpdateNodesOperation, 'type' | 'smOperationName'>
): UpdateNodesOperation {
  return {
    type: 'updateNodes',
    smOperationName: 'UpdateNodes',
    ...operation,
  };
}

export type UpdateNodeOperation<
  TSMNode extends ISMNode = ISMNode<Record<string, any>>
> = {
  type: 'updateNode';
  smOperationName: 'UpdateNodes';
  data: { id: string } & DeepPartial<
    GetResultingNodeDataTypeFromNodeDefinition<TSMNode>
  >;
  name?: string;
  onSuccess?: (data: any) => void;
  onFail?: () => void;
};

export function updateNode<
  TSMNode extends ISMNode = ISMNode<Record<string, any>>
>(
  operation: Omit<UpdateNodeOperation<TSMNode>, 'type' | 'smOperationName'>
): UpdateNodeOperation<TSMNode> {
  return {
    type: 'updateNode',
    smOperationName: 'UpdateNodes',
    ...operation,
  };
}

function getPropertiesToNull(object: Record<string, any>) {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (value == null) acc.push(key);
    else if (!Array.isArray(value) && typeof value === 'object') {
      acc.push(
        ...getPropertiesToNull(value).map(
          property => `${key}${OBJECT_PROPERTY_SEPARATOR}${property}`
        )
      );
    }

    return acc;
  }, [] as Array<string>);
}

export function getMutationsFromTransactionUpdateOperations(
  operations: Array<UpdateNodeOperation | UpdateNodesOperation>
): Array<DocumentNode> {
  if (!operations.length) return [];

  const allUpdateNodeOperations: Array<{
    id: string;
  }> = operations.flatMap(operation => {
    if (operation.type === 'updateNode') {
      return operation.data;
    } else if (operation.type === 'updateNodes') {
      return operation.nodes.map(({ data }) => data);
    } else {
      throw Error(`Operation not recognized: "${operation}"`);
    }
  });

  const name = getMutationNameFromOperations(operations, 'UpdateNodes');

  const dropPropertiesMutations = allUpdateNodeOperations.reduce(
    (acc, updateNodeOperation) => {
      const propertiesToNull = getPropertiesToNull(updateNodeOperation);
      if (propertiesToNull.length) {
        acc.push(gql`
        mutation {
          DropProperties(
            nodeIds: ["${updateNodeOperation.id}"]
            propertyNames: [${propertiesToNull
              .map(prop => `"${prop}${OBJECT_PROPERTY_SEPARATOR}*"`)
              .join(',')}]
  
          )
          { 
            id
          }
      }
      `);
      }
      return acc;
    },
    [] as Array<DocumentNode>
  );

  // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations
  return [
    gql`
        mutation ${name} {
          UpdateNodes(
            nodes: [
              ${allUpdateNodeOperations
                .map(convertUpdateNodeOperationToUpdateNodesMutationArguments)
                .join('\n')}
            ] 
          ) {
            id
          }
        }
      `,
  ].concat(dropPropertiesMutations);
}

function convertUpdateNodeOperationToUpdateNodesMutationArguments(operation: {
  id: string;
}): string {
  const dataToPersistInSM = convertNodeDataToSMPersistedData(operation);

  return `{
      ${dataToPersistInSM}
    }`;
}
