import { DataDefaultFn, IData } from '../types';
/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @param IDataRecord a record of Data types to identify objects vs records
 * @param generatingMockData a boolean to determine if escape text should be utilized
 * @returns stringified params ready for mutation
 */
export declare function revisedConvertNodeDataToSMPersistedData(opts: {
    nodeData: Record<string, any>;
    IDataRecord: Record<string, IData<any> | DataDefaultFn>;
    generatingMockData: boolean;
    skipBooleanStringWrapping?: boolean;
}): string;
/**
 * Takes an object node value and flattens it to be sent to SM
 *
 * @param obj an object with arbitrary data
 * @param IDataRecordForKey a record of Data type for specific key to identify objects vs records
 * @param generatingMockData a boolean to determine if escape text should be utilized
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
export declare function revisedPrepareObjectForBE(opts: {
    obj: Record<string, any>;
    IDataRecordForKey: IData<any>;
    generatingMockData: boolean;
    parentKey?: string;
    omitObjectIdentifier?: boolean;
}): Record<string, any>;
export declare function revisedPrepareForBE(opts: {
    obj: Record<string, any>;
    IDataRecord: Record<string, IData<any> | DataDefaultFn>;
    generatingMockData: boolean;
}): Record<string, any>;
