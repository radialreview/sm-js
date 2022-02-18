import { AdditionalEdgeProperties } from './edges/types';
export declare type NodeData = {
    type?: string;
    childNodes?: Array<NodeData>;
    additionalEdges?: Array<AdditionalEdgeProperties>;
} & Record<string, any>;
