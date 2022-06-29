export declare class SMNotUpToDateException extends Error {
    propName: string;
    constructor(opts: {
        propName: string;
        nodeType: string;
        queryId: string;
    });
}
export declare class SMNotUpToDateInComputedException extends Error {
    constructor(opts: {
        computedPropName: string;
        propName: string;
        nodeType: string;
        queryId: string;
    });
}
export declare class SMImpliedNodePropertyException extends Error {
    constructor(opts: {
        propName: string;
    });
}
export declare class SMNotCachedException extends Error {
    constructor(opts: {
        nodeType: string;
        id: string;
    });
}
export declare class SMDataTypeException extends Error {
    constructor(opts: {
        dataType: string;
        value: any;
    });
}
export declare class SMDataTypeExplicitDefaultException extends Error {
    constructor(opts: {
        dataType: string;
    });
}
export declare class SMDataParsingException extends Error {
    constructor(opts: {
        receivedData: any;
        message: string;
    });
}
export declare class SMUnexpectedSubscriptionMessageException extends Error {
    exception: {
        subscriptionMessage: Record<string, any>;
        description: string;
    };
    constructor(exception: {
        subscriptionMessage: Record<string, any>;
        description: string;
    });
}
export declare class SMUnexpectedQueryResultException extends Error {
    exception: {
        queryRecord: Record<string, any>;
        resultData: Record<string, any>;
    };
    constructor(exception: {
        queryRecord: Record<string, any>;
        resultData: Record<string, any>;
    });
}
export declare function throwLocallyLogInProd(error: Error): void;
export declare class UnreachableCaseError extends Error {
    constructor(val: never);
}
