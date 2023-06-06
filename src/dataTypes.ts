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
  ValidSortForNode,
  INonPaginatedOneToManyQueryBuilderOpts,
  INonPaginatedOneToManyQueryBuilder,
} from './types';

export class Data<
  TDataArgs extends {
    TParsedValue: any;
    TValue: any;
    TBoxedValue:
      | IData
      | DataDefaultFn
      | Record<string, IData | DataDefaultFn>
      | undefined;
  }
> implements IData<TDataArgs> {
  type: DATA_TYPES;
  parser: (value: TDataArgs['TValue']) => TDataArgs['TParsedValue'];
  boxedValue: TDataArgs['TBoxedValue'];
  defaultValue: Maybe<TDataArgs['TParsedValue']>;
  isOptional: boolean;
  acceptableValues?: Array<TDataArgs['TParsedValue']>;

  constructor(opts: {
    type: DATA_TYPES;
    parser: (value: TDataArgs['TValue']) => TDataArgs['TParsedValue'];
    boxedValue?: TDataArgs['TBoxedValue'];
    defaultValue?: TDataArgs['TParsedValue'];
    isOptional: boolean;
    acceptableValues?: Array<TDataArgs['TParsedValue']>;
  }) {
    this.type = opts.type;
    this.parser = opts.parser;
    this.boxedValue = opts.boxedValue as TDataArgs['TBoxedValue'];
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
export const string = (
  defaultValue: string
): IData<{ TValue: string; TParsedValue: string; TBoxedValue: undefined }> =>
  // TStringType, TStringType,  undefined}
  new Data<{ TValue: string; TParsedValue: string; TBoxedValue: undefined }>({
    type: DATA_TYPES.string,
    parser: value => (value != null ? String(value) : value),
    defaultValue,
    isOptional: false,
  });

string._default = string('');

string.optional = new Data<{
  TValue: Maybe<string>;
  TParsedValue: Maybe<string>;
  TBoxedValue: undefined;
}>({
  type: DATA_TYPES.maybeString,
  parser: value => (value != null ? String(value) : value),
  isOptional: true,
}) as IData<{
  TValue: Maybe<string>;
  TParsedValue: Maybe<string>;
  TBoxedValue: undefined;
}>;

export const stringEnum = <
  TEnumEntry extends string,
  TEnumType extends Array<TEnumEntry> = Array<TEnumEntry>
>(
  enumValues: TEnumType
) => {
  const dataType: IData<{
    TValue: TEnumType[number];
    TParsedValue: TEnumType[number];
    TBoxedValue: undefined;
  }> = new Data<{
    TValue: TEnumType[number];
    TParsedValue: TEnumType[number];
    TBoxedValue: undefined;
  }>({
    type: DATA_TYPES.stringEnum,
    parser: value =>
      value != null
        ? ((String(value) as unknown) as TEnumType[number])
        : (value as TEnumType[number]),
    defaultValue: enumValues[0],
    isOptional: false,
    acceptableValues: enumValues,
  });

  return dataType;
};

stringEnum.optional = <
  TEnumEntry extends string,
  TEnumType extends Array<TEnumEntry> = Array<TEnumEntry>
>(
  enumValues: TEnumType
) => {
  const dataType: IData<{
    TValue: Maybe<TEnumType[number]>;
    TParsedValue: Maybe<TEnumType[number]>;
    TBoxedValue: undefined;
  }> = new Data<{
    TValue: Maybe<TEnumType[number]>;
    TParsedValue: Maybe<TEnumType[number]>;
    TBoxedValue: undefined;
  }>({
    type: DATA_TYPES.maybeStringEnum,
    parser: value =>
      value != null ? (String(value) as TEnumType[number]) : null,
    defaultValue: enumValues[0],
    isOptional: true,
    acceptableValues: enumValues,
  });

  return dataType;
};

export const number = (
  defaultValue: number
): IData<{ TValue: string; TParsedValue: number; TBoxedValue: undefined }> =>
  new Data<{ TValue: string; TParsedValue: number; TBoxedValue: undefined }>({
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
  });

number._default = number(0);

number.optional = new Data<{
  TValue: Maybe<string>;
  TParsedValue: Maybe<number>;
  TBoxedValue: undefined;
}>({
  type: DATA_TYPES.maybeNumber,
  parser: value => {
    if (value != null) {
      return Number(value);
    }
    return value;
  },
  isOptional: true,
}) as IData<{
  TValue: Maybe<string>;
  TParsedValue: Maybe<number>;
  TBoxedValue: undefined;
}>;

export const boolean = <TDefaultValue extends boolean>(
  defaultValue?: TDefaultValue
) => {
  if (defaultValue === undefined) {
    return (new DataTypeExplicitDefaultException({
      dataType: DATA_TYPES.boolean,
    }) as unknown) as IData<{
      TValue: string | boolean;
      TParsedValue: boolean;
      TBoxedValue: undefined;
    }>;
  }

  return new Data<{
    TValue: string | boolean;
    TParsedValue: boolean;
    TBoxedValue: undefined;
  }>({
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
    ? Error
    : IData<{
        TValue: string | boolean;
        TParsedValue: boolean;
        TBoxedValue: undefined;
      }>;
};
// need this in order to trigger an error when a user doesn't provide a default
boolean._default = boolean();

boolean.optional = new Data<{
  TValue: Maybe<string | boolean>;
  TParsedValue: Maybe<boolean>;
  TBoxedValue: undefined;
}>({
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
}) as IData<{
  TValue: Maybe<string | boolean>;
  TParsedValue: Maybe<boolean>;
  TBoxedValue: undefined;
}>;

type ObjectDataType = {
  <TBoxedValue extends Record<string, IData | DataDefaultFn>>(
    boxedValue: TBoxedValue
  ): IData<{
    TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
    TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
    TBoxedValue: TBoxedValue;
  }>;
  _default: any;
  optional: <TBoxedValue extends Record<string, IData | DataDefaultFn>>(
    boxedValue: TBoxedValue
  ) => IData<{
    TValue: Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>;
    TParsedValue: Maybe<GetResultingDataTypeFromProperties<TBoxedValue>>;
    TBoxedValue: TBoxedValue;
  }>;
};

export const object: ObjectDataType = <
  TBoxedValue extends Record<string, IData | DataDefaultFn>
>(
  boxedValue: TBoxedValue
) =>
  new Data({
    type: DATA_TYPES.object,
    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: val => val,
    boxedValue,
    isOptional: false,
  }) as IData<{
    TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
    TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
    TBoxedValue: TBoxedValue;
  }>;

object._default = null;

object.optional = <TBoxedValue extends Record<string, IData | DataDefaultFn>>(
  boxedValue: TBoxedValue
): IData<{
  TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
  TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
  TBoxedValue: TBoxedValue;
}> =>
  new Data({
    type: DATA_TYPES.maybeObject,
    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: val => val,
    boxedValue,
    isOptional: true,
  }) as IData<{
    TValue: GetResultingDataTypeFromProperties<TBoxedValue>;
    TParsedValue: GetResultingDataTypeFromProperties<TBoxedValue>;
    TBoxedValue: TBoxedValue;
  }>;

export const record = <
  TKey extends string,
  TBoxedValue extends IData | DataDefaultFn
>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: TBoxedValue =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as TBoxedValue)
      : (boxedValue as TBoxedValue);

  return new Data<{
    TValue: Record<TKey, GetDataType<typeof parsedBoxedValue>>;
    TParsedValue: Record<TKey, GetDataType<typeof parsedBoxedValue>>;
    TBoxedValue: TBoxedValue;
  }>({
    type: DATA_TYPES.record,
    parser: val => val,
    boxedValue: boxedValue as typeof parsedBoxedValue,
    isOptional: false,
    defaultValue: {} as Record<string, any>,
  }) as IData<{
    TValue: Record<TKey, GetDataType<typeof parsedBoxedValue>>;
    TParsedValue: Record<TKey, GetDataType<typeof parsedBoxedValue>>;
    TBoxedValue: TBoxedValue;
  }>;
};

record.optional = <TBoxedValue extends IData | DataDefaultFn>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: IData =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as IData)
      : (boxedValue as IData);

  return new Data<{
    TValue: Maybe<Record<string, GetDataType<typeof parsedBoxedValue>>>;
    TParsedValue: Maybe<Record<string, GetDataType<typeof parsedBoxedValue>>>;
    TBoxedValue: typeof parsedBoxedValue;
  }>({
    type: DATA_TYPES.maybeRecord,
    parser: val => val,
    boxedValue: parsedBoxedValue,
    isOptional: true,
    defaultValue: null,
  }) as IData<{
    TValue: Maybe<Record<string, GetDataType<typeof parsedBoxedValue>>>;
    TParsedValue: Maybe<Record<string, GetDataType<typeof parsedBoxedValue>>>;
    TBoxedValue: typeof parsedBoxedValue;
  }>;
};

record._default = null as any;

export const array = <TBoxedValue extends IData | DataDefaultFn>(
  boxedValue: TBoxedValue
) => {
  const parsedBoxedValue: TBoxedValue =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as TBoxedValue)
      : (boxedValue as TBoxedValue);

  function array(defaultValue: Array<GetDataType<TBoxedValue>>) {
    return new Data<{
      TValue: Array<GetDataType<TBoxedValue>>;
      TParsedValue: Array<GetDataType<TBoxedValue>>;
      TBoxedValue: TBoxedValue;
    }>({
      type: DATA_TYPES.array,
      parser: value => value,
      boxedValue: parsedBoxedValue,
      defaultValue,
      isOptional: false,
    }) as IData<{
      TValue: Array<GetDataType<TBoxedValue>>;
      TParsedValue: Array<GetDataType<TBoxedValue>>;
      TBoxedValue: TBoxedValue;
    }>;
  }

  array.optional = new Data<{
    TValue: Maybe<Array<GetDataType<TBoxedValue>>>;
    TParsedValue: Maybe<Array<GetDataType<TBoxedValue>>>;
    TBoxedValue: TBoxedValue;
  }>({
    type: DATA_TYPES.maybeArray,
    parser: value => value,
    boxedValue: parsedBoxedValue,
    isOptional: true,
  }) as IData<{
    TValue: Maybe<Array<GetDataType<TBoxedValue>>>;
    TParsedValue: Maybe<Array<GetDataType<TBoxedValue>>>;
    TBoxedValue: TBoxedValue;
  }>;

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
    | Maybe<Record<string, INode>>,
  TMapFn extends TTargetNodeOrTargetNodeRecord extends INode | Maybe<INode>
    ? MapFnForNode<NonNullable<TTargetNodeOrTargetNodeRecord>>
    : never
>(
  def: NonNullable<TTargetNodeOrTargetNodeRecord>
) => {
  return (<
    TQueryBuilderOpts extends IOneToManyQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord,
      TIncludeTotalCount,
      TMapFn
    > & {
      _relationshipName: string;
      filter?: ValidFilterForNode<INode, boolean>;
      sort?: ValidSortForNode<INode>;
    },
    TIncludeTotalCount extends boolean = false
  >(
    queryBuilderOpts: TQueryBuilderOpts
  ) => {
    return {
      def,
      _relationshipName: queryBuilderOpts._relationshipName,
      _relational: RELATIONAL_TYPES.oneToMany,
      filter: queryBuilderOpts.filter,
      queryBuilderOpts,
    };
  }) as IOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
};

export const nonPaginatedOneToMany = <
  TTargetNodeOrTargetNodeRecord extends
    | INode
    | Maybe<INode>
    | Record<string, INode>
    | Maybe<Record<string, INode>>
>(
  def: NonNullable<TTargetNodeOrTargetNodeRecord>
) => {
  return (<
    TQueryBuilderOpts extends INonPaginatedOneToManyQueryBuilderOpts<
      TTargetNodeOrTargetNodeRecord,
      TIncludeTotalCount
    > & {
      _relationshipName: string;
      filter?: ValidFilterForNode<INode, boolean>;
      sort?: ValidSortForNode<INode>;
    },
    TIncludeTotalCount extends boolean = false
  >(
    queryBuilderOpts: TQueryBuilderOpts
  ) => {
    return {
      def,
      _relationshipName: queryBuilderOpts._relationshipName,
      _relational: RELATIONAL_TYPES.nonPaginatedOneToMany,
      filter: queryBuilderOpts.filter,
      queryBuilderOpts,
    };
  }) as INonPaginatedOneToManyQueryBuilder<TTargetNodeOrTargetNodeRecord>;
};

// HACK ALERT! Exists only to make TS work the way we need it
// It makes it possible to accept multiple node types within a record of query definitions, without losing type safety
// See this for a simplified example https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBBwYHMA8ARAhlXAFQE8AHAUwD4AKFMNdALkQHkBbGKTASQGUYw6ADbkAwqgw58RMlQA0iAOQB9ZTADOJCr1zByAVXXlCACzET0AMXDR4YAIT3FlAJTM+A4efqS8BLVSIAN4AUIiIAE7kUCARSEEAdEl0DHIqapqyOnqGxmbiPlY2sAiOisxQESDkiAC+IfUhAlDkEcC4EDXchHAAJnB+uMFhiDC9zOqVniME6gDWE1OCDSEhdJOIUH0D0u49-YOIALzBo+NKAIwATADMigqzC0r9m2aIveTkvYp1q1CyiAAitUIsRLGApP5ZJRjohqL1dohBgEXMcYQAFXARWC4ISQmQUSirZqtdqdRAeQQiAoMfEBGGhcLhdIaALZAxGUzeBjWSAlBxOCpVchyEbhBEEZjI2SipmIACOIOIzGBrTBEOlhJWTTALTaHS6AFkQEJYDSMMNwgBtObkZWISYRTwAXXc-Cp3MkuDAxCJjXWUEQbGIADk+uRBu5jaaYOb0LDGYgQEYIpptupmInxYitgdpLKmYq1cxqEEzg9cPM6qijjDS+XNpW5tWRrUC7ihPs4BnkBZS2L3jntoMC+Ei6CS2WxhWq7Ua3Wp70Z82562XCsgA
export function queryDefinition<
  TNode extends INode,
  TMapFn extends MapFnForNode<TNode> | undefined,
  TQueryDefinitionTarget extends QueryDefinitionTarget,
  TUseSubscriptionQueryDefinitionOpts extends UseSubscriptionQueryDefinitionOpts,
  TIncludeTotalCount extends boolean
>(
  queryDefinition: UseSubscriptionQueryDefinition<{
    TNode: TNode;
    TMapFn: TMapFn;
    TQueryDefinitionTarget: TQueryDefinitionTarget;
    TUseSubscriptionQueryDefinitionOpts: TUseSubscriptionQueryDefinitionOpts;
    TIncludeTotalCount: TIncludeTotalCount;
  }>
) {
  return queryDefinition;
}
