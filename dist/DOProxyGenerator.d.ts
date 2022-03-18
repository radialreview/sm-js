import { ISMJS, ISMData, SMDataDefaultFn, IDOProxy, ISMNode, NodeDO, Maybe, RelationalQueryRecordEntry } from './types';
export declare function createDOProxyGenerator(smJSInstance: ISMJS): <TNodeData extends Record<string, ISMData<any, any, any> | SMDataDefaultFn>, TNodeComputedData extends Record<string, any>, TRelationalResults extends Record<string, IDOProxy | IDOProxy[]>>(opts: {
    node: ISMNode<TNodeData, TNodeComputedData, {}, {}, NodeDO>;
    queryId: string;
    do: NodeDO;
    allPropertiesQueried: Array<string>;
    relationalResults: Maybe<TRelationalResults>;
    relationalQueries: Maybe<Record<string, RelationalQueryRecordEntry>>;
}) => Record<string, any> & import("./types").IDOMethods & import("./types").IDOAccessors & TRelationalResults & IDOProxy;
