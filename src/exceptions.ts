// thrown when any property on the DO is accessed but is not marked as upToDate
// by calling DO.setUpToDateData({ [propName]: true })
// or DO.setUpToDateData({ nested: { [propName]: true } })
// this is done automatically by smData fetchers, smQuery and smSubscribe
// so this error should only occur when data is accessed but was never queried or is not currently being subscribed to (is cached only)
export class SMNotUpToDateException extends Error {
  public propName: string;

  constructor(opts: { propName: string; nodeType: string; queryId: string }) {
    super(
      `SMNotUpToDate exception - The property "${opts.propName}" on the DO for the node type ${opts.nodeType} was read but is not guaranteed to be up to date. Add that property to the query with the id ${opts.queryId}`
    );
    this.propName = opts.propName;
  }
}

export class SMNotUpToDateInComputedException extends Error {
  constructor(opts: {
    computedPropName: string;
    propName: string;
    nodeType: string;
    queryId: string;
  }) {
    super(
      `SMNotUpToDateInComputed exception - The property "${opts.propName}" on the DO for the node type "${opts.nodeType}" was read for the computed property "${opts.computedPropName}" but is not guaranteed to be up to date. Add that property to the query with the id ${opts.queryId}`
    );
  }
}
export class SMImpliedNodePropertyException extends Error {
  constructor(opts: { propName: string }) {
    super(
      `SMImpliedPropertyException exception - The property "${opts.propName}" is implied and cannot be customized within a node definition.`
    );
  }
}

export class SMNotCachedException extends Error {
  constructor(opts: { nodeType: string; id: string }) {
    super(
      `SMNotCached exception - Attempted to get the node with the type "${opts.nodeType}" and id "${opts.id}" but it was not cached.`
    );
  }
}

export class SMDataTypeException extends Error {
  constructor(opts: { dataType: string; value: any }) {
    super(
      `SMDataType exception - the data type ${opts.dataType} received a bad value. Value: "${opts.value}"`
    );
  }
}

export class SMDataTypeExplicitDefaultException extends Error {
  constructor(opts: { dataType: string }) {
    super(
      `SMDataTypeExplicitDefaultException - the data type ${opts.dataType} requires setting an explicit default value for non-optional properties`
    );
  }
}

export class SMDataParsingException extends Error {
  constructor(opts: { receivedData: any; message: string }) {
    super(
      `SMDataParsing exception - ${opts.message}\nData: ${JSON.stringify(
        opts.receivedData,
        null,
        2
      )}.`
    );
  }
}

export class SMUnexpectedSubscriptionMessageException extends Error {
  public exception: {
    subscriptionMessage: Record<string, any>;
    description: string;
  };

  constructor(exception: {
    subscriptionMessage: Record<string, any>;
    description: string;
  }) {
    super(
      `SMUnexpectedSubscriptionMessage exception - unexpected subscription message received`
    );
    this.exception = exception;
  }
}

export class SMUnexpectedQueryResultException extends Error {
  public exception: {
    queryRecord: Record<string, any>;
    resultData: Record<string, any>;
  };

  constructor(exception: {
    queryRecord: Record<string, any>;
    resultData: Record<string, any>;
  }) {
    super(
      `SMUnexpectedQueryResult exception - unexpected query result received`
    );
    this.exception = exception;
  }
}

export function throwLocallyLogInProd(error: Error) {
  if (process?.env?.NODE_ENV !== 'production') {
    throw error;
  } else {
    console.error(error);
  }
}
