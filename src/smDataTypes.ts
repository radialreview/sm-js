import { DOFactory } from './DO';
import { RepositoryFactory } from './Repository';
import {
  SMDataTypeException,
  SMDataTypeExplicitDefaultException,
  throwLocallyLogInProd,
} from './exceptions';

export const SM_DATA_TYPES = {
  string: 's',
  maybeString: 'mS',
  number: 'n',
  maybeNumber: 'mN',
  boolean: 'b',
  maybeBoolean: 'mB',
  object: 'o',
  maybeObject: 'mO',
  record: 'r',
  maybeRecord: 'mR',
  array: 'a',
  maybeArray: 'mA',
};

export class SMData<
  TParsedValue,
  TSMValue,
  TBoxedValue extends
    | ISMData
    | Record<string, ISMData | SMDataDefaultFn>
    | undefined
> implements ISMData<TParsedValue, TSMValue, TBoxedValue> {
  type: typeof SM_DATA_TYPES[keyof typeof SM_DATA_TYPES];
  parser: (smValue: TSMValue) => TParsedValue;
  boxedValue: TBoxedValue;
  defaultValue: Maybe<TParsedValue>;
  isOptional: boolean;

  constructor(opts: {
    type: string;
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

export const string = (defaultValue: string) =>
  new SMData<string, string, undefined>({
    type: SM_DATA_TYPES.string,
    parser: value => (value != null ? String(value) : value),
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

export const object = <
  TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>
>(
  boxedValue: TBoxedValue
) =>
  new SMData<
    GetExpectedNodeDataType<TBoxedValue>,
    GetExpectedNodeDataType<TBoxedValue>,
    TBoxedValue
  >({
    type: SM_DATA_TYPES.object,
    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: val => val,
    boxedValue,
    isOptional: false,
  });

object._default = null as any;

object.optional = <
  TBoxedValue extends Record<string, ISMData | SMDataDefaultFn>
>(
  boxedValue: TBoxedValue
) =>
  new SMData<
    Maybe<GetExpectedNodeDataType<TBoxedValue>>,
    Maybe<GetExpectedNodeDataType<TBoxedValue>>,
    TBoxedValue
  >({
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
  const parsedBoxedValue: ISMData =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as ISMData)
      : (boxedValue as ISMData);

  return new SMData<
    Record<TKey, GetSMDataType<typeof parsedBoxedValue>>,
    Record<TKey, GetSMDataType<typeof parsedBoxedValue>>,
    typeof parsedBoxedValue
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
  const parsedBoxedValue: ISMData =
    // will be a function if no explicit default set
    typeof boxedValue === 'function'
      ? ((boxedValue as any)._default as ISMData)
      : (boxedValue as ISMData);

  function smArray(
    defaultValue: Array<GetSMDataType<typeof parsedBoxedValue>>
  ) {
    return new SMData<
      Array<GetSMDataType<typeof parsedBoxedValue>>,
      Array<GetSMDataType<typeof parsedBoxedValue>>,
      typeof parsedBoxedValue
    >({
      type: SM_DATA_TYPES.array,
      parser: value => value,
      boxedValue: parsedBoxedValue,
      defaultValue,
      isOptional: false,
    });
  }

  smArray.optional = new SMData<
    Maybe<Array<GetSMDataType<typeof parsedBoxedValue>>>,
    Maybe<Array<GetSMDataType<typeof parsedBoxedValue>>>,
    typeof parsedBoxedValue
  >({
    type: SM_DATA_TYPES.maybeArray,
    parser: value => value,
    boxedValue: parsedBoxedValue,
    isOptional: true,
  });

  smArray._default = smArray([]);

  return smArray;
};

export const SM_RELATIONAL_TYPES = {
  byReference: 'bR' as 'bR',
  children: 'bP' as 'bP',
};

export const reference = <
  TParentHoldingReference extends ISMNode,
  TReferencedNode extends ISMNode = ISMNode
>(opts: {
  def: TReferencedNode;
  idProp: keyof TParentHoldingReference['smData'];
}) => {
  return ((queryBuilderOpts: { map: MapFnForNode<TReferencedNode> }) => {
    return {
      ...opts,
      _smRelational: SM_RELATIONAL_TYPES.byReference,
      map: queryBuilderOpts.map,
    };
  }) as IByReferenceQueryBuilder<TReferencedNode>;
};

export const children = <TSMNode extends ISMNode>(opts: {
  def: TSMNode;
  depth?: number;
}) => {
  return ((queryBuilderOpts: {
    map: MapFnForNode<TSMNode>;
    pagination: ISMQueryPagination;
  }) => {
    return {
      ...opts,
      _smRelational: SM_RELATIONAL_TYPES.children,
      map: queryBuilderOpts.map,
      depth: opts.depth,
    };
  }) as IChildrenQueryBuilder<TSMNode>;
};

// Used to mark an object type as null
// when objects are spread accross multiple root level properties instead of as stringified json
export const IS_NULL_IDENTIFIER = '__IS_NULL__';

type NodeDefArgs<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
> = {
  type: string;
  properties: TNodeData;
  computed?: NodeComputedFns<TNodeData, TNodeComputedData>;
  relational?: NodeRelationalFns<TNodeRelationalData>;
  mutations?: TNodeMutations;
};

export function def<
  TNodeData extends Record<string, ISMData | SMDataDefaultFn>,
  TNodeComputedData extends Record<string, any>,
  TNodeRelationalData extends NodeRelationalQueryBuilderRecord,
  TNodeMutations extends Record<string, NodeMutationFn<TNodeData, any>>
>(
  def: NodeDefArgs<
    TNodeData,
    TNodeComputedData,
    TNodeRelationalData,
    TNodeMutations
  >
): ISMNode<TNodeData, TNodeComputedData, TNodeRelationalData, TNodeMutations> {
  const DOClass = DOFactory(def);

  return {
    _isSMNodeDef: true,
    do: DOClass,
    repository: RepositoryFactory({ def, DOClass }),
    type: def.type,
    smData: def.properties,
    smComputed: def.computed,
    smRelational: def.relational,
    smMutations: def.mutations,
  };
}

// HACK ALERT! Exists only to make TS work the way we need it
// It makes it possible to accept multiple node types within a record of query definitions, without losing type safety
// See this for a simplified example https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBBwYHMA8ARAhlXAFQE8AHAUwD4AKFMNdALkQHkBbGKTASQGUYw6ADbkAwqgw58RMlQA0iAOQB9ZTADOJCr1zByAVXXlCACzET0AMXDR4YAIT3FlAJTM+A4efqS8BLVSIAN4AUIiIAE7kUCARSEEAdEl0DHIqapqyOnqGxmbiPlY2sAiOisxQESDkiAC+IfUhAlDkEcC4EDXchHAAJnB+uMFhiDC9zOqVniME6gDWE1OCDSEhdJOIUH0D0u49-YOIALzBo+NKAIwATADMigqzC0r9m2aIveTkvYp1q1CyiAAitUIsRLGApP5ZJRjohqL1dohBgEXMcYQAFXARWC4ISQmQUSirZqtdqdRAeQQiAoMfEBGGhcLhdIaALZAxGUzeBjWSAlBxOCpVchyEbhBEEZjI2SipmIACOIOIzGBrTBEOlhJWTTALTaHS6AFkQEJYDSMMNwgBtObkZWISYRTwAXXc-Cp3MkuDAxCJjXWUEQbGIADk+uRBu5jaaYOb0LDGYgQEYIpptupmInxYitgdpLKmYq1cxqEEzg9cPM6qijjDS+XNpW5tWRrUC7ihPs4BnkBZS2L3jntoMC+Ei6CS2WxhWq7Ua3Wp70Z82562XCsgA
export function queryDefinition<
  TSMNode extends ISMNode,
  TQueryDefinitionTarget extends QueryDefinitionTarget<TSMNode>,
  TQueryFn extends MapFnForNode<TSMNode>
>(queryDefinition: QueryDefinition<TSMNode, TQueryDefinitionTarget, TQueryFn>) {
  return queryDefinition;
}
