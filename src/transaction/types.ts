import { AdditionalEdgeProperties } from './edges/types';

export type RequiredNodeDataForCreate = {
  type: string;
};

export type OptionalNodeDataForCreate = {
  childNodes: Array<RequiredNodeDataForCreate & Record<string, any>>;
  additionalEdges: Array<AdditionalEdgeProperties>;
};
