<<<<<<< HEAD
import { FilterCondition, FilterOperator, INode, SortObject, ValidFilterForNode, ValidSortForNode } from './types';
=======
import { INode, SortObject, ValidFilterForNode, ValidSortForNode } from './types';
>>>>>>> origin/mm-gql
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
/**
 * Returns all the keys of the object in a dot(.) separate format.
 *
 * Example.
 *
 * ```
 * getFlattenedObjectKeys({
 *  user: {
 *    firstName: 'John',
 *    lastName: 'Doe',
 *    meetings: [1,2,3],
 *    company: {
 *      name: 'Acme'
 *    }
 *  }
 * })
 * ```
 *
 * will return
 * ```
 * ['user.firstName', 'user.lastName', 'user.meetings', 'user.company.name']
 * ```
 *
 * Note: This won't flatten any array values
 *
 * @param obj - Object to flatten
 */
export declare function getFlattenedObjectKeys(obj: Record<string, any>): string[];
/**
 * Returns flattened keys of the filter object
 *
 * ```
 * getFlattenedNodeFilterObject({
 *  settings: {
 *    time: {_lte: Date.now()},
 *    nested: {
 *      prop: {_contains: "text"}
 *    }
 *  },
 *  firstName: {_eq: 'John'}
 * })
 * ```
 *
 * Returns
 *
 * ```
 * {
 *  "settings.time": {_lte: Date.now()},
 *  "settings.nested.prop": {_contains: "text"},
 *  "firstName": {_eq: 'John'}
 * }
 * ```
 * @param filterObject : ;
 * @returns
 */
<<<<<<< HEAD
export declare function getFlattenedNodeFilterObject<TNode extends INode>(filterObject: ValidFilterForNode<TNode>): Record<string, Partial<Record<FilterOperator, any>> & {
    _condition: FilterCondition;
}>;
=======
export declare function getFlattenedNodeFilterObject<TNode extends INode>(filterObject: ValidFilterForNode<TNode>): Record<string, any>;
>>>>>>> origin/mm-gql
export declare function getFlattenedNodeSortObject<TNode extends INode>(sortObject: ValidSortForNode<TNode>): Record<string, SortObject>;
