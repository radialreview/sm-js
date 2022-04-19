import { ISMJS, ISMData, SMDataDefaultFn, NodeRelationalQueryBuilderRecord, NodeMutationFn, NodeDO, NodeComputedFns, NodeRelationalFns } from './types';
export declare function createDOFactory(smJSInstance: ISMJS): <TNodeData extends Record<string, ISMData<any, any, any> | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TNodeRelationalData extends NodeRelationalQueryBuilderRecord, TNodeMutations extends Record<string, NodeMutationFn>, TDOClass = new (initialData?: Record<string, any> | undefined) => NodeDO>(node: {
    type: string;
    properties: TNodeData;
    computed?: NodeComputedFns<TNodeData, TNodeComputedData> | undefined;
    relational?: NodeRelationalFns<TNodeRelationalData> | undefined;
    mutations?: TNodeMutations | undefined;
}) => TDOClass;
