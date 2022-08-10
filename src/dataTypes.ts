import {
  DataTypeException,
  DataTypeExplicitDefaultException,
  throwLocallyLogInProd,
} from './exceptions';
import {
  GetResultingDataTypeFromProperties,
  GetDataType,
  IOneToOneQueryBuilder,
  IOneToOneQueryBuilderOpts,
  IOneToManyQueryBuilder,
  IOneToManyQueryBuilderOpts,
  IData,
  INode,
  MapFnForNode,
  Maybe,
  QueryDefinitionTarget,
  DataDefaultFn,
  DATA_TYPES,
  RELATIONAL_TYPES,
  UseSubscriptionQueryDefinitionOpts,
  UseSubscriptionQueryDefinition,
  ValidFilterForNode,
} from './types';

export class Data<
  TParsedValue,
  TValue,
  TBoxedValue extends
    | IData
    | DataDefaultFn
    | Record<string, IData | DataDefaultFn>
    | undefined
> implements IData<TParsedValue, TValue, TBoxedValue> {
  type: DATA_TYPES;
  parser: (value: TValue) => TParsedValue;
  boxedValue: TBoxedValue;
  defaultValue: Maybe<TParsedValue>;
  isOptional: boolean;
  acceptableValues?: Array<TParsedValue>;

  constructor(opts: {
    type: DATA_TYPES;
    parser: (value: TValue) => TParsedValue;
    boxedValue?: TBoxedValue;
    defaultValue?: TParsedValue;
    isOptional: boolean;
    acceptableValues?: Array<TParsedValue>;
  }) {
    this.type = opts.type;
    this.parser = opts.parser;
    this.boxedValue = opts.boxedValue as TBoxedValue;
    this.defaultValue = opts.defaultValue ?? null;
    this.isOptional = opts.isOptional;
    this.acceptableValues = opts.acceptableValues;
  }
}

/**
 * data serve 2 purposes:
 * 1) they convert strings from the backend into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the data types used,
 */
export const string = <TStringType extends string = string>(
  defaultValue: TStringType
) =>
  new Data<TStringType, TStringType, undefined>({
    type: DATA_TYPES.string,
    parser: value =>
      value != null
        ? ((String(value) as unknown) as TStringType)
        : (value as TStringType),
    defaultValue,
    isOptional: false,
  });

string._default = string('');

string.optional = new Data<Maybe<string>, Maybe<string>, undefined>({
  type: DATA_TYPES.maybeString,
  parser: value => (value != null ? String(value) : value),
  isOptional: true,
});

export const stringEnum = <
  TEnumEntry extends string,
  TEnumType extends Array<TEnumEntry> = Array<TEnumEntry>
>(
  enumValues: TEnumType
) => {
  const dataType: Data<TEnumType[number], TEnumType[number], undefined> & {
    optional?: Data<
      Maybe<TEnumType[number]>,
      Maybe<TEnumType[number]>,
      undefined
    >;
  } = new Data<TEnumType[number], TEnumType[number], undefined>({
    type: DATA_TYPES.stringEnum,
    parser: value =>
      value != null
        ? ((String(value) as unknown) as TEnumType[number])
        : (value as TEnumType[number]),
    defaultValue: enumValues[0],
    isOptional: false,
    acceptableValues: enumValues,
  });

  const optionalDataType = new Data<
    Maybe<TEnumType[number]>,
    Maybe<TEnumType[number]>,
    undefined
  >({
    type: DATA_TYPES.maybeStringEnum,
    parser: value =>
      value != null ? ((String(value) as unknown) as TEnumType[number]) : null,
    isOptional: true,
    acceptableValues: enumValues,
  });

  dataType.optional = optionalDataType;

  return dataType as Data<TEnumType[number], TEnumType[number], undefined> & {
    optional: Data<
      Maybe<TEnumType[number]>,
      Maybe<TEnumType[number]>,
      undefined
    >;
  };
};

export const number = (defaultValue: number): Data<number, string, undefined> =>
  new Data<number, string, undefined>({
    type: DATA_TYPES.number,
    parser: value => {
      const parsed = Number(value);

      if (isNaN(parsed)) {
        throwLocallyLogInProd(
          new DataTypeException({
            dataType: DATA_TYPES.number,
            value,
          })
        );
        return number._default.defaultValue as number;
      }

      return parsed;
    },
    defaultValue,
    isOptional: false,
  }) as Data<number, string, undefined>;

number._default = number(0);

number.optional = new Data<Maybe<number>, Maybe<string>, undefined>({
  type: DATA_TYPES.maybeNumber,
  parser: value => {
    if (value != null) {
      return Number(value);
    }
    return value;
  },
  isOptional: true,
});

export const boolean = <TDefaultValue extends boolean | undefined>(
  defaultValue?: TDefaultValue
): TDefaultValue extends undefined
  ? undefined
  : Data<boolean, string | boolean, undefined> => {
  if (defaultValue === undefined) {
    return (new DataTypeExplicitDefaultException({
      dataType: DATA_TYPES.boolean,
    }) as unknown) as TDefaultValue extends undefined
      ? undefined
      : Data<boolean, string | boolean, undefined>;
  }

  return new Data<boolean, string | boolean, undefined>({
    type: DATA_TYPES.boolean,
    parser: value => {
      if (value === 'true' || value === true) {
        return true;
      } else if (value === 'false' || value === false) {
        return false;
      } else {
        throw new DataTypeException({
          dataType: DATA_TYPES.boolean,
          value: value,
        });
      }
    },
    defaultValue,
    isOptional: false,
  }) as TDefaultValue extends undefined
    ? undefined
    : Data<boolean, string | boolean, undefined>;
};
// need this in order to trigger an error when a user doesn't provide a default
boolean._default = boolean();

boolean.optional = new Data<Maybe<boolean>, Maybe<string | boolean>, undefined>(
  {
    type: DATA_TYPES.maybeBoolean,
    parser: value => {
      if (value == null) return value;

      if (value === 'true' || value === true) {
        return true;
      } else {
        return false;
      }
    },
    isOptional: true,
  }
);

type ObjectDataType = {
  <TBoxedValue extends Record<string, IData | DataDefaultFn>>(
    boxedValue: TBoxedValue
  ): Data<
    GetResultingDataTypeFromProperties<TBoxedValue>,
    GetResultingDataTypeFromProperties<TBoxedValue>,
    TBoxedValue
  >;
  _default: any;
  optional: <TBoxedValue extends Record<string, IData | DataDefaultFn>>(
    boxedValue: TBoxedValue
  ) => Data<
    Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>,
    Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>,
    TBoxedValue
  >;
};

export const object: ObjectDataType = boxedValue =>
  new Data({
    type: DATA_TYPES.object,
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
  new Data({
    type: DATA_TYPES.maybeObject,
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
  TBoxedValue extends IData | DataDefaultFn
>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: TBoxedValue =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? (boxedValue._default as TBoxedValue)
      : (boxedValue as TBoxedValue);

  return new Data<
    Record<TKey, GetDataType<typeof parsedBoxedValue>>,
    Record<TKey, GetDataType<typeof parsedBoxedValue>>,
    TBoxedValue
  >({
    type: DATA_TYPES.record,
    parser: val => val,
    boxedValue: boxedValue as typeof parsedBoxedValue,
    isOptional: false,
    defaultValue: {} as Record<string, any>,
  });
};

record.optional = <TBoxedValue extends IData | DataDefaultFn>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: IData =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? (boxedValue._default as IData)
      : (boxedValue as IData);

  return new Data<
    Maybe<Record<string, GetDataType<typeof parsedBoxedValue>>>,
    Maybe<Record<string, GetDataType<typeof parsedBoxedValue>>>,
    typeof parsedBoxedValue
  >({
    type: DATA_TYPES.maybeRecord,
    parser: val => val,
    boxedValue: parsedBoxedValue,
    isOptional: true,
    defaultValue: null,
  });
};

record._default = null as any;

export const array = <TBoxedValue extends IData | DataDefaultFn>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: TBoxedValue =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? (boxedValue._default as TBoxedValue)
      : (boxedValue as TBoxedValue);

  function array(defaultValue: Array<GetDataType<TBoxedValue>>) {
    return new Data<
      Array<GetDataType<TBoxedValue>>,
      Array<GetDataType<TBoxedValue>>,
      TBoxedValue
    >({
      type: DATA_TYPES.array,
      parser: value => value,
      boxedValue: parsedBoxedValue,
      defaultValue,
      isOptional: false,
    });
  }

  array.optional = new Data<
    Maybe<Array<GetDataType<TBoxedValue>>>,
    Maybe<Array<GetDataType<TBoxedValue>>>,
    TBoxedValue
  >({
    type: DATA_TYPES.maybeArray,
    parser: value => value,
    boxedValue: parsedBoxedValue,
    isOptional: true,
  });

  array._default = array([]);

  return array;
};

export const oneToOne = <
  TTargetNodeOrTargetNodeRecord extends
    | INode
    | Maybe<INode>
    | Record<string, INode>
    | Maybe<Record<string, INode>>
>(
  def: NonNullable<TTargetNodeOrTargetNodeRecord>
) => {
  return (<
    TQueryBuilderOpts extends IOneToOneQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord
    > & { _relationshipName: string }
  >(
    queryBuilderOpts: TQueryBuilderOpts
  ) => {
    return {
      def,
      _relationshipName: queryBuilderOpts._relationshipName,
      _relational: RELATIONAL_TYPES.oneToOne,
      queryBuilderOpts,
    };
  }) as IOneToOneQueryBuilder<TTargetNodeOrTargetNodeRecord>;
};

export const oneToMany = <
  TTargetNodeOrTargetNodeRecord extends
    | INode
    | Maybe<INode>
    | Record<string, INode>
    | Maybe<Record<string, INode>>
>(
  def: NonNullable<TTargetNodeOrTargetNodeRecord>
) => {
  return (<
    TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord
    > & { _relationshipName: string; filter?: ValidFilterForNode<INode> }
  >(
    queryBuilderOpts: TQueryBuilderOpts
  ) => {
    return {
      def,
      _relationshipName: queryBuilderOpts._relationshipName,
      _relational: RELATIONAL_TYPES.oneToMany,
      queryBuilderOpts,
      filter: queryBuilderOpts.filter,
    };
  }) as IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
};

export const OBJECT_PROPERTY_SEPARATOR = '__dot__';

export const OBJECT_IDENTIFIER = '__object__';

// HACK ALERT! Exists only to make TS work the way we need it
// It makes it possible to accept multiple node types within a record of query definitions, without losing type safety
// See this for a simplified example https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBBwYHMA8ARAhlXAFQE8AHAUwD4AKFMNdALkQHkBbGKTASQGUYw6ADbkAwqgw58RMlQA0iAOQB9ZTADOJCr1zByAVXXlCACzET0AMXDR4YAIT3FlAJTM+A4efqS8BLVSIAN4AUIiIAE7kUCARSEEAdEl0DHIqapqyOnqGxmbiPlY2sAiOisxQESDkiAC+IfUhAlDkEcC4EDXchHAAJnB+uMFhiDC9zOqVniME6gDWE1OCDSEhdJOIUH0D0u49-YOIALzBo+NKAIwATADMigqzC0r9m2aIveTkvYp1q1CyiAAitUIsRLGApP5ZJRjohqL1dohBgEXMcYQAFXARWC4ISQmQUSirZqtdqdRAeQQiAoMfEBGGhcLhdIaALZAxGUzeBjWSAlBxOCpVchyEbhBEEZjI2SipmIACOIOIzGBrTBEOlhJWTTALTaHS6AFkQEJYDSMMNwgBtObkZWISYRTwAXXc-Cp3MkuDAxCJjXWUEQbGIADk+uRBu5jaaYOb0LDGYgQEYIpptupmInxYitgdpLKmYq1cxqEEzg9cPM6qijjDS+XNpW5tWRrUC7ihPs4BnkBZS2L3jntoMC+Ei6CS2WxhWq7Ua3Wp70Z82562XCsgA
export function queryDefinition<
  TNode extends INode,
  TMapFn extends MapFnForNode<TNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget,
  TUseSubscriptionOpts extends UseSubscriptionQueryDefinitionOpts
>(
  queryDefinition: UseSubscriptionQueryDefinition<
    TNode,
    TMapFn,
    TQueryDefinitionTarget,
    TUseSubscriptionOpts
  >
) {
  return queryDefinition;
}
