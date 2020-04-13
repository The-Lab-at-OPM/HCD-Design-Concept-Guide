(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20170427
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */
if ("document" in window.self) {
  // Full polyfill for browsers with no classList support
  // Including IE < Edge missing SVGElement.classList
  if (!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {
    (function (view) {
      "use strict";

      if (!('Element' in view)) return;

      var classListProp = "classList",
          protoProp = "prototype",
          elemCtrProto = view.Element[protoProp],
          objCtr = Object,
          strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
      },
          arrIndexOf = Array[protoProp].indexOf || function (item) {
        var i = 0,
            len = this.length;

        for (; i < len; i++) {
          if (i in this && this[i] === item) {
            return i;
          }
        }

        return -1;
      } // Vendors: please allow content code to instantiate DOMExceptions
      ,
          DOMEx = function DOMEx(type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
      },
          checkTokenAndGetIndex = function checkTokenAndGetIndex(classList, token) {
        if (token === "") {
          throw new DOMEx("SYNTAX_ERR", "An invalid or illegal string was specified");
        }

        if (/\s/.test(token)) {
          throw new DOMEx("INVALID_CHARACTER_ERR", "String contains an invalid character");
        }

        return arrIndexOf.call(classList, token);
      },
          ClassList = function ClassList(elem) {
        var trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
            classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
            i = 0,
            len = classes.length;

        for (; i < len; i++) {
          this.push(classes[i]);
        }

        this._updateClassName = function () {
          elem.setAttribute("class", this.toString());
        };
      },
          classListProto = ClassList[protoProp] = [],
          classListGetter = function classListGetter() {
        return new ClassList(this);
      }; // Most DOMException implementations don't allow calling DOMException's toString()
      // on non-DOMExceptions. Error's toString() is sufficient here.


      DOMEx[protoProp] = Error[protoProp];

      classListProto.item = function (i) {
        return this[i] || null;
      };

      classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
      };

      classListProto.add = function () {
        var tokens = arguments,
            i = 0,
            l = tokens.length,
            token,
            updated = false;

        do {
          token = tokens[i] + "";

          if (checkTokenAndGetIndex(this, token) === -1) {
            this.push(token);
            updated = true;
          }
        } while (++i < l);

        if (updated) {
          this._updateClassName();
        }
      };

      classListProto.remove = function () {
        var tokens = arguments,
            i = 0,
            l = tokens.length,
            token,
            updated = false,
            index;

        do {
          token = tokens[i] + "";
          index = checkTokenAndGetIndex(this, token);

          while (index !== -1) {
            this.splice(index, 1);
            updated = true;
            index = checkTokenAndGetIndex(this, token);
          }
        } while (++i < l);

        if (updated) {
          this._updateClassName();
        }
      };

      classListProto.toggle = function (token, force) {
        token += "";
        var result = this.contains(token),
            method = result ? force !== true && "remove" : force !== false && "add";

        if (method) {
          this[method](token);
        }

        if (force === true || force === false) {
          return force;
        } else {
          return !result;
        }
      };

      classListProto.toString = function () {
        return this.join(" ");
      };

      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: classListGetter,
          enumerable: true,
          configurable: true
        };

        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) {
          // IE 8 doesn't support enumerable:true
          // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
          // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
          if (ex.number === undefined || ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
      }
    })(window.self);
  } // There is full or partial native classList support, so just check if we need
  // to normalize the add/remove and toggle APIs.


  (function () {
    "use strict";

    var testElement = document.createElement("_");
    testElement.classList.add("c1", "c2"); // Polyfill for IE 10/11 and Firefox <26, where classList.add and
    // classList.remove exist but support only one argument at a time.

    if (!testElement.classList.contains("c2")) {
      var createMethod = function createMethod(method) {
        var original = DOMTokenList.prototype[method];

        DOMTokenList.prototype[method] = function (token) {
          var i,
              len = arguments.length;

          for (i = 0; i < len; i++) {
            token = arguments[i];
            original.call(this, token);
          }
        };
      };

      createMethod('add');
      createMethod('remove');
    }

    testElement.classList.toggle("c3", false); // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
    // support the second argument.

    if (testElement.classList.contains("c3")) {
      var _toggle = DOMTokenList.prototype.toggle;

      DOMTokenList.prototype.toggle = function (token, force) {
        if (1 in arguments && !this.contains(token) === !force) {
          return force;
        } else {
          return _toggle.call(this, token);
        }
      };
    }

    testElement = null;
  })();
}

},{}],2:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition();else if (typeof define == 'function' && _typeof(define.amd) == 'object') define(definition);else this[name] = definition();
}('domready', function () {
  var fns = [],
      _listener,
      doc = document,
      hack = doc.documentElement.doScroll,
      domContentLoaded = 'DOMContentLoaded',
      loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState);

  if (!loaded) doc.addEventListener(domContentLoaded, _listener = function listener() {
    doc.removeEventListener(domContentLoaded, _listener);
    loaded = 1;

    while (_listener = fns.shift()) {
      _listener();
    }
  });
  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn);
  };
});

},{}],3:[function(require,module,exports){
'use strict'; // <3 Modernizr
// https://raw.githubusercontent.com/Modernizr/Modernizr/master/feature-detects/dom/dataset.js

function useNative() {
  var elem = document.createElement('div');
  elem.setAttribute('data-a-b', 'c');
  return Boolean(elem.dataset && elem.dataset.aB === 'c');
}

function nativeDataset(element) {
  return element.dataset;
}

module.exports = useNative() ? nativeDataset : function (element) {
  var map = {};
  var attributes = element.attributes;

  function getter() {
    return this.value;
  }

  function setter(name, value) {
    if (typeof value === 'undefined') {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, value);
    }
  }

  for (var i = 0, j = attributes.length; i < j; i++) {
    var attribute = attributes[i];

    if (attribute) {
      var name = attribute.name;

      if (name.indexOf('data-') === 0) {
        var prop = name.slice(5).replace(/-./g, function (u) {
          return u.charAt(1).toUpperCase();
        });
        var value = attribute.value;
        Object.defineProperty(map, prop, {
          enumerable: true,
          get: getter.bind({
            value: value || ''
          }),
          set: setter.bind(element, name)
        });
      }
    }
  }

  return map;
};

},{}],4:[function(require,module,exports){
"use strict";

// element-closest | CC0-1.0 | github.com/jonathantneal/closest
(function (ElementProto) {
  if (typeof ElementProto.matches !== 'function') {
    ElementProto.matches = ElementProto.msMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.webkitMatchesSelector || function matches(selector) {
      var element = this;
      var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
      var index = 0;

      while (elements[index] && elements[index] !== element) {
        ++index;
      }

      return Boolean(elements[index]);
    };
  }

  if (typeof ElementProto.closest !== 'function') {
    ElementProto.closest = function closest(selector) {
      var element = this;

      while (element && element.nodeType === 1) {
        if (element.matches(selector)) {
          return element;
        }

        element = element.parentNode;
      }

      return null;
    };
  }
})(window.Element.prototype);

},{}],5:[function(require,module,exports){
"use strict";

/* global define, KeyboardEvent, module */
(function () {
  var keyboardeventKeyPolyfill = {
    polyfill: polyfill,
    keys: {
      3: 'Cancel',
      6: 'Help',
      8: 'Backspace',
      9: 'Tab',
      12: 'Clear',
      13: 'Enter',
      16: 'Shift',
      17: 'Control',
      18: 'Alt',
      19: 'Pause',
      20: 'CapsLock',
      27: 'Escape',
      28: 'Convert',
      29: 'NonConvert',
      30: 'Accept',
      31: 'ModeChange',
      32: ' ',
      33: 'PageUp',
      34: 'PageDown',
      35: 'End',
      36: 'Home',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      41: 'Select',
      42: 'Print',
      43: 'Execute',
      44: 'PrintScreen',
      45: 'Insert',
      46: 'Delete',
      48: ['0', ')'],
      49: ['1', '!'],
      50: ['2', '@'],
      51: ['3', '#'],
      52: ['4', '$'],
      53: ['5', '%'],
      54: ['6', '^'],
      55: ['7', '&'],
      56: ['8', '*'],
      57: ['9', '('],
      91: 'OS',
      93: 'ContextMenu',
      144: 'NumLock',
      145: 'ScrollLock',
      181: 'VolumeMute',
      182: 'VolumeDown',
      183: 'VolumeUp',
      186: [';', ':'],
      187: ['=', '+'],
      188: [',', '<'],
      189: ['-', '_'],
      190: ['.', '>'],
      191: ['/', '?'],
      192: ['`', '~'],
      219: ['[', '{'],
      220: ['\\', '|'],
      221: [']', '}'],
      222: ["'", '"'],
      224: 'Meta',
      225: 'AltGraph',
      246: 'Attn',
      247: 'CrSel',
      248: 'ExSel',
      249: 'EraseEof',
      250: 'Play',
      251: 'ZoomOut'
    }
  }; // Function keys (F1-24).

  var i;

  for (i = 1; i < 25; i++) {
    keyboardeventKeyPolyfill.keys[111 + i] = 'F' + i;
  } // Printable ASCII characters.


  var letter = '';

  for (i = 65; i < 91; i++) {
    letter = String.fromCharCode(i);
    keyboardeventKeyPolyfill.keys[i] = [letter.toLowerCase(), letter.toUpperCase()];
  }

  function polyfill() {
    if (!('KeyboardEvent' in window) || 'key' in KeyboardEvent.prototype) {
      return false;
    } // Polyfill `key` on `KeyboardEvent`.


    var proto = {
      get: function get(x) {
        var key = keyboardeventKeyPolyfill.keys[this.which || this.keyCode];

        if (Array.isArray(key)) {
          key = key[+this.shiftKey];
        }

        return key;
      }
    };
    Object.defineProperty(KeyboardEvent.prototype, 'key', proto);
    return proto;
  }

  if (typeof define === 'function' && define.amd) {
    define('keyboardevent-key-polyfill', keyboardeventKeyPolyfill);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    module.exports = keyboardeventKeyPolyfill;
  } else if (window) {
    window.keyboardeventKeyPolyfill = keyboardeventKeyPolyfill;
  }
})();

},{}],6:[function(require,module,exports){
(function (global){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';
/** Used as references for various `Number` constants. */

var NAN = 0 / 0;
/** `Object#toString` result references. */

var symbolTag = '[object Symbol]';
/** Used to match leading and trailing whitespace. */

var reTrim = /^\s+|\s+$/g;
/** Used to detect bad signed hexadecimal string values. */

var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
/** Used to detect binary string values. */

var reIsBinary = /^0b[01]+$/i;
/** Used to detect octal string values. */

var reIsOctal = /^0o[0-7]+$/i;
/** Built-in method references without a dependency on `root`. */

var freeParseInt = parseInt;
/** Detect free variable `global` from Node.js. */

var freeGlobal = (typeof global === "undefined" ? "undefined" : _typeof(global)) == 'object' && global && global.Object === Object && global;
/** Detect free variable `self`. */

var freeSelf = (typeof self === "undefined" ? "undefined" : _typeof(self)) == 'object' && self && self.Object === Object && self;
/** Used as a reference to the global object. */

var root = freeGlobal || freeSelf || Function('return this')();
/** Used for built-in method references. */

var objectProto = Object.prototype;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */

var objectToString = objectProto.toString;
/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeMax = Math.max,
    nativeMin = Math.min;
/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */

var now = function now() {
  return root.Date.now();
};
/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */


function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }

  wait = toNumber(wait) || 0;

  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time; // Start the timer for the trailing edge.

    timerId = setTimeout(timerExpired, wait); // Invoke the leading edge.

    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;
    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime; // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.

    return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
  }

  function timerExpired() {
    var time = now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    } // Restart the timer.


    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined; // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }

    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }

      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }

    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */


function isObject(value) {
  var type = _typeof(value);

  return !!value && (type == 'object' || type == 'function');
}
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */


function isObjectLike(value) {
  return !!value && _typeof(value) == 'object';
}
/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */


function isSymbol(value) {
  return _typeof(value) == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */


function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }

  if (isSymbol(value)) {
    return NAN;
  }

  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? other + '' : other;
  }

  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }

  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}

module.exports = debounce;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
'use strict';
/* eslint-disable no-unused-vars */

var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
  if (val === null || val === undefined) {
    throw new TypeError('Object.assign cannot be called with null or undefined');
  }

  return Object(val);
}

function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    } // Detect buggy property enumeration order in older V8 versions.
    // https://bugs.chromium.org/p/v8/issues/detail?id=4118


    var test1 = new String('abc'); // eslint-disable-line no-new-wrappers

    test1[5] = 'de';

    if (Object.getOwnPropertyNames(test1)[0] === '5') {
      return false;
    } // https://bugs.chromium.org/p/v8/issues/detail?id=3056


    var test2 = {};

    for (var i = 0; i < 10; i++) {
      test2['_' + String.fromCharCode(i)] = i;
    }

    var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
      return test2[n];
    });

    if (order2.join('') !== '0123456789') {
      return false;
    } // https://bugs.chromium.org/p/v8/issues/detail?id=3056


    var test3 = {};
    'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
      test3[letter] = letter;
    });

    if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
      return false;
    }

    return true;
  } catch (err) {
    // We don't expect any of the above to throw, but better to be safe.
    return false;
  }
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
  var from;
  var to = toObject(target);
  var symbols;

  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }

    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);

      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }

  return to;
};

},{}],8:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var assign = require('object-assign');

var delegate = require('../delegate');

var delegateAll = require('../delegateAll');

var DELEGATE_PATTERN = /^(.+):delegate\((.+)\)$/;
var SPACE = ' ';

var getListeners = function getListeners(type, handler) {
  var match = type.match(DELEGATE_PATTERN);
  var selector;

  if (match) {
    type = match[1];
    selector = match[2];
  }

  var options;

  if (_typeof(handler) === 'object') {
    options = {
      capture: popKey(handler, 'capture'),
      passive: popKey(handler, 'passive')
    };
  }

  var listener = {
    selector: selector,
    delegate: _typeof(handler) === 'object' ? delegateAll(handler) : selector ? delegate(selector, handler) : handler,
    options: options
  };

  if (type.indexOf(SPACE) > -1) {
    return type.split(SPACE).map(function (_type) {
      return assign({
        type: _type
      }, listener);
    });
  } else {
    listener.type = type;
    return [listener];
  }
};

var popKey = function popKey(obj, key) {
  var value = obj[key];
  delete obj[key];
  return value;
};

module.exports = function behavior(events, props) {
  var listeners = Object.keys(events).reduce(function (memo, type) {
    var listeners = getListeners(type, events[type]);
    return memo.concat(listeners);
  }, []);
  return assign({
    add: function addBehavior(element) {
      listeners.forEach(function (listener) {
        element.addEventListener(listener.type, listener.delegate, listener.options);
      });
    },
    remove: function removeBehavior(element) {
      listeners.forEach(function (listener) {
        element.removeEventListener(listener.type, listener.delegate, listener.options);
      });
    }
  }, props);
};

},{"../delegate":10,"../delegateAll":11,"object-assign":7}],9:[function(require,module,exports){
"use strict";

module.exports = function compose(functions) {
  return function (e) {
    return functions.some(function (fn) {
      return fn.call(this, e) === false;
    }, this);
  };
};

},{}],10:[function(require,module,exports){
"use strict";

// polyfill Element.prototype.closest
require('element-closest');

module.exports = function delegate(selector, fn) {
  return function delegation(event) {
    var target = event.target.closest(selector);

    if (target) {
      return fn.call(target, event);
    }
  };
};

},{"element-closest":4}],11:[function(require,module,exports){
"use strict";

var delegate = require('../delegate');

var compose = require('../compose');

var SPLAT = '*';

module.exports = function delegateAll(selectors) {
  var keys = Object.keys(selectors); // XXX optimization: if there is only one handler and it applies to
  // all elements (the "*" CSS selector), then just return that
  // handler

  if (keys.length === 1 && keys[0] === SPLAT) {
    return selectors[SPLAT];
  }

  var delegates = keys.reduce(function (memo, selector) {
    memo.push(delegate(selector, selectors[selector]));
    return memo;
  }, []);
  return compose(delegates);
};

},{"../compose":9,"../delegate":10}],12:[function(require,module,exports){
"use strict";

module.exports = function ignore(element, fn) {
  return function ignorance(e) {
    if (element !== e.target && !element.contains(e.target)) {
      return fn.call(this, e);
    }
  };
};

},{}],13:[function(require,module,exports){
"use strict";

module.exports = {
  behavior: require('./behavior'),
  delegate: require('./delegate'),
  delegateAll: require('./delegateAll'),
  ignore: require('./ignore'),
  keymap: require('./keymap')
};

},{"./behavior":8,"./delegate":10,"./delegateAll":11,"./ignore":12,"./keymap":14}],14:[function(require,module,exports){
"use strict";

require('keyboardevent-key-polyfill'); // these are the only relevant modifiers supported on all platforms,
// according to MDN:
// <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState>


var MODIFIERS = {
  'Alt': 'altKey',
  'Control': 'ctrlKey',
  'Ctrl': 'ctrlKey',
  'Shift': 'shiftKey'
};
var MODIFIER_SEPARATOR = '+';

var getEventKey = function getEventKey(event, hasModifiers) {
  var key = event.key;

  if (hasModifiers) {
    for (var modifier in MODIFIERS) {
      if (event[MODIFIERS[modifier]] === true) {
        key = [modifier, key].join(MODIFIER_SEPARATOR);
      }
    }
  }

  return key;
};

module.exports = function keymap(keys) {
  var hasModifiers = Object.keys(keys).some(function (key) {
    return key.indexOf(MODIFIER_SEPARATOR) > -1;
  });
  return function (event) {
    var key = getEventKey(event, hasModifiers);
    return [key, key.toLowerCase()].reduce(function (result, _key) {
      if (_key in keys) {
        result = keys[key].call(this, event);
      }

      return result;
    }, undefined);
  };
};

module.exports.MODIFIERS = MODIFIERS;

},{"keyboardevent-key-polyfill":5}],15:[function(require,module,exports){
"use strict";

module.exports = function once(listener, options) {
  var wrapped = function wrappedOnce(e) {
    e.currentTarget.removeEventListener(e.type, wrapped, options);
    return listener.call(this, e);
  };

  return wrapped;
};

},{}],16:[function(require,module,exports){
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var RE_TRIM = /(^\s+)|(\s+$)/g;
var RE_SPLIT = /\s+/;
var trim = String.prototype.trim ? function (str) {
  return str.trim();
} : function (str) {
  return str.replace(RE_TRIM, '');
};

var queryById = function queryById(id) {
  return this.querySelector('[id="' + id.replace(/"/g, '\\"') + '"]');
};

module.exports = function resolveIds(ids, doc) {
  if (typeof ids !== 'string') {
    throw new Error('Expected a string but got ' + _typeof(ids));
  }

  if (!doc) {
    doc = window.document;
  }

  var getElementById = doc.getElementById ? doc.getElementById.bind(doc) : queryById.bind(doc);
  ids = trim(ids).split(RE_SPLIT); // XXX we can short-circuit here because trimming and splitting a
  // string of just whitespace produces an array containing a single,
  // empty string

  if (ids.length === 1 && ids[0] === '') {
    return [];
  }

  return ids.map(function (id) {
    var el = getElementById(id);

    if (!el) {
      throw new Error('no element with id: "' + id + '"');
    }

    return el;
  });
};

},{}],17:[function(require,module,exports){
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var select = require("../utils/select");

var behavior = require("../utils/behavior");

var toggle = require("../utils/toggle");

var isElementInViewport = require("../utils/is-in-viewport");

var _require = require("../events"),
    CLICK = _require.CLICK;

var _require2 = require("../config"),
    PREFIX = _require2.prefix;

var ACCORDION = ".".concat(PREFIX, "-accordion, .").concat(PREFIX, "-accordion--bordered");
var BUTTON = ".".concat(PREFIX, "-accordion__button[aria-controls]");
var EXPANDED = "aria-expanded";
var MULTISELECTABLE = "aria-multiselectable";
/**
 * Get an Array of button elements belonging directly to the given
 * accordion element.
 * @param {HTMLElement} accordion
 * @return {array<HTMLButtonElement>}
 */

var getAccordionButtons = function getAccordionButtons(accordion) {
  var buttons = select(BUTTON, accordion);
  return buttons.filter(function (button) {
    return button.closest(ACCORDION) === accordion;
  });
};
/**
 * Toggle a button's "pressed" state, optionally providing a target
 * state.
 *
 * @param {HTMLButtonElement} button
 * @param {boolean?} expanded If no state is provided, the current
 * state will be toggled (from false to true, and vice-versa).
 * @return {boolean} the resulting state
 */


var toggleButton = function toggleButton(button, expanded) {
  var accordion = button.closest(ACCORDION);
  var safeExpanded = expanded;

  if (!accordion) {
    throw new Error("".concat(BUTTON, " is missing outer ").concat(ACCORDION));
  }

  safeExpanded = toggle(button, expanded); // XXX multiselectable is opt-in, to preserve legacy behavior

  var multiselectable = accordion.getAttribute(MULTISELECTABLE) === "true";

  if (safeExpanded && !multiselectable) {
    getAccordionButtons(accordion).forEach(function (other) {
      if (other !== button) {
        toggle(other, false);
      }
    });
  }
};
/**
 * @param {HTMLButtonElement} button
 * @return {boolean} true
 */


var showButton = function showButton(button) {
  return toggleButton(button, true);
};
/**
 * @param {HTMLButtonElement} button
 * @return {boolean} false
 */


var hideButton = function hideButton(button) {
  return toggleButton(button, false);
};

var accordion = behavior(_defineProperty({}, CLICK, _defineProperty({}, BUTTON, function (event) {
  event.preventDefault();
  toggleButton(this);

  if (this.getAttribute(EXPANDED) === "true") {
    // We were just expanded, but if another accordion was also just
    // collapsed, we may no longer be in the viewport. This ensures
    // that we are still visible, so the user isn't confused.
    if (!isElementInViewport(this)) this.scrollIntoView();
  }
})), {
  init: function init(root) {
    select(BUTTON, root).forEach(function (button) {
      var expanded = button.getAttribute(EXPANDED) === "true";
      toggleButton(button, expanded);
    });
  },
  ACCORDION: ACCORDION,
  BUTTON: BUTTON,
  show: showButton,
  hide: hideButton,
  toggle: toggleButton,
  getButtons: getAccordionButtons
});
module.exports = accordion;

},{"../config":26,"../events":27,"../utils/behavior":32,"../utils/is-in-viewport":34,"../utils/select":35,"../utils/toggle":38}],18:[function(require,module,exports){
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var behavior = require("../utils/behavior");

var _require = require("../events"),
    CLICK = _require.CLICK;

var _require2 = require("../config"),
    PREFIX = _require2.prefix;

var HEADER = ".".concat(PREFIX, "-banner__header");
var EXPANDED_CLASS = "".concat(PREFIX, "-banner__header--expanded");

var toggleBanner = function toggleEl(event) {
  event.preventDefault();
  this.closest(HEADER).classList.toggle(EXPANDED_CLASS);
};

module.exports = behavior(_defineProperty({}, CLICK, _defineProperty({}, "".concat(HEADER, " [aria-controls]"), toggleBanner)));

},{"../config":26,"../events":27,"../utils/behavior":32}],19:[function(require,module,exports){
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var debounce = require("lodash.debounce");

var behavior = require("../utils/behavior");

var select = require("../utils/select");

var _require = require("../events"),
    CLICK = _require.CLICK;

var _require2 = require("../config"),
    PREFIX = _require2.prefix;

var HIDDEN = "hidden";
var SCOPE = ".".concat(PREFIX, "-footer--big");
var NAV = "".concat(SCOPE, " nav");
var BUTTON = "".concat(NAV, " .").concat(PREFIX, "-footer__primary-link");
var COLLAPSIBLE = ".".concat(PREFIX, "-footer__primary-content--collapsible");
var HIDE_MAX_WIDTH = 480;
var DEBOUNCE_RATE = 180;

function showPanel() {
  if (window.innerWidth < HIDE_MAX_WIDTH) {
    var collapseEl = this.closest(COLLAPSIBLE);
    collapseEl.classList.toggle(HIDDEN); // NB: this *should* always succeed because the button
    // selector is scoped to ".{prefix}-footer-big nav"

    var collapsibleEls = select(COLLAPSIBLE, collapseEl.closest(NAV));
    collapsibleEls.forEach(function (el) {
      if (el !== collapseEl) {
        el.classList.add(HIDDEN);
      }
    });
  }
}

var lastInnerWidth;
var resize = debounce(function () {
  if (lastInnerWidth === window.innerWidth) return;
  lastInnerWidth = window.innerWidth;
  var hidden = window.innerWidth < HIDE_MAX_WIDTH;
  select(COLLAPSIBLE).forEach(function (list) {
    return list.classList.toggle(HIDDEN, hidden);
  });
}, DEBOUNCE_RATE);
module.exports = behavior(_defineProperty({}, CLICK, _defineProperty({}, BUTTON, showPanel)), {
  // export for use elsewhere
  HIDE_MAX_WIDTH: HIDE_MAX_WIDTH,
  DEBOUNCE_RATE: DEBOUNCE_RATE,
  init: function init() {
    resize();
    window.addEventListener("resize", resize);
  },
  teardown: function teardown() {
    window.removeEventListener("resize", resize);
  }
});

},{"../config":26,"../events":27,"../utils/behavior":32,"../utils/select":35,"lodash.debounce":6}],20:[function(require,module,exports){
"use strict";

var accordion = require("./accordion");

var banner = require("./banner");

var footer = require("./footer");

var navigation = require("./navigation");

var password = require("./password");

var search = require("./search");

var skipnav = require("./skipnav");

var validator = require("./validator");

module.exports = {
  accordion: accordion,
  banner: banner,
  footer: footer,
  navigation: navigation,
  password: password,
  search: search,
  skipnav: skipnav,
  validator: validator
};

},{"./accordion":17,"./banner":18,"./footer":19,"./navigation":21,"./password":22,"./search":23,"./skipnav":24,"./validator":25}],21:[function(require,module,exports){
"use strict";

var _CLICK;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var behavior = require("../utils/behavior");

var select = require("../utils/select");

var toggle = require("../utils/toggle");

var FocusTrap = require("../utils/focus-trap");

var accordion = require("./accordion");

var _require = require("../events"),
    CLICK = _require.CLICK;

var _require2 = require("../config"),
    PREFIX = _require2.prefix;

var BODY = "body";
var NAV = ".".concat(PREFIX, "-nav");
var NAV_LINKS = "".concat(NAV, " a");
var NAV_CONTROL = "button.".concat(PREFIX, "-nav__link");
var OPENERS = ".".concat(PREFIX, "-menu-btn");
var CLOSE_BUTTON = ".".concat(PREFIX, "-nav__close");
var OVERLAY = ".".concat(PREFIX, "-overlay");
var CLOSERS = "".concat(CLOSE_BUTTON, ", .").concat(PREFIX, "-overlay");
var TOGGLES = [NAV, OVERLAY].join(", ");
var ACTIVE_CLASS = "usa-js-mobile-nav--active";
var VISIBLE_CLASS = "is-visible";
var navigation;
var navActive;

var isActive = function isActive() {
  return document.body.classList.contains(ACTIVE_CLASS);
};

var toggleNav = function toggleNav(active) {
  var _document = document,
      body = _document.body;
  var safeActive = typeof active === "boolean" ? active : !isActive();
  body.classList.toggle(ACTIVE_CLASS, safeActive);
  select(TOGGLES).forEach(function (el) {
    return el.classList.toggle(VISIBLE_CLASS, safeActive);
  });
  navigation.focusTrap.update(safeActive);
  var closeButton = body.querySelector(CLOSE_BUTTON);
  var menuButton = body.querySelector(OPENERS);

  if (safeActive && closeButton) {
    // The mobile nav was just activated, so focus on the close button,
    // which is just before all the nav elements in the tab order.
    closeButton.focus();
  } else if (!safeActive && document.activeElement === closeButton && menuButton) {
    // The mobile nav was just deactivated, and focus was on the close
    // button, which is no longer visible. We don't want the focus to
    // disappear into the void, so focus on the menu button if it's
    // visible (this may have been what the user was just focused on,
    // if they triggered the mobile nav by mistake).
    menuButton.focus();
  }

  return safeActive;
};

var resize = function resize() {
  var closer = document.body.querySelector(CLOSE_BUTTON);

  if (isActive() && closer && closer.getBoundingClientRect().width === 0) {
    // When the mobile nav is active, and the close box isn't visible,
    // we know the user's viewport has been resized to be larger.
    // Let's make the page state consistent by deactivating the mobile nav.
    navigation.toggleNav.call(closer, false);
  }
};

var onMenuClose = function onMenuClose() {
  return navigation.toggleNav.call(navigation, false);
};

var hideActiveNavDropdown = function hideActiveNavDropdown() {
  toggle(navActive, false);
  navActive = null;
};

navigation = behavior(_defineProperty({}, CLICK, (_CLICK = {}, _defineProperty(_CLICK, NAV_CONTROL, function () {
  // If another nav is open, close it
  if (navActive && navActive !== this) {
    hideActiveNavDropdown();
  } // store a reference to the last clicked nav link element, so we
  // can hide the dropdown if another element on the page is clicked


  if (navActive) {
    hideActiveNavDropdown();
  } else {
    navActive = this;
    toggle(navActive, true);
  } // Do this so the event handler on the body doesn't fire


  return false;
}), _defineProperty(_CLICK, BODY, function () {
  if (navActive) {
    hideActiveNavDropdown();
  }
}), _defineProperty(_CLICK, OPENERS, toggleNav), _defineProperty(_CLICK, CLOSERS, toggleNav), _defineProperty(_CLICK, NAV_LINKS, function () {
  // A navigation link has been clicked! We want to collapse any
  // hierarchical navigation UI it's a part of, so that the user
  // can focus on whatever they've just selected.
  // Some navigation links are inside accordions; when they're
  // clicked, we want to collapse those accordions.
  var acc = this.closest(accordion.ACCORDION);

  if (acc) {
    accordion.getButtons(acc).forEach(function (btn) {
      return accordion.hide(btn);
    });
  } // If the mobile navigation menu is active, we want to hide it.


  if (isActive()) {
    navigation.toggleNav.call(navigation, false);
  }
}), _CLICK)), {
  init: function init(root) {
    var trapContainer = root.querySelector(NAV);

    if (trapContainer) {
      navigation.focusTrap = FocusTrap(trapContainer, {
        Escape: onMenuClose
      });
    }

    resize();
    window.addEventListener("resize", resize, false);
  },
  teardown: function teardown() {
    window.removeEventListener("resize", resize, false);
    navActive = false;
  },
  focusTrap: null,
  toggleNav: toggleNav
});
module.exports = navigation;

},{"../config":26,"../events":27,"../utils/behavior":32,"../utils/focus-trap":33,"../utils/select":35,"../utils/toggle":38,"./accordion":17}],22:[function(require,module,exports){
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var behavior = require("../utils/behavior");

var toggleFormInput = require("../utils/toggle-form-input");

var _require = require("../events"),
    CLICK = _require.CLICK;

var _require2 = require("../config"),
    PREFIX = _require2.prefix;

var LINK = ".".concat(PREFIX, "-show-password, .").concat(PREFIX, "-show-multipassword");

function toggle(event) {
  event.preventDefault();
  toggleFormInput(this);
}

module.exports = behavior(_defineProperty({}, CLICK, _defineProperty({}, LINK, toggle)));

},{"../config":26,"../events":27,"../utils/behavior":32,"../utils/toggle-form-input":37}],23:[function(require,module,exports){
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ignore = require("receptor/ignore");

var behavior = require("../utils/behavior");

var select = require("../utils/select");

var _require = require("../events"),
    CLICK = _require.CLICK;

var BUTTON = ".js-search-button";
var FORM = ".js-search-form";
var INPUT = "[type=search]";
var CONTEXT = "header"; // XXX

var lastButton;

var getForm = function getForm(button) {
  var context = button.closest(CONTEXT);
  return context ? context.querySelector(FORM) : document.querySelector(FORM);
};

var toggleSearch = function toggleSearch(button, active) {
  var form = getForm(button);

  if (!form) {
    throw new Error("No ".concat(FORM, " found for search toggle in ").concat(CONTEXT, "!"));
  }
  /* eslint-disable no-param-reassign */


  button.hidden = active;
  form.hidden = !active;
  /* eslint-enable */

  if (!active) {
    return;
  }

  var input = form.querySelector(INPUT);

  if (input) {
    input.focus();
  } // when the user clicks _outside_ of the form w/ignore(): hide the
  // search, then remove the listener


  var listener = ignore(form, function () {
    if (lastButton) {
      hideSearch.call(lastButton); // eslint-disable-line no-use-before-define
    }

    document.body.removeEventListener(CLICK, listener);
  }); // Normally we would just run this code without a timeout, but
  // IE11 and Edge will actually call the listener *immediately* because
  // they are currently handling this exact type of event, so we'll
  // make sure the browser is done handling the current click event,
  // if any, before we attach the listener.

  setTimeout(function () {
    document.body.addEventListener(CLICK, listener);
  }, 0);
};

function showSearch() {
  toggleSearch(this, true);
  lastButton = this;
}

function hideSearch() {
  toggleSearch(this, false);
  lastButton = undefined;
}

var search = behavior(_defineProperty({}, CLICK, _defineProperty({}, BUTTON, showSearch)), {
  init: function init(target) {
    select(BUTTON, target).forEach(function (button) {
      toggleSearch(button, false);
    });
  },
  teardown: function teardown() {
    // forget the last button clicked
    lastButton = undefined;
  }
});
module.exports = search;

},{"../events":27,"../utils/behavior":32,"../utils/select":35,"receptor/ignore":12}],24:[function(require,module,exports){
"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var once = require("receptor/once");

var behavior = require("../utils/behavior");

var _require = require("../events"),
    CLICK = _require.CLICK;

var _require2 = require("../config"),
    PREFIX = _require2.prefix;

var LINK = ".".concat(PREFIX, "-skipnav[href^=\"#\"], .").concat(PREFIX, "-footer__return-to-top [href^=\"#\"]");
var MAINCONTENT = "main-content";

function setTabindex() {
  // NB: we know because of the selector we're delegating to below that the
  // href already begins with '#'
  var id = this.getAttribute("href");
  var target = document.getElementById(id === "#" ? MAINCONTENT : id.slice(1));

  if (target) {
    target.style.outline = "0";
    target.setAttribute("tabindex", 0);
    target.focus();
    target.addEventListener("blur", once(function () {
      target.setAttribute("tabindex", -1);
    }));
  } else {// throw an error?
  }
}

module.exports = behavior(_defineProperty({}, CLICK, _defineProperty({}, LINK, setTabindex)));

},{"../config":26,"../events":27,"../utils/behavior":32,"receptor/once":15}],25:[function(require,module,exports){
"use strict";

var behavior = require("../utils/behavior");

var validate = require("../utils/validate-input");

function change() {
  validate(this);
}

var validator = behavior({
  "keyup change": {
    "input[data-validation-element]": change
  }
});
module.exports = validator;

},{"../utils/behavior":32,"../utils/validate-input":39}],26:[function(require,module,exports){
"use strict";

module.exports = {
  prefix: "usa"
};

},{}],27:[function(require,module,exports){
"use strict";

module.exports = {
  // This used to be conditionally dependent on whether the
  // browser supported touch events; if it did, `CLICK` was set to
  // `touchstart`.  However, this had downsides:
  //
  // * It pre-empted mobile browsers' default behavior of detecting
  //   whether a touch turned into a scroll, thereby preventing
  //   users from using some of our components as scroll surfaces.
  //
  // * Some devices, such as the Microsoft Surface Pro, support *both*
  //   touch and clicks. This meant the conditional effectively dropped
  //   support for the user's mouse, frustrating users who preferred
  //   it on those systems.
  CLICK: "click"
};

},{}],28:[function(require,module,exports){
"use strict";

var elproto = window.HTMLElement.prototype;
var HIDDEN = "hidden";

if (!(HIDDEN in elproto)) {
  Object.defineProperty(elproto, HIDDEN, {
    get: function get() {
      return this.hasAttribute(HIDDEN);
    },
    set: function set(value) {
      if (value) {
        this.setAttribute(HIDDEN, "");
      } else {
        this.removeAttribute(HIDDEN);
      }
    }
  });
}

},{}],29:[function(require,module,exports){
"use strict";

// polyfills HTMLElement.prototype.classList and DOMTokenList
require("classlist-polyfill"); // polyfills HTMLElement.prototype.hidden


require("./element-hidden");

},{"./element-hidden":28,"classlist-polyfill":1}],30:[function(require,module,exports){
"use strict";

var domready = require("domready");
/**
 * The 'polyfills' define key ECMAScript 5 methods that may be missing from
 * older browsers, so must be loaded first.
 */


require("./polyfills");

var uswds = require("./config");

var components = require("./components");

uswds.components = components;
domready(function () {
  var target = document.body;
  Object.keys(components).forEach(function (key) {
    var behavior = components[key];
    behavior.on(target);
  });
});
module.exports = uswds;

},{"./components":20,"./config":26,"./polyfills":29,"domready":2}],31:[function(require,module,exports){
"use strict";

module.exports = function () {
  var htmlDocument = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
  return htmlDocument.activeElement;
};

},{}],32:[function(require,module,exports){
"use strict";

var assign = require("object-assign");

var Behavior = require("receptor/behavior");
/**
 * @name sequence
 * @param {...Function} seq an array of functions
 * @return { closure } callHooks
 */
// We use a named function here because we want it to inherit its lexical scope
// from the behavior props object, not from the module


var sequence = function sequence() {
  for (var _len = arguments.length, seq = new Array(_len), _key = 0; _key < _len; _key++) {
    seq[_key] = arguments[_key];
  }

  return function callHooks() {
    var _this = this;

    var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;
    seq.forEach(function (method) {
      if (typeof _this[method] === "function") {
        _this[method].call(_this, target);
      }
    });
  };
};
/**
 * @name behavior
 * @param {object} events
 * @param {object?} props
 * @return {receptor.behavior}
 */


module.exports = function (events, props) {
  return Behavior(events, assign({
    on: sequence("init", "add"),
    off: sequence("teardown", "remove")
  }, props));
};

},{"object-assign":7,"receptor/behavior":8}],33:[function(require,module,exports){
"use strict";

var assign = require("object-assign");

var _require = require("receptor"),
    keymap = _require.keymap;

var behavior = require("./behavior");

var select = require("./select");

var activeElement = require("./active-element");

var FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

var tabHandler = function tabHandler(context) {
  var focusableElements = select(FOCUSABLE, context);
  var firstTabStop = focusableElements[0];
  var lastTabStop = focusableElements[focusableElements.length - 1]; // Special rules for when the user is tabbing forward from the last focusable element,
  // or when tabbing backwards from the first focusable element

  function tabAhead(event) {
    if (activeElement() === lastTabStop) {
      event.preventDefault();
      firstTabStop.focus();
    }
  }

  function tabBack(event) {
    if (activeElement() === firstTabStop) {
      event.preventDefault();
      lastTabStop.focus();
    }
  }

  return {
    firstTabStop: firstTabStop,
    lastTabStop: lastTabStop,
    tabAhead: tabAhead,
    tabBack: tabBack
  };
};

module.exports = function (context) {
  var additionalKeyBindings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var tabEventHandler = tabHandler(context); //  TODO: In the future, loop over additional keybindings and pass an array
  // of functions, if necessary, to the map keys. Then people implementing
  // the focus trap could pass callbacks to fire when tabbing

  var keyMappings = keymap(assign({
    Tab: tabEventHandler.tabAhead,
    "Shift+Tab": tabEventHandler.tabBack
  }, additionalKeyBindings));
  var focusTrap = behavior({
    keydown: keyMappings
  }, {
    init: function init() {
      // TODO: is this desireable behavior? Should the trap always do this by default or should
      // the component getting decorated handle this?
      tabEventHandler.firstTabStop.focus();
    },
    update: function update(isActive) {
      if (isActive) {
        this.on();
      } else {
        this.off();
      }
    }
  });
  return focusTrap;
};

},{"./active-element":31,"./behavior":32,"./select":35,"object-assign":7,"receptor":13}],34:[function(require,module,exports){
"use strict";

// https://stackoverflow.com/a/7557433
function isElementInViewport(el) {
  var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
  var docEl = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document.documentElement;
  var rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (win.innerHeight || docEl.clientHeight) && rect.right <= (win.innerWidth || docEl.clientWidth);
}

module.exports = isElementInViewport;

},{}],35:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * @name isElement
 * @desc returns whether or not the given argument is a DOM element.
 * @param {any} value
 * @return {boolean}
 */
var isElement = function isElement(value) {
  return value && _typeof(value) === "object" && value.nodeType === 1;
};
/**
 * @name select
 * @desc selects elements from the DOM by class selector or ID selector.
 * @param {string} selector - The selector to traverse the DOM with.
 * @param {Document|HTMLElement?} context - The context to traverse the DOM
 *   in. If not provided, it defaults to the document.
 * @return {HTMLElement[]} - An array of DOM nodes or an empty array.
 */


module.exports = function (selector, context) {
  if (typeof selector !== "string") {
    return [];
  }

  if (!context || !isElement(context)) {
    context = window.document; // eslint-disable-line no-param-reassign
  }

  var selection = context.querySelectorAll(selector);
  return Array.prototype.slice.call(selection);
};

},{}],36:[function(require,module,exports){
"use strict";

/**
 * Flips given INPUT elements between masked (hiding the field value) and unmasked
 * @param {Array.HTMLElement} fields - An array of INPUT elements
 * @param {Boolean} mask - Whether the mask should be applied, hiding the field value
 */
module.exports = function (field, mask) {
  field.setAttribute("autocapitalize", "off");
  field.setAttribute("autocorrect", "off");
  field.setAttribute("type", mask ? "password" : "text");
};

},{}],37:[function(require,module,exports){
"use strict";

var resolveIdRefs = require("resolve-id-refs");

var toggleFieldMask = require("./toggle-field-mask");

var CONTROLS = "aria-controls";
var PRESSED = "aria-pressed";
var SHOW_ATTR = "data-show-text";
var HIDE_ATTR = "data-hide-text";
/**
 * Replace the word "Show" (or "show") with "Hide" (or "hide") in a string.
 * @param {string} showText
 * @return {strong} hideText
 */

var getHideText = function getHideText(showText) {
  return showText.replace(/\bShow\b/i, function (show) {
    return "".concat(show[0] === "S" ? "H" : "h", "ide");
  });
};
/**
 * Component that decorates an HTML element with the ability to toggle the
 * masked state of an input field (like a password) when clicked.
 * The ids of the fields to be masked will be pulled directly from the button's
 * `aria-controls` attribute.
 *
 * @param  {HTMLElement} el    Parent element containing the fields to be masked
 * @return {boolean}
 */


module.exports = function (el) {
  // this is the *target* state:
  // * if the element has the attr and it's !== "true", pressed is true
  // * otherwise, pressed is false
  var pressed = el.hasAttribute(PRESSED) && el.getAttribute(PRESSED) !== "true";
  var fields = resolveIdRefs(el.getAttribute(CONTROLS));
  fields.forEach(function (field) {
    return toggleFieldMask(field, pressed);
  });

  if (!el.hasAttribute(SHOW_ATTR)) {
    el.setAttribute(SHOW_ATTR, el.textContent);
  }

  var showText = el.getAttribute(SHOW_ATTR);
  var hideText = el.getAttribute(HIDE_ATTR) || getHideText(showText);
  el.textContent = pressed ? showText : hideText; // eslint-disable-line no-param-reassign

  el.setAttribute(PRESSED, pressed);
  return pressed;
};

},{"./toggle-field-mask":36,"resolve-id-refs":16}],38:[function(require,module,exports){
"use strict";

var EXPANDED = "aria-expanded";
var CONTROLS = "aria-controls";
var HIDDEN = "hidden";

module.exports = function (button, expanded) {
  var safeExpanded = expanded;

  if (typeof safeExpanded !== "boolean") {
    safeExpanded = button.getAttribute(EXPANDED) === "false";
  }

  button.setAttribute(EXPANDED, safeExpanded);
  var id = button.getAttribute(CONTROLS);
  var controls = document.getElementById(id);

  if (!controls) {
    throw new Error("No toggle target found with id: \"".concat(id, "\""));
  }

  if (safeExpanded) {
    controls.removeAttribute(HIDDEN);
  } else {
    controls.setAttribute(HIDDEN, "");
  }

  return safeExpanded;
};

},{}],39:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var dataset = require("elem-dataset");

var _require = require("../config"),
    PREFIX = _require.prefix;

var CHECKED = "aria-checked";
var CHECKED_CLASS = "".concat(PREFIX, "-checklist__item--checked");

module.exports = function validate(el) {
  var data = dataset(el);
  var id = data.validationElement;
  var checkList = id.charAt(0) === "#" ? document.querySelector(id) : document.getElementById(id);

  if (!checkList) {
    throw new Error("No validation element found with id: \"".concat(id, "\""));
  }

  Object.entries(data).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    if (key.startsWith("validate")) {
      var validatorName = key.substr("validate".length).toLowerCase();
      var validatorPattern = new RegExp(value);
      var validatorSelector = "[data-validator=\"".concat(validatorName, "\"]");
      var validatorCheckbox = checkList.querySelector(validatorSelector);

      if (!validatorCheckbox) {
        throw new Error("No validator checkbox found for: \"".concat(validatorName, "\""));
      }

      var checked = validatorPattern.test(el.value);
      validatorCheckbox.classList.toggle(CHECKED_CLASS, checked);
      validatorCheckbox.setAttribute(CHECKED, checked);
    }
  });
};

},{"../config":26,"elem-dataset":3}]},{},[30])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2xhc3NsaXN0LXBvbHlmaWxsL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kb21yZWFkeS9yZWFkeS5qcyIsIm5vZGVfbW9kdWxlcy9lbGVtLWRhdGFzZXQvZGlzdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lbGVtZW50LWNsb3Nlc3QvZWxlbWVudC1jbG9zZXN0LmpzIiwibm9kZV9tb2R1bGVzL2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC5kZWJvdW5jZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlY2VwdG9yL2JlaGF2aW9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlY2VwdG9yL2NvbXBvc2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvZGVsZWdhdGUvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvZGVsZWdhdGVBbGwvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVjZXB0b3IvaWdub3JlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlY2VwdG9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3JlY2VwdG9yL2tleW1hcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWNlcHRvci9vbmNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Jlc29sdmUtaWQtcmVmcy9pbmRleC5qcyIsInNyYy9qcy9jb21wb25lbnRzL2FjY29yZGlvbi5qcyIsInNyYy9qcy9jb21wb25lbnRzL2Jhbm5lci5qcyIsInNyYy9qcy9jb21wb25lbnRzL2Zvb3Rlci5qcyIsInNyYy9qcy9jb21wb25lbnRzL2luZGV4LmpzIiwic3JjL2pzL2NvbXBvbmVudHMvbmF2aWdhdGlvbi5qcyIsInNyYy9qcy9jb21wb25lbnRzL3Bhc3N3b3JkLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2VhcmNoLmpzIiwic3JjL2pzL2NvbXBvbmVudHMvc2tpcG5hdi5qcyIsInNyYy9qcy9jb21wb25lbnRzL3ZhbGlkYXRvci5qcyIsInNyYy9qcy9jb25maWcuanMiLCJzcmMvanMvZXZlbnRzLmpzIiwic3JjL2pzL3BvbHlmaWxscy9lbGVtZW50LWhpZGRlbi5qcyIsInNyYy9qcy9wb2x5ZmlsbHMvaW5kZXguanMiLCJzcmMvanMvc3RhcnQuanMiLCJzcmMvanMvdXRpbHMvYWN0aXZlLWVsZW1lbnQuanMiLCJzcmMvanMvdXRpbHMvYmVoYXZpb3IuanMiLCJzcmMvanMvdXRpbHMvZm9jdXMtdHJhcC5qcyIsInNyYy9qcy91dGlscy9pcy1pbi12aWV3cG9ydC5qcyIsInNyYy9qcy91dGlscy9zZWxlY3QuanMiLCJzcmMvanMvdXRpbHMvdG9nZ2xlLWZpZWxkLW1hc2suanMiLCJzcmMvanMvdXRpbHMvdG9nZ2xlLWZvcm0taW5wdXQuanMiLCJzcmMvanMvdXRpbHMvdG9nZ2xlLmpzIiwic3JjL2pzL3V0aWxzL3ZhbGlkYXRlLWlucHV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7Ozs7O0FBU0E7O0FBRUE7QUFFQSxJQUFJLGNBQWMsTUFBTSxDQUFDLElBQXpCLEVBQStCO0FBRS9CO0FBQ0E7QUFDQSxNQUFJLEVBQUUsZUFBZSxRQUFRLENBQUMsYUFBVCxDQUF1QixHQUF2QixDQUFqQixLQUNBLFFBQVEsQ0FBQyxlQUFULElBQTRCLEVBQUUsZUFBZSxRQUFRLENBQUMsZUFBVCxDQUF5Qiw0QkFBekIsRUFBc0QsR0FBdEQsQ0FBakIsQ0FEaEMsRUFDOEc7QUFFN0csZUFBVSxJQUFWLEVBQWdCO0FBRWpCOztBQUVBLFVBQUksRUFBRSxhQUFhLElBQWYsQ0FBSixFQUEwQjs7QUFFMUIsVUFDRyxhQUFhLEdBQUcsV0FEbkI7QUFBQSxVQUVHLFNBQVMsR0FBRyxXQUZmO0FBQUEsVUFHRyxZQUFZLEdBQUcsSUFBSSxD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QyxNQUFILENBQVUsQ0FBVixNQUFpQixHQUFqQixHQUNJLFFBQVEsQ0FBQyxhQUFULENBQXVCLEVBQXZCLENBREosR0FFSSxRQUFRLENBQUMsY0FBVCxDQUF3QixFQUF4QixDQUhOOztBQUtBLE1BQUksQ0FBQyxTQUFMLEVBQWdCO0FBQ2QsVUFBTSxJQUFJLEtBQUosa0RBQW1ELEVBQW5ELFFBQU47QUFDRDs7QUFFRCxFQUFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsSUFBZixFQUFxQixPQUFyQixDQUE2QixnQkFBa0I7QUFBQTtBQUFBLFFBQWhCLEdBQWdCO0FBQUEsUUFBWCxLQUFXOztBQUM3QyxRQUFJLEdBQUcsQ0FBQyxVQUFKLENBQWUsVUFBZixDQUFKLEVBQWdDO0FBQzlCLFVBQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxNQUFKLENBQVcsV0FBVyxNQUF0QixFQUE4QixXQUE5QixFQUF0QjtBQUNBLFVBQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFKLENBQVcsS0FBWCxDQUF6QjtBQUNBLFVBQU0saUJBQWlCLCtCQUF1QixhQUF2QixRQUF2QjtBQUNBLFVBQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLGFBQVYsQ0FBd0IsaUJBQXhCLENBQTFCOztBQUVBLFVBQUksQ0FBQyxpQkFBTCxFQUF3QjtBQUN0QixjQUFNLElBQUksS0FBSiw4Q0FBK0MsYUFBL0MsUUFBTjtBQUNEOztBQUVELFVBQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLEVBQUUsQ0FBQyxLQUF6QixDQUFoQjtBQUNBLE1BQUEsaUJBQWlCLENBQUMsU0FBbEIsQ0FBNEIsTUFBNUIsQ0FBbUMsYUFBbkMsRUFBa0QsT0FBbEQ7QUFDQSxNQUFBLGlCQUFpQixDQUFDLFlBQWxCLENBQStCLE9BQS9CLEVBQXdDLE9BQXhDO0FBQ0Q7QUFDRixHQWZEO0FBZ0JELENBNUJEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMS4xLjIwMTcwNDI3XG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogRGVkaWNhdGVkIHRvIHRoZSBwdWJsaWMgZG9tYWluLlxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gd2luZG93LnNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKSBcblx0fHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSkpIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiQW4gaW52YWxpZCBvciBpbGxlZ2FsIHN0cmluZyB3YXMgc3BlY2lmaWVkXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcblx0XHRcdFx0LCBcIlN0cmluZyBjb250YWlucyBhbiBpbnZhbGlkIGNoYXJhY3RlclwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHRva2VuICs9IFwiXCI7XG5cdHJldHVybiBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pICE9PSAtMTtcbn07XG5jbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGlmIChjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pID09PSAtMSkge1xuXHRcdFx0dGhpcy5wdXNoKHRva2VuKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHRcdCwgaW5kZXhcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR3aGlsZSAoaW5kZXggIT09IC0xKSB7XG5cdFx0XHR0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG5cdHRva2VuICs9IFwiXCI7XG5cblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xufTtcblxuaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuXHR2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG5cdFx0ICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuXHRcdCwgZW51bWVyYWJsZTogdHJ1ZVxuXHRcdCwgY29uZmlndXJhYmxlOiB0cnVlXG5cdH07XG5cdHRyeSB7XG5cdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHR9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcblx0XHQvLyBhZGRpbmcgdW5kZWZpbmVkIHRvIGZpZ2h0IHRoaXMgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2lzc3Vlcy8zNlxuXHRcdC8vIG1vZGVybmllIElFOC1NU1c3IG1hY2hpbmUgaGFzIElFOCA4LjAuNjAwMS4xODcwMiBhbmQgaXMgYWZmZWN0ZWRcblx0XHRpZiAoZXgubnVtYmVyID09PSB1bmRlZmluZWQgfHwgZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuXHRcdFx0Y2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuXHRcdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHRcdH1cblx0fVxufSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG5cdGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG59XG5cbn0od2luZG93LnNlbGYpKTtcblxufVxuXG4vLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbi8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG5cdC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuXHRpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG5cdFx0dmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG5cdFx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuXHRcdFx0XHR2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHR0b2tlbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHRcdGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG5cdFx0Y3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcblx0fVxuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuXHQvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuXHRcdHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuXHRcdFx0aWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG5cdFx0XHRcdHJldHVybiBmb3JjZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn1cbiIsIi8qIVxuICAqIGRvbXJlYWR5IChjKSBEdXN0aW4gRGlheiAyMDE0IC0gTGljZW5zZSBNSVRcbiAgKi9cbiFmdW5jdGlvbiAobmFtZSwgZGVmaW5pdGlvbikge1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKVxuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKVxuICBlbHNlIHRoaXNbbmFtZV0gPSBkZWZpbml0aW9uKClcblxufSgnZG9tcmVhZHknLCBmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGZucyA9IFtdLCBsaXN0ZW5lclxuICAgICwgZG9jID0gZG9jdW1lbnRcbiAgICAsIGhhY2sgPSBkb2MuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsXG4gICAgLCBkb21Db250ZW50TG9hZGVkID0gJ0RPTUNvbnRlbnRMb2FkZWQnXG4gICAgLCBsb2FkZWQgPSAoaGFjayA/IC9ebG9hZGVkfF5jLyA6IC9ebG9hZGVkfF5pfF5jLykudGVzdChkb2MucmVhZHlTdGF0ZSlcblxuXG4gIGlmICghbG9hZGVkKVxuICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBsaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBsaXN0ZW5lcilcbiAgICBsb2FkZWQgPSAxXG4gICAgd2hpbGUgKGxpc3RlbmVyID0gZm5zLnNoaWZ0KCkpIGxpc3RlbmVyKClcbiAgfSlcblxuICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgbG9hZGVkID8gc2V0VGltZW91dChmbiwgMCkgOiBmbnMucHVzaChmbilcbiAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gPDMgTW9kZXJuaXpyXG4vLyBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vTW9kZXJuaXpyL01vZGVybml6ci9tYXN0ZXIvZmVhdHVyZS1kZXRlY3RzL2RvbS9kYXRhc2V0LmpzXG5cbmZ1bmN0aW9uIHVzZU5hdGl2ZSgpIHtcblx0dmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ZWxlbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtYS1iJywgJ2MnKTtcblxuXHRyZXR1cm4gQm9vbGVhbihlbGVtLmRhdGFzZXQgJiYgZWxlbS5kYXRhc2V0LmFCID09PSAnYycpO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVEYXRhc2V0KGVsZW1lbnQpIHtcblx0cmV0dXJuIGVsZW1lbnQuZGF0YXNldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1c2VOYXRpdmUoKSA/IG5hdGl2ZURhdGFzZXQgOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuXHR2YXIgbWFwID0ge307XG5cdHZhciBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuXG5cdGZ1bmN0aW9uIGdldHRlcigpIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldHRlcihuYW1lLCB2YWx1ZSkge1xuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aGlzLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuXHRcdH1cblx0fVxuXG5cdGZvciAodmFyIGkgPSAwLCBqID0gYXR0cmlidXRlcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0XHR2YXIgYXR0cmlidXRlID0gYXR0cmlidXRlc1tpXTtcblxuXHRcdGlmIChhdHRyaWJ1dGUpIHtcblx0XHRcdHZhciBuYW1lID0gYXR0cmlidXRlLm5hbWU7XG5cblx0XHRcdGlmIChuYW1lLmluZGV4T2YoJ2RhdGEtJykgPT09IDApIHtcblx0XHRcdFx0dmFyIHByb3AgPSBuYW1lLnNsaWNlKDUpLnJlcGxhY2UoLy0uL2csIGZ1bmN0aW9uICh1KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHUuY2hhckF0KDEpLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZTtcblxuXHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobWFwLCBwcm9wLCB7XG5cdFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0XHRnZXQ6IGdldHRlci5iaW5kKHsgdmFsdWU6IHZhbHVlIHx8ICcnIH0pLFxuXHRcdFx0XHRcdHNldDogc2V0dGVyLmJpbmQoZWxlbWVudCwgbmFtZSlcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG1hcDtcbn07XG5cbiIsIi8vIGVsZW1lbnQtY2xvc2VzdCB8IENDMC0xLjAgfCBnaXRodWIuY29tL2pvbmF0aGFudG5lYWwvY2xvc2VzdFxuXG4oZnVuY3Rpb24gKEVsZW1lbnRQcm90bykge1xuXHRpZiAodHlwZW9mIEVsZW1lbnRQcm90by5tYXRjaGVzICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0RWxlbWVudFByb3RvLm1hdGNoZXMgPSBFbGVtZW50UHJvdG8ubXNNYXRjaGVzU2VsZWN0b3IgfHwgRWxlbWVudFByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fCBFbGVtZW50UHJvdG8ud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGZ1bmN0aW9uIG1hdGNoZXMoc2VsZWN0b3IpIHtcblx0XHRcdHZhciBlbGVtZW50ID0gdGhpcztcblx0XHRcdHZhciBlbGVtZW50cyA9IChlbGVtZW50LmRvY3VtZW50IHx8IGVsZW1lbnQub3duZXJEb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cdFx0XHR2YXIgaW5kZXggPSAwO1xuXG5cdFx0XHR3aGlsZSAoZWxlbWVudHNbaW5kZXhdICYmIGVsZW1lbnRzW2luZGV4XSAhPT0gZWxlbWVudCkge1xuXHRcdFx0XHQrK2luZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gQm9vbGVhbihlbGVtZW50c1tpbmRleF0pO1xuXHRcdH07XG5cdH1cblxuXHRpZiAodHlwZW9mIEVsZW1lbnRQcm90by5jbG9zZXN0ICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0RWxlbWVudFByb3RvLmNsb3Nlc3QgPSBmdW5jdGlvbiBjbG9zZXN0KHNlbGVjdG9yKSB7XG5cdFx0XHR2YXIgZWxlbWVudCA9IHRoaXM7XG5cblx0XHRcdHdoaWxlIChlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT09IDEpIHtcblx0XHRcdFx0aWYgKGVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH07XG5cdH1cbn0pKHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZSk7XG4iLCIvKiBnbG9iYWwgZGVmaW5lLCBLZXlib2FyZEV2ZW50LCBtb2R1bGUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblxuICB2YXIga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsID0ge1xuICAgIHBvbHlmaWxsOiBwb2x5ZmlsbCxcbiAgICBrZXlzOiB7XG4gICAgICAzOiAnQ2FuY2VsJyxcbiAgICAgIDY6ICdIZWxwJyxcbiAgICAgIDg6ICdCYWNrc3BhY2UnLFxuICAgICAgOTogJ1RhYicsXG4gICAgICAxMjogJ0NsZWFyJyxcbiAgICAgIDEzOiAnRW50ZXInLFxuICAgICAgMTY6ICdTaGlmdCcsXG4gICAgICAxNzogJ0NvbnRyb2wnLFxuICAgICAgMTg6ICdBbHQnLFxuICAgICAgMTk6ICdQYXVzZScsXG4gICAgICAyMDogJ0NhcHNMb2NrJyxcbiAgICAgIDI3OiAnRXNjYXBlJyxcbiAgICAgIDI4OiAnQ29udmVydCcsXG4gICAgICAyOTogJ05vbkNvbnZlcnQnLFxuICAgICAgMzA6ICdBY2NlcHQnLFxuICAgICAgMzE6ICdNb2RlQ2hhbmdlJyxcbiAgICAgIDMyOiAnICcsXG4gICAgICAzMzogJ1BhZ2VVcCcsXG4gICAgICAzNDogJ1BhZ2VEb3duJyxcbiAgICAgIDM1OiAnRW5kJyxcbiAgICAgIDM2OiAnSG9tZScsXG4gICAgICAzNzogJ0Fycm93TGVmdCcsXG4gICAgICAzODogJ0Fycm93VXAnLFxuICAgICAgMzk6ICdBcnJvd1JpZ2h0JyxcbiAgICAgIDQwOiAnQXJyb3dEb3duJyxcbiAgICAgIDQxOiAnU2VsZWN0JyxcbiAgICAgIDQyOiAnUHJpbnQnLFxuICAgICAgNDM6ICdFeGVjdXRlJyxcbiAgICAgIDQ0OiAnUHJpbnRTY3JlZW4nLFxuICAgICAgNDU6ICdJbnNlcnQnLFxuICAgICAgNDY6ICdEZWxldGUnLFxuICAgICAgNDg6IFsnMCcsICcpJ10sXG4gICAgICA0OTogWycxJywgJyEnXSxcbiAgICAgIDUwOiBbJzInLCAnQCddLFxuICAgICAgNTE6IFsnMycsICcjJ10sXG4gICAgICA1MjogWyc0JywgJyQnXSxcbiAgICAgIDUzOiBbJzUnLCAnJSddLFxuICAgICAgNTQ6IFsnNicsICdeJ10sXG4gICAgICA1NTogWyc3JywgJyYnXSxcbiAgICAgIDU2OiBbJzgnLCAnKiddLFxuICAgICAgNTc6IFsnOScsICcoJ10sXG4gICAgICA5MTogJ09TJyxcbiAgICAgIDkzOiAnQ29udGV4dE1lbnUnLFxuICAgICAgMTQ0OiAnTnVtTG9jaycsXG4gICAgICAxNDU6ICdTY3JvbGxMb2NrJyxcbiAgICAgIDE4MTogJ1ZvbHVtZU11dGUnLFxuICAgICAgMTgyOiAnVm9sdW1lRG93bicsXG4gICAgICAxODM6ICdWb2x1bWVVcCcsXG4gICAgICAxODY6IFsnOycsICc6J10sXG4gICAgICAxODc6IFsnPScsICcrJ10sXG4gICAgICAxODg6IFsnLCcsICc8J10sXG4gICAgICAxODk6IFsnLScsICdfJ10sXG4gICAgICAxOTA6IFsnLicsICc+J10sXG4gICAgICAxOTE6IFsnLycsICc/J10sXG4gICAgICAxOTI6IFsnYCcsICd+J10sXG4gICAgICAyMTk6IFsnWycsICd7J10sXG4gICAgICAyMjA6IFsnXFxcXCcsICd8J10sXG4gICAgICAyMjE6IFsnXScsICd9J10sXG4gICAgICAyMjI6IFtcIidcIiwgJ1wiJ10sXG4gICAgICAyMjQ6ICdNZXRhJyxcbiAgICAgIDIyNTogJ0FsdEdyYXBoJyxcbiAgICAgIDI0NjogJ0F0dG4nLFxuICAgICAgMjQ3OiAnQ3JTZWwnLFxuICAgICAgMjQ4OiAnRXhTZWwnLFxuICAgICAgMjQ5OiAnRXJhc2VFb2YnLFxuICAgICAgMjUwOiAnUGxheScsXG4gICAgICAyNTE6ICdab29tT3V0J1xuICAgIH1cbiAgfTtcblxuICAvLyBGdW5jdGlvbiBrZXlzIChGMS0yNCkuXG4gIHZhciBpO1xuICBmb3IgKGkgPSAxOyBpIDwgMjU7IGkrKykge1xuICAgIGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbC5rZXlzWzExMSArIGldID0gJ0YnICsgaTtcbiAgfVxuXG4gIC8vIFByaW50YWJsZSBBU0NJSSBjaGFyYWN0ZXJzLlxuICB2YXIgbGV0dGVyID0gJyc7XG4gIGZvciAoaSA9IDY1OyBpIDwgOTE7IGkrKykge1xuICAgIGxldHRlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSk7XG4gICAga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsLmtleXNbaV0gPSBbbGV0dGVyLnRvTG93ZXJDYXNlKCksIGxldHRlci50b1VwcGVyQ2FzZSgpXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlmaWxsICgpIHtcbiAgICBpZiAoISgnS2V5Ym9hcmRFdmVudCcgaW4gd2luZG93KSB8fFxuICAgICAgICAna2V5JyBpbiBLZXlib2FyZEV2ZW50LnByb3RvdHlwZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFBvbHlmaWxsIGBrZXlgIG9uIGBLZXlib2FyZEV2ZW50YC5cbiAgICB2YXIgcHJvdG8gPSB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlib2FyZGV2ZW50S2V5UG9seWZpbGwua2V5c1t0aGlzLndoaWNoIHx8IHRoaXMua2V5Q29kZV07XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICAgIGtleSA9IGtleVsrdGhpcy5zaGlmdEtleV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEtleWJvYXJkRXZlbnQucHJvdG90eXBlLCAna2V5JywgcHJvdG8pO1xuICAgIHJldHVybiBwcm90bztcbiAgfVxuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ2tleWJvYXJkZXZlbnQta2V5LXBvbHlmaWxsJywga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGtleWJvYXJkZXZlbnRLZXlQb2x5ZmlsbDtcbiAgfSBlbHNlIGlmICh3aW5kb3cpIHtcbiAgICB3aW5kb3cua2V5Ym9hcmRldmVudEtleVBvbHlmaWxsID0ga2V5Ym9hcmRldmVudEtleVBvbHlmaWxsO1xuICB9XG5cbn0pKCk7XG4iLCIvKipcbiAqIGxvZGFzaCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IGpRdWVyeSBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnMgPGh0dHBzOi8vanF1ZXJ5Lm9yZy8+XG4gKiBSZWxlYXNlZCB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKi9cblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE5BTiA9IDAgLyAwO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgc3ltYm9sVGFnID0gJ1tvYmplY3QgU3ltYm9sXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4LFxuICAgIG5hdGl2ZU1pbiA9IE1hdGgubWluO1xuXG4vKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG52YXIgbm93ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiByb290LkRhdGUubm93KCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgaW52b2tpbmcgYGZ1bmNgIHVudGlsIGFmdGVyIGB3YWl0YFxuICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXG4gKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXG4gKiBkZWxheWVkIGBmdW5jYCBpbnZvY2F0aW9ucyBhbmQgYSBgZmx1c2hgIG1ldGhvZCB0byBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS5cbiAqIFByb3ZpZGUgYG9wdGlvbnNgIHRvIGluZGljYXRlIHdoZXRoZXIgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZVxuICogbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZFxuICogd2l0aCB0aGUgbGFzdCBhcmd1bWVudHMgcHJvdmlkZWQgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbi4gU3Vic2VxdWVudFxuICogY2FsbHMgdG8gdGhlIGRlYm91bmNlZCBmdW5jdGlvbiByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2BcbiAqIGludm9jYXRpb24uXG4gKlxuICogKipOb3RlOioqIElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAsIGBmdW5jYCBpc1xuICogaW52b2tlZCBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb25cbiAqIGlzIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBJZiBgd2FpdGAgaXMgYDBgIGFuZCBgbGVhZGluZ2AgaXMgYGZhbHNlYCwgYGZ1bmNgIGludm9jYXRpb24gaXMgZGVmZXJyZWRcbiAqIHVudGlsIHRvIHRoZSBuZXh0IHRpY2ssIHNpbWlsYXIgdG8gYHNldFRpbWVvdXRgIHdpdGggYSB0aW1lb3V0IG9mIGAwYC5cbiAqXG4gKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cHM6Ly9jc3MtdHJpY2tzLmNvbS9kZWJvdW5jaW5nLXRocm90dGxpbmctZXhwbGFpbmVkLWV4YW1wbGVzLylcbiAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbd2FpdD0wXSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XVxuICogIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy50cmFpbGluZz10cnVlXVxuICogIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIEF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXguXG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xuICpcbiAqIC8vIEludm9rZSBgc2VuZE1haWxgIHdoZW4gY2xpY2tlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzLlxuICogalF1ZXJ5KGVsZW1lbnQpLm9uKCdjbGljaycsIF8uZGVib3VuY2Uoc2VuZE1haWwsIDMwMCwge1xuICogICAnbGVhZGluZyc6IHRydWUsXG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKlxuICogLy8gRW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxscy5cbiAqIHZhciBkZWJvdW5jZWQgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHsgJ21heFdhaXQnOiAxMDAwIH0pO1xuICogdmFyIHNvdXJjZSA9IG5ldyBFdmVudFNvdXJjZSgnL3N0cmVhbScpO1xuICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBkZWJvdW5jZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgZGVib3VuY2VkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCBkZWJvdW5jZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGFzdEFyZ3MsXG4gICAgICBsYXN0VGhpcyxcbiAgICAgIG1heFdhaXQsXG4gICAgICByZXN1bHQsXG4gICAgICB0aW1lcklkLFxuICAgICAgbGFzdENhbGxUaW1lLFxuICAgICAgbGFzdEludm9rZVRpbWUgPSAwLFxuICAgICAgbGVhZGluZyA9IGZhbHNlLFxuICAgICAgbWF4aW5nID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgd2FpdCA9IHRvTnVtYmVyKHdhaXQpIHx8IDA7XG4gIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAhIW9wdGlvbnMubGVhZGluZztcbiAgICBtYXhpbmcgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucztcbiAgICBtYXhXYWl0ID0gbWF4aW5nID8gbmF0aXZlTWF4KHRvTnVtYmVyKG9wdGlvbnMubWF4V2FpdCkgfHwgMCwgd2FpdCkgOiBtYXhXYWl0O1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBpbnZva2VGdW5jKHRpbWUpIHtcbiAgICB2YXIgYXJncyA9IGxhc3RBcmdzLFxuICAgICAgICB0aGlzQXJnID0gbGFzdFRoaXM7XG5cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBsZWFkaW5nRWRnZSh0aW1lKSB7XG4gICAgLy8gUmVzZXQgYW55IGBtYXhXYWl0YCB0aW1lci5cbiAgICBsYXN0SW52b2tlVGltZSA9IHRpbWU7XG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgdHJhaWxpbmcgZWRnZS5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIC8vIEludm9rZSB0aGUgbGVhZGluZyBlZGdlLlxuICAgIHJldHVybiBsZWFkaW5nID8gaW52b2tlRnVuYyh0aW1lKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWFpbmluZ1dhaXQodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWUsXG4gICAgICAgIHJlc3VsdCA9IHdhaXQgLSB0aW1lU2luY2VMYXN0Q2FsbDtcblxuICAgIHJldHVybiBtYXhpbmcgPyBuYXRpdmVNaW4ocmVzdWx0LCBtYXhXYWl0IC0gdGltZVNpbmNlTGFzdEludm9rZSkgOiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRJbnZva2UodGltZSkge1xuICAgIHZhciB0aW1lU2luY2VMYXN0Q2FsbCA9IHRpbWUgLSBsYXN0Q2FsbFRpbWUsXG4gICAgICAgIHRpbWVTaW5jZUxhc3RJbnZva2UgPSB0aW1lIC0gbGFzdEludm9rZVRpbWU7XG5cbiAgICAvLyBFaXRoZXIgdGhpcyBpcyB0aGUgZmlyc3QgY2FsbCwgYWN0aXZpdHkgaGFzIHN0b3BwZWQgYW5kIHdlJ3JlIGF0IHRoZVxuICAgIC8vIHRyYWlsaW5nIGVkZ2UsIHRoZSBzeXN0ZW0gdGltZSBoYXMgZ29uZSBiYWNrd2FyZHMgYW5kIHdlJ3JlIHRyZWF0aW5nXG4gICAgLy8gaXQgYXMgdGhlIHRyYWlsaW5nIGVkZ2UsIG9yIHdlJ3ZlIGhpdCB0aGUgYG1heFdhaXRgIGxpbWl0LlxuICAgIHJldHVybiAobGFzdENhbGxUaW1lID09PSB1bmRlZmluZWQgfHwgKHRpbWVTaW5jZUxhc3RDYWxsID49IHdhaXQpIHx8XG4gICAgICAodGltZVNpbmNlTGFzdENhbGwgPCAwKSB8fCAobWF4aW5nICYmIHRpbWVTaW5jZUxhc3RJbnZva2UgPj0gbWF4V2FpdCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGltZXJFeHBpcmVkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCk7XG4gICAgaWYgKHNob3VsZEludm9rZSh0aW1lKSkge1xuICAgICAgcmV0dXJuIHRyYWlsaW5nRWRnZSh0aW1lKTtcbiAgICB9XG4gICAgLy8gUmVzdGFydCB0aGUgdGltZXIuXG4gICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCByZW1haW5pbmdXYWl0KHRpbWUpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYWlsaW5nRWRnZSh0aW1lKSB7XG4gICAgdGltZXJJZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIE9ubHkgaW52b2tlIGlmIHdlIGhhdmUgYGxhc3RBcmdzYCB3aGljaCBtZWFucyBgZnVuY2AgaGFzIGJlZW5cbiAgICAvLyBkZWJvdW5jZWQgYXQgbGVhc3Qgb25jZS5cbiAgICBpZiAodHJhaWxpbmcgJiYgbGFzdEFyZ3MpIHtcbiAgICAgIHJldHVybiBpbnZva2VGdW5jKHRpbWUpO1xuICAgIH1cbiAgICBsYXN0QXJncyA9IGxhc3RUaGlzID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKSB7XG4gICAgaWYgKHRpbWVySWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVySWQpO1xuICAgIH1cbiAgICBsYXN0SW52b2tlVGltZSA9IDA7XG4gICAgbGFzdEFyZ3MgPSBsYXN0Q2FsbFRpbWUgPSBsYXN0VGhpcyA9IHRpbWVySWQgPSB1bmRlZmluZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICByZXR1cm4gdGltZXJJZCA9PT0gdW5kZWZpbmVkID8gcmVzdWx0IDogdHJhaWxpbmdFZGdlKG5vdygpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpLFxuICAgICAgICBpc0ludm9raW5nID0gc2hvdWxkSW52b2tlKHRpbWUpO1xuXG4gICAgbGFzdEFyZ3MgPSBhcmd1bWVudHM7XG4gICAgbGFzdFRoaXMgPSB0aGlzO1xuICAgIGxhc3RDYWxsVGltZSA9IHRpbWU7XG5cbiAgICBpZiAoaXNJbnZva2luZykge1xuICAgICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbGVhZGluZ0VkZ2UobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICAgIGlmIChtYXhpbmcpIHtcbiAgICAgICAgLy8gSGFuZGxlIGludm9jYXRpb25zIGluIGEgdGlnaHQgbG9vcC5cbiAgICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAgICAgcmV0dXJuIGludm9rZUZ1bmMobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xuICBkZWJvdW5jZWQuZmx1c2ggPSBmbHVzaDtcbiAgcmV0dXJuIGRlYm91bmNlZDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBudW1iZXIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBudW1iZXIuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udG9OdW1iZXIoMy4yKTtcbiAqIC8vID0+IDMuMlxuICpcbiAqIF8udG9OdW1iZXIoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiA1ZS0zMjRcbiAqXG4gKiBfLnRvTnVtYmVyKEluZmluaXR5KTtcbiAqIC8vID0+IEluZmluaXR5XG4gKlxuICogXy50b051bWJlcignMy4yJyk7XG4gKiAvLyA9PiAzLjJcbiAqL1xuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAoaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIE5BTjtcbiAgfVxuICBpZiAoaXNPYmplY3QodmFsdWUpKSB7XG4gICAgdmFyIG90aGVyID0gdHlwZW9mIHZhbHVlLnZhbHVlT2YgPT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnZhbHVlT2YoKSA6IHZhbHVlO1xuICAgIHZhbHVlID0gaXNPYmplY3Qob3RoZXIpID8gKG90aGVyICsgJycpIDogb3RoZXI7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gMCA/IHZhbHVlIDogK3ZhbHVlO1xuICB9XG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZShyZVRyaW0sICcnKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKlxub2JqZWN0LWFzc2lnblxuKGMpIFNpbmRyZSBTb3JodXNcbkBsaWNlbnNlIE1JVFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctd3JhcHBlcnNcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiY29uc3QgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuY29uc3QgZGVsZWdhdGUgPSByZXF1aXJlKCcuLi9kZWxlZ2F0ZScpO1xuY29uc3QgZGVsZWdhdGVBbGwgPSByZXF1aXJlKCcuLi9kZWxlZ2F0ZUFsbCcpO1xuXG5jb25zdCBERUxFR0FURV9QQVRURVJOID0gL14oLispOmRlbGVnYXRlXFwoKC4rKVxcKSQvO1xuY29uc3QgU1BBQ0UgPSAnICc7XG5cbmNvbnN0IGdldExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUsIGhhbmRsZXIpIHtcbiAgdmFyIG1hdGNoID0gdHlwZS5tYXRjaChERUxFR0FURV9QQVRURVJOKTtcbiAgdmFyIHNlbGVjdG9yO1xuICBpZiAobWF0Y2gpIHtcbiAgICB0eXBlID0gbWF0Y2hbMV07XG4gICAgc2VsZWN0b3IgPSBtYXRjaFsyXTtcbiAgfVxuXG4gIHZhciBvcHRpb25zO1xuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdvYmplY3QnKSB7XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIGNhcHR1cmU6IHBvcEtleShoYW5kbGVyLCAnY2FwdHVyZScpLFxuICAgICAgcGFzc2l2ZTogcG9wS2V5KGhhbmRsZXIsICdwYXNzaXZlJylcbiAgICB9O1xuICB9XG5cbiAgdmFyIGxpc3RlbmVyID0ge1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBkZWxlZ2F0ZTogKHR5cGVvZiBoYW5kbGVyID09PSAnb2JqZWN0JylcbiAgICAgID8gZGVsZWdhdGVBbGwoaGFuZGxlcilcbiAgICAgIDogc2VsZWN0b3JcbiAgICAgICAgPyBkZWxlZ2F0ZShzZWxlY3RvciwgaGFuZGxlcilcbiAgICAgICAgOiBoYW5kbGVyLFxuICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgfTtcblxuICBpZiAodHlwZS5pbmRleE9mKFNQQUNFKSA+IC0xKSB7XG4gICAgcmV0dXJuIHR5cGUuc3BsaXQoU1BBQ0UpLm1hcChmdW5jdGlvbihfdHlwZSkge1xuICAgICAgcmV0dXJuIGFzc2lnbih7dHlwZTogX3R5cGV9LCBsaXN0ZW5lcik7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgbGlzdGVuZXIudHlwZSA9IHR5cGU7XG4gICAgcmV0dXJuIFtsaXN0ZW5lcl07XG4gIH1cbn07XG5cbnZhciBwb3BLZXkgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgZGVsZXRlIG9ialtrZXldO1xuICByZXR1cm4gdmFsdWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJlaGF2aW9yKGV2ZW50cywgcHJvcHMpIHtcbiAgY29uc3QgbGlzdGVuZXJzID0gT2JqZWN0LmtleXMoZXZlbnRzKVxuICAgIC5yZWR1Y2UoZnVuY3Rpb24obWVtbywgdHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IGdldExpc3RlbmVycyh0eXBlLCBldmVudHNbdHlwZV0pO1xuICAgICAgcmV0dXJuIG1lbW8uY29uY2F0KGxpc3RlbmVycyk7XG4gICAgfSwgW10pO1xuXG4gIHJldHVybiBhc3NpZ24oe1xuICAgIGFkZDogZnVuY3Rpb24gYWRkQmVoYXZpb3IoZWxlbWVudCkge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIGxpc3RlbmVyLnR5cGUsXG4gICAgICAgICAgbGlzdGVuZXIuZGVsZWdhdGUsXG4gICAgICAgICAgbGlzdGVuZXIub3B0aW9uc1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZUJlaGF2aW9yKGVsZW1lbnQpIHtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBsaXN0ZW5lci50eXBlLFxuICAgICAgICAgIGxpc3RlbmVyLmRlbGVnYXRlLFxuICAgICAgICAgIGxpc3RlbmVyLm9wdGlvbnNcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgcHJvcHMpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29tcG9zZShmdW5jdGlvbnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb25zLnNvbWUoZnVuY3Rpb24oZm4pIHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGUpID09PSBmYWxzZTtcbiAgICB9LCB0aGlzKTtcbiAgfTtcbn07XG4iLCIvLyBwb2x5ZmlsbCBFbGVtZW50LnByb3RvdHlwZS5jbG9zZXN0XG5yZXF1aXJlKCdlbGVtZW50LWNsb3Nlc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWxlZ2F0ZShzZWxlY3RvciwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlbGVnYXRpb24oZXZlbnQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3Qoc2VsZWN0b3IpO1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRhcmdldCwgZXZlbnQpO1xuICAgIH1cbiAgfVxufTtcbiIsImNvbnN0IGRlbGVnYXRlID0gcmVxdWlyZSgnLi4vZGVsZWdhdGUnKTtcbmNvbnN0IGNvbXBvc2UgPSByZXF1aXJlKCcuLi9jb21wb3NlJyk7XG5cbmNvbnN0IFNQTEFUID0gJyonO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlbGVnYXRlQWxsKHNlbGVjdG9ycykge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc2VsZWN0b3JzKVxuXG4gIC8vIFhYWCBvcHRpbWl6YXRpb246IGlmIHRoZXJlIGlzIG9ubHkgb25lIGhhbmRsZXIgYW5kIGl0IGFwcGxpZXMgdG9cbiAgLy8gYWxsIGVsZW1lbnRzICh0aGUgXCIqXCIgQ1NTIHNlbGVjdG9yKSwgdGhlbiBqdXN0IHJldHVybiB0aGF0XG4gIC8vIGhhbmRsZXJcbiAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFNQTEFUKSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yc1tTUExBVF07XG4gIH1cblxuICBjb25zdCBkZWxlZ2F0ZXMgPSBrZXlzLnJlZHVjZShmdW5jdGlvbihtZW1vLCBzZWxlY3Rvcikge1xuICAgIG1lbW8ucHVzaChkZWxlZ2F0ZShzZWxlY3Rvciwgc2VsZWN0b3JzW3NlbGVjdG9yXSkpO1xuICAgIHJldHVybiBtZW1vO1xuICB9LCBbXSk7XG4gIHJldHVybiBjb21wb3NlKGRlbGVnYXRlcyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpZ25vcmUoZWxlbWVudCwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGlnbm9yYW5jZShlKSB7XG4gICAgaWYgKGVsZW1lbnQgIT09IGUudGFyZ2V0ICYmICFlbGVtZW50LmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZSk7XG4gICAgfVxuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBiZWhhdmlvcjogICAgIHJlcXVpcmUoJy4vYmVoYXZpb3InKSxcbiAgZGVsZWdhdGU6ICAgICByZXF1aXJlKCcuL2RlbGVnYXRlJyksXG4gIGRlbGVnYXRlQWxsOiAgcmVxdWlyZSgnLi9kZWxlZ2F0ZUFsbCcpLFxuICBpZ25vcmU6ICAgICAgIHJlcXVpcmUoJy4vaWdub3JlJyksXG4gIGtleW1hcDogICAgICAgcmVxdWlyZSgnLi9rZXltYXAnKSxcbn07XG4iLCJyZXF1aXJlKCdrZXlib2FyZGV2ZW50LWtleS1wb2x5ZmlsbCcpO1xuXG4vLyB0aGVzZSBhcmUgdGhlIG9ubHkgcmVsZXZhbnQgbW9kaWZpZXJzIHN1cHBvcnRlZCBvbiBhbGwgcGxhdGZvcm1zLFxuLy8gYWNjb3JkaW5nIHRvIE1ETjpcbi8vIDxodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvS2V5Ym9hcmRFdmVudC9nZXRNb2RpZmllclN0YXRlPlxuY29uc3QgTU9ESUZJRVJTID0ge1xuICAnQWx0JzogICAgICAnYWx0S2V5JyxcbiAgJ0NvbnRyb2wnOiAgJ2N0cmxLZXknLFxuICAnQ3RybCc6ICAgICAnY3RybEtleScsXG4gICdTaGlmdCc6ICAgICdzaGlmdEtleSdcbn07XG5cbmNvbnN0IE1PRElGSUVSX1NFUEFSQVRPUiA9ICcrJztcblxuY29uc3QgZ2V0RXZlbnRLZXkgPSBmdW5jdGlvbihldmVudCwgaGFzTW9kaWZpZXJzKSB7XG4gIHZhciBrZXkgPSBldmVudC5rZXk7XG4gIGlmIChoYXNNb2RpZmllcnMpIHtcbiAgICBmb3IgKHZhciBtb2RpZmllciBpbiBNT0RJRklFUlMpIHtcbiAgICAgIGlmIChldmVudFtNT0RJRklFUlNbbW9kaWZpZXJdXSA9PT0gdHJ1ZSkge1xuICAgICAgICBrZXkgPSBbbW9kaWZpZXIsIGtleV0uam9pbihNT0RJRklFUl9TRVBBUkFUT1IpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4ga2V5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBrZXltYXAoa2V5cykge1xuICBjb25zdCBoYXNNb2RpZmllcnMgPSBPYmplY3Qua2V5cyhrZXlzKS5zb21lKGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBrZXkuaW5kZXhPZihNT0RJRklFUl9TRVBBUkFUT1IpID4gLTE7XG4gIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIga2V5ID0gZ2V0RXZlbnRLZXkoZXZlbnQsIGhhc01vZGlmaWVycyk7XG4gICAgcmV0dXJuIFtrZXksIGtleS50b0xvd2VyQ2FzZSgpXVxuICAgICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHQsIF9rZXkpIHtcbiAgICAgICAgaWYgKF9rZXkgaW4ga2V5cykge1xuICAgICAgICAgIHJlc3VsdCA9IGtleXNba2V5XS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSwgdW5kZWZpbmVkKTtcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLk1PRElGSUVSUyA9IE1PRElGSUVSUztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb25jZShsaXN0ZW5lciwgb3B0aW9ucykge1xuICB2YXIgd3JhcHBlZCA9IGZ1bmN0aW9uIHdyYXBwZWRPbmNlKGUpIHtcbiAgICBlLmN1cnJlbnRUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihlLnR5cGUsIHdyYXBwZWQsIG9wdGlvbnMpO1xuICAgIHJldHVybiBsaXN0ZW5lci5jYWxsKHRoaXMsIGUpO1xuICB9O1xuICByZXR1cm4gd3JhcHBlZDtcbn07XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJFX1RSSU0gPSAvKF5cXHMrKXwoXFxzKyQpL2c7XG52YXIgUkVfU1BMSVQgPSAvXFxzKy87XG5cbnZhciB0cmltID0gU3RyaW5nLnByb3RvdHlwZS50cmltXG4gID8gZnVuY3Rpb24oc3RyKSB7IHJldHVybiBzdHIudHJpbSgpOyB9XG4gIDogZnVuY3Rpb24oc3RyKSB7IHJldHVybiBzdHIucmVwbGFjZShSRV9UUklNLCAnJyk7IH07XG5cbnZhciBxdWVyeUJ5SWQgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gdGhpcy5xdWVyeVNlbGVjdG9yKCdbaWQ9XCInICsgaWQucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpICsgJ1wiXScpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZXNvbHZlSWRzKGlkcywgZG9jKSB7XG4gIGlmICh0eXBlb2YgaWRzICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgYSBzdHJpbmcgYnV0IGdvdCAnICsgKHR5cGVvZiBpZHMpKTtcbiAgfVxuXG4gIGlmICghZG9jKSB7XG4gICAgZG9jID0gd2luZG93LmRvY3VtZW50O1xuICB9XG5cbiAgdmFyIGdldEVsZW1lbnRCeUlkID0gZG9jLmdldEVsZW1lbnRCeUlkXG4gICAgPyBkb2MuZ2V0RWxlbWVudEJ5SWQuYmluZChkb2MpXG4gICAgOiBxdWVyeUJ5SWQuYmluZChkb2MpO1xuXG4gIGlkcyA9IHRyaW0oaWRzKS5zcGxpdChSRV9TUExJVCk7XG5cbiAgLy8gWFhYIHdlIGNhbiBzaG9ydC1jaXJjdWl0IGhlcmUgYmVjYXVzZSB0cmltbWluZyBhbmQgc3BsaXR0aW5nIGFcbiAgLy8gc3RyaW5nIG9mIGp1c3Qgd2hpdGVzcGFjZSBwcm9kdWNlcyBhbiBhcnJheSBjb250YWluaW5nIGEgc2luZ2xlLFxuICAvLyBlbXB0eSBzdHJpbmdcbiAgaWYgKGlkcy5sZW5ndGggPT09IDEgJiYgaWRzWzBdID09PSAnJykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiBpZHNcbiAgICAubWFwKGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgZWwgPSBnZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICBpZiAoIWVsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gZWxlbWVudCB3aXRoIGlkOiBcIicgKyBpZCArICdcIicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsO1xuICAgIH0pO1xufTtcbiIsImNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi91dGlscy9zZWxlY3RcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHRvZ2dsZSA9IHJlcXVpcmUoXCIuLi91dGlscy90b2dnbGVcIik7XG5jb25zdCBpc0VsZW1lbnRJblZpZXdwb3J0ID0gcmVxdWlyZShcIi4uL3V0aWxzL2lzLWluLXZpZXdwb3J0XCIpO1xuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uL2V2ZW50c1wiKTtcbmNvbnN0IHsgcHJlZml4OiBQUkVGSVggfSA9IHJlcXVpcmUoXCIuLi9jb25maWdcIik7XG5cbmNvbnN0IEFDQ09SRElPTiA9IGAuJHtQUkVGSVh9LWFjY29yZGlvbiwgLiR7UFJFRklYfS1hY2NvcmRpb24tLWJvcmRlcmVkYDtcbmNvbnN0IEJVVFRPTiA9IGAuJHtQUkVGSVh9LWFjY29yZGlvbl9fYnV0dG9uW2FyaWEtY29udHJvbHNdYDtcbmNvbnN0IEVYUEFOREVEID0gXCJhcmlhLWV4cGFuZGVkXCI7XG5jb25zdCBNVUxUSVNFTEVDVEFCTEUgPSBcImFyaWEtbXVsdGlzZWxlY3RhYmxlXCI7XG5cbi8qKlxuICogR2V0IGFuIEFycmF5IG9mIGJ1dHRvbiBlbGVtZW50cyBiZWxvbmdpbmcgZGlyZWN0bHkgdG8gdGhlIGdpdmVuXG4gKiBhY2NvcmRpb24gZWxlbWVudC5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGFjY29yZGlvblxuICogQHJldHVybiB7YXJyYXk8SFRNTEJ1dHRvbkVsZW1lbnQ+fVxuICovXG5jb25zdCBnZXRBY2NvcmRpb25CdXR0b25zID0gYWNjb3JkaW9uID0+IHtcbiAgY29uc3QgYnV0dG9ucyA9IHNlbGVjdChCVVRUT04sIGFjY29yZGlvbik7XG5cbiAgcmV0dXJuIGJ1dHRvbnMuZmlsdGVyKGJ1dHRvbiA9PiBidXR0b24uY2xvc2VzdChBQ0NPUkRJT04pID09PSBhY2NvcmRpb24pO1xufTtcblxuLyoqXG4gKiBUb2dnbGUgYSBidXR0b24ncyBcInByZXNzZWRcIiBzdGF0ZSwgb3B0aW9uYWxseSBwcm92aWRpbmcgYSB0YXJnZXRcbiAqIHN0YXRlLlxuICpcbiAqIEBwYXJhbSB7SFRNTEJ1dHRvbkVsZW1lbnR9IGJ1dHRvblxuICogQHBhcmFtIHtib29sZWFuP30gZXhwYW5kZWQgSWYgbm8gc3RhdGUgaXMgcHJvdmlkZWQsIHRoZSBjdXJyZW50XG4gKiBzdGF0ZSB3aWxsIGJlIHRvZ2dsZWQgKGZyb20gZmFsc2UgdG8gdHJ1ZSwgYW5kIHZpY2UtdmVyc2EpLlxuICogQHJldHVybiB7Ym9vbGVhbn0gdGhlIHJlc3VsdGluZyBzdGF0ZVxuICovXG5jb25zdCB0b2dnbGVCdXR0b24gPSAoYnV0dG9uLCBleHBhbmRlZCkgPT4ge1xuICBjb25zdCBhY2NvcmRpb24gPSBidXR0b24uY2xvc2VzdChBQ0NPUkRJT04pO1xuICBsZXQgc2FmZUV4cGFuZGVkID0gZXhwYW5kZWQ7XG5cbiAgaWYgKCFhY2NvcmRpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7QlVUVE9OfSBpcyBtaXNzaW5nIG91dGVyICR7QUNDT1JESU9OfWApO1xuICB9XG5cbiAgc2FmZUV4cGFuZGVkID0gdG9nZ2xlKGJ1dHRvbiwgZXhwYW5kZWQpO1xuXG4gIC8vIFhYWCBtdWx0aXNlbGVjdGFibGUgaXMgb3B0LWluLCB0byBwcmVzZXJ2ZSBsZWdhY3kgYmVoYXZpb3JcbiAgY29uc3QgbXVsdGlzZWxlY3RhYmxlID0gYWNjb3JkaW9uLmdldEF0dHJpYnV0ZShNVUxUSVNFTEVDVEFCTEUpID09PSBcInRydWVcIjtcblxuICBpZiAoc2FmZUV4cGFuZGVkICYmICFtdWx0aXNlbGVjdGFibGUpIHtcbiAgICBnZXRBY2NvcmRpb25CdXR0b25zKGFjY29yZGlvbikuZm9yRWFjaChvdGhlciA9PiB7XG4gICAgICBpZiAob3RoZXIgIT09IGJ1dHRvbikge1xuICAgICAgICB0b2dnbGUob3RoZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBidXR0b25cbiAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWVcbiAqL1xuY29uc3Qgc2hvd0J1dHRvbiA9IGJ1dHRvbiA9PiB0b2dnbGVCdXR0b24oYnV0dG9uLCB0cnVlKTtcblxuLyoqXG4gKiBAcGFyYW0ge0hUTUxCdXR0b25FbGVtZW50fSBidXR0b25cbiAqIEByZXR1cm4ge2Jvb2xlYW59IGZhbHNlXG4gKi9cbmNvbnN0IGhpZGVCdXR0b24gPSBidXR0b24gPT4gdG9nZ2xlQnV0dG9uKGJ1dHRvbiwgZmFsc2UpO1xuXG5jb25zdCBhY2NvcmRpb24gPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtCVVRUT05dKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdG9nZ2xlQnV0dG9uKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgLy8gV2Ugd2VyZSBqdXN0IGV4cGFuZGVkLCBidXQgaWYgYW5vdGhlciBhY2NvcmRpb24gd2FzIGFsc28ganVzdFxuICAgICAgICAgIC8vIGNvbGxhcHNlZCwgd2UgbWF5IG5vIGxvbmdlciBiZSBpbiB0aGUgdmlld3BvcnQuIFRoaXMgZW5zdXJlc1xuICAgICAgICAgIC8vIHRoYXQgd2UgYXJlIHN0aWxsIHZpc2libGUsIHNvIHRoZSB1c2VyIGlzbid0IGNvbmZ1c2VkLlxuICAgICAgICAgIGlmICghaXNFbGVtZW50SW5WaWV3cG9ydCh0aGlzKSkgdGhpcy5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICB7XG4gICAgaW5pdChyb290KSB7XG4gICAgICBzZWxlY3QoQlVUVE9OLCByb290KS5mb3JFYWNoKGJ1dHRvbiA9PiB7XG4gICAgICAgIGNvbnN0IGV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwidHJ1ZVwiO1xuICAgICAgICB0b2dnbGVCdXR0b24oYnV0dG9uLCBleHBhbmRlZCk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIEFDQ09SRElPTixcbiAgICBCVVRUT04sXG4gICAgc2hvdzogc2hvd0J1dHRvbixcbiAgICBoaWRlOiBoaWRlQnV0dG9uLFxuICAgIHRvZ2dsZTogdG9nZ2xlQnV0dG9uLFxuICAgIGdldEJ1dHRvbnM6IGdldEFjY29yZGlvbkJ1dHRvbnNcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhY2NvcmRpb247XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBIRUFERVIgPSBgLiR7UFJFRklYfS1iYW5uZXJfX2hlYWRlcmA7XG5jb25zdCBFWFBBTkRFRF9DTEFTUyA9IGAke1BSRUZJWH0tYmFubmVyX19oZWFkZXItLWV4cGFuZGVkYDtcblxuY29uc3QgdG9nZ2xlQmFubmVyID0gZnVuY3Rpb24gdG9nZ2xlRWwoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgdGhpcy5jbG9zZXN0KEhFQURFUikuY2xhc3NMaXN0LnRvZ2dsZShFWFBBTkRFRF9DTEFTUyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKHtcbiAgW0NMSUNLXToge1xuICAgIFtgJHtIRUFERVJ9IFthcmlhLWNvbnRyb2xzXWBdOiB0b2dnbGVCYW5uZXJcbiAgfVxufSk7XG4iLCJjb25zdCBkZWJvdW5jZSA9IHJlcXVpcmUoXCJsb2Rhc2guZGVib3VuY2VcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi91dGlscy9zZWxlY3RcIik7XG5jb25zdCB7IENMSUNLIH0gPSByZXF1aXJlKFwiLi4vZXZlbnRzXCIpO1xuY29uc3QgeyBwcmVmaXg6IFBSRUZJWCB9ID0gcmVxdWlyZShcIi4uL2NvbmZpZ1wiKTtcblxuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcbmNvbnN0IFNDT1BFID0gYC4ke1BSRUZJWH0tZm9vdGVyLS1iaWdgO1xuY29uc3QgTkFWID0gYCR7U0NPUEV9IG5hdmA7XG5jb25zdCBCVVRUT04gPSBgJHtOQVZ9IC4ke1BSRUZJWH0tZm9vdGVyX19wcmltYXJ5LWxpbmtgO1xuY29uc3QgQ09MTEFQU0lCTEUgPSBgLiR7UFJFRklYfS1mb290ZXJfX3ByaW1hcnktY29udGVudC0tY29sbGFwc2libGVgO1xuXG5jb25zdCBISURFX01BWF9XSURUSCA9IDQ4MDtcbmNvbnN0IERFQk9VTkNFX1JBVEUgPSAxODA7XG5cbmZ1bmN0aW9uIHNob3dQYW5lbCgpIHtcbiAgaWYgKHdpbmRvdy5pbm5lcldpZHRoIDwgSElERV9NQVhfV0lEVEgpIHtcbiAgICBjb25zdCBjb2xsYXBzZUVsID0gdGhpcy5jbG9zZXN0KENPTExBUFNJQkxFKTtcbiAgICBjb2xsYXBzZUVsLmNsYXNzTGlzdC50b2dnbGUoSElEREVOKTtcblxuICAgIC8vIE5COiB0aGlzICpzaG91bGQqIGFsd2F5cyBzdWNjZWVkIGJlY2F1c2UgdGhlIGJ1dHRvblxuICAgIC8vIHNlbGVjdG9yIGlzIHNjb3BlZCB0byBcIi57cHJlZml4fS1mb290ZXItYmlnIG5hdlwiXG4gICAgY29uc3QgY29sbGFwc2libGVFbHMgPSBzZWxlY3QoQ09MTEFQU0lCTEUsIGNvbGxhcHNlRWwuY2xvc2VzdChOQVYpKTtcblxuICAgIGNvbGxhcHNpYmxlRWxzLmZvckVhY2goZWwgPT4ge1xuICAgICAgaWYgKGVsICE9PSBjb2xsYXBzZUVsKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoSElEREVOKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5sZXQgbGFzdElubmVyV2lkdGg7XG5cbmNvbnN0IHJlc2l6ZSA9IGRlYm91bmNlKCgpID0+IHtcbiAgaWYgKGxhc3RJbm5lcldpZHRoID09PSB3aW5kb3cuaW5uZXJXaWR0aCkgcmV0dXJuO1xuICBsYXN0SW5uZXJXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICBjb25zdCBoaWRkZW4gPSB3aW5kb3cuaW5uZXJXaWR0aCA8IEhJREVfTUFYX1dJRFRIO1xuICBzZWxlY3QoQ09MTEFQU0lCTEUpLmZvckVhY2gobGlzdCA9PiBsaXN0LmNsYXNzTGlzdC50b2dnbGUoSElEREVOLCBoaWRkZW4pKTtcbn0sIERFQk9VTkNFX1JBVEUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW0JVVFRPTl06IHNob3dQYW5lbFxuICAgIH1cbiAgfSxcbiAge1xuICAgIC8vIGV4cG9ydCBmb3IgdXNlIGVsc2V3aGVyZVxuICAgIEhJREVfTUFYX1dJRFRILFxuICAgIERFQk9VTkNFX1JBVEUsXG5cbiAgICBpbml0KCkge1xuICAgICAgcmVzaXplKCk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCByZXNpemUpO1xuICAgIH0sXG5cbiAgICB0ZWFyZG93bigpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHJlc2l6ZSk7XG4gICAgfVxuICB9XG4pO1xuIiwiY29uc3QgYWNjb3JkaW9uID0gcmVxdWlyZShcIi4vYWNjb3JkaW9uXCIpO1xuY29uc3QgYmFubmVyID0gcmVxdWlyZShcIi4vYmFubmVyXCIpO1xuY29uc3QgZm9vdGVyID0gcmVxdWlyZShcIi4vZm9vdGVyXCIpO1xuY29uc3QgbmF2aWdhdGlvbiA9IHJlcXVpcmUoXCIuL25hdmlnYXRpb25cIik7XG5jb25zdCBwYXNzd29yZCA9IHJlcXVpcmUoXCIuL3Bhc3N3b3JkXCIpO1xuY29uc3Qgc2VhcmNoID0gcmVxdWlyZShcIi4vc2VhcmNoXCIpO1xuY29uc3Qgc2tpcG5hdiA9IHJlcXVpcmUoXCIuL3NraXBuYXZcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi92YWxpZGF0b3JcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY2NvcmRpb24sXG4gIGJhbm5lcixcbiAgZm9vdGVyLFxuICBuYXZpZ2F0aW9uLFxuICBwYXNzd29yZCxcbiAgc2VhcmNoLFxuICBza2lwbmF2LFxuICB2YWxpZGF0b3Jcbn07XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHNlbGVjdCA9IHJlcXVpcmUoXCIuLi91dGlscy9zZWxlY3RcIik7XG5jb25zdCB0b2dnbGUgPSByZXF1aXJlKFwiLi4vdXRpbHMvdG9nZ2xlXCIpO1xuY29uc3QgRm9jdXNUcmFwID0gcmVxdWlyZShcIi4uL3V0aWxzL2ZvY3VzLXRyYXBcIik7XG5jb25zdCBhY2NvcmRpb24gPSByZXF1aXJlKFwiLi9hY2NvcmRpb25cIik7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBCT0RZID0gXCJib2R5XCI7XG5jb25zdCBOQVYgPSBgLiR7UFJFRklYfS1uYXZgO1xuY29uc3QgTkFWX0xJTktTID0gYCR7TkFWfSBhYDtcbmNvbnN0IE5BVl9DT05UUk9MID0gYGJ1dHRvbi4ke1BSRUZJWH0tbmF2X19saW5rYDtcbmNvbnN0IE9QRU5FUlMgPSBgLiR7UFJFRklYfS1tZW51LWJ0bmA7XG5jb25zdCBDTE9TRV9CVVRUT04gPSBgLiR7UFJFRklYfS1uYXZfX2Nsb3NlYDtcbmNvbnN0IE9WRVJMQVkgPSBgLiR7UFJFRklYfS1vdmVybGF5YDtcbmNvbnN0IENMT1NFUlMgPSBgJHtDTE9TRV9CVVRUT059LCAuJHtQUkVGSVh9LW92ZXJsYXlgO1xuY29uc3QgVE9HR0xFUyA9IFtOQVYsIE9WRVJMQVldLmpvaW4oXCIsIFwiKTtcblxuY29uc3QgQUNUSVZFX0NMQVNTID0gXCJ1c2EtanMtbW9iaWxlLW5hdi0tYWN0aXZlXCI7XG5jb25zdCBWSVNJQkxFX0NMQVNTID0gXCJpcy12aXNpYmxlXCI7XG5cbmxldCBuYXZpZ2F0aW9uO1xubGV0IG5hdkFjdGl2ZTtcblxuY29uc3QgaXNBY3RpdmUgPSAoKSA9PiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhBQ1RJVkVfQ0xBU1MpO1xuXG5jb25zdCB0b2dnbGVOYXYgPSBhY3RpdmUgPT4ge1xuICBjb25zdCB7IGJvZHkgfSA9IGRvY3VtZW50O1xuICBjb25zdCBzYWZlQWN0aXZlID0gdHlwZW9mIGFjdGl2ZSA9PT0gXCJib29sZWFuXCIgPyBhY3RpdmUgOiAhaXNBY3RpdmUoKTtcblxuICBib2R5LmNsYXNzTGlzdC50b2dnbGUoQUNUSVZFX0NMQVNTLCBzYWZlQWN0aXZlKTtcblxuICBzZWxlY3QoVE9HR0xFUykuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QudG9nZ2xlKFZJU0lCTEVfQ0xBU1MsIHNhZmVBY3RpdmUpKTtcblxuICBuYXZpZ2F0aW9uLmZvY3VzVHJhcC51cGRhdGUoc2FmZUFjdGl2ZSk7XG5cbiAgY29uc3QgY2xvc2VCdXR0b24gPSBib2R5LnF1ZXJ5U2VsZWN0b3IoQ0xPU0VfQlVUVE9OKTtcbiAgY29uc3QgbWVudUJ1dHRvbiA9IGJvZHkucXVlcnlTZWxlY3RvcihPUEVORVJTKTtcblxuICBpZiAoc2FmZUFjdGl2ZSAmJiBjbG9zZUJ1dHRvbikge1xuICAgIC8vIFRoZSBtb2JpbGUgbmF2IHdhcyBqdXN0IGFjdGl2YXRlZCwgc28gZm9jdXMgb24gdGhlIGNsb3NlIGJ1dHRvbixcbiAgICAvLyB3aGljaCBpcyBqdXN0IGJlZm9yZSBhbGwgdGhlIG5hdiBlbGVtZW50cyBpbiB0aGUgdGFiIG9yZGVyLlxuICAgIGNsb3NlQnV0dG9uLmZvY3VzKCk7XG4gIH0gZWxzZSBpZiAoXG4gICAgIXNhZmVBY3RpdmUgJiZcbiAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBjbG9zZUJ1dHRvbiAmJlxuICAgIG1lbnVCdXR0b25cbiAgKSB7XG4gICAgLy8gVGhlIG1vYmlsZSBuYXYgd2FzIGp1c3QgZGVhY3RpdmF0ZWQsIGFuZCBmb2N1cyB3YXMgb24gdGhlIGNsb3NlXG4gICAgLy8gYnV0dG9uLCB3aGljaCBpcyBubyBsb25nZXIgdmlzaWJsZS4gV2UgZG9uJ3Qgd2FudCB0aGUgZm9jdXMgdG9cbiAgICAvLyBkaXNhcHBlYXIgaW50byB0aGUgdm9pZCwgc28gZm9jdXMgb24gdGhlIG1lbnUgYnV0dG9uIGlmIGl0J3NcbiAgICAvLyB2aXNpYmxlICh0aGlzIG1heSBoYXZlIGJlZW4gd2hhdCB0aGUgdXNlciB3YXMganVzdCBmb2N1c2VkIG9uLFxuICAgIC8vIGlmIHRoZXkgdHJpZ2dlcmVkIHRoZSBtb2JpbGUgbmF2IGJ5IG1pc3Rha2UpLlxuICAgIG1lbnVCdXR0b24uZm9jdXMoKTtcbiAgfVxuXG4gIHJldHVybiBzYWZlQWN0aXZlO1xufTtcblxuY29uc3QgcmVzaXplID0gKCkgPT4ge1xuICBjb25zdCBjbG9zZXIgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoQ0xPU0VfQlVUVE9OKTtcblxuICBpZiAoaXNBY3RpdmUoKSAmJiBjbG9zZXIgJiYgY2xvc2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoID09PSAwKSB7XG4gICAgLy8gV2hlbiB0aGUgbW9iaWxlIG5hdiBpcyBhY3RpdmUsIGFuZCB0aGUgY2xvc2UgYm94IGlzbid0IHZpc2libGUsXG4gICAgLy8gd2Uga25vdyB0aGUgdXNlcidzIHZpZXdwb3J0IGhhcyBiZWVuIHJlc2l6ZWQgdG8gYmUgbGFyZ2VyLlxuICAgIC8vIExldCdzIG1ha2UgdGhlIHBhZ2Ugc3RhdGUgY29uc2lzdGVudCBieSBkZWFjdGl2YXRpbmcgdGhlIG1vYmlsZSBuYXYuXG4gICAgbmF2aWdhdGlvbi50b2dnbGVOYXYuY2FsbChjbG9zZXIsIGZhbHNlKTtcbiAgfVxufTtcblxuY29uc3Qgb25NZW51Q2xvc2UgPSAoKSA9PiBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcbmNvbnN0IGhpZGVBY3RpdmVOYXZEcm9wZG93biA9ICgpID0+IHtcbiAgdG9nZ2xlKG5hdkFjdGl2ZSwgZmFsc2UpO1xuICBuYXZBY3RpdmUgPSBudWxsO1xufTtcblxubmF2aWdhdGlvbiA9IGJlaGF2aW9yKFxuICB7XG4gICAgW0NMSUNLXToge1xuICAgICAgW05BVl9DT05UUk9MXSgpIHtcbiAgICAgICAgLy8gSWYgYW5vdGhlciBuYXYgaXMgb3BlbiwgY2xvc2UgaXRcbiAgICAgICAgaWYgKG5hdkFjdGl2ZSAmJiBuYXZBY3RpdmUgIT09IHRoaXMpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdCBjbGlja2VkIG5hdiBsaW5rIGVsZW1lbnQsIHNvIHdlXG4gICAgICAgIC8vIGNhbiBoaWRlIHRoZSBkcm9wZG93biBpZiBhbm90aGVyIGVsZW1lbnQgb24gdGhlIHBhZ2UgaXMgY2xpY2tlZFxuICAgICAgICBpZiAobmF2QWN0aXZlKSB7XG4gICAgICAgICAgaGlkZUFjdGl2ZU5hdkRyb3Bkb3duKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmF2QWN0aXZlID0gdGhpcztcbiAgICAgICAgICB0b2dnbGUobmF2QWN0aXZlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvIHRoaXMgc28gdGhlIGV2ZW50IGhhbmRsZXIgb24gdGhlIGJvZHkgZG9lc24ndCBmaXJlXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICBbQk9EWV0oKSB7XG4gICAgICAgIGlmIChuYXZBY3RpdmUpIHtcbiAgICAgICAgICBoaWRlQWN0aXZlTmF2RHJvcGRvd24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFtPUEVORVJTXTogdG9nZ2xlTmF2LFxuICAgICAgW0NMT1NFUlNdOiB0b2dnbGVOYXYsXG4gICAgICBbTkFWX0xJTktTXSgpIHtcbiAgICAgICAgLy8gQSBuYXZpZ2F0aW9uIGxpbmsgaGFzIGJlZW4gY2xpY2tlZCEgV2Ugd2FudCB0byBjb2xsYXBzZSBhbnlcbiAgICAgICAgLy8gaGllcmFyY2hpY2FsIG5hdmlnYXRpb24gVUkgaXQncyBhIHBhcnQgb2YsIHNvIHRoYXQgdGhlIHVzZXJcbiAgICAgICAgLy8gY2FuIGZvY3VzIG9uIHdoYXRldmVyIHRoZXkndmUganVzdCBzZWxlY3RlZC5cblxuICAgICAgICAvLyBTb21lIG5hdmlnYXRpb24gbGlua3MgYXJlIGluc2lkZSBhY2NvcmRpb25zOyB3aGVuIHRoZXkncmVcbiAgICAgICAgLy8gY2xpY2tlZCwgd2Ugd2FudCB0byBjb2xsYXBzZSB0aG9zZSBhY2NvcmRpb25zLlxuICAgICAgICBjb25zdCBhY2MgPSB0aGlzLmNsb3Nlc3QoYWNjb3JkaW9uLkFDQ09SRElPTik7XG5cbiAgICAgICAgaWYgKGFjYykge1xuICAgICAgICAgIGFjY29yZGlvbi5nZXRCdXR0b25zKGFjYykuZm9yRWFjaChidG4gPT4gYWNjb3JkaW9uLmhpZGUoYnRuKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgbW9iaWxlIG5hdmlnYXRpb24gbWVudSBpcyBhY3RpdmUsIHdlIHdhbnQgdG8gaGlkZSBpdC5cbiAgICAgICAgaWYgKGlzQWN0aXZlKCkpIHtcbiAgICAgICAgICBuYXZpZ2F0aW9uLnRvZ2dsZU5hdi5jYWxsKG5hdmlnYXRpb24sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGluaXQocm9vdCkge1xuICAgICAgY29uc3QgdHJhcENvbnRhaW5lciA9IHJvb3QucXVlcnlTZWxlY3RvcihOQVYpO1xuXG4gICAgICBpZiAodHJhcENvbnRhaW5lcikge1xuICAgICAgICBuYXZpZ2F0aW9uLmZvY3VzVHJhcCA9IEZvY3VzVHJhcCh0cmFwQ29udGFpbmVyLCB7XG4gICAgICAgICAgRXNjYXBlOiBvbk1lbnVDbG9zZVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmVzaXplKCk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCByZXNpemUsIGZhbHNlKTtcbiAgICB9LFxuICAgIHRlYXJkb3duKCkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgcmVzaXplLCBmYWxzZSk7XG4gICAgICBuYXZBY3RpdmUgPSBmYWxzZTtcbiAgICB9LFxuICAgIGZvY3VzVHJhcDogbnVsbCxcbiAgICB0b2dnbGVOYXZcbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuYXZpZ2F0aW9uO1xuIiwiY29uc3QgYmVoYXZpb3IgPSByZXF1aXJlKFwiLi4vdXRpbHMvYmVoYXZpb3JcIik7XG5jb25zdCB0b2dnbGVGb3JtSW5wdXQgPSByZXF1aXJlKFwiLi4vdXRpbHMvdG9nZ2xlLWZvcm0taW5wdXRcIik7XG5cbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBMSU5LID0gYC4ke1BSRUZJWH0tc2hvdy1wYXNzd29yZCwgLiR7UFJFRklYfS1zaG93LW11bHRpcGFzc3dvcmRgO1xuXG5mdW5jdGlvbiB0b2dnbGUoZXZlbnQpIHtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgdG9nZ2xlRm9ybUlucHV0KHRoaXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKHtcbiAgW0NMSUNLXToge1xuICAgIFtMSU5LXTogdG9nZ2xlXG4gIH1cbn0pO1xuIiwiY29uc3QgaWdub3JlID0gcmVxdWlyZShcInJlY2VwdG9yL2lnbm9yZVwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4uL3V0aWxzL2JlaGF2aW9yXCIpO1xuY29uc3Qgc2VsZWN0ID0gcmVxdWlyZShcIi4uL3V0aWxzL3NlbGVjdFwiKTtcblxuY29uc3QgeyBDTElDSyB9ID0gcmVxdWlyZShcIi4uL2V2ZW50c1wiKTtcblxuY29uc3QgQlVUVE9OID0gXCIuanMtc2VhcmNoLWJ1dHRvblwiO1xuY29uc3QgRk9STSA9IFwiLmpzLXNlYXJjaC1mb3JtXCI7XG5jb25zdCBJTlBVVCA9IFwiW3R5cGU9c2VhcmNoXVwiO1xuY29uc3QgQ09OVEVYVCA9IFwiaGVhZGVyXCI7IC8vIFhYWFxuXG5sZXQgbGFzdEJ1dHRvbjtcblxuY29uc3QgZ2V0Rm9ybSA9IGJ1dHRvbiA9PiB7XG4gIGNvbnN0IGNvbnRleHQgPSBidXR0b24uY2xvc2VzdChDT05URVhUKTtcbiAgcmV0dXJuIGNvbnRleHQgPyBjb250ZXh0LnF1ZXJ5U2VsZWN0b3IoRk9STSkgOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKEZPUk0pO1xufTtcblxuY29uc3QgdG9nZ2xlU2VhcmNoID0gKGJ1dHRvbiwgYWN0aXZlKSA9PiB7XG4gIGNvbnN0IGZvcm0gPSBnZXRGb3JtKGJ1dHRvbik7XG5cbiAgaWYgKCFmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBObyAke0ZPUk19IGZvdW5kIGZvciBzZWFyY2ggdG9nZ2xlIGluICR7Q09OVEVYVH0hYCk7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuICBidXR0b24uaGlkZGVuID0gYWN0aXZlO1xuICBmb3JtLmhpZGRlbiA9ICFhY3RpdmU7XG4gIC8qIGVzbGludC1lbmFibGUgKi9cblxuICBpZiAoIWFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGlucHV0ID0gZm9ybS5xdWVyeVNlbGVjdG9yKElOUFVUKTtcblxuICBpZiAoaW5wdXQpIHtcbiAgICBpbnB1dC5mb2N1cygpO1xuICB9XG4gIC8vIHdoZW4gdGhlIHVzZXIgY2xpY2tzIF9vdXRzaWRlXyBvZiB0aGUgZm9ybSB3L2lnbm9yZSgpOiBoaWRlIHRoZVxuICAvLyBzZWFyY2gsIHRoZW4gcmVtb3ZlIHRoZSBsaXN0ZW5lclxuICBjb25zdCBsaXN0ZW5lciA9IGlnbm9yZShmb3JtLCAoKSA9PiB7XG4gICAgaWYgKGxhc3RCdXR0b24pIHtcbiAgICAgIGhpZGVTZWFyY2guY2FsbChsYXN0QnV0dG9uKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICAgIH1cblxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihDTElDSywgbGlzdGVuZXIpO1xuICB9KTtcblxuICAvLyBOb3JtYWxseSB3ZSB3b3VsZCBqdXN0IHJ1biB0aGlzIGNvZGUgd2l0aG91dCBhIHRpbWVvdXQsIGJ1dFxuICAvLyBJRTExIGFuZCBFZGdlIHdpbGwgYWN0dWFsbHkgY2FsbCB0aGUgbGlzdGVuZXIgKmltbWVkaWF0ZWx5KiBiZWNhdXNlXG4gIC8vIHRoZXkgYXJlIGN1cnJlbnRseSBoYW5kbGluZyB0aGlzIGV4YWN0IHR5cGUgb2YgZXZlbnQsIHNvIHdlJ2xsXG4gIC8vIG1ha2Ugc3VyZSB0aGUgYnJvd3NlciBpcyBkb25lIGhhbmRsaW5nIHRoZSBjdXJyZW50IGNsaWNrIGV2ZW50LFxuICAvLyBpZiBhbnksIGJlZm9yZSB3ZSBhdHRhY2ggdGhlIGxpc3RlbmVyLlxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoQ0xJQ0ssIGxpc3RlbmVyKTtcbiAgfSwgMCk7XG59O1xuXG5mdW5jdGlvbiBzaG93U2VhcmNoKCkge1xuICB0b2dnbGVTZWFyY2godGhpcywgdHJ1ZSk7XG4gIGxhc3RCdXR0b24gPSB0aGlzO1xufVxuXG5mdW5jdGlvbiBoaWRlU2VhcmNoKCkge1xuICB0b2dnbGVTZWFyY2godGhpcywgZmFsc2UpO1xuICBsYXN0QnV0dG9uID0gdW5kZWZpbmVkO1xufVxuXG5jb25zdCBzZWFyY2ggPSBiZWhhdmlvcihcbiAge1xuICAgIFtDTElDS106IHtcbiAgICAgIFtCVVRUT05dOiBzaG93U2VhcmNoXG4gICAgfVxuICB9LFxuICB7XG4gICAgaW5pdCh0YXJnZXQpIHtcbiAgICAgIHNlbGVjdChCVVRUT04sIHRhcmdldCkuZm9yRWFjaChidXR0b24gPT4ge1xuICAgICAgICB0b2dnbGVTZWFyY2goYnV0dG9uLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIHRlYXJkb3duKCkge1xuICAgICAgLy8gZm9yZ2V0IHRoZSBsYXN0IGJ1dHRvbiBjbGlja2VkXG4gICAgICBsYXN0QnV0dG9uID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZWFyY2g7XG4iLCJjb25zdCBvbmNlID0gcmVxdWlyZShcInJlY2VwdG9yL29uY2VcIik7XG5jb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHsgQ0xJQ0sgfSA9IHJlcXVpcmUoXCIuLi9ldmVudHNcIik7XG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBMSU5LID0gYC4ke1BSRUZJWH0tc2tpcG5hdltocmVmXj1cIiNcIl0sIC4ke1BSRUZJWH0tZm9vdGVyX19yZXR1cm4tdG8tdG9wIFtocmVmXj1cIiNcIl1gO1xuY29uc3QgTUFJTkNPTlRFTlQgPSBcIm1haW4tY29udGVudFwiO1xuXG5mdW5jdGlvbiBzZXRUYWJpbmRleCgpIHtcbiAgLy8gTkI6IHdlIGtub3cgYmVjYXVzZSBvZiB0aGUgc2VsZWN0b3Igd2UncmUgZGVsZWdhdGluZyB0byBiZWxvdyB0aGF0IHRoZVxuICAvLyBocmVmIGFscmVhZHkgYmVnaW5zIHdpdGggJyMnXG4gIGNvbnN0IGlkID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgICBpZCA9PT0gXCIjXCIgPyBNQUlOQ09OVEVOVCA6IGlkLnNsaWNlKDEpXG4gICk7XG5cbiAgaWYgKHRhcmdldCkge1xuICAgIHRhcmdldC5zdHlsZS5vdXRsaW5lID0gXCIwXCI7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIDApO1xuICAgIHRhcmdldC5mb2N1cygpO1xuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgXCJibHVyXCIsXG4gICAgICBvbmNlKCgpID0+IHtcbiAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIC0xKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyB0aHJvdyBhbiBlcnJvcj9cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJlaGF2aW9yKHtcbiAgW0NMSUNLXToge1xuICAgIFtMSU5LXTogc2V0VGFiaW5kZXhcbiAgfVxufSk7XG4iLCJjb25zdCBiZWhhdmlvciA9IHJlcXVpcmUoXCIuLi91dGlscy9iZWhhdmlvclwiKTtcbmNvbnN0IHZhbGlkYXRlID0gcmVxdWlyZShcIi4uL3V0aWxzL3ZhbGlkYXRlLWlucHV0XCIpO1xuXG5mdW5jdGlvbiBjaGFuZ2UoKSB7XG4gIHZhbGlkYXRlKHRoaXMpO1xufVxuXG5jb25zdCB2YWxpZGF0b3IgPSBiZWhhdmlvcih7XG4gIFwia2V5dXAgY2hhbmdlXCI6IHtcbiAgICBcImlucHV0W2RhdGEtdmFsaWRhdGlvbi1lbGVtZW50XVwiOiBjaGFuZ2VcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gdmFsaWRhdG9yO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByZWZpeDogXCJ1c2FcIlxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAvLyBUaGlzIHVzZWQgdG8gYmUgY29uZGl0aW9uYWxseSBkZXBlbmRlbnQgb24gd2hldGhlciB0aGVcbiAgLy8gYnJvd3NlciBzdXBwb3J0ZWQgdG91Y2ggZXZlbnRzOyBpZiBpdCBkaWQsIGBDTElDS2Agd2FzIHNldCB0b1xuICAvLyBgdG91Y2hzdGFydGAuICBIb3dldmVyLCB0aGlzIGhhZCBkb3duc2lkZXM6XG4gIC8vXG4gIC8vICogSXQgcHJlLWVtcHRlZCBtb2JpbGUgYnJvd3NlcnMnIGRlZmF1bHQgYmVoYXZpb3Igb2YgZGV0ZWN0aW5nXG4gIC8vICAgd2hldGhlciBhIHRvdWNoIHR1cm5lZCBpbnRvIGEgc2Nyb2xsLCB0aGVyZWJ5IHByZXZlbnRpbmdcbiAgLy8gICB1c2VycyBmcm9tIHVzaW5nIHNvbWUgb2Ygb3VyIGNvbXBvbmVudHMgYXMgc2Nyb2xsIHN1cmZhY2VzLlxuICAvL1xuICAvLyAqIFNvbWUgZGV2aWNlcywgc3VjaCBhcyB0aGUgTWljcm9zb2Z0IFN1cmZhY2UgUHJvLCBzdXBwb3J0ICpib3RoKlxuICAvLyAgIHRvdWNoIGFuZCBjbGlja3MuIFRoaXMgbWVhbnQgdGhlIGNvbmRpdGlvbmFsIGVmZmVjdGl2ZWx5IGRyb3BwZWRcbiAgLy8gICBzdXBwb3J0IGZvciB0aGUgdXNlcidzIG1vdXNlLCBmcnVzdHJhdGluZyB1c2VycyB3aG8gcHJlZmVycmVkXG4gIC8vICAgaXQgb24gdGhvc2Ugc3lzdGVtcy5cbiAgQ0xJQ0s6IFwiY2xpY2tcIlxufTtcbiIsImNvbnN0IGVscHJvdG8gPSB3aW5kb3cuSFRNTEVsZW1lbnQucHJvdG90eXBlO1xuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcblxuaWYgKCEoSElEREVOIGluIGVscHJvdG8pKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbHByb3RvLCBISURERU4sIHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoSElEREVOKTtcbiAgICB9LFxuICAgIHNldCh2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKEhJRERFTiwgXCJcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShISURERU4pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG4iLCIvLyBwb2x5ZmlsbHMgSFRNTEVsZW1lbnQucHJvdG90eXBlLmNsYXNzTGlzdCBhbmQgRE9NVG9rZW5MaXN0XG5yZXF1aXJlKFwiY2xhc3NsaXN0LXBvbHlmaWxsXCIpO1xuLy8gcG9seWZpbGxzIEhUTUxFbGVtZW50LnByb3RvdHlwZS5oaWRkZW5cbnJlcXVpcmUoXCIuL2VsZW1lbnQtaGlkZGVuXCIpO1xuIiwiY29uc3QgZG9tcmVhZHkgPSByZXF1aXJlKFwiZG9tcmVhZHlcIik7XG5cbi8qKlxuICogVGhlICdwb2x5ZmlsbHMnIGRlZmluZSBrZXkgRUNNQVNjcmlwdCA1IG1ldGhvZHMgdGhhdCBtYXkgYmUgbWlzc2luZyBmcm9tXG4gKiBvbGRlciBicm93c2Vycywgc28gbXVzdCBiZSBsb2FkZWQgZmlyc3QuXG4gKi9cbnJlcXVpcmUoXCIuL3BvbHlmaWxsc1wiKTtcblxuY29uc3QgdXN3ZHMgPSByZXF1aXJlKFwiLi9jb25maWdcIik7XG5cbmNvbnN0IGNvbXBvbmVudHMgPSByZXF1aXJlKFwiLi9jb21wb25lbnRzXCIpO1xuXG51c3dkcy5jb21wb25lbnRzID0gY29tcG9uZW50cztcblxuZG9tcmVhZHkoKCkgPT4ge1xuICBjb25zdCB0YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuICBPYmplY3Qua2V5cyhjb21wb25lbnRzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgY29uc3QgYmVoYXZpb3IgPSBjb21wb25lbnRzW2tleV07XG4gICAgYmVoYXZpb3Iub24odGFyZ2V0KTtcbiAgfSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB1c3dkcztcbiIsIm1vZHVsZS5leHBvcnRzID0gKGh0bWxEb2N1bWVudCA9IGRvY3VtZW50KSA9PiBodG1sRG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiIsImNvbnN0IGFzc2lnbiA9IHJlcXVpcmUoXCJvYmplY3QtYXNzaWduXCIpO1xuY29uc3QgQmVoYXZpb3IgPSByZXF1aXJlKFwicmVjZXB0b3IvYmVoYXZpb3JcIik7XG5cbi8qKlxuICogQG5hbWUgc2VxdWVuY2VcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IHNlcSBhbiBhcnJheSBvZiBmdW5jdGlvbnNcbiAqIEByZXR1cm4geyBjbG9zdXJlIH0gY2FsbEhvb2tzXG4gKi9cbi8vIFdlIHVzZSBhIG5hbWVkIGZ1bmN0aW9uIGhlcmUgYmVjYXVzZSB3ZSB3YW50IGl0IHRvIGluaGVyaXQgaXRzIGxleGljYWwgc2NvcGVcbi8vIGZyb20gdGhlIGJlaGF2aW9yIHByb3BzIG9iamVjdCwgbm90IGZyb20gdGhlIG1vZHVsZVxuY29uc3Qgc2VxdWVuY2UgPSAoLi4uc2VxKSA9PlxuICBmdW5jdGlvbiBjYWxsSG9va3ModGFyZ2V0ID0gZG9jdW1lbnQuYm9keSkge1xuICAgIHNlcS5mb3JFYWNoKG1ldGhvZCA9PiB7XG4gICAgICBpZiAodHlwZW9mIHRoaXNbbWV0aG9kXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRoaXNbbWV0aG9kXS5jYWxsKHRoaXMsIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbi8qKlxuICogQG5hbWUgYmVoYXZpb3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBldmVudHNcbiAqIEBwYXJhbSB7b2JqZWN0P30gcHJvcHNcbiAqIEByZXR1cm4ge3JlY2VwdG9yLmJlaGF2aW9yfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IChldmVudHMsIHByb3BzKSA9PlxuICBCZWhhdmlvcihcbiAgICBldmVudHMsXG4gICAgYXNzaWduKFxuICAgICAge1xuICAgICAgICBvbjogc2VxdWVuY2UoXCJpbml0XCIsIFwiYWRkXCIpLFxuICAgICAgICBvZmY6IHNlcXVlbmNlKFwidGVhcmRvd25cIiwgXCJyZW1vdmVcIilcbiAgICAgIH0sXG4gICAgICBwcm9wc1xuICAgIClcbiAgKTtcbiIsImNvbnN0IGFzc2lnbiA9IHJlcXVpcmUoXCJvYmplY3QtYXNzaWduXCIpO1xuY29uc3QgeyBrZXltYXAgfSA9IHJlcXVpcmUoXCJyZWNlcHRvclwiKTtcbmNvbnN0IGJlaGF2aW9yID0gcmVxdWlyZShcIi4vYmVoYXZpb3JcIik7XG5jb25zdCBzZWxlY3QgPSByZXF1aXJlKFwiLi9zZWxlY3RcIik7XG5jb25zdCBhY3RpdmVFbGVtZW50ID0gcmVxdWlyZShcIi4vYWN0aXZlLWVsZW1lbnRcIik7XG5cbmNvbnN0IEZPQ1VTQUJMRSA9XG4gICdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCBbdGFiaW5kZXg9XCIwXCJdLCBbY29udGVudGVkaXRhYmxlXSc7XG5cbmNvbnN0IHRhYkhhbmRsZXIgPSBjb250ZXh0ID0+IHtcbiAgY29uc3QgZm9jdXNhYmxlRWxlbWVudHMgPSBzZWxlY3QoRk9DVVNBQkxFLCBjb250ZXh0KTtcbiAgY29uc3QgZmlyc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbMF07XG4gIGNvbnN0IGxhc3RUYWJTdG9wID0gZm9jdXNhYmxlRWxlbWVudHNbZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoIC0gMV07XG5cbiAgLy8gU3BlY2lhbCBydWxlcyBmb3Igd2hlbiB0aGUgdXNlciBpcyB0YWJiaW5nIGZvcndhcmQgZnJvbSB0aGUgbGFzdCBmb2N1c2FibGUgZWxlbWVudCxcbiAgLy8gb3Igd2hlbiB0YWJiaW5nIGJhY2t3YXJkcyBmcm9tIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudFxuICBmdW5jdGlvbiB0YWJBaGVhZChldmVudCkge1xuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGxhc3RUYWJTdG9wKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdGFiQmFjayhldmVudCkge1xuICAgIGlmIChhY3RpdmVFbGVtZW50KCkgPT09IGZpcnN0VGFiU3RvcCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGxhc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBmaXJzdFRhYlN0b3AsXG4gICAgbGFzdFRhYlN0b3AsXG4gICAgdGFiQWhlYWQsXG4gICAgdGFiQmFja1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSAoY29udGV4dCwgYWRkaXRpb25hbEtleUJpbmRpbmdzID0ge30pID0+IHtcbiAgY29uc3QgdGFiRXZlbnRIYW5kbGVyID0gdGFiSGFuZGxlcihjb250ZXh0KTtcblxuICAvLyAgVE9ETzogSW4gdGhlIGZ1dHVyZSwgbG9vcCBvdmVyIGFkZGl0aW9uYWwga2V5YmluZGluZ3MgYW5kIHBhc3MgYW4gYXJyYXlcbiAgLy8gb2YgZnVuY3Rpb25zLCBpZiBuZWNlc3NhcnksIHRvIHRoZSBtYXAga2V5cy4gVGhlbiBwZW9wbGUgaW1wbGVtZW50aW5nXG4gIC8vIHRoZSBmb2N1cyB0cmFwIGNvdWxkIHBhc3MgY2FsbGJhY2tzIHRvIGZpcmUgd2hlbiB0YWJiaW5nXG4gIGNvbnN0IGtleU1hcHBpbmdzID0ga2V5bWFwKFxuICAgIGFzc2lnbihcbiAgICAgIHtcbiAgICAgICAgVGFiOiB0YWJFdmVudEhhbmRsZXIudGFiQWhlYWQsXG4gICAgICAgIFwiU2hpZnQrVGFiXCI6IHRhYkV2ZW50SGFuZGxlci50YWJCYWNrXG4gICAgICB9LFxuICAgICAgYWRkaXRpb25hbEtleUJpbmRpbmdzXG4gICAgKVxuICApO1xuXG4gIGNvbnN0IGZvY3VzVHJhcCA9IGJlaGF2aW9yKFxuICAgIHtcbiAgICAgIGtleWRvd246IGtleU1hcHBpbmdzXG4gICAgfSxcbiAgICB7XG4gICAgICBpbml0KCkge1xuICAgICAgICAvLyBUT0RPOiBpcyB0aGlzIGRlc2lyZWFibGUgYmVoYXZpb3I/IFNob3VsZCB0aGUgdHJhcCBhbHdheXMgZG8gdGhpcyBieSBkZWZhdWx0IG9yIHNob3VsZFxuICAgICAgICAvLyB0aGUgY29tcG9uZW50IGdldHRpbmcgZGVjb3JhdGVkIGhhbmRsZSB0aGlzP1xuICAgICAgICB0YWJFdmVudEhhbmRsZXIuZmlyc3RUYWJTdG9wLmZvY3VzKCk7XG4gICAgICB9LFxuICAgICAgdXBkYXRlKGlzQWN0aXZlKSB7XG4gICAgICAgIGlmIChpc0FjdGl2ZSkge1xuICAgICAgICAgIHRoaXMub24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm9mZigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICApO1xuXG4gIHJldHVybiBmb2N1c1RyYXA7XG59O1xuIiwiLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzc1NTc0MzNcbmZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQoXG4gIGVsLFxuICB3aW4gPSB3aW5kb3csXG4gIGRvY0VsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50XG4pIHtcbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIHJldHVybiAoXG4gICAgcmVjdC50b3AgPj0gMCAmJlxuICAgIHJlY3QubGVmdCA+PSAwICYmXG4gICAgcmVjdC5ib3R0b20gPD0gKHdpbi5pbm5lckhlaWdodCB8fCBkb2NFbC5jbGllbnRIZWlnaHQpICYmXG4gICAgcmVjdC5yaWdodCA8PSAod2luLmlubmVyV2lkdGggfHwgZG9jRWwuY2xpZW50V2lkdGgpXG4gICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNFbGVtZW50SW5WaWV3cG9ydDtcbiIsIi8qKlxuICogQG5hbWUgaXNFbGVtZW50XG4gKiBAZGVzYyByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIERPTSBlbGVtZW50LlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBpc0VsZW1lbnQgPSB2YWx1ZSA9PlxuICB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUubm9kZVR5cGUgPT09IDE7XG5cbi8qKlxuICogQG5hbWUgc2VsZWN0XG4gKiBAZGVzYyBzZWxlY3RzIGVsZW1lbnRzIGZyb20gdGhlIERPTSBieSBjbGFzcyBzZWxlY3RvciBvciBJRCBzZWxlY3Rvci5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciAtIFRoZSBzZWxlY3RvciB0byB0cmF2ZXJzZSB0aGUgRE9NIHdpdGguXG4gKiBAcGFyYW0ge0RvY3VtZW50fEhUTUxFbGVtZW50P30gY29udGV4dCAtIFRoZSBjb250ZXh0IHRvIHRyYXZlcnNlIHRoZSBET01cbiAqICAgaW4uIElmIG5vdCBwcm92aWRlZCwgaXQgZGVmYXVsdHMgdG8gdGhlIGRvY3VtZW50LlxuICogQHJldHVybiB7SFRNTEVsZW1lbnRbXX0gLSBBbiBhcnJheSBvZiBET00gbm9kZXMgb3IgYW4gZW1wdHkgYXJyYXkuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKHNlbGVjdG9yLCBjb250ZXh0KSA9PiB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBpZiAoIWNvbnRleHQgfHwgIWlzRWxlbWVudChjb250ZXh0KSkge1xuICAgIGNvbnRleHQgPSB3aW5kb3cuZG9jdW1lbnQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgfVxuXG4gIGNvbnN0IHNlbGVjdGlvbiA9IGNvbnRleHQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChzZWxlY3Rpb24pO1xufTtcbiIsIi8qKlxuICogRmxpcHMgZ2l2ZW4gSU5QVVQgZWxlbWVudHMgYmV0d2VlbiBtYXNrZWQgKGhpZGluZyB0aGUgZmllbGQgdmFsdWUpIGFuZCB1bm1hc2tlZFxuICogQHBhcmFtIHtBcnJheS5IVE1MRWxlbWVudH0gZmllbGRzIC0gQW4gYXJyYXkgb2YgSU5QVVQgZWxlbWVudHNcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gbWFzayAtIFdoZXRoZXIgdGhlIG1hc2sgc2hvdWxkIGJlIGFwcGxpZWQsIGhpZGluZyB0aGUgZmllbGQgdmFsdWVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSAoZmllbGQsIG1hc2spID0+IHtcbiAgZmllbGQuc2V0QXR0cmlidXRlKFwiYXV0b2NhcGl0YWxpemVcIiwgXCJvZmZcIik7XG4gIGZpZWxkLnNldEF0dHJpYnV0ZShcImF1dG9jb3JyZWN0XCIsIFwib2ZmXCIpO1xuICBmaWVsZC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIG1hc2sgPyBcInBhc3N3b3JkXCIgOiBcInRleHRcIik7XG59O1xuIiwiY29uc3QgcmVzb2x2ZUlkUmVmcyA9IHJlcXVpcmUoXCJyZXNvbHZlLWlkLXJlZnNcIik7XG5jb25zdCB0b2dnbGVGaWVsZE1hc2sgPSByZXF1aXJlKFwiLi90b2dnbGUtZmllbGQtbWFza1wiKTtcblxuY29uc3QgQ09OVFJPTFMgPSBcImFyaWEtY29udHJvbHNcIjtcbmNvbnN0IFBSRVNTRUQgPSBcImFyaWEtcHJlc3NlZFwiO1xuY29uc3QgU0hPV19BVFRSID0gXCJkYXRhLXNob3ctdGV4dFwiO1xuY29uc3QgSElERV9BVFRSID0gXCJkYXRhLWhpZGUtdGV4dFwiO1xuXG4vKipcbiAqIFJlcGxhY2UgdGhlIHdvcmQgXCJTaG93XCIgKG9yIFwic2hvd1wiKSB3aXRoIFwiSGlkZVwiIChvciBcImhpZGVcIikgaW4gYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc2hvd1RleHRcbiAqIEByZXR1cm4ge3N0cm9uZ30gaGlkZVRleHRcbiAqL1xuY29uc3QgZ2V0SGlkZVRleHQgPSBzaG93VGV4dCA9PlxuICBzaG93VGV4dC5yZXBsYWNlKC9cXGJTaG93XFxiL2ksIHNob3cgPT4gYCR7c2hvd1swXSA9PT0gXCJTXCIgPyBcIkhcIiA6IFwiaFwifWlkZWApO1xuXG4vKipcbiAqIENvbXBvbmVudCB0aGF0IGRlY29yYXRlcyBhbiBIVE1MIGVsZW1lbnQgd2l0aCB0aGUgYWJpbGl0eSB0byB0b2dnbGUgdGhlXG4gKiBtYXNrZWQgc3RhdGUgb2YgYW4gaW5wdXQgZmllbGQgKGxpa2UgYSBwYXNzd29yZCkgd2hlbiBjbGlja2VkLlxuICogVGhlIGlkcyBvZiB0aGUgZmllbGRzIHRvIGJlIG1hc2tlZCB3aWxsIGJlIHB1bGxlZCBkaXJlY3RseSBmcm9tIHRoZSBidXR0b24nc1xuICogYGFyaWEtY29udHJvbHNgIGF0dHJpYnV0ZS5cbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgUGFyZW50IGVsZW1lbnQgY29udGFpbmluZyB0aGUgZmllbGRzIHRvIGJlIG1hc2tlZFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBlbCA9PiB7XG4gIC8vIHRoaXMgaXMgdGhlICp0YXJnZXQqIHN0YXRlOlxuICAvLyAqIGlmIHRoZSBlbGVtZW50IGhhcyB0aGUgYXR0ciBhbmQgaXQncyAhPT0gXCJ0cnVlXCIsIHByZXNzZWQgaXMgdHJ1ZVxuICAvLyAqIG90aGVyd2lzZSwgcHJlc3NlZCBpcyBmYWxzZVxuICBjb25zdCBwcmVzc2VkID1cbiAgICBlbC5oYXNBdHRyaWJ1dGUoUFJFU1NFRCkgJiYgZWwuZ2V0QXR0cmlidXRlKFBSRVNTRUQpICE9PSBcInRydWVcIjtcblxuICBjb25zdCBmaWVsZHMgPSByZXNvbHZlSWRSZWZzKGVsLmdldEF0dHJpYnV0ZShDT05UUk9MUykpO1xuICBmaWVsZHMuZm9yRWFjaChmaWVsZCA9PiB0b2dnbGVGaWVsZE1hc2soZmllbGQsIHByZXNzZWQpKTtcblxuICBpZiAoIWVsLmhhc0F0dHJpYnV0ZShTSE9XX0FUVFIpKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKFNIT1dfQVRUUiwgZWwudGV4dENvbnRlbnQpO1xuICB9XG5cbiAgY29uc3Qgc2hvd1RleHQgPSBlbC5nZXRBdHRyaWJ1dGUoU0hPV19BVFRSKTtcbiAgY29uc3QgaGlkZVRleHQgPSBlbC5nZXRBdHRyaWJ1dGUoSElERV9BVFRSKSB8fCBnZXRIaWRlVGV4dChzaG93VGV4dCk7XG5cbiAgZWwudGV4dENvbnRlbnQgPSBwcmVzc2VkID8gc2hvd1RleHQgOiBoaWRlVGV4dDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICBlbC5zZXRBdHRyaWJ1dGUoUFJFU1NFRCwgcHJlc3NlZCk7XG4gIHJldHVybiBwcmVzc2VkO1xufTtcbiIsImNvbnN0IEVYUEFOREVEID0gXCJhcmlhLWV4cGFuZGVkXCI7XG5jb25zdCBDT05UUk9MUyA9IFwiYXJpYS1jb250cm9sc1wiO1xuY29uc3QgSElEREVOID0gXCJoaWRkZW5cIjtcblxubW9kdWxlLmV4cG9ydHMgPSAoYnV0dG9uLCBleHBhbmRlZCkgPT4ge1xuICBsZXQgc2FmZUV4cGFuZGVkID0gZXhwYW5kZWQ7XG5cbiAgaWYgKHR5cGVvZiBzYWZlRXhwYW5kZWQgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgc2FmZUV4cGFuZGVkID0gYnV0dG9uLmdldEF0dHJpYnV0ZShFWFBBTkRFRCkgPT09IFwiZmFsc2VcIjtcbiAgfVxuXG4gIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoRVhQQU5ERUQsIHNhZmVFeHBhbmRlZCk7XG5cbiAgY29uc3QgaWQgPSBidXR0b24uZ2V0QXR0cmlidXRlKENPTlRST0xTKTtcbiAgY29uc3QgY29udHJvbHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gIGlmICghY29udHJvbHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHRvZ2dsZSB0YXJnZXQgZm91bmQgd2l0aCBpZDogXCIke2lkfVwiYCk7XG4gIH1cblxuICBpZiAoc2FmZUV4cGFuZGVkKSB7XG4gICAgY29udHJvbHMucmVtb3ZlQXR0cmlidXRlKEhJRERFTik7XG4gIH0gZWxzZSB7XG4gICAgY29udHJvbHMuc2V0QXR0cmlidXRlKEhJRERFTiwgXCJcIik7XG4gIH1cblxuICByZXR1cm4gc2FmZUV4cGFuZGVkO1xufTtcbiIsImNvbnN0IGRhdGFzZXQgPSByZXF1aXJlKFwiZWxlbS1kYXRhc2V0XCIpO1xuXG5jb25zdCB7IHByZWZpeDogUFJFRklYIH0gPSByZXF1aXJlKFwiLi4vY29uZmlnXCIpO1xuXG5jb25zdCBDSEVDS0VEID0gXCJhcmlhLWNoZWNrZWRcIjtcbmNvbnN0IENIRUNLRURfQ0xBU1MgPSBgJHtQUkVGSVh9LWNoZWNrbGlzdF9faXRlbS0tY2hlY2tlZGA7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdmFsaWRhdGUoZWwpIHtcbiAgY29uc3QgZGF0YSA9IGRhdGFzZXQoZWwpO1xuICBjb25zdCBpZCA9IGRhdGEudmFsaWRhdGlvbkVsZW1lbnQ7XG4gIGNvbnN0IGNoZWNrTGlzdCA9XG4gICAgaWQuY2hhckF0KDApID09PSBcIiNcIlxuICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGlkKVxuICAgICAgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cbiAgaWYgKCFjaGVja0xpc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHZhbGlkYXRpb24gZWxlbWVudCBmb3VuZCB3aXRoIGlkOiBcIiR7aWR9XCJgKTtcbiAgfVxuXG4gIE9iamVjdC5lbnRyaWVzKGRhdGEpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgIGlmIChrZXkuc3RhcnRzV2l0aChcInZhbGlkYXRlXCIpKSB7XG4gICAgICBjb25zdCB2YWxpZGF0b3JOYW1lID0ga2V5LnN1YnN0cihcInZhbGlkYXRlXCIubGVuZ3RoKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgdmFsaWRhdG9yUGF0dGVybiA9IG5ldyBSZWdFeHAodmFsdWUpO1xuICAgICAgY29uc3QgdmFsaWRhdG9yU2VsZWN0b3IgPSBgW2RhdGEtdmFsaWRhdG9yPVwiJHt2YWxpZGF0b3JOYW1lfVwiXWA7XG4gICAgICBjb25zdCB2YWxpZGF0b3JDaGVja2JveCA9IGNoZWNrTGlzdC5xdWVyeVNlbGVjdG9yKHZhbGlkYXRvclNlbGVjdG9yKTtcblxuICAgICAgaWYgKCF2YWxpZGF0b3JDaGVja2JveCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHZhbGlkYXRvciBjaGVja2JveCBmb3VuZCBmb3I6IFwiJHt2YWxpZGF0b3JOYW1lfVwiYCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNoZWNrZWQgPSB2YWxpZGF0b3JQYXR0ZXJuLnRlc3QoZWwudmFsdWUpO1xuICAgICAgdmFsaWRhdG9yQ2hlY2tib3guY2xhc3NMaXN0LnRvZ2dsZShDSEVDS0VEX0NMQVNTLCBjaGVja2VkKTtcbiAgICAgIHZhbGlkYXRvckNoZWNrYm94LnNldEF0dHJpYnV0ZShDSEVDS0VELCBjaGVja2VkKTtcbiAgICB9XG4gIH0pO1xufTtcbiJdfQ==
