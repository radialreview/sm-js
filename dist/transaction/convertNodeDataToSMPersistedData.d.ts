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
/**
 * Takes an object node value and flattens it to be sent to SM
 *
 * @param obj an object with arbitrary data
 * @param parentKey if the value is a nested object, the key of the parent is passed in order to prepend it to the child key
 * @param omitObjectIdentifier skip including __object__ for identifying parent objects,
 *  used to construct filters since there we don't care what the parent property is set to
 * @returns a flat object where the keys are of "key__dot__value" syntax
 *
 * For example:
 * ```typescript
 * const obj = {settings: {schedule: {day: 'Monday'} } }
 *  const result = prepareValueForBE(obj)
 * ```
 * The result will be:
 *  ```typescript
 *  {
 * settings: '__object__',
 * settings__dot__schedule: '__object__',
 * settings__dot__schedule__dot__day: 'Monday',
 * }
 * ```
 */
export declare function prepareObjectForBE(obj: Record<string, any>, opts?: {
    parentKey?: string;
    omitObjectIdentifier?: boolean;
}): Record<string, any>;
