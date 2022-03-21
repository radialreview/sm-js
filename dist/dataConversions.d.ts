export declare const JSON_TAG = "__JSON__";
export declare const NULL_TAG = "__NULL__";
export declare function parseJSONFromBE(jsonString: string): any;
export declare function prepareValueForFE(value: any): any;
export declare function prepareForFE(beData: Record<string, any>): Record<string, any>;
