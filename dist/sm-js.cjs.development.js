'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var core = require('@apollo/client/core');
var lodash = require('lodash');
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

// thrown when any property on the DO is accessed but is not marked as upToDate
// by calling DO.setUpToDateData({ [propName]: true })
// or DO.setUpToDateData({ nested: { [propName]: true } })
// this is done automatically by smData fetchers, smQuery and smSubscribe
// so this error should only occur when data is accessed but was never queried or is not currently being subscribed to (is cached only)
var SMNotUpToDateException = /*#__PURE__*/function (_Error) {
  _inheritsLoose(SMNotUpToDateException, _Error);

  function SMNotUpToDateException(opts) {
    var _this;

    _this = _Error.call(this, "SMNotUpToDate exception - The property \"" + opts.propName + "\" on the DO for the node type " + opts.nodeType + " was read but is not guaranteed to be up to date. Add that property to the query with the id " + opts.queryId) || this;
    _this.propName = void 0;
    _this.propName = opts.propName;
    return _this;
  }

  return SMNotUpToDateException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SMNotUpToDateInComputedException = /*#__PURE__*/function (_Error2) {
  _inheritsLoose(SMNotUpToDateInComputedException, _Error2);

  function SMNotUpToDateInComputedException(opts) {
    return _Error2.call(this, "SMNotUpToDateInComputed exception - The property \"" + opts.propName + "\" on the DO for the node type \"" + opts.nodeType + "\" was read for the computed property \"" + opts.computedPropName + "\" but is not guaranteed to be up to date. Add that property to the query with the id " + opts.queryId) || this;
  }

  return SMNotUpToDateInComputedException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SMNotCachedException = /*#__PURE__*/function (_Error3) {
  _inheritsLoose(SMNotCachedException, _Error3);

  function SMNotCachedException(opts) {
    return _Error3.call(this, "SMNotCached exception - Attempted to get the node with the type \"" + opts.nodeType + "\" and id \"" + opts.id + "\" but it was not cached.") || this;
  }

  return SMNotCachedException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SMDataTypeException = /*#__PURE__*/function (_Error4) {
  _inheritsLoose(SMDataTypeException, _Error4);

  function SMDataTypeException(opts) {
    return _Error4.call(this, "SMDataType exception - the data type " + opts.dataType + " received a bad value. Value: \"" + opts.value + "\"") || this;
  }

  return SMDataTypeException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SMDataTypeExplicitDefaultException = /*#__PURE__*/function (_Error5) {
  _inheritsLoose(SMDataTypeExplicitDefaultException, _Error5);

  function SMDataTypeExplicitDefaultException(opts) {
    return _Error5.call(this, "SMDataTypeExplicitDefaultException - the data type " + opts.dataType + " requires setting an explicit default value for non-optional properties") || this;
  }

  return SMDataTypeExplicitDefaultException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SMDataParsingException = /*#__PURE__*/function (_Error6) {
  _inheritsLoose(SMDataParsingException, _Error6);

  function SMDataParsingException(opts) {
    return _Error6.call(this, "SMDataParsing exception - " + opts.message + "\nData: " + JSON.stringify(opts.receivedData, null, 2) + ".") || this;
  }

  return SMDataParsingException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var SMUnexpectedSubscriptionMessageException = /*#__PURE__*/function (_Error7) {
  _inheritsLoose(SMUnexpectedSubscriptionMessageException, _Error7);

  function SMUnexpectedSubscriptionMessageException(exception) {
    var _this2;

    _this2 = _Error7.call(this, "SMUnexpectedSubscriptionMessage exception - unexpected subscription message received") || this;
    _this2.exception = void 0;
    _this2.exception = exception;
    return _this2;
  }

  return SMUnexpectedSubscriptionMessageException;
}( /*#__PURE__*/_wrapNativeSuper(Error));
function throwLocallyLogInProd(error) {
  var _process, _process$env;

  if (((_process = process) == null ? void 0 : (_process$env = _process.env) == null ? void 0 : _process$env.NODE_ENV) !== 'production') {
    throw error;
  } else {
    console.error(error);
  }
}

var SM_DATA_TYPES;

(function (SM_DATA_TYPES) {
  SM_DATA_TYPES["string"] = "s";
  SM_DATA_TYPES["maybeString"] = "mS";
  SM_DATA_TYPES["number"] = "n";
  SM_DATA_TYPES["maybeNumber"] = "mN";
  SM_DATA_TYPES["boolean"] = "b";
  SM_DATA_TYPES["maybeBoolean"] = "mB";
  SM_DATA_TYPES["object"] = "o";
  SM_DATA_TYPES["maybeObject"] = "mO";
  SM_DATA_TYPES["record"] = "r";
  SM_DATA_TYPES["maybeRecord"] = "mR";
  SM_DATA_TYPES["array"] = "a";
  SM_DATA_TYPES["maybeArray"] = "mA";
})(SM_DATA_TYPES || (SM_DATA_TYPES = {}));

var SM_RELATIONAL_TYPES;

(function (SM_RELATIONAL_TYPES) {
  SM_RELATIONAL_TYPES["byReference"] = "bR";
  SM_RELATIONAL_TYPES["children"] = "bP";
})(SM_RELATIONAL_TYPES || (SM_RELATIONAL_TYPES = {}));

var SMData = function SMData(opts) {
  var _opts$defaultValue;

  this.type = void 0;
  this.parser = void 0;
  this.boxedValue = void 0;
  this.defaultValue = void 0;
  this.isOptional = void 0;
  this.type = opts.type;
  this.parser = opts.parser;
  this.boxedValue = opts.boxedValue;
  this.defaultValue = (_opts$defaultValue = opts.defaultValue) != null ? _opts$defaultValue : null;
  this.isOptional = opts.isOptional;
};
/**
 * smData serve 2 purposes:
 * 1) they convert strings from SM into their real types (objects, strings, numbers, booleans)
 * 2) they serve as a way for TS to infer the data type of the node based on the smData types used,
 */

var string = function string(defaultValue) {
  return new SMData({
    type: SM_DATA_TYPES.string,
    parser: function parser(value) {
      return value != null ? String(value) : value;
    },
    defaultValue: defaultValue,
    isOptional: false
  });
};
string._default = /*#__PURE__*/string('');
string.optional = /*#__PURE__*/new SMData({
  type: SM_DATA_TYPES.maybeString,
  parser: function parser(value) {
    return value != null ? String(value) : value;
  },
  isOptional: true
});
var number = function number(defaultValue) {
  return new SMData({
    type: SM_DATA_TYPES.number,
    parser: function parser(value) {
      var parsed = Number(value);

      if (isNaN(parsed)) {
        throwLocallyLogInProd(new SMDataTypeException({
          dataType: SM_DATA_TYPES.number,
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
number.optional = /*#__PURE__*/new SMData({
  type: SM_DATA_TYPES.maybeNumber,
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
    return new SMDataTypeExplicitDefaultException({
      dataType: SM_DATA_TYPES["boolean"]
    });
  }

  return new SMData({
    type: SM_DATA_TYPES["boolean"],
    parser: function parser(value) {
      if (value === 'true' || value === true) {
        return true;
      } else if (value === 'false' || value === false) {
        return false;
      } else {
        throw new SMDataTypeException({
          dataType: SM_DATA_TYPES["boolean"],
          value: value
        });
      }
    },
    defaultValue: defaultValue,
    isOptional: false
  });
}; // need this in order to trigger an error when a user doesn't provide a default
_boolean._default = /*#__PURE__*/_boolean();
_boolean.optional = /*#__PURE__*/new SMData({
  type: SM_DATA_TYPES.maybeBoolean,
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
  return new SMData({
    type: SM_DATA_TYPES.object,

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
  return new SMData({
    type: SM_DATA_TYPES.maybeObject,

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
  return new SMData({
    type: SM_DATA_TYPES.record,
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
  return new SMData({
    type: SM_DATA_TYPES.maybeRecord,
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

  function smArray(defaultValue) {
    return new SMData({
      type: SM_DATA_TYPES.array,
      parser: function parser(value) {
        return value;
      },
      boxedValue: parsedBoxedValue,
      defaultValue: defaultValue,
      isOptional: false
    });
  }

  smArray.optional = new SMData({
    type: SM_DATA_TYPES.maybeArray,
    parser: function parser(value) {
      return value;
    },
    boxedValue: parsedBoxedValue,
    isOptional: true
  });
  smArray._default = smArray([]);
  return smArray;
};
var reference = function reference(opts) {
  return function (queryBuilderOpts) {
    return _extends({}, opts, {
      idProp: opts.idProp.replaceAll('.', OBJECT_PROPERTY_SEPARATOR),
      _smRelational: SM_RELATIONAL_TYPES.byReference,
      queryBuilderOpts: queryBuilderOpts
    });
  };
};
var children = function children(opts) {
  return function (queryBuilderOpts) {
    return _extends({}, opts, {
      _smRelational: SM_RELATIONAL_TYPES.children,
      map: queryBuilderOpts.map,
      depth: opts.depth
    });
  };
};
var OBJECT_PROPERTY_SEPARATOR = '__dot__';
var OBJECT_IDENTIFIER = '__object__'; // HACK ALERT! Exists only to make TS work the way we need it
// It makes it possible to accept multiple node types within a record of query definitions, without losing type safety
// See this for a simplified example https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABBBwYHMA8ARAhlXAFQE8AHAUwD4AKFMNdALkQHkBbGKTASQGUYw6ADbkAwqgw58RMlQA0iAOQB9ZTADOJCr1zByAVXXlCACzET0AMXDR4YAIT3FlAJTM+A4efqS8BLVSIAN4AUIiIAE7kUCARSEEAdEl0DHIqapqyOnqGxmbiPlY2sAiOisxQESDkiAC+IfUhAlDkEcC4EDXchHAAJnB+uMFhiDC9zOqVniME6gDWE1OCDSEhdJOIUH0D0u49-YOIALzBo+NKAIwATADMigqzC0r9m2aIveTkvYp1q1CyiAAitUIsRLGApP5ZJRjohqL1dohBgEXMcYQAFXARWC4ISQmQUSirZqtdqdRAeQQiAoMfEBGGhcLhdIaALZAxGUzeBjWSAlBxOCpVchyEbhBEEZjI2SipmIACOIOIzGBrTBEOlhJWTTALTaHS6AFkQEJYDSMMNwgBtObkZWISYRTwAXXc-Cp3MkuDAxCJjXWUEQbGIADk+uRBu5jaaYOb0LDGYgQEYIpptupmInxYitgdpLKmYq1cxqEEzg9cPM6qijjDS+XNpW5tWRrUC7ihPs4BnkBZS2L3jntoMC+Ei6CS2WxhWq7Ua3Wp70Z82562XCsgA

function queryDefinition(queryDefinition) {
  return queryDefinition;
}

var _excluded = ["to"],
    _excluded2 = ["from"];
var JSON_TAG$1 = '__JSON__';
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

function escapeText(text) {
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

    if (typeof val === 'object' && val != null) {
      if (!opts || !opts.omitObjectIdentifier) {
        acc[preparedKey] = OBJECT_IDENTIFIER;
      }

      acc = _extends({}, acc, prepareObjectForBE(val, _extends({}, opts, {
        parentKey: preparedKey
      })));
    } else {
      acc[preparedKey] = val;
    }

    return acc;
  }, {});
}

function convertPropertyToBE(opts) {
  if (opts.value === null) {
    var _ref3;

    return _ref3 = {}, _ref3[opts.key] = null, _ref3;
  } else if (Array.isArray(opts.value)) {
    var _ref4;

    return _ref4 = {}, _ref4[opts.key] = "" + JSON_TAG$1 + escapeText(JSON.stringify(opts.value)), _ref4;
  } else if (typeof opts.value === 'object') {
    var _prepareObjectForBE;

    return prepareObjectForBE((_prepareObjectForBE = {}, _prepareObjectForBE[opts.key] = opts.value, _prepareObjectForBE));
  } else if (typeof opts.value === 'string') {
    var _ref5;

    return _ref5 = {}, _ref5[opts.key] = escapeText(opts.value), _ref5;
  } else if (typeof opts.value === 'boolean' || typeof opts.value === 'number') {
    var _ref7;

    if (typeof opts.value === 'number' && isNaN(opts.value)) {
      var _ref6;

      return _ref6 = {}, _ref6[opts.key] = null, _ref6;
    }

    return _ref7 = {}, _ref7[opts.key] = String(opts.value), _ref7;
  } else {
    throw Error("I don't yet know how to handle feData of type \"" + typeof opts.value + "\"");
  }
}

function convertEdgeDirectionNames(edgeItem) {
  if (edgeItem.hasOwnProperty('to')) {
    var to = edgeItem.to,
        restOfEdgeItem = _objectWithoutPropertiesLoose(edgeItem, _excluded);

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

function prepareForBE(obj) {
  return Object.entries(obj).reduce(function (acc, _ref8) {
    var key = _ref8[0],
        value = _ref8[1];

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

var PROPERTIES_QUERIED_FOR_ALL_NODES = ['id', 'version', 'lastUpdatedBy', 'type'];
/**
 * Relational fns are specified when creating an smNode as fns that return a NodeRelationalQueryBuilder
 * so they can be evaluated lazily to avoid dependency loops between nodes related to each other.
 *
 * This fn executs those fns at query time, and returns a record of relational query builders
 */

function getRelationalQueryBuildersFromRelationalFns(relationaFns) {
  if (!relationaFns) return {};
  return Object.keys(relationaFns).reduce(function (acc, key) {
    acc[key] = relationaFns[key]();
    return acc;
  }, {});
}

function getMapFnReturn(opts) {
  var mapFnOpts = _extends({}, opts.properties, getRelationalQueryBuildersFromRelationalFns(opts.relational));

  Object.keys(opts.properties).forEach(function (key) {
    var data = opts.properties[key];

    if (data.type === SM_DATA_TYPES.object || data.type === SM_DATA_TYPES.maybeObject) {
      mapFnOpts[key] = function (opts) {
        return opts.map;
      };
    }
  });
  return opts.mapFn(mapFnOpts);
}
/**
 * The functions in this file are responsible for translating queryDefinitionss to gql documents
 * only function that should be needed outside this file is convertQueryDefinitionToQueryInfo
 * other fns are exported for testing purposes only
 */


function getQueriedProperties(opts) {
  var mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.smData,
    relational: opts.smRelational
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

  return Object.keys(mapFnReturn || opts.smData).reduce(function (acc, key) {
    var isData = !!opts.smData[key];
    if (!isData) return acc; // we always query these properties, can ignore any explicit requests for it

    if (opts.isRootLevel && PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)) {
      return acc;
    }

    var data = opts.smData[key];

    if (data.type === SM_DATA_TYPES.object || data.type === SM_DATA_TYPES.maybeObject) {
      // query for any data stored in old format (stringified json at the root of the node)
      acc.push(key); // query for data in new format ("rootLevelProp_nestedProp_moreNestedProp")

      acc.push.apply(acc, getQueriedProperties({
        queryId: opts.queryId,
        mapFn: mapFnReturn && typeof mapFnReturn[key] === 'function' ? mapFnReturn[key] : function () {
          return null;
        },
        smData: data.boxedValue
      }).map(function (nestedKey) {
        return "" + key + OBJECT_PROPERTY_SEPARATOR + nestedKey;
      }));
      return acc;
    }

    return [].concat(acc, [key]);
  }, opts.isRootLevel ? [].concat(PROPERTIES_QUERIED_FOR_ALL_NODES) : []);
}

function getAllNodeProperties(opts) {
  return Object.keys(opts.nodeProperties).reduce(function (acc, key) {
    // we are already querying these properties, can ignore any explicit requests for it
    if (opts.isRootLevel && PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key)) {
      return acc;
    }

    var data = opts.nodeProperties[key];

    if (data.type === SM_DATA_TYPES.object || data.type === SM_DATA_TYPES.maybeObject) {
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
  }, opts.isRootLevel ? [].concat(PROPERTIES_QUERIED_FOR_ALL_NODES) : []);
}

function getRelationalQueries(opts) {
  var mapFnReturn = getMapFnReturn({
    mapFn: opts.mapFn,
    properties: opts.smData,
    relational: opts.smRelational
  });
  var relationalQueries = Object.keys(mapFnReturn).reduce(function (acc, key) {
    var isData = !!opts.smData[key];
    var isComputed = opts.smComputed ? !!opts.smComputed[key] : false;

    if (isData || isComputed) {
      return acc;
    } else {
      var addRelationalQueryRecord = function addRelationalQueryRecord(queryRecord) {
        var relationalQueryRecord = {
          def: queryRecord.def,
          properties: getQueriedProperties({
            queryId: opts.queryId,
            mapFn: queryRecord.mapFn,
            smData: queryRecord.def.smData,
            smComputed: queryRecord.def.smComputed,
            smRelational: queryRecord.def.smRelational,
            isRootLevel: true
          })
        };
        var relationalQueriesWithinThisRelationalQuery = getRelationalQueries({
          queryId: opts.queryId,
          mapFn: queryRecord.mapFn,
          smData: queryRecord.def.smData,
          smComputed: queryRecord.def.smComputed,
          smRelational: queryRecord.def.smRelational
        });

        if (relationalQueriesWithinThisRelationalQuery) {
          relationalQueryRecord.relational = relationalQueriesWithinThisRelationalQuery;
        }

        var relationalType = queryRecord._smRelational;

        if (relationalType === SM_RELATIONAL_TYPES.byReference) {
          relationalQueryRecord.byReference = true;
          relationalQueryRecord.idProp = relationalQuery.idProp;
        } else if (relationalType === SM_RELATIONAL_TYPES.children) {
          relationalQueryRecord.children = true;

          if ('depth' in relationalQuery) {
            relationalQueryRecord.depth = relationalQuery.depth;
          }
        } else {
          throw Error("relationalType \"" + relationalType + "\" is not valid.");
        }

        acc[queryRecord.key] = relationalQueryRecord;
      };

      var relationalQuery = mapFnReturn[key];
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

      if (relationalQuery._smRelational == null) {
        throw Error("getRelationalQueries - the key \"" + key + "\" is not a data property, not a computed property and does not contain a relational query.");
      }

      if (relationalQuery._smRelational === SM_RELATIONAL_TYPES.byReference) {
        if ('map' in relationalQuery.queryBuilderOpts && typeof relationalQuery.queryBuilderOpts.map === 'function') {
          // non union
          var queryBuilderOpts = relationalQuery.queryBuilderOpts;
          addRelationalQueryRecord({
            _smRelational: relationalQuery._smRelational,
            key: key,
            def: relationalQuery.def,
            mapFn: queryBuilderOpts.map
          });
        } else {
          // union
          var _queryBuilderOpts = relationalQuery.queryBuilderOpts;
          Object.keys(_queryBuilderOpts).forEach(function (unionType) {
            addRelationalQueryRecord({
              _smRelational: relationalQuery._smRelational,
              key: key + "_" + unionType,
              def: relationalQuery.def[unionType],
              mapFn: _queryBuilderOpts[unionType].map
            });
          });
        }
      } else if (relationalQuery._smRelational === SM_RELATIONAL_TYPES.children) {
        addRelationalQueryRecord({
          _smRelational: relationalQuery._smRelational,
          key: key,
          def: relationalQuery.def,
          mapFn: relationalQuery.map
        });
      } else {
        throw Error( // @ts-expect-error relationalQuery is currently a never case here, since both existing types are being checked above
        "The relational query type " + relationalQuery._smRelational + " is not valid");
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

    if (queryDefinition._isSMNodeDef) {
      // shorthand syntax where the dev only specified a node defition, nothing else
      nodeDef = queryDefinition;
      queriedProps = getAllNodeProperties({
        nodeProperties: nodeDef.smData,
        isRootLevel: true
      });
    } else {
      nodeDef = queryDefinition.def;

      if (queryDefinition.map) {
        queriedProps = getQueriedProperties({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          smData: queryDefinition.def.smData,
          smComputed: queryDefinition.def.smComputed,
          smRelational: queryDefinition.def.smRelational,
          isRootLevel: true
        });
        relational = getRelationalQueries({
          mapFn: queryDefinition.map,
          queryId: opts.queryId,
          smData: nodeDef.smData,
          smComputed: nodeDef.smComputed,
          smRelational: nodeDef.smRelational
        });
      } else {
        queriedProps = getAllNodeProperties({
          nodeProperties: nodeDef.smData,
          isRootLevel: true
        });
      }
    }

    var queryRecordEntry = {
      def: nodeDef,
      properties: queriedProps,
      relational: relational
    };

    if (queryDefinition.target) {
      if (queryDefinition.target.ids) {
        queryRecordEntry.ids = queryDefinition.target.ids;
      }

      if (queryDefinition.target.id) {
        queryRecordEntry.id = queryDefinition.target.id;
      }

      if (queryDefinition.target.underIds) {
        queryRecordEntry.underIds = queryDefinition.target.underIds;
      }

      if (queryDefinition.target.depth) {
        queryRecordEntry.depth = queryDefinition.target.depth;
      }
    }

    if ('filter' in queryDefinition) {
      queryRecordEntry.filter = queryDefinition.filter;
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

function getKeyValueFilterString(filter) {
  var convertedToDotFormat = prepareObjectForBE(filter, {
    omitObjectIdentifier: true
  });
  return "{" + Object.entries(convertedToDotFormat).reduce(function (acc, _ref, idx, entries) {
    var key = _ref[0],
        value = _ref[1];
    acc += key + ": " + (value == null ? null : "\"" + String(value) + "\"");

    if (idx < entries.length - 1) {
      acc += ", ";
    }

    return acc;
  }, '') + "}";
}

function getGetNodeOptions(opts) {
  var options = ["type: \"" + opts.def.type + "\""];

  if (opts.underIds) {
    options.push("underIds: [" + opts.underIds.map(function (id) {
      return "\"" + id + "\"";
    }).join(',') + "]");
  }

  if (opts.depth !== null && opts.depth !== undefined) {
    options.push("depth: " + opts.depth);
  }

  if (opts.filter !== null && opts.filter !== undefined) {
    options.push("filter: " + getKeyValueFilterString(opts.filter));
  }

  return options.join(', ');
} // subscriptions use a slightly different set of arguments for now
// https://tractiontools.atlassian.net/secure/RapidBoard.jspa?rapidView=53&projectKey=SMT&modal=detail&selectedIssue=SMT-636


function getSubscriptionGetNodeOptions(opts) {
  var options = ["type: \"" + opts.def.type + "\""];

  if (opts.under) {
    options.push("underIds: [\"" + opts.under + "\"]");
  } // @TODO uncomment when subscriptions support depth params
  // if (opts.depth != null) {
  //   options.push(`depth: ${opts.depth}`)
  // }


  return options.join(', ');
}

function getSpaces(numberOfSpaces) {
  return new Array(numberOfSpaces).fill(' ').join('');
}

function getQueryPropertiesString(opts) {
  var propsString = "\n" + getSpaces((opts.nestLevel + 2) * 2);
  propsString += opts.queryRecordEntry.properties.join(",\n" + getSpaces((opts.nestLevel + 2) * 2));

  if (opts.queryRecordEntry.relational) {
    propsString += (propsString !== '' ? ',' : '') + getRelationalQueryString({
      relationalQueryRecord: opts.queryRecordEntry.relational,
      nestLevel: opts.nestLevel + 2
    });
  }

  return propsString;
}

function getRelationalQueryString(opts) {
  return Object.keys(opts.relationalQueryRecord).reduce(function (acc, alias) {
    var relationalQueryRecordEntry = opts.relationalQueryRecord[alias];
    var operation;

    if ('byReference' in relationalQueryRecordEntry) {
      operation = "GetReferences(propertyNames: \"" + relationalQueryRecordEntry.idProp + "\")";
    } else if ('children' in relationalQueryRecordEntry) {
      var depthString = 'depth' in relationalQueryRecordEntry ? relationalQueryRecordEntry.depth !== undefined ? ",depth: " + relationalQueryRecordEntry.depth : '' : '';
      operation = "GetChildren(type: \"" + relationalQueryRecordEntry.def.type + "\"" + depthString + ")";
    } else {
      throw Error("relationalQueryRecordEntry is invalid\n" + JSON.stringify(relationalQueryRecordEntry, null, 2));
    }

    return acc + ("\n" + getSpaces(opts.nestLevel * 2) + alias + ": " + operation + " {") + getQueryPropertiesString({
      queryRecordEntry: relationalQueryRecordEntry,
      nestLevel: opts.nestLevel
    }) + ("\n" + getSpaces(opts.nestLevel * 2) + "}");
  }, '');
}

function getRootLevelQueryString(opts) {
  var operation;

  if ('ids' in opts) {
    operation = "GetNodesByIdNew(ids: " + getIdsString(opts.ids) + ")";
  } else if ('id' in opts) {
    operation = "GetNodesByIdNew(ids: " + getIdsString([opts.id]) + ")";
  } else {
    operation = "GetNodesNew(" + getGetNodeOptions(opts) + ")";
  }

  return opts.alias + ": " + operation + " {" + ("" + getQueryPropertiesString({
    queryRecordEntry: opts,
    nestLevel: 1
  })) + ("\n" + getSpaces(4) + "}");
}

function getQueryInfo(opts) {
  var queryRecord = getQueryRecordFromQueryDefinition(opts);
  var queryGQLString = ("\n    query " + getSanitizedQueryId({
    queryId: opts.queryId
  }) + " {\n        " + Object.keys(queryRecord).map(function (alias) {
    return getRootLevelQueryString(_extends({
      alias: alias
    }, queryRecord[alias]));
  }).join('\n    ') + "\n    }\n  ").trim();
  var subscriptionConfigs = Object.keys(queryRecord).reduce(function (subscriptionConfigsAcc, alias) {
    var subscriptionName = getSanitizedQueryId({
      queryId: opts.queryId + '_' + alias
    });
    var queryRecordEntry = queryRecord[alias];
    var operations;

    if ('ids' in queryRecordEntry) {
      operations = ["GetNodesById(ids: " + getIdsString(queryRecordEntry.ids) + ", monitorChildEvents: true)"];
    } else if ('id' in queryRecordEntry) {
      operations = ["GetNodesById(ids: " + getIdsString([queryRecordEntry.id]) + ", monitorChildEvents: true)"];
    } else if ('underIds' in queryRecordEntry) {
      operations = queryRecordEntry.underIds.map(function (underId) {
        return "GetNodesNew(" + getSubscriptionGetNodeOptions(_extends({}, queryRecordEntry, {
          under: underId
        })) + ", monitorChildEvents: true)";
      });
    } else {
      operations = ["GetNodesNew(" + getSubscriptionGetNodeOptions(queryRecordEntry) + ", monitorChildEvents: true)"];
    }

    var gqlStrings = operations.map(function (operation) {
      return ("\n    subscription " + subscriptionName + " {\n      " + alias + ": " + operation + " {\n        node {\n          " + getQueryPropertiesString({
        queryRecordEntry: queryRecordEntry,
        nestLevel: 5
      }) + "\n        }\n        operation { action, path }\n      }\n    }\n        ").trim();
    });

    function extractNodeFromSubscriptionMessage(subscriptionMessage) {
      if (!subscriptionMessage[alias].node) {
        throw new SMUnexpectedSubscriptionMessageException({
          subscriptionMessage: subscriptionMessage,
          description: 'No "node" found in message'
        });
      }

      return subscriptionMessage[alias].node;
    }

    function extractOperationFromSubscriptionMessage(subscriptionMessage) {
      if (!subscriptionMessage[alias].operation) {
        throw new SMUnexpectedSubscriptionMessageException({
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
      queryRecord = _getQueryInfo.queryRecord;

  return {
    queryGQL: core.gql(queryGQLString),
    subscriptionConfigs: subscriptionConfigs.map(function (subscriptionConfig) {
      return _extends({}, subscriptionConfig, {
        gql: core.gql(subscriptionConfig.gqlString)
      });
    }),
    queryRecord: queryRecord
  };
}

function getSanitizedQueryId(opts) {
  return opts.queryId.replace(/-/g, '_');
}

function createDOFactory(smJSInstance) {
  /**
   * Returns a DO class, since there is one instance of the DO class
   * for each instance of that node type that is fetched from SM
   */
  return function DOFactory(node) {
    // silences the error "A class can only implement an object type or intersection of object types with statically known members."
    // wich happens because NodeDO has non statically known members (each property on a node in SM is mapped to a non-statically known property on the DO)
    // eslint-disable-next-line
    // @ts-ignore
    return /*#__PURE__*/function () {
      function DO(initialData) {
        var _this = this,
            _smJSInstance$plugins;

        this.parsedData = void 0;
        this.version = -1;
        this.id = void 0;
        this.lastUpdatedBy = void 0;
        this.persistedData = {};
        this._defaults = void 0;
        this.type = node.type;

        this.getDefaultData = function (nodePropertiesOrSMData) {
          if (nodePropertiesOrSMData instanceof SMData) {
            if (_this.isObjectType(nodePropertiesOrSMData.type)) {
              return _this.getDefaultData(nodePropertiesOrSMData.boxedValue);
            }

            return nodePropertiesOrSMData.defaultValue;
          }

          var getDefaultFnValue = function getDefaultFnValue(propName, defaultSMData) {
            var defaultFn = defaultSMData || nodePropertiesOrSMData[propName]._default; // if a boolean dataType is not passed a default value, it returns an error. We throw it here

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

          if (typeof nodePropertiesOrSMData === 'function') {
            return getDefaultFnValue(undefined, nodePropertiesOrSMData._default);
          }

          return Object.keys(nodePropertiesOrSMData).reduce(function (acc, prop) {
            var propValue = nodePropertiesOrSMData[prop];

            if (_this.isObjectType(propValue.type) || _this.isRecordType(propValue.type)) {
              acc[prop] = _this.getDefaultData(propValue.boxedValue);
            } else if (typeof propValue === 'function') {
              var defaultValue = getDefaultFnValue(prop);
              acc[prop] = defaultValue;
            } else {
              acc[prop] = nodePropertiesOrSMData[prop].defaultValue;
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
              smData: node.properties,
              object: _this.persistedData,
              extension: newData
            });

            _this.parsedData = _this.getParsedData({
              smData: node.properties,
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
          smData: node.properties,
          persistedData: this.persistedData,
          defaultData: this._defaults
        });
        (_smJSInstance$plugins = smJSInstance.plugins) == null ? void 0 : _smJSInstance$plugins.forEach(function (plugin) {
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
        this.initializeNodeMutations();
      }

      var _proto = DO.prototype;

      _proto.parseReceivedData = function parseReceivedData(opts) {
        var _this2 = this;

        var initialData = opts.initialData,
            nodeProperties = opts.nodeProperties;
        return Object.entries(nodeProperties).reduce(function (acc, _ref) {
          var propName = _ref[0],
              propValue = _ref[1];

          var property = _this2.getSMData(propValue);

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

        if (opts.smData instanceof SMData && opts.smData.isOptional && opts.persistedData == null) {
          return null;
        }

        var property = this.getSMData(opts.smData);

        if (property instanceof SMData && property.boxedValue) {
          // sm.array, sm.object or sm.record
          if (this.isArrayType(property.type)) {
            if (opts.persistedData) {
              return (opts.persistedData || []).map(function (data) {
                var _opts$defaultData;

                return _this3.getParsedData({
                  smData: property.boxedValue,
                  persistedData: data,
                  defaultData: property.type === SM_DATA_TYPES.array ? ((_opts$defaultData = opts.defaultData) == null ? void 0 : _opts$defaultData[0]) || null // If property is a non-optional array and the boxed value is of type sm.object, the default data for an array should be an array with a single item, where that item is the default data for that object
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

            var boxedValueSMProperty = this.getSMData(property.boxedValue);

            if (boxedValueSMProperty instanceof SMData) {
              // sm.record
              return Object.keys(opts.persistedData).reduce(function (acc, key) {
                acc[key] = _this3.getParsedData({
                  smData: property.boxedValue,
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
                  smData: property.boxedValue[key],
                  persistedData: opts.persistedData[key],
                  defaultData: (_opts$defaultData2 = opts.defaultData) == null ? void 0 : _opts$defaultData2[key]
                });
                return acc;
              }, {});
            }
          }
        } else if (property instanceof SMData) {
          // sm.string, sm.boolean, sm.number
          // if a property was nulled using our old format, parse as native null
          if (opts.persistedData === NULL_TAG && opts.smData.isOptional) {
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
              smData: property[prop],
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

          var smDataForThisProp = _this4.getSMData(opts.smData[key]); // if this is a record, completely overwrite the stored persisted data


          if (_this4.isRecordType(smDataForThisProp.type)) {
            opts.object[key] = value;
          } else {
            // if it's an object, extend the persisted data we've received so far with the newly received data
            if (_this4.isObjectType(smDataForThisProp.type)) {
              if (value == null) {
                opts.object[key] = null;
              } else {
                opts.object[key] = opts.object[key] || {};

                _this4.extendPersistedWithNewlyReceivedData({
                  smData: smDataForThisProp.boxedValue,
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
       * initializes getters for properties that are stored on this node in SM
       * as properties on this DO instance
       */
      ;

      _proto.initializeNodePropGetters = function initializeNodePropGetters() {
        var _this5 = this;

        Object.keys(node.properties).forEach(function (prop) {
          if (PROPERTIES_QUERIED_FOR_ALL_NODES.includes(prop)) {
            // do not create getters for any properties included in the node definition which are already being queried by sm-js regardless
            // since the code in this DO relies on setting those properties directly using this.version or this.lastUpdatedBy
            return;
          }

          var property = _this5.getSMData(node.properties[prop]);

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
          Object.keys(relationalData).forEach(function (relationalProp) {
            _this7.setRelationalProp({
              propName: relationalProp,
              relationalQueryGetter: relationalData[relationalProp]
            });
          });
        }
      };

      _proto.initializeNodeMutations = function initializeNodeMutations() {
        var _this8 = this;

        var mutations = node.mutations;

        if (mutations) {
          Object.keys(mutations).forEach(function (mutationName) {
            Object.defineProperty(_this8, mutationName, {
              get: function get() {
                return mutations[mutationName].bind(_this8);
              }
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
        var _this9 = this,
            _smJSInstance$plugins2;

        var computedGetter = function computedGetter() {
          return opts.computedFn(_this9);
        };

        (_smJSInstance$plugins2 = smJSInstance.plugins) == null ? void 0 : _smJSInstance$plugins2.forEach(function (plugin) {
          var _plugin$DO2;

          if ((_plugin$DO2 = plugin.DO) != null && _plugin$DO2.computedDecorator) {
            computedGetter = plugin.DO.computedDecorator({
              computedFn: computedGetter,
              DOInstance: _this9
            });
          }
        });
        Object.defineProperty(this, opts.propName, {
          get: function get() {
            return computedGetter();
          },
          enumerable: true
        });
      };

      _proto.setRelationalProp = function setRelationalProp(opts) {
        Object.defineProperty(this, opts.propName, {
          configurable: true,
          get: function get() {
            return opts.relationalQueryGetter();
          }
        });
      };

      _proto.getSMData = function getSMData(prop) {
        if (typeof prop === 'function') {
          return prop._default;
        }

        return prop;
      };

      _proto.isArrayType = function isArrayType(type) {
        return type === SM_DATA_TYPES.array || type === SM_DATA_TYPES.maybeArray;
      };

      _proto.isObjectType = function isObjectType(type) {
        return type === SM_DATA_TYPES.object || type === SM_DATA_TYPES.maybeObject;
      };

      _proto.isRecordType = function isRecordType(type) {
        return type === SM_DATA_TYPES.record || type === SM_DATA_TYPES.maybeRecord;
      };

      return DO;
    }();
  };
}

function createDOProxyGenerator(smJSInstance) {
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
    // but completely losing type safety in opts.node.smComputed would break the return type inference in QueryDataReturn

    var nodeSMComputed = opts.node.smComputed;
    var computedAccessors = nodeSMComputed ? Object.keys(nodeSMComputed).reduce(function (acc, computedKey) {
      var _smJSInstance$plugins;

      var computedFn = function computedFn() {
        return nodeSMComputed[computedKey](proxy);
      };

      (_smJSInstance$plugins = smJSInstance.plugins) == null ? void 0 : _smJSInstance$plugins.forEach(function (plugin) {
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
        // @TODO write tests for this enumeration
        if (opts.allPropertiesQueried.includes(key) || opts.relationalQueries && Object.keys(opts.relationalQueries).includes(key)) {
          return _extends({}, Object.getOwnPropertyDescriptor(target, key), {
            enumerable: true,
            configurable: true
          });
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
          // SM returns an array when "byReference" is used
          // but we only care about the first result
          if ('byReference' in opts.relationalQueries[key]) {
            var results = relationalResults[key];
            if (!Array.isArray(results)) throw Error("Expected results to be an array but it wasn't");
            return results[0];
          }

          return relationalResults[key];
        }

        if (Object.keys(opts.node.smData).includes(key)) {
          if (!opts.allPropertiesQueried.includes(key)) {
            throw new SMNotUpToDateException({
              propName: key,
              queryId: opts.queryId,
              nodeType: opts.node.type
            });
          }

          var smDataForThisProp = opts.node.smData[key];

          if (smDataForThisProp.type === SM_DATA_TYPES.object || smDataForThisProp.type === SM_DATA_TYPES.maybeObject) {
            // do not return an object if this prop came back as null from SM
            if (opts["do"][key] == null) return opts["do"][key];
            return getNestedObjectWithNotUpToDateProtection({
              nodeType: opts.node.type,
              queryId: opts.queryId,
              allCachedData: opts["do"][key],
              smDataForThisObject: smDataForThisProp.boxedValue,
              allPropertiesQueried: opts.allPropertiesQueried,
              parentObjectKey: key
            });
          }

          return opts["do"][key];
        } else if (computedAccessors[key]) {
          try {
            return computedAccessors[key]();
          } catch (e) {
            if (e instanceof SMNotUpToDateException) {
              throw new SMNotUpToDateInComputedException({
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
    Object.keys(opts.smDataForThisObject).forEach(function (objectProp) {
      var name = opts.parentObjectKey ? "" + opts.parentObjectKey + OBJECT_PROPERTY_SEPARATOR + objectProp : objectProp;
      var smDataForThisProp = opts.smDataForThisObject[objectProp];
      var isUpToDate = opts.allPropertiesQueried.includes(name) || // this second case handles ensuring that nested objects are enumerable
      // for example, if user matches the interface { address: { apt: { floor: number, unit: number } } }
      // and we request address_apt_floor and address_apt_unit
      // we need to make address.apt enumerable below
      opts.allPropertiesQueried.some(function (prop) {
        return prop.startsWith(name);
      });
      Object.defineProperty(objectToReturn, objectProp, {
        // @TODO write tests for this enumeration
        enumerable: isUpToDate,
        get: function get() {
          if (smDataForThisProp.type === SM_DATA_TYPES.object || smDataForThisProp.type === SM_DATA_TYPES.maybeObject) {
            if (opts.allCachedData[objectProp] == null) return opts.allCachedData[objectProp];
            return getNestedObjectWithNotUpToDateProtection({
              nodeType: opts.nodeType,
              queryId: opts.queryId,
              allCachedData: opts.allCachedData[objectProp],
              smDataForThisObject: smDataForThisProp.boxedValue,
              allPropertiesQueried: opts.allPropertiesQueried,
              parentObjectKey: name
            });
          }

          if (!isUpToDate) {
            throw new SMNotUpToDateException({
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
 * Returns an initialized instance of a repository for an SMNode
 */

function RepositoryFactory(opts) {
  // silences the error "A class can only implement an object type or intersection of object types with statically known members."
  // wich happens because NodeDO has non statically known members (each property on a node in SM is mapped to a non-statically known property on the DO)
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
      var parsedData = this.parseDataFromSM(data);

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
        throw new SMNotCachedException({
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
     * This method takes data that comes in from SM and is about to be applied to this DO's instance. It needs to:
     * 1) ignore data not specified in the smNode definition for this node
     *     this is so that the querier in smDataContext can call onDataReceived on the DO with the data it receives from SM without having to ignore the relational aliases there
     *     without doing this, we'd get errors about attempting to set a property on a DO which is read only
     * 2) take objects spread into root properties and convert them to regular objects
     *     for example, if we are trying to store `settings: { show: true }` in SM, what is actually stored in the DB is
     *     settings__dot__show: 'true'
     *     since all data must be a string (we don't need to worry about coercing strings to booleans or numbers though, that's handled by the smDataTypes)
     */
    ;

    _proto.parseDataFromSM = function parseDataFromSM(receivedData) {
      var _this = this;

      var oldStyleObjects = {};
      return Object.keys(receivedData).reduce(function (parsed, key) {
        var _opts$def$properties$;

        var isDataStoredOnAllNodes = PROPERTIES_QUERIED_FOR_ALL_NODES.includes(key);

        if (isDataStoredOnAllNodes) {
          var _extends2;

          return _extends({}, parsed, (_extends2 = {}, _extends2[key] = receivedData[key], _extends2));
        } // point 1) above


        var isDataStoredOnTheNode = key.includes(OBJECT_PROPERTY_SEPARATOR) ? Object.keys(opts.def.properties).includes(key.split(OBJECT_PROPERTY_SEPARATOR)[0]) : Object.keys(opts.def.properties).includes(key);
        if (!isDataStoredOnTheNode) return parsed;
        var type = (_opts$def$properties$ = opts.def.properties[key]) == null ? void 0 : _opts$def$properties$.type;
        var isObjectData = key.includes(OBJECT_PROPERTY_SEPARATOR) || type === SM_DATA_TYPES.object || type === SM_DATA_TYPES.maybeObject;
        var isRecordData = type === SM_DATA_TYPES.record || type === SM_DATA_TYPES.maybeRecord;

        var isArrayData = function () {
          if (isObjectData) {
            return false;
          }

          var receivedDataValue = opts.def.properties[key];
          var smDataType = typeof receivedDataValue === 'function' ? receivedDataValue._default.type : receivedDataValue.type;
          return smDataType === SM_DATA_TYPES.array || smDataType === SM_DATA_TYPES.maybeArray;
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
              throw new SMDataParsingException({
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
            throw new SMDataParsingException({
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
      var parsedVal = opts.val === NULL_TAG ? null : opts.val;

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

var queryIdx = 0;
/**
 * Declared as a factory function so that "subscribe" can generate its own querier which shares the same query manager
 * Which ensures that the socket messages are applied to the correct base set of results
 */

function generateQuerier(_ref) {
  var smJSInstance = _ref.smJSInstance,
      queryManager = _ref.queryManager;
  return /*#__PURE__*/function () {
    var _query = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee(queryDefinitions, opts) {
      var startStack, queryId, _convertQueryDefiniti, queryGQL, queryRecord, tokenName, token, getError, error;

      return runtime_1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              getError = function _getError(error) {
                if (opts != null && opts.onError) {
                  return error;
                } else {
                  // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
                  error.stack = error.stack + '\n' + startStack.substring(startStack.indexOf('\n') + 1);
                  return error;
                }
              };

              startStack = new Error().stack;
              queryId = (opts == null ? void 0 : opts.queryId) || "smQuery" + queryIdx++;
              _convertQueryDefiniti = convertQueryDefinitionToQueryInfo({
                queryDefinitions: queryDefinitions,
                queryId: queryId
              }), queryGQL = _convertQueryDefiniti.queryGQL, queryRecord = _convertQueryDefiniti.queryRecord;
              tokenName = (opts == null ? void 0 : opts.tokenName) || 'default';
              token = smJSInstance.getToken({
                tokenName: tokenName
              });

              if (token) {
                _context.next = 14;
                break;
              }

              error = getError(new Error("No token registered with the name \"" + tokenName + "\".\n" + 'Please register this token prior to using it with sm.setToken({ tokenName, token })) '));

              if (!(opts != null && opts.onError)) {
                _context.next = 13;
                break;
              }

              opts.onError(error);
              return _context.abrupt("return", {
                data: {},
                error: error
              });

            case 13:
              throw error;

            case 14:
              return _context.abrupt("return", smJSInstance.gqlClient.query({
                gql: queryGQL,
                token: token,
                batched: opts == null ? void 0 : opts.batched
              }).then(function (queryResult) {
                var results;

                try {
                  var qM = queryManager || new smJSInstance.SMQueryManager(queryRecord);
                  qM.onQueryResult({
                    queryId: queryId,
                    queryResult: queryResult
                  });
                  results = qM.getResults();
                } catch (e) {
                  console.error(e);

                  var _error = getError(new Error("Error applying query results\n" + e));

                  if (opts != null && opts.onError) {
                    opts.onError(_error);
                    return {
                      data: {},
                      error: _error
                    };
                  } else {
                    throw _error;
                  }
                }

                (opts == null ? void 0 : opts.onData) && opts.onData({
                  results: results
                });
                return {
                  data: results,
                  error: null
                };
              })["catch"](function (e) {
                var error = getError(new Error("Error querying data\n" + e));

                if (opts != null && opts.onError) {
                  opts.onError(error);
                  return {
                    data: {},
                    error: error
                  };
                } else {
                  throw error;
                }
              }));

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function query(_x, _x2) {
      return _query.apply(this, arguments);
    }

    return query;
  }();
}
function generateSubscriber(smJSInstance) {
  return /*#__PURE__*/function () {
    var _subscribe = _asyncToGenerator( /*#__PURE__*/runtime_1.mark(function _callee2(queryDefinitions, opts) {
      var startStack, queryId, _convertQueryDefiniti2, queryGQL, queryRecord, subscriptionConfigs, getError, tokenName, token, error, queryManager, updateQueryManagerWithSubscriptionMessage, subscriptionCancellers, mustAwaitQuery, messageQueue, initSubs, unsub, query, _error4, data;

      return runtime_1.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              unsub = function _unsub() {
                subscriptionCancellers.forEach(function (cancel) {
                  return cancel();
                });
              };

              initSubs = function _initSubs() {
                try {
                  subscriptionCancellers = subscriptionConfigs.map(function (subscriptionConfig) {
                    return smJSInstance.gqlClient.subscribe({
                      gql: subscriptionConfig.gql,
                      token: token,
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
                        }); // @TODO When called with skipInitialQuery, results should be null
                        // and we should simply expose a "delta" from the message
                        // probably don't need a query manager in that case either.

                        opts.onData({
                          results: queryManager.getResults()
                        });
                      },
                      onError: function onError(e) {
                        // Can never throw here. The dev consuming this would have no way of catching it
                        // To catch an error in a subscription they must provide onError
                        var error = getError(new Error("Error in a subscription message\n" + e));

                        if (opts.onError) {
                          opts.onError(error);
                        } else {
                          console.error(error);
                        }
                      }
                    });
                  });
                } catch (e) {
                  var _error3 = getError(new Error("Error initializating subscriptions\n" + e));

                  if (opts != null && opts.onError) {
                    opts.onError(_error3);
                  } else {
                    throw _error3;
                  }
                }
              };

              updateQueryManagerWithSubscriptionMessage = function _updateQueryManagerWi(data) {
                var node;
                var operation;

                try {
                  node = data.subscriptionConfig.extractNodeFromSubscriptionMessage(data.message);
                  operation = data.subscriptionConfig.extractOperationFromSubscriptionMessage(data.message);
                  queryManager.onSubscriptionMessage({
                    node: node,
                    operation: operation,
                    queryId: queryId,
                    subscriptionAlias: data.subscriptionConfig.alias
                  });
                } catch (e) {
                  var _error2 = getError(new Error("Error applying subscription message\n" + e));

                  if (opts.onError) {
                    opts.onError(_error2);
                  } else {
                    console.error(_error2);
                  }
                }
              };

              getError = function _getError2(error) {
                if (opts.onError) {
                  return error;
                } else {
                  // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
                  error.stack = error.stack + '\n' + startStack.substring(startStack.indexOf('\n') + 1);
                  return error;
                }
              };

              // https://pavelevstigneev.medium.com/capture-javascript-async-stack-traces-870d1b9f6d39
              startStack = new Error().stack;
              queryId = (opts == null ? void 0 : opts.queryId) || "smQuery" + queryIdx++;
              _convertQueryDefiniti2 = convertQueryDefinitionToQueryInfo({
                queryDefinitions: queryDefinitions,
                queryId: queryId
              }), queryGQL = _convertQueryDefiniti2.queryGQL, queryRecord = _convertQueryDefiniti2.queryRecord, subscriptionConfigs = _convertQueryDefiniti2.subscriptionConfigs;
              opts.onQueryInfoConstructed && opts.onQueryInfoConstructed({
                queryGQL: queryGQL,
                queryId: queryId
              });
              tokenName = (opts == null ? void 0 : opts.tokenName) || 'default';
              token = smJSInstance.getToken({
                tokenName: tokenName
              });

              if (token) {
                _context2.next = 18;
                break;
              }

              error = getError(new Error("No token registered with the name \"" + tokenName + "\".\n" + 'Please register this token prior to using it with sm.setToken({ tokenName, token })) '));

              if (!opts.onError) {
                _context2.next = 17;
                break;
              }

              opts.onError(error);
              return _context2.abrupt("return", {
                data: {},
                unsub: unsub,
                error: error
              });

            case 17:
              throw error;

            case 18:
              queryManager = new smJSInstance.SMQueryManager(queryRecord);
              subscriptionCancellers = []; // Subscriptions are initialized immediately, rather than after the query resolves, to prevent an edge case where an update to a node happens
              // while the data for that node is being transfered from SM to the client. This would result in a missed update.
              // However, we must be careful to not call opts.onData with any subscription messages before the query resolves,
              // because a subscription message only includes info about the node that changed, not all data being subscribed to,
              // which means the consumer of this API would receive and incomplete data set in this edge case.
              // This flag prevents that, by short-circuiting opts.onData in subscription messages, if the query has not resolved

              mustAwaitQuery = !opts.skipInitialQuery;
              messageQueue = [];
              initSubs();
              opts.onSubscriptionInitialized && opts.onSubscriptionInitialized(unsub);

              if (!opts.skipInitialQuery) {
                _context2.next = 28;
                break;
              }

              return _context2.abrupt("return", {
                unsub: unsub
              });

            case 28:
              query = generateQuerier({
                smJSInstance: smJSInstance,
                queryManager: queryManager
              });
              _context2.prev = 29;
              _context2.next = 32;
              return query(queryDefinitions, {
                queryId: opts.queryId,
                tokenName: opts.tokenName,
                batched: opts.batched
              });

            case 32:
              _context2.next = 44;
              break;

            case 34:
              _context2.prev = 34;
              _context2.t0 = _context2["catch"](29);
              console.error(_context2.t0);
              _error4 = getError(new Error("Error querying initial data set\n" + _context2.t0));

              if (!(opts != null && opts.onError)) {
                _context2.next = 43;
                break;
              }

              opts.onError(_error4);
              return _context2.abrupt("return", {
                data: {},
                unsub: unsub,
                error: _error4
              });

            case 43:
              throw _error4;

            case 44:
              if (mustAwaitQuery) {
                mustAwaitQuery = false;
                messageQueue.forEach(updateQueryManagerWithSubscriptionMessage);
                messageQueue.length = 0;
              }

              data = queryManager.getResults();
              opts.onData({
                results: data
              });
              return _context2.abrupt("return", {
                data: data,
                unsub: unsub,
                error: null
              });

            case 48:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[29, 34]]);
    }));

    function subscribe(_x3, _x4) {
      return _subscribe.apply(this, arguments);
    }

    return subscribe;
  }();
}

function createSMQueryManager(smJSInstance) {
  /**
   * SMQueryManager is in charge of
   *
   *    1) receiving data from an SM query and notifying the appropriate DO repositories
   *    2) building proxies for those DOs
   *    3) keeping a cache of those generated proxies so that we can update proxies on subscription messages, rather than generating new ones
   *    4) handling incoming SM subscription messages and
   *       4.1) notifying DO repositories with the data in those sub messages
   *       4.2) build proxies for new DOs received + update relational data (recursively) for proxies that had been previously built
   *    5) building the resulting data that is returned by useSMQuery from its cache of proxies
   */
  return /*#__PURE__*/function () {
    function SMQueryManager(queryRecord) {
      this.state = {};
      this.queryRecord = void 0;
      this.queryRecord = queryRecord;
    }

    var _proto = SMQueryManager.prototype;

    _proto.onQueryResult = function onQueryResult(opts) {
      this.notifyRepositories({
        data: opts.queryResult,
        queryRecord: this.queryRecord
      });
      this.state = this.getNewStateFromQueryResult(opts);
    };

    _proto.onSubscriptionMessage = function onSubscriptionMessage(opts) {
      var _data, _queryRecord;

      var node = opts.node,
          operation = opts.operation,
          subscriptionAlias = opts.subscriptionAlias;
      var queryRecordEntryForThisSubscription = this.queryRecord[subscriptionAlias];

      if (operation.action === 'DeleteNode' && operation.path === node.id) {
        var idsOrIdInCurrentResult = this.state[opts.subscriptionAlias].idsOrIdInCurrentResult;

        if (Array.isArray(idsOrIdInCurrentResult)) {
          this.state[opts.subscriptionAlias].idsOrIdInCurrentResult = idsOrIdInCurrentResult.filter(function (id) {
            return id !== node.id;
          });
        }

        return;
      }

      this.notifyRepositories({
        data: (_data = {}, _data[subscriptionAlias] = node, _data),
        queryRecord: (_queryRecord = {}, _queryRecord[subscriptionAlias] = queryRecordEntryForThisSubscription, _queryRecord)
      });
      this.updateProxiesAndStateFromSubscriptionMessage(opts);
    }
    /**
     * Returns the current results based on received query results and subscription messages
     */
    ;

    _proto.getResults = function getResults() {
      return this.getResultsFromState(this.state);
    }
    /**
     * Is used to build the overall results for the query, and also to build the relational results used by each proxy
     * which is why "state" is a param here
     */
    ;

    _proto.getResultsFromState = function getResultsFromState(state) {
      return Object.keys(state).reduce(function (resultsAcc, queryAlias) {
        var stateForThisAlias = state[queryAlias];
        var idsOrId = stateForThisAlias.idsOrIdInCurrentResult;
        resultsAcc[queryAlias] = Array.isArray(idsOrId) ? idsOrId.map(function (id) {
          return stateForThisAlias.proxyCache[id].proxy;
        }) : stateForThisAlias.proxyCache[idsOrId].proxy;
        return resultsAcc;
      }, {});
    }
    /**
     * Takes a queryRecord and the data that resulted from that query
     * notifies the appropriate repositories so that DOs can be constructed or updated
     */
    ;

    _proto.notifyRepositories = function notifyRepositories(opts) {
      var _this = this;

      Object.keys(opts.queryRecord).forEach(function (queryAlias) {
        var dataForThisAlias = opts.data[queryAlias];

        if (!dataForThisAlias) {
          throw Error("notifyRepositories could not find resulting data for the alias \"" + queryAlias + "\" in the following queryRecord:\n" + JSON.stringify(opts.queryRecord, null, 2) + "\nResulting data:\n" + JSON.stringify(opts.data, null, 2));
        }

        var nodeRepository = opts.queryRecord[queryAlias].def.repository;

        if (Array.isArray(dataForThisAlias)) {
          dataForThisAlias.flatMap(function (data) {
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
            }) : dataForThisAlias[relationalAlias];

            if (relationalDataForThisAlias) {
              var _data2, _queryRecord2;

              var relationalQuery = relationalQueries[relationalAlias];

              _this.notifyRepositories({
                data: (_data2 = {}, _data2[relationalAlias] = relationalDataForThisAlias, _data2),
                queryRecord: (_queryRecord2 = {}, _queryRecord2[relationalAlias] = relationalQuery, _queryRecord2)
              });
            }
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
      var _this2 = this;

      return Object.keys(this.queryRecord).reduce(function (resultingStateAcc, queryAlias) {
        resultingStateAcc[queryAlias] = _this2.buildCacheEntry({
          nodeData: opts.queryResult[queryAlias],
          queryId: opts.queryId,
          queryAlias: queryAlias
        });
        return resultingStateAcc;
      }, {});
    };

    _proto.buildCacheEntry = function buildCacheEntry(opts) {
      var _this3 = this;

      var nodeData = opts.nodeData,
          queryAlias = opts.queryAlias;
      var queryRecord = opts.queryRecord || this.queryRecord;
      var relational = queryRecord[opts.queryAlias].relational;

      var buildRelationalStateForNode = function buildRelationalStateForNode(node) {
        if (!relational) return null;
        return Object.keys(relational).reduce(function (relationalStateAcc, relationalAlias) {
          var relationalDataForThisAlias = node[relationalAlias];

          if (relationalDataForThisAlias) {
            var _extends2;

            return _extends({}, relationalStateAcc, (_extends2 = {}, _extends2[relationalAlias] = _this3.buildCacheEntry({
              nodeData: relationalDataForThisAlias,
              queryId: opts.queryId,
              queryAlias: relationalAlias,
              queryRecord: relational
            }), _extends2));
          } else return relationalStateAcc;
        }, {});
      };

      var buildProxyCacheEntryForNode = function buildProxyCacheEntryForNode(node) {
        var relationalState = buildRelationalStateForNode(node);
        var nodeRepository = queryRecord[queryAlias].def.repository;
        var proxy = smJSInstance.DOProxyGenerator({
          node: queryRecord[opts.queryAlias].def,
          allPropertiesQueried: queryRecord[opts.queryAlias].properties,
          relationalQueries: relational || null,
          queryId: opts.queryId,
          relationalResults: !relationalState ? null : _this3.getResultsFromState(relationalState),
          "do": nodeRepository.byId(node.id)
        });
        return {
          proxy: proxy,
          relationalState: relationalState
        };
      };

      if (Array.isArray(opts.nodeData)) {
        if ('id' in queryRecord[opts.queryAlias]) {
          if (opts.nodeData[0] == null) {
            throw new SMDataParsingException({
              receivedData: opts.nodeData,
              message: "Queried a node by id for the query with the id \"" + opts.queryId + "\" but received back an empty array"
            });
          }

          return {
            idsOrIdInCurrentResult: opts.nodeData[0].id,
            proxyCache: opts.nodeData.reduce(function (proxyCacheAcc, node) {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode(node);
              return proxyCacheAcc;
            }, {})
          };
        } else {
          return {
            idsOrIdInCurrentResult: opts.nodeData.map(function (node) {
              return node.id;
            }),
            proxyCache: opts.nodeData.reduce(function (proxyCacheAcc, node) {
              proxyCacheAcc[node.id] = buildProxyCacheEntryForNode(node);
              return proxyCacheAcc;
            }, {})
          };
        }
      } else {
        var _proxyCache;

        return {
          idsOrIdInCurrentResult: opts.nodeData.id,
          proxyCache: (_proxyCache = {}, _proxyCache[nodeData.id] = buildProxyCacheEntryForNode(nodeData), _proxyCache)
        };
      }
    };

    _proto.updateProxiesAndStateFromSubscriptionMessage = function updateProxiesAndStateFromSubscriptionMessage(opts) {
      var node = opts.node,
          queryId = opts.queryId,
          subscriptionAlias = opts.subscriptionAlias;
      var queryRecordEntryForThisSubscription = this.queryRecord[subscriptionAlias];
      this.state[subscriptionAlias] = this.state[subscriptionAlias] || {};
      var stateForThisAlias = this.state[subscriptionAlias];
      var nodeId = node.id;

      var _ref = stateForThisAlias.proxyCache[nodeId] || {},
          proxy = _ref.proxy,
          relationalState = _ref.relationalState;

      if (proxy) {
        var newCacheEntry = this.recursivelyUpdateProxyAndReturnNewCacheEntry({
          queryId: queryId,
          proxy: proxy,
          newRelationalData: this.getRelationalData({
            queryRecord: queryRecordEntryForThisSubscription,
            node: opts.node
          }),
          relationalQueryRecord: queryRecordEntryForThisSubscription.relational || null,
          currentState: {
            proxy: proxy,
            relationalState: relationalState
          }
        });
        stateForThisAlias.proxyCache[nodeId] = newCacheEntry;
      } else {
        var _this$buildCacheEntry = this.buildCacheEntry({
          nodeData: node,
          queryId: queryId,
          queryAlias: subscriptionAlias,
          queryRecord: this.queryRecord
        }),
            proxyCache = _this$buildCacheEntry.proxyCache;

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
      var _this4 = this;

      var queryId = opts.queryId,
          proxy = opts.proxy,
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
          relationalStateAcc[relationalAlias] = _this4.buildCacheEntry({
            nodeData: relationalDataForThisAlias,
            queryId: queryId,
            queryAlias: relationalAlias,
            queryRecord: relationalQueryRecord
          });
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

              var newCacheEntry = _this4.buildCacheEntry({
                nodeData: node,
                queryId: queryId,
                queryAlias: relationalAlias,
                queryRecord: relationalQueryRecord
              });

              relationalStateAcc[relationalAlias] = {
                proxyCache: _extends({}, relationalStateAcc[relationalAlias].proxyCache, (_extends3 = {}, _extends3[node.id] = newCacheEntry.proxyCache[node.id], _extends3)),
                idsOrIdInCurrentResult: [].concat(relationalStateAcc[relationalAlias].idsOrIdInCurrentResult, [node.id])
              };
            } else {
              var _extends4;

              var _newCacheEntry = _this4.recursivelyUpdateProxyAndReturnNewCacheEntry({
                queryId: queryId,
                proxy: existingProxy,
                newRelationalData: _this4.getRelationalData({
                  queryRecord: queryRecordForThisAlias,
                  node: node
                }),
                relationalQueryRecord: queryRecordForThisAlias.relational || null,
                currentState: currentStateForThisAlias.proxyCache[node.id]
              });

              relationalStateAcc[relationalAlias] = {
                proxyCache: _extends({}, relationalStateAcc[relationalAlias].proxyCache, (_extends4 = {}, _extends4[node.id] = _newCacheEntry, _extends4)),
                idsOrIdInCurrentResult: [].concat(relationalStateAcc[relationalAlias].idsOrIdInCurrentResult, [node.id])
              };
            }
          });
        } else {
          throw Error("Not implemented. " + JSON.stringify(relationalDataForThisAlias));
        }

        return relationalStateAcc;
      }, {});
      newRelationalState ? proxy.updateRelationalResults(this.getResultsFromState(newRelationalState)) : proxy.updateRelationalResults(null);
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

    return SMQueryManager;
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

var _templateObject;
function createEdge(edge) {
  return _extends({
    type: 'createEdge'
  }, edge, {
    smOperationName: 'AttachEdge'
  });
}
function createEdges(edges) {
  return {
    type: 'createEdges',
    smOperationName: 'AttachEdge',
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
  return core.gql(_templateObject || (_templateObject = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        AttachEdge(\n            newSourceId: \"", "\"\n            targetId: \"", "\"\n            edge: ", "\n        )\n    }"])), name, opts.from, opts.to, edge);
}

var _templateObject$1;
function dropEdge(edge) {
  return _extends({
    type: 'dropEdge',
    smOperationName: 'DropEdge'
  }, edge);
}
function dropEdges(edges) {
  return {
    type: 'dropEdges',
    smOperationName: 'DropEdge',
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
  return core.gql(_templateObject$1 || (_templateObject$1 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        DropEdge(\n            sourceId: \"", "\"\n            targetId: \"", "\"\n            edgeType: \"", "\"\n        )\n    }"])), name, opts.from, opts.to, opts.type || 'access');
}

var _templateObject$2;
function replaceEdge(edge) {
  return _extends({
    type: 'replaceEdge',
    smOperationName: 'ReplaceEdge'
  }, edge);
}
function replaceEdges(edges) {
  return {
    type: 'replaceEdges',
    smOperationName: 'ReplaceEdge',
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
  return core.gql(_templateObject$2 || (_templateObject$2 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        ReplaceEdge(\n            currentSourceId: \"", "\"\n            newSourceId: \"", "\"\n            targetId: \"", "\"\n            edge: ", "\n        )\n    }"])), name, opts.current, opts.from, opts.to, edge);
}

var _templateObject$3;
function updateEdge(edge) {
  return _extends({
    type: 'updateEdge',
    smOperationName: 'UpdateEdge'
  }, edge);
}
function updateEdges(edges) {
  return {
    type: 'updateEdges',
    smOperationName: 'UpdateEdge',
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
  return core.gql(_templateObject$3 || (_templateObject$3 = _taggedTemplateLiteralLoose(["\n    mutation ", " {\n        UpdateEdge(\n            sourceId: \"", "\"\n            targetId: \"", "\"\n            edge: ", "\n        )\n    }"])), name, opts.from, opts.to, edge);
}

var _templateObject$4;
function createNodes(operation) {
  return _extends({
    type: 'createNodes',
    smOperationName: 'CreateNodes'
  }, operation);
}
function createNode(operation) {
  return _extends({
    type: 'createNode',
    smOperationName: 'CreateNodes'
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

  return [core.gql(_templateObject$4 || (_templateObject$4 = _taggedTemplateLiteralLoose(["\n      mutation ", " {\n        CreateNodes(\n          createOptions: [\n            ", "\n          ] \n        ) {\n          id\n        }\n      }\n    "])), name, allCreateNodeOperations.map(convertCreateNodeOperationToCreateNodesMutationArguments).join('\n'))];
}

function convertCreateNodeOperationToCreateNodesMutationArguments(operation) {
  var dataToPersistInSM = convertNodeDataToSMPersistedData(operation.data);
  var mutationArgs = ["node: {\n        " + dataToPersistInSM + "\n      }"];

  if (operation.under) {
    var value = typeof operation.under === 'string' ? "[\"" + operation.under + "\"]" : "[\"" + operation.under.join('", "') + "\"]";
    mutationArgs.push("underIds: " + value);
  }

  return "{\n    " + mutationArgs.join('\n') + "\n  }";
}

var SMContext = /*#__PURE__*/React.createContext(undefined);
var SMProvider = function SMProvider(props) {
  var existingContext = React.useContext(SMContext);

  if (existingContext) {
    throw Error('Another instance of an SMProvider was already detected higher up the render tree.\nHaving multiple instances of SMProviders is not supported and may lead to unexpected results.');
  }

  var ongoingSubscriptionRecord = React.useRef({});
  var cleanupTimeoutRecord = React.useRef({});
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
  }, []);
  return React.createElement(SMContext.Provider, {
    value: {
      smJSInstance: props.smJS,
      ongoingSubscriptionRecord: ongoingSubscriptionRecord.current,
      updateSubscriptionInfo: updateSubscriptionInfo,
      scheduleCleanup: scheduleCleanup,
      cancelCleanup: cancelCleanup
    }
  }, props.children);
};

function useSubscription(queryDefinitions, opts) {
  var _preExistingContextFo;

  var smContext = React.useContext(SMContext);

  if (!smContext) {
    throw Error('You must wrap your app with an SMProvider before using useSubscription.');
  }

  var obj = {
    stack: ''
  };
  Error.captureStackTrace(obj, useSubscription);

  if (obj.stack === '') {
    // Should be supported in all browsers, but better safe than sorry
    throw Error('Error.captureStackTrace not supported');
  }

  var subscriptionId = obj.stack.split('\n')[1];
  var preExistingContextForThisSubscription = smContext.ongoingSubscriptionRecord[subscriptionId];

  var _React$useState = React.useState(preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.results),
      results = _React$useState[0],
      setResults = _React$useState[1];

  var _React$useState2 = React.useState(preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.error),
      error = _React$useState2[0],
      setError = _React$useState2[1];

  var _React$useState3 = React.useState((preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.querying) != null ? preExistingContextForThisSubscription == null ? void 0 : preExistingContextForThisSubscription.querying : true),
      querying = _React$useState3[0],
      setQuerying = _React$useState3[1];

  React.useEffect(function () {
    smContext.cancelCleanup(subscriptionId);
    return function () {
      smContext.scheduleCleanup(subscriptionId);
    };
  }, [smContext, subscriptionId]); // We can not directly call "setResults" from this useState hook above within the subscriptions 'onData'
  // because if this component unmounts due to fallback rendering then mounts again, we would be calling setResults on the
  // state of the component rendered before the fallback occured.
  // To avoid that, we keep a reference to the most up to date results setter in the subscription context
  // and call that in "onData" instead.

  smContext.updateSubscriptionInfo(subscriptionId, {
    onResults: setResults,
    onError: setError,
    setQuerying: setQuerying
  });
  var queryDefinitionHasBeenUpdated = (preExistingContextForThisSubscription == null ? void 0 : (_preExistingContextFo = preExistingContextForThisSubscription.queryInfo) == null ? void 0 : _preExistingContextFo.queryGQL) != null && preExistingContextForThisSubscription.queryInfo.queryGQL !== convertQueryDefinitionToQueryInfo({
    queryDefinitions: queryDefinitions,
    queryId: preExistingContextForThisSubscription.queryInfo.queryId
  }).queryGQL;

  if (!preExistingContextForThisSubscription || queryDefinitionHasBeenUpdated) {
    if (queryDefinitionHasBeenUpdated) {
      preExistingContextForThisSubscription.unsub && preExistingContextForThisSubscription.unsub();
    }

    var queryTimestamp = new Date().valueOf();
    setQuerying(true);
    smContext.updateSubscriptionInfo(subscriptionId, {
      querying: true,
      lastQueryTimestamp: queryTimestamp
    });
    var suspendPromise = smContext.smJSInstance.subscribe(queryDefinitions, {
      tokenName: opts == null ? void 0 : opts.tokenName,
      onData: function onData(_ref) {
        var newResults = _ref.results;
        var contextForThisSub = smContext.ongoingSubscriptionRecord[subscriptionId];
        var thisQueryIsMostRecent = contextForThisSub.lastQueryTimestamp === queryTimestamp;

        if (thisQueryIsMostRecent) {
          contextForThisSub.onResults && contextForThisSub.onResults(newResults);
          smContext.updateSubscriptionInfo(subscriptionId, {
            results: newResults
          });
        }
      },
      onError: function onError(error) {
        var contextForThisSub = smContext.ongoingSubscriptionRecord[subscriptionId];
        contextForThisSub.onError && contextForThisSub.onError(error);
        smContext.updateSubscriptionInfo(subscriptionId, {
          error: error
        });
      },
      onSubscriptionInitialized: function onSubscriptionInitialized(subscriptionCanceller) {
        smContext.updateSubscriptionInfo(subscriptionId, {
          unsub: subscriptionCanceller
        });
      },
      onQueryInfoConstructed: function onQueryInfoConstructed(queryInfo) {
        smContext.updateSubscriptionInfo(subscriptionId, {
          queryInfo: queryInfo
        });
      }
    })["finally"](function () {
      var contextForThisSub = smContext.ongoingSubscriptionRecord[subscriptionId];
      var thisQueryIsMostRecent = (contextForThisSub == null ? void 0 : contextForThisSub.lastQueryTimestamp) === queryTimestamp;

      if (thisQueryIsMostRecent) {
        contextForThisSub.setQuerying && contextForThisSub.setQuerying(false);
        smContext.updateSubscriptionInfo(subscriptionId, {
          suspendPromise: undefined,
          querying: false
        });
      }
    });

    if (!preExistingContextForThisSubscription) {
      smContext.updateSubscriptionInfo(subscriptionId, {
        suspendPromise: suspendPromise
      });
      throw suspendPromise;
    } else {
      return {
        data: results,
        querying: querying
      };
    }
  } else if (querying && preExistingContextForThisSubscription.suspendPromise) {
    throw preExistingContextForThisSubscription.suspendPromise;
  } else if (error) {
    throw error;
  } else {
    return {
      data: results,
      querying: querying
    };
  }
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
    return operation.getContext().batchedQuery !== false;
  }, new batchHttp.BatchHttpLink({
    uri: gqlClientOpts.httpUrl,
    batchMax: 30,
    batchInterval: 50
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
                    batchedQuery: opts.batched != null ? opts.batched : true
                  }, getContextWithToken({
                    token: opts.token
                  }))
                });

              case 2:
                _yield$baseClient$que = _context.sent;
                data = _yield$baseClient$que.data;
                return _context.abrupt("return", data);

              case 5:
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
                _context2.next = 2;
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

              case 2:
                return _context2.abrupt("return", _context2.sent);

              case 3:
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
      httpUrl: 'https://saasmaster.dev02.tt-devs.com/playground/..',
      wsUrl: 'wss://saasmaster.dev02.tt-devs.com/'
    })
  };
}

var _templateObject$5, _templateObject2;
function updateNodes(operation) {
  return _extends({
    type: 'updateNodes',
    smOperationName: 'UpdateNodes'
  }, operation);
}
function updateNode(operation) {
  return _extends({
    type: 'updateNode',
    smOperationName: 'UpdateNodes'
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
      acc.push(core.gql(_templateObject$5 || (_templateObject$5 = _taggedTemplateLiteralLoose(["\n        mutation {\n          DropProperties(\n            nodeIds: [\"", "\"]\n            propertyNames: [", "]\n  \n          )\n          { \n            id\n          }\n      }\n      "])), updateNodeOperation.id, propertiesToNull.map(function (prop) {
        return "\"" + prop + OBJECT_PROPERTY_SEPARATOR + "*\"";
      }).join(',')));
    }

    return acc;
  }, []); // For now, returns a single mutation
  // later, we may choose to alter this behavior, if we find performance gains in splitting the mutations

  return [core.gql(_templateObject2 || (_templateObject2 = _taggedTemplateLiteralLoose(["\n        mutation ", " {\n          UpdateNodes(\n            nodes: [\n              ", "\n            ] \n          ) {\n            id\n          }\n        }\n      "])), name, allUpdateNodeOperations.map(convertUpdateNodeOperationToUpdateNodesMutationArguments).join('\n'))].concat(dropPropertiesMutations);
}

function convertUpdateNodeOperationToUpdateNodesMutationArguments(operation) {
  var dataToPersistInSM = convertNodeDataToSMPersistedData(operation);
  return "{\n      " + dataToPersistInSM + "\n    }";
}

var _templateObject$6;
function dropNode(operation) {
  return _extends({
    type: 'dropNode',
    smOperationName: 'DropNode'
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
    return core.gql(_templateObject$6 || (_templateObject$6 = _taggedTemplateLiteralLoose(["\n      mutation ", " {\n        DropNode(nodeId: \"", "\")\n      }    \n    "])), name, operation.id);
  });
}

function createTransaction(smJSInstance, globalOperationHandlers) {
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
     * This is used to store each operation's order in the transaction so that we can map it to the response we get back from SM.
     * SM responds with each operation in the order they were sent up.
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

    var tokenName = (opts == null ? void 0 : opts.tokenName) || 'default';
    var token = smJSInstance.getToken({
      tokenName: tokenName
    });
    /**
     * Group operations by their SM operation name, sorted by position if applicable
     */

    function groupBySMOperationName(operations) {
      var result = Object.entries(operations).reduce(function (acc, _ref) {
        var operations = _ref[1];
        operations.forEach(function (operation) {
          if (acc.hasOwnProperty(operation.smOperationName)) {
            acc[operation.smOperationName] = [].concat(acc[operation.smOperationName], [operation]);
          } else {
            acc[operation.smOperationName] = [operation];
          }
        });
        return acc;
      }, {});
      Object.entries(result).forEach(function (_ref2) {
        var smOperationName = _ref2[0],
            operations = _ref2[1];
        result[smOperationName] = lodash.sortBy(operations, function (operation) {
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
      var operationsBySMOperationName = groupBySMOperationName(operationsByType);
      Object.entries(operationsBySMOperationName).forEach(function (_ref3) {
        var smOperationName = _ref3[0],
            operations = _ref3[1];
        operations.forEach(function (operation) {
          // we only need to gather the data for node create/update operations
          if (smOperationName === 'CreateNodes' || smOperationName === 'UpdateNodes') {
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
      var operationsBySMOperationName = groupBySMOperationName(operationsByType);
      /**
       * Loop through the operations, map the operation to each result sent back from SM,
       * then pass the result into the callback if it exists
       */

      var executeCallbacksWithData = function executeCallbacksWithData(executionResult) {
        executionResult.forEach(function (result) {
          // if executionResult is 2d array
          if (Array.isArray(result)) {
            executeCallbacksWithData(result);
          } else {
            var resultData = result.data;
            Object.entries(operationsBySMOperationName).forEach(function (_ref4) {
              var smOperationName = _ref4[0],
                  operations = _ref4[1];

              if (resultData.hasOwnProperty(smOperationName)) {
                operations.forEach(function (operation) {
                  // we only need to gather the data for node create/update operations
                  if (smOperationName === 'CreateNodes' || smOperationName === 'UpdateNodes') {
                    var groupedResult = resultData[smOperationName]; // for createNodes, execute callback on each individual node rather than top-level operation

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

      Object.entries(operationsBySMOperationName).forEach(function (_ref5) {
        var smOperationName = _ref5[0],
            operations = _ref5[1];

        if (smOperationName !== 'CreateNodes' && smOperationName !== 'UpdateNodes') {
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
                return smJSInstance.gqlClient.mutate({
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
                    return smJSInstance.gqlClient.mutate({
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

var SMJS = /*#__PURE__*/function () {
  function SMJS(config) {
    this.gqlClient = void 0;
    this.plugins = void 0;
    this.query = void 0;
    this.subscribe = void 0;
    this.SMQueryManager = void 0;
    this.transaction = void 0;
    this.tokens = {};
    this.DOFactory = void 0;
    this.DOProxyGenerator = void 0;
    this.optimisticUpdatesOrchestrator = void 0;
    this.gqlClient = config.gqlClient;
    this.plugins = config.plugins;
    this.query = generateQuerier({
      smJSInstance: this
    });
    this.subscribe = generateSubscriber(this);
    this.DOProxyGenerator = createDOProxyGenerator(this);
    this.DOFactory = createDOFactory(this);
    this.SMQueryManager = createSMQueryManager(this);
    this.optimisticUpdatesOrchestrator = new OptimisticUpdatesOrchestrator();
    this.transaction = createTransaction(this, {
      onUpdateRequested: this.optimisticUpdatesOrchestrator.onUpdateRequested
    });
  }

  var _proto = SMJS.prototype;

  _proto.def = function def(_def) {
    var DOClass = this.DOFactory(_def);
    return {
      _isSMNodeDef: true,
      "do": DOClass,
      repository: RepositoryFactory({
        def: _def,
        DOClass: DOClass,
        onDOConstructed: this.optimisticUpdatesOrchestrator.onDOConstructed,
        onDODeleted: this.optimisticUpdatesOrchestrator.onDODeleted,
        onDataReceived: this.optimisticUpdatesOrchestrator.onPersistedDataReceived
      }),
      type: _def.type,
      smData: _def.properties,
      smComputed: _def.computed,
      smRelational: _def.relational,
      smMutations: _def.mutations
    };
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

  return SMJS;
}();

exports.OBJECT_IDENTIFIER = OBJECT_IDENTIFIER;
exports.OBJECT_PROPERTY_SEPARATOR = OBJECT_PROPERTY_SEPARATOR;
exports.SMContext = SMContext;
exports.SMData = SMData;
exports.SMJS = SMJS;
exports.SMProvider = SMProvider;
exports.array = array;
exports.boolean = _boolean;
exports.children = children;
exports.getDefaultConfig = getDefaultConfig;
exports.getGQLCLient = getGQLCLient;
exports.number = number;
exports.object = object;
exports.queryDefinition = queryDefinition;
exports.record = record;
exports.reference = reference;
exports.string = string;
exports.useSubscription = useSubscription;
//# sourceMappingURL=sm-js.cjs.development.js.map
