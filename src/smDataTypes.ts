import {
  SMDataTypeException,
  SMDataTypeExplicitDefaultException,
  throwLocallyLogInProd,
} from './exceptions';
import {
  GetResultingDataTypeFromProperties,
  GetSMDataType,
  IByReferenceQueryBuilder,
  IChildrenQueryBuilder,
  ISMData,
  ISMNode,
  ISMQueryPagination,
  MapFnForNode,
  Maybe,
  QueryDefinitionTarget,
  SMDataDefaultFn,
  ValidReferenceIdPropFromNode,
  SM_DATA_TYPES,
  SM_RELATIONAL_TYPES,
  ByReferenceQueryBuilderOpts,
  UseSubscriptionQueryDefinitionOpts,
  UseSubscriptionQueryDefinition,
  ValidReferenceIdArrayPropFromNode,
  ByReferenceArrayQueryBuilderOpts,
  IByReferenceArrayQueryBuilder,
} from './types';

export class SMData<
  TParsedValue,
  TSMValue,
  TBoxedValue extends
    | ISMData
    | SMDataDefaultFn
    | Record<string, ISMData | SMDataDefaultFn>
    | undefined
> implements ISMData<TParsedValue, TSMValue, TBoxedValue> {
  type: SM_DATA_TYPES;
  parser: (smValue: TSMValue) => TParsedValue;
  boxedValue: TBoxedValue;
  defaultValue: Maybe<TParsedValue>;
  isOptional: boolean;

  constructor(opts: {
    type: SM_DATA_TYPES;
    parser: (smValue: TSMValue) => TParsedValue;
    boxedValue?: TBoxedValue;
    defaultValue?: TParsedValue;
    isOptional: boolean;
  }) {
    this.type = opts.type;
    this.parser = opts.parser;
    this.boxedValue = opts.boxedValue as TBoxedValue;
    this.defaultValue = opts.defaultValue ?? null;
    this.isOptional = opts.isOptional;
  }
}

/**
 * smData serve 2 purposes:
 * 1) they convert strings from SM into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the smData types used,
 */

export const string = <TStringType extends string = string>(
  defaultValue: TStringType
) =>
  new SMData<TStringType, TStringType, undefined>({
    type: SM_DATA_TYPES.string,
    parser: value =>
      value != null
        ? ((String(value) as unknown) as TStringType)
        : (value as TStringType),
    defaultValue,
    isOptional: false,
  });

string._default = string('');

string.optional = new SMData<Maybe<string>, Maybe<string>, undefined>({
  type: SM_DATA_TYPES.maybeString,
  parser: value => (value != null ? String(value) : value),
  isOptional: true,
});

export const number = (
  defaultValue: number
): SMData<number, string, undefined> =>
  new SMData<number, string, undefined>({
    type: SM_DATA_TYPES.number,
    parser: value => {
      const parsed = Number(value);

      if (isNaN(parsed)) {
        throwLocallyLogInProd(
          new SMDataTypeException({
            dataType: SM_DATA_TYPES.number,
            value,
          })
        );
        return number._default.defaultValue as number;
      }

      return parsed;
    },
    defaultValue,
    isOptional: false,
  }) as SMData<number, string, undefined>;

number._default = number(0);

number.optional = new SMData<Maybe<number>, Maybe<string>, undefined>({
  type: SM_DATA_TYPES.maybeNumber,
  parser: value => {
    if (value != null) {
      return Number(value);
    }
    return value;
  },
  isOptional: true,
});

export const boolean = <TDefaultValue extends boolean>(
  defaultValue?: TDefaultValue
) => {
  if (defaultValue === undefined) {
    return (new SMDataTypeExplicitDefaultException({
      dataType: SM_DATA_TYPES.boolean,
    }) as unknown) as ISMData<boolean, string | boolean, undefined>;
  }

  return new SMData<boolean, string | boolean, undefined>({
    type: SM_DATA_TYPES.boolean,
    parser: value => {
      if (value === 'true' || value === true) {
        return true;
      } else if (value === 'false' || value === false) {
        return false;
      } else {
        throw new SMDataTypeException({
          dataType: SM_DATA_TYPES.boolean,
          value: value,
        });
      }
    },
    defaultValue,
    isOptional: false,
  }) as TDefaultValue extends undefined
    ? Error
    : ISMData<boolean, string | boolean, undefined>;
};
// need this in order to trigger an error when a user doesn't provide a default
//@ts-ignore
boolean._default = boolean();

boolean.optional = new SMData<
  Maybe<boolean>,
  Maybe<string | boolean>,
  undefined
>({
  type: SM_DATA_TYPES.maybeBoolean,
  parser: value => {
    if (value == null) return value;

    if (value === 'true' || value === true) {
      return true;
    } else {
      return false;
    }
  },
  isOptional: true,
});

type ObjectSMDataType = {
  <TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>>(
    boxedValue: TBoxedValue
  ): SMData<
    GetResultingDataTypeFromProperties<TBoxedValue>,
    GetResultingDataTypeFromProperties<TBoxedValue>,
    TBoxedValue
  >;
  _default: any;
  optional: <TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>>(
    boxedValue: TBoxedValue
  ) => SMData<
    Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>,
    Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>,
    TBoxedValue
  >;
};

export const object: ObjectSMDataType = boxedValue =>
  new SMData({
    type: SM_DATA_TYPES.object,
    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: val => val,
    boxedValue,
    isOptional: false,
  });

object._default = null;

object.optional = boxedValue =>
  new SMData({
    type: SM_DATA_TYPES.maybeObject,
    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: val => val,
    boxedValue,
    isOptional: true,
  });

export const record = <
  TKey extends string,
  TBoxedValue extends ISMData | SMDataDefaultFn
>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: TBoxedValue =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as TBoxedValue)
      : (boxedValue as TBoxedValue);

  return new SMData<
    Record<TKey, GetSMDataType<typeof parsedBoxedValue>>,
    Record<TKey, GetSMDataType<typeof parsedBoxedValue>>,
    TBoxedValue
  >({
    type: SM_DATA_TYPES.record,
    parser: val => val,
    boxedValue: boxedValue as typeof parsedBoxedValue,
    isOptional: false,
    defaultValue: {} as Record<string, any>,
  });
};

record.optional = <TBoxedValue extends ISMData | SMDataDefaultFn>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: ISMData =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as ISMData)
      : (boxedValue as ISMData);

  return new SMData<
    Maybe<Record<string, GetSMDataType<typeof parsedBoxedValue>>>,
    Maybe<Record<string, GetSMDataType<typeof parsedBoxedValue>>>,
    typeof parsedBoxedValue
  >({
    type: SM_DATA_TYPES.maybeRecord,
    parser: val => val,
    boxedValue: parsedBoxedValue,
    isOptional: true,
    defaultValue: null,
  });
};

record._default = null as any;

export const array = <TBoxedValue extends ISMData | SMDataDefaultFn>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: TBoxedValue =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as TBoxedValue)
      : (boxedValue as TBoxedValue);

  function smArray(defaultValue: Array<GetSMDataType<TBoxedValue>>) {
    return new SMData<
      Array<GetSMDataType<TBoxedValue>>,
      Array<GetSMDataType<TBoxedValue>>,
      TBoxedValue
    >({
      type: SM_DATA_TYPES.array,
      parser: value => value,
      boxedValue: parsedBoxedValue,
      defaultValue,
      isOptional: false,
    });
  }

  smArray.optional = new SMData<
    Maybe<Array<GetSMDataType<TBoxedValue>>>,
    Maybe<Array<GetSMDataType<TBoxedValue>>>,
    TBoxedValue
  >({
    type: SM_DATA_TYPES.maybeArray,
    parser: value => value,
    boxedValue: parsedBoxedValue,
    isOptional: true,
  });

  smArray._default = smArray([]);

  return smArray;
};

export const reference = <
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends
    | ISMNode
    | Maybe<ISMNode>
    | Record<string, ISMNode>
    | Maybe<Record<string, ISMNode>>
>(opts: {
  def: NonNullable<TTargetNodeOrTargetNodeRecord>;
  idProp: ValidReferenceIdPropFromNode<TOriginNode>;
}) => {
  return (<
    TQueryBuilderOpts extends ByReferenceQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord
    >
  >(
    queryBuilderOpts: TQueryBuilderOpts
  ) => {
    return {
      ...opts,
      idProp: (opts.idProp as string).replaceAll(
        '.',
        OBJECT_PROPERTY_SEPARATOR
      ) as ValidReferenceIdPropFromNode<TOriginNode>,
      _smRelational: SM_RELATIONAL_TYPES.byReference,
      queryBuilderOpts,
    };
  }) as IByReferenceQueryBuilder<TOriginNode, TTargetNodeOrTargetNodeRecord>;
};

export const referenceArray = <
  TOriginNode extends ISMNode,
  TTargetNodeOrTargetNodeRecord extends ISMNode | Record<string, ISMNode>
>(opts: {
  def: NonNullable<TTargetNodeOrTargetNodeRecord>;
  idProp: ValidReferenceIdArrayPropFromNode<TOriginNode>;
}) => {
  return (<
    TQueryBuilderOpts extends ByReferenceArrayQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord
    >
  >(
    queryBuilderOpts: TQueryBuilderOpts
  ) => {
    return {
      ...opts,
      idProp: (opts.idProp as string).replaceAll(
        '.',
        OBJECT_PROPERTY_SEPARATOR
      ) as ValidReferenceIdArrayPropFromNode<TOriginNode>,
      _smRelational: SM_RELATIONAL_TYPES.byReferenceArray,
      queryBuilderOpts,
    };
  }) as IByReferenceArrayQueryBuilder<
    TOriginNode,
    TTargetNodeOrTargetNodeRecord
  >;
};

export const children = <TSMNode extends ISMNode>(opts: {
  def: TSMNode;
  depth?: number;
}) => {
  return ((queryBuilderOpts: {
    map: MapFnForNode<TSMNode>;
    target?: { pagination?: ISMQueryPagination };
  }) => {
    return {
      def: opts.def,
      _smRelational: SM_RELATIONAL_TYPES.children,
      map: queryBuilderOpts.map,
      target: {
        pagination: queryBuilderOpts.target?.pagination,
        depth: opts.depth,
      },
    };
  }) as IChildrenQueryBuilder<TSMNode>;
};

export const OBJECT_PROPERTY_SEPARATOR = '__dot__';

export const OBJECT_IDENTIFIER = '__object__';

// HACK ALERT! Exists only to make TS work the way we need it
// It makes it possible to accept multiple node types within a record of query definitions, without losing type safety
// See this for a simplified example https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBBwYHMA8ARAhlXAFQE8AHAUwD4AKFMNdALkQHkBbGKTASQGUYw6ADbkAwqgw58RMlQA0iAOQB9ZTADOJCr1zByAVXXlCACzET0AMXDR4YAIT3FlAJTM+A4efqS8BLVSIAN4AUIiIAE7kUCARSEEAdEl0DHIqapqyOnqGxmbiPlY2sAiOisxQESDkiAC+IfUhAlDkEcC4EDXchHAAJnB+uMFhiDC9zOqVniME6gDWE1OCDSEhdJOIUH0D0u49-YOIALzBo+NKAIwATADMigqzC0r9m2aIveTkvYp1q1CyiAAitUIsRLGApP5ZJRjohqL1dohBgEXMcYQAFXARWC4ISQmQUSirZqtdqdRAeQQiAoMfEBGGhcLhdIaALZAxGUzeBjWSAlBxOCpVchyEbhBEEZjI2SipmIACOIOIzGBrTBEOlhJWTTALTaHS6AFkQEJYDSMMNwgBtObkZWISYRTwAXXc-Cp3MkuDAxCJjXWUEQbGIADk+uRBu5jaaYOb0LDGYgQEYIpptupmInxYitgdpLKmYq1cxqEEzg9cPM6qijjDS+XNpW5tWRrUC7ihPs4BnkBZS2L3jntoMC+Ei6CS2WxhWq7Ua3Wp70Z82562XCsgA
export function queryDefinition<
  TSMNode extends ISMNode,
  TMapFn extends MapFnForNode<TSMNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget,
  TUseSubscriptionOpts extends UseSubscriptionQueryDefinitionOpts
>(
  queryDefinition: UseSubscriptionQueryDefinition<
    TSMNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionOpts
  >
) {
  return queryDefinition;
}
