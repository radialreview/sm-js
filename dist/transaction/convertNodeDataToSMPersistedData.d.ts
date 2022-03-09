export declare const JSON_TAG = "__JSON__";
/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @returns stringified params ready for mutation
 */
export declare function convertNodeDataToSMPersistedData(nodeData: Record<string, any>, opts?: {
    skipBooleanStringWrapping?: boolean;
}): string;
