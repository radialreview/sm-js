/**
 * Clones an object or array. Recurses into nested objects and arrays for deep clones.
 */
export declare function deepClone<T extends Record<string, any> | Array<any>>(obj: T): T;
export declare function clearObject(opts: {
    object: Record<string, any>;
}): void;
export declare function extend(opts: {
    object: Record<string, any>;
    extension: Record<string, any>;
    deleteKeysNotInExtension: boolean;
    extendNestedObjects: boolean;
}): void;
