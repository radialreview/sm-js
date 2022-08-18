import { AdditionalEdgeProperties } from './edges/types';
export declare type RequiredNodeDataForCreate = {
    type: string;
};
export declare type OptionalNodeDataForCreate = {
    childNodes: Array<RequiredNodeDataForCreate & Record<string, any>>;
    additionalEdges: Array<AdditionalEdgeProperties>;
};
