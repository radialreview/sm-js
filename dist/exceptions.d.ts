import { FilterOperator } from './types';
export declare class NotUpToDateException extends Error {
    propName: string;
    constructor(opts: {
        propName: string;
        nodeType: string;
        queryId: string;
    });
}
export declare class NotUpToDateInComputedException extends Error {
    constructor(opts: {
        computedPropName: string;
        propName: string;
        nodeType: string;
        queryId: string;
    });
}
export declare class FilterPropertyNotDefinedInQueryException extends Error {
    constructor(opts: {
        filterPropName: string;
    });
}
export declare class SortPropertyNotDefinedInQueryException extends Error {
    constructor(opts: {
        sortPropName: string;
    });
}
export declare class ImpliedNodePropertyException extends Error {
    constructor(opts: {
        propName: string;
    });
}
export declare class NotCachedException extends Error {
    constructor(opts: {
        nodeType: string;
        id: string;
    });
}
export declare class NodesCollectionPageOutOfBoundsException extends Error {
    constructor(opts: {
        page: number;
    });
}
export declare class DataTypeException extends Error {
    constructor(opts: {
        dataType: string;
        value: any;
    });
}
export declare class DataTypeExplicitDefaultException extends Error {
    constructor(opts: {
        dataType: string;
    });
}
export declare class DataParsingException extends Error {
    constructor(opts: {
        receivedData: any;
        message: string;
    });
}
export declare class UnexpectedSubscriptionMessageException extends Error {
    exception: {
        subscriptionMessage: Record<string, any>;
        description: string;
    };
    constructor(exception: {
        subscriptionMessage: Record<string, any>;
        description: string;
    });
}
export declare class UnexpectedQueryResultException extends Error {
    exception: {
        queryRecord: Record<string, any>;
        resultData: Record<string, any>;
    };
    constructor(exception: {
        queryRecord: Record<string, any>;
        resultData: Record<string, any>;
    });
}
export declare class FilterOperatorNotImplementedException extends Error {
    constructor(exeption: {
        operator: FilterOperator;
    });
}
export declare function throwLocallyLogInProd(error: Error): void;
export declare class UnreachableCaseError extends Error {
    constructor(val: never);
}
