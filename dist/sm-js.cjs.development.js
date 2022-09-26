'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var lodash = require('lodash');
var Chance = _interopDefault(require('chance'));
var core = require('@apollo/client/core');
var client = require('@apollo/client');
var mobx = require('mobx');
var React = _interopDefault(require('react'));
var ws = require('@apollo/client/link/ws');
var http = require('@apollo/client/link/http');
var batchHttp = require('@apollo/client/link/batch-http');
var utilities = require('@apollo/client/utilities');

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  strings.raw = raw;
  return strings;
}

// so this error should only occur when data is accessed but was never queried or is not currently being subscribed to (is cached only)
var NotUpToDateException = /*#__PURE__*/function (_Error) {
  _inheritsLoose(NotUpToDateException, _Error);

  function NotUpToDateException(opts) {
    var _this;

    _this = _Error.call(this, "NotUpToDate exception - The property \"" + opts.propName + "\" on the DO for the node type " + opts.nodeType + " was read but is not guaranteed to be up to date. Add that property to the query with the id " + opts.queryId) || this;
    _this.propName = void 0;
    _this.propName = opts.propName;
    return _this;
  }

  return NotUpToDateException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var NotUpToDateInComputedException = /*#__PURE__*/function (_Error2) {
  _inheritsLoose(NotUpToDateInComputedException, _Error2);

  function NotUpToDateInComputedException(opts) {
    return _Error2.call(this, "NotUpToDateInComputed exception - The property \"" + opts.propName + "\" on the DO for the node type \"" + opts.nodeType + "\" was read for the computed property \"" + opts.computedPropName + "\" but is not guaranteed to be up to date. Add that property to the query with the id " + opts.queryId) || this;
  }

  return NotUpToDateInComputedException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var FilterPropertyNotDefinedInQueryException = /*#__PURE__*/function (_Error3) {
  _inheritsLoose(FilterPropertyNotDefinedInQueryException, _Error3);

  function FilterPropertyNotDefinedInQueryException(opts) {
    return _Error3.call(this, "FilterPropertyNotDefinedInQueryException exception - The filter property '" + opts.filterPropName + "' is not defined in the 'map' function of the queryDefinition. Add that property to the queryDefinition 'map' function.") || this;
  }

  return FilterPropertyNotDefinedInQueryException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SortPropertyNotDefinedInQueryException = /*#__PURE__*/function (_Error4) {
  _inheritsLoose(SortPropertyNotDefinedInQueryException, _Error4);

  function SortPropertyNotDefinedInQueryException(opts) {
    return _Error4.call(this, "SortPropertyNotDefinedInQueryException exception - The sort property '" + opts.sortPropName + "' is not defined in the 'map' function of the queryDefinition. Add that property to the queryDefinition 'map' function.") || this;
  }

  return SortPropertyNotDefinedInQueryException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var ImpliedNodePropertyException = /*#__PURE__*/function (_Error5) {
  _inheritsLoose(ImpliedNodePropertyException, _Error5);

  function ImpliedNodePropertyException(opts) {
    return _Error5.call(this, "ImpliedPropertyException exception - The property \"" + opts.propName + "\" is implied and cannot be customized within a node definition.") || this;
  }

  return ImpliedNodePropertyException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var NotCachedException = /*#__PURE__*/function (_Error6) {
  _inheritsLoose(NotCachedException, _Error6);

  function NotCachedException(opts) {
    return _Error6.call(this, "NotCached exception - Attempted to get the node with the type \"" + opts.nodeType + "\" and id \"" + opts.id + "\" but it was not cached.") || this;
  }

  return NotCachedException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var NodesCollectionPageOutOfBoundsException = /*#__PURE__*/function (_Error7) {
  _inheritsLoose(NodesCollectionPageOutOfBoundsException, _Error7);

  function NodesCollectionPageOutOfBoundsException(message) {
    return _Error7.call(this, "NodesCollectionPageOutOfBoundsException - " + message) || this;
  }

  return NodesCollectionPageOutOfBoundsException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var DataTypeException = /*#__PURE__*/function (_Error8) {
  _inheritsLoose(DataTypeException, _Error8);

  function DataTypeException(opts) {
    return _Error8.call(this, "DataType exception - the data type " + opts.dataType + " received a bad value. Value: \"" + opts.value + "\"") || this;
  }

  return DataTypeException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var DataTypeExplicitDefaultException = /*#__PURE__*/function (_Error9) {
  _inheritsLoose(DataTypeExplicitDefaultException, _Error9);

  function DataTypeExplicitDefaultException(opts) {
    return _Error9.call(this, "DataTypeExplicitDefaultException - the data type " + opts.dataType + " requires setting an explicit default value for non-optional properties") || this;
  }

  return DataTypeExplicitDefaultException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var DataParsingException = /*#__PURE__*/function (_Error10) {
  _inheritsLoose(DataParsingException, _Error10);

  function DataParsingException(opts) {
    return _Error10.call(this, "DataParsing exception - " + opts.message + "\nData: " + JSON.stringify(opts.receivedData, null, 2) + ".") || this;
  }

  return DataParsingException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var UnexpectedSubscriptionMessageException = /*#__PURE__*/function (_Error11) {
  _inheritsLoose(UnexpectedSubscriptionMessageException, _Error11);

  function UnexpectedSubscriptionMessageException(exception) {
    var _this2;

    _this2 = _Error11.call(this, "UnexpectedSubscriptionMessage exception - unexpected subscription message received") || this;
    _this2.exception = void 0;
    _this2.exception = exception;
    return _this2;
  }

  return UnexpectedSubscriptionMessageException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var FilterOperatorNotImplementedException = /*#__PURE__*/function (_Error13) {
  _inheritsLoose(FilterOperatorNotImplementedException, _Error13);

  function FilterOperatorNotImplementedException(exeption) {
    return _Error13.call(this, "FilterOperatorNotImplementedException - '" + exeption.operator + "' operator not implemented.") || this;
  }

  return FilterOperatorNotImplementedException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
function throwLocallyLogInProd(error) {
  var _process, _process$env;

  if (((_process = process) == null ? void 0 : (_process$env = _process.env) == null ? void 0 : _process$env.NODE_ENV) !== 'production') {
    throw error;
  } else {
    console.error(error);
  }
} // http://ideasintosoftware.com/exhaustive-switch-in-typescript/

var UnreachableCaseError = /*#__PURE__*/function (_Error14) {
  _inheritsLoose(UnreachableCaseError, _Error14);

  function UnreachableCaseError(val) {
    return _Error14.call(this, "Unreachable case: " + (typeof val === 'object' ? JSON.stringify(val, null, 2) : val)) || this;
  }

  return UnreachableCaseError;
}( /*#__PURE__*/_wrapNativeSuper(Error));

(function (EPaginationFilteringSortingInstance) {
  EPaginationFilteringSortingInstance[EPaginationFilteringSortingInstance["SERVER"] = 0] = "SERVER";
  EPaginationFilteringSortingInstance[EPaginationFilteringSortingInstance["CLIENT"] = 1] = "CLIENT";
})(exports.EPaginationFilteringSortingInstance || (exports.EPaginationFilteringSortingInstance = {}));

(function (DATA_TYPES) {
  DATA_TYPES["string"] = "s";
  DATA_TYPES["maybeString"] = "mS";
  DATA_TYPES["stringEnum"] = "sE";
  DATA_TYPES["maybeStringEnum"] = "mSE";
  DATA_TYPES["number"] = "n";
  DATA_TYPES["maybeNumber"] = "mN";
  DATA_TYPES["boolean"] = "b";
  DATA_TYPES["maybeBoolean"] = "mB";
  DATA_TYPES["object"] = "o";
  DATA_TYPES["maybeObject"] = "mO";
  DATA_TYPES["record"] = "r";
  DATA_TYPES["maybeRecord"] = "mR";
  DATA_TYPES["array"] = "a";
  DATA_TYPES["maybeArray"] = "mA";
})(exports.DATA_TYPES || (exports.DATA_TYPES = {}));

(function (RELATIONAL_TYPES) {
  RELATIONAL_TYPES["oneToOne"] = "oTO";
  RELATIONAL_TYPES["oneToMany"] = "otM";
})(exports.RELATIONAL_TYPES || (exports.RELATIONAL_TYPES = {}));

(function (EStringFilterOperator) {
  EStringFilterOperator["eq"] = "eq";
  EStringFilterOperator["neq"] = "neq";
  EStringFilterOperator["contains"] = "contains";
  EStringFilterOperator["ncontains"] = "ncontains";
  EStringFilterOperator["startsWith"] = "startsWith";
  EStringFilterOperator["nstartsWith"] = "nstartsWith";
  EStringFilterOperator["endsWith"] = "endsWith";
  EStringFilterOperator["nendsWith"] = "nendsWith";
})(exports.EStringFilterOperator || (exports.EStringFilterOperator = {}));

(function (ENumberFilterOperator) {
  ENumberFilterOperator["eq"] = "eq";
  ENumberFilterOperator["neq"] = "neq";
  ENumberFilterOperator["gt"] = "gt";
  ENumberFilterOperator["ngt"] = "ngt";
  ENumberFilterOperator["gte"] = "gte";
  ENumberFilterOperator["ngte"] = "ngte";
  ENumberFilterOperator["lt"] = "lt";
  ENumberFilterOperator["nlt"] = "nlt";
  ENumberFilterOperator["lte"] = "lte";
  ENumberFilterOperator["nlte"] = "nlte";
})(exports.ENumberFilterOperator || (exports.ENumberFilterOperator = {}));

(function (EBooleanFilterOperator) {
  EBooleanFilterOperator["eq"] = "eq";
  EBooleanFilterOperator["neq"] = "neq"; // not equal
})(exports.EBooleanFilterOperator || (exports.EBooleanFilterOperator = {}));

var Data = function Data(opts) {
  var _opts$defaultValue;

  this.type = void 0;
  this.parser = void 0;
  this.boxedValue = void 0;
  this.defaultValue = void 0;
  this.isOptional = void 0;
  this.acceptableValues = void 0;
  this.type = opts.type;
  this.parser = opts.parser;
  this.boxedValue = opts.boxedValue;
  this.defaultValue = (_opts$defaultValue = opts.defaultValue) != null ? _opts$defaultValue : null;
  this.isOptional = opts.isOptional;
  this.acceptableValues = opts.acceptableValues;
};
/**
 * data serve 2 purposes:
 * 1) they convert strings from the backend into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the data types used,
 */

var string = function string(defaultValue) {
  return (// TStringType, TStringType,  undefined}
    new Data({
      type: exports.DATA_TYPES.string,
      parser: function parser(value) {
        return value != null ? String(value) : value;
      },
      defaultValue: defaultValue,
      isOptional: false
    })
  );
};
string._default = /*#__PURE__*/string('');
string.optional = /*#__PURE__*/new Data({
  type: exports.DATA_TYPES.maybeString,
  parser: function parser(value) {
    return value != null ? String(value) : value;
  },
  isOptional: true
});
var stringEnum = function stringEnum(enumValues) {
  var dataType = new Data({
    type: exports.DATA_TYPES.stringEnum,
    parser: function parser(value) {
      return value != null ? String(value) : value;
    },
    defaultValue: enumValues[0],
    isOptional: false,
    acceptableValues: enumValues
  });
  return dataType;
};

stringEnum.optional = function (enumValues) {
  var dataType = new Data({
    type: exports.DATA_TYPES.maybeStringEnum,
    parser: function parser(value) {
      return value != null ? String(value) : null;
    },
    defaultValue: enumValues[0],
    isOptional: true,
    acceptableValues: enumValues
  });
  return dataType;
};

var number = function number(defaultValue) {
  return new Data({
    type: exports.DATA_TYPES.number,
    parser: function parser(value) {
      var parsed = Number(value);

      if (isNaN(parsed)) {
        throwLocallyLogInProd(new DataTypeException({
          dataType: exports.DATA_TYPES.number,
          value: value
        }));
        return number._default.defaultValue;
      }

      return parsed;
    },
    defaultValue: defaultValue,
    isOptional: false
  });
};
number._default = /*#__PURE__*/number(0);
number.optional = /*#__PURE__*/new Data({
  type: exports.DATA_TYPES.maybeNumber,
  parser: function parser(value) {
    if (value != null) {
      return Number(value);
    }

    return value;
  },
  isOptional: true
});

var _boolean = function _boolean(defaultValue) {
  if (defaultValue === undefined) {
    return new DataTypeExplicitDefaultException({
      dataType: exports.DATA_TYPES["boolean"]
    });
  }

  return new Data({
    type: exports.DATA_TYPES["boolean"],
    parser: function parser(value) {
      if (value === 'true' || value === true) {
        return true;
      } else if (value === 'false' || value === false) {
        return false;
      } else {
        throw new DataTypeException({
          dataType: exports.DATA_TYPES["boolean"],
          value: value
        });
      }
    },
    defaultValue: defaultValue,
    isOptional: false
  });
}; // need this in order to trigger an error when a user doesn't provide a default
_boolean._default = /*#__PURE__*/_boolean();
_boolean.optional = /*#__PURE__*/new Data({
  type: exports.DATA_TYPES.maybeBoolean,
  parser: function parser(value) {
    if (value == null) return value;

    if (value === 'true' || value === true) {
      return true;
    } else {
      return false;
    }
  },
  isOptional: true
});
var object = function object(boxedValue) {
  return new Data({
    type: exports.DATA_TYPES.object,

    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: function parser(val) {
      return val;
    },
    boxedValue: boxedValue,
    isOptional: false
  });
};
object._default = null;

object.optional = function (boxedValue) {
  return new Data({
    type: exports.DATA_TYPES.maybeObject,

    /**
     * Doesn't need to do any parsing on the data to convert strings to their real types
     * That's done by the DO class's "objectDataSetter" method
     */
    parser: function parser(val) {
      return val;
    },
    boxedValue: boxedValue,
    isOptional: true
  });
};

var record = function record(boxedValue) {
  return new Data({
    type: exports.DATA_TYPES.record,
    parser: function parser(val) {
      return val;
    },
    boxedValue: boxedValue,
    isOptional: false,
    defaultValue: {}
  });
};

record.optional = function (boxedValue) {
  var parsedBoxedValue = // will be a function if no explicit default set
  typeof boxedValue === 'function' ? boxedValue._default : boxedValue;
  return new Data({
    type: exports.DATA_TYPES.maybeRecord,
    parser: function parser(val) {
      return val;
    },
    boxedValue: parsedBoxedValue,
    isOptional: true,
    defaultValue: null
  });
};

record._default = null;
var array = function array(boxedValue) {
  var parsedBoxedValue = // will be a function if no explicit default set
  typeof boxedValue === 'function' ? boxedValue._default : boxedValue;

  function array(defaultValue) {
    return new Data({
      type: exports.DATA_TYPES.array,
      parser: function parser(value) {
        return value;
      },
      boxedValue: parsedBoxedValue,
      defaultValue: defaultValue,
      isOptional: false
    });
  }

  array.optional = new Data({
    type: exports.DATA_TYPES.maybeArray,
    parser: function parser(value) {
      return value;
    },
    boxedValue: parsedBoxedValue,
    isOptional: true
  });
  array._default = array([]);
  return array;
};
var oneToOne = function oneToOne(def) {
  return function (queryBuilderOpts) {
    return {
      def: def,
      _relationshipName: queryBuilderOpts._relationshipName,
      _relational: exports.RELATIONAL_TYPES.oneToOne,
      queryBuilderOpts: queryBuilderOpts
    };
  };
};
var oneToMany = function oneToMany(def) {
  return function (queryBuilderOpts) {
    return {
      def: def,
      _relationshipName: queryBuilderOpts._relationshipName,
      _relational: exports.RELATIONAL_TYPES.oneToMany,
      filter: queryBuilderOpts.filter,
      queryBuilderOpts: queryBuilderOpts
    };
  };
};
var OBJECT_PROPERTY_SEPARATOR = '__dot__';
var OBJECT_IDENTIFIER = '__object__'; // HACK ALERT! Exists only to make TS work the way we need it
// It makes it possible to accept multiple node types within a record of query definitions, without losing type safety
// See this for a simplified example https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBBwYHMA8ARAhlXAFQE8AHAUwD4AKFMNdALkQHkBbGKTASQGUYw6ADbkAwqgw58RMlQA0iAOQB9ZTADOJCr1zByAVXXlCACzET0AMXDR4YAIT3FlAJTM+A4efqS8BLVSIAN4AUIiIAE7kUCARSEEAdEl0DHIqapqyOnqGxmbiPlY2sAiOisxQESDkiAC+IfUhAlDkEcC4EDXchHAAJnB+uMFhiDC9zOqVniME6gDWE1OCDSEhdJOIUH0D0u49-YOIALzBo+NKAIwATADMigqzC0r9m2aIveTkvYp1q1CyiAAitUIsRLGApP5ZJRjohqL1dohBgEXMcYQAFXARWC4ISQmQUSirZqtdqdRAeQQiAoMfEBGGhcLhdIaALZAxGUzeBjWSAlBxOCpVchyEbhBEEZjI2SipmIACOIOIzGBrTBEOlhJWTTALTaHS6AFkQEJYDSMMNwgBtObkZWISYRTwAXXc-Cp3MkuDAxCJjXWUEQbGIADk+uRBu5jaaYOb0LDGYgQEYIpptupmInxYitgdpLKmYq1cxqEEzg9cPM6qijjDS+XNpW5tWRrUC7ihPs4BnkBZS2L3jntoMC+Ei6CS2WxhWq7Ua3Wp70Z82562XCsgA

function queryDefinition(queryDefinition) {
  return queryDefinition;
}

var PROPERTIES_QUERIED_FOR_ALL_NODES = {
  id: string,
  version: number,
  lastUpdatedBy: string,
  type: string
};
var RELATIONAL_UNION_QUERY_SEPARATOR = '__rU__';
var DEFAULT_TOKEN_NAME = 'default'; // These properties are ensuring that every node definition built with mmGQL.def now has these properties auto added to their data.
// They are not queried automatically and must be explicitly defined on the node definition, unless they also appear on PROPERTIES_QUERIED_FOR_ALL_NODES.

var PROPERTIES_QUERIED_FOR_ALL_NODES_MINUS_TYPE = /*#__PURE__*/_objectWithoutPropertiesLoose(PROPERTIES_QUERIED_FOR_ALL_NODES, ["type"]); // adding "type" to the default node properties causes it to be mocked by the mock data generator which is not desirable


var DEFAULT_NODE_PROPERTIES = /*#__PURE__*/_extends({}, PROPERTIES_QUERIED_FOR_ALL_NODES_MINUS_TYPE, {
  dateCreated: number,
  dateLastModified: number,
  lastUpdatedClientTimestamp: number
});
var NODES_PROPERTY_KEY = 'nodes';
var PAGE_INFO_PROPERTY_KEY = 'pageInfo';
var TOTAL_COUNT_PROPERTY_KEY = 'totalCount';
var DEFAULT_PAGE_SIZE = 10;

var JSON_TAG = '__JSON__';
var NULL_TAG = '__NULL__';
function parseJSONFromBE(jsonString) {
  if (!jsonString.startsWith(JSON_TAG)) {
    throw Error("parseJSONFromBE - invalid json received:\n" + jsonString);
  } // convert string array into js array


  if (jsonString.startsWith(JSON_TAG + "[")) {
    return JSON.parse(jsonString.replace('__JSON__', ''));
  } // Allow new line text (\n to \\n)
  // replacing prevents JSON.parse to complaining


  return JSON.parse(jsonString.replace(JSON_TAG, '').replace(/\n/g, '\\n'));
}
function prepareValueForFE(value) {
  if (value === NULL_TAG) {
    return null;
  } else if (value === 'true' || value === 'false') {
    return value === 'true';
  } else if (typeof value === 'string' && value.startsWith(JSON_TAG)) {
    return parseJSONFromBE(value);
  } else if (Array.isArray(value)) {
    return value.map(function (entry) {
      if (typeof entry === 'object') {
        return prepareValueForFE(entry);
      } else {
        return entry;
      }
    });
  } else if (value != null && typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return prepareForFE(value);
  } else {
    return value;
  }
}
function prepareForFE(beData) {
  return Object.keys(beData).reduce(function (prepared, key) {
    var _extends2;

    var value = beData[key];
    return _extends({}, prepared, (_extends2 = {}, _extends2[key] = prepareValueForFE(value), _extends2));
  }, {});
}

function createDOFactory(mmGQLInstance) {
  /**
   * Returns a DO class, since there is one instance of the DO class
   * for each instance of that node type that is fetched from the backend
   */
  return function DOFactory(node) {
    // silences the error "A class can only implement an object type or intersection of object types with statically known members."
    // wich happens because NodeDO has non statically known members (each property on a node in the backend is mapped to a non-statically known property on the DO)
    // eslint-disable-next-line
    // @ts-ignore
    return /*#__PURE__*/function () {
      function DO(initialData) {
        var _this = this,
            _mmGQLInstance$plugin;

        this.parsedData = void 0;
        this.version = -1;
        this.id = void 0;
        this.lastUpdatedBy = void 0;
        this.persistedData = {};
        this._defaults = void 0;
        this.type = node.type;

        this.getDefaultData = function (nodePropertiesOrData) {
          if (nodePropertiesOrData instanceof Data) {
            if (_this.isObjectType(nodePropertiesOrData.type)) {
              return _this.getDefaultData(nodePropertiesOrData.boxedValue);
            }

            return nodePropertiesOrData.defaultValue;
          }

          var getDefaultFnValue = function getDefaultFnValue(propName, defaultData) {
            var defaultFn = defaultData || nodePropertiesOrData[propName]._default; // if a boolean dataType is not passed a default value, it returns an error. We throw it here

            if (defaultFn instanceof Error) {
              throw defaultFn;
            } // if array type, we need to set the default value as an array containing the parent type's boxedValue


            if (_this.isArrayType(defaultFn.type)) {
              if (_this.isObjectType(defaultFn.boxedValue.type)) {
                return [_this.getDefaultData(defaultFn.boxedValue.boxedValue)];
              }

              return [defaultFn.boxedValue.defaultValue];
            }

            return defaultFn.defaultValue;
          };

          if (typeof nodePropertiesOrData === 'function') {
            return getDefaultFnValue(undefined, nodePropertiesOrData._default);
          }

          return Object.keys(nodePropertiesOrData).reduce(function (acc, prop) {
            var propValue = nodePropertiesOrData[prop];

            if (_this.isObjectType(propValue.type) || _this.isRecordType(propValue.type)) {
              acc[prop] = _this.getDefaultData(propValue.boxedValue);
            } else if (typeof propValue === 'function') {
              var defaultValue = getDefaultFnValue(prop);
              acc[prop] = defaultValue;
            } else {
              acc[prop] = nodePropertiesOrData[prop].defaultValue;
            }

            return acc;
          }, {});
        };

        this.onDataReceived = function (receivedData, opts) {
          if (receivedData.version == null) {
            throw Error('Message received for a node was missing a version');
          }

          var newVersion = Number(receivedData.version); // __unsafeIgnoreVersion should used by OptimisticUpdatesOrchestrator ONLY
          // it allows setting the data on the DO to a version older than the last optimistic update
          // so that we can revert on a failed request

          if (opts != null && opts.__unsafeIgnoreVersion || newVersion >= _this.version) {
            _this.version = newVersion;
            _this.lastUpdatedBy = receivedData.lastUpdatedBy;

            var newData = _this.parseReceivedData({
              initialData: receivedData,
              nodeProperties: node.properties
            });

            _this.extendPersistedWithNewlyReceivedData({
              data: node.properties,
              object: _this.persistedData,
              extension: newData
            });

            _this.parsedData = _this.getParsedData({
              data: node.properties,
              persistedData: _this.persistedData,
              defaultData: _this._defaults
            });
          }
        };

        this.setObjectProp = function (propNameForThisObject) {
          Object.defineProperty(_this, propNameForThisObject, {
            configurable: true,
            enumerable: true,
            get: function get() {
              return _this.parsedData[propNameForThisObject];
            }
          });
        };

        this.setPrimitiveValueProp = function (propName) {
          Object.defineProperty(_this, propName, {
            configurable: true,
            enumerable: true,
            get: function get() {
              return _this.parsedData[propName];
            }
          });
        };

        this.setArrayProp = function (propName) {
          Object.defineProperty(_this, propName, {
            configurable: true,
            enumerable: true,
            get: function get() {
              return _this.parsedData[propName];
            }
          });
        };

        this._defaults = this.getDefaultData(node.properties);
        this.id = initialData.id;
        this.lastUpdatedBy = initialData.lastUpdatedBy;

        if (initialData.version != null) {
          this.version = Number(initialData.version);
        }

        if (initialData) {
          this.persistedData = this.parseReceivedData({
            initialData: initialData,
            nodeProperties: node.properties
          });
        }

        this.parsedData = this.getParsedData({
          data: node.properties,
          persistedData: this.persistedData,
          defaultData: this._defaults
        });
        (_mmGQLInstance$plugin = mmGQLInstance.plugins) == null ? void 0 : _mmGQLInstance$plugin.forEach(function (plugin) {
          var _plugin$DO;

          if ((_plugin$DO = plugin.DO) != null && _plugin$DO.onConstruct) {
            plugin.DO.onConstruct({
              DOInstance: _this,
              parsedDataKey: 'parsedData'
            });
          }
        });
        this.initializeNodePropGetters();
        this.initializeNodeComputedGetters();
        this.initializeNodeRelationalGetters();
      }

      var _proto = DO.prototype;

      _proto.parseReceivedData = function parseReceivedData(opts) {
        var _this2 = this;

        var initialData = opts.initialData,
            nodeProperties = opts.nodeProperties;
        return Object.entries(nodeProperties).reduce(function (acc, _ref) {
          var propName = _ref[0],
              propValue = _ref[1];

          var property = _this2.getData(propValue);

          var propExistsInInitialData = propName in initialData && initialData[propName] != null && initialData[propName] !== NULL_TAG;

          if (_this2.isObjectType(property.type) && propExistsInInitialData) {
            acc[propName] = _this2.parseReceivedData({
              initialData: initialData[propName],
              nodeProperties: property.boxedValue
            });
          } else if (_this2.isArrayType(property.type) && propExistsInInitialData) {
            acc[propName] = initialData[propName].map(property.boxedValue.parser);
          } else if (propName in initialData && initialData[propName] === null) {
            acc[propName] = null;
          } else if (propExistsInInitialData) {
            acc[propName] = property.parser(initialData[propName]);
          }

          return acc;
        }, {});
      };

      _proto.getParsedData = function getParsedData(opts) {
        var _this3 = this;

        if (opts.data instanceof Data && opts.data.isOptional && opts.persistedData == null) {
          return null;
        }

        var property = this.getData(opts.data);

        if (property instanceof Data && property.boxedValue) {
          // sm.array, sm.object or sm.record
          if (this.isArrayType(property.type)) {
            if (opts.persistedData) {
              return (opts.persistedData || []).map(function (data) {
                var _opts$defaultData;

                return _this3.getParsedData({
                  data: property.boxedValue,
                  persistedData: data,
                  defaultData: property.type === exports.DATA_TYPES.array ? ((_opts$defaultData = opts.defaultData) == null ? void 0 : _opts$defaultData[0]) || null // If property is a non-optional array and the boxed value is of type sm.object, the default data for an array should be an array with a single item, where that item is the default data for that object
                  : null
                });
              });
            } else {
              return opts.defaultData;
            }
          } else {
            // sm.object, sm.record
            // safe to assume that if we made it this far, the expected data type is object and it's non optional, so lets default it to {}
            if (!opts.persistedData) {
              opts.persistedData = {};
            }

            var boxedValueData = this.getData(property.boxedValue);

            if (boxedValueData instanceof Data) {
              // sm.record
              return Object.keys(opts.persistedData).reduce(function (acc, key) {
                acc[key] = _this3.getParsedData({
                  data: property.boxedValue,
                  persistedData: opts.persistedData[key],
                  defaultData: opts.defaultData //opts.defaultData,

                }); // no default value for values in a record

                return acc;
              }, {});
            } else {
              // if we're dealing with an object, lets loop over the keys in its boxed value
              return Object.keys(property.boxedValue).reduce(function (acc, key) {
                var _opts$defaultData2;

                acc[key] = _this3.getParsedData({
                  data: property.boxedValue[key],
                  persistedData: opts.persistedData[key],
                  defaultData: (_opts$defaultData2 = opts.defaultData) == null ? void 0 : _opts$defaultData2[key]
                });
                return acc;
              }, {});
            }
          }
        } else if (property instanceof Data) {
          // sm.string, sm.boolean, sm.number
          // if a property was nulled using our old format, parse as native null
          if (opts.persistedData === NULL_TAG && opts.data.isOptional) {
            return null;
          }

          if (opts.persistedData != null) {
            return property.parser(opts.persistedData);
          }

          return opts.defaultData;
        } else {
          // root of node, simply loop over keys of data definition and call this function recursively
          return Object.keys(property).reduce(function (acc, prop) {
            acc[prop] = _this3.getParsedData({
              // @ts-ignore
              data: property[prop],
              persistedData: opts.persistedData[prop],
              defaultData: opts.defaultData[prop]
            });
            return acc;
          }, {});
        }
      };

      _proto.extendPersistedWithNewlyReceivedData = function extendPersistedWithNewlyReceivedData(opts) {
        var _this4 = this;

        Object.entries(opts.extension).forEach(function (_ref2) {
          var key = _ref2[0],
              value = _ref2[1];

          var dataForThisProp = _this4.getData(opts.data[key]); // if this is a record, completely overwrite the stored persisted data


          if (_this4.isRecordType(dataForThisProp.type)) {
            opts.object[key] = value;
          } else {
            // if it's an object, extend the persisted data we've received so far with the newly received data
            if (_this4.isObjectType(dataForThisProp.type)) {
              if (value == null) {
                opts.object[key] = null;
              } else {
                opts.object[key] = opts.object[key] || {};

                _this4.extendPersistedWithNewlyReceivedData({
                  data: dataForThisProp.boxedValue,
                  object: opts.object[key],
                  extension: value
                });
              }
            } else {
              // otherwise no need to extend, simply overwrite the value
              opts.object[key] = value;
            }
          }
        });
      }
      /**
       * initializes getters for properties that are stored on this node in the backend
       * as properties on this DO instance
       */
      ;

      _proto.initializeNodePropGetters = function initializeNodePropGetters() {
        var _this5 = this;

        Object.keys(node.properties).forEach(function (prop) {
          if (Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(prop)) {
            // do not create getters for any properties included in the node definition which are already being queried by sm-js regardless
            // since the code in this DO relies on setting those properties directly using this.version or this.lastUpdatedBy
            return;
          }

          var property = _this5.getData(node.properties[prop]);

          if (_this5.isObjectType(property.type)) {
            _this5.setObjectProp(prop);
          } else if (_this5.isArrayType(property.type)) {
            _this5.setArrayProp(prop);
          } else {
            _this5.setPrimitiveValueProp(prop);
          }
        });
      };

      _proto.initializeNodeComputedGetters = function initializeNodeComputedGetters() {
        var _this6 = this;

        var computedData = node.computed;

        if (computedData) {
          Object.keys(computedData).forEach(function (computedProp) {
            _this6.setComputedProp({
              propName: computedProp,
              computedFn: computedData[computedProp]
            });
          });
        }
      };

      _proto.initializeNodeRelationalGetters = function initializeNodeRelationalGetters() {
        var _this7 = this;

        var relationalData = node.relational;

        if (relationalData) {
          Object.keys(relationalData).forEach(function (relationshipName) {
            _this7.setRelationalProp({
              relationshipName: relationshipName,
              relationalQueryGetter: relationalData[relationshipName]
            });
          });
        }
      }
      /**
       * Object type props have different getters and setters than non object type
       * because when an object property is set we extend the previous value, instead of replacing its reference entirely (we've seen great performance gains doing this)
       */
      ;

      _proto.setComputedProp = function setComputedProp(opts) {
        var _this8 = this,
            _mmGQLInstance$plugin2;

        var computedGetter = function computedGetter() {
          return opts.computedFn(_this8);
        };

        (_mmGQLInstance$plugin2 = mmGQLInstance.plugins) == null ? void 0 : _mmGQLInstance$plugin2.forEach(function (plugin) {
          var _plugin$DO2;

          if ((_plugin$DO2 = plugin.DO) != null && _plugin$DO2.computedDecorator) {
            computedGetter = plugin.DO.computedDecorator({
              computedFn: computedGetter,
              DOInstance: _this8
            });
          }
        });
        Object.defineProperty(this, opts.propName, {
          get: function get() {
            return computedGetter();
          },
          configurable: true,
          enumerable: true
        });
      };

      _proto.setRelationalProp = function setRelationalProp(opts) {
        Object.defineProperty(this, opts.relationshipName, {
          configurable: true,
          get: function get() {
            return opts.relationalQueryGetter();
          }
        });
      };

      _proto.getData = function getData(prop) {
        if (typeof prop === 'function') {
          return prop._default;
        }

        return prop;
      };

      _proto.isArrayType = function isArrayType(type) {
        return type === exports.DATA_TYPES.array || type === exports.DATA_TYPES.maybeArray;
      };

      _proto.isObjectType = function isObjectType(type) {
        return type === exports.DATA_TYPES.object || type === exports.DATA_TYPES.maybeObject;
      };

      _proto.isRecordType = function isRecordType(type) {
        return type === exports.DATA_TYPES.record || type === exports.DATA_TYPES.maybeRecord;
      };

      return DO;
    }();
  };
}

function createDOProxyGenerator(mmGQLInstance) {
  /**
   * When some data fetcher like "useQuery" requests some data we do not directly return the DO instances
   * Instead, we decorate each DO instance with a bit of functionality
   * Firstly, we add getters for relational results
   *      For example, if I request a list of todos and an assignee for each of those todos
   *        this proxy generator would be adding an "assignee" getter to each todo and
   *        that assignee getter would return a PROXIED DO for that user
   *
   * Why not just store that data on the do instance directly?
   *      For this case I just described it wouldn't be a problem, since a todo has a single assignee
   *      But imagine a scenario in which a developer is querying for a specific meeting and all active todos in that meeting
   *        and then lazily querying all the archived todos for that meeting.
   *        If the developer isn't extremely careful with naming collision (activeTodos vs archivedTodos distinction, vs just calling them "todos")
   *        it's easy to see how this would create a problem if both query sources are getting the same DO instance
   *
   *      To get around this problem, EACH REQUEST RESULT WILL RETURN ITS OWN INSTANCE OF A PROXIED DO
   *         so naming collision is never a problem.
   *
   *      This also gives us the benefit of support different paging results being displayed simultaneously, since again, the relation results from different
   *         queries will never overwrite each other.
   *
   *
   * Another use for this proxy is to ensure the developer receives helpful errors when they try to read some data that is not being subscribed to
   *      This means that if I query a list of users, request their "firstName" and "id", but then attempt to read user.lastName from the result of that query
   *      we don't just return the cached value, or undefined, because this is likely unintentional. Most apps will want to have real time data.
   *
   *      Instead, we'll throw an error and tell them - hey, you tried to read this property from this node type in this query, but you didn't request it/aren't subscribed to it!
   */
  return function DOProxyGenerator(opts) {
    var relationalResults = opts.relationalResults; // Casting to unknown here because we don't want type safety around structure of a node's data when building plugins
    // but completely losing type safety in opts.node.computed would break the return type inference in QueryDataReturn

    var nodeComputed = opts.node.computed;
    var computedAccessors = nodeComputed ? Object.keys(nodeComputed).reduce(function (acc, computedKey) {
      var _mmGQLInstance$plugin;

      var computedFn = function computedFn() {
        return nodeComputed[computedKey](proxy);
      };

      (_mmGQLInstance$plugin = mmGQLInstance.plugins) == null ? void 0 : _mmGQLInstance$plugin.forEach(function (plugin) {
        var _plugin$DOProxy;

        if ((_plugin$DOProxy = plugin.DOProxy) != null && _plugin$DOProxy.computedDecorator) {
          computedFn = plugin.DOProxy.computedDecorator({
            ProxyInstance: proxy,
            computedFn: computedFn
          });
        }
      });
      acc[computedKey] = computedFn;
      return acc;
    }, {}) : {};
    var proxy = new Proxy(opts["do"], {
      getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, key) {
        // This gives better json stringify results
        // by preventing attempts to get properties which are not
        // guaranteed to be up to date
        if (opts.allPropertiesQueried.includes(key) || opts.relationalQueries && Object.keys(opts.relationalQueries).includes(key) || Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(key)) {
          return _extends({}, Object.getOwnPropertyDescriptor(target, key), {
            enumerable: true
          });
        } // enumerate computed properties which have all the data they need queried
        // otherwise they throw NotUpToDateException and we don't enumerate


        if (nodeComputed && Object.keys(nodeComputed).includes(key)) {
          try {
            computedAccessors[key]();
            return _extends({}, Object.getOwnPropertyDescriptor(target, key), {
              enumerable: true
            });
          } catch (e) {
            if (!(e instanceof NotUpToDateException)) throw e;
            return _extends({}, Object.getOwnPropertyDescriptor(target, key), {
              enumerable: false
            });
          }
        }

        return _extends({}, Object.getOwnPropertyDescriptor(target, key), {
          enumerable: false
        });
      },
      get: function get(target, key) {
        if (key === 'updateRelationalResults') {
          return function (newRelationalResults) {
            relationalResults = _extends({}, relationalResults, newRelationalResults);
          };
        }

        if (relationalResults && opts.relationalQueries && Object.keys(relationalResults).includes(key)) {
          if ('oneToOne' in opts.relationalQueries[key]) {
            return relationalResults[key];
          }

          return relationalResults[key];
        }

        if (Object.keys(opts.node.data).includes(key)) {
          if (!opts.allPropertiesQueried.includes(key)) {
            throw new NotUpToDateException({
              propName: key,
              queryId: opts.queryId,
              nodeType: opts.node.type
            });
          }

          var dataForThisProp = opts.node.data[key];

          if (dataForThisProp.type === exports.DATA_TYPES.object || dataForThisProp.type === exports.DATA_TYPES.maybeObject) {
            // do not return an object if this prop came back as null from backend
            if (opts["do"][key] == null) return opts["do"][key];
            return getNestedObjectWithNotUpToDateProtection({
              nodeType: opts.node.type,
              queryId: opts.queryId,
              allCachedData: opts["do"][key],
              dataForThisObject: dataForThisProp.boxedValue,
              allPropertiesQueried: opts.allPropertiesQueried,
              parentObjectKey: key
            });
          }

          return opts["do"][key];
        } else if (computedAccessors[key]) {
          try {
            return computedAccessors[key]();
          } catch (e) {
            if (e instanceof NotUpToDateException) {
              throw new NotUpToDateInComputedException({
                computedPropName: key,
                propName: e.propName,
                nodeType: opts.node.type,
                queryId: opts.queryId
              });
            }

            throw e;
          }
        }

        return target[key];
      }
    });
    return proxy;
  };

  function getNestedObjectWithNotUpToDateProtection(opts) {
    var objectToReturn = {};
    Object.keys(opts.dataForThisObject).forEach(function (objectProp) {
      var name = opts.parentObjectKey ? "" + opts.parentObjectKey + OBJECT_PROPERTY_SEPARATOR + objectProp : objectProp;
      var dataForThisProp = opts.dataForThisObject[objectProp];
      var isUpToDate = opts.allPropertiesQueried.includes(name) || // this second case handles ensuring that nested objects are enumerable
      // for example, if user matches the interface { address: { apt: { floor: number, unit: number } } }
      // and we request address_apt_floor and address_apt_unit
      // we need to make address.apt enumerable below
      opts.allPropertiesQueried.some(function (prop) {
        return prop.startsWith(name);
      });
      Object.defineProperty(objectToReturn, objectProp, {
        enumerable: isUpToDate,
        get: function get() {
          if (dataForThisProp.type === exports.DATA_TYPES.object || dataForThisProp.type === exports.DATA_TYPES.maybeObject) {
            if (opts.allCachedData[objectProp] == null) return opts.allCachedData[objectProp];
            return getNestedObjectWithNotUpToDateProtection({
              nodeType: opts.nodeType,
              queryId: opts.queryId,
              allCachedData: opts.allCachedData[objectProp],
              dataForThisObject: dataForThisProp.boxedValue,
              allPropertiesQueried: opts.allPropertiesQueried,
              parentObjectKey: name
            });
          }

          if (!isUpToDate) {
            throw new NotUpToDateException({
              propName: name,
              nodeType: opts.nodeType,
              queryId: opts.queryId
            });
          }

          return opts.allCachedData ? opts.allCachedData[objectProp] : undefined;
        }
      });
    });
    return objectToReturn;
  }
}

/**
 * Clones an object or array. Recurses into nested objects and arrays for deep clones.
 */

function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null || obj === undefined) {
    return obj; // return the value if obj is not an object
  }

  if (Array.isArray(obj)) {
    var outputArray = [];
    obj.forEach(function (item) {
      return outputArray.push(deepClone(item));
    });
    return outputArray;
  } else {
    var outputObject = {};

    for (var key in obj) {
      outputObject[key] = deepClone(obj[key]);
    }

    return outputObject;
  }
} // clear an object (and nested objects)
// by deleting all of its props

function clearObject(opts) {
  Object.keys(opts.object).forEach(function (objectProp) {
    if (typeof opts.object[objectProp] === 'object') {
      clearObject({
        object: opts.object[objectProp]
      });
    } else {
      delete opts.object[objectProp];
    }
  });
} // extend an object by mutating its props in place
// based on the values received in "extension"

function extend(opts) {
  var handledExtensionProps = []; // first loop over every key in the object to extend and
  // 1) if opts.deleteKeysNotInExtension, delete properties not in the extension object, whilst avoiding deleting nested objects within the object we're extending
  //    - clear those objects by deleting all properties instead
  // 2) copy properties that did get included in the extension value to the object being extended, whilst avoiding altering the reference to a nested object
  //    - extend those nested objects by calling this function recursively instead

  Object.keys(opts.object).forEach(function (objectProp) {
    var extensionValue = opts.extension[objectProp];

    if (extensionValue === undefined) {
      if (!opts.deleteKeysNotInExtension) return;

      if (opts.object[objectProp] != null && typeof opts.object[objectProp] === 'object') {
        clearObject({
          object: opts.object[objectProp]
        });
      } else {
        delete opts.object[objectProp];
      }
    } else {
      handledExtensionProps.push(objectProp);

      if (extensionValue != null && typeof extensionValue === 'object' && !Array.isArray(extensionValue)) {
        if (opts.extendNestedObjects) {
          opts.object[objectProp] = opts.object[objectProp] || {};
          extend({
            object: opts.object[objectProp] || {},
            extension: extensionValue,
            deleteKeysNotInExtension: opts.deleteKeysNotInExtension,
            extendNestedObjects: true
          });
        } else {
          opts.object[objectProp] = extensionValue;
        }
      } else {
        opts.object[objectProp] = extensionValue;
      }
    }
  }); // then loop over every key in the extension that hasn't yet been handled in the loop above

  Object.keys(opts.extension).filter(function (key) {
    return !handledExtensionProps.includes(key);
  }).forEach(function (extensionProp) {
    var extensionValue = opts.extension[extensionProp];

    if (extensionValue != null && typeof extensionValue === 'object' && !Array.isArray(extensionValue)) {
      if (opts.extendNestedObjects) {
        opts.object[extensionProp] = opts.object[extensionProp] || {};
        extend({
          object: opts.object[extensionProp],
          extension: extensionValue,
          deleteKeysNotInExtension: opts.deleteKeysNotInExtension,
          extendNestedObjects: true
        });
      } else {
        opts.object[extensionProp] = extensionValue;
      }
    } else {
      opts.object[extensionProp] = extensionValue;
    }
  });
}
/**
 * Returns flattened keys of the filter object
 *
 * ```
 * getFlattenedNodeFilterObject({
 *  settings: {
 *    time: {_lte: Date.now()},
 *    nested: {
 *      prop: {_contains: "text"}
 *    }
 *  },
 *  firstName: {_eq: 'John'}
 * })
 * ```
 *
 * Returns
 *
 * ```
 * {
 *  "settings.time": {_lte: Date.now()},
 *  "settings.nested.prop": {_contains: "text"},
 *  "firstName": {_eq: 'John'}
 * }
 * ```
 * @param filterObject : ;
 * @returns
 */

function getFlattenedNodeFilterObject(opts) {
  var result = {};
  var filterObject = opts.queryRecordEntry.filter;
  if (!filterObject) return result;
  var queriedRelations = opts.queryRecordEntry.relational;
  var nodeData = opts.queryRecordEntry.def.data;

  var _loop = function _loop(filteredProperty) {
    var filterValue = filterObject[filteredProperty];
    var isObjectInNodeData = nodeData[filteredProperty] && (nodeData[filteredProperty].type === exports.DATA_TYPES.object || nodeData[filteredProperty].type === exports.DATA_TYPES.maybeObject);
    var isAQueriedRelationalProp = queriedRelations ? queriedRelations[filteredProperty] != null : false;
    var filterIsTargettingNestedObjectOrRelationalData = lodash.isObject(filterValue) && (isAQueriedRelationalProp || isObjectInNodeData);

    if (typeof filterValue == 'object' && filterValue !== null && filterIsTargettingNestedObjectOrRelationalData) {
      var queryRecordEntry = _extends({}, opts.queryRecordEntry, {
        def: isObjectInNodeData ? opts.queryRecordEntry.def : queriedRelations[filteredProperty].def,
        properties: isObjectInNodeData ? opts.queryRecordEntry.properties.filter(function (prop) {
          return prop.startsWith(filteredProperty);
        }).map(function (prop) {
          var _prop$split = prop.split(OBJECT_PROPERTY_SEPARATOR),
              remainingPath = _prop$split.slice(1);

          return remainingPath.join(OBJECT_PROPERTY_SEPARATOR);
        }) : queriedRelations[filteredProperty].properties,
        filter: filterValue
      });

      var flatObject = getFlattenedNodeFilterObject({
        queryRecordEntry: queryRecordEntry
      });
      Object.keys(flatObject).forEach(function (key) {
        result[filteredProperty + '.' + key] = flatObject[key];
      });
    } else {
      if (lodash.isObject(filterValue)) {
        result[filteredProperty] = _extends({}, filterValue, {
          condition: filterValue.condition || 'and'
        });
      } else if (filterValue !== undefined) {
        var _result$filteredPrope;

        result[filteredProperty] = (_result$filteredPrope = {}, _result$filteredPrope[exports.EStringFilterOperator.eq] = filterValue, _result$filteredPrope.condition = 'and', _result$filteredPrope);
      }
    }
  };

  for (var filteredProperty in filterObject) {
    _loop(filteredProperty);
  }

  return result;
}
function getFlattenedNodeSortObject(sorting) {
  var result = {};

  for (var i in sorting) {
    var sortObject = sorting;
    var value = sortObject[i];
    var valueIsNotASortObject = lodash.isObject(value) && !Object.keys(value).includes('direction');

    if (typeof sortObject[i] == 'object' && sortObject[i] !== null && valueIsNotASortObject) {
      var flatObject = getFlattenedNodeSortObject(value);

      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        result[i + '.' + x] = flatObject[x];
      }
    } else {
      if (lodash.isObject(value)) {
        result[i] = value;
      } else if (value !== undefined) {
        var filter = {
          direction: value
        };
        result[i] = filter;
      }
    }
  }

  return result;
}

/**
 * This class is responsible for handling all logic pertaining optimistic updates.
 *
 * It works by intercepting all incoming messages about nodes that the user queries or is subscribed to
 * Then, it also intercepts requests to updateNode and updateNodes within a transaction
 *
 * It optimistically updates the state at the DO level, while also keeping track of known persisted states
 * (the ones that derived from messages received by the node repository)
 *
 * You might wonder, why keep track of all persisted states, rather than just the persisted state at the time of the last update request?
 *
 * I'll answer that with a question:
 * If we call updateNode/updateNodes several times with the same node id, and get a message about a version older than the last update, how do we deal with that?
 *   We could ignore it, since it will likely be overwritten by the update in flight, but this seems risky because we can't assume that the update will be successful. Ignoring that incoming update could lead to stale states if the request does fail.
 *   We could also apply it, since we know it's data that's been persisted in SM. This would likely lead to UX feeling janky. For example, if a user is typing into an input and we're sending debounced updates to SM
 *      and with each update optimistically updating our in memory cache (the DO), but also applying incoming persisted states, the value being displayed for that field would change erratically.
 *
 * I believe a fix for this is to keep applying only optimistic updates to in memory cache if there is any in flight request, while keeping track of all received persisted states
 * We short circuit the repository's onDataReceived so it no longer updates the DO, if any updates are in flight. Instead, it only tells the OptimisticUpdatesOrchestrator that there is a new persisted state.
 * If a single update request fails, and there are no other updates in flight, revert to the last persisted state. Decrease number of in flight requests.
 * If an update request in a group of update requests fails, and there are other updates in flight to SM, decrease number of in flight requests. Don't revert to last persisted state, since this would cause the erratic behavior described above.
 * If an update request succeeds (solo or in a group), simply decrease number of in flight requests.
 *
 * Once the number of in flight requests reaches 0, the repository would no longer get short circuited.
 *
 * Then, we can decide how to update the state on the DO, by leaving it at the newest optimistic update state
 *
 * We would stop capturing persisted data in OptimisticUpdatesOrchestrator for this particular node (which we identify by its id),
 * and delete any persisted data for that node that is currently cached in the OptimisticUpdatesOrchestrator to avoid memory leaks.
 */

var OptimisticUpdatesOrchestrator = /*#__PURE__*/function () {
  function OptimisticUpdatesOrchestrator() {
    var _this = this;

    this.DOsById = {};
    this.lastKnownPersistedDataById = {};
    this.inFlightRequestsById = {};

    this.onDOConstructed = function (DO) {
      if (!DO.id) throw Error('No id found in DO');
      _this.DOsById[DO.id] = DO;
    };

    this.onDODeleted = function (DO) {
      if (!DO.id) throw Error('No id found in DO');
      delete _this.DOsById[DO.id];
      delete _this.lastKnownPersistedDataById[DO.id];
    };

    this.onPersistedDataReceived = function (opts) {
      var nodeId = opts.data.id; // this is how we short circuit ths repository
      // read comment above this class to understand why

      if (_this.inFlightRequestsById[nodeId]) {
        _this.lastKnownPersistedDataById[nodeId] = opts.data;
      } else {
        opts.applyUpdateToDO();
      }
    };

    this.onUpdateRequested = function (update) {
      var DO = _this.getDOById(update.id); // No DO found in cache means we're likely in a unit test, or possible the node was dropped right as the update was request
      // Better to simply do nothing than to throw an error here.


      if (!DO) return {
        onUpdateSuccessful: function onUpdateSuccessful() {},
        onUpdateFailed: function onUpdateFailed() {}
      };

      var rollbackState = _extends({}, deepClone(DO.persistedData), {
        version: DO.version,
        lastUpdatedBy: DO.lastUpdatedBy
      });

      if (!_this.inFlightRequestsById[update.id]) {
        // before any in flight requests go out, we know that the persisted data on a DO is truly persisted
        _this.lastKnownPersistedDataById[update.id] = rollbackState;
        _this.inFlightRequestsById[update.id] = [{
          rollbackState: rollbackState
        }];
      } else {
        // if requests are in flight, the "persisted" data on a DO may actually originate from an optimistic update
        // this is simply to avoid introducing optimistic update logic in the DO class.
        // in that case, the true persisted state will be intercepted from the repository by "onPersistedDataReceived" above
        _this.inFlightRequestsById[update.id].push({
          rollbackState: rollbackState
        });
      }

      var updateIdx = _this.inFlightRequestsById[update.id].length - 1;
      var currentVersion = Number(DO.version);
      var newVersion = currentVersion + 1;
      DO.onDataReceived(_extends({}, update.payload, {
        version: newVersion
      }));
      return {
        onUpdateFailed: function onUpdateFailed() {
          _this.handleUpdateFailed({
            updateIdx: updateIdx,
            id: update.id
          });
        },
        onUpdateSuccessful: function onUpdateSuccessful() {
          _this.handleUpdateSuccessful({
            updateIdx: updateIdx,
            id: update.id
          });
        }
      };
    };
  }

  var _proto = OptimisticUpdatesOrchestrator.prototype;

  _proto.handleUpdateFailed = function handleUpdateFailed(opts) {
    var inFlightRequestsForThisNode = this.inFlightRequestsById[opts.id];
    var wasLastTriggeredUpdate = inFlightRequestsForThisNode.length === opts.updateIdx + 1;

    if (wasLastTriggeredUpdate) {
      var DO = this.getDOById(opts.id);
      if (!DO) return;
      var hasPreviousInFlightUpdate = inFlightRequestsForThisNode.length > 1;

      if (hasPreviousInFlightUpdate) {
        var previousInFlightRollbackState = inFlightRequestsForThisNode[inFlightRequestsForThisNode.length - 1].rollbackState;
        DO.onDataReceived(previousInFlightRollbackState, {
          // __unsafeIgnoreVersion should used by OptimisticUpdatesOrchestrator ONLY
          // it allows setting the data on the DO to a version older than the last optimistic update
          // so that we can revert on a failed request
          __unsafeIgnoreVersion: true
        });
      } else {
        DO.onDataReceived(this.lastKnownPersistedDataById[opts.id], {
          // __unsafeIgnoreVersion should used by OptimisticUpdatesOrchestrator ONLY
          // it allows setting the data on the DO to a version older than the last optimistic update
          // so that we can revert on a failed request
          __unsafeIgnoreVersion: true
        });
        inFlightRequestsForThisNode.splice(opts.updateIdx, 1);
      }
    }

    inFlightRequestsForThisNode.splice(opts.updateIdx, 1);
    this.cleanupIfNoInFlightRequests(opts.id);
  };

  _proto.handleUpdateSuccessful = function handleUpdateSuccessful(opts) {
    var inFlightRequestsForThisNode = this.inFlightRequestsById[opts.id];
    inFlightRequestsForThisNode.splice(opts.updateIdx, 1);
    this.cleanupIfNoInFlightRequests(opts.id);
  };

  _proto.getDOById = function getDOById(id) {
    var DO = this.DOsById[id];
    return DO;
  };

  _proto.cleanupIfNoInFlightRequests = function cleanupIfNoInFlightRequests(id) {
    if (!this.inFlightRequestsById[id].length) {
      delete this.lastKnownPersistedDataById[id];
      delete this.inFlightRequestsById[id];
    }
  };

  return OptimisticUpdatesOrchestrator;
}();

/**
 * Returns an initialized instance of a repository for a Node
 */

function RepositoryFactory(opts) {
  // silences the error "A class can only implement an object type or intersection of object types with statically known members."
  // wich happens because NodeDO has non statically known members (each property on a node in the backend is mapped to a non-statically known property on the DO)
  // eslint-disable-next-line
  // @ts-ignore
  var Repository = /*#__PURE__*/function () {
    function Repository() {
      this.cached = {};
    }

    var _proto = Repository.prototype;

    _proto.onDataReceived = function onDataReceived(data) {
      if (opts.def.type !== data.type) {
        throw Error("Attempted to query a node with an id belonging to a different type - Expected: " + opts.def.type + " Received: " + data.type);
      }

      var cached = this.cached[data.id];
      var parsedData = this.parseDataFromBackend(data);

      if (!cached) {
        var newDO = new opts.DOClass(parsedData);
        this.cached[data.id] = newDO;
        opts.onDOConstructed && opts.onDOConstructed(newDO);
      } // applyUpdateToDO is called conditionally by OptimisticUpdatesOrchestrator
      // see comments in that class to understand why


      opts.onDataReceived({
        data: parsedData,
        applyUpdateToDO: function applyUpdateToDO() {
          // if there was no cached node it was already initialized with this data
          // calling onDataReceived again would be wasted CPU cycles
          cached && cached.onDataReceived(parsedData);
        }
      });
    };

    _proto.byId = function byId(id) {
      var cached = this.cached[id];

      if (!cached) {
        throw new NotCachedException({
          nodeType: opts.def.type,
          id: id
        });
      }

      return cached;
    };

    _proto.onNodeDeleted = function onNodeDeleted(id) {
      if (this.cached[id]) {
        if (opts.onDODeleted) {
          opts.onDODeleted(this.cached[id]);
        }

        delete this.cached[id];
      }
    }
    /**
     * This method takes data that comes in from the backend and is about to be applied to this DO's instance. It needs to:
     * 1) ignore data not specified in the node definition for this node
     *     this is so that the querier in dataContext can call onDataReceived on the DO with the data it receives from the backend without having to ignore the relational aliases there
     *     without doing this, we'd get errors about attempting to set a property on a DO which is read only
     * 2) take objects spread into root properties and convert them to regular objects
     *     for example, if we are trying to store `settings: { show: true }` in the backend, what is actually stored in the DB is
     *     settings__dot__show: 'true'
     *     since all data must be a string (we don't need to worry about coercing strings to booleans or numbers though, that's handled by the dataTypes)
     */
    ;

    _proto.parseDataFromBackend = function parseDataFromBackend(receivedData) {
      var _this = this;

      var oldStyleObjects = {};
      return Object.keys(receivedData).reduce(function (parsed, key) {
        var _opts$def$properties$;

        var isDataStoredOnAllNodes = Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(key);

        if (isDataStoredOnAllNodes) {
          var _extends2;

          return _extends({}, parsed, (_extends2 = {}, _extends2[key] = receivedData[key], _extends2));
        } // point 1) above


        var isDataStoredOnTheNode = key.includes(OBJECT_PROPERTY_SEPARATOR) ? Object.keys(opts.def.properties).includes(key.split(OBJECT_PROPERTY_SEPARATOR)[0]) : Object.keys(opts.def.properties).includes(key);
        if (!isDataStoredOnTheNode) return parsed;
        var type = (_opts$def$properties$ = opts.def.properties[key]) == null ? void 0 : _opts$def$properties$.type;
        var isObjectData = key.includes(OBJECT_PROPERTY_SEPARATOR) || type === exports.DATA_TYPES.object || type === exports.DATA_TYPES.maybeObject;
        var isRecordData = type === exports.DATA_TYPES.record || type === exports.DATA_TYPES.maybeRecord;

        var isArrayData = function () {
          if (isObjectData) {
            return false;
          }

          var receivedDataValue = opts.def.properties[key];
          var dataType = typeof receivedDataValue === 'function' ? receivedDataValue._default.type : receivedDataValue.type;
          return dataType === exports.DATA_TYPES.array || dataType === exports.DATA_TYPES.maybeArray;
        }(); // point 2 above


        if (isObjectData) {
          var _key$split = key.split(OBJECT_PROPERTY_SEPARATOR),
              root = _key$split[0],
              nests = _key$split.slice(1); // it it was set to __NULL__ it means this
          // node is using the old style of storing nested objects


          if (receivedData[root] === NULL_TAG || receivedData[root] === null) {
            parsed[root] = null;
            return parsed;
          } else if (typeof receivedData[root] === 'string' && receivedData[root].startsWith(JSON_TAG)) {
            // https://tractiontools.atlassian.net/browse/TT-2905
            // will ensure this would've been set to null if this object was updated
            //
            // this means 3 things
            // 1 we can acquire all the data for this object from this one property
            // 2 we have to ignore the "null" values coming in when we're querying for the new style propeties (root_nestedProperty)
            // 3 we have to ensure we only return from this object data that was queried
            //   otherwise we risk hitting the DO class with data that is not documented in the node definition, leading to errors
            try {
              oldStyleObjects[root] = oldStyleObjects[root] || parseJSONFromBE(receivedData[root]);
            } catch (e) {
              throw new DataParsingException({
                receivedData: receivedData,
                message: "Could not parse json stored in old format for an object in the key \"" + key + "\""
              });
            }
          }

          if (oldStyleObjects[root]) {
            parsed[root] = parsed[root] || _this.getOnlyQueriedData({
              allDataReceived: receivedData,
              dataPreviouslyParsedForThisObject: oldStyleObjects[root],
              rootProp: root
            });
            return parsed;
          }

          if (parsed[root] == null) {
            parsed[root] = {};
          }

          _this.nest({
            nests: nests,
            root: parsed[root],
            val: receivedData[key] === OBJECT_IDENTIFIER ? {} : receivedData[key]
          });

          return parsed;
        } else if (isRecordData) {
          if (typeof receivedData[key] === 'string' && receivedData[key].startsWith(JSON_TAG)) {
            parsed[key] = parseJSONFromBE(receivedData[key]);
          } else if (receivedData[key] == null) {
            parsed[key] = null;
          } else {
            throw new DataParsingException({
              receivedData: receivedData,
              message: "Could not parse json stored in old format for a record in the key \"" + key + "\""
            });
          }

          return parsed;
        } else if (isArrayData) {
          parsed[key] = prepareValueForFE(receivedData[key]);
          return parsed;
        } else {
          parsed[key] = receivedData[key];
          return parsed;
        }
      }, {});
    };

    _proto.getOnlyQueriedData = function getOnlyQueriedData(opts) {
      var _this2 = this;

      var newStylePropertiesQueriedForThisObject = Object.keys(opts.allDataReceived).filter(function (key) {
        return key.startsWith("" + opts.rootProp + OBJECT_PROPERTY_SEPARATOR);
      });
      return newStylePropertiesQueriedForThisObject.reduce(function (acc, prop) {
        var _object;

        var _prop$split = prop.split(OBJECT_PROPERTY_SEPARATOR),
            root = _prop$split[0],
            nests = _prop$split.slice(1);

        _this2.nest({
          nests: nests,
          root: acc,
          val: _this2.getDataForProp({
            prop: prop,
            object: (_object = {}, _object[root] = opts.dataPreviouslyParsedForThisObject, _object)
          })
        });

        return acc;
      }, {});
    } // with a "prop" in the format root__dot__nestedKey__dot__evenMoreNestedKey
    // returns the correct value from an "object" of previously parsed data { root: { nestedKey: { evenMoreNestedKey: true } } }
    ;

    _proto.getDataForProp = function getDataForProp(opts) {
      if (opts.object == null) {
        return undefined; // the prop is not set on the object at all
      }

      if (opts.prop.includes(OBJECT_PROPERTY_SEPARATOR)) {
        var _opts$prop$split = opts.prop.split(OBJECT_PROPERTY_SEPARATOR),
            root = _opts$prop$split[0],
            rest = _opts$prop$split.slice(1);

        return this.getDataForProp({
          object: opts.object[root],
          prop: rest.join(OBJECT_PROPERTY_SEPARATOR)
        });
      }

      return opts.object[opts.prop];
    };

    _proto.nest = function nest(opts) {
      var parsedVal = opts.val === NULL_TAG ? null : prepareValueForFE(opts.val);

      if (opts.nests.length === 0) {
        opts.root = parsedVal;
      } else if (opts.nests.length === 1) {
        var nextNest = opts.nests[0];
        opts.root[nextNest] = parsedVal;
      } else {
        var _opts$nests = opts.nests,
            _nextNest = _opts$nests[0],
            remainingNests = _opts$nests.slice(1);

        if (opts.root[_nextNest] == null) {
          opts.root[_nextNest] = null;
        } else {
          this.nest({
            nests: remainingNests,
            root: opts.root[_nextNest],
            val: parsedVal
          });
        }
      }
    };

    return Repository;
  }(); // eslint-disable-next-line
  // @ts-ignore


  return new Repository();
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var runtime_1 = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  define(Gp, "constructor", GeneratorFunctionPrototype);
  define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  define(Gp, iteratorSymbol, function() {
    return this;
  });

  define(Gp, "toString", function() {
    return "[object Generator]";
  });

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   module.exports 
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, in modern engines
  // we can explicitly access globalThis. In older engines we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}
});

var chance = /*#__PURE__*/new Chance();
function generateRandomString() {
  return chance.word();
}
function generateRandomBoolean() {
  return chance.bool();
}
function generateRandomNumber(min, max) {
  return chance.integer({
    min: min,
    max: max
  });
}

var _excluded = ["condition"];
/**
 * The functions in this file are responsible for translating queryDefinitionss to gql documents
 * only function that should be needed outside this file is convertQueryDefinitionToQueryInfo
 * other fns are exported for testing purposes only
 */

/**
 * Relational fns are specified when creating a node as fns that return a NodeRelationalQueryBuilder
 * so they can be evaluated lazily to avoid dependency loops between nodes related to each other.
 *
 * This fn executs those fns at query time, and returns a record of relational query builders
 */

function getRelationalQueryBuildersFromRelationalFns(relationaFns) {
  if (!relationaFns) return {};
  return Object.keys(relationaFns).reduce(function (acc, relationshipName) {
    var relationalQueryBuilder = relationaFns[relationshipName]();

    acc[relationshipName] = function (opts) {
      return _extends({}, relationalQueryBuilder(opts), {
        _relationshipName: relationshipName
      });
    };

    return acc;
  }, {});
}

function getMapFnReturn(opts) {
  var mapFnOpts = _extends({}, opts.properties, getRelationalQueryBuildersFromRelationalFns(opts.relational));

  Object.keys(opts.properties).forEach(function (key) {
    var data = opts.properties[key];

    if (data.type === exports.DATA_TYPES.object || data.type === exports.DATA_TYPES.maybeObject) {
      mapFnOpts[key] = function (opts) {
        return opts.map;
      };
    }
  });
  return opts.mapFn(mapFnOpts);
}

function getQueriedProperties(opts) {
  var mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.data,
    relational: opts.relational
  });
  /**
   * a mapFnReturn will be null when the dev returns an object type in a map fn, but does not specify a map fn for that object
   * for example:
   *
   * map: ({ settings }) => ({
   *   settings: settings
   * })
   *
   * instead of
   *
   * map: ({ settings }) => ({
   *   settings: settings({
   *     map: ({ flagEnabled }) => ({ flagEnabled })
   *   })
   * })
   *
   * in this case, we just assume they want to query the entire object
   */

  return Object.keys(mapFnReturn || opts.data).reduce(function (acc, key) {
    var isData = !!opts.data[key];
    if (!isData) return acc; // we always query these properties, can ignore any explicit requests for it

    if (opts.isRootLevel && Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(key)) {
      return acc;
    }

    var data = opts.data[key];

    if (data.type === exports.DATA_TYPES.object || data.type === exports.DATA_TYPES.maybeObject) {
      // query for any data stored in old format (stringified json at the root of the node)
      acc.push(key); // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")

      acc.push.apply(acc, getQueriedProperties({
        queryId: opts.queryId,
        mapFn: mapFnReturn && typeof mapFnReturn[key] === 'function' ? mapFnReturn[key] : function () {
          return null;
        },
        data: data.boxedValue
      }).map(function (nestedKey) {
        return "" + key + OBJECT_PROPERTY_SEPARATOR + nestedKey;
      }));
      return acc;
    }

    return [].concat(acc, [key]);
  }, opts.isRootLevel ? [].concat(Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES)) : []);
}

function getAllNodeProperties(opts) {
  return Object.keys(opts.nodeProperties).reduce(function (acc, key) {
    // we are already querying these properties, can ignore any explicit requests for it
    if (opts.isRootLevel && Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES).includes(key)) {
      return acc;
    }

    var data = opts.nodeProperties[key];

    if (data.type === exports.DATA_TYPES.object || data.type === exports.DATA_TYPES.maybeObject) {
      // query for any data stored in old format (stringified json at the root of the node)
      acc.push(key); // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")

      acc.push.apply(acc, getAllNodeProperties({
        nodeProperties: opts.nodeProperties[key].boxedValue,
        isRootLevel: false
      }).map(function (nestedKey) {
        return "" + key + OBJECT_PROPERTY_SEPARATOR + nestedKey;
      }));
      return acc;
    }

    return [].concat(acc, [key]);
  }, opts.isRootLevel ? [].concat(Object.keys(PROPERTIES_QUERIED_FOR_ALL_NODES)) : []);
}

function getRelationalQueries(opts) {
  var mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.data,
    relational: opts.relational
  });
  var relationalQueries = Object.keys(mapFnReturn).reduce(function (acc, alias) {
    var isData = !!opts.data[alias];
    var isComputed = opts.computed ? !!opts.computed[alias] : false;

    if (isData || isComputed) {
      return acc;
    } else {
      var addRelationalQueryRecord = function addRelationalQueryRecord(queryRecord) {
        var relationalQueryRecord = {
          def: queryRecord.def,
          _relationshipName: queryRecord._relationshipName,
          properties: getQueriedProperties({
            queryId: opts.queryId,
            mapFn: queryRecord.mapFn,
            data: queryRecord.def.data,
            computed: queryRecord.def.computed,
            relational: queryRecord.def.relational,
            isRootLevel: true
          })
        };
        var relationalQueriesWithinThisRelationalQuery = getRelationalQueries({
          queryId: opts.queryId,
          mapFn: queryRecord.mapFn,
          data: queryRecord.def.data,
          computed: queryRecord.def.computed,
          relational: queryRecord.def.relational
        });

        if (relationalQueriesWithinThisRelationalQuery) {
          relationalQueryRecord.relational = relationalQueriesWithinThisRelationalQuery;
        }

        var relationalType = queryRecord._relational;

        if (relationalType === exports.RELATIONAL_TYPES.oneToOne) {
          relationalQueryRecord.oneToOne = true;
        } else if (relationalType === exports.RELATIONAL_TYPES.oneToMany) {
          relationalQueryRecord.oneToMany = true;

          if (relationalQuery.queryBuilderOpts && relationalQuery.queryBuilderOpts.filter) {
            relationalQueryRecord.filter = relationalQuery.queryBuilderOpts.filter;
          }

          if (relationalQuery.queryBuilderOpts && relationalQuery.queryBuilderOpts.pagination) {
            relationalQueryRecord.pagination = relationalQuery.queryBuilderOpts.pagination;
          }

          if (relationalQuery.queryBuilderOpts && relationalQuery.queryBuilderOpts.sort) {
            relationalQueryRecord.sort = relationalQuery.queryBuilderOpts.sort;
          }
        } else {
          throw Error("relationalType \"" + relationalType + "\" is not valid.");
        }

        acc[queryRecord.alias] = relationalQueryRecord;
      };

      var relationalQuery = mapFnReturn[alias];
      /**
       * happens when a map function for a relational query returns all the data for that node
       * example:
       *
       * users: queryDefinition({
       *   def: userNode,
       *   map: ({ todos }) => ({
       *     todos: todos({
       *       map: (allTodoData) => allTodoData
       *     })
       *   })
       * })
       *
       * this function will receive any relational properties in the todo node in the return of the map fn for that todo
       * but they will be functions, instead of the expected objects
       */

      if (typeof relationalQuery === 'function') {
        return acc;
      }

      if (relationalQuery._relational == null) {
        throw Error("getRelationalQueries - the key \"" + alias + "\" is not a data property, not a computed property and does not contain a relational query.");
      }

      if (relationalQuery._relational === exports.RELATIONAL_TYPES.oneToOne || relationalQuery._relational === exports.RELATIONAL_TYPES.oneToMany) {
        if ('map' in relationalQuery.queryBuilderOpts && typeof relationalQuery.queryBuilderOpts.map === 'function') {
          // non union
          var queryBuilderOpts = relationalQuery.queryBuilderOpts;
          addRelationalQueryRecord({
            _relational: relationalQuery._relational,
            _relationshipName: relationalQuery._relationshipName,
            alias: alias,
            def: relationalQuery.def,
            mapFn: queryBuilderOpts.map
          });
        } else {
          // union
          var _queryBuilderOpts = relationalQuery.queryBuilderOpts;
          Object.keys(_queryBuilderOpts).forEach(function (unionType) {
            addRelationalQueryRecord({
              _relational: relationalQuery._relational,
              _relationshipName: relationalQuery._relationshipName,
              alias: "" + alias + RELATIONAL_UNION_QUERY_SEPARATOR + unionType,
              def: relationalQuery.def[unionType],
              mapFn: _queryBuilderOpts[unionType].map
            });
          });
        }
      } else {
        throw Error( // @ts-expect-error relationalQuery is currently a never case here, since both existing types are being checked above
        "The relational query type " + relationalQuery._relational + " is not valid");
      }

      return acc;
    }
  }, {});
  if (Object.keys(relationalQueries).length === 0) return undefined;
  return relationalQueries;
}

function getQueryRecordFromQueryDefinition(opts) {
  var queryRecord = {};
  Object.keys(opts.queryDefinitions).forEach(function (queryDefinitionsAlias) {
    var queryDefinition = opts.queryDefinitions[queryDefinitionsAlias];
    var queriedProps;
    var nodeDef;
    var relational;
    var allowNullResult;
    var tokenName;

    if (!queryDefinition) {
      return;
    } else if ('_isNodeDef' in queryDefinition) {
      // shorthand syntax where the dev only specified a node defition, nothing else
      nodeDef = queryDefinition;
      queriedProps = getAllNodeProperties({
        nodeProperties: nodeDef.data,
        isRootLevel: true
      });
    } else {
      var _queryDefinition$targ;

      nodeDef = queryDefinition.def;
      allowNullResult = (_queryDefinition$targ = queryDefinition.target) == null ? void 0 : _queryDefinition$targ.allowNullResult;
      tokenName = queryDefinition.tokenName;

      if (queryDefinition.map) {
        queriedProps = getQueriedProperties({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          data: queryDefinition.def.data,
          computed: queryDefinition.def.computed,
          relational: queryDefinition.def.relational,
          isRootLevel: true
        });
        relational = getRelationalQueries({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          data: nodeDef.data,
          computed: nodeDef.computed,
          relational: nodeDef.relational
        });
      } else {
        queriedProps = getAllNodeProperties({
          nodeProperties: nodeDef.data,
          isRootLevel: true
        });
      }
    }

    var queryRecordEntry = {
      def: nodeDef,
      properties: queriedProps,
      relational: relational,
      allowNullResult: allowNullResult,
      tokenName: tokenName
    };

    if ('target' in queryDefinition && queryDefinition.target != null) {
      if ('ids' in queryDefinition.target && queryDefinition.target.ids != null) {
        if (queryDefinition.target.ids.some(function (id) {
          return typeof id !== 'string';
        })) {
          throw Error('Invalid id in target.ids');
        }

        queryRecordEntry.ids = queryDefinition.target.ids;
      }

      if ('id' in queryDefinition.target) {
        if (typeof queryDefinition.target.id !== 'string') {
          throw Error('Invalid id in target.id');
        }

        queryRecordEntry.id = queryDefinition.target.id;
      }
    }

    if ('filter' in queryDefinition && queryDefinition.filter != null) {
      queryRecordEntry.filter = queryDefinition.filter;
    }

    if ('pagination' in queryDefinition && queryDefinition.pagination != null) {
      queryRecordEntry.pagination = queryDefinition.pagination;
    }

    if ('sort' in queryDefinition && queryDefinition.sort != null) {
      queryRecordEntry.sort = queryDefinition.sort;
    }

    queryRecord[queryDefinitionsAlias] = queryRecordEntry;
  });
  return queryRecord;
}

function getIdsString(ids) {
  return "[" + ids.map(function (id) {
    return "\"" + id + "\"";
  }).join(',') + "]";
}

function wrapInQuotesIfString(value) {
  if (typeof value === 'string') return "\"" + value + "\"";
  return value;
}

function getBEFilterString(filter) {
  var _readyForBE$and, _readyForBE$or;

  var readyForBE = Object.keys(filter).reduce(function (acc, current) {
    var _filter$key2;

    var key = current;
    var filterForBE;

    if (filter[key] === null || typeof filter[key] === 'string' || typeof filter[key] === 'number' || typeof filter[key] === 'boolean') {
      filterForBE = {
        key: key,
        operator: exports.EStringFilterOperator.eq,
        value: filter[key]
      };
    } else {
      var _filter$key = filter[key],
          rest = _objectWithoutPropertiesLoose(_filter$key, _excluded);

      var keys = Object.keys(rest);

      if (keys.length !== 1) {
        throw Error('Expected 1 property on this filter object');
      }

      var operator = keys[0];
      var value = rest[operator];
      filterForBE = {
        key: key,
        operator: operator,
        value: value
      };
    }

    var condition = ((_filter$key2 = filter[key]) == null ? void 0 : _filter$key2.condition) || 'and';
    var conditionArray = acc[condition] || [];
    conditionArray.push(filterForBE);
    acc[condition] = conditionArray;
    return acc;
  }, {});

  if (((_readyForBE$and = readyForBE.and) == null ? void 0 : _readyForBE$and.length) === 0) {
    delete readyForBE.and;
  }

  if (((_readyForBE$or = readyForBE.or) == null ? void 0 : _readyForBE$or.length) === 0) {
    delete readyForBE.or;
  }

  return Object.entries(readyForBE).reduce(function (acc, _ref, index) {
    var condition = _ref[0],
        filters = _ref[1];
    if (index > 0) acc += ', ';
    var stringifiedFilters = filters.reduce(function (acc, filter, index) {
      if (index > 0) acc += ', ';
      acc += "{" + filter.key + ": {" + filter.operator + ": " + wrapInQuotesIfString(filter.value) + "}}";
      return acc;
    }, '');
    acc += "{" + condition + ": [" + stringifiedFilters + "]}";
    return acc;
  }, '');
}

function getBEOrderArrayString(sort) {
  return Object.keys(sort).reduce(function (acc, key, sortIndex, sortKeys) {
    var direction;
    var priority;
    var sortValue = sort[key];

    if (typeof sortValue === 'string') {
      // ensure that items which were not given priority
      // are placed at the end of the array
      // in the order in which they were received
      priority = sortKeys.length + sortIndex;
      direction = sortValue === 'asc' ? 'ASC' : 'DESC';
    } else {
      var sortObject = sortValue;
      priority = sortObject.priority != null ? sortObject.priority : sortKeys.length + sortIndex;
      direction = sortObject.direction === 'asc' ? 'ASC' : 'DESC';
    }

    acc[priority] = "{" + key + ": " + direction + "}";
    return acc;
  }, []) // because we use priority to index sort objects
  // we must filter out any indicies we left empty
  .filter(function (item) {
    return item != null;
  }).join(', ');
}

function getGetNodeOptions(opts) {
  if (!opts.useServerSidePaginationFilteringSorting) return '';
  var options = [];

  if (opts.queryRecordEntry.filter != null) {
    options.push("where: " + getBEFilterString(opts.queryRecordEntry.filter));
  }

  if (opts.queryRecordEntry.sort != null) {
    options.push("order: [" + getBEOrderArrayString(opts.queryRecordEntry.sort) + "]");
  }

  if (opts.queryRecordEntry.pagination != null) {
    if (opts.queryRecordEntry.pagination.endCursor) {
      options.push("before: \"" + opts.queryRecordEntry.pagination.endCursor + "\"");
    }

    if (opts.queryRecordEntry.pagination.startCursor) {
      options.push("after: \"" + opts.queryRecordEntry.pagination.startCursor + "\"");
    }

    if (opts.queryRecordEntry.pagination.itemsPerPage) {
      options.push((opts.queryRecordEntry.pagination.endCursor ? 'last' : 'first') + ": " + opts.queryRecordEntry.pagination.itemsPerPage);
    }
  }

  return options.join(', ');
}

function getSpaces(numberOfSpaces) {
  return new Array(numberOfSpaces).fill(' ').join('');
}

function getQueryPropertiesString(opts) {
  var propsString = "" + getSpaces(opts.nestLevel * 2);
  propsString += opts.queryRecordEntry.properties.join("\n" + getSpaces(opts.nestLevel * 2));

  if (opts.queryRecordEntry.relational) {
    propsString += getRelationalQueryString({
      relationalQueryRecord: opts.queryRecordEntry.relational,
      nestLevel: opts.nestLevel,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    });
  }

  return propsString;
}

function getRelationalQueryString(opts) {
  return Object.keys(opts.relationalQueryRecord).reduce(function (acc, alias) {
    var relationalQueryRecordEntry = opts.relationalQueryRecord[alias];

    if (!relationalQueryRecordEntry._relationshipName) {
      throw Error("relationalQueryRecordEntry is invalid\n" + JSON.stringify(relationalQueryRecordEntry, null, 2));
    }

    var resolver = "" + relationalQueryRecordEntry._relationshipName;
    var options = getGetNodeOptions({
      queryRecordEntry: relationalQueryRecordEntry,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    });
    var operation = "" + resolver + (options !== '' ? "(" + options + ")" : '');
    return acc + ("\n" + getSpaces(opts.nestLevel * 2) + alias + ": " + operation + " {\n") + ('oneToMany' in relationalQueryRecordEntry ? getNodesCollectionQuery({
      propertiesString: getQueryPropertiesString({
        queryRecordEntry: relationalQueryRecordEntry,
        nestLevel: opts.nestLevel + 2,
        useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
      }),
      nestLevel: opts.nestLevel + 1
    }) : getQueryPropertiesString({
      queryRecordEntry: relationalQueryRecordEntry,
      nestLevel: opts.nestLevel + 1,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    })) + ("\n" + getSpaces(opts.nestLevel * 2) + "}");
  }, '');
}

function getOperationFromQueryRecordEntry(opts) {
  var nodeType = opts.def.type;
  var operation;

  if ('ids' in opts && opts.ids != null) {
    operation = nodeType + "s(ids: " + getIdsString(opts.ids) + ")";
  } else if ('id' in opts && opts.id != null) {
    operation = nodeType + "(id: \"" + opts.id + "\")";
  } else {
    var options = getGetNodeOptions({
      queryRecordEntry: opts,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    });
    operation = nodeType + "s" + (options !== '' ? "(" + options + ")" : '');
  }

  return operation;
} // queries a collection of nodes by wrapping the properties queried with "nodes"
// and also includes other necessary paging information in the query


function getNodesCollectionQuery(opts) {
  var closeFragment = getSpaces(opts.nestLevel * 2) + "}";
  var openNodesFragment = getSpaces(opts.nestLevel * 2) + "nodes {\n";
  var nodesFragment = "" + openNodesFragment + opts.propertiesString + "\n" + closeFragment;
  var totalCountFragment = "\n" + getSpaces(opts.nestLevel * 2) + TOTAL_COUNT_PROPERTY_KEY;
  var openPageInfoFragment = "\n" + getSpaces(opts.nestLevel * 2) + PAGE_INFO_PROPERTY_KEY + " {\n";
  var pageInfoProps = ['endCursor', 'startCursor', 'hasNextPage', 'hasPreviousPage'];
  var pageInfoProperties = pageInfoProps.map(function (prop) {
    return "" + getSpaces((opts.nestLevel + 1) * 2) + prop;
  }).join("\n");
  var pageInfoFragment = "" + openPageInfoFragment + pageInfoProperties + "\n" + closeFragment;
  return "" + nodesFragment + totalCountFragment + pageInfoFragment;
}

function getRootLevelQueryString(opts) {
  var operation = getOperationFromQueryRecordEntry(opts);
  return "  " + opts.alias + ": " + operation + " {\n" + ("" + (opts.id == null ? getNodesCollectionQuery({
    propertiesString: getQueryPropertiesString({
      queryRecordEntry: opts,
      nestLevel: 3,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    }),
    nestLevel: 2
  }) : getQueryPropertiesString({
    queryRecordEntry: opts,
    nestLevel: 2,
    useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
  }))) + "\n  }";
}

function getQueryGQLStringFromQueryRecord(opts) {
  return ("query " + getSanitizedQueryId({
    queryId: opts.queryId
  }) + " {\n" + Object.keys(opts.queryRecord).map(function (alias) {
    return getRootLevelQueryString(_extends({}, opts.queryRecord[alias], {
      alias: alias,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    }));
  }).join('\n    ') + '\n}').trim();
}

function getQueryRecordSortAndFilterValues(record) {
  return Object.keys(record).reduce(function (acc, alias) {
    acc.push(record[alias].filter);
    acc.push(record[alias].sort);
    var relational = record[alias].relational;

    if (relational) {
      acc.push.apply(acc, getQueryRecordSortAndFilterValues(relational) || []);
    }

    return acc;
  }, []);
}

function queryRecordEntryReturnsArrayOfData(opts) {
  return (!('id' in opts.queryRecordEntry) || opts.queryRecordEntry.id == null) && !('oneToOne' in opts.queryRecordEntry);
}
function getQueryInfo(opts) {
  var queryRecord = getQueryRecordFromQueryDefinition(opts);
  var queryGQLString = getQueryGQLStringFromQueryRecord({
    queryId: opts.queryId,
    queryRecord: queryRecord,
    useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
  });
  var queryParamsString = JSON.stringify(getQueryRecordSortAndFilterValues(queryRecord));
  var subscriptionConfigs = Object.keys(queryRecord).reduce(function (subscriptionConfigsAcc, alias) {
    var subscriptionName = getSanitizedQueryId({
      queryId: opts.queryId + '_' + alias
    });
    var queryRecordEntry = queryRecord[alias];
    var operation = getOperationFromQueryRecordEntry(_extends({}, queryRecordEntry, {
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    }));
    var gqlStrings = [("\n    subscription " + subscriptionName + " {\n      " + alias + ": " + operation + " {\n        node {\n          " + getQueryPropertiesString({
      queryRecordEntry: queryRecordEntry,
      nestLevel: 5,
      useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
    }) + "\n        }\n        operation { action, path }\n      }\n    }\n        ").trim()];

    function extractNodeFromSubscriptionMessage(subscriptionMessage) {
      if (!subscriptionMessage[alias].node) {
        throw new UnexpectedSubscriptionMessageException({
          subscriptionMessage: subscriptionMessage,
          description: 'No "node" found in message'
        });
      }

      return subscriptionMessage[alias].node;
    }

    function extractOperationFromSubscriptionMessage(subscriptionMessage) {
      if (!subscriptionMessage[alias].operation) {
        throw new UnexpectedSubscriptionMessageException({
          subscriptionMessage: subscriptionMessage,
          description: 'No "operation" found in message'
        });
      }

      return subscriptionMessage[alias].operation;
    }

    gqlStrings.forEach(function (gqlString) {
      subscriptionConfigsAcc.push({
        alias: alias,
        gqlString: gqlString,
        extractNodeFromSubscriptionMessage: extractNodeFromSubscriptionMessage,
        extractOperationFromSubscriptionMessage: extractOperationFromSubscriptionMessage
      });
    });
    return subscriptionConfigsAcc;
  }, []);
  return {
    subscriptionConfigs: subscriptionConfigs,
    queryGQLString: queryGQLString,
    queryParamsString: queryParamsString,
    queryRecord: queryRecord
  };
}
/**
 * Converts a queryDefinitions into a gql doc that can be sent to the gqlClient
 * Returns a queryRecord for easily deduping requests based on the data that is being requested
 * Can later also be used to build a diff to request only the necessary data
 * taking into account the previous query record to avoid requesting data already in memory
 */

function convertQueryDefinitionToQueryInfo(opts) {
  var _getQueryInfo = getQueryInfo(opts),
      queryGQLString = _getQueryInfo.queryGQLString,
      subscriptionConfigs = _getQueryInfo.subscriptionConfigs,
      queryRecord = _getQueryInfo.queryRecord,
      queryParamsString = _getQueryInfo.queryParamsString; //call plugin function here that takes in the queryRecord


  return {
    queryGQL: core.gql(queryGQLString),
    subscriptionConfigs: subscriptionConfigs.map(function (subscriptionConfig) {
      return _extends({}, subscriptionConfig, {
        gql: core.gql(subscriptionConfig.gqlString)
      });
    }),
    queryRecord: queryRecord,
    queryParamsString: queryParamsString
  };
}

function getSanitizedQueryId(opts) {
  return opts.queryId.replace(/-/g, '_');
}

var _excluded$1 = ["to"],
    _excluded2 = ["from"];
var JSON_TAG$1 = '__JSON__';
/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @param IDataRecord a record of Data types to identify objects vs records
 * @param generatingMockData a boolean to determine if escape text should be utilized
 * @returns stringified params ready for mutation
 */

function revisedConvertNodeDataToSMPersistedData(opts) {
  var nodeData = opts.nodeData,
      IDataRecord = opts.IDataRecord,
      generatingMockData = opts.generatingMockData,
      skipBooleanStringWrapping = opts.skipBooleanStringWrapping;
  var parsedData = revisedPrepareForBE({
    obj: nodeData,
    IDataRecord: IDataRecord,
    generatingMockData: generatingMockData
  });
  var stringified = Object.entries(parsedData).reduce(function (acc, _ref, i) {
    var key = _ref[0],
        value = _ref[1];

    if (i > 0) {
      acc += '\n';
    }

    if (key === 'childNodes' || key === 'additionalEdges') {
      return acc + (key + ": [\n{\n" + value.join('\n}\n{\n') + "\n}\n]");
    }

    var shouldBeRawBoolean = (value === 'true' || value === 'false') && !!skipBooleanStringWrapping;
    return acc + (key + ": " + (value === null || shouldBeRawBoolean ? value : "\"" + value + "\""));
  }, "");
  return stringified;
}

function escapeText(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
/**
 * Takes an object node value and flattens it to be sent to SM
 *
 * @param obj an object with arbitrary data
 * @param IDataRecordForKey a record of Data type for specific key to identify objects vs records
 * @param generatingMockData a boolean to determine if escape text should be utilized
 * @param parentKey if the value is a nested object, the key of the parent is passed in order to prepend it to the child key
 * @param omitObjectIdentifier skip including __object__ for identifying parent objects,
 *  used to construct filters since there we don't care what the parent property is set to
 * @returns a flat object where the keys are of "key__dot__value" syntax
 *
 * For example:
 * ```typescript
 * const obj = {settings: {schedule: {day: 'Monday'} } }
 *  const result = prepareValueForBE(obj)
 * ```
 * The result will be:
 *  ```typescript
 *  {
 * settings: '__object__',
 * settings__dot__schedule: '__object__',
 * settings__dot__schedule__dot__day: 'Monday',
 * }
 * ```
 */


function revisedPrepareObjectForBE(opts) {
  var obj = opts.obj,
      parentKey = opts.parentKey,
      omitObjectIdentifier = opts.omitObjectIdentifier;
  return Object.entries(obj).reduce(function (acc, _ref2) {
    var key = _ref2[0],
        val = _ref2[1];
    var preparedKey = parentKey ? "" + parentKey + OBJECT_PROPERTY_SEPARATOR + key : key;

    if (typeof val === 'object' && val != null && !Array.isArray(val)) {
      if (!omitObjectIdentifier) {
        acc[preparedKey] = OBJECT_IDENTIFIER;
      }

      acc = _extends({}, acc, Object.entries(val).reduce(function (acc, _ref3) {
        var key = _ref3[0],
            val = _ref3[1];
        return _extends({}, acc, revisedConvertPropertyToBE(_extends({
          key: "" + preparedKey + OBJECT_PROPERTY_SEPARATOR + key,
          value: val
        }, opts)));
      }, {}));
    } else {
      acc = _extends({}, acc, revisedConvertPropertyToBE(_extends({
        key: preparedKey,
        value: val
      }, opts)));
    }

    return acc;
  }, {});
}

function revisedConvertPropertyToBE(opts) {
  var key = opts.key,
      value = opts.value,
      IDataRecordForKey = opts.IDataRecordForKey,
      generatingMockData = opts.generatingMockData,
      omitObjectIdentifier = opts.omitObjectIdentifier;

  if (value === null) {
    var _ref4;

    return _ref4 = {}, _ref4[key] = null, _ref4;
  } else if (Array.isArray(value)) {
    var _ref5;

    return _ref5 = {}, _ref5[key] = "" + JSON_TAG$1 + (generatingMockData ? JSON.stringify(value) : escapeText(JSON.stringify(value))), _ref5;
  } else if (typeof value === 'object') {
    if (IDataRecordForKey.type === exports.DATA_TYPES.record || IDataRecordForKey.type === exports.DATA_TYPES.maybeRecord) {
      var _ref6;

      return _ref6 = {}, _ref6[key] = "" + JSON_TAG$1 + (generatingMockData ? JSON.stringify(value) : escapeText(JSON.stringify(value))), _ref6;
    } else {
      var _obj;

      return revisedPrepareObjectForBE({
        obj: (_obj = {}, _obj[key] = value, _obj),
        IDataRecordForKey: IDataRecordForKey,
        generatingMockData: generatingMockData,
        omitObjectIdentifier: omitObjectIdentifier
      });
    }
  } else if (typeof value === 'string') {
    var _ref7;

    return _ref7 = {}, _ref7[key] = escapeText(value), _ref7;
  } else if (typeof value === 'boolean' || typeof value === 'number') {
    var _ref9;

    if (typeof value === 'number' && isNaN(value)) {
      var _ref8;

      return _ref8 = {}, _ref8[key] = null, _ref8;
    }

    return _ref9 = {}, _ref9[key] = String(value), _ref9;
  } else {
    throw Error("I don't yet know how to handle feData of type \"" + typeof value + "\"");
  }
}

function revisedConvertEdgeDirectionNames(edgeItem) {
  if (edgeItem.hasOwnProperty('to')) {
    var to = edgeItem.to,
        restOfEdgeItem = _objectWithoutPropertiesLoose(edgeItem, _excluded$1);

    return _extends({}, restOfEdgeItem, {
      targetId: to
    });
  } else if (edgeItem.hasOwnProperty('from')) {
    var _restOfEdgeItem = _objectWithoutPropertiesLoose(edgeItem, _excluded2);

    return _extends({}, _restOfEdgeItem, {
      sourceId: edgeItem.from
    });
  }

  throw new Error('convertEdgeDirectionNames - received invalid data');
}

function revisedPrepareForBE(opts) {
  var IDataRecord = opts.IDataRecord,
      obj = opts.obj,
      generatingMockData = opts.generatingMockData;
  return Object.entries(obj).reduce(function (acc, _ref10) {
    var key = _ref10[0],
        value = _ref10[1];
    var IDataRecordForKey = typeof IDataRecord[key] === 'function' ? IDataRecord[key]._default : IDataRecord[key];

    if (key === 'childNodes') {
      if (!Array.isArray(value)) {
        throw new Error("\"childNodes\" is supposed to be an array");
      }

      return _extends({}, acc, {
        childNodes: value.map(function (item) {
          return revisedConvertNodeDataToSMPersistedData({
            nodeData: item,
            IDataRecord: IDataRecord,
            generatingMockData: generatingMockData
          });
        })
      });
    }

    if (key === 'additionalEdges') {
      if (!Array.isArray(value)) {
        throw new Error("\"additionalEdges\" is supposed to be an array");
      }

      return _extends({}, acc, {
        additionalEdges: value.map(function (item) {
          return revisedConvertNodeDataToSMPersistedData({
            nodeData: revisedConvertEdgeDirectionNames(item),
            IDataRecord: IDataRecord,
            generatingMockData: generatingMockData,
            skipBooleanStringWrapping: true
          });
        })
      });
    }

    return _extends({}, acc, revisedConvertPropertyToBE({
      key: key,
      value: value,
      IDataRecordForKey: IDataRecordForKey,
      generatingMockData: generatingMockData
    }));
  }, {});
}

function getMockValueForIData(data) {
  switch (data.type) {
    case exports.DATA_TYPES.string:
      {
        return generateRandomString();
      }

    case exports.DATA_TYPES.maybeString:
      {
        // 50/50 chance to get a value or null
        return getRandomItemFromArray([generateRandomString(), null]);
      }

    case exports.DATA_TYPES.stringEnum:
      {
        return getRandomItemFromArray(data.acceptableValues);
      }

    case exports.DATA_TYPES.maybeStringEnum:
      {
        return getRandomItemFromArray([getRandomItemFromArray(data.acceptableValues), null]);
      }

    case exports.DATA_TYPES.number:
      {
        return generateRandomNumber(1, 100);
      }

    case exports.DATA_TYPES.maybeNumber:
      {
        return getRandomItemFromArray([generateRandomNumber(1, 100), null]);
      }

    case exports.DATA_TYPES["boolean"]:
      {
        return generateRandomBoolean();
      }

    case exports.DATA_TYPES.maybeBoolean:
      {
        return getRandomItemFromArray([generateRandomBoolean(), null]);
      }

    case exports.DATA_TYPES.object:
      {
        return getMockValuesForIDataRecord(data.boxedValue);
      }

    case exports.DATA_TYPES.maybeObject:
      {
        return getRandomItemFromArray([getMockValuesForIDataRecord(data.boxedValue), null]);
      }

    case exports.DATA_TYPES.array:
      {
        return new Array(generateRandomNumber(1, 10)).fill('').map(function (_) {
          return typeof data.boxedValue === 'function' ? getMockValueForIData(data.boxedValue._default) : getMockValueForIData(data.boxedValue);
        });
      }

    case exports.DATA_TYPES.maybeArray:
      {
        return getRandomItemFromArray([new Array(generateRandomNumber(1, 10)).fill('').map(function (_) {
          return typeof data.boxedValue === 'function' ? getMockValueForIData(data.boxedValue._default) : getMockValueForIData(data.boxedValue);
        }), null]);
      }

    case exports.DATA_TYPES.record:
      {
        var _ref;

        return _ref = {}, _ref[generateRandomString()] = typeof data.boxedValue === 'function' ? getMockValueForIData(data.boxedValue._default) : getMockValueForIData(data.boxedValue), _ref;
      }

    case exports.DATA_TYPES.maybeRecord:
      {
        var _ref2;

        return getRandomItemFromArray([(_ref2 = {}, _ref2[generateRandomString()] = typeof data.boxedValue === 'function' ? getMockValueForIData(data.boxedValue._default) : getMockValueForIData(data.boxedValue), _ref2), null]);
      }

    default:
      throw new UnreachableCaseError(data.type);
  }
}

function getMockValuesForIDataRecord(record) {
  return Object.entries(record).reduce(function (acc, _ref3) {
    var key = _ref3[0],
        value = _ref3[1];

    if (typeof value === 'function') {
      acc[key] = getMockValueForIData(value._default);
    } else {
      acc[key] = getMockValueForIData(value);
    }

    return acc;
  }, {});
}

function generateMockNodeDataFromQueryRecordForQueriedProperties(opts) {
  var queryRecordEntry = opts.queryRecordEntry;
  var nodePropertiesToMock = Object.keys(queryRecordEntry.def.data).filter(function (nodeProperty) {
    return queryRecordEntry.properties.includes(nodeProperty);
  }).reduce(function (acc, item) {
    acc[item] = queryRecordEntry.def.data[item];
    return acc;
  }, {});

  var mockedValues = _extends({
    type: opts.queryRecordEntry.def.type,
    version: '1'
  }, getMockValuesForIDataRecord(nodePropertiesToMock));

  if (queryRecordEntry.def.generateMockData) {
    var queryRecordEntryMockData = queryRecordEntry.def.generateMockData();
    var mockDataPropertiesToAddToExtension = Object.keys(queryRecordEntryMockData).reduce(function (acc, item) {
      if (queryRecordEntry.properties.includes(item)) {
        acc[item] = queryRecordEntryMockData[item];
      }

      return acc;
    }, {});
    extend({
      object: mockedValues,
      extension: mockDataPropertiesToAddToExtension,
      extendNestedObjects: true,
      deleteKeysNotInExtension: false
    });
  }

  var valuesForNodeDataPreparedForBE = revisedPrepareForBE({
    obj: mockedValues,
    IDataRecord: nodePropertiesToMock,
    generatingMockData: true
  });
  return valuesForNodeDataPreparedForBE;
}

function generateMockNodeDataForQueryRecord(opts) {
  var queryRecord = opts.queryRecord;
  var mockedNodeData = {};
  Object.keys(queryRecord).forEach(function (queryRecordAlias) {
    var queryRecordEntryForThisAlias = queryRecord[queryRecordAlias];
    var returnValueShouldBeAnArray = queryRecordEntryReturnsArrayOfData({
      queryRecordEntry: queryRecordEntryForThisAlias
    });
    var mockedNodeDataReturnValues;
    var relationalMockNodeProperties = {};

    if (returnValueShouldBeAnArray) {
      var _queryRecordEntryForT, _mockedNodeDataReturn;

      var pageSize = ((_queryRecordEntryForT = queryRecordEntryForThisAlias.pagination) == null ? void 0 : _queryRecordEntryForT.itemsPerPage) || DEFAULT_PAGE_SIZE; // must generate at least 1 result, otherwise may return an empty array for a oneToMany relationship which expects at least 1 result

      var numOfResultsToGenerate = generateRandomNumber(1, pageSize * 5);
      var arrayOfMockNodeValues = [];

      for (var i = 0; i < numOfResultsToGenerate; i++) {
        var mockNodeDataForQueryRecord = generateMockNodeDataFromQueryRecordForQueriedProperties({
          queryRecordEntry: queryRecordEntryForThisAlias
        });

        if (queryRecordEntryForThisAlias.relational) {
          relationalMockNodeProperties = generateMockNodeDataForQueryRecord({
            queryRecord: queryRecordEntryForThisAlias.relational
          });
        }

        arrayOfMockNodeValues.push(_extends({}, mockNodeDataForQueryRecord, relationalMockNodeProperties));
      }

      var pageInfo = {
        endCursor: 'xyz',
        startCursor: 'yzx',
        hasPreviousPage: false,
        hasNextPage: pageSize < arrayOfMockNodeValues.length,
        totalPages: Math.ceil(arrayOfMockNodeValues.length / pageSize)
      };
      mockedNodeDataReturnValues = (_mockedNodeDataReturn = {}, _mockedNodeDataReturn[NODES_PROPERTY_KEY] = arrayOfMockNodeValues, _mockedNodeDataReturn[TOTAL_COUNT_PROPERTY_KEY] = arrayOfMockNodeValues.length, _mockedNodeDataReturn[PAGE_INFO_PROPERTY_KEY] = pageInfo, _mockedNodeDataReturn);
    } else {
      var _mockNodeDataForQueryRecord = generateMockNodeDataFromQueryRecordForQueriedProperties({
        queryRecordEntry: queryRecordEntryForThisAlias
      });

      if (queryRecordEntryForThisAlias.relational) {
        relationalMockNodeProperties = generateMockNodeDataForQueryRecord({
          queryRecord: queryRecordEntryForThisAlias.relational
        });
      }

      mockedNodeDataReturnValues = _extends({}, _mockNodeDataForQueryRecord, relationalMockNodeProperties);
    }

    mockedNodeData[queryRecordAlias] = mockedNodeDataReturnValues;
  });
  return mockedNodeData;
}

function getRandomItemFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function checkFilter(_ref) {
  var operator = _ref.operator,
      itemValue = _ref.itemValue,
      filterValue = _ref.filterValue;

  switch (operator) {
    case 'contains':
      {
        return String(itemValue).toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1;
      }

    case 'ncontains':
      {
        return String(itemValue).toLowerCase().indexOf(String(filterValue).toLowerCase()) === -1;
      }

    case 'eq':
      {
        return String(itemValue).toLowerCase() === String(filterValue).toLowerCase();
      }

    case 'neq':
      return String(itemValue).toLowerCase() !== String(filterValue).toLowerCase();

    case 'gt':
      return itemValue > filterValue;

    case 'gte':
      return itemValue >= filterValue;

    case 'lt':
      return itemValue < filterValue;

    case 'lte':
      return itemValue <= filterValue;

    default:
      throw new FilterOperatorNotImplementedException({
        operator: operator
      });
  }
}

function convertNullStringValuesToNull(_ref2) {
  var item = _ref2.item,
      underscoreSeparatedPropName = _ref2.underscoreSeparatedPropName;
  return item[underscoreSeparatedPropName] === NULL_TAG ? null : item[underscoreSeparatedPropName];
}

function checkRelationalItems(_ref3) {
  var relationalItems = _ref3.relationalItems,
      operator = _ref3.operator,
      filterValue = _ref3.filterValue,
      underscoreSeparatedPropName = _ref3.underscoreSeparatedPropName;
  return relationalItems.some(function (relationalItem) {
    var relationalItemValue = convertNullStringValuesToNull({
      item: relationalItem,
      underscoreSeparatedPropName: underscoreSeparatedPropName
    });
    return checkFilter({
      operator: operator,
      filterValue: filterValue,
      itemValue: relationalItemValue
    });
  });
}

function applyClientSideFilterToData(_ref4) {
  var queryRecordEntry = _ref4.queryRecordEntry,
      data = _ref4.data,
      alias = _ref4.alias;
  var filterObject = getFlattenedNodeFilterObject({
    queryRecordEntry: queryRecordEntry
  });

  if (filterObject && data[alias]) {
    var filterProperties = Object.keys(filterObject).map(function (dotSeparatedPropName) {
      var _String$split = String(dotSeparatedPropName).split('.'),
          possibleRelationalKey = _String$split[0],
          relationalProperties = _String$split.slice(1);

      var relational = possibleRelationalKey && queryRecordEntry.relational && queryRecordEntry.relational[possibleRelationalKey];
      var propertyFilter = filterObject[dotSeparatedPropName];
      var operators = Object.keys(propertyFilter).filter(function (x) {
        return x !== 'condition';
      }).map(function (operator) {
        return {
          operator: operator,
          value: propertyFilter[operator]
        };
      });
      var isRelationalProperty = !!relational;
      var underscoreSeparatedPropName = isRelationalProperty ? relationalProperties.join(OBJECT_PROPERTY_SEPARATOR) : dotSeparatedPropName.replaceAll('.', OBJECT_PROPERTY_SEPARATOR);
      var propNotInQuery = isRelationalProperty ? relational.properties.includes(underscoreSeparatedPropName) === false : queryRecordEntry.properties.includes(underscoreSeparatedPropName) === false;
      return {
        dotSeparatedPropName: dotSeparatedPropName,
        underscoreSeparatedPropName: underscoreSeparatedPropName,
        propNotInQuery: propNotInQuery,
        operators: operators,
        condition: propertyFilter.condition,
        isRelational: isRelationalProperty,
        relationalKey: possibleRelationalKey,
        oneToOne: relational && 'oneToOne' in relational || undefined,
        oneToMany: relational && 'oneToMany' in relational || undefined
      };
    });

    if (filterProperties.length > 0) {
      lodash.update(data, alias + "." + NODES_PROPERTY_KEY, function (items) {
        if (!lodash.isArray(items)) {
          return items;
        }

        return items.filter(function (item) {
          var propertyNotInQuery = filterProperties.find(function (x) {
            return x.propNotInQuery;
          });

          if (!!propertyNotInQuery) {
            throw new FilterPropertyNotDefinedInQueryException({
              filterPropName: propertyNotInQuery.dotSeparatedPropName
            });
          }

          var orConditions = filterProperties.filter(function (x) {
            return x.condition === 'or';
          });
          var andConditions = filterProperties.filter(function (x) {
            return x.condition === 'and';
          });
          var hasPassedEveryANDConditions = andConditions.every(function (filter) {
            if (filter.isRelational) {
              return filter.operators.every(function (_ref5) {
                var operator = _ref5.operator,
                    value = _ref5.value;

                if (filter.oneToOne === true) {
                  var itemValue = filter.relationalKey ? convertNullStringValuesToNull({
                    item: item[filter.relationalKey],
                    underscoreSeparatedPropName: filter.underscoreSeparatedPropName
                  }) : '';
                  return checkFilter({
                    operator: operator,
                    filterValue: value,
                    itemValue: itemValue
                  });
                } else {
                  var relationalItems = filter.relationalKey ? item[filter.relationalKey][NODES_PROPERTY_KEY] || [] : [];
                  return checkRelationalItems({
                    relationalItems: relationalItems,
                    operator: operator,
                    filterValue: value,
                    underscoreSeparatedPropName: filter.underscoreSeparatedPropName
                  });
                }
              });
            } else {
              var itemValue = item[filter.underscoreSeparatedPropName] === NULL_TAG ? null : item[filter.underscoreSeparatedPropName];
              return filter.operators.every(function (_ref6) {
                var operator = _ref6.operator,
                    value = _ref6.value;
                return checkFilter({
                  operator: operator,
                  filterValue: value,
                  itemValue: itemValue
                });
              });
            }
          }) || andConditions.length === 0;

          if (!hasPassedEveryANDConditions) {
            return false;
          }

          var hasPassedSomeORConditions = orConditions.some(function (filter) {
            if (filter.isRelational) {
              return filter.operators.some(function (_ref7) {
                var operator = _ref7.operator,
                    value = _ref7.value;

                if (filter.oneToOne === true) {
                  var itemValue = filter.relationalKey ? convertNullStringValuesToNull({
                    item: item[filter.relationalKey],
                    underscoreSeparatedPropName: filter.underscoreSeparatedPropName
                  }) : '';
                  return checkFilter({
                    operator: operator,
                    filterValue: value,
                    itemValue: itemValue
                  });
                } else {
                  var relationalItems = filter.relationalKey ? item[filter.relationalKey][NODES_PROPERTY_KEY] || [] : [];
                  return checkRelationalItems({
                    relationalItems: relationalItems,
                    operator: operator,
                    filterValue: value,
                    underscoreSeparatedPropName: filter.underscoreSeparatedPropName
                  });
                }
              });
            } else {
              var itemValue = filter.relationalKey ? convertNullStringValuesToNull({
                item: item,
                underscoreSeparatedPropName: filter.underscoreSeparatedPropName
              }) : '';
              return filter.operators.some(function (_ref8) {
                var operator = _ref8.operator,
                    value = _ref8.value;
                return checkFilter({
                  operator: operator,
                  filterValue: value,
                  itemValue: itemValue
                });
              });
            }
          }) || orConditions.length === 0;
          return hasPassedEveryANDConditions && hasPassedSomeORConditions;
        });
      });
    }
  }
}

function getSortPosition(first, second, ascending) {
  // equal items sort equally
  if (first === second) {
    return 0;
  } // nulls sort after anything else


  if (first === null) {
    return 1;
  }

  if (second === null) {
    return -1;
  } // otherwise, if we're ascending, lowest sorts first


  if (ascending) {
    return first < second ? -1 : 1;
  } // if descending, highest sorts first


  return first < second ? 1 : -1;
}

function getNodeSortPropertyValue(opts) {
  return opts.isRelational && opts.relationalKey ? opts.oneToMany ? (opts.node[opts.relationalKey][NODES_PROPERTY_KEY] || []).sort(function (a, b) {
    return getSortPosition(getItemSortValue(a, opts.underscoreSeparatedPropName), getItemSortValue(b, opts.underscoreSeparatedPropName), opts.direction === 'asc');
  }).map(function (x) {
    return x[opts.underscoreSeparatedPropName];
  }).join('') : getItemSortValue(opts.node[opts.relationalKey], opts.underscoreSeparatedPropName) : getItemSortValue(opts.node, opts.underscoreSeparatedPropName);
}

function getItemSortValue(item, underscoreSeparatedPropertyPath) {
  var isValueNull = item[underscoreSeparatedPropertyPath] === null || item[underscoreSeparatedPropertyPath] === NULL_TAG;
  if (isValueNull) return null;
  return Number(item[underscoreSeparatedPropertyPath]) || item[underscoreSeparatedPropertyPath];
}

function applyClientSideSortToData(_ref9) {
  var queryRecordEntry = _ref9.queryRecordEntry,
      data = _ref9.data,
      alias = _ref9.alias,
      queryRecordEntrySort = _ref9.sort;
  var sortObject = getFlattenedNodeSortObject(queryRecordEntrySort);

  if (sortObject && data[alias]) {
    var sorting = lodash.orderBy(Object.keys(sortObject).map(function (dotSeparatedPropName, index) {
      var _String$split2 = String(dotSeparatedPropName).split('.'),
          possibleRelationalKey = _String$split2[0],
          relationalProperties = _String$split2.slice(1);

      var relational = possibleRelationalKey && queryRecordEntry.relational && queryRecordEntry.relational[possibleRelationalKey];
      var isRelational = !!relational;
      var underscoreSeparatedPropName = isRelational ? relationalProperties.join(OBJECT_PROPERTY_SEPARATOR) : dotSeparatedPropName.replaceAll('.', OBJECT_PROPERTY_SEPARATOR);
      var propNotInQuery = isRelational ? relational.properties.includes(underscoreSeparatedPropName) === false : queryRecordEntry.properties.includes(underscoreSeparatedPropName) === false;
      return {
        dotSeparatedPropName: dotSeparatedPropName,
        underscoreSeparatedPropName: underscoreSeparatedPropName,
        propNotInQuery: propNotInQuery,
        isRelational: isRelational,
        relationalKey: possibleRelationalKey,
        oneToOne: relational && 'oneToOne' in relational || undefined,
        oneToMany: relational && 'oneToMany' in relational || undefined,
        priority: sortObject[dotSeparatedPropName].priority || (index + 1) * 10000,
        direction: sortObject[dotSeparatedPropName].direction || 'asc'
      };
    }), function (x) {
      return x.priority;
    }, 'asc');
    var sortPropertiesNotDefinedInQuery = sorting.filter(function (i) {
      return i.propNotInQuery;
    });

    if (sortPropertiesNotDefinedInQuery.length > 0) {
      throw new SortPropertyNotDefinedInQueryException({
        sortPropName: sortPropertiesNotDefinedInQuery[0].dotSeparatedPropName
      });
    }

    lodash.update(data, alias + "." + NODES_PROPERTY_KEY, function (items) {
      if (!lodash.isArray(items)) {
        return items;
      }

      return items.sort(function (first, second) {
        return sorting.map(function (sort) {
          return getSortPosition(getNodeSortPropertyValue({
            node: first,
            direction: sort.direction,
            isRelational: sort.isRelational,
            oneToMany: sort.oneToMany,
            underscoreSeparatedPropName: sort.underscoreSeparatedPropName,
            relationalKey: sort.relationalKey
          }), getNodeSortPropertyValue({
            node: second,
            direction: sort.direction,
            isRelational: sort.isRelational,
            oneToMany: sort.oneToMany,
            underscoreSeparatedPropName: sort.underscoreSeparatedPropName,
            relationalKey: sort.relationalKey
          }), sort.direction === 'asc');
        }).reduce(function (acc, current) {
          return acc || current;
        }, undefined);
      });
    });
  }
}
function applyClientSideSortAndFilterToData(queryRecord, data) {
  Object.keys(queryRecord).forEach(function (alias) {
    var queryRecordEntry = queryRecord[alias];

    if (queryRecordEntry.filter) {
      applyClientSideFilterToData({
        queryRecordEntry: queryRecordEntry,
        data: data,
        alias: alias
      });
    }

    if (queryRecordEntry.sort) {
      applyClientSideSortToData({
        queryRecordEntry: queryRecordEntry,
        sort: queryRecordEntry.sort,
        data: data,
        alias: alias
      });
    }

    var relational = queryRecordEntry.relational;

    if (relational != null) {
      var containsArrayData = queryRecordEntryReturnsArrayOfData({
        queryRecordEntry: queryRecordEntry
      });

      if (containsArrayData) {
        if (data[alias] && data[alias][NODES_PROPERTY_KEY]) {
          data[alias][NODES_PROPERTY_KEY].forEach(function (item) {
            applyClientSideSortAndFilterToData(relational, item);
          });
        }
      } else {
        applyClientSideSortAndFilterToData(relational, data[alias]);
      }
    }
  });
}

var queryIdx = 0;
/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */

function generateQuerier(_ref) {
  var mmGQLInstance = _ref.mmGQLInstance,
      queryManager = _ref.queryManager;
  return /*#__PURE__*/function () {
    var _query = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(queryDefinitions, opts) {
      var startStack, queryId, getError, nonNullishQueryDefinitions, nullishResults, results, dataToReturn, queryDefinitionsSplitByToken, _convertQueryDefiniti, queryRecord, queryGQL, resultsForEachTokenUsed, allResults, qM, error, _error;

      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              getError = function _getError(error, stack) {
                // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
                error.stack = "\n" + (stack || error.stack) + '\n' + startStack.substring(startStack.indexOf('\n') + 1);
                return error;
              };

              startStack = new Error().stack;
              queryId = (opts == null ? void 0 : opts.queryId) || "query" + queryIdx++;
              nonNullishQueryDefinitions = removeNullishQueryDefinitions(queryDefinitions);
              nullishResults = getNullishResults(queryDefinitions);
              _context.prev = 5;

              if (Object.keys(nonNullishQueryDefinitions).length) {
                _context.next = 10;
                break;
              }

              results = _extends({}, nullishResults);
              (opts == null ? void 0 : opts.onData) && opts.onData({
                results: results
              });
              return _context.abrupt("return", {
                data: results,
                error: undefined
              });

            case 10:
              dataToReturn = _extends({}, nullishResults);
              queryDefinitionsSplitByToken = splitQueryDefinitionsByToken(nonNullishQueryDefinitions);
              _convertQueryDefiniti = convertQueryDefinitionToQueryInfo({
                queryDefinitions: queryDefinitions,
                queryId: queryId,
                useServerSidePaginationFilteringSorting: mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
              }), queryRecord = _convertQueryDefiniti.queryRecord, queryGQL = _convertQueryDefiniti.queryGQL;
              _context.next = 15;
              return Promise.all(Object.entries(queryDefinitionsSplitByToken).map(function (_ref2) {
                var tokenName = _ref2[0],
                    queryDefinitionsForThisToken = _ref2[1];
                return performQueries({
                  mmGQLInstance: mmGQLInstance,
                  queryGQL: queryGQL,
                  queryRecord: Object.entries(queryRecord).reduce(function (acc, _ref3) {
                    var alias = _ref3[0],
                        queryRecordEntry = _ref3[1];

                    if (queryDefinitionsForThisToken[alias]) {
                      acc[alias] = queryRecordEntry;
                    }

                    return acc;
                  }, {}),
                  tokenName: tokenName,
                  queryId: queryId,
                  batchKey: opts == null ? void 0 : opts.batchKey
                });
              }));

            case 15:
              resultsForEachTokenUsed = _context.sent;
              allResults = resultsForEachTokenUsed.reduce(function (acc, resultsForToken) {
                return _extends({}, acc, resultsForToken);
              }, {});
              qM = queryManager || new mmGQLInstance.QueryManager(queryRecord, {
                performQuery: function performQuery(_ref4) {
                  var queryRecord = _ref4.queryRecord,
                      queryGQL = _ref4.queryGQL,
                      tokenName = _ref4.tokenName;
                  return performQueries({
                    mmGQLInstance: mmGQLInstance,
                    queryRecord: queryRecord,
                    queryId: queryId,
                    tokenName: tokenName,
                    queryGQL: queryGQL,
                    batchKey: opts == null ? void 0 : opts.batchKey,
                    getMockDataDelay: mmGQLInstance.getMockDataDelay
                  });
                },
                resultsObject: dataToReturn,
                onResultsUpdated: function onResultsUpdated() {
                  (opts == null ? void 0 : opts.onData) && opts.onData({
                    results: dataToReturn
                  });
                },
                queryId: queryId,
                useServerSidePaginationFilteringSorting: mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
              });
              _context.prev = 18;
              qM.onQueryResult({
                queryId: queryId,
                queryResult: allResults
              });
              (opts == null ? void 0 : opts.onData) && opts.onData({
                results: dataToReturn
              });
              _context.next = 32;
              break;

            case 23:
              _context.prev = 23;
              _context.t0 = _context["catch"](18);
              error = getError(new Error("Error applying query results"), _context.t0.stack);

              if (!(opts != null && opts.onError)) {
                _context.next = 31;
                break;
              }

              opts.onError(error);
              return _context.abrupt("return", {
                data: dataToReturn,
                error: error
              });

            case 31:
              throw error;

            case 32:
              return _context.abrupt("return", {
                data: dataToReturn,
                error: undefined
              });

            case 35:
              _context.prev = 35;
              _context.t1 = _context["catch"](5);
              _error = getError(new Error("Error querying data"), _context.t1.stack);

              if (!(opts != null && opts.onError)) {
                _context.next = 43;
                break;
              }

              opts.onError(_error);
              return _context.abrupt("return", {
                data: {},
                error: _error
              });

            case 43:
              throw _error;

            case 44:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[5, 35], [18, 23]]);
    }));

    function query(_x, _x2) {
      return _query.apply(this, arguments);
    }

    return query;
  }();
}
var subscriptionId = 0;
function generateSubscriber(mmGQLInstance) {
  return /*#__PURE__*/function () {
    var _subscribe = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(queryDefinitions, opts) {
      var startStack, queryId, nonNullishQueryDefinitions, nullishResults, dataToReturn, _convertQueryDefiniti2, queryGQL, queryRecord, queryParamsString, getError, queryManager, updateQueryManagerWithSubscriptionMessage, getToken, subscriptionCancellers, mustAwaitQuery, messageQueue, queryDefinitionsSplitByToken, queryDefinitionsSplitByTokenEntries, initSubs, unsub, error, query, params, _error2;

      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              unsub = function _unsub() {
                subscriptionCancellers.forEach(function (cancel) {
                  return cancel();
                });
                queryDefinitionsSplitByTokenEntries.forEach(function (_ref7) {
                  var tokenName = _ref7[0],
                      queryDefinitions = _ref7[1];

                  var _convertQueryDefiniti4 = convertQueryDefinitionToQueryInfo({
                    queryDefinitions: queryDefinitions,
                    queryId: queryId + '_' + tokenName,
                    useServerSidePaginationFilteringSorting: mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
                  }),
                      queryRecord = _convertQueryDefiniti4.queryRecord;

                  mmGQLInstance.QuerySlimmer.onSubscriptionCancelled(queryRecord);
                });
              };

              initSubs = function _initSubs() {
                queryDefinitionsSplitByTokenEntries.forEach(function (_ref6) {
                  var tokenName = _ref6[0],
                      queryDefinitions = _ref6[1];

                  var _convertQueryDefiniti3 = convertQueryDefinitionToQueryInfo({
                    queryDefinitions: queryDefinitions,
                    queryId: queryId + '_' + tokenName,
                    useServerSidePaginationFilteringSorting: mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
                  }),
                      subscriptionConfigs = _convertQueryDefiniti3.subscriptionConfigs;

                  subscriptionCancellers.push.apply(subscriptionCancellers, subscriptionConfigs.map(function (subscriptionConfig) {
                    return mmGQLInstance.gqlClient.subscribe({
                      gql: subscriptionConfig.gql,
                      token: getToken(tokenName),
                      onMessage: function onMessage(message) {
                        if (mustAwaitQuery) {
                          messageQueue.push({
                            message: message,
                            subscriptionConfig: subscriptionConfig
                          });
                          return;
                        }

                        updateQueryManagerWithSubscriptionMessage({
                          message: message,
                          subscriptionConfig: subscriptionConfig
                        });
                      },
                      onError: function onError(e) {
                        // Can never throw here. The dev consuming this would have no way of catching it
                        // To catch an error in a subscription they must provide onError
                        var error = getError(new Error("Error in a subscription message"), e.stack);

                        if (opts.onError) {
                          opts.onError(error);
                        } else {
                          console.error(error);
                        }
                      }
                    });
                  }));
                });
              };

              getToken = function _getToken(tokenName) {
                var token = mmGQLInstance.getToken({
                  tokenName: tokenName
                });

                if (!token) {
                  throw new Error("No token registered with the name \"" + tokenName + "\".\n" + 'Please register this token prior to using it with setToken({ tokenName, token })) ');
                }

                return token;
              };

              updateQueryManagerWithSubscriptionMessage = function _updateQueryManagerWi(data) {
                var node;
                var operation;

                try {
                  node = data.subscriptionConfig.extractNodeFromSubscriptionMessage(data.message);
                  operation = data.subscriptionConfig.extractOperationFromSubscriptionMessage(data.message); // TODO: https://tractiontools.atlassian.net/browse/TTD-377

                  queryManager.onSubscriptionMessage({
                    node: node,
                    operation: operation,
                    queryId: queryId,
                    subscriptionAlias: data.subscriptionConfig.alias
                  });
                } catch (e) {
                  var error = getError(new Error("Error applying subscription message"), e.stack);

                  if (opts.onError) {
                    opts.onError(error);
                  } else {
                    console.error(error);
                  }
                }
              };

              getError = function _getError2(error, stack) {
                // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
                error.stack = '\n' + (stack || error.stack) + '\n' + startStack.substring(startStack.indexOf('\n') + 1);
                return error;
              };

              // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
              startStack = new Error().stack;
              queryId = (opts == null ? void 0 : opts.queryId) || "query" + subscriptionId++;
              nonNullishQueryDefinitions = removeNullishQueryDefinitions(queryDefinitions);
              nullishResults = getNullishResults(queryDefinitions);
              dataToReturn = _extends({}, nullishResults);

              if (Object.keys(nonNullishQueryDefinitions).length) {
                _context2.next = 13;
                break;
              }

              opts.onData({
                results: dataToReturn
              });
              return _context2.abrupt("return", {
                data: dataToReturn,
                unsub: function unsub() {}
              });

            case 13:
              _convertQueryDefiniti2 = convertQueryDefinitionToQueryInfo({
                queryDefinitions: nonNullishQueryDefinitions,
                queryId: queryId,
                useServerSidePaginationFilteringSorting: mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
              }), queryGQL = _convertQueryDefiniti2.queryGQL, queryRecord = _convertQueryDefiniti2.queryRecord, queryParamsString = _convertQueryDefiniti2.queryParamsString;
              opts.onQueryInfoConstructed && opts.onQueryInfoConstructed({
                queryGQL: queryGQL,
                queryId: queryId,
                queryParamsString: queryParamsString
              });
              // need to pass the info page from the results from this specific root/relational alias
              // to the query builder, such that it applies the correct pagination param on that root/relational alias
              // q: should the query manager perform the query? This would avoid having to pass data around in callbacks
              //    instead the query manager would build the minimal queryRecord needed to
              //    perform the new query for the next set of results and would append them to the results object?
              //    Another option would be for the query manager to expect a callback function (as it does now)
              //    which is called with a query record for that minimal query, and this fn needs to perform the query
              //    and return the result of that query.
              // Requirements
              //    - loadMoreResults should append the new list of results to the previous list
              //    - ensure that the correct token is used in the query for the next set of results
              //       if a "query" fn is passed to the queryManager
              queryManager = new mmGQLInstance.QueryManager(queryRecord, {
                resultsObject: dataToReturn,
                performQuery: function performQuery(_ref5) {
                  var queryRecord = _ref5.queryRecord,
                      queryGQL = _ref5.queryGQL,
                      tokenName = _ref5.tokenName;
                  return performQueries({
                    mmGQLInstance: mmGQLInstance,
                    queryRecord: queryRecord,
                    queryId: queryId,
                    tokenName: tokenName,
                    queryGQL: queryGQL,
                    batchKey: opts == null ? void 0 : opts.batchKey
                  });
                },
                onResultsUpdated: function onResultsUpdated() {
                  opts.onData({
                    results: dataToReturn
                  });
                },
                queryId: queryId,
                useServerSidePaginationFilteringSorting: mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
              });
              subscriptionCancellers = []; // Subscriptions are initialized immediately, rather than after the query resolves, to prevent an edge case where an update to a node happens
              // while the data for that node is being transfered from the backend to the client. This would result in a missed update.
              // However, we must be careful to not call opts.onData with any subscription messages before the query resolves,
              // because a subscription message only includes info about the node that changed, not all data being subscribed to,
              // which means the consumer of this API would receive and incomplete data set in this edge case.
              // This flag prevents that, by short-circuiting opts.onData in subscription messages, if the query has not resolved

              mustAwaitQuery = !opts.skipInitialQuery;
              messageQueue = [];
              queryDefinitionsSplitByToken = splitQueryDefinitionsByToken(nonNullishQueryDefinitions);
              queryDefinitionsSplitByTokenEntries = Object.entries(queryDefinitionsSplitByToken);
              _context2.prev = 21;

              if (!mmGQLInstance.generateMockData) {
                initSubs();
              }

              opts.onSubscriptionInitialized && opts.onSubscriptionInitialized(unsub);
              _context2.next = 35;
              break;

            case 26:
              _context2.prev = 26;
              _context2.t0 = _context2["catch"](21);
              error = getError(new Error("Error initializating subscriptions"), _context2.t0.stack);

              if (!(opts != null && opts.onError)) {
                _context2.next = 34;
                break;
              }

              opts.onError(error);
              return _context2.abrupt("return", {
                data: dataToReturn,
                unsub: unsub,
                error: error
              });

            case 34:
              throw error;

            case 35:
              if (!opts.skipInitialQuery) {
                _context2.next = 39;
                break;
              }

              return _context2.abrupt("return", {
                unsub: unsub
              });

            case 39:
              query = generateQuerier({
                mmGQLInstance: mmGQLInstance,
                queryManager: queryManager
              });
              _context2.prev = 40;
              params = [queryDefinitions, {
                queryId: opts.queryId,
                batchKey: opts.batchKey
              }]; // this query method will post its results to the queryManager declared above

              _context2.next = 44;
              return query.apply(void 0, params);

            case 44:
              _context2.next = 55;
              break;

            case 46:
              _context2.prev = 46;
              _context2.t1 = _context2["catch"](40);
              _error2 = getError(new Error("Error querying initial data set"), _context2.t1.stack);

              if (!(opts != null && opts.onError)) {
                _context2.next = 54;
                break;
              }

              opts.onError(_error2);
              return _context2.abrupt("return", {
                data: dataToReturn,
                unsub: unsub,
                error: _error2
              });

            case 54:
              throw _error2;

            case 55:
              if (mustAwaitQuery) {
                mustAwaitQuery = false;
                messageQueue.forEach(updateQueryManagerWithSubscriptionMessage);
                messageQueue.length = 0;
              }

              opts.onData({
                results: dataToReturn
              });
              return _context2.abrupt("return", {
                data: dataToReturn,
                unsub: unsub,
                error: undefined
              });

            case 58:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[21, 26], [40, 46]]);
    }));

    function subscribe(_x3, _x4) {
      return _subscribe.apply(this, arguments);
    }

    return subscribe;
  }();
}

function splitQueryDefinitionsByToken(queryDefinitions) {
  return Object.entries(queryDefinitions).reduce(function (split, _ref8) {
    var alias = _ref8[0],
        queryDefinition = _ref8[1];
    var tokenName = queryDefinition && 'tokenName' in queryDefinition && queryDefinition.tokenName != null ? queryDefinition.tokenName : DEFAULT_TOKEN_NAME;
    split[tokenName] = split[tokenName] || {};
    split[tokenName][alias] = queryDefinition;
    return split;
  }, {});
}

function removeNullishQueryDefinitions(queryDefinitions) {
  return Object.entries(queryDefinitions).reduce(function (acc, _ref9) {
    var alias = _ref9[0],
        queryDefinition = _ref9[1];
    if (!queryDefinition) return acc;
    acc[alias] = queryDefinition;
    return acc;
  }, {});
}

function getNullishResults(queryDefinitions) {
  return Object.entries(queryDefinitions).reduce(function (acc, _ref10) {
    var key = _ref10[0],
        queryDefinition = _ref10[1];
    if (queryDefinition == null) acc[key] = null;
    return acc;
  }, {});
}

function performQueries(_x5) {
  return _performQueries.apply(this, arguments);
}

function _performQueries() {
  _performQueries = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(opts) {
    var getToken, response, _opts$mmGQLInstance$g, params, filteredAndSortedResponse;

    return runtime_1.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            getToken = function _getToken2(tokenName) {
              var token = opts.mmGQLInstance.getToken({
                tokenName: tokenName
              });

              if (!token) {
                throw new Error("No token registered with the name \"" + tokenName + "\".\n" + 'Please register this token prior to using it with setToken({ tokenName, token })) ');
              }

              return token;
            };

            if (!opts.mmGQLInstance.generateMockData) {
              _context3.next = 5;
              break;
            }

            response = generateMockNodeDataForQueryRecord({
              queryRecord: opts.queryRecord
            });
            _context3.next = 15;
            break;

          case 5:
            if (!opts.mmGQLInstance.enableQuerySlimming) {
              _context3.next = 11;
              break;
            }

            _context3.next = 8;
            return opts.mmGQLInstance.QuerySlimmer.query({
              queryId: opts.queryId,
              queryRecord: opts.queryRecord,
              useServerSidePaginationFilteringSorting: opts.mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER,
              tokenName: opts.tokenName || DEFAULT_TOKEN_NAME,
              batchKey: opts.batchKey
            });

          case 8:
            response = _context3.sent;
            _context3.next = 15;
            break;

          case 11:
            params = [{
              gql: opts.queryGQL,
              token: getToken(opts.tokenName || DEFAULT_TOKEN_NAME),
              batchKey: opts.batchKey
            }];
            _context3.next = 14;
            return (_opts$mmGQLInstance$g = opts.mmGQLInstance.gqlClient).query.apply(_opts$mmGQLInstance$g, params);

          case 14:
            response = _context3.sent;

          case 15:
            if (!(opts.mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.CLIENT)) {
              _context3.next = 19;
              break;
            }

            // clone the object only if we are running the unit test
            // to simulate that we are receiving new response
            // to prevent mutating the object multiple times when filtering or sorting
            // resulting into incorrect results in our specs
            filteredAndSortedResponse =  response;
            applyClientSideSortAndFilterToData(opts.queryRecord, filteredAndSortedResponse);
            return _context3.abrupt("return", filteredAndSortedResponse);

          case 19:
            _context3.next = 21;
            return new Promise(function (res) {
              return setTimeout(res, (opts.getMockDataDelay == null ? void 0 : opts.getMockDataDelay()) || 0);
            });

          case 21:
            return _context3.abrupt("return", response);

          case 22:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _performQueries.apply(this, arguments);
}

(function (ENodeCollectionLoadingState) {
  ENodeCollectionLoadingState["IDLE"] = "IDLE";
  ENodeCollectionLoadingState["LOADING"] = "LOADING";
  ENodeCollectionLoadingState["ERROR"] = "ERROR";
})(exports.ENodeCollectionLoadingState || (exports.ENodeCollectionLoadingState = {}));

var NodesCollection = /*#__PURE__*/function () {
  // when "loadMore" is used, we display more than 1 page
  // however, nothing in our code needs to know about this other than the "nodes"
  // getter below, which must return multiple pages of results when loadMore is executed
  function NodesCollection(opts) {
    this.onLoadMoreResults = void 0;
    this.onGoToNextPage = void 0;
    this.onGoToPreviousPage = void 0;
    this.onPaginationRequestStateChanged = void 0;
    this.items = void 0;
    this.pageInfoFromResults = void 0;
    this.clientSidePageInfo = void 0;
    this.useServerSidePaginationFilteringSorting = void 0;
    this.pagesBeingDisplayed = void 0;
    this.loadingState = exports.ENodeCollectionLoadingState.IDLE;
    this.loadingError = null;
    this.items = opts.items;
    this.pageInfoFromResults = opts.pageInfoFromResults;
    this.clientSidePageInfo = opts.clientSidePageInfo;
    this.useServerSidePaginationFilteringSorting = opts.useServerSidePaginationFilteringSorting;
    this.pagesBeingDisplayed = [opts.clientSidePageInfo.lastQueriedPage];
    this.onLoadMoreResults = opts.onLoadMoreResults;
    this.onGoToNextPage = opts.onGoToNextPage;
    this.onGoToPreviousPage = opts.onGoToPreviousPage;
    this.onPaginationRequestStateChanged = opts.onPaginationRequestStateChanged;
  }

  var _proto = NodesCollection.prototype;

  _proto.loadMore = /*#__PURE__*/function () {
    var _loadMore = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (this.hasNextPage) {
                _context.next = 2;
                break;
              }

              throw new NodesCollectionPageOutOfBoundsException('No more results available - check results.hasNextPage before calling loadMore');

            case 2:
              this.clientSidePageInfo.lastQueriedPage++;
              this.pagesBeingDisplayed = [].concat(this.pagesBeingDisplayed, [this.clientSidePageInfo.lastQueriedPage]);
              _context.next = 6;
              return this.withPaginationEventLoadingState(this.onLoadMoreResults);

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function loadMore() {
      return _loadMore.apply(this, arguments);
    }

    return loadMore;
  }();

  _proto.goToNextPage = /*#__PURE__*/function () {
    var _goToNextPage = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2() {
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (this.hasNextPage) {
                _context2.next = 2;
                break;
              }

              throw new NodesCollectionPageOutOfBoundsException('No next page available - check results.hasNextPage before calling goToNextPage');

            case 2:
              this.clientSidePageInfo.lastQueriedPage++;
              this.pagesBeingDisplayed = [this.clientSidePageInfo.lastQueriedPage];
              _context2.next = 6;
              return this.withPaginationEventLoadingState(this.onGoToNextPage);

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function goToNextPage() {
      return _goToNextPage.apply(this, arguments);
    }

    return goToNextPage;
  }();

  _proto.goToPreviousPage = /*#__PURE__*/function () {
    var _goToPreviousPage = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3() {
      return runtime_1.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (this.hasPreviousPage) {
                _context3.next = 2;
                break;
              }

              throw new NodesCollectionPageOutOfBoundsException('No previous page available - check results.hasPreviousPage before calling goToPreviousPage');

            case 2:
              this.clientSidePageInfo.lastQueriedPage--;
              this.pagesBeingDisplayed = [this.clientSidePageInfo.lastQueriedPage];
              _context3.next = 6;
              return this.withPaginationEventLoadingState(this.onGoToPreviousPage);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function goToPreviousPage() {
      return _goToPreviousPage.apply(this, arguments);
    }

    return goToPreviousPage;
  }();

  _proto.withPaginationEventLoadingState = /*#__PURE__*/function () {
    var _withPaginationEventLoadingState = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee4(promiseGetter) {
      return runtime_1.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              this.loadingState = exports.ENodeCollectionLoadingState.LOADING;
              this.loadingError = null;
              _context4.prev = 2;
              // re-render ui with the new loading state
              this.onPaginationRequestStateChanged();
              _context4.next = 6;
              return promiseGetter();

            case 6:
              this.loadingState = exports.ENodeCollectionLoadingState.IDLE;
              _context4.next = 13;
              break;

            case 9:
              _context4.prev = 9;
              _context4.t0 = _context4["catch"](2);
              this.loadingState = exports.ENodeCollectionLoadingState.ERROR;
              this.loadingError = _context4.t0;

            case 13:
              if (!this.useServerSidePaginationFilteringSorting) {
                this.setNewClientSidePageInfoAfterClientSidePaginationRequest();
              } // re-render the ui with the new nodes and loading/error state


              this.onPaginationRequestStateChanged();

            case 15:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this, [[2, 9]]);
    }));

    function withPaginationEventLoadingState(_x) {
      return _withPaginationEventLoadingState.apply(this, arguments);
    }

    return withPaginationEventLoadingState;
  }();

  _proto.goToPage = /*#__PURE__*/function () {
    var _goToPage = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee5(_) {
      return runtime_1.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              throw new Error('Not implemented');

            case 1:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));

    function goToPage(_x2) {
      return _goToPage.apply(this, arguments);
    }

    return goToPage;
  }() // as the name implies, only runs when client side pagination is executed
  // otherwise the onLoadMoreResults, onGoToNextPage, onGoToPreviousPage are expected to return the new page info
  // this is because when doing client side pagination, all the items in this collection are expected to already
  // be cached in this class' state
  ;

  _proto.setNewClientSidePageInfoAfterClientSidePaginationRequest = function setNewClientSidePageInfoAfterClientSidePaginationRequest() {
    this.pageInfoFromResults = {
      totalPages: this.pageInfoFromResults.totalPages,
      hasNextPage: this.pageInfoFromResults.totalPages > this.clientSidePageInfo.lastQueriedPage,
      hasPreviousPage: this.clientSidePageInfo.lastQueriedPage > 1,
      endCursor: this.pageInfoFromResults.endCursor,
      startCursor: this.pageInfoFromResults.startCursor
    };
  };

  _createClass(NodesCollection, [{
    key: "nodes",
    get: function get() {
      if (this.useServerSidePaginationFilteringSorting) return this.items; // this is because when doing client side pagination, all the items in this collection are expected to already
      // be cached in this class' state

      return getPageResults({
        items: this.items,
        pages: this.pagesBeingDisplayed,
        itemsPerPage: this.clientSidePageInfo.pageSize
      });
    }
  }, {
    key: "hasNextPage",
    get: function get() {
      return this.pageInfoFromResults.hasNextPage;
    }
  }, {
    key: "hasPreviousPage",
    get: function get() {
      return this.pageInfoFromResults.hasPreviousPage;
    }
  }, {
    key: "totalPages",
    get: function get() {
      return this.pageInfoFromResults.totalPages;
    }
  }, {
    key: "page",
    get: function get() {
      return this.clientSidePageInfo.lastQueriedPage;
    }
  }]);

  return NodesCollection;
}();

function getPageResults(opts) {
  var inChunks = chunkArray(opts.items, opts.itemsPerPage);
  return opts.pages.map(function (pageNumber) {
    return inChunks[pageNumber - 1];
  }).flat();
}

var chunkArray = function chunkArray(arr, size) {
  return arr.length > size ? [arr.slice(0, size)].concat(chunkArray(arr.slice(size), size)) : [arr];
};

var _templateObject, _templateObject2, _templateObject3;
function createQueryManager(mmGQLInstance) {
  /**
   * QueryManager is in charge of
   *
   *    1) receiving data from a query and notifying the appropriate DO repositories
   *    2) building proxies for those DOs
   *    3) keeping a cache of those generated proxies so that we can update proxies on subscription messages, rather than generating new ones
   *    4) handling incoming subscription messages and
   *       4.1) notifying DO repositories with the data in those sub messages
   *       4.2) build proxies for new DOs received + update relational data (recursively) for proxies that had been previously built
   *    5) building the resulting data that is returned by queriers from its cache of proxies
   */
  return /*#__PURE__*/function () {
    function QueryManager(queryRecord, opts) {
      this.state = {};
      this.queryRecord = void 0;
      this.opts = void 0;
      this.queryRecord = queryRecord;
      this.opts = opts;
    }

    var _proto = QueryManager.prototype;

    _proto.onQueryResult = function onQueryResult(opts) {
      this.notifyRepositories({
        data: opts.queryResult,
        queryRecord: this.queryRecord
      });
      this.state = this.getNewStateFromQueryResult(_extends({}, opts, {
        queryRecord: this.queryRecord
      }));
      extend({
        object: this.opts.resultsObject,
        extension: this.getResultsFromState({
          state: this.state,
          aliasPath: []
        }),
        extendNestedObjects: false,
        deleteKeysNotInExtension: false
      });
    };

    _proto.onSubscriptionMessage = function onSubscriptionMessage(opts) {
      var _data, _queryRecord;

      var node = opts.node,
          subscriptionAlias = opts.subscriptionAlias;
      var queryRecordEntryForThisSubscription = this.queryRecord[subscriptionAlias];
      this.notifyRepositories({
        data: (_data = {}, _data[subscriptionAlias] = node, _data),
        queryRecord: (_queryRecord = {}, _queryRecord[subscriptionAlias] = queryRecordEntryForThisSubscription, _queryRecord)
      });
      this.updateProxiesAndStateFromSubscriptionMessage(opts);
      Object.assign(this.opts.resultsObject, this.getResultsFromState({
        state: this.state,
        aliasPath: []
      }));
    }
    /**
     * Is used to build the root level results for the query, and also to build the relational results
     * used by each proxy, which is why "state" is a param here
     *
     * alias path is required such that when "loadMore" is executed on a node collection
     * this query manager can perform a new query with the minimal query record necessary
     * and extend the result set with the new results
     */
    ;

    _proto.getResultsFromState = function getResultsFromState(opts) {
      var _this = this;

      return Object.keys(opts.state).reduce(function (resultsAcc, queryAlias) {
        var stateForThisAlias = opts.state[queryAlias];
        var idsOrId = stateForThisAlias.idsOrIdInCurrentResult;
        var pageInfoFromResults = stateForThisAlias.pageInfoFromResults;
        var clientSidePageInfo = stateForThisAlias.clientSidePageInfo;

        var resultsAlias = _this.removeUnionSuffix(queryAlias);

        if (Array.isArray(idsOrId)) {
          if (!pageInfoFromResults) {
            throw Error("No page info for results found for the alias " + queryAlias);
          }

          if (!clientSidePageInfo) {
            throw Error("No client side page info found for the alias " + queryAlias);
          }

          var items = idsOrId.map(function (id) {
            return stateForThisAlias.proxyCache[id].proxy;
          });
          var aliasPath = [].concat(opts.aliasPath || [], [resultsAlias]);
          resultsAcc[resultsAlias] = new NodesCollection({
            items: items,
            clientSidePageInfo: clientSidePageInfo,
            pageInfoFromResults: pageInfoFromResults,
            // allows the UI to re-render when a nodeCollection's internal state is updated
            onPaginationRequestStateChanged: _this.opts.onResultsUpdated,
            onLoadMoreResults: function onLoadMoreResults() {
              return _this.onLoadMoreResults({
                aliasPath: aliasPath,
                previousEndCursor: pageInfoFromResults.endCursor
              });
            },
            onGoToNextPage: function onGoToNextPage() {
              return _this.onGoToNextPage({
                aliasPath: aliasPath,
                previousEndCursor: pageInfoFromResults.endCursor
              });
            },
            onGoToPreviousPage: function onGoToPreviousPage() {
              return _this.onGoToPreviousPage({
                aliasPath: aliasPath,
                previousStartCursor: pageInfoFromResults.startCursor
              });
            },
            useServerSidePaginationFilteringSorting: _this.opts.useServerSidePaginationFilteringSorting
          });
        } else if (idsOrId) {
          resultsAcc[resultsAlias] = stateForThisAlias.proxyCache[idsOrId].proxy;
        } else {
          resultsAcc[resultsAlias] = null;
        }

        return resultsAcc;
      }, {});
    }
    /**
     * Takes a queryRecord and the data that resulted from that query
     * notifies the appropriate repositories so that DOs can be constructed or updated
     */
    ;

    _proto.notifyRepositories = function notifyRepositories(opts) {
      var _this2 = this;

      Object.keys(opts.queryRecord).forEach(function (queryAlias) {
        var dataForThisAlias = _this2.getDataFromResponse({
          queryRecordEntry: opts.queryRecord[queryAlias],
          dataForThisAlias: opts.data[queryAlias]
        });

        if (!dataForThisAlias) {
          throw Error("notifyRepositories could not find resulting data for the alias \"" + queryAlias + "\" in the following queryRecord:\n" + JSON.stringify(opts.queryRecord, null, 2) + "\nResulting data:\n" + JSON.stringify(opts.data, null, 2));
        }

        var nodeRepository = opts.queryRecord[queryAlias].def.repository;

        if (Array.isArray(dataForThisAlias)) {
          dataForThisAlias.forEach(function (data) {
            return nodeRepository.onDataReceived(data);
          });
        } else {
          nodeRepository.onDataReceived(dataForThisAlias);
        }

        var relationalQueries = opts.queryRecord[queryAlias].relational;

        if (relationalQueries) {
          Object.keys(relationalQueries).forEach(function (relationalAlias) {
            var relationalDataForThisAlias = Array.isArray(dataForThisAlias) ? dataForThisAlias.flatMap(function (dataEntry) {
              return dataEntry[relationalAlias];
            }) : dataForThisAlias[relationalAlias]; // makes it easier to simply handle this as an array below

            if (!Array.isArray(relationalDataForThisAlias)) {
              relationalDataForThisAlias = [relationalDataForThisAlias];
            }

            relationalDataForThisAlias.forEach(function (relationalDataEntry) {
              var _data2, _queryRecord2;

              var relationalQuery = relationalQueries[relationalAlias];

              if (relationalAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
                var node = relationalDataEntry;
                if (node && node.type !== relationalQuery.def.type) return;
              }

              _this2.notifyRepositories({
                data: (_data2 = {}, _data2[relationalAlias] = relationalDataEntry, _data2),
                queryRecord: (_queryRecord2 = {}, _queryRecord2[relationalAlias] = relationalQuery, _queryRecord2)
              });
            });
          });
        }
      });
    }
    /**
     * Gets the initial state for this manager from the initial query results
     *   does not execute on subscription messages
     */
    ;

    _proto.getNewStateFromQueryResult = function getNewStateFromQueryResult(opts) {
      var _this3 = this;

      return Object.keys(opts.queryRecord).reduce(function (resultingStateAcc, queryAlias) {
        var cacheEntry = _this3.buildCacheEntry({
          nodeData: _this3.getDataFromResponse({
            dataForThisAlias: opts.queryResult[queryAlias],
            queryRecordEntry: opts.queryRecord[queryAlias]
          }),
          pageInfoFromResults: _this3.getPageInfoFromResponse({
            dataForThisAlias: opts.queryResult[queryAlias]
          }),
          clientSidePageInfo: _this3.getClientSidePageInfo({
            queryRecordEntry: opts.queryRecord[queryAlias]
          }),
          queryRecord: opts.queryRecord,
          queryAlias: queryAlias,
          aliasPath: [queryAlias]
        });

        if (!cacheEntry) return resultingStateAcc;
        resultingStateAcc[queryAlias] = cacheEntry;
        return resultingStateAcc;
      }, {});
    };

    _proto.buildCacheEntry = function buildCacheEntry(opts) {
      var _this4 = this;

      var nodeData = opts.nodeData,
          queryAlias = opts.queryAlias;
      var queryRecord = opts.queryRecord;
      var relational = queryRecord[opts.queryAlias].relational; // if the query alias includes a relational union query separator
      // and the first item in the array of results has a type that does not match the type of the node def in this query record
      // this means that the result node likely matches a different type in that union

      if (queryAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) {
        var node = opts.nodeData[0];
        if (node && node.type !== queryRecord[opts.queryAlias].def.type) return null;
      }

      var buildRelationalStateForNode = function buildRelationalStateForNode(node) {
        if (!relational) return null;
        return Object.keys(relational).reduce(function (relationalStateAcc, relationalAlias) {
          var _extends2;

          var relationalDataForThisAlias = _this4.getDataFromResponse({
            queryRecordEntry: relational[relationalAlias],
            dataForThisAlias: node[relationalAlias]
          });

          if (!relationalDataForThisAlias) return relationalStateAcc;

          var aliasPath = _this4.addIdToLastEntryInAliasPath({
            aliasPath: opts.aliasPath,
            id: node.id
          });

          var cacheEntry = _this4.buildCacheEntry({
            nodeData: relationalDataForThisAlias,
            pageInfoFromResults: _this4.getPageInfoFromResponse({
              dataForThisAlias: node[relationalAlias]
            }),
            clientSidePageInfo: _this4.getClientSidePageInfo({
              queryRecordEntry: relational[relationalAlias]
            }),
            queryAlias: relationalAlias,
            queryRecord: relational,
            aliasPath: [].concat(aliasPath, [relationalAlias])
          });

          if (!cacheEntry) return relationalStateAcc;
          return _extends({}, relationalStateAcc, (_extends2 = {}, _extends2[_this4.removeUnionSuffix(relationalAlias)] = cacheEntry, _extends2));
        }, {});
      };

      var buildProxyCacheEntryForNode = function buildProxyCacheEntryForNode(buildCacheEntryOpts) {
        var relationalState = buildRelationalStateForNode(buildCacheEntryOpts.node);
        var nodeRepository = queryRecord[queryAlias].def.repository;
        var relationalQueries = relational ? _this4.getApplicableRelationalQueries({
          relationalQueries: relational,
          nodeData: buildCacheEntryOpts.node
        }) : null;

        var aliasPath = _this4.addIdToLastEntryInAliasPath({
          aliasPath: opts.aliasPath,
          id: buildCacheEntryOpts.node.id
        });

        var proxy = mmGQLInstance.DOProxyGenerator({
          node: queryRecord[opts.queryAlias].def,
          allPropertiesQueried: queryRecord[opts.queryAlias].properties,
          relationalQueries: relationalQueries,
          queryId: _this4.opts.queryId,
          relationalResults: !relationalState ? null : _this4.getResultsFromState({
            state: relationalState,
            aliasPath: aliasPath
          }),
          "do": nodeRepository.byId(buildCacheEntryOpts.node.id)
        });
        return {
          proxy: proxy,
          relationalState: relationalState
        };
      };

      if (Array.isArray(opts.nodeData)) {
        if ('id' in queryRecord[opts.queryAlias]) {
          if (opts.nodeData[0] == null) {
            if (!queryRecord[opts.queryAlias].allowNullResult) throw new DataParsingException({
              receivedData: opts.nodeData,
              message: "Queried a node by id for the query with the id \"" + this.opts.queryId + "\" but received back an empty array"
            });
            return {
              idsOrIdInCurrentResult: null,
              proxyCache: {},
              pageInfoFromResults: opts.pageInfoFromResults,
              clientSidePageInfo: opts.clientSidePageInfo
            };
          }

          return {
            idsOrIdInCurrentResult: opts.nodeData[0].id,
            proxyCache: opts.nodeData.reduce(function (proxyCacheAcc, node) {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode({
                node: node
              });
              return proxyCacheAcc;
            }, {}),
            pageInfoFromResults: opts.pageInfoFromResults,
            clientSidePageInfo: opts.clientSidePageInfo
          };
        } else {
          return {
            idsOrIdInCurrentResult: opts.nodeData.map(function (node) {
              return node.id;
            }),
            proxyCache: opts.nodeData.reduce(function (proxyCacheAcc, node) {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode({
                node: node
              });
              return proxyCacheAcc;
            }, {}),
            pageInfoFromResults: opts.pageInfoFromResults,
            clientSidePageInfo: opts.clientSidePageInfo
          };
        }
      } else {
        var _proxyCache;

        return {
          idsOrIdInCurrentResult: opts.nodeData.id,
          proxyCache: (_proxyCache = {}, _proxyCache[nodeData.id] = buildProxyCacheEntryForNode({
            node: nodeData
          }), _proxyCache),
          pageInfoFromResults: opts.pageInfoFromResults,
          clientSidePageInfo: opts.clientSidePageInfo
        };
      }
    };

    _proto.updateProxiesAndStateFromSubscriptionMessage = function updateProxiesAndStateFromSubscriptionMessage(opts) {
      var node = opts.node,
          subscriptionAlias = opts.subscriptionAlias,
          operation = opts.operation;

      if ((operation.action === 'DeleteNode' || operation.action === 'DeleteEdge') && operation.path === node.id) {
        var idsOrIdInCurrentResult = this.state[subscriptionAlias].idsOrIdInCurrentResult;

        if (Array.isArray(idsOrIdInCurrentResult)) {
          this.state[subscriptionAlias].idsOrIdInCurrentResult = idsOrIdInCurrentResult.filter(function (id) {
            return id !== node.id;
          });
        } else {
          this.state[subscriptionAlias].idsOrIdInCurrentResult = null;
        }

        return;
      }

      var queryRecordEntryForThisSubscription = this.queryRecord[subscriptionAlias];
      this.state[subscriptionAlias] = this.state[subscriptionAlias] || {};
      var stateForThisAlias = this.state[subscriptionAlias];
      var nodeId = node.id;

      var _ref = stateForThisAlias.proxyCache[nodeId] || {},
          proxy = _ref.proxy,
          relationalState = _ref.relationalState;

      if (proxy) {
        var newCacheEntry = this.recursivelyUpdateProxyAndReturnNewCacheEntry({
          proxy: proxy,
          newRelationalData: this.getRelationalData({
            queryRecord: queryRecordEntryForThisSubscription,
            node: opts.node
          }),
          relationalQueryRecord: queryRecordEntryForThisSubscription.relational || null,
          currentState: {
            proxy: proxy,
            relationalState: relationalState
          },
          aliasPath: [subscriptionAlias]
        });
        stateForThisAlias.proxyCache[nodeId] = newCacheEntry;
      } else {
        var cacheEntry = this.buildCacheEntry({
          nodeData: node,
          queryAlias: subscriptionAlias,
          queryRecord: this.queryRecord,
          // @TODO will we get pageInfo in subscription messages?
          pageInfoFromResults: null,
          clientSidePageInfo: null,
          aliasPath: [subscriptionAlias]
        });
        if (!cacheEntry) return;
        var proxyCache = cacheEntry.proxyCache;
        var newlyGeneratedProxy = proxyCache[node.id];
        if (!newlyGeneratedProxy) throw Error('Expected a newly generated proxy');
        stateForThisAlias.proxyCache[nodeId] = proxyCache[node.id];
      }

      if ('id' in queryRecordEntryForThisSubscription) {
        if (stateForThisAlias.idsOrIdInCurrentResult === nodeId) {
          return;
        }

        this.state[opts.subscriptionAlias].idsOrIdInCurrentResult = nodeId;
      } else {
        if ((stateForThisAlias.idsOrIdInCurrentResult || []).includes(nodeId)) return; // don't need to do anything if this id was already in the returned set

        this.state[opts.subscriptionAlias].idsOrIdInCurrentResult = [nodeId].concat(this.state[opts.subscriptionAlias].idsOrIdInCurrentResult);
      }
    };

    _proto.recursivelyUpdateProxyAndReturnNewCacheEntry = function recursivelyUpdateProxyAndReturnNewCacheEntry(opts) {
      var _this5 = this;

      var proxy = opts.proxy,
          newRelationalData = opts.newRelationalData,
          currentState = opts.currentState,
          relationalQueryRecord = opts.relationalQueryRecord;
      var currentRelationalState = currentState.relationalState;
      var newRelationalState = !relationalQueryRecord ? null : Object.keys(relationalQueryRecord).reduce(function (relationalStateAcc, relationalAlias) {
        if (!newRelationalData || !newRelationalData[relationalAlias]) {
          return relationalStateAcc;
        }

        var relationalDataForThisAlias = newRelationalData[relationalAlias];
        var queryRecordForThisAlias = relationalQueryRecord[relationalAlias];
        var currentStateForThisAlias = !currentRelationalState ? null : currentRelationalState[relationalAlias];

        if (!currentStateForThisAlias) {
          var cacheEntry = _this5.buildCacheEntry({
            nodeData: relationalDataForThisAlias,
            queryAlias: relationalAlias,
            queryRecord: relationalQueryRecord,
            // @TODO will we get pageInfo in subscription messages?
            pageInfoFromResults: null,
            clientSidePageInfo: null,
            aliasPath: [].concat(opts.aliasPath, [relationalAlias])
          });

          if (!cacheEntry) return relationalStateAcc;
          relationalStateAcc[relationalAlias] = cacheEntry;
          return relationalStateAcc;
        }

        if (Array.isArray(relationalDataForThisAlias)) {
          relationalStateAcc[relationalAlias] = relationalStateAcc[relationalAlias] || {
            proxyCache: {},
            idsOrIdInCurrentResult: []
          };
          relationalDataForThisAlias.forEach(function (node) {
            var _currentStateForThisA;

            var existingProxy = (_currentStateForThisA = currentStateForThisAlias.proxyCache[node.id]) == null ? void 0 : _currentStateForThisA.proxy;

            if (!existingProxy) {
              var _extends3;

              var _cacheEntry = _this5.buildCacheEntry({
                nodeData: node,
                queryAlias: relationalAlias,
                queryRecord: relationalQueryRecord,
                // @TODO will we get pageInfo in subscription messages?
                pageInfoFromResults: null,
                clientSidePageInfo: null,
                aliasPath: [].concat(opts.aliasPath, [relationalAlias])
              });

              if (!_cacheEntry) return;
              relationalStateAcc[relationalAlias] = {
                proxyCache: _extends({}, relationalStateAcc[relationalAlias].proxyCache, (_extends3 = {}, _extends3[node.id] = _cacheEntry.proxyCache[node.id], _extends3)),
                idsOrIdInCurrentResult: [].concat(relationalStateAcc[relationalAlias].idsOrIdInCurrentResult, [node.id]),
                // @TODO will we get pageInfo in subscription messages?
                pageInfoFromResults: null,
                clientSidePageInfo: null
              };
            } else {
              var _extends4;

              var newCacheEntry = _this5.recursivelyUpdateProxyAndReturnNewCacheEntry({
                proxy: existingProxy,
                newRelationalData: _this5.getRelationalData({
                  queryRecord: queryRecordForThisAlias,
                  node: node
                }),
                relationalQueryRecord: queryRecordForThisAlias.relational || null,
                currentState: currentStateForThisAlias.proxyCache[node.id],
                aliasPath: [].concat(opts.aliasPath, [relationalAlias])
              });

              relationalStateAcc[relationalAlias] = {
                proxyCache: _extends({}, relationalStateAcc[relationalAlias].proxyCache, (_extends4 = {}, _extends4[node.id] = newCacheEntry, _extends4)),
                idsOrIdInCurrentResult: [].concat(relationalStateAcc[relationalAlias].idsOrIdInCurrentResult, [node.id]),
                // @TODO will we get pageInfo in subscription messages?
                pageInfoFromResults: null,
                clientSidePageInfo: null
              };
            }
          });
        } else {
          throw Error("Not implemented. " + JSON.stringify(relationalDataForThisAlias));
        }

        return relationalStateAcc;
      }, {});
      newRelationalState ? proxy.updateRelationalResults(this.getResultsFromState({
        state: newRelationalState,
        aliasPath: opts.aliasPath
      })) : proxy.updateRelationalResults(null);
      return {
        proxy: proxy,
        relationalState: newRelationalState
      };
    };

    _proto.getRelationalData = function getRelationalData(opts) {
      return opts.queryRecord.relational ? Object.keys(opts.queryRecord.relational).reduce(function (relationalDataAcc, relationalAlias) {
        relationalDataAcc[relationalAlias] = opts.node[relationalAlias];
        return relationalDataAcc;
      }, {}) : null;
    };

    _proto.removeUnionSuffix = function removeUnionSuffix(alias) {
      if (alias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) return alias.split(RELATIONAL_UNION_QUERY_SEPARATOR)[0];else return alias;
    };

    _proto.getApplicableRelationalQueries = function getApplicableRelationalQueries(opts) {
      var _this6 = this;

      return Object.keys(opts.relationalQueries).reduce(function (acc, relationalQueryAlias) {
        var _extends5, _extends6;

        if (!relationalQueryAlias.includes(RELATIONAL_UNION_QUERY_SEPARATOR)) return _extends({}, acc, (_extends5 = {}, _extends5[relationalQueryAlias] = opts.relationalQueries[relationalQueryAlias], _extends5));
        var firstResult = opts.nodeData[relationalQueryAlias] ? opts.nodeData[relationalQueryAlias][0] : null; // if the node.type returned in the relational query results does not match that of the relational query alias, skip adding this relational query
        // this happens when a reference union is queried, for all nodes in the union type that do not match the type in the result
        // and ensures that the correct node definition is used when building the decorated results for this query/subscription

        if (firstResult && firstResult.type !== opts.relationalQueries[relationalQueryAlias].def.type) return acc;
        return _extends({}, acc, (_extends6 = {}, _extends6[_this6.removeUnionSuffix(relationalQueryAlias)] = opts.relationalQueries[relationalQueryAlias], _extends6));
      }, {});
    };

    _proto.getDataFromResponse = function getDataFromResponse(opts) {
      return queryRecordEntryReturnsArrayOfData({
        queryRecordEntry: opts.queryRecordEntry
      }) ? opts.dataForThisAlias[NODES_PROPERTY_KEY] : opts.dataForThisAlias;
    };

    _proto.getPageInfoFromResponse = function getPageInfoFromResponse(opts) {
      return opts.dataForThisAlias[PAGE_INFO_PROPERTY_KEY] || null;
    };

    _proto.getPageInfoFromResponseForAlias = function getPageInfoFromResponseForAlias(opts) {
      var _opts$aliasPath = opts.aliasPath,
          firstAlias = _opts$aliasPath[0],
          remainingPath = _opts$aliasPath.slice(1);

      var firstAliasWithoutId = this.removeIdFromAlias(firstAlias);
      var idFromFirstAlias = this.getIdFromAlias(firstAlias);

      if (remainingPath.length === 0) {
        if (idFromFirstAlias != null) {
          var isArrayOfData = Array.isArray(opts.response[firstAliasWithoutId] ? opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY] : false);
          if (!isArrayOfData) throw Error('Expected array of data when an id is found in the alias');

          var _dataForThisAlias = opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY].find(function (item) {
            return item.id === idFromFirstAlias;
          });

          if (!_dataForThisAlias) throw Error('Expected data for this alias when an id is found in the alias');
          return this.getPageInfoFromResponse({
            dataForThisAlias: _dataForThisAlias
          });
        }

        return this.getPageInfoFromResponse({
          dataForThisAlias: opts.response[firstAliasWithoutId]
        });
      }

      var dataForThisAlias = opts.response[firstAliasWithoutId][NODES_PROPERTY_KEY].find(function (item) {
        return item.id === idFromFirstAlias;
      });
      return this.getPageInfoFromResponseForAlias({
        aliasPath: remainingPath,
        response: dataForThisAlias
      });
    };

    _proto.getClientSidePageInfo = function getClientSidePageInfo(opts) {
      var _opts$queryRecordEntr;

      if (!queryRecordEntryReturnsArrayOfData({
        queryRecordEntry: opts.queryRecordEntry
      })) return null;
      return {
        lastQueriedPage: 1,
        pageSize: ((_opts$queryRecordEntr = opts.queryRecordEntry.pagination) == null ? void 0 : _opts$queryRecordEntr.itemsPerPage) || DEFAULT_PAGE_SIZE
      };
    };

    _proto.onLoadMoreResults = /*#__PURE__*/function () {
      var _onLoadMoreResults = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(opts) {
        var newMinimalQueryRecordForMoreResults, tokenName, newData;
        return runtime_1.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.opts.useServerSidePaginationFilteringSorting) {
                  _context.next = 4;
                  break;
                }

                _context.next = 3;
                return new Promise(function (resolve) {
                  return setTimeout(resolve, (mmGQLInstance.getMockDataDelay == null ? void 0 : mmGQLInstance.getMockDataDelay()) || 0);
                });

              case 3:
                return _context.abrupt("return");

              case 4:
                newMinimalQueryRecordForMoreResults = this.getMinimalQueryRecordForMoreResults({
                  preExistingQueryRecord: this.queryRecord,
                  previousEndCursor: opts.previousEndCursor,
                  aliasPath: opts.aliasPath
                });
                tokenName = this.getTokenNameForAliasPath(opts.aliasPath);
                _context.next = 8;
                return this.opts.performQuery({
                  queryRecord: newMinimalQueryRecordForMoreResults,
                  queryGQL: client.gql(_templateObject || (_templateObject = _taggedTemplateLiteralLoose(["\n          ", "\n        "])), getQueryGQLStringFromQueryRecord({
                    queryId: this.opts.queryId,
                    queryRecord: newMinimalQueryRecordForMoreResults,
                    useServerSidePaginationFilteringSorting: this.opts.useServerSidePaginationFilteringSorting
                  })),
                  tokenName: tokenName
                });

              case 8:
                newData = _context.sent;
                this.handlePagingEventData({
                  aliasPath: opts.aliasPath,
                  queryRecord: newMinimalQueryRecordForMoreResults,
                  newData: newData,
                  event: 'LOAD_MORE'
                });

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function onLoadMoreResults(_x) {
        return _onLoadMoreResults.apply(this, arguments);
      }

      return onLoadMoreResults;
    }();

    _proto.onGoToNextPage = /*#__PURE__*/function () {
      var _onGoToNextPage = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(opts) {
        var newMinimalQueryRecordForMoreResults, tokenName, newData;
        return runtime_1.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.opts.useServerSidePaginationFilteringSorting) {
                  _context2.next = 4;
                  break;
                }

                _context2.next = 3;
                return new Promise(function (resolve) {
                  return setTimeout(resolve, (mmGQLInstance.getMockDataDelay == null ? void 0 : mmGQLInstance.getMockDataDelay()) || 0);
                });

              case 3:
                return _context2.abrupt("return");

              case 4:
                newMinimalQueryRecordForMoreResults = this.getMinimalQueryRecordForMoreResults({
                  preExistingQueryRecord: this.queryRecord,
                  previousEndCursor: opts.previousEndCursor,
                  aliasPath: opts.aliasPath
                });
                tokenName = this.getTokenNameForAliasPath(opts.aliasPath);
                _context2.next = 8;
                return this.opts.performQuery({
                  queryRecord: newMinimalQueryRecordForMoreResults,
                  queryGQL: client.gql(_templateObject2 || (_templateObject2 = _taggedTemplateLiteralLoose(["\n          ", "\n        "])), getQueryGQLStringFromQueryRecord({
                    queryId: this.opts.queryId,
                    queryRecord: newMinimalQueryRecordForMoreResults,
                    useServerSidePaginationFilteringSorting: this.opts.useServerSidePaginationFilteringSorting
                  })),
                  tokenName: tokenName
                });

              case 8:
                newData = _context2.sent;
                this.handlePagingEventData({
                  aliasPath: opts.aliasPath,
                  queryRecord: newMinimalQueryRecordForMoreResults,
                  newData: newData,
                  event: 'GO_TO_NEXT'
                });

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function onGoToNextPage(_x2) {
        return _onGoToNextPage.apply(this, arguments);
      }

      return onGoToNextPage;
    }();

    _proto.onGoToPreviousPage = /*#__PURE__*/function () {
      var _onGoToPreviousPage = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee3(opts) {
        var newMinimalQueryRecordForMoreResults, tokenName, newData;
        return runtime_1.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (this.opts.useServerSidePaginationFilteringSorting) {
                  _context3.next = 4;
                  break;
                }

                _context3.next = 3;
                return new Promise(function (resolve) {
                  return setTimeout(resolve, (mmGQLInstance.getMockDataDelay == null ? void 0 : mmGQLInstance.getMockDataDelay()) || 0);
                });

              case 3:
                return _context3.abrupt("return");

              case 4:
                newMinimalQueryRecordForMoreResults = this.getMinimalQueryRecordForPreviousPage({
                  preExistingQueryRecord: this.queryRecord,
                  previousStartCursor: opts.previousStartCursor,
                  aliasPath: opts.aliasPath
                });
                tokenName = this.getTokenNameForAliasPath(opts.aliasPath);
                _context3.next = 8;
                return this.opts.performQuery({
                  queryRecord: newMinimalQueryRecordForMoreResults,
                  queryGQL: client.gql(_templateObject3 || (_templateObject3 = _taggedTemplateLiteralLoose(["\n          ", "\n        "])), getQueryGQLStringFromQueryRecord({
                    queryId: this.opts.queryId,
                    queryRecord: newMinimalQueryRecordForMoreResults,
                    useServerSidePaginationFilteringSorting: this.opts.useServerSidePaginationFilteringSorting
                  })),
                  tokenName: tokenName
                });

              case 8:
                newData = _context3.sent;
                this.handlePagingEventData({
                  aliasPath: opts.aliasPath,
                  queryRecord: newMinimalQueryRecordForMoreResults,
                  newData: newData,
                  event: 'GO_TO_PREVIOUS'
                });

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function onGoToPreviousPage(_x3) {
        return _onGoToPreviousPage.apply(this, arguments);
      }

      return onGoToPreviousPage;
    }();

    _proto.getTokenNameForAliasPath = function getTokenNameForAliasPath(aliasPath) {
      if (aliasPath.length === 0) throw new Error('Alias path must contain at least 1 entry');
      var firstAliasWithoutId = this.removeIdFromAlias(aliasPath[0]);
      if (!this.queryRecord[firstAliasWithoutId]) throw Error("The key " + firstAliasWithoutId + " was not found in the queryRecord\n" + JSON.stringify(this.queryRecord, null, 2));
      return this.queryRecord[firstAliasWithoutId].tokenName || DEFAULT_TOKEN_NAME;
    }
    /**
     * Builds a new query record which contains the smallest query possible
     * to get the data for a given aliasPath, with some new pagination params
     *
     * An alias path may look something like ['users'] if we're loading more results on a QueryRecordEntry (root level)
     * or something like ['users', 'todos'] if we're loading more results on a RelationalQueryRecordEntry
     */
    ;

    _proto.getMinimalQueryRecordWithUpdatedPaginationParams = function getMinimalQueryRecordWithUpdatedPaginationParams(opts) {
      var _opts$aliasPath2 = opts.aliasPath,
          firstAlias = _opts$aliasPath2[0],
          remainingPath = _opts$aliasPath2.slice(1);

      var newQueryRecord = {};
      var firstAliasWithoutId = this.removeIdFromAlias(firstAlias);
      var preExistingQueryRecordEntryForFirstAlias = opts.preExistingQueryRecord[firstAliasWithoutId];
      if (!preExistingQueryRecordEntryForFirstAlias) throw new Error("No preexisting query record entry for the alias " + firstAliasWithoutId);

      if (!remainingPath.length) {
        newQueryRecord[firstAliasWithoutId] = _extends({}, preExistingQueryRecordEntryForFirstAlias, {
          pagination: _extends({}, preExistingQueryRecordEntryForFirstAlias.pagination, opts.newPaginationParams)
        });
      } else {
        newQueryRecord[firstAliasWithoutId] = _extends({}, preExistingQueryRecordEntryForFirstAlias, {
          relational: this.getMinimalQueryRecordWithUpdatedPaginationParams({
            aliasPath: remainingPath,
            preExistingQueryRecord: preExistingQueryRecordEntryForFirstAlias.relational,
            newPaginationParams: opts.newPaginationParams
          })
        });
      }

      return newQueryRecord;
    };

    _proto.getMinimalQueryRecordForMoreResults = function getMinimalQueryRecordForMoreResults(opts) {
      return this.getMinimalQueryRecordWithUpdatedPaginationParams({
        aliasPath: opts.aliasPath,
        preExistingQueryRecord: opts.preExistingQueryRecord,
        newPaginationParams: {
          startCursor: opts.previousEndCursor,
          endCursor: undefined
        }
      });
    };

    _proto.getMinimalQueryRecordForPreviousPage = function getMinimalQueryRecordForPreviousPage(opts) {
      return this.getMinimalQueryRecordWithUpdatedPaginationParams({
        aliasPath: opts.aliasPath,
        preExistingQueryRecord: opts.preExistingQueryRecord,
        newPaginationParams: {
          endCursor: opts.previousStartCursor,
          startCursor: undefined
        }
      });
    };

    _proto.handlePagingEventData = function handlePagingEventData(opts) {
      this.notifyRepositories({
        data: opts.newData,
        queryRecord: opts.queryRecord
      });
      var newState = this.getNewStateFromQueryResult({
        queryResult: opts.newData,
        queryRecord: opts.queryRecord
      });
      this.extendStateObject({
        aliasPath: opts.aliasPath,
        originalAliasPath: opts.aliasPath,
        state: this.state,
        newState: newState,
        mergeStrategy: opts.event === 'LOAD_MORE' ? 'CONCAT' : 'REPLACE'
      });
      extend({
        object: this.opts.resultsObject,
        extension: this.getResultsFromState({
          state: this.state
        }),
        extendNestedObjects: false,
        deleteKeysNotInExtension: false
      });
      this.opts.onResultsUpdated();
    };

    _proto.extendStateObject = function extendStateObject(opts) {
      var _opts$aliasPath3 = opts.aliasPath,
          firstAlias = _opts$aliasPath3[0],
          remainingPath = _opts$aliasPath3.slice(1);

      var firstAliasWithoutId = this.removeIdFromAlias(firstAlias);
      var existingStateForFirstAlias = opts.state[firstAliasWithoutId];
      var newStateForFirstAlias = opts.newState[firstAliasWithoutId];
      if (!existingStateForFirstAlias || !newStateForFirstAlias) throw Error("Expected new and existing state for the alias " + firstAliasWithoutId);

      if (remainingPath.length === 0) {
        var _opts$parentProxy, _state;

        existingStateForFirstAlias.pageInfoFromResults = newStateForFirstAlias.pageInfoFromResults;
        existingStateForFirstAlias.clientSidePageInfo = newStateForFirstAlias.clientSidePageInfo;
        existingStateForFirstAlias.proxyCache = _extends({}, existingStateForFirstAlias.proxyCache, newStateForFirstAlias.proxyCache);

        if (opts.mergeStrategy === 'CONCAT') {
          if (!Array.isArray(existingStateForFirstAlias.idsOrIdInCurrentResult) || !Array.isArray(newStateForFirstAlias.idsOrIdInCurrentResult)) {
            throw Error('Expected both existing and new state "idsOrIdInCurrentResult" to be arrays');
          }

          existingStateForFirstAlias.idsOrIdInCurrentResult = [].concat(existingStateForFirstAlias.idsOrIdInCurrentResult, newStateForFirstAlias.idsOrIdInCurrentResult);
        } else if (opts.mergeStrategy === 'REPLACE') {
          existingStateForFirstAlias.idsOrIdInCurrentResult = newStateForFirstAlias.idsOrIdInCurrentResult;
        } else {
          throw new UnreachableCaseError(opts.mergeStrategy);
        }

        (_opts$parentProxy = opts.parentProxy) == null ? void 0 : _opts$parentProxy.updateRelationalResults(this.getResultsFromState({
          state: (_state = {}, _state[firstAliasWithoutId] = existingStateForFirstAlias, _state),
          aliasPath: opts.originalAliasPath
        }));
      } else {
        var id = this.getIdFromAlias(firstAlias);
        if (!id) throw Error("Expected an id for the alias " + firstAlias);
        var existingRelationalStateForThisProxy = existingStateForFirstAlias.proxyCache[id].relationalState;
        if (!existingRelationalStateForThisProxy) throw Error("Expected existing relational state for the alias " + firstAlias + " and the id " + id);
        var newRelationalStateForThisProxy = newStateForFirstAlias.proxyCache[id].relationalState;
        if (!newRelationalStateForThisProxy) throw Error("Expected new relational state for the alias " + firstAlias + " and the id " + id);
        this.extendStateObject({
          aliasPath: remainingPath,
          originalAliasPath: opts.originalAliasPath,
          state: existingRelationalStateForThisProxy,
          newState: newRelationalStateForThisProxy,
          mergeStrategy: opts.mergeStrategy,
          parentProxy: existingStateForFirstAlias.proxyCache[id].proxy
        });
      }
    };

    _proto.addIdToLastEntryInAliasPath = function addIdToLastEntryInAliasPath(opts) {
      var aliasPath = [].concat(opts.aliasPath);
      aliasPath[aliasPath.length - 1] = aliasPath[aliasPath.length - 1] + ("[" + opts.id + "]");
      return aliasPath;
    }
    /**
     * Removes the id from the alias if it exists
     * @example input: 'user[12msad-249js-25285]'
     * @example output: 'user'
     */
    ;

    _proto.removeIdFromAlias = function removeIdFromAlias(alias) {
      return alias.replace(/\[.*\]$/, '');
    }
    /**
     * Returns the id from the alias if it exists
     * @example input: 'user[12msad-249js-25285]'
     * @example output: '12msad-249js-25285'
     */
    ;

    _proto.getIdFromAlias = function getIdFromAlias(alias) {
      var id = alias.match(/\[(.*)\]$/);
      if (!id) return undefined;
      return id[1];
    };

    return QueryManager;
  }();
}

function getMutationNameFromOperations(operations, fallback) {
  var operationNames = operations.filter(function (operation) {
    return 'name' in operation && !!operation.name;
  }).map(function (operation) {
    if ('name' in operation) {
      return operation.name;
    } else {
      throw Error('Expected an operation name here');
    }
  });

  if (operationNames.length) {
    return operationNames.join('__');
  }

  return fallback;
}

function getEdgePermissionsString(permissions) {
  return "\n    view: " + (permissions.view ? 'true' : 'false') + ",\n    edit: " + (permissions.edit ? 'true' : 'false') + ",\n    manage: " + (permissions.manage ? 'true' : 'false') + ",\n    terminate: " + (permissions.terminate ? 'true' : 'false') + ",\n    addChild: " + (permissions.addChild ? 'true' : 'false') + "\n  ";
}

var _templateObject$1;
function createEdge(edge) {
  return _extends({
    type: 'createEdge'
  }, edge, {
    operationName: 'AttachEdge'
  });
}
function createEdges(edges) {
  return {
    type: 'createEdges',
    operationName: 'AttachEdge',
    edges: edges
  };
}
function getMutationsFromEdgeCreateOperations(operations) {
  return operations.flatMap(function (operation) {
    if (operation.type === 'createEdge') {
      return convertEdgeCreationOperationToMutationArguments(_extends({}, operation.edge, {
        name: operation.name
      }));
    } else if (operation.type === 'createEdges') {
      return operation.edges.map(function (_ref) {
        var edge = _ref.edge;
        return convertEdgeCreationOperationToMutationArguments(edge);
      });
    }

    throw Error("Operation not recognized: \"" + operation + "\"");
  });
}

function convertEdgeCreationOperationToMutationArguments(opts) {
  var edge = "{\ntype: \"" + (opts.type || 'access') + "\"," + getEdgePermissionsString(opts.permissions) + "}";
  var name = getMutationNameFromOperations([opts], 'CreateEdge');
  return core.gql(_templateObject$1 || (_templateObject$1 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        AttachEdge(\n            newSourceId: \"", "\"\n            targetId: \"", "\"\n            edge: ", "\n            transactional: true\n        )\n    }"])), name, opts.from, opts.to, edge);
}

var _templateObject$2;
function dropEdge(edge) {
  return _extends({
    type: 'dropEdge',
    operationName: 'DropEdge'
  }, edge);
}
function dropEdges(edges) {
  return {
    type: 'dropEdges',
    operationName: 'DropEdge',
    edges: edges
  };
}
function getMutationsFromEdgeDropOperations(operations) {
  return operations.flatMap(function (operation) {
    if (operation.type === 'dropEdge') {
      return convertEdgeDropOperationToMutationArguments(_extends({}, operation.edge, {
        name: operation.name
      }));
    } else if (operation.type === 'dropEdges') {
      return operation.edges.map(function (operation) {
        return convertEdgeDropOperationToMutationArguments(_extends({}, operation.edge, {
          name: operation.name
        }));
      });
    }

    throw Error("Operation not recognized: \"" + operation + "\"");
  });
}

function convertEdgeDropOperationToMutationArguments(opts) {
  var name = getMutationNameFromOperations([opts], 'DropEdge');
  return core.gql(_templateObject$2 || (_templateObject$2 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        DropEdge(\n            sourceId: \"", "\"\n            targetId: \"", "\"\n            edgeType: \"", "\"\n            transactional: true\n        )\n    }"])), name, opts.from, opts.to, opts.type || 'access');
}

var _templateObject$3;
function replaceEdge(edge) {
  return _extends({
    type: 'replaceEdge',
    operationName: 'ReplaceEdge'
  }, edge);
}
function replaceEdges(edges) {
  return {
    type: 'replaceEdges',
    operationName: 'ReplaceEdge',
    edges: edges
  };
}
function getMutationsFromEdgeReplaceOperations(operations) {
  return operations.flatMap(function (operation) {
    if (operation.type === 'replaceEdge') {
      return convertEdgeReplaceOperationToMutationArguments(_extends({}, operation.edge, {
        name: operation.name
      }));
    } else if (operation.type === 'replaceEdges') {
      return operation.edges.map(function (_ref) {
        var edge = _ref.edge;
        return convertEdgeReplaceOperationToMutationArguments(edge);
      });
    }

    throw Error("Operation not recognized: \"" + operation + "\"");
  });
}

function convertEdgeReplaceOperationToMutationArguments(opts) {
  var name = getMutationNameFromOperations([opts], 'ReplaceEdge');
  var edge = "{\ntype: \"" + (opts.type || 'access') + "\", " + getEdgePermissionsString(opts.permissions) + "}";
  return core.gql(_templateObject$3 || (_templateObject$3 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        ReplaceEdge(\n            currentSourceId: \"", "\"\n            newSourceId: \"", "\"\n            targetId: \"", "\"\n            edge: ", "\n            transactional: true\n        )\n    }"])), name, opts.current, opts.from, opts.to, edge);
}

var _templateObject$4;
function updateEdge(edge) {
  return _extends({
    type: 'updateEdge',
    operationName: 'UpdateEdge'
  }, edge);
}
function updateEdges(edges) {
  return {
    type: 'updateEdges',
    operationName: 'UpdateEdge',
    edges: edges
  };
}
function getMutationsFromEdgeUpdateOperations(operations) {
  return operations.flatMap(function (operation) {
    if (operation.type === 'updateEdge') {
      return convertEdgeUpdateOperationToMutationArguments(_extends({}, operation.edge, {
        name: operation.name
      }));
    } else if (operation.type === 'updateEdges') {
      return operation.edges.map(function (_ref) {
        var edge = _ref.edge;
        return convertEdgeUpdateOperationToMutationArguments(edge);
      });
    }

    throw Error("Operation not recognized: \"" + operation + "\"");
  });
}

function convertEdgeUpdateOperationToMutationArguments(opts) {
  var edge = "{\ntype: \"" + (opts.type || 'access') + "\", " + getEdgePermissionsString(opts.permissions) + "}";
  var name = getMutationNameFromOperations([opts], 'UpdateEdge');
  return core.gql(_templateObject$4 || (_templateObject$4 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        UpdateEdge(\n            sourceId: \"", "\"\n            targetId: \"", "\"\n            edge: ", "\n            transactional: true\n        )\n    }"])), name, opts.from, opts.to, edge);
}

var _excluded$2 = ["to"],
    _excluded2$1 = ["from"];
var JSON_TAG$2 = '__JSON__';
/**
 * Takes the json representation of a node's data and prepares it to be sent to SM
 *
 * @param nodeData an object with arbitrary data
 * @returns stringified params ready for mutation
 */

function convertNodeDataToSMPersistedData(nodeData, opts) {
  var parsedData = prepareForBE(nodeData);
  var stringified = Object.entries(parsedData).reduce(function (acc, _ref, i) {
    var key = _ref[0],
        value = _ref[1];

    if (i > 0) {
      acc += '\n';
    }

    if (key === 'childNodes' || key === 'additionalEdges') {
      return acc + (key + ": [\n{\n" + value.join('\n}\n{\n') + "\n}\n]");
    }

    var shouldBeRawBoolean = (value === 'true' || value === 'false') && !!(opts != null && opts.skipBooleanStringWrapping);
    return acc + (key + ": " + (value === null || shouldBeRawBoolean ? value : "\"" + value + "\""));
  }, "");
  return stringified;
}

function escapeText$1(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
/**
 * Takes an object node value and flattens it to be sent to SM
 *
 * @param obj an object with arbitrary data
 * @param parentKey if the value is a nested object, the key of the parent is passed in order to prepend it to the child key
 * @param omitObjectIdentifier skip including __object__ for identifying parent objects,
 *  used to construct filters since there we don't care what the parent property is set to
 * @returns a flat object where the keys are of "key__dot__value" syntax
 *
 * For example:
 * ```typescript
 * const obj = {settings: {schedule: {day: 'Monday'} } }
 *  const result = prepareValueForBE(obj)
 * ```
 * The result will be:
 *  ```typescript
 *  {
 * settings: '__object__',
 * settings__dot__schedule: '__object__',
 * settings__dot__schedule__dot__day: 'Monday',
 * }
 * ```
 */


function prepareObjectForBE(obj, opts) {
  return Object.entries(obj).reduce(function (acc, _ref2) {
    var key = _ref2[0],
        val = _ref2[1];
    var preparedKey = opts != null && opts.parentKey ? "" + opts.parentKey + OBJECT_PROPERTY_SEPARATOR + key : key;

    if (typeof val === 'object' && val != null && !Array.isArray(val)) {
      if (!opts || !opts.omitObjectIdentifier) {
        acc[preparedKey] = OBJECT_IDENTIFIER;
      }

      acc = _extends({}, acc, Object.entries(val).reduce(function (acc, _ref3) {
        var key = _ref3[0],
            val = _ref3[1];
        return _extends({}, acc, convertPropertyToBE(_extends({
          key: "" + preparedKey + OBJECT_PROPERTY_SEPARATOR + key,
          value: val
        }, opts)));
      }, {}));
    } else {
      acc = _extends({}, acc, convertPropertyToBE(_extends({
        key: preparedKey,
        value: val
      }, opts)));
    }

    return acc;
  }, {});
}

function convertPropertyToBE(opts) {
  if (opts.value === null) {
    var _ref4;

    return _ref4 = {}, _ref4[opts.key] = null, _ref4;
  } else if (Array.isArray(opts.value)) {
    var _ref5;

    return _ref5 = {}, _ref5[opts.key] = "" + JSON_TAG$2 + escapeText$1(JSON.stringify(opts.value)), _ref5;
  } else if (typeof opts.value === 'object') {
    var _prepareObjectForBE;

    return prepareObjectForBE((_prepareObjectForBE = {}, _prepareObjectForBE[opts.key] = opts.value, _prepareObjectForBE), {
      omitObjectIdentifier: opts.omitObjectIdentifier
    });
  } else if (typeof opts.value === 'string') {
    var _ref6;

    return _ref6 = {}, _ref6[opts.key] = escapeText$1(opts.value), _ref6;
  } else if (typeof opts.value === 'boolean' || typeof opts.value === 'number') {
    var _ref8;

    if (typeof opts.value === 'number' && isNaN(opts.value)) {
      var _ref7;

      return _ref7 = {}, _ref7[opts.key] = null, _ref7;
    }

    return _ref8 = {}, _ref8[opts.key] = String(opts.value), _ref8;
  } else {
    throw Error("I don't yet know how to handle feData of type \"" + typeof opts.value + "\"");
  }
}

function convertEdgeDirectionNames(edgeItem) {
  if (edgeItem.hasOwnProperty('to')) {
    var to = edgeItem.to,
        restOfEdgeItem = _objectWithoutPropertiesLoose(edgeItem, _excluded$2);

    return _extends({}, restOfEdgeItem, {
      targetId: to
    });
  } else if (edgeItem.hasOwnProperty('from')) {
    var _restOfEdgeItem = _objectWithoutPropertiesLoose(edgeItem, _excluded2$1);

    return _extends({}, _restOfEdgeItem, {
      sourceId: edgeItem.from
    });
  }

  throw new Error('convertEdgeDirectionNames - received invalid data');
}

function prepareForBE(obj) {
  return Object.entries(obj).reduce(function (acc, _ref9) {
    var key = _ref9[0],
        value = _ref9[1];

    if (key === 'childNodes') {
      if (!Array.isArray(value)) {
        throw new Error("\"childNodes\" is supposed to be an array");
      }

      return _extends({}, acc, {
        childNodes: value.map(function (item) {
          return convertNodeDataToSMPersistedData(item);
        })
      });
    }

    if (key === 'additionalEdges') {
      if (!Array.isArray(value)) {
        throw new Error("\"additionalEdges\" is supposed to be an array");
      }

      return _extends({}, acc, {
        additionalEdges: value.map(function (item) {
          return convertNodeDataToSMPersistedData(convertEdgeDirectionNames(item), {
            skipBooleanStringWrapping: true
          });
        })
      });
    }

    return _extends({}, acc, convertPropertyToBE({
      key: key,
      value: value
    }));
  }, {});
}

var _templateObject$5;
function createNodes(operation) {
  return _extends({
    type: 'createNodes',
    operationName: 'CreateNodes'
  }, operation);
}
function createNode(operation) {
  return _extends({
    type: 'createNode',
    operationName: 'CreateNodes'
  }, operation);
}
function getMutationsFromTransactionCreateOperations(operations) {
  if (!operations.length) return [];
  var allCreateNodeOperations = operations.flatMap(function (operation) {
    if (operation.type === 'createNode') {
      return operation;
    } else if (operation.type === 'createNodes') {
      return operation.nodes;
    } else {
      throw Error("Operation not recognized: \"" + operation + "\"");
    }
  });
  var name = getMutationNameFromOperations(operations, 'CreateNodes'); // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations

  return [core.gql(_templateObject$5 || (_templateObject$5 = _taggedTemplateLiteralLoose(["\n      mutation ", " {\n        CreateNodes(\n          createOptions: [\n            ", "\n          ]\n          transactional: true\n        ) {\n          id\n        }\n      }\n    "])), name, allCreateNodeOperations.map(convertCreateNodeOperationToCreateNodesMutationArguments).join('\n'))];
}

function convertCreateNodeOperationToCreateNodesMutationArguments(operation) {
  var dataToPersist = convertNodeDataToSMPersistedData(operation.data);
  var mutationArgs = ["node: {\n        " + dataToPersist + "\n      }"];

  if (operation.under) {
    var value = typeof operation.under === 'string' ? "[\"" + operation.under + "\"]" : "[\"" + operation.under.join('", "') + "\"]";
    mutationArgs.push("underIds: " + value);
  }

  return "{\n    " + mutationArgs.join('\n') + "\n  }";
}

var IN_FLIGHT_TIMEOUT_MS = 1000; // TODO Add onSubscriptionMessageReceived method: https://tractiontools.atlassian.net/browse/TTD-377

var QuerySlimmer = /*#__PURE__*/function () {
  function QuerySlimmer(mmGQLInstance) {
    this.mmGQLInstance = void 0;
    this.queriesByContext = {};
    this.inFlightQueryRecords = mobx.observable({});
    this.mmGQLInstance = mmGQLInstance;
  }

  var _proto = QuerySlimmer.prototype;

  _proto.query = /*#__PURE__*/function () {
    var _query = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(opts) {
      var _this = this;

      var newQuerySlimmedByCache, data, newQuerySlimmedByInFlightQueries, _data, _data2;

      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              newQuerySlimmedByCache = this.getSlimmedQueryAgainstQueriesByContext(opts.queryRecord);

              if (!(newQuerySlimmedByCache === null)) {
                _context.next = 5;
                break;
              }

              data = this.getDataForQueryFromQueriesByContext(opts.queryRecord);
              this.log("QUERYSLIMMER: NEW QUERY FULLY CACHED", "ORIGINAL QUERY: " + JSON.stringify(opts.queryRecord), "CACHE: " + JSON.stringify(this.queriesByContext), "DATA RETURNED: " + JSON.stringify(data));
              return _context.abrupt("return", data);

            case 5:
              newQuerySlimmedByInFlightQueries = this.slimNewQueryAgainstInFlightQueries(newQuerySlimmedByCache);

              if (!(newQuerySlimmedByInFlightQueries === null)) {
                _context.next = 14;
                break;
              }

              _context.next = 9;
              return this.sendQueryRequest({
                queryId: opts.queryId,
                queryRecord: newQuerySlimmedByCache,
                useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting,
                tokenName: opts.tokenName,
                batchKey: opts.batchKey
              });

            case 9:
              _data = this.getDataForQueryFromQueriesByContext(opts.queryRecord);
              this.log("QUERYSLIMMER: NEW QUERY SLIMMED BY CACHE", "ORIGINAL QUERY: " + JSON.stringify(opts.queryRecord), "SLIMMED QUERY: " + JSON.stringify(newQuerySlimmedByCache), "CACHE: " + JSON.stringify(this.queriesByContext), "DATA RETURNED: " + JSON.stringify(_data));
              return _context.abrupt("return", _data);

            case 14:
              this.log("QUERYSLIMMER: AWAITING IN-FLIGHT QUERIES SLIMMED AGAINST", "ORIGINAL QUERY: " + JSON.stringify(opts.queryRecord), "IN-FLIGHT QUERIES: " + JSON.stringify(this.inFlightQueryRecords), "CACHE: " + JSON.stringify(this.queriesByContext));
              _context.next = 17;
              return this.sendQueryRequest({
                queryId: opts.queryId,
                queryRecord: newQuerySlimmedByInFlightQueries.slimmedQueryRecord,
                useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting,
                tokenName: opts.tokenName,
                batchKey: opts.batchKey
              });

            case 17:
              _context.next = 19;
              return mobx.when(function () {
                return !_this.areDependentQueriesStillInFlight({
                  queryIds: newQuerySlimmedByInFlightQueries.queryIdsSlimmedAgainst,
                  querySlimmedByInFlightQueries: newQuerySlimmedByInFlightQueries.slimmedQueryRecord
                });
              }, {
                timeout: IN_FLIGHT_TIMEOUT_MS,
                onError: function onError(error) {
                  throw new Error("QUERYSLIMMER TIMED OUT WAITING ON IN FLIGHTQUERIES", error);
                }
              });

            case 19:
              _data2 = this.getDataForQueryFromQueriesByContext(opts.queryRecord);
              this.log("QUERYSLIMMER: NEW QUERY SLIMMED BY CACHE AND IN-FLIGHT QUERIES", "ORIGINAL QUERY: " + JSON.stringify(opts.queryRecord), "SLIMMED QUERY: " + JSON.stringify(newQuerySlimmedByInFlightQueries.slimmedQueryRecord), "CACHE: " + JSON.stringify(this.queriesByContext), "DATA RETURNED: " + JSON.stringify(_data2));
              return _context.abrupt("return", _data2);

            case 22:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function query(_x) {
      return _query.apply(this, arguments);
    }

    return query;
  }();

  _proto.getDataForQueryFromQueriesByContext = function getDataForQueryFromQueriesByContext(newQuery, parentContextKey) {
    var _this2 = this;

    var queryData = {};
    var newQueryKeys = Object.keys(newQuery);
    newQueryKeys.forEach(function (newQueryKey) {
      var queryRecordEntry = newQuery[newQueryKey];

      var contextKey = _this2.createContextKeyForQueryRecordEntry(queryRecordEntry, parentContextKey);

      var cachedQueryData = _this2.queriesByContext[contextKey];
      var newQueryData = {};
      var newQueryRelationalData = {};
      queryRecordEntry.properties.forEach(function (property) {
        newQueryData[property] = {
          nodes: cachedQueryData.results[property]
        };
      });

      if (queryRecordEntry.relational !== undefined) {
        newQueryRelationalData = _this2.getDataForQueryFromQueriesByContext(queryRecordEntry.relational, contextKey);
      }

      queryData[newQueryKey] = _extends({}, newQueryData, newQueryRelationalData);
    });
    return queryData;
  };

  _proto.slimNewQueryAgainstInFlightQueries = function slimNewQueryAgainstInFlightQueries(newQuery) {
    var _this3 = this;

    var newQueryByContextMap = this.getQueryRecordsByContextMap(newQuery);
    var inFlightQueriesToSlimAgainst = this.getInFlightQueriesToSlimAgainst(newQueryByContextMap);

    if (inFlightQueriesToSlimAgainst === null) {
      return null;
    }

    var queryIdsSlimmedAgainst = [];
    var newQuerySlimmed = {};
    Object.keys(inFlightQueriesToSlimAgainst).forEach(function (inFlightQueryContextKey) {
      if (inFlightQueryContextKey in newQueryByContextMap) {
        var newQueryRecordPieceSlimmed = _extends({}, newQueryByContextMap[inFlightQueryContextKey]);

        inFlightQueriesToSlimAgainst[inFlightQueryContextKey].forEach(function (inFlightQueryRecord) {
          var slimmed = _this3.getSlimmedQueryAgainstInFlightQuery(newQueryRecordPieceSlimmed, inFlightQueryRecord.queryRecord, false);

          if (slimmed !== null) {
            queryIdsSlimmedAgainst.push(inFlightQueryRecord.queryId);
            newQueryRecordPieceSlimmed = slimmed;
          }
        });
        newQuerySlimmed = _extends({}, newQuerySlimmed, newQueryRecordPieceSlimmed);
      }
    });

    if (Object.keys(newQuerySlimmed).length === 0) {
      return null;
    } else {
      return {
        queryIdsSlimmedAgainst: queryIdsSlimmedAgainst,
        slimmedQueryRecord: newQuerySlimmed
      };
    }
  }
  /**
   * Returns in flight QueryRecordEntries by context that can slim down a new query.
   * The new query should wait for an in flight query to slim against if:
   *   - At least one QueryRecordEntry ContextKey in the inFlightQuery matches the QueryRecordEntry ContextKey of the newQuery.
   *   - At least one property that is being requested by the new query is already being requested by the in flight query.
   *   - The matched in flight QueryRecordEntry (from above) is not requesting relational data deeper than the newQuery QueryRecordEntry.
   */
  ;

  _proto.getInFlightQueriesToSlimAgainst = function getInFlightQueriesToSlimAgainst(newQuery) {
    var _this4 = this;

    var inFlightQueriesToSlimAgainst = {};
    var newQueryCtxtKeys = Object.keys(newQuery);
    newQueryCtxtKeys.forEach(function (newQueryCtxKey) {
      var queryRecordBaseKey = Object.keys(newQuery[newQueryCtxKey])[0];
      var newQueryRecordEntry = newQuery[newQueryCtxKey][queryRecordBaseKey];

      var newQueryRecordDepth = _this4.getRelationalDepthOfQueryRecordEntry(newQueryRecordEntry);

      if (newQueryCtxKey in _this4.inFlightQueryRecords) {
        var inFlightQueriesForCtxKey = _this4.inFlightQueryRecords[newQueryCtxKey];
        inFlightQueriesForCtxKey.forEach(function (inFlightQueryRecord) {
          if (queryRecordBaseKey in inFlightQueryRecord.queryRecord) {
            var inFlightQueryRecordEntry = inFlightQueryRecord.queryRecord[queryRecordBaseKey];
            var inFlightRecordHasSomePropsInNewQuery = inFlightQueryRecordEntry.properties.some(function (inFlightProp) {
              return newQueryRecordEntry.properties.includes(inFlightProp);
            });

            if (inFlightRecordHasSomePropsInNewQuery) {
              var inFlightRecordEntryDepth = _this4.getRelationalDepthOfQueryRecordEntry(inFlightQueryRecordEntry);

              if (inFlightRecordEntryDepth <= newQueryRecordDepth) {
                if (newQueryCtxKey in inFlightQueriesToSlimAgainst) {
                  inFlightQueriesToSlimAgainst[newQueryCtxKey].push(inFlightQueryRecord);
                } else {
                  inFlightQueriesToSlimAgainst[newQueryCtxKey] = [inFlightQueryRecord];
                }
              }
            }
          }
        });
      }
    });
    return Object.keys(inFlightQueriesToSlimAgainst).length === 0 ? null : inFlightQueriesToSlimAgainst;
  }
  /**
   * Slims the new query against an in flight query.
   * This function assumes queries have already been matched by context.
   */
  ;

  _proto.getSlimmedQueryAgainstInFlightQuery = function getSlimmedQueryAgainstInFlightQuery(newQuery, inFlightQuery, isRelationalQueryRecord) {
    var _this5 = this;

    var slimmedQueryRecord = {};
    var slimmedRelationalQueryRecord = {};
    Object.keys(newQuery).forEach(function (newQueryKey) {
      var newQueryRecordEntry = newQuery[newQueryKey];
      var newRootRecordEntry = newQueryRecordEntry;
      var newRelationalRecordEntry = newQueryRecordEntry;

      if (inFlightQuery[newQueryKey] === undefined) {
        // If the inFlightQuery does not contain a record for the newQueryContextKey we need to keep that data as it needs to be fetched.
        if (isRelationalQueryRecord) {
          slimmedRelationalQueryRecord[newQueryKey] = newRelationalRecordEntry;
        } else {
          slimmedQueryRecord[newQueryKey] = newRootRecordEntry;
        }
      } else {
        // If a newQueryContextKey is present we want to slim what we can from the in flight query.
        var inFlightQueryRecordEntry = inFlightQuery[newQueryKey];

        var newRequestedProperties = _this5.getPropertiesNotCurrentlyBeingRequested({
          newQueryProps: newQueryRecordEntry.properties,
          inFlightProps: inFlightQueryRecordEntry.properties
        }); // If there are no further child relational queries to deal with and there are properties being requested that are not cached
        // we can just return the new query with only the newly requested properties.


        if (newRequestedProperties !== null && newQueryRecordEntry.relational === undefined) {
          if (isRelationalQueryRecord) {
            slimmedRelationalQueryRecord[newQueryKey] = _extends({}, newRelationalRecordEntry, {
              properties: newRequestedProperties
            });
          } else {
            slimmedQueryRecord[newQueryKey] = _extends({}, newRootRecordEntry, {
              properties: newRequestedProperties
            });
          }
        } // If both queries contain relational queries we need to try slimming against those as well.
        // If there are child relational queries we still need to handle those even if the parent query is requesting properties that are already in flight.


        if (newQueryRecordEntry.relational !== undefined && inFlightQueryRecordEntry.relational !== undefined) {
          var slimmedNewRelationalQueryRecord = _this5.getSlimmedQueryAgainstInFlightQuery(newQueryRecordEntry.relational, inFlightQueryRecordEntry.relational, true); // If there are any properties being requested in the child relational query
          // we will still need to return the query record even if the parent is requesting properties that are already in flight.
          // In this scenario we return an empty array for the properties of the parent query while the child relational query is populated.


          if (slimmedNewRelationalQueryRecord !== null) {
            if (isRelationalQueryRecord) {
              slimmedRelationalQueryRecord[newQueryKey] = _extends({}, newRelationalRecordEntry, {
                properties: newRequestedProperties != null ? newRequestedProperties : [],
                relational: _extends({}, slimmedNewRelationalQueryRecord)
              });
            } else {
              slimmedQueryRecord[newQueryKey] = _extends({}, newRootRecordEntry, {
                properties: newRequestedProperties != null ? newRequestedProperties : [],
                relational: _extends({}, slimmedNewRelationalQueryRecord)
              });
            }
          }
        }
      }
    });
    var queryRecordToReturn = isRelationalQueryRecord ? slimmedRelationalQueryRecord : slimmedQueryRecord;
    return Object.keys(queryRecordToReturn).length === 0 ? null : queryRecordToReturn;
  };

  _proto.getSlimmedQueryAgainstQueriesByContext = function getSlimmedQueryAgainstQueriesByContext(newQuery, parentContextKey) {
    var _this6 = this;

    // The query record could be a root query (not relational), or a child relational query.
    // They have different types so we create/update a brand new query record depending the type of query we are dealing with:
    //   - Dealing with a root query (not relational): slimmedQueryRecord and newRootRecordEntry
    //   - Dealing with a relational query: slimmedRelationalQueryRecord and newRelationalRecordEntry
    // We know we are dealing with a relational query when parentContextKey is NOT undefined
    var slimmedQueryRecord = {};
    var slimmedRelationalQueryRecord = {};
    var isNewQueryARootQuery = parentContextKey === undefined;
    Object.keys(newQuery).forEach(function (newQueryKey) {
      var newQueryRecordEntry = newQuery[newQueryKey];
      var newRootRecordEntry = newQueryRecordEntry;
      var newRelationalRecordEntry = newQueryRecordEntry;

      var newQueryContextKey = _this6.createContextKeyForQueryRecordEntry(newQueryRecordEntry, parentContextKey);

      if (_this6.queriesByContext[newQueryContextKey] === undefined) {
        // If the context key of the new query is not found in queriesByContext we know there is no cached version of this query.
        if (isNewQueryARootQuery) {
          slimmedQueryRecord[newQueryKey] = newRootRecordEntry;
        } else {
          slimmedRelationalQueryRecord[newQueryKey] = newRelationalRecordEntry;
        }
      } else {
        // If a context key is found for the new query in queriesByContext we need to check if any of the properties being requested
        // by the new query are already cached.
        var cachedQuery = _this6.queriesByContext[newQueryContextKey];

        var newRequestedProperties = _this6.getPropertiesNotAlreadyCached({
          newQueryProps: newQueryRecordEntry.properties,
          cachedQuerySubsByProperty: cachedQuery.subscriptionsByProperty
        }); // If there are no further child relational queries to deal with and there are properties being requested that are not cached
        // we can just return the new query with only the newly requested properties.


        if (newRequestedProperties !== null && newQueryRecordEntry.relational === undefined) {
          if (isNewQueryARootQuery) {
            slimmedQueryRecord[newQueryKey] = _extends({}, newRootRecordEntry, {
              properties: newRequestedProperties
            });
          } else {
            slimmedRelationalQueryRecord[newQueryKey] = _extends({}, newRelationalRecordEntry, {
              properties: newRequestedProperties
            });
          }
        } // If there are child relational queries we still need to handle those even if the parent query is requesting only cached properties.


        if (newQueryRecordEntry.relational !== undefined) {
          var slimmedNewRelationalQueryRecord = _this6.getSlimmedQueryAgainstQueriesByContext(newQueryRecordEntry.relational, newQueryContextKey); // If there are any non-cached properties being requested in the child relational query
          // we will still need to return the query record even if the parent is not requesting any un-cached properties.
          // In this scenario we return an empty array for the properties of the parent query while the child relational query is populated.


          if (slimmedNewRelationalQueryRecord !== null) {
            if (isNewQueryARootQuery) {
              slimmedQueryRecord[newQueryKey] = _extends({}, newRootRecordEntry, {
                properties: newRequestedProperties != null ? newRequestedProperties : [],
                relational: _extends({}, slimmedNewRelationalQueryRecord)
              });
            } else {
              slimmedRelationalQueryRecord[newQueryKey] = _extends({}, newRelationalRecordEntry, {
                properties: newRequestedProperties != null ? newRequestedProperties : [],
                relational: _extends({}, slimmedNewRelationalQueryRecord)
              });
            }
          }
        }
      }
    });
    var objectToReturn = isNewQueryARootQuery ? slimmedQueryRecord : slimmedRelationalQueryRecord;
    return Object.keys(objectToReturn).length === 0 ? null : objectToReturn;
  };

  _proto.onSubscriptionCancelled = function onSubscriptionCancelled(queryRecord, parentContextKey) {
    var _this7 = this;

    Object.keys(queryRecord).forEach(function (queryRecordKey) {
      var queryRecordEntry = queryRecord[queryRecordKey];

      var currentQueryContextKey = _this7.createContextKeyForQueryRecordEntry(queryRecordEntry, parentContextKey);

      if (queryRecordEntry.relational !== undefined) {
        _this7.onSubscriptionCancelled(queryRecordEntry.relational, currentQueryContextKey);
      }

      if (currentQueryContextKey in _this7.queriesByContext) {
        var cachedQuerySubsByProperty = _this7.queriesByContext[currentQueryContextKey].subscriptionsByProperty;
        queryRecordEntry.properties.forEach(function (property) {
          var propertySubCount = cachedQuerySubsByProperty[property];

          if (propertySubCount >= 1) {
            cachedQuerySubsByProperty[property] = propertySubCount - 1;
          }
        });
      }
    });
  };

  _proto.getRelationalDepthOfQueryRecordEntry = function getRelationalDepthOfQueryRecordEntry(queryRecordEntry) {
    var _this8 = this;

    var relationalDepth = 0;

    if (queryRecordEntry.relational !== undefined) {
      relationalDepth += 1;
      Object.values(queryRecordEntry.relational).forEach(function (relationalEntry) {
        relationalDepth += _this8.getRelationalDepthOfQueryRecordEntry(relationalEntry);
      });
    }

    return relationalDepth;
  };

  _proto.populateQueriesByContext = function populateQueriesByContext(queryRecord, results, parentContextKey) {
    var _this9 = this;

    Object.keys(queryRecord).forEach(function (alias) {
      var _this9$queriesByConte;

      var queryRecordEntry = queryRecord[alias];

      var currentQueryContextKey = _this9.createContextKeyForQueryRecordEntry(queryRecordEntry, parentContextKey);

      _this9.queriesByContext[currentQueryContextKey] = {
        subscriptionsByProperty: queryRecordEntry.properties.reduce(function (previous, current) {
          previous[current] = previous[current] ? previous[current] + 1 : 1;
          return previous;
        }, ((_this9$queriesByConte = _this9.queriesByContext[currentQueryContextKey]) == null ? void 0 : _this9$queriesByConte.subscriptionsByProperty) || {}),
        results: results[alias]
      };

      if (queryRecordEntry.relational) {
        var resultsForRelationalQueries = Object.keys(queryRecordEntry.relational).reduce(function (previous, current) {
          // do array vs object check here before map in case there's only a single id
          previous[current] = results[alias].map(function (user) {
            return user[current];
          });
          return previous;
        }, {});

        _this9.populateQueriesByContext(queryRecordEntry.relational, resultsForRelationalQueries, currentQueryContextKey);
      }
    });
  };

  _proto.createContextKeyForQueryRecordEntry = function createContextKeyForQueryRecordEntry(queryRecordEntry, parentContextKey) {
    var doesQueryHaveIdProperty = 'id' in queryRecordEntry && !!queryRecordEntry.id;
    var parentContextKeyPrefix = !!parentContextKey ? parentContextKey + "." : '';
    var currentQueryTypeProperty = "" + queryRecordEntry.def.type + (doesQueryHaveIdProperty ? '' : 's');
    var currentQueryStringifiedParams = this.stringifyQueryParams(queryRecordEntry);
    return "" + parentContextKeyPrefix + currentQueryTypeProperty + "(" + currentQueryStringifiedParams + ")";
  };

  _proto.getPropertiesNotAlreadyCached = function getPropertiesNotAlreadyCached(opts) {
    var newRequestedProperties = opts.newQueryProps.filter(function (newQueryProperty) {
      if (newQueryProperty in opts.cachedQuerySubsByProperty) {
        return opts.cachedQuerySubsByProperty[newQueryProperty] === 0;
      }

      return true;
    });
    return newRequestedProperties.length === 0 ? null : newRequestedProperties;
  };

  _proto.getPropertiesNotCurrentlyBeingRequested = function getPropertiesNotCurrentlyBeingRequested(opts) {
    var newRequestedProperties = opts.newQueryProps.filter(function (newQueryProperty) {
      return !opts.inFlightProps.includes(newQueryProperty);
    });
    return newRequestedProperties.length === 0 ? null : newRequestedProperties;
  };

  _proto.stringifyQueryParams = function stringifyQueryParams(entry) {
    // https://tractiontools.atlassian.net/browse/TTD-315
    // Handle filter/pagination/sorting query params
    var params = {
      ids: 'ids' in entry ? entry.ids : undefined,
      id: 'id' in entry ? entry.id : undefined
    };

    if (!Object.values(params).some(function (value) {
      return value != null;
    })) {
      return 'NO_PARAMS';
    }

    return JSON.stringify(params);
  };

  _proto.getQueryRecordsByContextMap = function getQueryRecordsByContextMap(queryRecord) {
    var _this10 = this;

    return Object.keys(queryRecord).reduce(function (queryRecordsByContext, queryRecordKey) {
      var _queryRecordSlice;

      var queryRecordEntry = queryRecord[queryRecordKey];

      var contextKey = _this10.createContextKeyForQueryRecordEntry(queryRecordEntry);

      var queryRecordSlice = (_queryRecordSlice = {}, _queryRecordSlice[queryRecordKey] = queryRecordEntry, _queryRecordSlice);
      queryRecordsByContext[contextKey] = queryRecordSlice;
      return queryRecordsByContext;
    }, {});
  };

  _proto.sendQueryRequest = /*#__PURE__*/function () {
    var _sendQueryRequest = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(opts) {
      var inFlightQuery, queryGQLString, queryOpts, results;
      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              inFlightQuery = {
                queryId: opts.queryId,
                queryRecord: opts.queryRecord
              };
              queryGQLString = getQueryGQLStringFromQueryRecord({
                queryId: opts.queryId,
                queryRecord: opts.queryRecord,
                useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
              });
              queryOpts = {
                gql: core.gql(queryGQLString),
                token: opts.tokenName
              };

              if ('batchKey' in opts && opts.batchKey !== undefined) {
                queryOpts.batchKey = opts.batchKey;
              }

              _context2.prev = 4;
              this.setInFlightQuery(inFlightQuery);
              _context2.next = 8;
              return this.mmGQLInstance.gqlClient.query(queryOpts);

            case 8:
              results = _context2.sent;
              this.removeInFlightQuery(inFlightQuery);
              this.populateQueriesByContext(opts.queryRecord, results);
              _context2.next = 17;
              break;

            case 13:
              _context2.prev = 13;
              _context2.t0 = _context2["catch"](4);
              this.removeInFlightQuery(inFlightQuery);
              throw new Error("QuerySlimmer: Error sending request for query: " + JSON.stringify(opts.queryRecord), _context2.t0);

            case 17:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[4, 13]]);
    }));

    function sendQueryRequest(_x2) {
      return _sendQueryRequest.apply(this, arguments);
    }

    return sendQueryRequest;
  }();

  _proto.setInFlightQuery = function setInFlightQuery(inFlightQueryRecord) {
    var _this11 = this;

    var queryRecordsByContext = this.getQueryRecordsByContextMap(inFlightQueryRecord.queryRecord);
    Object.keys(queryRecordsByContext).forEach(function (queryRecordContextKey) {
      if (queryRecordContextKey in _this11.inFlightQueryRecords) {
        _this11.inFlightQueryRecords[queryRecordContextKey].push(inFlightQueryRecord);
      } else {
        _this11.inFlightQueryRecords[queryRecordContextKey] = [inFlightQueryRecord];
      }
    });
  };

  _proto.removeInFlightQuery = function removeInFlightQuery(inFlightQueryToRemove) {
    var _this12 = this;

    var queryRecordsByContext = this.getQueryRecordsByContextMap(inFlightQueryToRemove.queryRecord);
    Object.keys(queryRecordsByContext).forEach(function (queryToRemoveCtxKey) {
      if (queryToRemoveCtxKey in _this12.inFlightQueryRecords) {
        _this12.inFlightQueryRecords[queryToRemoveCtxKey] = _this12.inFlightQueryRecords[queryToRemoveCtxKey].filter(function (inFlightRecord) {
          return inFlightRecord.queryId === inFlightQueryToRemove.queryId;
        });

        if (_this12.inFlightQueryRecords[queryToRemoveCtxKey].length === 0) {
          delete _this12.inFlightQueryRecords[queryToRemoveCtxKey];
        }
      }
    });
  };

  _proto.areDependentQueriesStillInFlight = function areDependentQueriesStillInFlight(opts) {
    var _this13 = this;

    var isStillWaitingOnInFlightQueries = false;
    var queryRecordsByContext = this.getQueryRecordsByContextMap(opts.querySlimmedByInFlightQueries);
    Object.keys(queryRecordsByContext).forEach(function (ctxKey) {
      if (!isStillWaitingOnInFlightQueries) {
        if (ctxKey in _this13.inFlightQueryRecords) {
          var inFlightQueryHasDepedentId = _this13.inFlightQueryRecords[ctxKey].some(function (inFlightQuery) {
            return opts.queryIds.includes(inFlightQuery.queryId);
          });

          if (inFlightQueryHasDepedentId) {
            isStillWaitingOnInFlightQueries = true;
          }
        }
      }
    });
    return isStillWaitingOnInFlightQueries;
  };

  _proto.log = function log(message) {
    if (this.mmGQLInstance.enableQuerySlimmingLogging) {
      var _console;

      for (var _len = arguments.length, optionalParams = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        optionalParams[_key - 1] = arguments[_key];
      }

      (_console = console).log.apply(_console, [message].concat(optionalParams));
    }
  };

  return QuerySlimmer;
}();

var MMGQLContext = /*#__PURE__*/React.createContext(undefined);
var LoggingContext = /*#__PURE__*/React.createContext({
  unsafe__silenceDuplicateSubIdErrors: false
}); // Allows use cases such as rendering the previous route as a suspense fallback to the next route
// where the same subscription id may be used momentarily before the fallback route unmounts

var UnsafeNoDuplicateSubIdErrorProvider = function UnsafeNoDuplicateSubIdErrorProvider(props) {
  return React.createElement(LoggingContext.Provider, {
    value: {
      unsafe__silenceDuplicateSubIdErrors: true
    }
  }, props.children);
};
var MMGQLProvider = function MMGQLProvider(props) {
  var existingContext = React.useContext(MMGQLContext);

  if (existingContext) {
    throw Error('Another instance of an MMGQLProvider was already detected higher up the render tree.\nHaving multiple instances of MMGQLProviders is not supported and may lead to unexpected results.');
  }

  var ongoingSubscriptionRecord = React.useRef({});
  var cleanupTimeoutRecord = React.useRef({});
  var mountedHooksBySubId = React.useRef({});
  var updateSubscriptionInfo = React.useCallback(function (subscriptionId, subInfo) {
    ongoingSubscriptionRecord.current[subscriptionId] = _extends({}, ongoingSubscriptionRecord.current[subscriptionId], subInfo);
  }, []);
  var scheduleCleanup = React.useCallback(function (subscriptionId) {
    function cleanup() {
      var existingContextSubscription = ongoingSubscriptionRecord.current[subscriptionId];

      if (existingContextSubscription) {
        existingContextSubscription.unsub && existingContextSubscription.unsub();
        delete ongoingSubscriptionRecord.current[subscriptionId];
      }
    }

    if (props.subscriptionTTLMs != null) {
      cleanupTimeoutRecord.current[subscriptionId] = setTimeout(cleanup, props.subscriptionTTLMs);
    } else {
      cleanup();
    }
  }, [props.subscriptionTTLMs]);
  var cancelCleanup = React.useCallback(function (subscriptionId) {
    clearTimeout(cleanupTimeoutRecord.current[subscriptionId]);
    delete cleanupTimeoutRecord.current[subscriptionId];
  }, []); // These three functions exists to fix issues related to non unique sub ids, which happens when multiple instances of the same component
  // using a useSubscription hook are mounted at the same time
  // since useSubscription uses the first line of the error stack to construct a unique sub id
  // fixes https://tractiontools.atlassian.net/browse/MM-404

  var onHookMount = React.useCallback(function (subscriptionId, _ref) {
    var silenceDuplicateSubIdErrors = _ref.silenceDuplicateSubIdErrors;

    if (mountedHooksBySubId.current[subscriptionId] && !silenceDuplicateSubIdErrors) {
      throw Error(["A useSubscription hook was already mounted using the following subscription id:", subscriptionId, "To fix this error, please specify a unique subscriptionId in the second argument of useSubscription", "useSubscription(queryDefinitions, { subscriptionId })"].join('\n'));
    }

    mountedHooksBySubId.current[subscriptionId] = true;
  }, []);
  var onHookUnmount = React.useCallback(function (subscriptionId) {
    delete mountedHooksBySubId.current[subscriptionId];
  }, []);
  return React.createElement(MMGQLContext.Provider, {
    value: {
      mmGQLInstance: props.mmGQL,
      ongoingSubscriptionRecord: ongoingSubscriptionRecord.current,
      updateSubscriptionInfo: updateSubscriptionInfo,
      scheduleCleanup: scheduleCleanup,
      cancelCleanup: cancelCleanup,
      onHookMount: onHookMount,
      onHookUnmount: onHookUnmount
    }
  }, props.children);
};

function useSubscription(queryDefinitions, opts) {
  var context = React.useContext(MMGQLContext);

  if (!context) {
    throw Error('You must wrap your app with an MMGQLProvider before using useSubscription.');
  }

  var obj = {
    stack: ''
  };
  Error.captureStackTrace(obj, useSubscription);

  if (obj.stack === '') {
    // Should be supported in all browsers, but better safe than sorry
    throw Error('Error.captureStackTrace not supported');
  }

  var subscriptionId = (opts == null ? void 0 : opts.subscriptionId) || obj.stack.split('\n')[1];
  var preExistingState = getPreexistingState({
    subscriptionId: subscriptionId,
    context: context,
    queryDefinitions: queryDefinitions
  });

  var _React$useState = React.useState(preExistingState.results),
      results = _React$useState[0],
      setResults = _React$useState[1];

  var _React$useState2 = React.useState(preExistingState.error),
      error = _React$useState2[0],
      setError = _React$useState2[1];

  var _React$useState3 = React.useState(preExistingState.querying),
      querying = _React$useState3[0],
      setQuerying = _React$useState3[1];

  var loggingContext = React.useContext(LoggingContext);
  var qdStateManager = null;
  var qdError = null;

  try {
    // buildQueryDefinitionStateManager throws a promise if a query is suspending rendering
    // we catch that promise here and re-throw it further down, so that we can manage cleanup
    // if this function throws and it is not caught, then the number of hooks produced by this hook changes, causing a react error
    qdStateManager = buildQueryDefinitionStateManager({
      context: context,
      subscriptionId: subscriptionId,
      queryDefinitions: queryDefinitions,
      data: {
        results: results,
        error: error,
        querying: querying
      },
      handlers: {
        onResults: setResults,
        onError: setError,
        setQuerying: setQuerying
      },
      silenceDuplicateSubIdErrors: loggingContext.unsafe__silenceDuplicateSubIdErrors,
      useServerSidePaginationFilteringSorting: context.mmGQLInstance.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER
    });
  } catch (e) {
    qdError = e;
    qdStateManager = null;
  }

  React.useEffect(function () {
    var _qdStateManager;

    (_qdStateManager = qdStateManager) == null ? void 0 : _qdStateManager.onHookMount();
    return function () {
      var _qdStateManager2;

      (_qdStateManager2 = qdStateManager) == null ? void 0 : _qdStateManager2.onHookUnmount();
    }; // can't add qdStateManager to the dependencies here, as this would cause this useEffect to run with every re-render
    // memoizing qdStateManager can be done, but then we'd have to silence the exhaustive-deps check for queryDefinitions, unless we forced devs
    // to memoize all of their query definitions, which seems overkill
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, subscriptionId]);
  if (error || qdError) throw error || qdError;
  return qdStateManager;
}

function getPreexistingState(opts) {
  var preExistingContextForThisSubscription = opts.context.ongoingSubscriptionRecord[opts.subscriptionId];
  var results = (preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.results) || Object.keys(opts.queryDefinitions).reduce(function (acc, key) {
    acc[key] = null;
    return acc;
  }, {});
  var error = preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.error;
  var querying = (preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.querying) != null ? preExistingContextForThisSubscription.querying : true;
  return {
    results: results,
    error: error,
    querying: querying
  };
}
/**
 * useSubscription accepts query definitions that optionally disable suspense rendering
 * to facilitate that, this method splits all query definitions into 2 groups
 * @param queryDefinitions
 * @returns {suspendEnabled: UseSubscriptionQueryDefinitions, suspendDisabled: UseSubscriptionQueryDefinitions}
 */


function splitQueryDefinitions(queryDefinitions) {
  var _Object$entries$reduc;

  return Object.entries(queryDefinitions).reduce(function (split, _ref) {
    var _queryDefinition$useS;

    var alias = _ref[0],
        queryDefinition = _ref[1];
    var suspend = queryDefinition && 'useSubOpts' in queryDefinition && ((_queryDefinition$useS = queryDefinition.useSubOpts) == null ? void 0 : _queryDefinition$useS.doNotSuspend) != null ? !queryDefinition.useSubOpts.doNotSuspend : true;
    split[suspend ? subscriptionIds.suspendEnabled : subscriptionIds.suspendDisabled][alias] = queryDefinition;
    return split;
  }, (_Object$entries$reduc = {}, _Object$entries$reduc[subscriptionIds.suspendEnabled] = {}, _Object$entries$reduc[subscriptionIds.suspendDisabled] = {}, _Object$entries$reduc));
}

var subscriptionIds = {
  suspendEnabled: 'suspendEnabled',
  suspendDisabled: 'suspendDisabled'
};

function buildQueryDefinitionStateManager(opts) {
  // When a subscription is initialized, the state of the subscription is split
  // suspended subscriptions and non suspended subscriptions are initialized separately,
  // so that rendering can continue as soon as possible.
  // To maintain shared state (like results, which are an aggregate of the results from both suspended and non suspended queries)
  // separately from subscription specific state (like the previously generated gql fragments to compare previous and next state and discover if we need to reinitialize subscriptions)
  // we have a parentSubscriptionId we use for storing shared state, and a subscriptionId for storing subscription specific state
  var parentSubscriptionId = opts.subscriptionId;
  var preExistingContextForThisParentSubscription = opts.context.ongoingSubscriptionRecord[parentSubscriptionId];

  if (!preExistingContextForThisParentSubscription) {
    opts.context.ongoingSubscriptionRecord[parentSubscriptionId] = {};
  }

  function onHookMount() {
    opts.context.onHookMount(parentSubscriptionId, {
      silenceDuplicateSubIdErrors: opts.silenceDuplicateSubIdErrors
    });
    opts.context.cancelCleanup(parentSubscriptionId);
    allSubscriptionIds.forEach(function (subId) {
      return opts.context.cancelCleanup(subId);
    });
  }

  function onHookUnmount() {
    opts.context.onHookUnmount(parentSubscriptionId);
    opts.context.scheduleCleanup(parentSubscriptionId);
    allSubscriptionIds.forEach(function (subId) {
      return opts.context.scheduleCleanup(subId);
    });
  } // We can not directly call "onResults" from this function's arguments within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling onResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.


  opts.context.updateSubscriptionInfo(parentSubscriptionId, {
    onResults: opts.handlers.onResults,
    onError: opts.handlers.onError,
    setQuerying: opts.handlers.setQuerying
  });

  var _splitQueryDefinition = splitQueryDefinitions(opts.queryDefinitions),
      suspendDisabled = _splitQueryDefinition.suspendDisabled,
      suspendEnabled = _splitQueryDefinition.suspendEnabled;

  var allSubscriptionIds = Object.values(subscriptionIds).map(function (subscriptionId) {
    return parentSubscriptionId + subscriptionId;
  });

  function getAllSubscriptionStates() {
    return allSubscriptionIds.map(function (subscriptionId) {
      return opts.context.ongoingSubscriptionRecord[subscriptionId];
    });
  } // From the received queried definitions
  // and a static parentSubscriptionId+subscriptionSuffix identifier
  // initializes subscriptions and updates the useSubscription state on the hook
  // Also maintains a copy of that state at the context level, such that the component rendering the hook
  // can unmount and remount without losing its state. This is key for suspense to work, since components unmount when a promise is thrown
  //
  // returns a promise if there's an unresolved request and "suspend" is set to true


  function handleNewQueryDefitions(subOpts) {
    var _opts$context$ongoing;

    var queryDefinitions = subOpts.queryDefinitions,
        parentSubscriptionId = subOpts.parentSubscriptionId,
        subscriptionSuffix = subOpts.subscriptionSuffix,
        suspend = subOpts.suspend;
    var subscriptionId = parentSubscriptionId + subscriptionSuffix;
    var preExistingContextForThisSubscription = opts.context.ongoingSubscriptionRecord[subscriptionId];

    if (!preExistingContextForThisSubscription) {
      opts.context.ongoingSubscriptionRecord[subscriptionId] = {};
    }

    var newQueryInfo;
    var newQueryDefinitionsAreAllNull;
    var preExistingQueryInfo = preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.queryInfo;

    if (preExistingQueryInfo) {
      var nonNullishQueryDefinitions = removeNullishQueryDefinitions(subOpts.queryDefinitions);

      if (Object.keys(nonNullishQueryDefinitions).length) {
        newQueryInfo = convertQueryDefinitionToQueryInfo({
          queryDefinitions: nonNullishQueryDefinitions,
          queryId: preExistingQueryInfo.queryId,
          useServerSidePaginationFilteringSorting: opts.useServerSidePaginationFilteringSorting
        });
      } else {
        newQueryDefinitionsAreAllNull = true;
        opts.context.updateSubscriptionInfo(subscriptionId, {
          queryInfo: null
        });
      }
    }

    var queryDefinitionHasBeenUpdated = newQueryDefinitionsAreAllNull || newQueryInfo && (!preExistingQueryInfo || preExistingQueryInfo.queryGQL !== newQueryInfo.queryGQL) || newQueryInfo && (!preExistingQueryInfo || preExistingQueryInfo.queryParamsString !== newQueryInfo.queryParamsString);

    if (preExistingContextForThisSubscription && !queryDefinitionHasBeenUpdated) {
      return preExistingContextForThisSubscription.suspendPromise;
    }

    if (queryDefinitionHasBeenUpdated) {
      preExistingContextForThisSubscription.unsub && preExistingContextForThisSubscription.unsub();
    }

    var queryTimestamp = new Date().valueOf();
    opts.context.updateSubscriptionInfo(subscriptionId, {
      querying: true,
      lastQueryTimestamp: queryTimestamp
    });
    opts.context.updateSubscriptionInfo(parentSubscriptionId, {
      querying: true
    });
    var setQuerying = (_opts$context$ongoing = opts.context.ongoingSubscriptionRecord[parentSubscriptionId]) == null ? void 0 : _opts$context$ongoing.setQuerying;
    setQuerying && setQuerying(true);
    opts.handlers.setQuerying(true);
    var suspendPromise = opts.context.mmGQLInstance.subscribe(queryDefinitions, {
      batchKey: subOpts.suspend ? 'suspended' : 'non-suspended',
      // Make sure to re-render the component on paginate
      onPaginate: function onPaginate() {
        var contextForThisParentSub = opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
        contextForThisParentSub.onResults && contextForThisParentSub.onResults(_extends({}, contextForThisParentSub.results));
      },
      onData: function onData(_ref2) {
        var newResults = _ref2.results;
        var contextforThisSub = opts.context.ongoingSubscriptionRecord[subscriptionId];
        var thisQueryIsMostRecent = (contextforThisSub == null ? void 0 : contextforThisSub.lastQueryTimestamp) === queryTimestamp;

        if (thisQueryIsMostRecent) {
          var contextForThisParentSub = opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
          contextForThisParentSub.onResults && contextForThisParentSub.onResults(_extends({}, contextForThisParentSub.results, newResults));
          opts.context.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
            results: _extends({}, contextForThisParentSub.results, newResults)
          });
        }
      },
      onError: function onError(error) {
        var contextForThisParentSub = opts.context.ongoingSubscriptionRecord[parentSubscriptionId];
        contextForThisParentSub.onError && contextForThisParentSub.onError(error);
        opts.context.updateSubscriptionInfo(subOpts.parentSubscriptionId, {
          error: error
        });
      },
      onSubscriptionInitialized: function onSubscriptionInitialized(subscriptionCanceller) {
        opts.context.updateSubscriptionInfo(subscriptionId, {
          unsub: function unsub() {
            return subscriptionCanceller();
          }
        });
        opts.context.updateSubscriptionInfo(parentSubscriptionId, {
          unsub: function unsub() {
            getAllSubscriptionStates().forEach(function (subscriptionState) {
              return (subscriptionState == null ? void 0 : subscriptionState.unsub) && subscriptionState.unsub();
            });
          }
        });
      },
      onQueryInfoConstructed: function onQueryInfoConstructed(queryInfo) {
        opts.context.updateSubscriptionInfo(subscriptionId, {
          queryInfo: queryInfo
        });
      }
    })["finally"](function () {
      var contextForThisSub = opts.context.ongoingSubscriptionRecord[subscriptionId];
      var thisQueryIsMostRecent = (contextForThisSub == null ? void 0 : contextForThisSub.lastQueryTimestamp) === queryTimestamp;

      if (thisQueryIsMostRecent) {
        opts.context.updateSubscriptionInfo(subscriptionId, {
          suspendPromise: undefined,
          querying: false
        }); // if all the queries have resolved, we can set "querying" to false for the parent subscription state

        var allQueriesHaveResolved = !getAllSubscriptionStates().some(function (state) {
          return state && state.querying;
        });

        if (allQueriesHaveResolved) {
          var _opts$context$ongoing2;

          opts.context.updateSubscriptionInfo(parentSubscriptionId, {
            querying: false
          });

          var _setQuerying = (_opts$context$ongoing2 = opts.context.ongoingSubscriptionRecord[parentSubscriptionId]) == null ? void 0 : _opts$context$ongoing2.setQuerying;

          _setQuerying && _setQuerying(false);
          opts.handlers.setQuerying(false);
        }
      }
    });

    if (!preExistingContextForThisSubscription && suspend) {
      opts.context.updateSubscriptionInfo(subscriptionId, {
        suspendPromise: suspendPromise
      });
      return suspendPromise;
    }
  }

  if (opts.data.error) throw opts.data.error;
  var suspendPromise;

  if (Object.keys(suspendDisabled).length) {
    try {
      handleNewQueryDefitions({
        queryDefinitions: suspendDisabled,
        parentSubscriptionId: parentSubscriptionId,
        subscriptionSuffix: subscriptionIds.suspendDisabled,
        suspend: false
      });
    } catch (e) {
      opts.handlers.onError(e);
      throw e;
    }
  }

  if (Object.keys(suspendEnabled).length) {
    try {
      suspendPromise = handleNewQueryDefitions({
        queryDefinitions: suspendEnabled,
        parentSubscriptionId: parentSubscriptionId,
        subscriptionSuffix: subscriptionIds.suspendEnabled,
        suspend: true
      });
    } catch (e) {
      opts.handlers.onError(e);
      throw e;
    }
  }

  if (suspendPromise) throw suspendPromise;
  return {
    data: opts.data.results,
    error: opts.data.error,
    querying: opts.data.querying,
    onHookUnmount: onHookUnmount,
    onHookMount: onHookMount
  };
}

require('isomorphic-fetch');
function getGQLCLient(gqlClientOpts) {
  var wsLink = new ws.WebSocketLink({
    uri: gqlClientOpts.wsUrl,
    options: {
      reconnect: true
    }
  });
  var nonBatchedLink = new http.HttpLink({
    uri: gqlClientOpts.httpUrl
  });
  var queryBatchLink = core.split(function (operation) {
    return operation.getContext().batchKey;
  }, new batchHttp.BatchHttpLink({
    uri: gqlClientOpts.httpUrl,
    batchMax: 50,
    batchInterval: 50,
    batchKey: function batchKey(operation) {
      var context = operation.getContext(); // This ensures that requests with different batch keys, headers and credentials
      // are batched separately

      return JSON.stringify({
        batchKey: context.batchKey,
        headers: context.headers,
        credentials: context.credentials
      });
    }
  }), nonBatchedLink);
  var mutationBatchLink = core.split(function (operation) {
    return operation.getContext().batchedMutation;
  }, new batchHttp.BatchHttpLink({
    uri: gqlClientOpts.httpUrl,
    // no batch max for explicitly batched mutations
    // to ensure transactional integrity
    batchMax: Number.MAX_SAFE_INTEGER,
    batchInterval: 0
  }), queryBatchLink);
  var requestLink = core.split( // split based on operation type
  function (_ref) {
    var query = _ref.query;
    var definition = utilities.getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  }, wsLink, mutationBatchLink);

  function getContextWithToken(opts) {
    return {
      headers: {
        Authorization: "Bearer " + opts.token
      }
    };
  }

  function authenticateSubscriptionDocument(opts) {
    var _opts$gql$loc;

    var documentBody = (_opts$gql$loc = opts.gql.loc) == null ? void 0 : _opts$gql$loc.source.body;

    if (!documentBody) {
      throw new Error('No documentBody found');
    }

    var operationsThatRequireToken = ['GetChildren', 'GetReferences', 'GetNodes', 'GetNodesNew', 'GetNodesById'];

    if (operationsThatRequireToken.some(function (operation) {
      return documentBody == null ? void 0 : documentBody.includes(operation + "(");
    })) {
      var documentBodyWithAuthTokensInjected = documentBody;
      operationsThatRequireToken.forEach(function (operation) {
        documentBodyWithAuthTokensInjected = documentBodyWithAuthTokensInjected.replace(new RegExp(operation + "\\((.*)\\)", 'g'), operation + "($1, authToken: \"" + opts.token + "\")");
      });
      return core.gql(documentBodyWithAuthTokensInjected);
    }

    return opts.gql;
  }

  var authLink = new core.ApolloLink(function (operation, forward) {
    return new core.Observable(function (observer) {
      var handle;
      Promise.resolve(operation).then(function () {
        handle = forward(operation).subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer)
        });
      })["catch"](observer.error.bind(observer));
      return function () {
        if (handle) handle.unsubscribe();
      };
    });
  });
  var baseClient = new core.ApolloClient({
    link: core.ApolloLink.from([authLink, requestLink]),
    cache: new core.InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore'
      },
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    }
  });
  var gqlClient = {
    query: function () {
      var _query = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(opts) {
        var _yield$baseClient$que, data;

        return runtime_1.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return baseClient.query({
                  query: opts.gql,
                  context: _extends({
                    // allow turning off batching by specifying a null or undefined batchKey
                    // but by default, batch all requests into the same request batch
                    batchKey: 'batchKey' in opts ? opts.batchKey : 'default'
                  }, getContextWithToken({
                    token: opts.token
                  }))
                });

              case 2:
                _yield$baseClient$que = _context.sent;
                data = _yield$baseClient$que.data;
                return _context.abrupt("return", data);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function query(_x) {
        return _query.apply(this, arguments);
      }

      return query;
    }(),
    subscribe: function subscribe(opts) {
      var subscription = baseClient.subscribe({
        query: authenticateSubscriptionDocument(opts)
      }).subscribe({
        next: function next(message) {
          if (!message.data) opts.onError(new Error("Unexpected message structure.\n" + message));else opts.onMessage(message.data);
        },
        error: opts.onError
      });
      return function () {
        return subscription.unsubscribe();
      };
    },
    mutate: function () {
      var _mutate = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(opts) {
        return runtime_1.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 3;
                return Promise.all(opts.mutations.map(function (mutation) {
                  return baseClient.mutate({
                    mutation: mutation,
                    context: _extends({
                      batchedMutation: true
                    }, getContextWithToken({
                      token: opts.token
                    }))
                  });
                }));

              case 3:
                return _context2.abrupt("return", _context2.sent);

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function mutate(_x2) {
        return _mutate.apply(this, arguments);
      }

      return mutate;
    }()
  };
  return gqlClient;
}

function getDefaultConfig() {
  return {
    gqlClient: getGQLCLient({
      httpUrl: 'http://bloom-app-loadbalancer-dev-524448015.us-west-2.elb.amazonaws.com/graphql/',
      wsUrl: 'ws://bloom-app-loadbalancer-dev-524448015.us-west-2.elb.amazonaws.com/graphql/'
    }),
    generateMockData: false,
    enableQuerySlimming: false,
    enableQuerySlimmingLogging: false,
    paginationFilteringSortingInstance: exports.EPaginationFilteringSortingInstance.SERVER
  };
}

var _templateObject$6, _templateObject2$1;
function updateNodes(operation) {
  return _extends({
    type: 'updateNodes',
    operationName: 'UpdateNodes'
  }, operation);
}
function updateNode(operation) {
  return _extends({
    type: 'updateNode',
    operationName: 'UpdateNodes'
  }, operation);
}

function getPropertiesToNull(object) {
  return Object.entries(object).reduce(function (acc, _ref) {
    var key = _ref[0],
        value = _ref[1];
    if (value == null) acc.push(key);else if (!Array.isArray(value) && typeof value === 'object') {
      acc.push.apply(acc, getPropertiesToNull(value).map(function (property) {
        return "" + key + OBJECT_PROPERTY_SEPARATOR + property;
      }));
    }
    return acc;
  }, []);
}

function getMutationsFromTransactionUpdateOperations(operations) {
  if (!operations.length) return [];
  var allUpdateNodeOperations = operations.flatMap(function (operation) {
    if (operation.type === 'updateNode') {
      return operation.data;
    } else if (operation.type === 'updateNodes') {
      return operation.nodes.map(function (_ref2) {
        var data = _ref2.data;
        return data;
      });
    } else {
      throw Error("Operation not recognized: \"" + operation + "\"");
    }
  });
  var name = getMutationNameFromOperations(operations, 'UpdateNodes');
  var dropPropertiesMutations = allUpdateNodeOperations.reduce(function (acc, updateNodeOperation) {
    var propertiesToNull = getPropertiesToNull(updateNodeOperation);

    if (propertiesToNull.length) {
      acc.push(core.gql(_templateObject$6 || (_templateObject$6 = _taggedTemplateLiteralLoose(["\n        mutation {\n          DropProperties(\n            nodeIds: [\"", "\"]\n            propertyNames: [", "]\n            transactional: true\n          )\n          { \n            id\n          }\n      }\n      "])), updateNodeOperation.id, propertiesToNull.map(function (prop) {
        return "\"" + prop + OBJECT_PROPERTY_SEPARATOR + "*\"";
      }).join(',')));
    }

    return acc;
  }, []); // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations

  return [core.gql(_templateObject2$1 || (_templateObject2$1 = _taggedTemplateLiteralLoose(["\n        mutation ", " {\n          UpdateNodes(\n            nodes: [\n              ", "\n            ]\n            transactional: true\n          ) {\n            id\n          }\n        }\n      "])), name, allUpdateNodeOperations.map(convertUpdateNodeOperationToUpdateNodesMutationArguments).join('\n'))].concat(dropPropertiesMutations);
}

function convertUpdateNodeOperationToUpdateNodesMutationArguments(operation) {
  var dataToPersist = convertNodeDataToSMPersistedData(operation);
  return "{\n      " + dataToPersist + "\n    }";
}

var _templateObject$7;
function dropNode(operation) {
  return _extends({
    type: 'dropNode',
    operationName: 'DropNode'
  }, operation);
}
function getMutationsFromTransactionDropOperations(operations) {
  if (!operations.length) return [];
  var allDropNodeOperations = operations.map(function (operation) {
    if (operation.type === 'dropNode') {
      return operation;
    } else {
      throw Error("Operation not recognized: \"" + operation + "\"");
    }
  });
  return allDropNodeOperations.map(function (operation) {
    var name = getMutationNameFromOperations([operation], 'DropNode');
    return core.gql(_templateObject$7 || (_templateObject$7 = _taggedTemplateLiteralLoose(["\n      mutation ", " {\n        DropNode(nodeId: \"", "\", transactional: true)\n      }    \n    "])), name, operation.id);
  });
}

function createTransaction(mmGQLInstance, globalOperationHandlers) {
  /**
   * A transaction allows developers to build groups of mutations that execute with transactional integrity
   *   this means if one mutation fails, others are cancelled and any graph state changes are rolled back.
   *
   * The callback function can return a promise if the transaction requires some data fetching to build its list of operations.
   */
  return function transaction(callback, opts) {
    var operationsByType = {
      createNode: [],
      createNodes: [],
      updateNode: [],
      updateNodes: [],
      dropNode: [],
      createEdge: [],
      createEdges: [],
      dropEdge: [],
      dropEdges: [],
      replaceEdge: [],
      replaceEdges: [],
      updateEdge: [],
      updateEdges: []
    };
    /**
     * Keeps track of the number of operations performed in this transaction (for operations that we need to provide callback data for).
     * This is used to store each operation's order in the transaction so that we can map it to the response we get back from the backend.
     * The backend responds with each operation in the order they were sent up.
     */

    var createOperationsCount = 0;
    var updateOperationsCount = 0;

    function pushOperation(operation) {
      if (!operationsByType[operation.type]) {
        throw Error("No operationsByType array initialized for \"" + operation.type + "\"");
      }
      /**
       * createNodes/updateNodes creates multiple nodes in a single operation,
       * therefore we need to track the position of these nodes instead of just the position of the operation itself
       */


      if (operation.type === 'createNodes') {
        createOperationsCount += 1;
        operationsByType[operation.type].push(_extends({}, operation, {
          position: createOperationsCount,
          nodes: operation.nodes.map(function (node, idx) {
            return _extends({}, node, {
              position: idx === 0 ? createOperationsCount : createOperationsCount += 1
            });
          })
        }));
      } else if (operation.type === 'createNode') {
        createOperationsCount += 1;
        operationsByType[operation.type].push(_extends({}, operation, {
          position: createOperationsCount
        }));
      } else if (operation.type === 'updateNodes') {
        updateOperationsCount += 1;
        operationsByType[operation.type].push(_extends({}, operation, {
          position: updateOperationsCount,
          nodes: operation.nodes.map(function (node, idx) {
            return _extends({}, node, {
              position: idx === 0 ? updateOperationsCount : updateOperationsCount += 1
            });
          })
        }));
      } else if (operation.type === 'updateNode') {
        updateOperationsCount += 1;
        operationsByType[operation.type].push(_extends({}, operation, {
          position: updateOperationsCount
        }));
      } else {
        operationsByType[operation.type].push(operation);
      }
    }

    var context = {
      createNode: function createNode$1(opts) {
        var operation = createNode(opts);

        pushOperation(operation);
        return operation;
      },
      createNodes: function createNodes$1(opts) {
        var operation = createNodes(opts);

        pushOperation(operation);
        return operation;
      },
      updateNode: function updateNode$1(opts) {
        var operation = updateNode(opts);

        var _globalOperationHandl = globalOperationHandlers.onUpdateRequested({
          id: opts.data.id,
          payload: opts.data
        }),
            onUpdateSuccessful = _globalOperationHandl.onUpdateSuccessful,
            onUpdateFailed = _globalOperationHandl.onUpdateFailed;

        pushOperation(_extends({}, operation, {
          onSuccess: function onSuccess(data) {
            operation.onSuccess && operation.onSuccess(data);
            onUpdateSuccessful();
          },
          onFail: function onFail() {
            operation.onFail && operation.onFail();
            onUpdateFailed();
          }
        }));
        return operation;
      },
      updateNodes: function updateNodes$1(opts) {
        var operation = updateNodes(opts);

        var globalHandlers = opts.nodes.map(function (node) {
          return globalOperationHandlers.onUpdateRequested({
            id: node.data.id,
            payload: node.data
          });
        });
        pushOperation(_extends({}, operation, {
          nodes: operation.nodes.map(function (node, nodeIdx) {
            return _extends({}, node, {
              onSuccess: function onSuccess(data) {
                node.onSuccess && node.onSuccess(data);
                globalHandlers[nodeIdx].onUpdateSuccessful();
              },
              onFail: function onFail() {
                node.onFail && node.onFail();
                globalHandlers[nodeIdx].onUpdateFailed();
              }
            });
          })
        }));
        return operation;
      },
      dropNode: function dropNode$1(opts) {
        var operation = dropNode(opts);

        pushOperation(operation);
        return operation;
      },
      createEdge: function createEdge$1(opts) {
        var operation = createEdge(opts);

        pushOperation(operation);
        return operation;
      },
      createEdges: function createEdges$1(opts) {
        var operation = createEdges(opts);

        pushOperation(operation);
        return operation;
      },
      dropEdge: function dropEdge$1(opts) {
        var operation = dropEdge(opts);

        pushOperation(operation);
        return operation;
      },
      dropEdges: function dropEdges$1(opts) {
        var operation = dropEdges(opts);

        pushOperation(operation);
        return operation;
      },
      updateEdge: function updateEdge$1(opts) {
        var operation = updateEdge(opts);

        pushOperation(operation);
        return operation;
      },
      updateEdges: function updateEdges$1(opts) {
        var operation = updateEdges(opts);

        pushOperation(operation);
        return operation;
      },
      replaceEdge: function replaceEdge$1(opts) {
        var operation = replaceEdge(opts);

        pushOperation(operation);
        return operation;
      },
      replaceEdges: function replaceEdges$1(opts) {
        var operation = replaceEdges(opts);

        pushOperation(operation);
        return operation;
      }
    };

    function sortMutationsByTransactionPosition(operations) {
      return lodash.sortBy(operations, function (operation) {
        return operation.position;
      });
    }

    function getAllMutations(operations) {
      return [].concat(getMutationsFromTransactionCreateOperations(sortMutationsByTransactionPosition([].concat(operations.createNode, operations.createNodes))), getMutationsFromTransactionUpdateOperations(sortMutationsByTransactionPosition([].concat(operations.updateNode, operations.updateNodes))), getMutationsFromTransactionDropOperations([].concat(operations.dropNode)), getMutationsFromEdgeCreateOperations([].concat(operations.createEdge, operations.createEdges)), getMutationsFromEdgeDropOperations([].concat(operations.dropEdge, operations.dropEdges)), getMutationsFromEdgeReplaceOperations([].concat(operations.replaceEdge, operations.replaceEdges)), getMutationsFromEdgeUpdateOperations([].concat(operations.updateEdge, operations.updateEdges)));
    }

    var tokenName = (opts == null ? void 0 : opts.tokenName) || DEFAULT_TOKEN_NAME;
    var token = mmGQLInstance.getToken({
      tokenName: tokenName
    });
    /**
     * Group operations by their operation name, sorted by position if applicable
     */

    function groupByOperationName(operations) {
      var result = Object.entries(operations).reduce(function (acc, _ref) {
        var operations = _ref[1];
        operations.forEach(function (operation) {
          if (acc.hasOwnProperty(operation.operationName)) {
            acc[operation.operationName] = [].concat(acc[operation.operationName], [operation]);
          } else {
            acc[operation.operationName] = [operation];
          }
        });
        return acc;
      }, {});
      Object.entries(result).forEach(function (_ref2) {
        var operationName = _ref2[0],
            operations = _ref2[1];
        result[operationName] = lodash.sortBy(operations, function (operation) {
          return operation.position;
        });
      });
      return result;
    }

    if (Array.isArray(callback)) {
      return transactionGroup(callback);
    }

    var result = callback(context);

    function handleErrorCallbacks(opts) {
      var operationsByType = opts.operationsByType;
      var operationsByOperationName = groupByOperationName(operationsByType);
      Object.entries(operationsByOperationName).forEach(function (_ref3) {
        var operationName = _ref3[0],
            operations = _ref3[1];
        operations.forEach(function (operation) {
          // we only need to gather the data for node create/update operations
          if (operationName === 'CreateNodes' || operationName === 'UpdateNodes') {
            // for createNodes, execute callback on each individual node rather than top-level operation
            if (operation.hasOwnProperty('nodes')) {
              operation.nodes.forEach(function (node) {
                if (node.hasOwnProperty('onFail')) {
                  node.onFail();
                }
              });
            } else if (operation.hasOwnProperty('onFail')) {
              operation.onFail();
            }
          }
        });
      });
    }

    function handleSuccessCallbacks(opts) {
      var executionResult = opts.executionResult,
          operationsByType = opts.operationsByType;
      var operationsByOperationName = groupByOperationName(operationsByType);
      /**
       * Loop through the operations, map the operation to each result sent back from the backend,
       * then pass the result into the callback if it exists
       */

      var executeCallbacksWithData = function executeCallbacksWithData(executionResult) {
        executionResult.forEach(function (result) {
          // if executionResult is 2d array
          if (Array.isArray(result)) {
            executeCallbacksWithData(result);
          } else {
            var resultData = result.data;
            Object.entries(operationsByOperationName).forEach(function (_ref4) {
              var operationName = _ref4[0],
                  operations = _ref4[1];

              if (resultData.hasOwnProperty(operationName)) {
                operations.forEach(function (operation) {
                  // we only need to gather the data for node create/update operations
                  if (operationName === 'CreateNodes' || operationName === 'UpdateNodes') {
                    var groupedResult = resultData[operationName]; // for createNodes, execute callback on each individual node rather than top-level operation

                    if (operation.hasOwnProperty('nodes')) {
                      operation.nodes.forEach(function (node) {
                        if (node.hasOwnProperty('onSuccess')) {
                          var operationResult = groupedResult[node.position - 1];
                          node.onSuccess(operationResult);
                        }
                      });
                    } else if (operation.hasOwnProperty('onSuccess')) {
                      var operationResult = groupedResult[operation.position - 1];
                      operation.onSuccess(operationResult);
                    }
                  }
                });
              }
            });
          }
        });
      };

      executeCallbacksWithData(executionResult);
      /**
       * For all other operations, just invoke the callback with no args.
       * Transactions will guarantee that all operations have succeeded, so this is safe to do
       */

      Object.entries(operationsByOperationName).forEach(function (_ref5) {
        var operationName = _ref5[0],
            operations = _ref5[1];

        if (operationName !== 'CreateNodes' && operationName !== 'UpdateNodes') {
          operations.forEach(function (operation) {
            if (operation.hasOwnProperty('onSuccess')) {
              operation.onSuccess();
            } else if (operation.hasOwnProperty('edges')) {
              operation.edges.forEach(function (edgeOperation) {
                if (edgeOperation.hasOwnProperty('onSuccess')) {
                  edgeOperation.onSuccess();
                }
              });
            }
          });
        }
      });
    }

    function execute() {
      return _execute.apply(this, arguments);
    }

    function _execute() {
      _execute = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2() {
        var mutations, executionResult;
        return runtime_1.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;

                if (!(typeof callback === 'function')) {
                  _context2.next = 5;
                  break;
                }

                if (!(result instanceof Promise)) {
                  _context2.next = 5;
                  break;
                }

                _context2.next = 5;
                return result;

              case 5:
                mutations = getAllMutations(operationsByType);
                _context2.next = 8;
                return mmGQLInstance.gqlClient.mutate({
                  mutations: mutations,
                  token: token
                });

              case 8:
                executionResult = _context2.sent;

                if (executionResult) {
                  handleSuccessCallbacks({
                    executionResult: executionResult,
                    operationsByType: operationsByType
                  });
                }

                return _context2.abrupt("return", executionResult);

              case 13:
                _context2.prev = 13;
                _context2.t0 = _context2["catch"](0);
                handleErrorCallbacks({
                  operationsByType: operationsByType
                });
                throw _context2.t0;

              case 17:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, null, [[0, 13]]);
      }));
      return _execute.apply(this, arguments);
    }

    return {
      operations: operationsByType,
      execute: execute,
      callbackResult: result,
      token: token
    };

    function transactionGroup(transactions) {
      var asyncCallbacks = transactions.filter(function (tx) {
        return tx.callbackResult instanceof Promise;
      }).map(function (_ref6) {
        var callbackResult = _ref6.callbackResult;
        return callbackResult;
      });

      function execute() {
        return _execute2.apply(this, arguments);
      }

      function _execute2() {
        _execute2 = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee() {
          var allTokensMatch, allMutations, executionResults;
          return runtime_1.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  allTokensMatch = transactions.every(function (_ref7) {
                    var token = _ref7.token;
                    return token === transactions[0].token;
                  });

                  if (allTokensMatch) {
                    _context.next = 4;
                    break;
                  }

                  throw new Error('transactionGroup - All grouped transactions must use the same authentication token.');

                case 4:
                  if (!asyncCallbacks.length) {
                    _context.next = 7;
                    break;
                  }

                  _context.next = 7;
                  return Promise.all(asyncCallbacks);

                case 7:
                  allMutations = transactions.map(function (_ref8) {
                    var operations = _ref8.operations;
                    return mmGQLInstance.gqlClient.mutate({
                      mutations: getAllMutations(operations),
                      token: token
                    });
                  });
                  _context.next = 10;
                  return Promise.all(allMutations);

                case 10:
                  executionResults = _context.sent;

                  if (executionResults) {
                    executionResults.forEach(function (result, idx) {
                      handleSuccessCallbacks({
                        executionResult: result,
                        operationsByType: transactions[idx].operations
                      });
                    });
                  }

                  return _context.abrupt("return", executionResults.flat());

                case 15:
                  _context.prev = 15;
                  _context.t0 = _context["catch"](0);
                  throw _context.t0;

                case 18:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[0, 15]]);
        }));
        return _execute2.apply(this, arguments);
      }

      return {
        operations: operationsByType,
        execute: execute,
        token: token
      };
    }
  };
}

var MMGQL = /*#__PURE__*/function () {
  function MMGQL(config) {
    this.gqlClient = void 0;
    this.generateMockData = void 0;
    this.getMockDataDelay = void 0;
    this.enableQuerySlimming = void 0;
    this.enableQuerySlimmingLogging = void 0;
    this.paginationFilteringSortingInstance = void 0;
    this.plugins = void 0;
    this.query = void 0;
    this.subscribe = void 0;
    this.QueryManager = void 0;
    this.QuerySlimmer = void 0;
    this.transaction = void 0;
    this.tokens = {};
    this.DOFactory = void 0;
    this.DOProxyGenerator = void 0;
    this.optimisticUpdatesOrchestrator = void 0;
    this.gqlClient = config.gqlClient;
    this.generateMockData = config.generateMockData;
    this.getMockDataDelay = config.getMockDataDelay;
    this.enableQuerySlimming = config.enableQuerySlimming;
    this.enableQuerySlimmingLogging = config.enableQuerySlimmingLogging;
    this.paginationFilteringSortingInstance = config.paginationFilteringSortingInstance;
    this.plugins = config.plugins;
    this.query = generateQuerier({
      mmGQLInstance: this
    });
    this.subscribe = generateSubscriber(this);
    this.DOProxyGenerator = createDOProxyGenerator(this);
    this.DOFactory = createDOFactory(this);
    this.QueryManager = createQueryManager(this);
    this.QuerySlimmer = new QuerySlimmer(this);
    this.optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();
    this.transaction = createTransaction(this, {
      onUpdateRequested: this.optimisticUpdatesOrchestrator.onUpdateRequested
    });

    if (config.generateMockData && config.paginationFilteringSortingInstance === exports.EPaginationFilteringSortingInstance.SERVER) {
      throw Error("mmGQL was told to generate mock data and use \"SERVER\" pagination/filtering/sorting. Switch paginationFilteringSortingInstance to \"CLIENT\"");
    }
  }

  var _proto = MMGQL.prototype;

  _proto.def = function def(_def) {
    if (_def.type.includes('-') || _def.type.includes('.')) {
      throw new Error('Node types cannot include hyphens or dots');
    }

    var propertyNames = Object.keys(_def.properties);
    var defaultProp = propertyNames.find(function (x) {
      return Object.keys(DEFAULT_NODE_PROPERTIES).includes(x);
    });

    if (defaultProp) {
      throw new ImpliedNodePropertyException({
        propName: defaultProp
      });
    }

    var properties = this.addDefaultNodeProperties(_def.properties);

    var defWithDefaultProperties = _extends({}, _def, {
      properties: properties
    });

    var DOClass = this.DOFactory(defWithDefaultProperties);
    return {
      _isNodeDef: true,
      "do": DOClass,
      repository: RepositoryFactory({
        def: defWithDefaultProperties,
        DOClass: DOClass,
        onDOConstructed: this.optimisticUpdatesOrchestrator.onDOConstructed,
        onDODeleted: this.optimisticUpdatesOrchestrator.onDODeleted,
        onDataReceived: this.optimisticUpdatesOrchestrator.onPersistedDataReceived
      }),
      type: _def.type,
      data: properties,
      computed: _def.computed,
      relational: _def.relational,
      generateMockData: _def.generateMockData
    };
  } // This is simply an easier to consume version of the "def" function above
  // if explicit types are needed
  //
  ;

  _proto.defTyped = function defTyped(def) {
    return this.def(def);
  };

  _proto.getToken = function getToken(opts) {
    return this.tokens[opts.tokenName];
  };

  _proto.setToken = function setToken(opts) {
    this.tokens[opts.tokenName] = opts.token;
  };

  _proto.clearTokens = function clearTokens() {
    this.tokens = {};
  };

  _proto.addDefaultNodeProperties = function addDefaultNodeProperties(nodeProperties) {
    return _extends({}, nodeProperties, DEFAULT_NODE_PROPERTIES);
  };

  return MMGQL;
}();

Object.defineProperty(exports, 'gql', {
  enumerable: true,
  get: function () {
    return client.gql;
  }
});
exports.DEFAULT_NODE_PROPERTIES = DEFAULT_NODE_PROPERTIES;
exports.DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
exports.DEFAULT_TOKEN_NAME = DEFAULT_TOKEN_NAME;
exports.Data = Data;
exports.LoggingContext = LoggingContext;
exports.MMGQL = MMGQL;
exports.MMGQLContext = MMGQLContext;
exports.MMGQLProvider = MMGQLProvider;
exports.NODES_PROPERTY_KEY = NODES_PROPERTY_KEY;
exports.NodesCollection = NodesCollection;
exports.OBJECT_IDENTIFIER = OBJECT_IDENTIFIER;
exports.OBJECT_PROPERTY_SEPARATOR = OBJECT_PROPERTY_SEPARATOR;
exports.PAGE_INFO_PROPERTY_KEY = PAGE_INFO_PROPERTY_KEY;
exports.PROPERTIES_QUERIED_FOR_ALL_NODES = PROPERTIES_QUERIED_FOR_ALL_NODES;
exports.RELATIONAL_UNION_QUERY_SEPARATOR = RELATIONAL_UNION_QUERY_SEPARATOR;
exports.TOTAL_COUNT_PROPERTY_KEY = TOTAL_COUNT_PROPERTY_KEY;
exports.UnsafeNoDuplicateSubIdErrorProvider = UnsafeNoDuplicateSubIdErrorProvider;
exports.array = array;
exports.boolean = _boolean;
exports.chance = chance;
exports.chunkArray = chunkArray;
exports.generateRandomBoolean = generateRandomBoolean;
exports.generateRandomNumber = generateRandomNumber;
exports.generateRandomString = generateRandomString;
exports.getDefaultConfig = getDefaultConfig;
exports.getGQLCLient = getGQLCLient;
exports.number = number;
exports.object = object;
exports.oneToMany = oneToMany;
exports.oneToOne = oneToOne;
exports.queryDefinition = queryDefinition;
exports.record = record;
exports.string = string;
exports.stringEnum = stringEnum;
exports.useSubscription = useSubscription;
//# sourceMappingURL=sm-js.cjs.development.js.map
