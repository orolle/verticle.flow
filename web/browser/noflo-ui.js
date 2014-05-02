
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-underscore/index.js", function(exports, require, module){
//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = Math.floor(Math.random() * ++index);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = lookupIterator(obj, val);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(obj, val) {
    return _.isFunction(val) ? val : function(obj) { return obj[val]; };
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, val, behavior) {
    var result = {};
    var iterator = lookupIterator(obj, val);
    each(obj, function(value, index) {
      var key = iterator(value, index);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    return group(obj, val, function(result, key, value) {
      (result[key] || (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, val) {
    return group(obj, val, function(result, key, value) {
      result[key] || (result[key] = 0);
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var value = iterator(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    _.reduce(initial, function(memo, value, index) {
      if (isSorted ? (_.last(memo) !== value || !memo.length) : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, []);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Zip together two arrays -- an array of keys and an array of values -- into
  // a single object.
  _.zipObject = function(keys, values) {
    var result = {};
    for (var i = 0, l = keys.length; i < l; i++) {
      result[keys[i]] = values[i];
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        throttling = true;
        result = func.apply(context, args);
      }
      whenDone();
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(flatten(slice.call(arguments, 1), true, []), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // List of HTML entities for escaping.
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  // Regex containing the keys listed immediately above.
  var htmlEscaper = /[&<>"'\/]/g;

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return ('' + string).replace(htmlEscaper, function(match) {
      return htmlEscapes[match];
    });
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\':   '\\',
    "'":    "'",
    r:      '\r',
    n:      '\n',
    t:      '\t',
    u2028:  '\u2028',
    u2029:  '\u2029'
  };

  for (var key in escapes) escapes[escapes[key]] = key;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n((__t=(" + unescape(code) + "))==null?'':_.escape(__t))+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n((__t=(" + unescape(code) + "))==null?'':__t)+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result(obj, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

});
require.register("noflo-fbp/lib/fbp.js", function(exports, require, module){
module.exports = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "start": parse_start,
        "line": parse_line,
        "LineTerminator": parse_LineTerminator,
        "comment": parse_comment,
        "connection": parse_connection,
        "bridge": parse_bridge,
        "leftlet": parse_leftlet,
        "iip": parse_iip,
        "rightlet": parse_rightlet,
        "node": parse_node,
        "component": parse_component,
        "compMeta": parse_compMeta,
        "port": parse_port,
        "anychar": parse_anychar,
        "iipchar": parse_iipchar,
        "_": parse__,
        "__": parse___
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "start";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_start() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result0 = [];
        result1 = parse_line();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_line();
        }
        if (result0 !== null) {
          result0 = (function(offset) { return parser.getResult();  })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_line() {
        var result0, result1, result2, result3, result4, result5, result6, result7, result8;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse__();
        if (result0 !== null) {
          if (input.substr(pos, 7) === "EXPORT=") {
            result1 = "EXPORT=";
            pos += 7;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"EXPORT=\"");
            }
          }
          if (result1 !== null) {
            if (/^[A-Za-z.0-9_]/.test(input.charAt(pos))) {
              result3 = input.charAt(pos);
              pos++;
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[A-Za-z.0-9_]");
              }
            }
            if (result3 !== null) {
              result2 = [];
              while (result3 !== null) {
                result2.push(result3);
                if (/^[A-Za-z.0-9_]/.test(input.charAt(pos))) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[A-Za-z.0-9_]");
                  }
                }
              }
            } else {
              result2 = null;
            }
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 58) {
                result3 = ":";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\":\"");
                }
              }
              if (result3 !== null) {
                if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                  result5 = input.charAt(pos);
                  pos++;
                } else {
                  result5 = null;
                  if (reportFailures === 0) {
                    matchFailed("[A-Z0-9_]");
                  }
                }
                if (result5 !== null) {
                  result4 = [];
                  while (result5 !== null) {
                    result4.push(result5);
                    if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                      result5 = input.charAt(pos);
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("[A-Z0-9_]");
                      }
                    }
                  }
                } else {
                  result4 = null;
                }
                if (result4 !== null) {
                  result5 = parse__();
                  if (result5 !== null) {
                    result6 = parse_LineTerminator();
                    result6 = result6 !== null ? result6 : "";
                    if (result6 !== null) {
                      result0 = [result0, result1, result2, result3, result4, result5, result6];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, priv, pub) {return parser.registerExports(priv.join(""),pub.join(""))})(pos0, result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse__();
          if (result0 !== null) {
            if (input.substr(pos, 7) === "INPORT=") {
              result1 = "INPORT=";
              pos += 7;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\"INPORT=\"");
              }
            }
            if (result1 !== null) {
              if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[A-Za-z0-9_]");
                }
              }
              if (result3 !== null) {
                result2 = [];
                while (result3 !== null) {
                  result2.push(result3);
                  if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                    result3 = input.charAt(pos);
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("[A-Za-z0-9_]");
                    }
                  }
                }
              } else {
                result2 = null;
              }
              if (result2 !== null) {
                if (input.charCodeAt(pos) === 46) {
                  result3 = ".";
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result3 !== null) {
                  if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                    result5 = input.charAt(pos);
                    pos++;
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("[A-Z0-9_]");
                    }
                  }
                  if (result5 !== null) {
                    result4 = [];
                    while (result5 !== null) {
                      result4.push(result5);
                      if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                        result5 = input.charAt(pos);
                        pos++;
                      } else {
                        result5 = null;
                        if (reportFailures === 0) {
                          matchFailed("[A-Z0-9_]");
                        }
                      }
                    }
                  } else {
                    result4 = null;
                  }
                  if (result4 !== null) {
                    if (input.charCodeAt(pos) === 58) {
                      result5 = ":";
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("\":\"");
                      }
                    }
                    if (result5 !== null) {
                      if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                        result7 = input.charAt(pos);
                        pos++;
                      } else {
                        result7 = null;
                        if (reportFailures === 0) {
                          matchFailed("[A-Z0-9_]");
                        }
                      }
                      if (result7 !== null) {
                        result6 = [];
                        while (result7 !== null) {
                          result6.push(result7);
                          if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                            result7 = input.charAt(pos);
                            pos++;
                          } else {
                            result7 = null;
                            if (reportFailures === 0) {
                              matchFailed("[A-Z0-9_]");
                            }
                          }
                        }
                      } else {
                        result6 = null;
                      }
                      if (result6 !== null) {
                        result7 = parse__();
                        if (result7 !== null) {
                          result8 = parse_LineTerminator();
                          result8 = result8 !== null ? result8 : "";
                          if (result8 !== null) {
                            result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8];
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, node, port, pub) {return parser.registerInports(node.join(""),port.join(""),pub.join(""))})(pos0, result0[2], result0[4], result0[6]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse__();
            if (result0 !== null) {
              if (input.substr(pos, 8) === "OUTPORT=") {
                result1 = "OUTPORT=";
                pos += 8;
              } else {
                result1 = null;
                if (reportFailures === 0) {
                  matchFailed("\"OUTPORT=\"");
                }
              }
              if (result1 !== null) {
                if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                  result3 = input.charAt(pos);
                  pos++;
                } else {
                  result3 = null;
                  if (reportFailures === 0) {
                    matchFailed("[A-Za-z0-9_]");
                  }
                }
                if (result3 !== null) {
                  result2 = [];
                  while (result3 !== null) {
                    result2.push(result3);
                    if (/^[A-Za-z0-9_]/.test(input.charAt(pos))) {
                      result3 = input.charAt(pos);
                      pos++;
                    } else {
                      result3 = null;
                      if (reportFailures === 0) {
                        matchFailed("[A-Za-z0-9_]");
                      }
                    }
                  }
                } else {
                  result2 = null;
                }
                if (result2 !== null) {
                  if (input.charCodeAt(pos) === 46) {
                    result3 = ".";
                    pos++;
                  } else {
                    result3 = null;
                    if (reportFailures === 0) {
                      matchFailed("\".\"");
                    }
                  }
                  if (result3 !== null) {
                    if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                      result5 = input.charAt(pos);
                      pos++;
                    } else {
                      result5 = null;
                      if (reportFailures === 0) {
                        matchFailed("[A-Z0-9_]");
                      }
                    }
                    if (result5 !== null) {
                      result4 = [];
                      while (result5 !== null) {
                        result4.push(result5);
                        if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                          result5 = input.charAt(pos);
                          pos++;
                        } else {
                          result5 = null;
                          if (reportFailures === 0) {
                            matchFailed("[A-Z0-9_]");
                          }
                        }
                      }
                    } else {
                      result4 = null;
                    }
                    if (result4 !== null) {
                      if (input.charCodeAt(pos) === 58) {
                        result5 = ":";
                        pos++;
                      } else {
                        result5 = null;
                        if (reportFailures === 0) {
                          matchFailed("\":\"");
                        }
                      }
                      if (result5 !== null) {
                        if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                          result7 = input.charAt(pos);
                          pos++;
                        } else {
                          result7 = null;
                          if (reportFailures === 0) {
                            matchFailed("[A-Z0-9_]");
                          }
                        }
                        if (result7 !== null) {
                          result6 = [];
                          while (result7 !== null) {
                            result6.push(result7);
                            if (/^[A-Z0-9_]/.test(input.charAt(pos))) {
                              result7 = input.charAt(pos);
                              pos++;
                            } else {
                              result7 = null;
                              if (reportFailures === 0) {
                                matchFailed("[A-Z0-9_]");
                              }
                            }
                          }
                        } else {
                          result6 = null;
                        }
                        if (result6 !== null) {
                          result7 = parse__();
                          if (result7 !== null) {
                            result8 = parse_LineTerminator();
                            result8 = result8 !== null ? result8 : "";
                            if (result8 !== null) {
                              result0 = [result0, result1, result2, result3, result4, result5, result6, result7, result8];
                            } else {
                              result0 = null;
                              pos = pos1;
                            }
                          } else {
                            result0 = null;
                            pos = pos1;
                          }
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, node, port, pub) {return parser.registerOutports(node.join(""),port.join(""),pub.join(""))})(pos0, result0[2], result0[4], result0[6]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              result0 = parse_comment();
              if (result0 !== null) {
                if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
                  result1 = input.charAt(pos);
                  pos++;
                } else {
                  result1 = null;
                  if (reportFailures === 0) {
                    matchFailed("[\\n\\r\\u2028\\u2029]");
                  }
                }
                result1 = result1 !== null ? result1 : "";
                if (result1 !== null) {
                  result0 = [result0, result1];
                } else {
                  result0 = null;
                  pos = pos0;
                }
              } else {
                result0 = null;
                pos = pos0;
              }
              if (result0 === null) {
                pos0 = pos;
                result0 = parse__();
                if (result0 !== null) {
                  if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
                    result1 = input.charAt(pos);
                    pos++;
                  } else {
                    result1 = null;
                    if (reportFailures === 0) {
                      matchFailed("[\\n\\r\\u2028\\u2029]");
                    }
                  }
                  if (result1 !== null) {
                    result0 = [result0, result1];
                  } else {
                    result0 = null;
                    pos = pos0;
                  }
                } else {
                  result0 = null;
                  pos = pos0;
                }
                if (result0 === null) {
                  pos0 = pos;
                  pos1 = pos;
                  result0 = parse__();
                  if (result0 !== null) {
                    result1 = parse_connection();
                    if (result1 !== null) {
                      result2 = parse__();
                      if (result2 !== null) {
                        result3 = parse_LineTerminator();
                        result3 = result3 !== null ? result3 : "";
                        if (result3 !== null) {
                          result0 = [result0, result1, result2, result3];
                        } else {
                          result0 = null;
                          pos = pos1;
                        }
                      } else {
                        result0 = null;
                        pos = pos1;
                      }
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                  if (result0 !== null) {
                    result0 = (function(offset, edges) {return parser.registerEdges(edges);})(pos0, result0[1]);
                  }
                  if (result0 === null) {
                    pos = pos0;
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_LineTerminator() {
        var result0, result1, result2, result3;
        var pos0;
        
        pos0 = pos;
        result0 = parse__();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 44) {
            result1 = ",";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\",\"");
            }
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_comment();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              if (/^[\n\r\u2028\u2029]/.test(input.charAt(pos))) {
                result3 = input.charAt(pos);
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[\\n\\r\\u2028\\u2029]");
                }
              }
              result3 = result3 !== null ? result3 : "";
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos0;
              }
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_comment() {
        var result0, result1, result2, result3;
        var pos0;
        
        pos0 = pos;
        result0 = parse__();
        if (result0 !== null) {
          if (input.charCodeAt(pos) === 35) {
            result1 = "#";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\"#\"");
            }
          }
          if (result1 !== null) {
            result2 = [];
            result3 = parse_anychar();
            while (result3 !== null) {
              result2.push(result3);
              result3 = parse_anychar();
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos0;
            }
          } else {
            result0 = null;
            pos = pos0;
          }
        } else {
          result0 = null;
          pos = pos0;
        }
        return result0;
      }
      
      function parse_connection() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_bridge();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            if (input.substr(pos, 2) === "->") {
              result2 = "->";
              pos += 2;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"->\"");
              }
            }
            if (result2 !== null) {
              result3 = parse__();
              if (result3 !== null) {
                result4 = parse_connection();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, x, y) { return [x,y]; })(pos0, result0[0], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_bridge();
        }
        return result0;
      }
      
      function parse_bridge() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_port();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_node();
            if (result2 !== null) {
              result3 = parse__();
              if (result3 !== null) {
                result4 = parse_port();
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, x, proc, y) { return [{"tgt":{process:proc, port:x}},{"src":{process:proc, port:y}}]; })(pos0, result0[0], result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_iip();
          if (result0 === null) {
            result0 = parse_rightlet();
            if (result0 === null) {
              result0 = parse_leftlet();
            }
          }
        }
        return result0;
      }
      
      function parse_leftlet() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_node();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_port();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, proc, port) { return {"src":{process:proc, port:port}} })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_iip() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 39) {
          result0 = "'";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"'\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_iipchar();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_iipchar();
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 39) {
              result2 = "'";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"'\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, iip) { return {"data":iip.join("")} })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_rightlet() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        result0 = parse_port();
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_node();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, port, proc) { return {"tgt":{process:proc, port:port}} })(pos0, result0[0], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_node() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[a-zA-Z0-9_]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[a-zA-Z0-9_]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[a-zA-Z0-9_]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[a-zA-Z0-9_]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result1 = parse_component();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, node, comp) { if(comp){parser.addNode(node.join(""),comp);}; return node.join("")})(pos0, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_component() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 40) {
          result0 = "(";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"(\"");
          }
        }
        if (result0 !== null) {
          if (/^[a-zA-Z\/\-0-9_]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z\\/\\-0-9_]");
            }
          }
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              if (/^[a-zA-Z\/\-0-9_]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[a-zA-Z\\/\\-0-9_]");
                }
              }
            }
          } else {
            result1 = null;
          }
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = parse_compMeta();
            result2 = result2 !== null ? result2 : "";
            if (result2 !== null) {
              if (input.charCodeAt(pos) === 41) {
                result3 = ")";
                pos++;
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\")\"");
                }
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, comp, meta) { var o = {}; comp ? o.comp = comp.join("") : o.comp = ''; meta ? o.meta = meta.join("").split(',') : null; return o; })(pos0, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_compMeta() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 58) {
          result0 = ":";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\":\"");
          }
        }
        if (result0 !== null) {
          if (/^[a-zA-Z\/]/.test(input.charAt(pos))) {
            result2 = input.charAt(pos);
            pos++;
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-zA-Z\\/]");
            }
          }
          if (result2 !== null) {
            result1 = [];
            while (result2 !== null) {
              result1.push(result2);
              if (/^[a-zA-Z\/]/.test(input.charAt(pos))) {
                result2 = input.charAt(pos);
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[a-zA-Z\\/]");
                }
              }
            }
          } else {
            result1 = null;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, meta) {return meta})(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_port() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[A-Z.0-9_]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[A-Z.0-9_]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[A-Z.0-9_]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[A-Z.0-9_]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, portname) {return portname.join("").toLowerCase()})(pos0, result0[0]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_anychar() {
        var result0;
        
        if (/^[^\n\r\u2028\u2029]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[^\\n\\r\\u2028\\u2029]");
          }
        }
        return result0;
      }
      
      function parse_iipchar() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (/^[\\]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\\\]");
          }
        }
        if (result0 !== null) {
          if (/^[']/.test(input.charAt(pos))) {
            result1 = input.charAt(pos);
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[']");
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset) { return "'"; })(pos0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          if (/^[^']/.test(input.charAt(pos))) {
            result0 = input.charAt(pos);
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("[^']");
            }
          }
        }
        return result0;
      }
      
      function parse__() {
        var result0, result1;
        
        result0 = [];
        if (input.charCodeAt(pos) === 32) {
          result1 = " ";
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("\" \"");
          }
        }
        while (result1 !== null) {
          result0.push(result1);
          if (input.charCodeAt(pos) === 32) {
            result1 = " ";
            pos++;
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\" \"");
            }
          }
        }
        result0 = result0 !== null ? result0 : "";
        return result0;
      }
      
      function parse___() {
        var result0, result1;
        
        if (input.charCodeAt(pos) === 32) {
          result1 = " ";
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("\" \"");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (input.charCodeAt(pos) === 32) {
              result1 = " ";
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("\" \"");
              }
            }
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
        var parser, edges, nodes; 
      
        parser = this;
        delete parser.exports;
        delete parser.inports;
        delete parser.outports;
      
        edges = parser.edges = [];
      
        nodes = {};
      
        parser.addNode = function (nodeName, comp) {
          if (!nodes[nodeName]) {
            nodes[nodeName] = {}
          }
          if (!!comp.comp) {
            nodes[nodeName].component = comp.comp;
          }
          if (!!comp.meta) {
            nodes[nodeName].metadata={routes:comp.meta};
          }
         
        }
      
        parser.getResult = function () {
          return {processes:nodes, connections:parser.processEdges(), exports:parser.exports, inports: parser.inports, outports: parser.outports};
        }  
      
        var flatten = function (array, isShallow) {
          var index = -1,
            length = array ? array.length : 0,
            result = [];
      
          while (++index < length) {
            var value = array[index];
      
            if (value instanceof Array) {
              Array.prototype.push.apply(result, isShallow ? value : flatten(value));
            }
            else {
              result.push(value);
            }
          }
          return result;
        }
        
        parser.registerExports = function (priv, pub) {
          if (!parser.exports) {
            parser.exports = [];
          }
          parser.exports.push({private:priv.toLowerCase(), public:pub.toLowerCase()})
        }
        parser.registerInports = function (node, port, pub) {
          if (!parser.inports) {
            parser.inports = {};
          }
          parser.inports[pub.toLowerCase()] = {process:node, port:port.toLowerCase()}
        }
        parser.registerOutports = function (node, port, pub) {
          if (!parser.outports) {
            parser.outports = {};
          }
          parser.outports[pub.toLowerCase()] = {process:node, port:port.toLowerCase()}
        }
      
        parser.registerEdges = function (edges) {
      
          edges.forEach(function (o, i) {
            parser.edges.push(o);
          });
        }  
      
        parser.processEdges = function () {   
          var flats, grouped;
          flats = flatten(parser.edges);
          grouped = [];
          var current = {};
          flats.forEach(function (o, i) {
            if (i % 2 !== 0) { 
              var pair = grouped[grouped.length - 1];
              pair.tgt = o.tgt;
              return;
            }
            grouped.push(o);
          });
          return grouped;
        }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
});
require.register("noflo-noflo/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo","description":"Flow-Based Programming environment for JavaScript","keywords":["fbp","workflow","flow"],"repo":"noflo/noflo","version":"0.4.1","dependencies":{"component/emitter":"*","component/underscore":"*","noflo/fbp":"*"},"development":{},"license":"MIT","main":"src/lib/NoFlo.js","scripts":["src/lib/Graph.coffee","src/lib/InternalSocket.coffee","src/lib/BasePort.coffee","src/lib/InPort.coffee","src/lib/OutPort.coffee","src/lib/Ports.coffee","src/lib/Port.coffee","src/lib/ArrayPort.coffee","src/lib/Component.coffee","src/lib/AsyncComponent.coffee","src/lib/LoggingComponent.coffee","src/lib/ComponentLoader.coffee","src/lib/NoFlo.coffee","src/lib/Network.coffee","src/lib/Platform.coffee","src/lib/Journal.coffee","src/lib/Utils.coffee","src/components/Graph.coffee"],"json":["component.json"],"noflo":{"components":{"Graph":"src/components/Graph.js"}}}');
});
require.register("noflo-noflo/src/lib/Graph.js", function(exports, require, module){
var EventEmitter, Graph, clone,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (!require('./Platform').isBrowser()) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

clone = require('./Utils').clone;

Graph = (function(_super) {
  __extends(Graph, _super);

  Graph.prototype.name = '';

  Graph.prototype.properties = {};

  Graph.prototype.nodes = [];

  Graph.prototype.edges = [];

  Graph.prototype.initializers = [];

  Graph.prototype.exports = [];

  Graph.prototype.inports = {};

  Graph.prototype.outports = {};

  Graph.prototype.groups = [];

  function Graph(name) {
    this.name = name != null ? name : '';
    this.properties = {};
    this.nodes = [];
    this.edges = [];
    this.initializers = [];
    this.exports = [];
    this.inports = {};
    this.outports = {};
    this.groups = [];
    this.transaction = {
      id: null,
      depth: 0
    };
  }

  Graph.prototype.startTransaction = function(id, metadata) {
    if (this.transaction.id) {
      throw Error("Nested transactions not supported");
    }
    this.transaction.id = id;
    this.transaction.depth = 1;
    return this.emit('startTransaction', id, metadata);
  };

  Graph.prototype.endTransaction = function(id, metadata) {
    if (!this.transaction.id) {
      throw Error("Attempted to end non-existing transaction");
    }
    this.transaction.id = null;
    this.transaction.depth = 0;
    return this.emit('endTransaction', id, metadata);
  };

  Graph.prototype.checkTransactionStart = function() {
    if (!this.transaction.id) {
      return this.startTransaction('implicit');
    } else if (this.transaction.id === 'implicit') {
      return this.transaction.depth += 1;
    }
  };

  Graph.prototype.checkTransactionEnd = function() {
    if (this.transaction.id === 'implicit') {
      this.transaction.depth -= 1;
    }
    if (this.transaction.depth === 0) {
      return this.endTransaction('implicit');
    }
  };

  Graph.prototype.setProperties = function(properties) {
    var before, item, val;
    this.checkTransactionStart();
    before = clone(this.properties);
    for (item in properties) {
      val = properties[item];
      this.properties[item] = val;
    }
    this.emit('changeProperties', this.properties, before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addExport = function(publicPort, nodeKey, portKey, metadata) {
    var exported;
    if (metadata == null) {
      metadata = {
        x: 0,
        y: 0
      };
    }
    if (!this.getNode(nodeKey)) {
      return;
    }
    this.checkTransactionStart();
    exported = {
      "public": publicPort,
      process: nodeKey,
      port: portKey,
      metadata: metadata
    };
    this.exports.push(exported);
    this.emit('addExport', exported);
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeExport = function(publicPort) {
    var exported, found, idx, _i, _len, _ref;
    publicPort = publicPort.toLowerCase();
    found = null;
    _ref = this.exports;
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      exported = _ref[idx];
      if (exported["public"] === publicPort) {
        found = exported;
      }
    }
    if (!found) {
      return;
    }
    this.checkTransactionStart();
    this.exports.splice(this.exports.indexOf(found), 1);
    this.emit('removeExport', found);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addInport = function(publicPort, nodeKey, portKey, metadata) {
    if (!this.getNode(nodeKey)) {
      return;
    }
    this.checkTransactionStart();
    this.inports[publicPort] = {
      process: nodeKey,
      port: portKey,
      metadata: metadata
    };
    this.emit('addInport', publicPort, this.inports[publicPort]);
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeInport = function(publicPort) {
    var port;
    publicPort = publicPort.toLowerCase();
    if (!this.inports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    port = this.inports[publicPort];
    this.setInportMetadata(publicPort, {});
    delete this.inports[publicPort];
    this.emit('removeInport', publicPort, port);
    return this.checkTransactionEnd();
  };

  Graph.prototype.renameInport = function(oldPort, newPort) {
    if (!this.inports[oldPort]) {
      return;
    }
    this.checkTransactionStart();
    this.inports[newPort] = this.inports[oldPort];
    delete this.inports[oldPort];
    this.emit('renameInport', oldPort, newPort);
    return this.checkTransactionEnd();
  };

  Graph.prototype.setInportMetadata = function(publicPort, metadata) {
    var before, item, val;
    if (!this.inports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    before = clone(this.inports[publicPort].metadata);
    if (!this.inports[publicPort].metadata) {
      this.inports[publicPort].metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        this.inports[publicPort].metadata[item] = val;
      } else {
        delete this.inports[publicPort].metadata[item];
      }
    }
    this.emit('changeInport', publicPort, this.inports[publicPort], before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addOutport = function(publicPort, nodeKey, portKey, metadata) {
    if (!this.getNode(nodeKey)) {
      return;
    }
    this.checkTransactionStart();
    this.outports[publicPort] = {
      process: nodeKey,
      port: portKey,
      metadata: metadata
    };
    this.emit('addOutport', publicPort, this.outports[publicPort]);
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeOutport = function(publicPort) {
    var port;
    publicPort = publicPort.toLowerCase();
    if (!this.outports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    port = this.outports[publicPort];
    this.setOutportMetadata(publicPort, {});
    delete this.outports[publicPort];
    this.emit('removeOutport', publicPort, port);
    return this.checkTransactionEnd();
  };

  Graph.prototype.renameOutport = function(oldPort, newPort) {
    if (!this.outports[oldPort]) {
      return;
    }
    this.checkTransactionStart();
    this.outports[newPort] = this.outports[oldPort];
    delete this.outports[oldPort];
    this.emit('renameOutport', oldPort, newPort);
    return this.checkTransactionEnd();
  };

  Graph.prototype.setOutportMetadata = function(publicPort, metadata) {
    var before, item, val;
    if (!this.outports[publicPort]) {
      return;
    }
    this.checkTransactionStart();
    before = clone(this.outports[publicPort].metadata);
    if (!this.outports[publicPort].metadata) {
      this.outports[publicPort].metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        this.outports[publicPort].metadata[item] = val;
      } else {
        delete this.outports[publicPort].metadata[item];
      }
    }
    this.emit('changeOutport', publicPort, this.outports[publicPort], before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addGroup = function(group, nodes, metadata) {
    var g;
    this.checkTransactionStart();
    g = {
      name: group,
      nodes: nodes,
      metadata: metadata
    };
    this.groups.push(g);
    this.emit('addGroup', g);
    return this.checkTransactionEnd();
  };

  Graph.prototype.renameGroup = function(oldName, newName) {
    var group, _i, _len, _ref;
    this.checkTransactionStart();
    _ref = this.groups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (!group) {
        continue;
      }
      if (group.name !== oldName) {
        continue;
      }
      group.name = newName;
      this.emit('renameGroup', oldName, newName);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.removeGroup = function(groupName) {
    var group, _i, _len, _ref;
    this.checkTransactionStart();
    _ref = this.groups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (!group) {
        continue;
      }
      if (group.name !== groupName) {
        continue;
      }
      this.setGroupMetadata(group.name, {});
      this.groups.splice(this.groups.indexOf(group), 1);
      this.emit('removeGroup', group);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.setGroupMetadata = function(groupName, metadata) {
    var before, group, item, val, _i, _len, _ref;
    this.checkTransactionStart();
    _ref = this.groups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (!group) {
        continue;
      }
      if (group.name !== groupName) {
        continue;
      }
      before = clone(group.metadata);
      for (item in metadata) {
        val = metadata[item];
        if (val != null) {
          group.metadata[item] = val;
        } else {
          delete group.metadata[item];
        }
      }
      this.emit('changeGroup', group, before);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.addNode = function(id, component, metadata) {
    var node;
    this.checkTransactionStart();
    if (!metadata) {
      metadata = {};
    }
    node = {
      id: id,
      component: component,
      metadata: metadata
    };
    this.nodes.push(node);
    this.emit('addNode', node);
    this.checkTransactionEnd();
    return node;
  };

  Graph.prototype.removeNode = function(id) {
    var edge, exported, group, index, initializer, node, priv, pub, toRemove, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    node = this.getNode(id);
    if (!node) {
      return;
    }
    this.checkTransactionStart();
    toRemove = [];
    _ref = this.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      edge = _ref[_i];
      if ((edge.from.node === node.id) || (edge.to.node === node.id)) {
        toRemove.push(edge);
      }
    }
    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
      edge = toRemove[_j];
      this.removeEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port);
    }
    toRemove = [];
    _ref1 = this.initializers;
    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
      initializer = _ref1[_k];
      if (initializer.to.node === node.id) {
        toRemove.push(initializer);
      }
    }
    for (_l = 0, _len3 = toRemove.length; _l < _len3; _l++) {
      initializer = toRemove[_l];
      this.removeInitial(initializer.to.node, initializer.to.port);
    }
    toRemove = [];
    _ref2 = this.exports;
    for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
      exported = _ref2[_m];
      if (id.toLowerCase() === exported.process) {
        toRemove.push(exported);
      }
    }
    for (_n = 0, _len5 = toRemove.length; _n < _len5; _n++) {
      exported = toRemove[_n];
      this.removeExports(exported["public"]);
    }
    toRemove = [];
    _ref3 = this.inports;
    for (pub in _ref3) {
      priv = _ref3[pub];
      if (priv.process === id) {
        toRemove.push(pub);
      }
    }
    for (_o = 0, _len6 = toRemove.length; _o < _len6; _o++) {
      pub = toRemove[_o];
      this.removeInport(pub);
    }
    toRemove = [];
    _ref4 = this.outports;
    for (pub in _ref4) {
      priv = _ref4[pub];
      if (priv.process === id) {
        toRemove.push(pub);
      }
    }
    for (_p = 0, _len7 = toRemove.length; _p < _len7; _p++) {
      pub = toRemove[_p];
      this.removeOutport(pub);
    }
    _ref5 = this.groups;
    for (_q = 0, _len8 = _ref5.length; _q < _len8; _q++) {
      group = _ref5[_q];
      if (!group) {
        continue;
      }
      index = group.nodes.indexOf(id);
      if (index === -1) {
        continue;
      }
      group.nodes.splice(index, 1);
    }
    this.setNodeMetadata(id, {});
    if (-1 !== this.nodes.indexOf(node)) {
      this.nodes.splice(this.nodes.indexOf(node), 1);
    }
    this.emit('removeNode', node);
    return this.checkTransactionEnd();
  };

  Graph.prototype.getNode = function(id) {
    var node, _i, _len, _ref;
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if (!node) {
        continue;
      }
      if (node.id === id) {
        return node;
      }
    }
    return null;
  };

  Graph.prototype.renameNode = function(oldId, newId) {
    var edge, exported, group, iip, index, node, priv, pub, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    this.checkTransactionStart();
    node = this.getNode(oldId);
    if (!node) {
      return;
    }
    node.id = newId;
    _ref = this.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      edge = _ref[_i];
      if (!edge) {
        continue;
      }
      if (edge.from.node === oldId) {
        edge.from.node = newId;
      }
      if (edge.to.node === oldId) {
        edge.to.node = newId;
      }
    }
    _ref1 = this.initializers;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      iip = _ref1[_j];
      if (!iip) {
        continue;
      }
      if (iip.to.node === oldId) {
        iip.to.node = newId;
      }
    }
    _ref2 = this.inports;
    for (pub in _ref2) {
      priv = _ref2[pub];
      if (priv.process === oldId) {
        priv.process = newId;
      }
    }
    _ref3 = this.outports;
    for (pub in _ref3) {
      priv = _ref3[pub];
      if (priv.process === oldId) {
        priv.process = newId;
      }
    }
    _ref4 = this.exports;
    for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
      exported = _ref4[_k];
      if (exported.process === oldId) {
        exported.process = newId;
      }
    }
    _ref5 = this.groups;
    for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
      group = _ref5[_l];
      if (!group) {
        continue;
      }
      index = group.nodes.indexOf(oldId);
      if (index === -1) {
        continue;
      }
      group.nodes[index] = newId;
    }
    this.emit('renameNode', oldId, newId);
    return this.checkTransactionEnd();
  };

  Graph.prototype.setNodeMetadata = function(id, metadata) {
    var before, item, node, val;
    node = this.getNode(id);
    if (!node) {
      return;
    }
    this.checkTransactionStart();
    before = clone(node.metadata);
    if (!node.metadata) {
      node.metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        node.metadata[item] = val;
      } else {
        delete node.metadata[item];
      }
    }
    this.emit('changeNode', node, before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addEdge = function(outNode, outPort, inNode, inPort, metadata) {
    var edge, _i, _len, _ref;
    _ref = this.edges;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      edge = _ref[_i];
      if (edge.from.node === outNode && edge.from.port === outPort && edge.to.node === inNode && edge.to.port === inPort) {
        return;
      }
    }
    if (!this.getNode(outNode)) {
      return;
    }
    if (!this.getNode(inNode)) {
      return;
    }
    if (!metadata) {
      metadata = {};
    }
    this.checkTransactionStart();
    edge = {
      from: {
        node: outNode,
        port: outPort
      },
      to: {
        node: inNode,
        port: inPort
      },
      metadata: metadata
    };
    this.edges.push(edge);
    this.emit('addEdge', edge);
    this.checkTransactionEnd();
    return edge;
  };

  Graph.prototype.removeEdge = function(node, port, node2, port2) {
    var edge, index, toKeep, toRemove, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    this.checkTransactionStart();
    toRemove = [];
    toKeep = [];
    if (node2 && port2) {
      _ref = this.edges;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        edge = _ref[index];
        if (edge.from.node === node && edge.from.port === port && edge.to.node === node2 && edge.to.port === port2) {
          this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
          toRemove.push(edge);
        } else {
          toKeep.push(edge);
        }
      }
    } else {
      _ref1 = this.edges;
      for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
        edge = _ref1[index];
        if ((edge.from.node === node && edge.from.port === port) || (edge.to.node === node && edge.to.port === port)) {
          this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
          toRemove.push(edge);
        } else {
          toKeep.push(edge);
        }
      }
    }
    this.edges = toKeep;
    for (_k = 0, _len2 = toRemove.length; _k < _len2; _k++) {
      edge = toRemove[_k];
      this.emit('removeEdge', edge);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.getEdge = function(node, port, node2, port2) {
    var edge, index, _i, _len, _ref;
    _ref = this.edges;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      edge = _ref[index];
      if (!edge) {
        continue;
      }
      if (edge.from.node === node && edge.from.port === port) {
        if (edge.to.node === node2 && edge.to.port === port2) {
          return edge;
        }
      }
    }
    return null;
  };

  Graph.prototype.setEdgeMetadata = function(node, port, node2, port2, metadata) {
    var before, edge, item, val;
    edge = this.getEdge(node, port, node2, port2);
    if (!edge) {
      return;
    }
    this.checkTransactionStart();
    before = clone(edge.metadata);
    if (!edge.metadata) {
      edge.metadata = {};
    }
    for (item in metadata) {
      val = metadata[item];
      if (val != null) {
        edge.metadata[item] = val;
      } else {
        delete edge.metadata[item];
      }
    }
    this.emit('changeEdge', edge, before);
    return this.checkTransactionEnd();
  };

  Graph.prototype.addInitial = function(data, node, port, metadata) {
    var initializer;
    if (!this.getNode(node)) {
      return;
    }
    this.checkTransactionStart();
    initializer = {
      from: {
        data: data
      },
      to: {
        node: node,
        port: port
      },
      metadata: metadata
    };
    this.initializers.push(initializer);
    this.emit('addInitial', initializer);
    this.checkTransactionEnd();
    return initializer;
  };

  Graph.prototype.removeInitial = function(node, port) {
    var edge, index, toKeep, toRemove, _i, _j, _len, _len1, _ref;
    this.checkTransactionStart();
    toRemove = [];
    toKeep = [];
    _ref = this.initializers;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      edge = _ref[index];
      if (edge.to.node === node && edge.to.port === port) {
        toRemove.push(edge);
      } else {
        toKeep.push(edge);
      }
    }
    this.initializers = toKeep;
    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
      edge = toRemove[_j];
      this.emit('removeInitial', edge);
    }
    return this.checkTransactionEnd();
  };

  Graph.prototype.toDOT = function() {
    var cleanID, cleanPort, data, dot, edge, id, initializer, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    cleanID = function(id) {
      return id.replace(/\s*/g, "");
    };
    cleanPort = function(port) {
      return port.replace(/\./g, "");
    };
    dot = "digraph {\n";
    _ref = this.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      dot += "    " + (cleanID(node.id)) + " [label=" + node.id + " shape=box]\n";
    }
    _ref1 = this.initializers;
    for (id = _j = 0, _len1 = _ref1.length; _j < _len1; id = ++_j) {
      initializer = _ref1[id];
      if (typeof initializer.from.data === 'function') {
        data = 'Function';
      } else {
        data = initializer.from.data;
      }
      dot += "    data" + id + " [label=\"'" + data + "'\" shape=plaintext]\n";
      dot += "    data" + id + " -> " + (cleanID(initializer.to.node)) + "[headlabel=" + (cleanPort(initializer.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
    }
    _ref2 = this.edges;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      edge = _ref2[_k];
      dot += "    " + (cleanID(edge.from.node)) + " -> " + (cleanID(edge.to.node)) + "[taillabel=" + (cleanPort(edge.from.port)) + " headlabel=" + (cleanPort(edge.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
    }
    dot += "}";
    return dot;
  };

  Graph.prototype.toYUML = function() {
    var edge, initializer, yuml, _i, _j, _len, _len1, _ref, _ref1;
    yuml = [];
    _ref = this.initializers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      initializer = _ref[_i];
      yuml.push("(start)[" + initializer.to.port + "]->(" + initializer.to.node + ")");
    }
    _ref1 = this.edges;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      edge = _ref1[_j];
      yuml.push("(" + edge.from.node + ")[" + edge.from.port + "]->(" + edge.to.node + ")");
    }
    return yuml.join(",");
  };

  Graph.prototype.toJSON = function() {
    var connection, edge, exported, group, groupData, initializer, json, node, priv, property, pub, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    json = {
      properties: {},
      inports: {},
      outports: {},
      groups: [],
      processes: {},
      connections: []
    };
    if (this.name) {
      json.properties.name = this.name;
    }
    _ref = this.properties;
    for (property in _ref) {
      value = _ref[property];
      json.properties[property] = value;
    }
    _ref1 = this.inports;
    for (pub in _ref1) {
      priv = _ref1[pub];
      json.inports[pub] = priv;
    }
    _ref2 = this.outports;
    for (pub in _ref2) {
      priv = _ref2[pub];
      json.outports[pub] = priv;
    }
    _ref3 = this.exports;
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      exported = _ref3[_i];
      if (!json.exports) {
        json.exports = [];
      }
      json.exports.push(exported);
    }
    _ref4 = this.groups;
    for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
      group = _ref4[_j];
      groupData = {
        name: group.name,
        nodes: group.nodes
      };
      if (Object.keys(group.metadata).length) {
        groupData.metadata = group.metadata;
      }
      json.groups.push(groupData);
    }
    _ref5 = this.nodes;
    for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
      node = _ref5[_k];
      json.processes[node.id] = {
        component: node.component
      };
      if (node.metadata) {
        json.processes[node.id].metadata = node.metadata;
      }
    }
    _ref6 = this.edges;
    for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
      edge = _ref6[_l];
      connection = {
        src: {
          process: edge.from.node,
          port: edge.from.port
        },
        tgt: {
          process: edge.to.node,
          port: edge.to.port
        }
      };
      if (Object.keys(edge.metadata).length) {
        connection.metadata = edge.metadata;
      }
      json.connections.push(connection);
    }
    _ref7 = this.initializers;
    for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
      initializer = _ref7[_m];
      json.connections.push({
        data: initializer.from.data,
        tgt: {
          process: initializer.to.node,
          port: initializer.to.port
        }
      });
    }
    return json;
  };

  Graph.prototype.save = function(file, success) {
    var json;
    json = JSON.stringify(this.toJSON(), null, 4);
    return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
      if (err) {
        throw err;
      }
      return success(file);
    });
  };

  return Graph;

})(EventEmitter);

exports.Graph = Graph;

exports.createGraph = function(name) {
  return new Graph(name);
};

exports.loadJSON = function(definition, success, metadata) {
  var conn, def, exported, graph, group, id, portId, priv, processId, properties, property, pub, split, value, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
  if (metadata == null) {
    metadata = {};
  }
  if (!definition.properties) {
    definition.properties = {};
  }
  if (!definition.processes) {
    definition.processes = {};
  }
  if (!definition.connections) {
    definition.connections = [];
  }
  graph = new Graph(definition.properties.name);
  graph.startTransaction('loadJSON', metadata);
  properties = {};
  _ref = definition.properties;
  for (property in _ref) {
    value = _ref[property];
    if (property === 'name') {
      continue;
    }
    properties[property] = value;
  }
  graph.setProperties(properties);
  _ref1 = definition.processes;
  for (id in _ref1) {
    def = _ref1[id];
    if (!def.metadata) {
      def.metadata = {};
    }
    graph.addNode(id, def.component, def.metadata);
  }
  _ref2 = definition.connections;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    conn = _ref2[_i];
    if (conn.data !== void 0) {
      graph.addInitial(conn.data, conn.tgt.process, conn.tgt.port.toLowerCase());
      continue;
    }
    metadata = conn.metadata ? conn.metadata : {};
    graph.addEdge(conn.src.process, conn.src.port.toLowerCase(), conn.tgt.process, conn.tgt.port.toLowerCase(), metadata);
  }
  if (definition.exports && definition.exports.length) {
    _ref3 = definition.exports;
    for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
      exported = _ref3[_j];
      if (exported["private"]) {
        split = exported["private"].split('.');
        if (split.length !== 2) {
          continue;
        }
        processId = split[0];
        portId = split[1];
        for (id in definition.processes) {
          if (id.toLowerCase() === processId.toLowerCase()) {
            processId = id;
          }
        }
      } else {
        processId = exported.process;
        portId = exported.port;
      }
      graph.addExport(exported["public"], processId, portId, exported.metadata);
    }
  }
  if (definition.inports) {
    _ref4 = definition.inports;
    for (pub in _ref4) {
      priv = _ref4[pub];
      graph.addInport(pub, priv.process, priv.port, priv.metadata);
    }
  }
  if (definition.outports) {
    _ref5 = definition.outports;
    for (pub in _ref5) {
      priv = _ref5[pub];
      graph.addOutport(pub, priv.process, priv.port, priv.metadata);
    }
  }
  if (definition.groups) {
    _ref6 = definition.groups;
    for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
      group = _ref6[_k];
      graph.addGroup(group.name, group.nodes, group.metadata || {});
    }
  }
  graph.endTransaction('loadJSON');
  return success(graph);
};

exports.loadFBP = function(fbpData, success) {
  var definition;
  definition = require('fbp').parse(fbpData);
  return exports.loadJSON(definition, success);
};

exports.loadHTTP = function(url, success) {
  var req;
  req = new XMLHttpRequest;
  req.onreadystatechange = function() {
    if (req.readyState !== 4) {
      return;
    }
    if (req.status !== 200) {
      return success();
    }
    return success(req.responseText);
  };
  req.open('GET', url, true);
  return req.send();
};

exports.loadFile = function(file, success, metadata) {
  var definition, e;
  if (metadata == null) {
    metadata = {};
  }
  if (!(typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1)) {
    try {
      definition = require(file);
      exports.loadJSON(definition, success, metadata);
      return;
    } catch (_error) {
      e = _error;
      exports.loadHTTP(file, function(data) {
        if (!data) {
          throw new Error("Failed to load graph " + file);
          return;
        }
        if (file.split('.').pop() === 'fbp') {
          return exports.loadFBP(data, success);
        }
        definition = JSON.parse(data);
        return exports.loadJSON(definition, success);
      });
    }
    return;
  }
  return require('fs').readFile(file, "utf-8", function(err, data) {
    if (err) {
      throw err;
    }
    if (file.split('.').pop() === 'fbp') {
      return exports.loadFBP(data, success);
    }
    definition = JSON.parse(data);
    return exports.loadJSON(definition, success);
  });
};

});
require.register("noflo-noflo/src/lib/InternalSocket.js", function(exports, require, module){
var EventEmitter, InternalSocket,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (!require('./Platform').isBrowser()) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

InternalSocket = (function(_super) {
  __extends(InternalSocket, _super);

  function InternalSocket() {
    this.connected = false;
    this.groups = [];
  }

  InternalSocket.prototype.connect = function() {
    if (this.connected) {
      return;
    }
    this.connected = true;
    return this.emit('connect', this);
  };

  InternalSocket.prototype.disconnect = function() {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    return this.emit('disconnect', this);
  };

  InternalSocket.prototype.isConnected = function() {
    return this.connected;
  };

  InternalSocket.prototype.send = function(data) {
    if (!this.connected) {
      this.connect();
    }
    return this.emit('data', data);
  };

  InternalSocket.prototype.beginGroup = function(group) {
    this.groups.push(group);
    return this.emit('begingroup', group);
  };

  InternalSocket.prototype.endGroup = function() {
    return this.emit('endgroup', this.groups.pop());
  };

  InternalSocket.prototype.getId = function() {
    var fromStr, toStr;
    fromStr = function(from) {
      return "" + from.process.id + "() " + (from.port.toUpperCase());
    };
    toStr = function(to) {
      return "" + (to.port.toUpperCase()) + " " + to.process.id + "()";
    };
    if (!(this.from || this.to)) {
      return "UNDEFINED";
    }
    if (this.from && !this.to) {
      return "" + (fromStr(this.from)) + " -> ANON";
    }
    if (!this.from) {
      return "DATA -> " + (toStr(this.to));
    }
    return "" + (fromStr(this.from)) + " -> " + (toStr(this.to));
  };

  return InternalSocket;

})(EventEmitter);

exports.InternalSocket = InternalSocket;

exports.createSocket = function() {
  return new InternalSocket;
};

});
require.register("noflo-noflo/src/lib/BasePort.js", function(exports, require, module){
var BasePort, EventEmitter, validTypes,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (!require('./Platform').isBrowser()) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

validTypes = ['all', 'string', 'number', 'int', 'object', 'array', 'boolean', 'color', 'date', 'bang'];

BasePort = (function(_super) {
  __extends(BasePort, _super);

  function BasePort(options) {
    this.handleOptions(options);
    this.sockets = [];
    this.node = null;
    this.name = null;
  }

  BasePort.prototype.handleOptions = function(options) {
    if (!options) {
      options = {};
    }
    if (!options.datatype) {
      options.datatype = 'all';
    }
    if (options.required === void 0) {
      options.required = true;
    }
    if (validTypes.indexOf(options.datatype) === -1) {
      throw new Error("Invalid port datatype '" + options.datatype + "' specified, valid are " + (validTypes.join(' ,')));
    }
    if (options.type && options.type.indexOf('/') === -1) {
      throw new Error("Invalid port type '" + options.type + "' specified. Should be URL or MIME type");
    }
    return this.options = options;
  };

  BasePort.prototype.getId = function() {
    if (!(this.node && this.name)) {
      return 'Port';
    }
    return "" + this.node + " " + (this.name.toUpperCase());
  };

  BasePort.prototype.getDataType = function() {
    return this.options.datatype;
  };

  BasePort.prototype.getDescription = function() {
    return this.options.description;
  };

  BasePort.prototype.attach = function(socket, index) {
    if (index == null) {
      index = null;
    }
    if (!this.isAddressable() || index === null) {
      index = this.sockets.length;
    }
    this.sockets[index] = socket;
    this.attachSocket(socket, index);
    if (this.isAddressable()) {
      this.emit('attach', socket, index);
      return;
    }
    return this.emit('attach', socket);
  };

  BasePort.prototype.attachSocket = function() {};

  BasePort.prototype.detach = function(socket) {
    var index;
    index = this.sockets.indexOf(socket);
    if (index === -1) {
      return;
    }
    this.sockets.splice(index, 1);
    if (this.isAddressable()) {
      this.emit('detach', socket, index);
      return;
    }
    return this.emit('detach', socket);
  };

  BasePort.prototype.isAddressable = function() {
    if (this.options.addressable) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isBuffered = function() {
    if (this.options.buffered) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isRequired = function() {
    if (this.options.required) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isAttached = function(socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (this.isAddressable() && socketId !== null) {
      if (this.sockets[socketId]) {
        return true;
      }
      return false;
    }
    if (this.sockets.length) {
      return true;
    }
    return false;
  };

  BasePort.prototype.isConnected = function(socketId) {
    var connected;
    if (socketId == null) {
      socketId = null;
    }
    if (this.isAddressable()) {
      if (socketId === null) {
        throw new Error("" + (this.getId()) + ": Socket ID required");
      }
      if (!this.sockets[socketId]) {
        throw new Error("" + (this.getId()) + ": Socket " + socketId + " not available");
      }
      return this.sockets[socketId].isConnected();
    }
    connected = false;
    this.sockets.forEach((function(_this) {
      return function(socket) {
        if (socket.isConnected()) {
          return connected = true;
        }
      };
    })(this));
    return connected;
  };

  BasePort.prototype.canAttach = function() {
    return true;
  };

  return BasePort;

})(EventEmitter);

module.exports = BasePort;

});
require.register("noflo-noflo/src/lib/InPort.js", function(exports, require, module){
var BasePort, InPort,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BasePort = require('./BasePort');

InPort = (function(_super) {
  __extends(InPort, _super);

  function InPort(options, process) {
    this.process = null;
    if (!process && typeof options === 'function') {
      process = options;
      options = {};
    }
    if (options && options.buffered === void 0) {
      options.buffered = false;
    }
    if (!process && options && options.process) {
      process = options.process;
      delete options.process;
    }
    if (process) {
      if (typeof process !== 'function') {
        throw new Error('process must be a function');
      }
      this.process = process;
    }
    InPort.__super__.constructor.call(this, options);
    this.sendDefault();
    this.prepareBuffer();
  }

  InPort.prototype.attachSocket = function(socket, localId) {
    if (localId == null) {
      localId = null;
    }
    socket.on('connect', (function(_this) {
      return function() {
        return _this.handleSocketEvent('connect', socket, localId);
      };
    })(this));
    socket.on('begingroup', (function(_this) {
      return function(group) {
        return _this.handleSocketEvent('begingroup', group, localId);
      };
    })(this));
    socket.on('data', (function(_this) {
      return function(data) {
        _this.validateData(data);
        return _this.handleSocketEvent('data', data, localId);
      };
    })(this));
    socket.on('endgroup', (function(_this) {
      return function(group) {
        return _this.handleSocketEvent('endgroup', group, localId);
      };
    })(this));
    return socket.on('disconnect', (function(_this) {
      return function() {
        return _this.handleSocketEvent('disconnect', socket, localId);
      };
    })(this));
  };

  InPort.prototype.handleSocketEvent = function(event, payload, id) {
    if (this.isBuffered()) {
      this.buffer.push({
        event: event,
        payload: payload,
        id: id
      });
      if (this.isAddressable()) {
        if (this.process) {
          this.process(event, id, this.nodeInstance);
        }
        this.emit(event, id);
      } else {
        if (this.process) {
          this.process(event, this.nodeInstance);
        }
        this.emit(event);
      }
      return;
    }
    if (this.process) {
      if (this.isAddressable()) {
        this.process(event, payload, id, this.nodeInstance);
      } else {
        this.process(event, payload, this.nodeInstance);
      }
    }
    if (this.isAddressable()) {
      return this.emit(event, payload, id);
    }
    return this.emit(event, payload);
  };

  InPort.prototype.sendDefault = function() {
    if (this.options["default"] === void 0) {
      return;
    }
    return setTimeout((function(_this) {
      return function() {
        var idx, socket, _i, _len, _ref, _results;
        _ref = _this.sockets;
        _results = [];
        for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
          socket = _ref[idx];
          _results.push(_this.handleSocketEvent('data', _this.options["default"], idx));
        }
        return _results;
      };
    })(this), 0);
  };

  InPort.prototype.prepareBuffer = function() {
    if (!this.isBuffered()) {
      return;
    }
    return this.buffer = [];
  };

  InPort.prototype.validateData = function(data) {
    if (!this.options.values) {
      return;
    }
    if (this.options.values.indexOf(data) === -1) {
      throw new Error('Invalid data received');
    }
  };

  InPort.prototype.receive = function() {
    if (!this.isBuffered()) {
      throw new Error('Receive is only possible on buffered ports');
    }
    return this.buffer.shift();
  };

  return InPort;

})(BasePort);

module.exports = InPort;

});
require.register("noflo-noflo/src/lib/OutPort.js", function(exports, require, module){
var BasePort, OutPort,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BasePort = require('./BasePort');

OutPort = (function(_super) {
  __extends(OutPort, _super);

  function OutPort() {
    return OutPort.__super__.constructor.apply(this, arguments);
  }

  OutPort.prototype.connect = function(socketId) {
    var socket, sockets, _i, _len, _results;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    _results = [];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      socket = sockets[_i];
      _results.push(socket.connect());
    }
    return _results;
  };

  OutPort.prototype.beginGroup = function(group, socketId) {
    var sockets;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    return sockets.forEach(function(socket) {
      if (socket.isConnected()) {
        return socket.beginGroup(group);
      }
      socket.once('connect', function() {
        return socket.beginGroup(group);
      });
      return socket.connect();
    });
  };

  OutPort.prototype.send = function(data, socketId) {
    var sockets;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    return sockets.forEach(function(socket) {
      if (socket.isConnected()) {
        return socket.send(data);
      }
      socket.once('connect', function() {
        return socket.send(data);
      });
      return socket.connect();
    });
  };

  OutPort.prototype.endGroup = function(socketId) {
    var socket, sockets, _i, _len, _results;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    _results = [];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      socket = sockets[_i];
      _results.push(socket.endGroup());
    }
    return _results;
  };

  OutPort.prototype.disconnect = function(socketId) {
    var socket, sockets, _i, _len, _results;
    if (socketId == null) {
      socketId = null;
    }
    sockets = this.getSockets(socketId);
    this.checkRequired(sockets);
    _results = [];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      socket = sockets[_i];
      _results.push(socket.disconnect());
    }
    return _results;
  };

  OutPort.prototype.checkRequired = function(sockets) {
    if (sockets.length === 0 && this.isRequired()) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
  };

  OutPort.prototype.getSockets = function(socketId) {
    if (this.isAddressable()) {
      if (socketId === null) {
        throw new Error("" + (this.getId()) + " Socket ID required");
      }
      if (!this.sockets[socketId]) {
        return [];
      }
      return [this.sockets[socketId]];
    }
    return this.sockets;
  };

  return OutPort;

})(BasePort);

module.exports = OutPort;

});
require.register("noflo-noflo/src/lib/Ports.js", function(exports, require, module){
var EventEmitter, InPort, InPorts, OutPort, OutPorts, Ports,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (!require('./Platform').isBrowser()) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

InPort = require('./InPort');

OutPort = require('./OutPort');

Ports = (function(_super) {
  __extends(Ports, _super);

  Ports.prototype.model = InPort;

  function Ports(ports) {
    var name, options;
    this.ports = {};
    if (!ports) {
      return;
    }
    for (name in ports) {
      options = ports[name];
      this.add(name, options);
    }
  }

  Ports.prototype.add = function(name, options, process) {
    if (name === 'add' || name === 'remove') {
      throw new Error('Add and remove are restricted port names');
    }
    if (this.ports[name]) {
      this.remove(name);
    }
    if (typeof options === 'object' && options.canAttach) {
      this.ports[name] = options;
    } else {
      this.ports[name] = new this.model(options, process);
    }
    this[name] = this.ports[name];
    return this.emit('add', name);
  };

  Ports.prototype.remove = function(name) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not defined");
    }
    delete this.ports[name];
    delete this[name];
    return this.emit('remove', name);
  };

  return Ports;

})(EventEmitter);

exports.InPorts = InPorts = (function(_super) {
  __extends(InPorts, _super);

  function InPorts() {
    return InPorts.__super__.constructor.apply(this, arguments);
  }

  InPorts.prototype.on = function(name, event, callback) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].on(event, callback);
  };

  InPorts.prototype.once = function(name, event, callback) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].once(event, callback);
  };

  return InPorts;

})(Ports);

exports.OutPorts = OutPorts = (function(_super) {
  __extends(OutPorts, _super);

  function OutPorts() {
    return OutPorts.__super__.constructor.apply(this, arguments);
  }

  OutPorts.prototype.model = OutPort;

  OutPorts.prototype.connect = function(name, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].connect(socketId);
  };

  OutPorts.prototype.beginGroup = function(name, group, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].beginGroup(group, socketId);
  };

  OutPorts.prototype.send = function(name, data, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].send(data, socketId);
  };

  OutPorts.prototype.endGroup = function(name, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].endGroup(socketId);
  };

  OutPorts.prototype.disconnect = function(name, socketId) {
    if (!this.ports[name]) {
      throw new Error("Port " + name + " not available");
    }
    return this.ports[name].disconnect(socketId);
  };

  return OutPorts;

})(Ports);

});
require.register("noflo-noflo/src/lib/Port.js", function(exports, require, module){
var EventEmitter, Port,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (!require('./Platform').isBrowser()) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

Port = (function(_super) {
  __extends(Port, _super);

  Port.prototype.description = '';

  Port.prototype.required = true;

  function Port(type) {
    this.type = type;
    if (!this.type) {
      this.type = 'all';
    }
    this.sockets = [];
    this.from = null;
    this.node = null;
    this.name = null;
  }

  Port.prototype.getId = function() {
    if (!(this.node && this.name)) {
      return 'Port';
    }
    return "" + this.node + " " + (this.name.toUpperCase());
  };

  Port.prototype.getDataType = function() {
    return this.type;
  };

  Port.prototype.getDescription = function() {
    return this.description;
  };

  Port.prototype.attach = function(socket) {
    this.sockets.push(socket);
    return this.attachSocket(socket);
  };

  Port.prototype.attachSocket = function(socket, localId) {
    if (localId == null) {
      localId = null;
    }
    this.emit("attach", socket);
    this.from = socket.from;
    if (socket.setMaxListeners) {
      socket.setMaxListeners(0);
    }
    socket.on("connect", (function(_this) {
      return function() {
        return _this.emit("connect", socket, localId);
      };
    })(this));
    socket.on("begingroup", (function(_this) {
      return function(group) {
        return _this.emit("begingroup", group, localId);
      };
    })(this));
    socket.on("data", (function(_this) {
      return function(data) {
        return _this.emit("data", data, localId);
      };
    })(this));
    socket.on("endgroup", (function(_this) {
      return function(group) {
        return _this.emit("endgroup", group, localId);
      };
    })(this));
    return socket.on("disconnect", (function(_this) {
      return function() {
        return _this.emit("disconnect", socket, localId);
      };
    })(this));
  };

  Port.prototype.connect = function() {
    var socket, _i, _len, _ref, _results;
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.connect());
    }
    return _results;
  };

  Port.prototype.beginGroup = function(group) {
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    return this.sockets.forEach(function(socket) {
      if (socket.isConnected()) {
        return socket.beginGroup(group);
      }
      socket.once('connect', function() {
        return socket.beginGroup(group);
      });
      return socket.connect();
    });
  };

  Port.prototype.send = function(data) {
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    return this.sockets.forEach(function(socket) {
      if (socket.isConnected()) {
        return socket.send(data);
      }
      socket.once('connect', function() {
        return socket.send(data);
      });
      return socket.connect();
    });
  };

  Port.prototype.endGroup = function() {
    var socket, _i, _len, _ref, _results;
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.endGroup());
    }
    return _results;
  };

  Port.prototype.disconnect = function() {
    var socket, _i, _len, _ref, _results;
    if (this.sockets.length === 0) {
      throw new Error("" + (this.getId()) + ": No connections available");
    }
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.disconnect());
    }
    return _results;
  };

  Port.prototype.detach = function(socket) {
    var index;
    if (this.sockets.length === 0) {
      return;
    }
    if (!socket) {
      socket = this.sockets[0];
    }
    index = this.sockets.indexOf(socket);
    if (index === -1) {
      return;
    }
    this.sockets.splice(index, 1);
    return this.emit("detach", socket);
  };

  Port.prototype.isConnected = function() {
    var connected;
    connected = false;
    this.sockets.forEach((function(_this) {
      return function(socket) {
        if (socket.isConnected()) {
          return connected = true;
        }
      };
    })(this));
    return connected;
  };

  Port.prototype.isAddressable = function() {
    return false;
  };

  Port.prototype.isRequired = function() {
    return this.required;
  };

  Port.prototype.isAttached = function() {
    if (this.sockets.length > 0) {
      return true;
    }
    return false;
  };

  Port.prototype.canAttach = function() {
    return true;
  };

  return Port;

})(EventEmitter);

exports.Port = Port;

});
require.register("noflo-noflo/src/lib/ArrayPort.js", function(exports, require, module){
var ArrayPort, port,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

port = require("./Port");

ArrayPort = (function(_super) {
  __extends(ArrayPort, _super);

  function ArrayPort(type) {
    this.type = type;
    ArrayPort.__super__.constructor.call(this, this.type);
  }

  ArrayPort.prototype.attach = function(socket) {
    this.sockets.push(socket);
    return this.attachSocket(socket, this.sockets.length - 1);
  };

  ArrayPort.prototype.connect = function(socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach(function(socket) {
        return socket.connect();
      });
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    return this.sockets[socketId].connect();
  };

  ArrayPort.prototype.beginGroup = function(group, socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach((function(_this) {
        return function(socket, index) {
          return _this.beginGroup(group, index);
        };
      })(this));
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    if (this.isConnected(socketId)) {
      return this.sockets[socketId].beginGroup(group);
    }
    this.sockets[socketId].once("connect", (function(_this) {
      return function() {
        return _this.sockets[socketId].beginGroup(group);
      };
    })(this));
    return this.sockets[socketId].connect();
  };

  ArrayPort.prototype.send = function(data, socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach((function(_this) {
        return function(socket, index) {
          return _this.send(data, index);
        };
      })(this));
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    if (this.isConnected(socketId)) {
      return this.sockets[socketId].send(data);
    }
    this.sockets[socketId].once("connect", (function(_this) {
      return function() {
        return _this.sockets[socketId].send(data);
      };
    })(this));
    return this.sockets[socketId].connect();
  };

  ArrayPort.prototype.endGroup = function(socketId) {
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      this.sockets.forEach((function(_this) {
        return function(socket, index) {
          return _this.endGroup(index);
        };
      })(this));
      return;
    }
    if (!this.sockets[socketId]) {
      throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
    }
    return this.sockets[socketId].endGroup();
  };

  ArrayPort.prototype.disconnect = function(socketId) {
    var socket, _i, _len, _ref;
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      if (!this.sockets.length) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      _ref = this.sockets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        socket.disconnect();
      }
      return;
    }
    if (!this.sockets[socketId]) {
      return;
    }
    return this.sockets[socketId].disconnect();
  };

  ArrayPort.prototype.isConnected = function(socketId) {
    var connected;
    if (socketId == null) {
      socketId = null;
    }
    if (socketId === null) {
      connected = false;
      this.sockets.forEach((function(_this) {
        return function(socket) {
          if (socket.isConnected()) {
            return connected = true;
          }
        };
      })(this));
      return connected;
    }
    if (!this.sockets[socketId]) {
      return false;
    }
    return this.sockets[socketId].isConnected();
  };

  ArrayPort.prototype.isAddressable = function() {
    return true;
  };

  ArrayPort.prototype.isAttached = function(socketId) {
    if (socketId === void 0) {
      if (this.sockets.length > 0) {
        return true;
      }
      return false;
    }
    if (this.sockets[socketId]) {
      return true;
    }
    return false;
  };

  return ArrayPort;

})(port.Port);

exports.ArrayPort = ArrayPort;

});
require.register("noflo-noflo/src/lib/Component.js", function(exports, require, module){
var Component, EventEmitter, ports,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (!require('./Platform').isBrowser()) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

ports = require('./Ports');

Component = (function(_super) {
  __extends(Component, _super);

  Component.prototype.description = '';

  Component.prototype.icon = null;

  function Component(options) {
    this.error = __bind(this.error, this);
    if (!options) {
      options = {};
    }
    if (!options.inPorts) {
      options.inPorts = {};
    }
    if (options.inPorts instanceof ports.InPorts) {
      this.inPorts = options.inPorts;
    } else {
      this.inPorts = new ports.InPorts(options.inPorts);
    }
    if (!options.outPorts) {
      options.outPorts = {};
    }
    if (options.outPorts instanceof ports.OutPorts) {
      this.outPorts = options.outPorts;
    } else {
      this.outPorts = new ports.OutPorts(options.outPorts);
    }
  }

  Component.prototype.getDescription = function() {
    return this.description;
  };

  Component.prototype.isReady = function() {
    return true;
  };

  Component.prototype.isSubgraph = function() {
    return false;
  };

  Component.prototype.setIcon = function(icon) {
    this.icon = icon;
    return this.emit('icon', this.icon);
  };

  Component.prototype.getIcon = function() {
    return this.icon;
  };

  Component.prototype.error = function(e) {
    if (this.outPorts.error && this.outPorts.error.isAttached()) {
      this.outPorts.error.send(e);
      this.outPorts.error.disconnect();
      return;
    }
    throw e;
  };

  Component.prototype.shutdown = function() {};

  return Component;

})(EventEmitter);

exports.Component = Component;

});
require.register("noflo-noflo/src/lib/AsyncComponent.js", function(exports, require, module){
var AsyncComponent, component, port,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

port = require("./Port");

component = require("./Component");

AsyncComponent = (function(_super) {
  __extends(AsyncComponent, _super);

  function AsyncComponent(inPortName, outPortName, errPortName) {
    this.inPortName = inPortName != null ? inPortName : "in";
    this.outPortName = outPortName != null ? outPortName : "out";
    this.errPortName = errPortName != null ? errPortName : "error";
    if (!this.inPorts[this.inPortName]) {
      throw new Error("no inPort named '" + this.inPortName + "'");
    }
    if (!this.outPorts[this.outPortName]) {
      throw new Error("no outPort named '" + this.outPortName + "'");
    }
    this.load = 0;
    this.q = [];
    this.outPorts.load = new port.Port();
    this.inPorts[this.inPortName].on("begingroup", (function(_this) {
      return function(group) {
        if (_this.load > 0) {
          return _this.q.push({
            name: "begingroup",
            data: group
          });
        }
        return _this.outPorts[_this.outPortName].beginGroup(group);
      };
    })(this));
    this.inPorts[this.inPortName].on("endgroup", (function(_this) {
      return function() {
        if (_this.load > 0) {
          return _this.q.push({
            name: "endgroup"
          });
        }
        return _this.outPorts[_this.outPortName].endGroup();
      };
    })(this));
    this.inPorts[this.inPortName].on("disconnect", (function(_this) {
      return function() {
        if (_this.load > 0) {
          return _this.q.push({
            name: "disconnect"
          });
        }
        _this.outPorts[_this.outPortName].disconnect();
        if (_this.outPorts.load.isAttached()) {
          return _this.outPorts.load.disconnect();
        }
      };
    })(this));
    this.inPorts[this.inPortName].on("data", (function(_this) {
      return function(data) {
        if (_this.q.length > 0) {
          return _this.q.push({
            name: "data",
            data: data
          });
        }
        return _this.processData(data);
      };
    })(this));
  }

  AsyncComponent.prototype.processData = function(data) {
    this.incrementLoad();
    return this.doAsync(data, (function(_this) {
      return function(err) {
        if (err) {
          if (_this.outPorts[_this.errPortName] && _this.outPorts[_this.errPortName].isAttached()) {
            _this.outPorts[_this.errPortName].send(err);
            _this.outPorts[_this.errPortName].disconnect();
          } else {
            throw err;
          }
        }
        return _this.decrementLoad();
      };
    })(this));
  };

  AsyncComponent.prototype.incrementLoad = function() {
    this.load++;
    if (this.outPorts.load.isAttached()) {
      this.outPorts.load.send(this.load);
    }
    if (this.outPorts.load.isAttached()) {
      return this.outPorts.load.disconnect();
    }
  };

  AsyncComponent.prototype.doAsync = function(data, callback) {
    return callback(new Error("AsyncComponents must implement doAsync"));
  };

  AsyncComponent.prototype.decrementLoad = function() {
    if (this.load === 0) {
      throw new Error("load cannot be negative");
    }
    this.load--;
    if (this.outPorts.load.isAttached()) {
      this.outPorts.load.send(this.load);
    }
    if (this.outPorts.load.isAttached()) {
      this.outPorts.load.disconnect();
    }
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return process.nextTick((function(_this) {
        return function() {
          return _this.processQueue();
        };
      })(this));
    } else {
      return setTimeout((function(_this) {
        return function() {
          return _this.processQueue();
        };
      })(this), 0);
    }
  };

  AsyncComponent.prototype.processQueue = function() {
    var event, processedData;
    if (this.load > 0) {
      return;
    }
    processedData = false;
    while (this.q.length > 0) {
      event = this.q[0];
      switch (event.name) {
        case "begingroup":
          if (processedData) {
            return;
          }
          this.outPorts[this.outPortName].beginGroup(event.data);
          this.q.shift();
          break;
        case "endgroup":
          if (processedData) {
            return;
          }
          this.outPorts[this.outPortName].endGroup();
          this.q.shift();
          break;
        case "disconnect":
          if (processedData) {
            return;
          }
          this.outPorts[this.outPortName].disconnect();
          if (this.outPorts.load.isAttached()) {
            this.outPorts.load.disconnect();
          }
          this.q.shift();
          break;
        case "data":
          this.processData(event.data);
          this.q.shift();
          processedData = true;
      }
    }
  };

  return AsyncComponent;

})(component.Component);

exports.AsyncComponent = AsyncComponent;

});
require.register("noflo-noflo/src/lib/LoggingComponent.js", function(exports, require, module){
var Component, Port, util,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Component = require("./Component").Component;

Port = require("./Port").Port;

if (!require('./Platform').isBrowser()) {
  util = require("util");
} else {
  util = {
    inspect: function(data) {
      return data;
    }
  };
}

exports.LoggingComponent = (function(_super) {
  __extends(LoggingComponent, _super);

  function LoggingComponent() {
    this.sendLog = __bind(this.sendLog, this);
    this.outPorts = {
      log: new Port()
    };
  }

  LoggingComponent.prototype.sendLog = function(message) {
    if (typeof message === "object") {
      message.when = new Date;
      message.source = this.constructor.name;
      if (this.nodeId != null) {
        message.nodeID = this.nodeId;
      }
    }
    if ((this.outPorts.log != null) && this.outPorts.log.isAttached()) {
      return this.outPorts.log.send(message);
    } else {
      return console.log(util.inspect(message, 4, true, true));
    }
  };

  return LoggingComponent;

})(Component);

});
require.register("noflo-noflo/src/lib/ComponentLoader.js", function(exports, require, module){
var ComponentLoader, internalSocket, nofloGraph;

internalSocket = require('./InternalSocket');

nofloGraph = require('./Graph');

ComponentLoader = (function() {
  function ComponentLoader(baseDir) {
    this.baseDir = baseDir;
    this.components = null;
    this.checked = [];
    this.revalidate = false;
    this.libraryIcons = {};
  }

  ComponentLoader.prototype.getModulePrefix = function(name) {
    if (!name) {
      return '';
    }
    if (name === 'noflo') {
      return '';
    }
    return name.replace('noflo-', '');
  };

  ComponentLoader.prototype.getModuleComponents = function(moduleName) {
    var cPath, definition, dependency, e, loader, name, prefix, _ref, _ref1, _results;
    if (this.checked.indexOf(moduleName) !== -1) {
      return;
    }
    this.checked.push(moduleName);
    try {
      definition = require("/" + moduleName + "/component.json");
    } catch (_error) {
      e = _error;
      if (moduleName.substr(0, 1) === '/') {
        return this.getModuleComponents("noflo-" + (moduleName.substr(1)));
      }
      return;
    }
    for (dependency in definition.dependencies) {
      this.getModuleComponents(dependency.replace('/', '-'));
    }
    if (!definition.noflo) {
      return;
    }
    prefix = this.getModulePrefix(definition.name);
    if (definition.noflo.icon) {
      this.libraryIcons[prefix] = definition.noflo.icon;
    }
    if (moduleName[0] === '/') {
      moduleName = moduleName.substr(1);
    }
    if (definition.noflo.loader) {
      loader = require("/" + moduleName + "/" + definition.noflo.loader);
      loader(this);
    }
    if (definition.noflo.components) {
      _ref = definition.noflo.components;
      for (name in _ref) {
        cPath = _ref[name];
        if (cPath.indexOf('.coffee') !== -1) {
          cPath = cPath.replace('.coffee', '.js');
        }
        this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath);
      }
    }
    if (definition.noflo.graphs) {
      _ref1 = definition.noflo.graphs;
      _results = [];
      for (name in _ref1) {
        cPath = _ref1[name];
        _results.push(this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath));
      }
      return _results;
    }
  };

  ComponentLoader.prototype.listComponents = function(callback) {
    if (this.components !== null) {
      return callback(this.components);
    }
    this.components = {};
    this.getModuleComponents(this.baseDir);
    return callback(this.components);
  };

  ComponentLoader.prototype.load = function(name, callback, delayed, metadata) {
    var component, componentName, implementation, instance;
    if (!this.components) {
      this.listComponents((function(_this) {
        return function(components) {
          return _this.load(name, callback, delayed, metadata);
        };
      })(this));
      return;
    }
    component = this.components[name];
    if (!component) {
      for (componentName in this.components) {
        if (componentName.split('/')[1] === name) {
          component = this.components[componentName];
          break;
        }
      }
      if (!component) {
        throw new Error("Component " + name + " not available with base " + this.baseDir);
        return;
      }
    }
    if (this.isGraph(component)) {
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        process.nextTick((function(_this) {
          return function() {
            return _this.loadGraph(name, component, callback, delayed, metadata);
          };
        })(this));
      } else {
        setTimeout((function(_this) {
          return function() {
            return _this.loadGraph(name, component, callback, delayed, metadata);
          };
        })(this), 0);
      }
      return;
    }
    if (typeof component === 'function') {
      implementation = component;
      if (component.getComponent && typeof component.getComponent === 'function') {
        instance = component.getComponent(metadata);
      } else {
        instance = component(metadata);
      }
    } else if (typeof component === 'object' && typeof component.getComponent === 'function') {
      instance = component.getComponent(metadata);
    } else {
      implementation = require(component);
      if (implementation.getComponent && typeof implementation.getComponent === 'function') {
        instance = implementation.getComponent(metadata);
      } else {
        instance = implementation(metadata);
      }
    }
    if (name === 'Graph') {
      instance.baseDir = this.baseDir;
    }
    this.setIcon(name, instance);
    return callback(instance);
  };

  ComponentLoader.prototype.isGraph = function(cPath) {
    if (typeof cPath === 'object' && cPath instanceof nofloGraph.Graph) {
      return true;
    }
    if (typeof cPath !== 'string') {
      return false;
    }
    return cPath.indexOf('.fbp') !== -1 || cPath.indexOf('.json') !== -1;
  };

  ComponentLoader.prototype.loadGraph = function(name, component, callback, delayed, metadata) {
    var delaySocket, graph, graphImplementation, graphSocket;
    graphImplementation = require(this.components['Graph']);
    graphSocket = internalSocket.createSocket();
    graph = graphImplementation.getComponent(metadata);
    graph.loader = this;
    graph.baseDir = this.baseDir;
    if (delayed) {
      delaySocket = internalSocket.createSocket();
      graph.inPorts.start.attach(delaySocket);
    }
    graph.inPorts.graph.attach(graphSocket);
    graphSocket.send(component);
    graphSocket.disconnect();
    graph.inPorts.remove('graph');
    graph.inPorts.remove('start');
    this.setIcon(name, graph);
    return callback(graph);
  };

  ComponentLoader.prototype.setIcon = function(name, instance) {
    var componentName, library, _ref;
    if (!instance.getIcon || instance.getIcon()) {
      return;
    }
    _ref = name.split('/'), library = _ref[0], componentName = _ref[1];
    if (componentName && this.getLibraryIcon(library)) {
      instance.setIcon(this.getLibraryIcon(library));
      return;
    }
    if (instance.isSubgraph()) {
      instance.setIcon('sitemap');
      return;
    }
    instance.setIcon('square');
  };

  ComponentLoader.prototype.getLibraryIcon = function(prefix) {
    if (this.libraryIcons[prefix]) {
      return this.libraryIcons[prefix];
    }
    return null;
  };

  ComponentLoader.prototype.registerComponent = function(packageId, name, cPath, callback) {
    var fullName, prefix;
    prefix = this.getModulePrefix(packageId);
    fullName = "" + prefix + "/" + name;
    if (!packageId) {
      fullName = name;
    }
    this.components[fullName] = cPath;
    if (callback) {
      return callback();
    }
  };

  ComponentLoader.prototype.registerGraph = function(packageId, name, gPath, callback) {
    return this.registerComponent(packageId, name, gPath, callback);
  };

  ComponentLoader.prototype.clear = function() {
    this.components = null;
    this.checked = [];
    return this.revalidate = true;
  };

  return ComponentLoader;

})();

exports.ComponentLoader = ComponentLoader;

});
require.register("noflo-noflo/src/lib/NoFlo.js", function(exports, require, module){
var ports;

exports.graph = require('./Graph');

exports.Graph = exports.graph.Graph;

exports.journal = require('./Journal');

exports.Journal = exports.journal.Journal;

exports.Network = require('./Network').Network;

exports.isBrowser = require('./Platform').isBrowser;

if (!exports.isBrowser()) {
  exports.ComponentLoader = require('./nodejs/ComponentLoader').ComponentLoader;
} else {
  exports.ComponentLoader = require('./ComponentLoader').ComponentLoader;
}

exports.Component = require('./Component').Component;

exports.AsyncComponent = require('./AsyncComponent').AsyncComponent;

exports.LoggingComponent = require('./LoggingComponent').LoggingComponent;

ports = require('./Ports');

exports.InPorts = ports.InPorts;

exports.OutPorts = ports.OutPorts;

exports.InPort = require('./InPort');

exports.OutPort = require('./OutPort');

exports.Port = require('./Port').Port;

exports.ArrayPort = require('./ArrayPort').ArrayPort;

exports.internalSocket = require('./InternalSocket');

exports.createNetwork = function(graph, callback, delay) {
  var network, networkReady;
  network = new exports.Network(graph);
  networkReady = function(network) {
    if (callback != null) {
      callback(network);
    }
    return network.start();
  };
  if (graph.nodes.length === 0) {
    setTimeout(function() {
      return networkReady(network);
    }, 0);
    return network;
  }
  network.loader.listComponents(function() {
    if (delay) {
      if (callback != null) {
        callback(network);
      }
      return;
    }
    return network.connect(function() {
      return networkReady(network);
    });
  });
  return network;
};

exports.loadFile = function(file, callback) {
  return exports.graph.loadFile(file, function(net) {
    return exports.createNetwork(net, callback);
  });
};

exports.saveFile = function(graph, file, callback) {
  return exports.graph.save(file, function() {
    return callback(file);
  });
};

});
require.register("noflo-noflo/src/lib/Network.js", function(exports, require, module){
var EventEmitter, Network, componentLoader, graph, internalSocket, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("underscore");

internalSocket = require("./InternalSocket");

graph = require("./Graph");

if (!require('./Platform').isBrowser()) {
  componentLoader = require("./nodejs/ComponentLoader");
  EventEmitter = require('events').EventEmitter;
} else {
  componentLoader = require('./ComponentLoader');
  EventEmitter = require('emitter');
}

Network = (function(_super) {
  __extends(Network, _super);

  Network.prototype.processes = {};

  Network.prototype.connections = [];

  Network.prototype.initials = [];

  Network.prototype.graph = null;

  Network.prototype.startupDate = null;

  Network.prototype.portBuffer = {};

  function Network(graph) {
    this.processes = {};
    this.connections = [];
    this.initials = [];
    this.graph = graph;
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      this.baseDir = graph.baseDir || process.cwd();
    } else {
      this.baseDir = graph.baseDir || '/';
    }
    this.startupDate = new Date();
    if (graph.componentLoader) {
      this.loader = graph.componentLoader;
    } else {
      this.loader = new componentLoader.ComponentLoader(this.baseDir);
    }
  }

  Network.prototype.uptime = function() {
    return new Date() - this.startupDate;
  };

  Network.prototype.connectionCount = 0;

  Network.prototype.increaseConnections = function() {
    if (this.connectionCount === 0) {
      this.emit('start', {
        start: this.startupDate
      });
    }
    return this.connectionCount++;
  };

  Network.prototype.decreaseConnections = function() {
    var ender;
    this.connectionCount--;
    if (this.connectionCount === 0) {
      ender = _.debounce((function(_this) {
        return function() {
          if (_this.connectionCount) {
            return;
          }
          return _this.emit('end', {
            start: _this.startupDate,
            end: new Date,
            uptime: _this.uptime()
          });
        };
      })(this), 10);
      return ender();
    }
  };

  Network.prototype.load = function(component, metadata, callback) {
    return this.loader.load(component, callback, false, metadata);
  };

  Network.prototype.addNode = function(node, callback) {
    var process;
    if (this.processes[node.id]) {
      if (callback) {
        callback(this.processes[node.id]);
      }
      return;
    }
    process = {
      id: node.id
    };
    if (!node.component) {
      this.processes[process.id] = process;
      if (callback) {
        callback(process);
      }
      return;
    }
    return this.load(node.component, node.metadata, (function(_this) {
      return function(instance) {
        var name, port, _ref, _ref1;
        instance.nodeId = node.id;
        process.component = instance;
        _ref = process.component.inPorts;
        for (name in _ref) {
          port = _ref[name];
          if (!port || typeof port === 'function' || !port.canAttach) {
            continue;
          }
          port.node = node.id;
          port.nodeInstance = instance;
          port.name = name;
        }
        _ref1 = process.component.outPorts;
        for (name in _ref1) {
          port = _ref1[name];
          if (!port || typeof port === 'function' || !port.canAttach) {
            continue;
          }
          port.node = node.id;
          port.nodeInstance = instance;
          port.name = name;
        }
        if (instance.isSubgraph()) {
          _this.subscribeSubgraph(process);
        }
        _this.subscribeNode(process);
        _this.processes[process.id] = process;
        if (callback) {
          return callback(process);
        }
      };
    })(this));
  };

  Network.prototype.removeNode = function(node, callback) {
    if (!this.processes[node.id]) {
      return;
    }
    this.processes[node.id].component.shutdown();
    delete this.processes[node.id];
    if (callback) {
      return callback();
    }
  };

  Network.prototype.renameNode = function(oldId, newId, callback) {
    var name, port, process, _ref, _ref1;
    process = this.getNode(oldId);
    if (!process) {
      return;
    }
    process.id = newId;
    _ref = process.component.inPorts;
    for (name in _ref) {
      port = _ref[name];
      port.node = newId;
    }
    _ref1 = process.component.outPorts;
    for (name in _ref1) {
      port = _ref1[name];
      port.node = newId;
    }
    this.processes[newId] = process;
    delete this.processes[oldId];
    if (callback) {
      return callback();
    }
  };

  Network.prototype.getNode = function(id) {
    return this.processes[id];
  };

  Network.prototype.connect = function(done) {
    var edges, initializers, nodes, serialize, subscribeGraph;
    if (done == null) {
      done = function() {};
    }
    serialize = (function(_this) {
      return function(next, add) {
        return function(type) {
          return _this["add" + type](add, function() {
            return next(type);
          });
        };
      };
    })(this);
    subscribeGraph = (function(_this) {
      return function() {
        _this.subscribeGraph();
        return done();
      };
    })(this);
    initializers = _.reduceRight(this.graph.initializers, serialize, subscribeGraph);
    edges = _.reduceRight(this.graph.edges, serialize, function() {
      return initializers("Initial");
    });
    nodes = _.reduceRight(this.graph.nodes, serialize, function() {
      return edges("Edge");
    });
    return nodes("Node");
  };

  Network.prototype.connectPort = function(socket, process, port, inbound) {
    if (inbound) {
      socket.to = {
        process: process,
        port: port
      };
      if (!(process.component.inPorts && process.component.inPorts[port])) {
        throw new Error("No inport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
        return;
      }
      return process.component.inPorts[port].attach(socket);
    }
    socket.from = {
      process: process,
      port: port
    };
    if (!(process.component.outPorts && process.component.outPorts[port])) {
      throw new Error("No outport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
      return;
    }
    return process.component.outPorts[port].attach(socket);
  };

  Network.prototype.subscribeGraph = function() {
    var graphOps, processOps, processing, registerOp;
    graphOps = [];
    processing = false;
    registerOp = function(op, details) {
      return graphOps.push({
        op: op,
        details: details
      });
    };
    processOps = (function(_this) {
      return function() {
        var cb, op;
        if (!graphOps.length) {
          processing = false;
          return;
        }
        processing = true;
        op = graphOps.shift();
        cb = processOps;
        switch (op.op) {
          case 'renameNode':
            return _this.renameNode(op.details.from, op.details.to, cb);
          default:
            return _this[op.op](op.details, cb);
        }
      };
    })(this);
    this.graph.on('addNode', (function(_this) {
      return function(node) {
        registerOp('addNode', node);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('removeNode', (function(_this) {
      return function(node) {
        registerOp('removeNode', node);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('renameNode', (function(_this) {
      return function(oldId, newId) {
        registerOp('renameNode', {
          from: oldId,
          to: newId
        });
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('addEdge', (function(_this) {
      return function(edge) {
        registerOp('addEdge', edge);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('removeEdge', (function(_this) {
      return function(edge) {
        registerOp('removeEdge', edge);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    this.graph.on('addInitial', (function(_this) {
      return function(iip) {
        registerOp('addInitial', iip);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
    return this.graph.on('removeInitial', (function(_this) {
      return function(iip) {
        registerOp('removeInitial', iip);
        if (!processing) {
          return processOps();
        }
      };
    })(this));
  };

  Network.prototype.subscribeSubgraph = function(node) {
    var emitSub;
    if (!node.component.isReady()) {
      node.component.once('ready', (function(_this) {
        return function() {
          _this.subscribeSubgraph(node);
        };
      })(this));
    }
    if (!node.component.network) {
      return;
    }
    emitSub = (function(_this) {
      return function(type, data) {
        if (type === 'connect') {
          _this.increaseConnections();
        }
        if (type === 'disconnect') {
          _this.decreaseConnections();
        }
        if (!data) {
          data = {};
        }
        if (data.subgraph) {
          data.subgraph = "" + node.id + ":" + data.subgraph;
        } else {
          data.subgraph = node.id;
        }
        return _this.emit(type, data);
      };
    })(this);
    node.component.network.on('connect', function(data) {
      return emitSub('connect', data);
    });
    node.component.network.on('begingroup', function(data) {
      return emitSub('begingroup', data);
    });
    node.component.network.on('data', function(data) {
      return emitSub('data', data);
    });
    node.component.network.on('endgroup', function(data) {
      return emitSub('endgroup', data);
    });
    return node.component.network.on('disconnect', function(data) {
      return emitSub('disconnect', data);
    });
  };

  Network.prototype.subscribeSocket = function(socket) {
    socket.on('connect', (function(_this) {
      return function() {
        _this.increaseConnections();
        return _this.emit('connect', {
          id: socket.getId(),
          socket: socket
        });
      };
    })(this));
    socket.on('begingroup', (function(_this) {
      return function(group) {
        return _this.emit('begingroup', {
          id: socket.getId(),
          socket: socket,
          group: group
        });
      };
    })(this));
    socket.on('data', (function(_this) {
      return function(data) {
        return _this.emit('data', {
          id: socket.getId(),
          socket: socket,
          data: data
        });
      };
    })(this));
    socket.on('endgroup', (function(_this) {
      return function(group) {
        return _this.emit('endgroup', {
          id: socket.getId(),
          socket: socket,
          group: group
        });
      };
    })(this));
    return socket.on('disconnect', (function(_this) {
      return function() {
        _this.decreaseConnections();
        return _this.emit('disconnect', {
          id: socket.getId(),
          socket: socket
        });
      };
    })(this));
  };

  Network.prototype.subscribeNode = function(node) {
    if (!node.component.getIcon) {
      return;
    }
    return node.component.on('icon', (function(_this) {
      return function() {
        return _this.emit('icon', {
          id: node.id,
          icon: node.component.getIcon()
        });
      };
    })(this));
  };

  Network.prototype.addEdge = function(edge, callback) {
    var from, socket, to;
    socket = internalSocket.createSocket();
    from = this.getNode(edge.from.node);
    if (!from) {
      throw new Error("No process defined for outbound node " + edge.from.node);
    }
    if (!from.component) {
      throw new Error("No component defined for outbound node " + edge.from.node);
    }
    if (!from.component.isReady()) {
      from.component.once("ready", (function(_this) {
        return function() {
          return _this.addEdge(edge, callback);
        };
      })(this));
      return;
    }
    to = this.getNode(edge.to.node);
    if (!to) {
      throw new Error("No process defined for inbound node " + edge.to.node);
    }
    if (!to.component) {
      throw new Error("No component defined for inbound node " + edge.to.node);
    }
    if (!to.component.isReady()) {
      to.component.once("ready", (function(_this) {
        return function() {
          return _this.addEdge(edge, callback);
        };
      })(this));
      return;
    }
    this.connectPort(socket, to, edge.to.port, true);
    this.connectPort(socket, from, edge.from.port, false);
    this.subscribeSocket(socket);
    this.connections.push(socket);
    if (callback) {
      return callback();
    }
  };

  Network.prototype.removeEdge = function(edge, callback) {
    var connection, _i, _len, _ref, _results;
    _ref = this.connections;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      if (!connection) {
        continue;
      }
      if (!(edge.to.node === connection.to.process.id && edge.to.port === connection.to.port)) {
        continue;
      }
      connection.to.process.component.inPorts[connection.to.port].detach(connection);
      if (edge.from.node) {
        if (connection.from && edge.from.node === connection.from.process.id && edge.from.port === connection.from.port) {
          connection.from.process.component.outPorts[connection.from.port].detach(connection);
        }
      }
      this.connections.splice(this.connections.indexOf(connection), 1);
      if (callback) {
        _results.push(callback());
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Network.prototype.addInitial = function(initializer, callback) {
    var socket, to;
    socket = internalSocket.createSocket();
    this.subscribeSocket(socket);
    to = this.getNode(initializer.to.node);
    if (!to) {
      throw new Error("No process defined for inbound node " + initializer.to.node);
    }
    if (!(to.component.isReady() || to.component.inPorts[initializer.to.port])) {
      to.component.setMaxListeners(0);
      to.component.once("ready", (function(_this) {
        return function() {
          return _this.addInitial(initializer, callback);
        };
      })(this));
      return;
    }
    this.connectPort(socket, to, initializer.to.port, true);
    this.connections.push(socket);
    this.initials.push({
      socket: socket,
      data: initializer.from.data
    });
    if (callback) {
      return callback();
    }
  };

  Network.prototype.removeInitial = function(initializer, callback) {
    var connection, _i, _len, _ref;
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      if (!connection) {
        continue;
      }
      if (!(initializer.to.node === connection.to.process.id && initializer.to.port === connection.to.port)) {
        continue;
      }
      connection.to.process.component.inPorts[connection.to.port].detach(connection);
      this.connections.splice(this.connections.indexOf(connection), 1);
    }
    if (callback) {
      return callback();
    }
  };

  Network.prototype.sendInitial = function(initial) {
    initial.socket.connect();
    initial.socket.send(initial.data);
    return initial.socket.disconnect();
  };

  Network.prototype.sendInitials = function() {
    var send;
    send = (function(_this) {
      return function() {
        var initial, _i, _len, _ref;
        _ref = _this.initials;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          initial = _ref[_i];
          _this.sendInitial(initial);
        }
        return _this.initials = [];
      };
    })(this);
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return process.nextTick(send);
    } else {
      return setTimeout(send, 0);
    }
  };

  Network.prototype.start = function() {
    return this.sendInitials();
  };

  Network.prototype.stop = function() {
    var connection, id, process, _i, _len, _ref, _ref1, _results;
    _ref = this.connections;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      connection = _ref[_i];
      if (!connection.isConnected()) {
        continue;
      }
      connection.disconnect();
    }
    _ref1 = this.processes;
    _results = [];
    for (id in _ref1) {
      process = _ref1[id];
      _results.push(process.component.shutdown());
    }
    return _results;
  };

  return Network;

})(EventEmitter);

exports.Network = Network;

});
require.register("noflo-noflo/src/lib/Platform.js", function(exports, require, module){
exports.isBrowser = function() {
  if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
    return false;
  }
  return true;
};

});
require.register("noflo-noflo/src/lib/Journal.js", function(exports, require, module){
var EventEmitter, Journal, JournalStore, MemoryJournalStore, calculateMeta, clone, entryToPrettyString,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  EventEmitter = require('events').EventEmitter;
} else {
  EventEmitter = require('emitter');
}

clone = require('./Utils').clone;

entryToPrettyString = function(entry) {
  var a;
  a = entry.args;
  switch (entry.cmd) {
    case 'addNode':
      return "" + a.id + "(" + a.component + ")";
    case 'removeNode':
      return "DEL " + a.id + "(" + a.component + ")";
    case 'renameNode':
      return "RENAME " + a.oldId + " " + a.newId;
    case 'changeNode':
      return "META " + a.id;
    case 'addEdge':
      return "" + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
    case 'removeEdge':
      return "" + a.from.node + " " + a.from.port + " -X> " + a.to.port + " " + a.to.node;
    case 'changeEdge':
      return "META " + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
    case 'addInitial':
      return "'" + a.from.data + "' -> " + a.to.port + " " + a.to.node;
    case 'removeInitial':
      return "'" + a.from.data + "' -X> " + a.to.port + " " + a.to.node;
    case 'startTransaction':
      return ">>> " + entry.rev + ": " + a.id;
    case 'endTransaction':
      return "<<< " + entry.rev + ": " + a.id;
    case 'changeProperties':
      return "PROPERTIES";
    case 'addGroup':
      return "GROUP " + a.name;
    case 'renameGroup':
      return "RENAME GROUP " + a.oldName + " " + a.newName;
    case 'removeGroup':
      return "DEL GROUP " + a.name;
    case 'changeGroup':
      return "META GROUP " + a.name;
    case 'addInport':
      return "INPORT " + a.name;
    case 'removeInport':
      return "DEL INPORT " + a.name;
    case 'renameInport':
      return "RENAME INPORT " + a.oldId + " " + a.newId;
    case 'changeInport':
      return "META INPORT " + a.name;
    case 'addOutport':
      return "OUTPORT " + a.name;
    case 'removeOutport':
      return "DEL OUTPORT " + a.name;
    case 'renameOutport':
      return "RENAME OUTPORT " + a.oldId + " " + a.newId;
    case 'changeOutport':
      return "META OUTPORT " + a.name;
    default:
      throw new Error("Unknown journal entry: " + entry.cmd);
  }
};

calculateMeta = function(oldMeta, newMeta) {
  var k, setMeta, v;
  setMeta = {};
  for (k in oldMeta) {
    v = oldMeta[k];
    setMeta[k] = null;
  }
  for (k in newMeta) {
    v = newMeta[k];
    setMeta[k] = v;
  }
  return setMeta;
};

JournalStore = (function(_super) {
  __extends(JournalStore, _super);

  JournalStore.prototype.lastRevision = 0;

  function JournalStore(graph) {
    this.graph = graph;
    this.lastRevision = 0;
  }

  JournalStore.prototype.putTransaction = function(revId, entries) {
    if (revId > this.lastRevision) {
      this.lastRevision = revId;
    }
    return this.emit('transaction', revId);
  };

  JournalStore.prototype.fetchTransaction = function(revId, entries) {};

  return JournalStore;

})(EventEmitter);

MemoryJournalStore = (function(_super) {
  __extends(MemoryJournalStore, _super);

  function MemoryJournalStore(graph) {
    MemoryJournalStore.__super__.constructor.call(this, graph);
    this.transactions = [];
  }

  MemoryJournalStore.prototype.putTransaction = function(revId, entries) {
    MemoryJournalStore.__super__.putTransaction.call(this, revId, entries);
    return this.transactions[revId] = entries;
  };

  MemoryJournalStore.prototype.fetchTransaction = function(revId) {
    return this.transactions[revId];
  };

  return MemoryJournalStore;

})(JournalStore);

Journal = (function(_super) {
  __extends(Journal, _super);

  Journal.prototype.graph = null;

  Journal.prototype.entries = [];

  Journal.prototype.subscribed = true;

  function Journal(graph, metadata, store) {
    this.endTransaction = __bind(this.endTransaction, this);
    this.startTransaction = __bind(this.startTransaction, this);
    var edge, group, iip, k, node, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    this.graph = graph;
    this.entries = [];
    this.subscribed = true;
    this.store = store || new MemoryJournalStore(this.graph);
    if (this.store.transactions.length === 0) {
      this.currentRevision = -1;
      this.startTransaction('initial', metadata);
      _ref = this.graph.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        this.appendCommand('addNode', node);
      }
      _ref1 = this.graph.edges;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        edge = _ref1[_j];
        this.appendCommand('addEdge', edge);
      }
      _ref2 = this.graph.initializers;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        iip = _ref2[_k];
        this.appendCommand('addInitial', iip);
      }
      if (Object.keys(this.graph.properties).length > 0) {
        this.appendCommand('changeProperties', this.graph.properties, {});
      }
      _ref3 = this.graph.inports;
      for (k in _ref3) {
        v = _ref3[k];
        this.appendCommand('addInport', {
          name: k,
          port: v
        });
      }
      _ref4 = this.graph.outports;
      for (k in _ref4) {
        v = _ref4[k];
        this.appendCommand('addOutport', {
          name: k,
          port: v
        });
      }
      _ref5 = this.graph.groups;
      for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
        group = _ref5[_l];
        this.appendCommand('addGroup', group);
      }
      this.endTransaction('initial', metadata);
    } else {
      this.currentRevision = this.store.lastRevision;
    }
    this.graph.on('addNode', (function(_this) {
      return function(node) {
        return _this.appendCommand('addNode', node);
      };
    })(this));
    this.graph.on('removeNode', (function(_this) {
      return function(node) {
        return _this.appendCommand('removeNode', node);
      };
    })(this));
    this.graph.on('renameNode', (function(_this) {
      return function(oldId, newId) {
        var args;
        args = {
          oldId: oldId,
          newId: newId
        };
        return _this.appendCommand('renameNode', args);
      };
    })(this));
    this.graph.on('changeNode', (function(_this) {
      return function(node, oldMeta) {
        return _this.appendCommand('changeNode', {
          id: node.id,
          "new": node.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addEdge', (function(_this) {
      return function(edge) {
        return _this.appendCommand('addEdge', edge);
      };
    })(this));
    this.graph.on('removeEdge', (function(_this) {
      return function(edge) {
        return _this.appendCommand('removeEdge', edge);
      };
    })(this));
    this.graph.on('changeEdge', (function(_this) {
      return function(edge, oldMeta) {
        return _this.appendCommand('changeEdge', {
          from: edge.from,
          to: edge.to,
          "new": edge.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addInitial', (function(_this) {
      return function(iip) {
        return _this.appendCommand('addInitial', iip);
      };
    })(this));
    this.graph.on('removeInitial', (function(_this) {
      return function(iip) {
        return _this.appendCommand('removeInitial', iip);
      };
    })(this));
    this.graph.on('changeProperties', (function(_this) {
      return function(newProps, oldProps) {
        return _this.appendCommand('changeProperties', {
          "new": newProps,
          old: oldProps
        });
      };
    })(this));
    this.graph.on('addGroup', (function(_this) {
      return function(group) {
        return _this.appendCommand('addGroup', group);
      };
    })(this));
    this.graph.on('renameGroup', (function(_this) {
      return function(oldName, newName) {
        return _this.appendCommand('renameGroup', {
          oldName: oldName,
          newName: newName
        });
      };
    })(this));
    this.graph.on('removeGroup', (function(_this) {
      return function(group) {
        return _this.appendCommand('removeGroup', group);
      };
    })(this));
    this.graph.on('changeGroup', (function(_this) {
      return function(group, oldMeta) {
        return _this.appendCommand('changeGroup', {
          name: group.name,
          "new": group.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addExport', (function(_this) {
      return function(exported) {
        return _this.appendCommand('addExport', exported);
      };
    })(this));
    this.graph.on('removeExport', (function(_this) {
      return function(exported) {
        return _this.appendCommand('removeExport', exported);
      };
    })(this));
    this.graph.on('addInport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('addInport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('removeInport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('removeInport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('renameInport', (function(_this) {
      return function(oldId, newId) {
        return _this.appendCommand('renameInport', {
          oldId: oldId,
          newId: newId
        });
      };
    })(this));
    this.graph.on('changeInport', (function(_this) {
      return function(name, port, oldMeta) {
        return _this.appendCommand('changeInport', {
          name: name,
          "new": port.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('addOutport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('addOutport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('removeOutport', (function(_this) {
      return function(name, port) {
        return _this.appendCommand('removeOutport', {
          name: name,
          port: port
        });
      };
    })(this));
    this.graph.on('renameOutport', (function(_this) {
      return function(oldId, newId) {
        return _this.appendCommand('renameOutport', {
          oldId: oldId,
          newId: newId
        });
      };
    })(this));
    this.graph.on('changeOutport', (function(_this) {
      return function(name, port, oldMeta) {
        return _this.appendCommand('changeOutport', {
          name: name,
          "new": port.metadata,
          old: oldMeta
        });
      };
    })(this));
    this.graph.on('startTransaction', (function(_this) {
      return function(id, meta) {
        return _this.startTransaction(id, meta);
      };
    })(this));
    this.graph.on('endTransaction', (function(_this) {
      return function(id, meta) {
        return _this.endTransaction(id, meta);
      };
    })(this));
  }

  Journal.prototype.startTransaction = function(id, meta) {
    if (!this.subscribed) {
      return;
    }
    if (this.entries.length > 0) {
      throw Error("Inconsistent @entries");
    }
    this.currentRevision++;
    return this.appendCommand('startTransaction', {
      id: id,
      metadata: meta
    }, this.currentRevision);
  };

  Journal.prototype.endTransaction = function(id, meta) {
    if (!this.subscribed) {
      return;
    }
    this.appendCommand('endTransaction', {
      id: id,
      metadata: meta
    }, this.currentRevision);
    this.store.putTransaction(this.currentRevision, this.entries);
    return this.entries = [];
  };

  Journal.prototype.appendCommand = function(cmd, args, rev) {
    var entry;
    if (!this.subscribed) {
      return;
    }
    entry = {
      cmd: cmd,
      args: clone(args)
    };
    if (rev != null) {
      entry.rev = rev;
    }
    return this.entries.push(entry);
  };

  Journal.prototype.executeEntry = function(entry) {
    var a;
    a = entry.args;
    switch (entry.cmd) {
      case 'addNode':
        return this.graph.addNode(a.id, a.component);
      case 'removeNode':
        return this.graph.removeNode(a.id);
      case 'renameNode':
        return this.graph.renameNode(a.oldId, a.newId);
      case 'changeNode':
        return this.graph.setNodeMetadata(a.id, calculateMeta(a.old, a["new"]));
      case 'addEdge':
        return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'removeEdge':
        return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'changeEdge':
        return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a.old, a["new"]));
      case 'addInitial':
        return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
      case 'removeInitial':
        return this.graph.removeInitial(a.to.node, a.to.port);
      case 'startTransaction':
        return null;
      case 'endTransaction':
        return null;
      case 'changeProperties':
        return this.graph.setProperties(a["new"]);
      case 'addGroup':
        return this.graph.addGroup(a.name, a.nodes, a.metadata);
      case 'renameGroup':
        return this.graph.renameGroup(a.oldName, a.newName);
      case 'removeGroup':
        return this.graph.removeGroup(a.name);
      case 'changeGroup':
        return this.graph.setGroupMetadata(a.name, calculateMeta(a.old, a["new"]));
      case 'addInport':
        return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
      case 'removeInport':
        return this.graph.removeInport(a.name);
      case 'renameInport':
        return this.graph.renameInport(a.oldId, a.newId);
      case 'changeInport':
        return this.graph.setInportMetadata(a.port, calculateMeta(a.old, a["new"]));
      case 'addOutport':
        return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata(a.name));
      case 'removeOutport':
        return this.graph.removeOutport;
      case 'renameOutport':
        return this.graph.renameOutport(a.oldId, a.newId);
      case 'changeOutport':
        return this.graph.setOutportMetadata(a.port, calculateMeta(a.old, a["new"]));
      default:
        throw new Error("Unknown journal entry: " + entry.cmd);
    }
  };

  Journal.prototype.executeEntryInversed = function(entry) {
    var a;
    a = entry.args;
    switch (entry.cmd) {
      case 'addNode':
        return this.graph.removeNode(a.id);
      case 'removeNode':
        return this.graph.addNode(a.id, a.component);
      case 'renameNode':
        return this.graph.renameNode(a.newId, a.oldId);
      case 'changeNode':
        return this.graph.setNodeMetadata(a.id, calculateMeta(a["new"], a.old));
      case 'addEdge':
        return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'removeEdge':
        return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
      case 'changeEdge':
        return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a["new"], a.old));
      case 'addInitial':
        return this.graph.removeInitial(a.to.node, a.to.port);
      case 'removeInitial':
        return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
      case 'startTransaction':
        return null;
      case 'endTransaction':
        return null;
      case 'changeProperties':
        return this.graph.setProperties(a.old);
      case 'addGroup':
        return this.graph.removeGroup(a.name);
      case 'renameGroup':
        return this.graph.renameGroup(a.newName, a.oldName);
      case 'removeGroup':
        return this.graph.addGroup(a.name, a.nodes, a.metadata);
      case 'changeGroup':
        return this.graph.setGroupMetadata(a.name, calculateMeta(a["new"], a.old));
      case 'addInport':
        return this.graph.removeInport(a.name);
      case 'removeInport':
        return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
      case 'renameInport':
        return this.graph.renameInport(a.newId, a.oldId);
      case 'changeInport':
        return this.graph.setInportMetadata(a.port, calculateMeta(a["new"], a.old));
      case 'addOutport':
        return this.graph.removeOutport(a.name);
      case 'removeOutport':
        return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata);
      case 'renameOutport':
        return this.graph.renameOutport(a.newId, a.oldId);
      case 'changeOutport':
        return this.graph.setOutportMetadata(a.port, calculateMeta(a["new"], a.old));
      default:
        throw new Error("Unknown journal entry: " + entry.cmd);
    }
  };

  Journal.prototype.moveToRevision = function(revId) {
    var entries, entry, i, r, _i, _j, _k, _l, _len, _ref, _ref1, _ref2, _ref3, _ref4;
    if (revId === this.currentRevision) {
      return;
    }
    this.subscribed = false;
    if (revId > this.currentRevision) {
      for (r = _i = _ref = this.currentRevision + 1; _ref <= revId ? _i <= revId : _i >= revId; r = _ref <= revId ? ++_i : --_i) {
        _ref1 = this.store.fetchTransaction(r);
        for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
          entry = _ref1[_j];
          this.executeEntry(entry);
        }
      }
    } else {
      for (r = _k = _ref2 = this.currentRevision, _ref3 = revId + 1; _k >= _ref3; r = _k += -1) {
        entries = this.store.fetchTransaction(r);
        for (i = _l = _ref4 = entries.length - 1; _l >= 0; i = _l += -1) {
          this.executeEntryInversed(entries[i]);
        }
      }
    }
    this.currentRevision = revId;
    return this.subscribed = true;
  };

  Journal.prototype.undo = function() {
    if (!this.canUndo()) {
      return;
    }
    return this.moveToRevision(this.currentRevision - 1);
  };

  Journal.prototype.canUndo = function() {
    return this.currentRevision > 0;
  };

  Journal.prototype.redo = function() {
    if (!this.canRedo()) {
      return;
    }
    return this.moveToRevision(this.currentRevision + 1);
  };

  Journal.prototype.canRedo = function() {
    return this.currentRevision < this.store.lastRevision;
  };

  Journal.prototype.toPrettyString = function(startRev, endRev) {
    var e, entry, lines, r, _i, _j, _len;
    startRev |= 0;
    endRev |= this.store.lastRevision;
    lines = [];
    for (r = _i = startRev; startRev <= endRev ? _i < endRev : _i > endRev; r = startRev <= endRev ? ++_i : --_i) {
      e = this.store.fetchTransaction(r);
      for (_j = 0, _len = e.length; _j < _len; _j++) {
        entry = e[_j];
        lines.push(entryToPrettyString(entry));
      }
    }
    return lines.join('\n');
  };

  Journal.prototype.toJSON = function(startRev, endRev) {
    var entries, entry, r, _i, _j, _len, _ref;
    startRev |= 0;
    endRev |= this.store.lastRevision;
    entries = [];
    for (r = _i = startRev; _i < endRev; r = _i += 1) {
      _ref = this.store.fetchTransaction(r);
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        entry = _ref[_j];
        entries.push(entryToPrettyString(entry));
      }
    }
    return entries;
  };

  Journal.prototype.save = function(file, success) {
    var json;
    json = JSON.stringify(this.toJSON(), null, 4);
    return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
      if (err) {
        throw err;
      }
      return success(file);
    });
  };

  return Journal;

})(EventEmitter);

exports.Journal = Journal;

exports.JournalStore = JournalStore;

exports.MemoryJournalStore = MemoryJournalStore;

});
require.register("noflo-noflo/src/lib/Utils.js", function(exports, require, module){
var clone;

clone = function(obj) {
  var flags, key, newInstance;
  if ((obj == null) || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof RegExp) {
    flags = '';
    if (obj.global != null) {
      flags += 'g';
    }
    if (obj.ignoreCase != null) {
      flags += 'i';
    }
    if (obj.multiline != null) {
      flags += 'm';
    }
    if (obj.sticky != null) {
      flags += 'y';
    }
    return new RegExp(obj.source, flags);
  }
  newInstance = new obj.constructor();
  for (key in obj) {
    newInstance[key] = clone(obj[key]);
  }
  return newInstance;
};

exports.clone = clone;

});
require.register("noflo-noflo/src/components/Graph.js", function(exports, require, module){
var Graph, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
  noflo = require("../../lib/NoFlo");
} else {
  noflo = require('../lib/NoFlo');
}

Graph = (function(_super) {
  __extends(Graph, _super);

  function Graph(metadata) {
    this.metadata = metadata;
    this.network = null;
    this.ready = true;
    this.started = false;
    this.baseDir = null;
    this.loader = null;
    this.inPorts = new noflo.InPorts({
      graph: {
        datatype: 'all',
        description: 'NoFlo graph definition to be used with the subgraph component',
        required: true,
        immediate: true
      },
      start: {
        datatype: 'bang',
        description: 'if attached, the network will only be started when receiving a start message',
        required: false
      }
    });
    this.outPorts = new noflo.OutPorts;
    this.inPorts.on('graph', 'data', (function(_this) {
      return function(data) {
        return _this.setGraph(data);
      };
    })(this));
    this.inPorts.on('start', 'data', (function(_this) {
      return function() {
        return _this.start();
      };
    })(this));
  }

  Graph.prototype.setGraph = function(graph) {
    this.ready = false;
    if (typeof graph === 'object') {
      if (typeof graph.addNode === 'function') {
        return this.createNetwork(graph);
      }
      noflo.graph.loadJSON(graph, (function(_this) {
        return function(instance) {
          instance.baseDir = _this.baseDir;
          return _this.createNetwork(instance);
        };
      })(this));
      return;
    }
    if (graph.substr(0, 1) !== "/" && graph.substr(1, 1) !== ":" && process && process.cwd) {
      graph = "" + (process.cwd()) + "/" + graph;
    }
    return graph = noflo.graph.loadFile(graph, (function(_this) {
      return function(instance) {
        instance.baseDir = _this.baseDir;
        return _this.createNetwork(instance);
      };
    })(this));
  };

  Graph.prototype.createNetwork = function(graph) {
    this.description = graph.properties.description || '';
    graph.componentLoader = this.loader;
    return noflo.createNetwork(graph, (function(_this) {
      return function(network) {
        _this.network = network;
        _this.emit('network', _this.network);
        return _this.network.connect(function() {
          var name, notReady, process, _ref, _ref1;
          notReady = false;
          _ref = _this.network.processes;
          for (name in _ref) {
            process = _ref[name];
            if (!_this.checkComponent(name, process)) {
              notReady = true;
            }
          }
          if (!notReady) {
            _this.setToReady();
          }
          if (((_ref1 = _this.inPorts.start) != null ? _ref1.isAttached() : void 0) && !_this.started) {
            return;
          }
          return _this.start(graph);
        });
      };
    })(this), true);
  };

  Graph.prototype.start = function(graph) {
    this.started = true;
    if (!this.network) {
      return;
    }
    this.network.sendInitials();
    if (!graph) {
      return;
    }
    return graph.on('addInitial', (function(_this) {
      return function() {
        return _this.network.sendInitials();
      };
    })(this));
  };

  Graph.prototype.checkComponent = function(name, process) {
    if (!process.component.isReady()) {
      process.component.once("ready", (function(_this) {
        return function() {
          _this.checkComponent(name, process);
          return _this.setToReady();
        };
      })(this));
      return false;
    }
    this.findEdgePorts(name, process);
    return true;
  };

  Graph.prototype.isExportedInport = function(port, nodeName, portName) {
    var exported, priv, pub, _i, _len, _ref, _ref1;
    _ref = this.network.graph.inports;
    for (pub in _ref) {
      priv = _ref[pub];
      if (!(priv.process === nodeName && priv.port === portName)) {
        continue;
      }
      return pub;
    }
    _ref1 = this.network.graph.exports;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      exported = _ref1[_i];
      if (!(exported.process === nodeName && exported.port === portName)) {
        continue;
      }
      this.network.graph.checkTransactionStart();
      this.network.graph.removeExport(exported["public"]);
      this.network.graph.addInport(exported["public"], exported.process, exported.port, exported.metadata);
      this.network.graph.checkTransactionEnd();
      return exported["public"];
    }
    if (Object.keys(this.network.graph.inports).length > 0) {
      return false;
    }
    if (port.isAttached()) {
      return false;
    }
    return (nodeName + '.' + portName).toLowerCase();
  };

  Graph.prototype.isExportedOutport = function(port, nodeName, portName) {
    var exported, priv, pub, _i, _len, _ref, _ref1;
    _ref = this.network.graph.outports;
    for (pub in _ref) {
      priv = _ref[pub];
      if (!(priv.process === nodeName && priv.port === portName)) {
        continue;
      }
      return pub;
    }
    _ref1 = this.network.graph.exports;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      exported = _ref1[_i];
      if (!(exported.process === nodeName && exported.port === portName)) {
        continue;
      }
      this.network.graph.checkTransactionStart();
      this.network.graph.removeExport(exported["public"]);
      this.network.graph.addOutport(exported["public"], exported.process, exported.port, exported.metadata);
      this.network.graph.checkTransactionEnd();
      return exported["public"];
    }
    if (Object.keys(this.network.graph.outports).length > 0) {
      return false;
    }
    if (port.isAttached()) {
      return false;
    }
    return (nodeName + '.' + portName).toLowerCase();
  };

  Graph.prototype.setToReady = function() {
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      return process.nextTick((function(_this) {
        return function() {
          _this.ready = true;
          return _this.emit('ready');
        };
      })(this));
    } else {
      return setTimeout((function(_this) {
        return function() {
          _this.ready = true;
          return _this.emit('ready');
        };
      })(this), 0);
    }
  };

  Graph.prototype.findEdgePorts = function(name, process) {
    var port, portName, targetPortName, _ref, _ref1;
    _ref = process.component.inPorts;
    for (portName in _ref) {
      port = _ref[portName];
      if (!port || typeof port === 'function' || !port.canAttach) {
        continue;
      }
      targetPortName = this.isExportedInport(port, name, portName);
      if (targetPortName === false) {
        continue;
      }
      this.inPorts.add(targetPortName, port);
    }
    _ref1 = process.component.outPorts;
    for (portName in _ref1) {
      port = _ref1[portName];
      if (!port || typeof port === 'function' || !port.canAttach) {
        continue;
      }
      targetPortName = this.isExportedOutport(port, name, portName);
      if (targetPortName === false) {
        continue;
      }
      this.outPorts.add(targetPortName, port);
    }
    return true;
  };

  Graph.prototype.isReady = function() {
    return this.ready;
  };

  Graph.prototype.isSubgraph = function() {
    return true;
  };

  Graph.prototype.shutdown = function() {
    if (!this.network) {
      return;
    }
    return this.network.stop();
  };

  return Graph;

})(noflo.Component);

exports.getComponent = function(metadata) {
  return new Graph(metadata);
};

});
require.register("noflo-noflo-strings/index.js", function(exports, require, module){
/*
 * This file can be used for general library features that are exposed as CommonJS modules
 * that the components then utilize
 */

});
require.register("noflo-noflo-strings/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-strings","description":"String Utilities for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-strings","version":"0.0.1","keywords":[],"dependencies":{"noflo/noflo":"*","component/underscore":"*"},"scripts":["components/CompileString.coffee","components/Filter.coffee","components/SendString.coffee","components/SplitStr.coffee","components/StringTemplate.coffee","components/Replace.coffee","components/Jsonify.coffee","components/ParseJson.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"font","components":{"CompileString":"components/CompileString.coffee","Filter":"components/Filter.coffee","SendString":"components/SendString.coffee","SplitStr":"components/SplitStr.coffee","StringTemplate":"components/StringTemplate.coffee","Replace":"components/Replace.coffee","Jsonify":"components/Jsonify.coffee","ParseJson":"components/ParseJson.coffee"}}}');
});
require.register("noflo-noflo-strings/components/CompileString.js", function(exports, require, module){
var CompileString, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CompileString = (function(_super) {
  __extends(CompileString, _super);

  function CompileString() {
    this.delimiter = "\n";
    this.data = [];
    this.onGroupEnd = true;
    this.inPorts = {
      delimiter: new noflo.Port,
      "in": new noflo.ArrayPort,
      ongroup: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.delimiter.on('data', (function(_this) {
      return function(data) {
        return _this.delimiter = data;
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.data.push(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        if (_this.data.length && _this.onGroupEnd) {
          _this.outPorts.out.send(_this.data.join(_this.delimiter));
        }
        _this.outPorts.out.endGroup();
        return _this.data = [];
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        if (_this.data.length) {
          _this.outPorts.out.send(_this.data.join(_this.delimiter));
        }
        _this.data = [];
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.ongroup.on("data", (function(_this) {
      return function(data) {
        if (typeof data === 'string') {
          if (data.toLowerCase() === 'false') {
            _this.onGroupEnd = false;
            return;
          }
          _this.onGroupEnd = true;
          return;
        }
        return _this.onGroupEnd = data;
      };
    })(this));
  }

  return CompileString;

})(noflo.Component);

exports.getComponent = function() {
  return new CompileString;
};

});
require.register("noflo-noflo-strings/components/Filter.js", function(exports, require, module){
var Filter, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

Filter = (function(_super) {
  __extends(Filter, _super);

  Filter.prototype.description = "filters an IP which is a string using a regex";

  function Filter() {
    this.regex = null;
    this.inPorts = {
      "in": new noflo.Port('string'),
      pattern: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('string'),
      missed: new noflo.Port('string')
    };
    this.inPorts.pattern.on("data", (function(_this) {
      return function(data) {
        return _this.regex = new RegExp(data);
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        if (typeof data !== 'string') {
          data = data.toString();
        }
        if ((_this.regex != null) && ((data != null ? typeof data.match === "function" ? data.match(_this.regex) : void 0 : void 0) != null)) {
          _this.outPorts.out.send(data);
          return;
        }
        if (_this.outPorts.missed.isAttached()) {
          return _this.outPorts.missed.send(data);
        }
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        _this.outPorts.out.disconnect();
        if (_this.outPorts.missed.isAttached()) {
          return _this.outPorts.missed.disconnect();
        }
      };
    })(this));
  }

  return Filter;

})(noflo.Component);

exports.getComponent = function() {
  return new Filter;
};

});
require.register("noflo-noflo-strings/components/SendString.js", function(exports, require, module){
var SendString, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SendString = (function(_super) {
  __extends(SendString, _super);

  function SendString() {
    this.data = {
      string: null,
      group: []
    };
    this.groups = [];
    this.inPorts = {
      string: new noflo.Port('string'),
      "in": new noflo.Port('bang')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.string.on('data', (function(_this) {
      return function(data) {
        return _this.data.string = data;
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        _this.data.group = _this.groups.slice(0);
        return _this.sendString(_this.data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group) {
        return _this.groups.pop();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  SendString.prototype.sendString = function(data) {
    var group, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = data.group;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      this.outPorts.out.beginGroup(group);
    }
    this.outPorts.out.send(data.string);
    _ref1 = data.group;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      group = _ref1[_j];
      _results.push(this.outPorts.out.endGroup());
    }
    return _results;
  };

  return SendString;

})(noflo.Component);

exports.getComponent = function() {
  return new SendString;
};

});
require.register("noflo-noflo-strings/components/SplitStr.js", function(exports, require, module){
var SplitStr, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SplitStr = (function(_super) {
  __extends(SplitStr, _super);

  SplitStr.prototype.description = ' The SplitStr component receives a string in the in port, splits it by string specified in the delimiter port, and send each part as a separate packet to the out port';

  function SplitStr() {
    this.delimiterString = "\n";
    this.strings = [];
    this.groups = [];
    this.inPorts = {
      "in": new noflo.Port(),
      delimiter: new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.delimiter.on('data', (function(_this) {
      return function(data) {
        var first, last;
        first = data.substr(0, 1);
        last = data.substr(data.length - 1, 1);
        if (first === '/' && last === '/' && data.length > 1) {
          data = new RegExp(data.substr(1, data.length - 2));
        }
        return _this.delimiterString = data;
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.strings.push(data);
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function(data) {
        var group, _i, _j, _len, _len1, _ref, _ref1;
        if (_this.strings.length === 0) {
          return _this.outPorts.out.disconnect();
        }
        _ref = _this.groups;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _this.outPorts.out.beginGroup(group);
        }
        _this.strings.join(_this.delimiterString).split(_this.delimiterString).forEach(function(line) {
          return _this.outPorts.out.send(line);
        });
        _ref1 = _this.groups;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          group = _ref1[_j];
          _this.outPorts.out.endGroup();
        }
        _this.outPorts.out.disconnect();
        _this.strings = [];
        return _this.groups = [];
      };
    })(this));
  }

  return SplitStr;

})(noflo.Component);

exports.getComponent = function() {
  return new SplitStr();
};

});
require.register("noflo-noflo-strings/components/StringTemplate.js", function(exports, require, module){
var StringTemplate, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore');

StringTemplate = (function(_super) {
  __extends(StringTemplate, _super);

  function StringTemplate() {
    this.template = null;
    this.inPorts = {
      template: new noflo.Port('string'),
      "in": new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.template.on('data', (function(_this) {
      return function(data) {
        return _this.template = _.template(data);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(_this.template(data));
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return StringTemplate;

})(noflo.Component);

exports.getComponent = function() {
  return new StringTemplate;
};

});
require.register("noflo-noflo-strings/components/Replace.js", function(exports, require, module){
var Replace, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Replace = (function(_super) {
  __extends(Replace, _super);

  Replace.prototype.description = 'Given a fixed pattern and its replacement, replace all occurrences in the incoming template.';

  function Replace() {
    this.pattern = null;
    this.replacement = '';
    this.inPorts = {
      "in": new noflo.Port('string'),
      pattern: new noflo.Port('string'),
      replacement: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.pattern.on('data', (function(_this) {
      return function(data) {
        return _this.pattern = new RegExp(data, 'g');
      };
    })(this));
    this.inPorts.replacement.on('data', (function(_this) {
      return function(data) {
        return _this.replacement = data.replace('\\\\n', "\n");
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        var string;
        string = data;
        if (_this.pattern != null) {
          string = ("" + data).replace(_this.pattern, _this.replacement);
        }
        return _this.outPorts.out.send(string);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Replace;

})(noflo.Component);

exports.getComponent = function() {
  return new Replace;
};

});
require.register("noflo-noflo-strings/components/Jsonify.js", function(exports, require, module){
var Jsonify, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore');

Jsonify = (function(_super) {
  __extends(Jsonify, _super);

  Jsonify.prototype.description = "JSONify all incoming, unless a raw flag is set to exclude data packets that are pure strings";

  function Jsonify() {
    this.raw = false;
    this.inPorts = {
      "in": new noflo.Port('object'),
      raw: new noflo.Port('boolean')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.raw.on('data', (function(_this) {
      return function(raw) {
        return _this.raw = String(raw) === 'true';
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.raw && _.isString(data)) {
          _this.outPorts.out.send(data);
          return;
        }
        return _this.outPorts.out.send(JSON.stringify(data));
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Jsonify;

})(noflo.Component);

exports.getComponent = function() {
  return new Jsonify;
};

});
require.register("noflo-noflo-strings/components/ParseJson.js", function(exports, require, module){
var ParseJson, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

ParseJson = (function(_super) {
  __extends(ParseJson, _super);

  function ParseJson() {
    this["try"] = false;
    this.inPorts = {
      "in": new noflo.Port(),
      "try": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts["try"].on("data", (function(_this) {
      return function(data) {
        if (data === "true") {
          return _this["try"] = true;
        }
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var e;
        try {
          data = JSON.parse(data);
        } catch (_error) {
          e = _error;
          if (!_this["try"]) {
            data = JSON.parse(data);
          }
        }
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return ParseJson;

})(noflo.Component);

exports.getComponent = function() {
  return new ParseJson;
};

});
require.register("noflo-noflo-ajax/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-ajax.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-ajax/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-ajax","description":"AJAX components for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-ajax","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/Get.coffee","components/GetJsonP.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"globe","components":{"Get":"components/Get.coffee","GetJsonP":"components/GetJsonP.coffee"}}}');
});
require.register("noflo-noflo-ajax/components/Get.js", function(exports, require, module){
var Get, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Get = (function(_super) {
  __extends(Get, _super);

  function Get() {
    this.inPorts = {
      url: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('string'),
      error: new noflo.Port('object')
    };
    Get.__super__.constructor.call(this, 'url');
  }

  Get.prototype.doAsync = function(url, callback) {
    var req;
    req = new XMLHttpRequest;
    req.onreadystatechange = (function(_this) {
      return function() {
        if (req.readyState === 4) {
          if (req.status === 200) {
            _this.outPorts.out.beginGroup(url);
            _this.outPorts.out.send(req.responseText);
            _this.outPorts.out.endGroup();
            _this.outPorts.out.disconnect();
            return callback();
          } else {
            return callback(new Error("Error loading " + url));
          }
        }
      };
    })(this);
    req.open('GET', url, true);
    return req.send(null);
  };

  return Get;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new Get;
};

});
require.register("noflo-noflo-ajax/components/GetJsonP.js", function(exports, require, module){
var GetJsonP, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetJsonP = (function(_super) {
  __extends(GetJsonP, _super);

  function GetJsonP() {
    this.inPorts = {
      url: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    GetJsonP.__super__.constructor.call(this, 'url');
  }

  GetJsonP.prototype.doAsync = function(url, callback) {
    var body, id, s;
    id = 'noflo' + (Math.random() * 100).toString().replace(/\./g, '');
    body = document.querySelector('body');
    s = document.createElement('script');
    window[id] = (function(_this) {
      return function(data) {
        _this.outPorts.out.beginGroup(url);
        _this.outPorts.out.send(data);
        _this.outPorts.out.endGroup();
        _this.outPorts.out.disconnect();
        delete window[id];
        body.removeChild(s);
        return callback();
      };
    })(this);
    s.type = 'application/javascript';
    if (url.indexOf('?') === -1) {
      url = "" + url + "?callback=?";
    }
    s.src = url.replace('callback=?', "callback=" + id);
    return body.appendChild(s);
  };

  return GetJsonP;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new GetJsonP;
};

});
require.register("noflo-noflo-localstorage/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-localstorage.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-localstorage/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-localstorage","description":"LocalStorage components for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-localstorage","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/GetItem.coffee","components/ListenRemoteChanges.coffee","components/ListAdd.coffee","components/ListGet.coffee","components/ListRemove.coffee","components/RemoveItem.coffee","components/SetItem.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"html5","components":{"GetItem":"components/GetItem.coffee","ListenRemoteChanges":"components/ListenRemoteChanges.coffee","ListAdd":"components/ListAdd.coffee","ListGet":"components/ListGet.coffee","ListRemove":"components/ListRemove.coffee","RemoveItem":"components/RemoveItem.coffee","SetItem":"components/SetItem.coffee"}}}');
});
require.register("noflo-noflo-localstorage/components/GetItem.js", function(exports, require, module){
var GetItem, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetItem = (function(_super) {
  __extends(GetItem, _super);

  function GetItem() {
    this.inPorts = {
      key: new noflo.Port('string')
    };
    this.outPorts = {
      item: new noflo.Port('string'),
      error: new noflo.Port('object')
    };
    this.inPorts.key.on('data', (function(_this) {
      return function(data) {
        var value;
        value = localStorage.getItem(data);
        if (!value) {
          if (_this.outPorts.error.isAttached()) {
            _this.outPorts.error.send(new Error("" + data + " not found"));
            _this.outPorts.error.disconnect();
          }
          return;
        }
        _this.outPorts.item.beginGroup(data);
        _this.outPorts.item.send(value);
        return _this.outPorts.item.endGroup();
      };
    })(this));
    this.inPorts.key.on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.item.disconnect();
      };
    })(this));
  }

  return GetItem;

})(noflo.Component);

exports.getComponent = function() {
  return new GetItem;
};

});
require.register("noflo-noflo-localstorage/components/ListenRemoteChanges.js", function(exports, require, module){
var ListenChanges, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenChanges = (function(_super) {
  __extends(ListenChanges, _super);

  function ListenChanges() {
    var listener;
    this.listening = false;
    this.inPorts = {
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      changed: new noflo.Port('string'),
      removed: new noflo.Port('string')
    };
    listener = (function(_this) {
      return function(event) {
        if (event.newValue === null && _this.outPorts.removed.isAttached()) {
          _this.outPorts.removed.beginGroup(event.key);
          _this.outPorts.removed.send(null);
          _this.outPorts.removed.endGroup();
          return;
        }
        _this.outPorts.changed.beginGroup(event.key);
        _this.outPorts.changed.send(event.newValue);
        return _this.outPorts.changed.endGroup();
      };
    })(this);
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        if (_this.listening) {
          return;
        }
        window.addEventListener('storage', listener, false);
        return _this.listening = true;
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        if (!_this.listening) {
          return;
        }
        window.removeEventListener('storage', listener, false);
        _this.listening = false;
        _this.outPorts.changed.disconnect();
        return _this.outPorts.removed.disconnect();
      };
    })(this));
  }

  return ListenChanges;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenChanges;
};

});
require.register("noflo-noflo-localstorage/components/ListAdd.js", function(exports, require, module){
var ListAdd, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListAdd = (function(_super) {
  __extends(ListAdd, _super);

  function ListAdd() {
    this.listKey = null;
    this.key = null;
    this.inPorts = {
      list: new noflo.Port('string'),
      key: new noflo.Port('string')
    };
    this.outPorts = {
      key: new noflo.Port('string')
    };
    this.inPorts.list.on('data', (function(_this) {
      return function(listKey) {
        _this.listKey = listKey;
        return _this.add();
      };
    })(this));
    this.inPorts.key.on('data', (function(_this) {
      return function(key) {
        _this.key = key;
        return _this.add();
      };
    })(this));
  }

  ListAdd.prototype.add = function() {
    var items, list;
    if (!(this.listKey && this.key)) {
      return;
    }
    list = localStorage.getItem(this.listKey);
    if (list) {
      items = list.split(',');
    } else {
      items = [];
    }
    if (items.indexOf(this.key) === -1) {
      items.push(this.key);
      localStorage.setItem(this.listKey, items.join(','));
    }
    if (this.outPorts.key.isAttached()) {
      this.outPorts.key.send(this.key);
      this.outPorts.key.disconnect();
    }
    return this.key = null;
  };

  return ListAdd;

})(noflo.Component);

exports.getComponent = function() {
  return new ListAdd;
};

});
require.register("noflo-noflo-localstorage/components/ListGet.js", function(exports, require, module){
var ListGet, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListGet = (function(_super) {
  __extends(ListGet, _super);

  function ListGet() {
    this.inPorts = {
      key: new noflo.Port('string')
    };
    this.outPorts = {
      items: new noflo.Port('string'),
      error: new noflo.Port('object')
    };
    this.inPorts.key.on('data', (function(_this) {
      return function(data) {
        var val, vals, value, _i, _len;
        value = localStorage.getItem(data);
        if (!value) {
          if (_this.outPorts.error.isAttached()) {
            _this.outPorts.error.send(new Error("" + data + " not found"));
            _this.outPorts.error.disconnect();
          }
          return;
        }
        vals = value.split(',');
        _this.outPorts.items.beginGroup(data);
        for (_i = 0, _len = vals.length; _i < _len; _i++) {
          val = vals[_i];
          _this.outPorts.items.send(val);
        }
        return _this.outPorts.items.endGroup();
      };
    })(this));
    this.inPorts.key.on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.items.disconnect();
      };
    })(this));
  }

  return ListGet;

})(noflo.Component);

exports.getComponent = function() {
  return new ListGet;
};

});
require.register("noflo-noflo-localstorage/components/ListRemove.js", function(exports, require, module){
var ListRemove, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListRemove = (function(_super) {
  __extends(ListRemove, _super);

  function ListRemove() {
    this.listKey = null;
    this.key = null;
    this.inPorts = {
      list: new noflo.Port('string'),
      key: new noflo.Port('string')
    };
    this.outPorts = {
      key: new noflo.Port('string')
    };
    this.inPorts.list.on('data', (function(_this) {
      return function(listKey) {
        _this.listKey = listKey;
        return _this.remove();
      };
    })(this));
    this.inPorts.key.on('data', (function(_this) {
      return function(key) {
        _this.key = key;
        return _this.remove();
      };
    })(this));
  }

  ListRemove.prototype.remove = function() {
    var items, list;
    if (!(this.listKey && this.key)) {
      return;
    }
    list = localStorage.getItem(this.listKey);
    if (list) {
      items = list.split(',');
      if (items.indexOf(this.key) !== -1) {
        items.splice(items.indexOf(this.key), 1);
        localStorage.setItem(this.listKey, items.join(','));
      }
    }
    if (this.outPorts.key.isAttached()) {
      this.outPorts.key.send(this.key);
      this.outPorts.key.disconnect();
    }
    return this.key = null;
  };

  return ListRemove;

})(noflo.Component);

exports.getComponent = function() {
  return new ListRemove;
};

});
require.register("noflo-noflo-localstorage/components/RemoveItem.js", function(exports, require, module){
var RemoveItem, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

RemoveItem = (function(_super) {
  __extends(RemoveItem, _super);

  function RemoveItem() {
    this.inPorts = {
      key: new noflo.Port('string')
    };
    this.outPorts = {
      item: new noflo.Port('string')
    };
    this.inPorts.key.on('data', (function(_this) {
      return function(data) {
        localStorage.removeItem(data);
        _this.outPorts.item.beginGroup(data);
        _this.outPorts.item.send(null);
        _this.outPorts.item.endGroup();
        return _this.outPorts.item.disconnect();
      };
    })(this));
  }

  return RemoveItem;

})(noflo.Component);

exports.getComponent = function() {
  return new RemoveItem;
};

});
require.register("noflo-noflo-localstorage/components/SetItem.js", function(exports, require, module){
var SetItem, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SetItem = (function(_super) {
  __extends(SetItem, _super);

  function SetItem() {
    this.key = null;
    this.value = null;
    this.inPorts = {
      key: new noflo.Port('string'),
      value: new noflo.Port('string')
    };
    this.outPorts = {
      item: new noflo.Port('string')
    };
    this.inPorts.key.on('data', (function(_this) {
      return function(data) {
        if (!data) {
          return;
        }
        _this.key = data;
        if (_this.value) {
          return _this.setItem();
        }
      };
    })(this));
    this.inPorts.value.on('data', (function(_this) {
      return function(data) {
        _this.value = data;
        if (_this.key) {
          return _this.setItem();
        }
      };
    })(this));
  }

  SetItem.prototype.setItem = function() {
    localStorage.setItem(this.key, this.value);
    if (this.outPorts.item.isAttached()) {
      this.outPorts.item.beginGroup(this.key);
      this.outPorts.item.send(this.value);
      this.outPorts.item.endGroup();
      this.outPorts.item.disconnect();
    }
    this.key = null;
    return this.value = null;
  };

  return SetItem;

})(noflo.Component);

exports.getComponent = function() {
  return new SetItem;
};

});
require.register("noflo-noflo-interaction/index.js", function(exports, require, module){
/*
 * This file can be used for general library features that are exposed as CommonJS modules
 * that the components then utilize
 */

});
require.register("noflo-noflo-interaction/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-interaction","description":"User interaction components for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-interaction","version":"0.0.1","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/ListenChange.coffee","components/ListenDrag.coffee","components/ListenHash.coffee","components/ListenKeyboard.coffee","components/ListenKeyboardShortcuts.coffee","components/ListenMouse.coffee","components/ListenPointer.coffee","components/ListenResize.coffee","components/ListenScroll.coffee","components/ListenSpeech.coffee","components/ListenTouch.coffee","components/SetHash.coffee","components/ReadCoordinates.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"user","components":{"ListenChange":"components/ListenChange.coffee","ListenDrag":"components/ListenDrag.coffee","ListenHash":"components/ListenHash.coffee","ListenKeyboard":"components/ListenKeyboard.coffee","ListenKeyboardShortcuts":"components/ListenKeyboardShortcuts.coffee","ListenMouse":"components/ListenMouse.coffee","ListenPointer":"components/ListenPointer.coffee","ListenResize":"components/ListenResize.coffee","ListenScroll":"components/ListenScroll.coffee","ListenSpeech":"components/ListenSpeech.coffee","ListenTouch":"components/ListenTouch.coffee","ReadCoordinates":"components/ReadCoordinates.coffee","SetHash":"components/SetHash.coffee"}}}');
});
require.register("noflo-noflo-interaction/components/ListenChange.js", function(exports, require, module){
var ListenChange, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenChange = (function(_super) {
  __extends(ListenChange, _super);

  ListenChange.prototype.description = 'Listen to mouse events on a DOM element';

  function ListenChange() {
    this.change = __bind(this.change, this);
    this.inPorts = {
      element: new noflo.Port('object')
    };
    this.outPorts = {
      value: new noflo.ArrayPort('all')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        return _this.subscribe(element);
      };
    })(this));
  }

  ListenChange.prototype.subscribe = function(element) {
    return element.addEventListener('change', this.change, false);
  };

  ListenChange.prototype.change = function(event) {
    if (!this.outPorts.value.sockets.length) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.outPorts.value.send(event.target.value);
    return this.outPorts.value.disconnect();
  };

  return ListenChange;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenChange;
};

});
require.register("noflo-noflo-interaction/components/ListenDrag.js", function(exports, require, module){
var ListenDrag, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenDrag = (function(_super) {
  __extends(ListenDrag, _super);

  ListenDrag.prototype.description = 'Listen to drag events on a DOM element';

  function ListenDrag() {
    this.dragend = __bind(this.dragend, this);
    this.dragmove = __bind(this.dragmove, this);
    this.dragstart = __bind(this.dragstart, this);
    this.inPorts = {
      element: new noflo.Port('object')
    };
    this.outPorts = {
      start: new noflo.ArrayPort('object'),
      movex: new noflo.ArrayPort('number'),
      movey: new noflo.ArrayPort('number'),
      end: new noflo.ArrayPort('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        return _this.subscribe(element);
      };
    })(this));
  }

  ListenDrag.prototype.subscribe = function(element) {
    element.addEventListener('dragstart', this.dragstart, false);
    element.addEventListener('drag', this.dragmove, false);
    return element.addEventListener('dragend', this.dragend, false);
  };

  ListenDrag.prototype.dragstart = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.outPorts.start.send(event);
    return this.outPorts.start.disconnect();
  };

  ListenDrag.prototype.dragmove = function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.outPorts.movex.send(event.clientX);
    return this.outPorts.movey.send(event.clientY);
  };

  ListenDrag.prototype.dragend = function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.outPorts.movex.isConnected()) {
      this.outPorts.movex.disconnect();
    }
    if (this.outPorts.movey.isConnected()) {
      this.outPorts.movey.disconnect();
    }
    this.outPorts.end.send(event);
    return this.outPorts.end.disconnect();
  };

  return ListenDrag;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenDrag;
};

});
require.register("noflo-noflo-interaction/components/ListenHash.js", function(exports, require, module){
var ListenHash, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenHash = (function(_super) {
  __extends(ListenHash, _super);

  ListenHash.prototype.description = 'Listen for hash changes in browser\'s URL bar';

  function ListenHash() {
    this.hashChange = __bind(this.hashChange, this);
    this.inPorts = {
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      initial: new noflo.Port('string'),
      change: new noflo.Port('string')
    };
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        return _this.subscribe();
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        return _this.unsubscribe();
      };
    })(this));
  }

  ListenHash.prototype.subscribe = function() {
    var initialHash;
    window.addEventListener('hashchange', this.hashChange, false);
    if (this.outPorts.initial.isAttached()) {
      initialHash = window.location.hash.substr(1);
      this.outPorts.initial.send(initialHash);
      return this.outPorts.initial.disconnect();
    }
  };

  ListenHash.prototype.unsubscribe = function() {
    window.removeEventListener('hashchange', this.hashChange, false);
    return this.outPorts.change.disconnect();
  };

  ListenHash.prototype.hashChange = function(event) {
    var newHash, oldHash;
    oldHash = event.oldURL.split('#')[1];
    newHash = event.newURL.split('#')[1];
    if (!newHash) {
      newHash = '';
    }
    if (oldHash) {
      this.outPorts.change.beginGroup(oldHash);
    }
    this.outPorts.change.send(newHash);
    if (oldHash) {
      return this.outPorts.change.endGroup(oldHash);
    }
  };

  ListenHash.prototype.shutdown = function() {
    return this.unsubscribe();
  };

  return ListenHash;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenHash;
};

});
require.register("noflo-noflo-interaction/components/ListenKeyboard.js", function(exports, require, module){
var ListenKeyboard, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenKeyboard = (function(_super) {
  __extends(ListenKeyboard, _super);

  ListenKeyboard.prototype.description = 'Listen for key presses on a given DOM element';

  ListenKeyboard.prototype.icon = 'keyboard-o';

  function ListenKeyboard() {
    this.keypress = __bind(this.keypress, this);
    this.elements = [];
    this.inPorts = {
      element: new noflo.Port('object'),
      stop: new noflo.Port('object')
    };
    this.outPorts = {
      keypress: new noflo.Port('integer')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        return _this.subscribe(element);
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function(element) {
        return _this.unsubscribe(element);
      };
    })(this));
  }

  ListenKeyboard.prototype.subscribe = function(element) {
    element.addEventListener('keypress', this.keypress, false);
    return this.elements.push(element);
  };

  ListenKeyboard.prototype.unsubscribe = function(element) {
    if (-1 === this.elements.indexOf(element)) {
      return;
    }
    element.removeEventListener('keypress', this.keypress, false);
    return this.elements.splice(this.elements.indexOf(element), 1);
  };

  ListenKeyboard.prototype.keypress = function(event) {
    if (!this.outPorts.keypress.isAttached()) {
      return;
    }
    this.outPorts.keypress.send(event.keyCode);
    return this.outPorts.keypress.disconnect();
  };

  ListenKeyboard.prototype.shutdown = function() {
    var element, _i, _len, _ref, _results;
    _ref = this.elements;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      _results.push(this.unsubscribe(element));
    }
    return _results;
  };

  return ListenKeyboard;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenKeyboard;
};

});
require.register("noflo-noflo-interaction/components/ListenKeyboardShortcuts.js", function(exports, require, module){
var ListenKeyboardShortcuts, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenKeyboardShortcuts = (function(_super) {
  __extends(ListenKeyboardShortcuts, _super);

  ListenKeyboardShortcuts.prototype.description = 'Listen for keyboard shortcuts and route them';

  ListenKeyboardShortcuts.prototype.icon = 'keyboard-o';

  function ListenKeyboardShortcuts() {
    this.keypress = __bind(this.keypress, this);
    this.keys = [];
    this.ignoreInput = true;
    this.inPorts = {
      keys: new noflo.Port('string'),
      ignoreinput: new noflo.Port('boolean'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      shortcut: new noflo.ArrayPort('bang'),
      missed: new noflo.Port('integer')
    };
    this.inPorts.keys.on('data', (function(_this) {
      return function(data) {
        _this.keys = _this.normalizeKeys(data);
        return _this.subscribe();
      };
    })(this));
    this.inPorts.ignoreinput.on('data', (function(_this) {
      return function(data) {
        return _this.ignoreInput = String(data) === 'true';
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        return _this.unsubscribe();
      };
    })(this));
  }

  ListenKeyboardShortcuts.prototype.subscribe = function() {
    return document.addEventListener('keydown', this.keypress, false);
  };

  ListenKeyboardShortcuts.prototype.unsubscribe = function() {
    return document.removeEventListener('keydown', this.keypress, false);
  };

  ListenKeyboardShortcuts.prototype.normalizeKeys = function(data) {
    var index, key, keys, _i, _len;
    keys = data.split(',');
    for (index = _i = 0, _len = keys.length; _i < _len; index = ++_i) {
      key = keys[index];
      switch (key) {
        case '-':
          keys[index] = 189;
          break;
        case '=':
          keys[index] = 187;
          break;
        case '0':
          keys[index] = 48;
          break;
        case 'a':
          keys[index] = 65;
          break;
        case 'x':
          keys[index] = 88;
          break;
        case 'c':
          keys[index] = 67;
          break;
        case 'v':
          keys[index] = 86;
          break;
        case 'z':
          keys[index] = 90;
          break;
        case 'r':
          keys[index] = 82;
          break;
        case 's':
          keys[index] = 83;
      }
    }
    return keys;
  };

  ListenKeyboardShortcuts.prototype.validateTarget = function(event) {
    if (!this.ignoreInput) {
      return true;
    }
    if (event.target.tagName === 'TEXTAREA') {
      return false;
    }
    if (event.target.tagName === 'INPUT') {
      return false;
    }
    if (String(event.target.contentEditable) === 'true') {
      return false;
    }
    return true;
  };

  ListenKeyboardShortcuts.prototype.keypress = function(event) {
    var route;
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }
    if (!this.validateTarget(event)) {
      return;
    }
    route = this.keys.indexOf(event.keyCode);
    if (route === -1) {
      if (this.outPorts.missed.isAttached()) {
        this.outPorts.missed.send(event.keyCode);
        this.outPorts.missed.disconnect();
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.outPorts.shortcut.send(event.keyCode, route);
    return this.outPorts.shortcut.disconnect();
  };

  ListenKeyboardShortcuts.prototype.shutdown = function() {
    return this.unsubscribe();
  };

  return ListenKeyboardShortcuts;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenKeyboardShortcuts;
};

});
require.register("noflo-noflo-interaction/components/ListenMouse.js", function(exports, require, module){
var ListenMouse, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenMouse = (function(_super) {
  __extends(ListenMouse, _super);

  ListenMouse.prototype.description = 'Listen to mouse events on a DOM element';

  function ListenMouse() {
    this.dblclick = __bind(this.dblclick, this);
    this.click = __bind(this.click, this);
    this.inPorts = {
      element: new noflo.Port('object')
    };
    this.outPorts = {
      click: new noflo.ArrayPort('object'),
      dblclick: new noflo.ArrayPort('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        return _this.subscribe(element);
      };
    })(this));
  }

  ListenMouse.prototype.subscribe = function(element) {
    element.addEventListener('click', this.click, false);
    return element.addEventListener('dblclick', this.dblclick, false);
  };

  ListenMouse.prototype.click = function(event) {
    if (!this.outPorts.click.sockets.length) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.outPorts.click.send(event);
    this.outPorts.click.disconnect();
    return this.updateIcon();
  };

  ListenMouse.prototype.dblclick = function(event) {
    if (!this.outPorts.dblclick.sockets.length) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.outPorts.dblclick.send(event);
    this.outPorts.dblclick.disconnect();
    return this.updateIcon();
  };

  ListenMouse.prototype.updateIcon = function() {
    if (!this.setIcon) {
      return;
    }
    if (this.timeout) {
      return;
    }
    this.originalIcon = this.getIcon();
    this.setIcon('exclamation-circle');
    return this.timeout = setTimeout((function(_this) {
      return function() {
        _this.setIcon(_this.originalIcon);
        return _this.timeout = null;
      };
    })(this), 200);
  };

  return ListenMouse;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenMouse;
};

});
require.register("noflo-noflo-interaction/components/ListenPointer.js", function(exports, require, module){
var ListenPointer, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenPointer = (function(_super) {
  __extends(ListenPointer, _super);

  ListenPointer.prototype.description = 'Listen to pointer events on a DOM element';

  function ListenPointer() {
    this.pointerLeave = __bind(this.pointerLeave, this);
    this.pointerEnter = __bind(this.pointerEnter, this);
    this.pointerOut = __bind(this.pointerOut, this);
    this.pointerOver = __bind(this.pointerOver, this);
    this.pointerMove = __bind(this.pointerMove, this);
    this.pointerCancel = __bind(this.pointerCancel, this);
    this.pointerUp = __bind(this.pointerUp, this);
    this.pointerDown = __bind(this.pointerDown, this);
    this.action = 'none';
    this.capture = false;
    this.propagate = false;
    this.elements = [];
    this.inPorts = {
      element: new noflo.Port('object'),
      action: new noflo.Port('string'),
      capture: new noflo.Port('boolean'),
      propagate: new noflo.Port('boolean')
    };
    this.outPorts = {
      down: new noflo.Port('object'),
      up: new noflo.Port('object'),
      cancel: new noflo.Port('object'),
      move: new noflo.Port('object'),
      over: new noflo.Port('object'),
      out: new noflo.Port('object'),
      enter: new noflo.Port('object'),
      leave: new noflo.Port('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        return _this.subscribe(element);
      };
    })(this));
    this.inPorts.action.on('data', (function(_this) {
      return function(action) {
        _this.action = action;
      };
    })(this));
    this.inPorts.capture.on('data', (function(_this) {
      return function(capture) {
        _this.capture = capture;
      };
    })(this));
    this.inPorts.propagate.on('data', (function(_this) {
      return function(propagate) {
        _this.propagate = propagate;
      };
    })(this));
  }

  ListenPointer.prototype.subscribe = function(element) {
    if (element.setAttribute) {
      element.setAttribute('touch-action', this.action);
    }
    element.addEventListener('pointerdown', this.pointerDown, this.capture);
    element.addEventListener('pointerup', this.pointerUp, this.capture);
    element.addEventListener('pointercancel', this.pointerCancel, this.capture);
    element.addEventListener('pointermove', this.pointerMove, this.capture);
    element.addEventListener('pointerover', this.pointerOver, this.capture);
    element.addEventListener('pointerout', this.pointerOut, this.capture);
    element.addEventListener('pointerenter', this.pointerEnter, this.capture);
    element.addEventListener('pointerleave', this.pointerLeave, this.capture);
    return this.elements.push(element);
  };

  ListenPointer.prototype.unsubscribe = function(element) {
    var name, port, _ref, _results;
    if (element.removeAttribute) {
      element.removeAttribute('touch-action');
    }
    element.removeEventListener('pointerdown', this.pointerDown, this.capture);
    element.removeEventListener('pointerup', this.pointerUp, this.capture);
    element.removeEventListener('pointercancel', this.pointerCancel, this.capture);
    element.removeEventListener('pointermove', this.pointerMove, this.capture);
    element.removeEventListener('pointerover', this.pointerOver, this.capture);
    element.removeEventListener('pointerout', this.pointerOut, this.capture);
    element.removeEventListener('pointerenter', this.pointerEnter, this.capture);
    element.removeEventListener('pointerleave', this.pointerLeave, this.capture);
    _ref = this.outPorts;
    _results = [];
    for (name in _ref) {
      port = _ref[name];
      if (!port.isAttached()) {
        continue;
      }
      _results.push(port.disconnect());
    }
    return _results;
  };

  ListenPointer.prototype.shutdown = function() {
    var element, _i, _len, _ref;
    _ref = this.elements;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      this.unsubscribe(element);
    }
    return this.elements = [];
  };

  ListenPointer.prototype.pointerDown = function(event) {
    return this.handle(event, 'down');
  };

  ListenPointer.prototype.pointerUp = function(event) {
    return this.handle(event, 'up');
  };

  ListenPointer.prototype.pointerCancel = function(event) {
    return this.handle(event, 'cancel');
  };

  ListenPointer.prototype.pointerMove = function(event) {
    return this.handle(event, 'move');
  };

  ListenPointer.prototype.pointerOver = function(event) {
    return this.handle(event, 'over');
  };

  ListenPointer.prototype.pointerOut = function(event) {
    return this.handle(event, 'out');
  };

  ListenPointer.prototype.pointerEnter = function(event) {
    return this.handle(event, 'enter');
  };

  ListenPointer.prototype.pointerLeave = function(event) {
    return this.handle(event, 'leave');
  };

  ListenPointer.prototype.handle = function(event, type) {
    var name, port, _ref, _results;
    event.preventDefault();
    if (!this.propagate) {
      event.stopPropagation();
    }
    if (!this.outPorts[type].isAttached()) {
      return;
    }
    this.outPorts[type].beginGroup(event.pointerId);
    this.outPorts[type].send(event);
    this.outPorts[type].endGroup();
    if (type === 'up' || type === 'cancel' || type === 'leave') {
      _ref = this.outPorts;
      _results = [];
      for (name in _ref) {
        port = _ref[name];
        if (!port.isAttached()) {
          continue;
        }
        _results.push(port.disconnect());
      }
      return _results;
    }
  };

  return ListenPointer;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenPointer;
};

});
require.register("noflo-noflo-interaction/components/ListenResize.js", function(exports, require, module){
var ListenResize, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenResize = (function(_super) {
  __extends(ListenResize, _super);

  ListenResize.prototype.description = 'Listen to window resize events';

  ListenResize.prototype.icon = 'desktop';

  function ListenResize() {
    this.sendSize = __bind(this.sendSize, this);
    this.inPorts = {
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      width: new noflo.Port('number'),
      height: new noflo.Port('number')
    };
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        _this.sendSize();
        return _this.subscribe();
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        return _this.unsubscribe();
      };
    })(this));
  }

  ListenResize.prototype.subscribe = function() {
    return window.addEventListener('resize', this.sendSize, false);
  };

  ListenResize.prototype.unsubscribe = function() {
    return window.removeEventListener('resize', this.sendSize, false);
  };

  ListenResize.prototype.sendSize = function() {
    if (this.outPorts.width.isAttached()) {
      this.outPorts.width.send(window.innerWidth);
      this.outPorts.width.disconnect();
    }
    if (this.outPorts.height.isAttached()) {
      this.outPorts.height.send(window.innerHeight);
      return this.outPorts.height.disconnect();
    }
  };

  ListenResize.prototype.shutdown = function() {
    return this.unsubscribe();
  };

  return ListenResize;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenResize;
};

});
require.register("noflo-noflo-interaction/components/ListenScroll.js", function(exports, require, module){
var ListenScroll, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenScroll = (function(_super) {
  __extends(ListenScroll, _super);

  ListenScroll.prototype.description = 'Listen to scroll events on the browser window';

  function ListenScroll() {
    this.scroll = __bind(this.scroll, this);
    this.inPorts = {
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      top: new noflo.Port('number'),
      bottom: new noflo.Port('number'),
      left: new noflo.Port('number'),
      right: new noflo.Port('number')
    };
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        return _this.subscribe();
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        return _this.unsubscribe();
      };
    })(this));
  }

  ListenScroll.prototype.subscribe = function() {
    return window.addEventListener('scroll', this.scroll, false);
  };

  ListenScroll.prototype.unsubscribe = function() {
    return window.removeEventListenr('scroll', this.scroll, false);
  };

  ListenScroll.prototype.scroll = function(event) {
    var bottom, left, right, top;
    top = window.scrollY;
    left = window.scrollX;
    if (this.outPorts.top.isAttached()) {
      this.outPorts.top.send(top);
      this.outPorts.top.disconnect();
    }
    if (this.outPorts.bottom.isAttached()) {
      bottom = top + window.innerHeight;
      this.outPorts.bottom.send(bottom);
      this.outPorts.bottom.disconnect();
    }
    if (this.outPorts.left.isAttached()) {
      this.outPorts.left.send(left);
      this.outPorts.left.disconnect();
    }
    if (this.outPorts.right.isAttached()) {
      right = left + window.innerWidth;
      this.outPorts.right.send(right);
      return this.outPorts.right.disconnect();
    }
  };

  ListenScroll.prototype.shutdown = function() {
    return this.unsubscribe();
  };

  return ListenScroll;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenScroll;
};

});
require.register("noflo-noflo-interaction/components/ListenSpeech.js", function(exports, require, module){
var ListenSpeech, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenSpeech = (function(_super) {
  __extends(ListenSpeech, _super);

  ListenSpeech.prototype.description = 'Listen for user\'s microphone and recognize phrases';

  function ListenSpeech() {
    this.handleError = __bind(this.handleError, this);
    this.handleResult = __bind(this.handleResult, this);
    this.recognition = false;
    this.sent = [];
    this.inPorts = {
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      result: new noflo.Port('string'),
      error: new noflo.Port('object')
    };
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        return _this.startListening();
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        return _this.stopListening();
      };
    })(this));
  }

  ListenSpeech.prototype.startListening = function() {
    if (!window.webkitSpeechRecognition) {
      this.handleError(new Error('Speech recognition support not available'));
    }
    this.recognition = new window.webkitSpeechRecognition;
    this.recognition.continuous = true;
    this.recognition.start();
    this.outPorts.result.connect();
    this.recognition.onresult = this.handleResult;
    return this.recognition.onerror = this.handleError;
  };

  ListenSpeech.prototype.handleResult = function(event) {
    var idx, result, _i, _len, _ref, _results;
    _ref = event.results;
    _results = [];
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      result = _ref[idx];
      if (!result.isFinal) {
        continue;
      }
      if (this.sent.indexOf(idx) !== -1) {
        continue;
      }
      this.outPorts.result.send(result[0].transcript);
      _results.push(this.sent.push(idx));
    }
    return _results;
  };

  ListenSpeech.prototype.handleError = function(error) {
    if (this.outPorts.error.isAttached()) {
      this.outPorts.error.send(error);
      this.outPorts.error.disconnect();
      return;
    }
    throw error;
  };

  ListenSpeech.prototype.stopListening = function() {
    if (!this.recognition) {
      return;
    }
    this.outPorts.result.disconnect();
    this.recognition.stop();
    this.recognition = null;
    return this.sent = [];
  };

  ListenSpeech.prototype.shutdown = function() {
    return this.stopListening();
  };

  return ListenSpeech;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenSpeech;
};

});
require.register("noflo-noflo-interaction/components/ListenTouch.js", function(exports, require, module){
var ListenTouch, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenTouch = (function(_super) {
  __extends(ListenTouch, _super);

  ListenTouch.prototype.description = 'Listen to touch events on a DOM element';

  function ListenTouch() {
    this.touchend = __bind(this.touchend, this);
    this.touchmove = __bind(this.touchmove, this);
    this.touchstart = __bind(this.touchstart, this);
    this.inPorts = {
      element: new noflo.Port('object')
    };
    this.outPorts = {
      start: new noflo.ArrayPort('object'),
      movex: new noflo.ArrayPort('number'),
      movey: new noflo.ArrayPort('number'),
      end: new noflo.ArrayPort('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        return _this.subscribe(element);
      };
    })(this));
  }

  ListenTouch.prototype.subscribe = function(element) {
    element.addEventListener('touchstart', this.touchstart, false);
    element.addEventListener('touchmove', this.touchmove, false);
    return element.addEventListener('touchend', this.touchend, false);
  };

  ListenTouch.prototype.touchstart = function(event) {
    var idx, touch, _i, _len, _ref;
    event.preventDefault();
    event.stopPropagation();
    if (!event.changedTouches) {
      return;
    }
    if (!event.changedTouches.length) {
      return;
    }
    _ref = event.changedTouches;
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      touch = _ref[idx];
      this.outPorts.start.beginGroup(idx);
      this.outPorts.start.send(event);
      this.outPorts.start.endGroup();
    }
    return this.outPorts.start.disconnect();
  };

  ListenTouch.prototype.touchmove = function(event) {
    var idx, touch, _i, _len, _ref, _results;
    event.preventDefault();
    event.stopPropagation();
    if (!event.changedTouches) {
      return;
    }
    if (!event.changedTouches.length) {
      return;
    }
    _ref = event.changedTouches;
    _results = [];
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      touch = _ref[idx];
      this.outPorts.movex.beginGroup(idx);
      this.outPorts.movex.send(touch.pageX);
      this.outPorts.movex.endGroup();
      this.outPorts.movey.beginGroup(idx);
      this.outPorts.movey.send(touch.pageY);
      _results.push(this.outPorts.movey.endGroup());
    }
    return _results;
  };

  ListenTouch.prototype.touchend = function(event) {
    var idx, touch, _i, _len, _ref;
    event.preventDefault();
    event.stopPropagation();
    if (!event.changedTouches) {
      return;
    }
    if (!event.changedTouches.length) {
      return;
    }
    if (this.outPorts.movex.isConnected()) {
      this.outPorts.movex.disconnect();
    }
    if (this.outPorts.movey.isConnected()) {
      this.outPorts.movey.disconnect();
    }
    _ref = event.changedTouches;
    for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
      touch = _ref[idx];
      this.outPorts.end.beginGroup(idx);
      this.outPorts.end.send(event);
      this.outPorts.end.endGroup();
    }
    return this.outPorts.end.disconnect();
  };

  return ListenTouch;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenTouch;
};

});
require.register("noflo-noflo-interaction/components/SetHash.js", function(exports, require, module){
var SetHash, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SetHash = (function(_super) {
  __extends(SetHash, _super);

  function SetHash() {
    this.inPorts = {
      hash: new noflo.ArrayPort('string')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.hash.on('data', (function(_this) {
      return function(data) {
        window.location.hash = "#" + data;
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.send(data);
        }
      };
    })(this));
    this.inPorts.hash.on('disconnect', (function(_this) {
      return function() {
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.disconnect();
        }
      };
    })(this));
  }

  return SetHash;

})(noflo.Component);

exports.getComponent = function() {
  return new SetHash;
};

});
require.register("noflo-noflo-interaction/components/ReadCoordinates.js", function(exports, require, module){
var ReadCoordinates, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ReadCoordinates = (function(_super) {
  __extends(ReadCoordinates, _super);

  ReadCoordinates.prototype.description = 'Read the coordinates from a DOM event';

  function ReadCoordinates() {
    this.inPorts = {
      event: new noflo.Port('object')
    };
    this.outPorts = {
      screen: new noflo.Port('object'),
      client: new noflo.Port('object'),
      page: new noflo.Port('object')
    };
    this.inPorts.event.on('begingroup', (function(_this) {
      return function(group) {
        if (_this.outPorts.screen.isAttached()) {
          _this.outPorts.screen.beginGroup(group);
        }
        if (_this.outPorts.client.isAttached()) {
          _this.outPorts.client.beginGroup(group);
        }
        if (_this.outPorts.page.isAttached()) {
          return _this.outPorts.page.beginGroup(group);
        }
      };
    })(this));
    this.inPorts.event.on('data', (function(_this) {
      return function(data) {
        return _this.read(data);
      };
    })(this));
    this.inPorts.event.on('endgroup', (function(_this) {
      return function() {
        if (_this.outPorts.screen.isAttached()) {
          _this.outPorts.screen.endGroup();
        }
        if (_this.outPorts.client.isAttached()) {
          _this.outPorts.client.endGroup();
        }
        if (_this.outPorts.page.isAttached()) {
          return _this.outPorts.page.endGroup();
        }
      };
    })(this));
    this.inPorts.event.on('disconnect', (function(_this) {
      return function() {
        if (_this.outPorts.screen.isAttached()) {
          _this.outPorts.screen.disconnect();
        }
        if (_this.outPorts.client.isAttached()) {
          _this.outPorts.client.disconnect();
        }
        if (_this.outPorts.page.isAttached()) {
          return _this.outPorts.page.disconnect();
        }
      };
    })(this));
  }

  ReadCoordinates.prototype.read = function(event) {
    if (!event) {
      return;
    }
    if (this.outPorts.screen.isAttached() && event.screenX !== void 0) {
      this.outPorts.screen.send({
        x: event.screenX,
        y: event.screenY
      });
    }
    if (this.outPorts.client.isAttached() && event.clientX !== void 0) {
      this.outPorts.client.send({
        x: event.clientX,
        y: event.clientY
      });
    }
    if (this.outPorts.page.isAttached() && event.pageX !== void 0) {
      return this.outPorts.page.send({
        x: event.pageX,
        y: event.pageY
      });
    }
  };

  return ReadCoordinates;

})(noflo.Component);

exports.getComponent = function() {
  return new ReadCoordinates;
};

});
require.register("noflo-noflo-objects/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of objects.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-objects/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-objects","description":"Object Utilities for NoFlo","version":"0.1.0","keywords":["noflo","objects","utilities"],"author":"Kenneth Kan <kenhkan@gmail.com>","repo":"noflo/objects","dependencies":{"noflo/noflo":"*","component/underscore":"*"},"scripts":["components/Extend.coffee","components/MergeObjects.coffee","components/SplitObject.coffee","components/ReplaceKey.coffee","components/Keys.coffee","components/Size.coffee","components/Values.coffee","components/Join.coffee","components/ExtractProperty.coffee","components/InsertProperty.coffee","components/SliceArray.coffee","components/SplitArray.coffee","components/FilterPropertyValue.coffee","components/FlattenObject.coffee","components/MapProperty.coffee","components/RemoveProperty.coffee","components/MapPropertyValue.coffee","components/GetObjectKey.coffee","components/UniqueArray.coffee","components/SetProperty.coffee","components/SimplifyObject.coffee","components/DuplicateProperty.coffee","components/CreateObject.coffee","components/CreateDate.coffee","components/SetPropertyValue.coffee","components/CallMethod.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"list","components":{"Extend":"components/Extend.coffee","MergeObjects":"components/MergeObjects.coffee","SplitObject":"components/SplitObject.coffee","ReplaceKey":"components/ReplaceKey.coffee","Keys":"components/Keys.coffee","Size":"components/Size.coffee","Values":"components/Values.coffee","Join":"components/Join.coffee","ExtractProperty":"components/ExtractProperty.coffee","InsertProperty":"components/InsertProperty.coffee","SliceArray":"components/SliceArray.coffee","SplitArray":"components/SplitArray.coffee","FilterPropertyValue":"components/FilterPropertyValue.coffee","FlattenObject":"components/FlattenObject.coffee","MapProperty":"components/MapProperty.coffee","RemoveProperty":"components/RemoveProperty.coffee","MapPropertyValue":"components/MapPropertyValue.coffee","GetObjectKey":"components/GetObjectKey.coffee","UniqueArray":"components/UniqueArray.coffee","SetProperty":"components/SetProperty.coffee","SimplifyObject":"components/SimplifyObject.coffee","DuplicateProperty":"components/DuplicateProperty.coffee","CreateObject":"components/CreateObject.coffee","CreateDate":"components/CreateDate.coffee","SetPropertyValue":"components/SetPropertyValue.coffee","CallMethod":"components/CallMethod.coffee"}}}');
});
require.register("noflo-noflo-objects/components/Extend.js", function(exports, require, module){
var Extend, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("underscore");

noflo = require("noflo");

Extend = (function(_super) {
  __extends(Extend, _super);

  Extend.prototype.description = "Extend an incoming object to some predefined objects, optionally by a certain property";

  function Extend() {
    this.bases = [];
    this.mergedBase = {};
    this.key = null;
    this.reverse = false;
    this.inPorts = {
      "in": new noflo.Port,
      base: new noflo.Port,
      key: new noflo.Port,
      reverse: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.base.on("connect", (function(_this) {
      return function() {
        return _this.bases = [];
      };
    })(this));
    this.inPorts.base.on("data", (function(_this) {
      return function(base) {
        if (base != null) {
          return _this.bases.push(base);
        }
      };
    })(this));
    this.inPorts.key.on("data", (function(_this) {
      return function(key) {
        _this.key = key;
      };
    })(this));
    this.inPorts.reverse.on("data", (function(_this) {
      return function(reverse) {
        return _this.reverse = reverse === 'true';
      };
    })(this));
    this.inPorts["in"].on("connect", (function(_this) {
      return function(group) {};
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(incoming) {
        var base, out, _i, _len, _ref;
        out = {};
        _ref = _this.bases;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          base = _ref[_i];
          if ((_this.key == null) || (incoming[_this.key] != null) && incoming[_this.key] === base[_this.key]) {
            _.extend(out, base);
          }
        }
        if (_this.reverse) {
          return _this.outPorts.out.send(_.extend({}, incoming, out));
        } else {
          return _this.outPorts.out.send(_.extend(out, incoming));
        }
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Extend;

})(noflo.Component);

exports.getComponent = function() {
  return new Extend;
};

});
require.register("noflo-noflo-objects/components/MergeObjects.js", function(exports, require, module){
var MergeObjects, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("underscore");

noflo = require("noflo");

MergeObjects = (function(_super) {
  __extends(MergeObjects, _super);

  MergeObjects.prototype.description = "merges all incoming objects into one";

  function MergeObjects() {
    this.merge = _.bind(this.merge, this);
    this.inPorts = {
      "in": new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on("connect", (function(_this) {
      return function() {
        _this.groups = [];
        return _this.objects = [];
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(object) {
        return _this.objects.push(object);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.groups.pop();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        _this.outPorts.out.send(_.reduce(_this.objects, _this.merge, {}));
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  MergeObjects.prototype.merge = function(origin, object) {
    var key, oValue, value;
    for (key in object) {
      value = object[key];
      oValue = origin[key];
      if (oValue != null) {
        switch (toString.call(oValue)) {
          case "[object Array]":
            origin[key].push.apply(origin[key], value);
            break;
          case "[object Object]":
            origin[key] = this.merge(oValue, value);
            break;
          default:
            origin[key] = value;
        }
      } else {
        origin[key] = value;
      }
    }
    return origin;
  };

  return MergeObjects;

})(noflo.Component);

exports.getComponent = function() {
  return new MergeObjects;
};

});
require.register("noflo-noflo-objects/components/SplitObject.js", function(exports, require, module){
var SplitObject, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

SplitObject = (function(_super) {
  __extends(SplitObject, _super);

  SplitObject.prototype.description = "splits a single object into multiple IPs, wrapped with the key as the group";

  function SplitObject() {
    this.inPorts = {
      "in": new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var key, value, _results;
        _results = [];
        for (key in data) {
          value = data[key];
          _this.outPorts.out.beginGroup(key);
          _this.outPorts.out.send(value);
          _results.push(_this.outPorts.out.endGroup());
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return SplitObject;

})(noflo.Component);

exports.getComponent = function() {
  return new SplitObject;
};

});
require.register("noflo-noflo-objects/components/ReplaceKey.js", function(exports, require, module){
var ReplaceKey, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

ReplaceKey = (function(_super) {
  __extends(ReplaceKey, _super);

  ReplaceKey.prototype.description = "given a regexp matching any key of an incoming object as a data IP, replace the key with the provided string";

  function ReplaceKey() {
    this.patterns = {};
    this.inPorts = {
      "in": new noflo.Port,
      pattern: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.pattern.on("data", (function(_this) {
      return function(patterns) {
        _this.patterns = patterns;
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var key, newKey, pattern, replace, value, _ref;
        newKey = null;
        for (key in data) {
          value = data[key];
          _ref = _this.patterns;
          for (pattern in _ref) {
            replace = _ref[pattern];
            pattern = new RegExp(pattern);
            if (key.match(pattern) != null) {
              newKey = key.replace(pattern, replace);
              data[newKey] = value;
              delete data[key];
            }
          }
        }
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        _this.pattern = null;
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return ReplaceKey;

})(noflo.Component);

exports.getComponent = function() {
  return new ReplaceKey;
};

});
require.register("noflo-noflo-objects/components/Keys.js", function(exports, require, module){
var Keys, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

_ = require("underscore");

Keys = (function(_super) {
  __extends(Keys, _super);

  Keys.prototype.description = "gets only the keys of an object and forward them as an array";

  function Keys() {
    this.inPorts = {
      "in": new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('all')
    };
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var key, _i, _len, _ref, _results;
        _ref = _.keys(data);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          _results.push(_this.outPorts.out.send(key));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Keys;

})(noflo.Component);

exports.getComponent = function() {
  return new Keys;
};

});
require.register("noflo-noflo-objects/components/Size.js", function(exports, require, module){
var Size, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

_ = require("underscore");

Size = (function(_super) {
  __extends(Size, _super);

  Size.prototype.description = "gets the size of an object and sends that out as a number";

  function Size() {
    this.inPorts = {
      "in": new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('integer')
    };
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(_.size(data));
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Size;

})(noflo.Component);

exports.getComponent = function() {
  return new Size;
};

});
require.register("noflo-noflo-objects/components/Values.js", function(exports, require, module){
var Values, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

_ = require("underscore");

Values = (function(_super) {
  __extends(Values, _super);

  Values.prototype.description = "gets only the values of an object and forward them as an array";

  function Values() {
    this.inPorts = {
      "in": new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var value, _i, _len, _ref, _results;
        _ref = _.values(data);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          value = _ref[_i];
          _results.push(_this.outPorts.out.send(value));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Values;

})(noflo.Component);

exports.getComponent = function() {
  return new Values;
};

});
require.register("noflo-noflo-objects/components/Join.js", function(exports, require, module){
var Join, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("underscore");

noflo = require("noflo");

Join = (function(_super) {
  __extends(Join, _super);

  Join.prototype.description = "Join all values of a passed packet together as a string with a predefined delimiter";

  function Join() {
    this.delimiter = ",";
    this.inPorts = {
      "in": new noflo.Port,
      delimiter: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.delimiter.on("data", (function(_this) {
      return function(delimiter) {
        _this.delimiter = delimiter;
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(object) {
        if (_.isObject(object)) {
          return _this.outPorts.out.send(_.values(object).join(_this.delimiter));
        }
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Join;

})(noflo.Component);

exports.getComponent = function() {
  return new Join;
};

});
require.register("noflo-noflo-objects/components/ExtractProperty.js", function(exports, require, module){
var ExtractProperty, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

_ = require("underscore");

ExtractProperty = (function(_super) {
  __extends(ExtractProperty, _super);

  ExtractProperty.prototype.description = "Given a key, return only the value matching that key in the incoming object";

  function ExtractProperty() {
    this.inPorts = {
      "in": new noflo.Port,
      key: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.key.on("connect", (function(_this) {
      return function() {
        return _this.keys = [];
      };
    })(this));
    this.inPorts.key.on("data", (function(_this) {
      return function(key) {
        return _this.keys.push(key);
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var key, value, _i, _len, _ref;
        if ((_this.keys != null) && _.isObject(data)) {
          value = data;
          _ref = _this.keys;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            key = _ref[_i];
            value = value[key];
          }
          return _this.outPorts.out.send(value);
        }
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return ExtractProperty;

})(noflo.Component);

exports.getComponent = function() {
  return new ExtractProperty;
};

});
require.register("noflo-noflo-objects/components/InsertProperty.js", function(exports, require, module){
var InsertProperty, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

_ = require("underscore");

InsertProperty = (function(_super) {
  __extends(InsertProperty, _super);

  InsertProperty.prototype.description = "Insert a property into incoming objects.";

  function InsertProperty() {
    this.properties = {};
    this.inPorts = {
      "in": new noflo.Port,
      property: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.property.on("connect", (function(_this) {
      return function() {
        return _this.properties = {};
      };
    })(this));
    this.inPorts.property.on("begingroup", (function(_this) {
      return function(key) {
        _this.key = key;
      };
    })(this));
    this.inPorts.property.on("data", (function(_this) {
      return function(value) {
        if (_this.key != null) {
          return _this.properties[_this.key] = value;
        }
      };
    })(this));
    this.inPorts.property.on("endgroup", (function(_this) {
      return function() {
        return _this.key = null;
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var key, value, _ref;
        if (!_.isObject(data)) {
          data = {};
        }
        _ref = _this.properties;
        for (key in _ref) {
          value = _ref[key];
          data[key] = value;
        }
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return InsertProperty;

})(noflo.Component);

exports.getComponent = function() {
  return new InsertProperty;
};

});
require.register("noflo-noflo-objects/components/SliceArray.js", function(exports, require, module){
var SliceArray, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SliceArray = (function(_super) {
  __extends(SliceArray, _super);

  function SliceArray() {
    this.begin = 0;
    this.end = null;
    this.inPorts = {
      "in": new noflo.Port(),
      begin: new noflo.Port(),
      end: new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port(),
      error: new noflo.Port()
    };
    this.inPorts.begin.on('data', (function(_this) {
      return function(data) {
        return _this.begin = data;
      };
    })(this));
    this.inPorts.end.on('data', (function(_this) {
      return function(data) {
        return _this.end = data;
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.sliceData(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  SliceArray.prototype.sliceData = function(data) {
    var sliced;
    if (!data.slice) {
      return this.outPorts.error.send("Data " + (typeof data) + " cannot be sliced");
    }
    if (this.end !== null) {
      sliced = data.slice(this.begin, this.end);
    }
    if (this.end === null) {
      sliced = data.slice(this.begin);
    }
    return this.outPorts.out.send(sliced);
  };

  return SliceArray;

})(noflo.Component);

exports.getComponent = function() {
  return new SliceArray;
};

});
require.register("noflo-noflo-objects/components/SplitArray.js", function(exports, require, module){
var SplitArray, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SplitArray = (function(_super) {
  __extends(SplitArray, _super);

  function SplitArray() {
    this.inPorts = {
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.ArrayPort()
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        var item, key, _i, _len, _results;
        if (toString.call(data) !== '[object Array]') {
          for (key in data) {
            item = data[key];
            _this.outPorts.out.beginGroup(key);
            _this.outPorts.out.send(item);
            _this.outPorts.out.endGroup();
          }
          return;
        }
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          item = data[_i];
          _results.push(_this.outPorts.out.send(item));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function(data) {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return SplitArray;

})(noflo.Component);

exports.getComponent = function() {
  return new SplitArray;
};

});
require.register("noflo-noflo-objects/components/FilterPropertyValue.js", function(exports, require, module){
var FilterPropertyValue, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

FilterPropertyValue = (function(_super) {
  __extends(FilterPropertyValue, _super);

  FilterPropertyValue.prototype.icon = 'filter';

  function FilterPropertyValue() {
    this.accepts = {};
    this.regexps = {};
    this.inPorts = {
      accept: new noflo.ArrayPort('all'),
      regexp: new noflo.ArrayPort('string'),
      "in": new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('object'),
      missed: new noflo.Port('object')
    };
    this.inPorts.accept.on('data', (function(_this) {
      return function(data) {
        return _this.prepareAccept(data);
      };
    })(this));
    this.inPorts.regexp.on('data', (function(_this) {
      return function(data) {
        return _this.prepareRegExp(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.filtering()) {
          return _this.filterData(data);
        }
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  FilterPropertyValue.prototype.filtering = function() {
    return (Object.keys(this.accepts)).length > 0 || (Object.keys(this.regexps)).length > 0;
  };

  FilterPropertyValue.prototype.prepareAccept = function(map) {
    var e, mapParts;
    if (typeof map === 'object') {
      this.accepts = map;
      return;
    }
    mapParts = map.split('=');
    try {
      return this.accepts[mapParts[0]] = eval(mapParts[1]);
    } catch (_error) {
      e = _error;
      if (e instanceof ReferenceError) {
        return this.accepts[mapParts[0]] = mapParts[1];
      } else {
        throw e;
      }
    }
  };

  FilterPropertyValue.prototype.prepareRegExp = function(map) {
    var mapParts;
    mapParts = map.split('=');
    return this.regexps[mapParts[0]] = mapParts[1];
  };

  FilterPropertyValue.prototype.filterData = function(object) {
    var match, newData, property, regexp, value;
    newData = {};
    match = false;
    for (property in object) {
      value = object[property];
      if (this.accepts[property]) {
        if (this.accepts[property] !== value) {
          continue;
        }
        match = true;
      }
      if (this.regexps[property]) {
        regexp = new RegExp(this.regexps[property]);
        if (!regexp.exec(value)) {
          continue;
        }
        match = true;
      }
      newData[property] = value;
      continue;
    }
    if (!match) {
      if (!this.outPorts.missed.isAttached()) {
        return;
      }
      this.outPorts.missed.send(object);
      this.outPorts.missed.disconnect();
      return;
    }
    return this.outPorts.out.send(newData);
  };

  return FilterPropertyValue;

})(noflo.Component);

exports.getComponent = function() {
  return new FilterPropertyValue;
};

});
require.register("noflo-noflo-objects/components/FlattenObject.js", function(exports, require, module){
var FlattenObject, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

FlattenObject = (function(_super) {
  __extends(FlattenObject, _super);

  function FlattenObject() {
    this.map = {};
    this.inPorts = {
      map: new noflo.ArrayPort(),
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.map.on('data', (function(_this) {
      return function(data) {
        return _this.prepareMap(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        var object, _i, _len, _ref, _results;
        _ref = _this.flattenObject(data);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          object = _ref[_i];
          _results.push(_this.outPorts.out.send(_this.mapKeys(object)));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  FlattenObject.prototype.prepareMap = function(map) {
    var mapParts;
    if (typeof map === 'object') {
      this.map = map;
      return;
    }
    mapParts = map.split('=');
    return this.map[mapParts[0]] = mapParts[1];
  };

  FlattenObject.prototype.mapKeys = function(object) {
    var key, map, _ref;
    _ref = this.map;
    for (key in _ref) {
      map = _ref[key];
      object[map] = object.flattenedKeys[key];
    }
    delete object.flattenedKeys;
    return object;
  };

  FlattenObject.prototype.flattenObject = function(object) {
    var flattened, flattenedValue, key, val, value, _i, _len;
    flattened = [];
    for (key in object) {
      value = object[key];
      if (typeof value === 'object') {
        flattenedValue = this.flattenObject(value);
        for (_i = 0, _len = flattenedValue.length; _i < _len; _i++) {
          val = flattenedValue[_i];
          val.flattenedKeys.push(key);
          flattened.push(val);
        }
        continue;
      }
      flattened.push({
        flattenedKeys: [key],
        value: value
      });
    }
    return flattened;
  };

  return FlattenObject;

})(noflo.Component);

exports.getComponent = function() {
  return new FlattenObject;
};

});
require.register("noflo-noflo-objects/components/MapProperty.js", function(exports, require, module){
var MapProperty, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

MapProperty = (function(_super) {
  __extends(MapProperty, _super);

  function MapProperty() {
    this.map = {};
    this.regexps = {};
    this.inPorts = {
      map: new noflo.ArrayPort(),
      regexp: new noflo.ArrayPort(),
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.map.on('data', (function(_this) {
      return function(data) {
        return _this.prepareMap(data);
      };
    })(this));
    this.inPorts.regexp.on('data', (function(_this) {
      return function(data) {
        return _this.prepareRegExp(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.mapData(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  MapProperty.prototype.prepareMap = function(map) {
    var mapParts;
    if (typeof map === 'object') {
      this.map = map;
      return;
    }
    mapParts = map.split('=');
    return this.map[mapParts[0]] = mapParts[1];
  };

  MapProperty.prototype.prepareRegExp = function(map) {
    var mapParts;
    mapParts = map.split('=');
    return this.regexps[mapParts[0]] = mapParts[1];
  };

  MapProperty.prototype.mapData = function(data) {
    var expression, matched, newData, property, regexp, replacement, value, _ref;
    newData = {};
    for (property in data) {
      value = data[property];
      if (property in this.map) {
        property = this.map[property];
      }
      _ref = this.regexps;
      for (expression in _ref) {
        replacement = _ref[expression];
        regexp = new RegExp(expression);
        matched = regexp.exec(property);
        if (!matched) {
          continue;
        }
        property = property.replace(regexp, replacement);
      }
      if (property in newData) {
        if (Array.isArray(newData[property])) {
          newData[property].push(value);
        } else {
          newData[property] = [newData[property], value];
        }
      } else {
        newData[property] = value;
      }
    }
    return this.outPorts.out.send(newData);
  };

  return MapProperty;

})(noflo.Component);

exports.getComponent = function() {
  return new MapProperty;
};

});
require.register("noflo-noflo-objects/components/RemoveProperty.js", function(exports, require, module){
var RemoveProperty, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore');

RemoveProperty = (function(_super) {
  __extends(RemoveProperty, _super);

  RemoveProperty.prototype.icon = 'ban';

  function RemoveProperty() {
    this.properties = [];
    this.inPorts = {
      "in": new noflo.Port(),
      property: new noflo.ArrayPort()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.property.on('data', (function(_this) {
      return function(data) {
        return _this.properties.push(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(_this.removeProperties(data));
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  RemoveProperty.prototype.removeProperties = function(object) {
    var property, _i, _len, _ref;
    object = _.clone(object);
    _ref = this.properties;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      property = _ref[_i];
      delete object[property];
    }
    return object;
  };

  return RemoveProperty;

})(noflo.Component);

exports.getComponent = function() {
  return new RemoveProperty;
};

});
require.register("noflo-noflo-objects/components/MapPropertyValue.js", function(exports, require, module){
var MapPropertyValue, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

MapPropertyValue = (function(_super) {
  __extends(MapPropertyValue, _super);

  function MapPropertyValue() {
    this.mapAny = {};
    this.map = {};
    this.regexpAny = {};
    this.regexp = {};
    this.inPorts = {
      map: new noflo.ArrayPort(),
      regexp: new noflo.ArrayPort(),
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.map.on('data', (function(_this) {
      return function(data) {
        return _this.prepareMap(data);
      };
    })(this));
    this.inPorts.regexp.on('data', (function(_this) {
      return function(data) {
        return _this.prepareRegExp(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.mapData(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  MapPropertyValue.prototype.prepareMap = function(map) {
    var mapParts;
    if (typeof map === 'object') {
      this.mapAny = map;
      return;
    }
    mapParts = map.split('=');
    if (mapParts.length === 3) {
      this.map[mapParts[0]] = {
        from: mapParts[1],
        to: mapParts[2]
      };
      return;
    }
    return this.mapAny[mapParts[0]] = mapParts[1];
  };

  MapPropertyValue.prototype.prepareRegExp = function(map) {
    var mapParts;
    mapParts = map.split('=');
    if (mapParts.length === 3) {
      this.regexp[mapParts[0]] = {
        from: mapParts[1],
        to: mapParts[2]
      };
      return;
    }
    return this.regexpAny[mapParts[0]] = mapParts[1];
  };

  MapPropertyValue.prototype.mapData = function(data) {
    var expression, matched, property, regexp, replacement, value, _ref;
    for (property in data) {
      value = data[property];
      if (this.map[property] && this.map[property].from === value) {
        data[property] = this.map[property].to;
      }
      if (this.mapAny[value]) {
        data[property] = this.mapAny[value];
      }
      if (this.regexp[property]) {
        regexp = new RegExp(this.regexp[property].from);
        matched = regexp.exec(value);
        if (matched) {
          data[property] = value.replace(regexp, this.regexp[property].to);
        }
      }
      _ref = this.regexpAny;
      for (expression in _ref) {
        replacement = _ref[expression];
        regexp = new RegExp(expression);
        matched = regexp.exec(value);
        if (!matched) {
          continue;
        }
        data[property] = value.replace(regexp, replacement);
      }
    }
    return this.outPorts.out.send(data);
  };

  return MapPropertyValue;

})(noflo.Component);

exports.getComponent = function() {
  return new MapPropertyValue;
};

});
require.register("noflo-noflo-objects/components/GetObjectKey.js", function(exports, require, module){
var GetObjectKey, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetObjectKey = (function(_super) {
  __extends(GetObjectKey, _super);

  GetObjectKey.prototype.icon = 'indent';

  function GetObjectKey() {
    this.sendGroup = true;
    this.data = [];
    this.key = [];
    this.inPorts = {
      "in": new noflo.Port('object'),
      key: new noflo.ArrayPort('string'),
      sendgroup: new noflo.Port('boolean')
    };
    this.outPorts = {
      out: new noflo.Port('all'),
      object: new noflo.Port('object'),
      missed: new noflo.Port('object')
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        return _this.data = [];
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.key.length) {
          return _this.getKey(data);
        }
        return _this.data.push(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        var data, _i, _len, _ref;
        if (!_this.data.length) {
          _this.outPorts.out.disconnect();
          return;
        }
        if (!_this.key.length) {
          return;
        }
        _ref = _this.data;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          data = _ref[_i];
          _this.getKey(data);
        }
        _this.outPorts.out.disconnect();
        if (_this.outPorts.object.isAttached()) {
          return _this.outPorts.object.disconnect();
        }
      };
    })(this));
    this.inPorts.key.on('data', (function(_this) {
      return function(data) {
        return _this.key.push(data);
      };
    })(this));
    this.inPorts.key.on('disconnect', (function(_this) {
      return function() {
        var data, _i, _len, _ref;
        if (!_this.data.length) {
          return;
        }
        _ref = _this.data;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          data = _ref[_i];
          _this.getKey(data);
        }
        _this.data = [];
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.sendgroup.on('data', (function(_this) {
      return function(data) {
        return _this.sendGroup = String(data) === 'true';
      };
    })(this));
  }

  GetObjectKey.prototype.error = function(data, error) {
    if (this.outPorts.missed.isAttached()) {
      this.outPorts.missed.send(data);
      this.outPorts.missed.disconnect();
      return;
    }
    throw error;
  };

  GetObjectKey.prototype.getKey = function(data) {
    var key, _i, _len, _ref;
    if (!this.key.length) {
      this.error(data, new Error('Key not defined'));
      return;
    }
    if (typeof data !== 'object') {
      this.error(data, new Error('Data is not an object'));
      return;
    }
    if (data === null) {
      this.error(data, new Error('Data is NULL'));
      return;
    }
    _ref = this.key;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (data[key] === void 0) {
        this.error(data, new Error("Object has no key " + key));
        continue;
      }
      if (this.sendGroup) {
        this.outPorts.out.beginGroup(key);
      }
      this.outPorts.out.send(data[key]);
      if (this.sendGroup) {
        this.outPorts.out.endGroup();
      }
    }
    if (!this.outPorts.object.isAttached()) {
      return;
    }
    return this.outPorts.object.send(data);
  };

  return GetObjectKey;

})(noflo.Component);

exports.getComponent = function() {
  return new GetObjectKey;
};

});
require.register("noflo-noflo-objects/components/UniqueArray.js", function(exports, require, module){
var UniqueArray, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

UniqueArray = (function(_super) {
  __extends(UniqueArray, _super);

  function UniqueArray() {
    this.inPorts = {
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(_this.unique(data));
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  UniqueArray.prototype.unique = function(array) {
    var member, newArray, seen, _i, _len;
    seen = {};
    newArray = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      member = array[_i];
      seen[member] = member;
    }
    for (member in seen) {
      newArray.push(member);
    }
    return newArray;
  };

  return UniqueArray;

})(noflo.Component);

exports.getComponent = function() {
  return new UniqueArray;
};

});
require.register("noflo-noflo-objects/components/SetProperty.js", function(exports, require, module){
var SetProperty, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SetProperty = (function(_super) {
  __extends(SetProperty, _super);

  function SetProperty() {
    this.properties = {};
    this.inPorts = {
      property: new noflo.ArrayPort(),
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.property.on('data', (function(_this) {
      return function(data) {
        return _this.setProperty(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.addProperties(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  SetProperty.prototype.setProperty = function(prop) {
    var propParts;
    if (typeof prop === 'object') {
      this.prop = prop;
      return;
    }
    propParts = prop.split('=');
    return this.properties[propParts[0]] = propParts[1];
  };

  SetProperty.prototype.addProperties = function(object) {
    var property, value, _ref;
    _ref = this.properties;
    for (property in _ref) {
      value = _ref[property];
      object[property] = value;
    }
    return this.outPorts.out.send(object);
  };

  return SetProperty;

})(noflo.Component);

exports.getComponent = function() {
  return new SetProperty;
};

});
require.register("noflo-noflo-objects/components/SimplifyObject.js", function(exports, require, module){
var SimplifyObject, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore')._;

SimplifyObject = (function(_super) {
  __extends(SimplifyObject, _super);

  function SimplifyObject() {
    this.inPorts = {
      "in": new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on('beginGroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(_this.simplify(data));
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  SimplifyObject.prototype.simplify = function(data) {
    if (_.isArray(data)) {
      if (data.length === 1) {
        return data[0];
      }
      return data;
    }
    if (!_.isObject(data)) {
      return data;
    }
    return this.simplifyObject(data);
  };

  SimplifyObject.prototype.simplifyObject = function(data) {
    var keys, simplified;
    keys = _.keys(data);
    if (keys.length === 1 && keys[0] === '$data') {
      return this.simplify(data['$data']);
    }
    simplified = {};
    _.each(data, (function(_this) {
      return function(value, key) {
        return simplified[key] = _this.simplify(value);
      };
    })(this));
    return simplified;
  };

  return SimplifyObject;

})(noflo.Component);

exports.getComponent = function() {
  return new SimplifyObject;
};

});
require.register("noflo-noflo-objects/components/DuplicateProperty.js", function(exports, require, module){
var DuplicateProperty, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

DuplicateProperty = (function(_super) {
  __extends(DuplicateProperty, _super);

  function DuplicateProperty() {
    this.properties = {};
    this.separator = '/';
    this.inPorts = {
      property: new noflo.ArrayPort(),
      separator: new noflo.Port(),
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.property.on('data', (function(_this) {
      return function(data) {
        return _this.setProperty(data);
      };
    })(this));
    this.inPorts.separator.on('data', (function(_this) {
      return function(data) {
        return _this.separator = data;
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.addProperties(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  DuplicateProperty.prototype.setProperty = function(prop) {
    var propParts;
    if (typeof prop === 'object') {
      this.prop = prop;
      return;
    }
    propParts = prop.split('=');
    if (propParts.length > 2) {
      this.properties[propParts.pop()] = propParts;
      return;
    }
    return this.properties[propParts[1]] = propParts[0];
  };

  DuplicateProperty.prototype.addProperties = function(object) {
    var newValues, newprop, original, originalProp, _i, _len, _ref;
    _ref = this.properties;
    for (newprop in _ref) {
      original = _ref[newprop];
      if (typeof original === 'string') {
        object[newprop] = object[original];
        continue;
      }
      newValues = [];
      for (_i = 0, _len = original.length; _i < _len; _i++) {
        originalProp = original[_i];
        newValues.push(object[originalProp]);
      }
      object[newprop] = newValues.join(this.separator);
    }
    return this.outPorts.out.send(object);
  };

  return DuplicateProperty;

})(noflo.Component);

exports.getComponent = function() {
  return new DuplicateProperty;
};

});
require.register("noflo-noflo-objects/components/CreateObject.js", function(exports, require, module){
var CreateObject, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CreateObject = (function(_super) {
  __extends(CreateObject, _super);

  function CreateObject() {
    this.inPorts = {
      start: new noflo.Port('bang')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts.start.on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts.start.on("data", (function(_this) {
      return function() {
        return _this.outPorts.out.send({});
      };
    })(this));
    this.inPorts.start.on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts.start.on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return CreateObject;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateObject;
};

});
require.register("noflo-noflo-objects/components/CreateDate.js", function(exports, require, module){
var CreateDate, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

CreateDate = (function(_super) {
  __extends(CreateDate, _super);

  CreateDate.prototype.description = 'Create a new Date object from string';

  CreateDate.prototype.icon = 'clock-o';

  function CreateDate() {
    this.inPorts = {
      "in": new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var date;
        if (data === "now" || data === null || data === true) {
          date = new Date;
        } else {
          date = new Date(data);
        }
        return _this.outPorts.out.send(date);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return CreateDate;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateDate;
};

});
require.register("noflo-noflo-objects/components/SetPropertyValue.js", function(exports, require, module){
var SetPropertyValue, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SetPropertyValue = (function(_super) {
  __extends(SetPropertyValue, _super);

  function SetPropertyValue() {
    this.property = null;
    this.value = null;
    this.data = [];
    this.groups = [];
    this.keep = false;
    this.inPorts = {
      property: new noflo.Port('string'),
      value: new noflo.Port('all'),
      "in": new noflo.Port('object'),
      keep: new noflo.Port('boolean')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts.keep.on('data', (function(_this) {
      return function(keep) {
        return _this.keep = String(keep) === 'true';
      };
    })(this));
    this.inPorts.property.on('data', (function(_this) {
      return function(data) {
        _this.property = data;
        if (_this.value && _this.data.length) {
          return _this.addProperties();
        }
      };
    })(this));
    this.inPorts.value.on('data', (function(_this) {
      return function(data) {
        _this.value = data;
        if (_this.property && _this.data.length) {
          return _this.addProperties();
        }
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.property && _this.value) {
          _this.addProperty({
            data: data,
            group: _this.groups.slice(0)
          });
          return;
        }
        return _this.data.push({
          data: data,
          group: _this.groups.slice(0)
        });
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.groups.pop();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        if (_this.property && _this.value) {
          _this.outPorts.out.disconnect();
        }
        if (!_this.keep) {
          return _this.value = null;
        }
      };
    })(this));
  }

  SetPropertyValue.prototype.addProperty = function(object) {
    var group, _i, _j, _len, _len1, _ref, _ref1, _results;
    object.data[this.property] = this.value;
    _ref = object.group;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      this.outPorts.out.beginGroup(group);
    }
    this.outPorts.out.send(object.data);
    _ref1 = object.group;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      group = _ref1[_j];
      _results.push(this.outPorts.out.endGroup());
    }
    return _results;
  };

  SetPropertyValue.prototype.addProperties = function() {
    var object, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      this.addProperty(object);
    }
    this.data = [];
    return this.outPorts.out.disconnect();
  };

  return SetPropertyValue;

})(noflo.Component);

exports.getComponent = function() {
  return new SetPropertyValue;
};

});
require.register("noflo-noflo-objects/components/CallMethod.js", function(exports, require, module){
var CallMethod, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

CallMethod = (function(_super) {
  __extends(CallMethod, _super);

  CallMethod.prototype.description = "call a method on an object";

  CallMethod.prototype.icon = 'gear';

  function CallMethod() {
    this.method = null;
    this.args = [];
    this.inPorts = {
      "in": new noflo.Port('object'),
      method: new noflo.Port('string'),
      "arguments": new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.Port('all'),
      error: new noflo.Port('string')
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var msg;
        if (!_this.method) {
          return;
        }
        if (!data[_this.method]) {
          msg = "Method '" + _this.method + "' not available";
          if (_this.outPorts.error.isAttached()) {
            _this.outPorts.error.send(msg);
            _this.outPorts.error.disconnect();
            return;
          }
          throw new Error(msg);
        }
        _this.outPorts.out.send(data[_this.method].apply(data, _this.args));
        return _this.args = [];
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.method.on("data", (function(_this) {
      return function(data) {
        return _this.method = data;
      };
    })(this));
    this.inPorts["arguments"].on('connect', (function(_this) {
      return function() {
        return _this.args = [];
      };
    })(this));
    this.inPorts["arguments"].on('data', (function(_this) {
      return function(data) {
        return _this.args.push(data);
      };
    })(this));
  }

  return CallMethod;

})(noflo.Component);

exports.getComponent = function() {
  return new CallMethod;
};

});
require.register("noflo-noflo-groups/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of groups.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-groups/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-groups","description":"Group Utilities for NoFlo","keywords":["noflo","groups","utilities"],"author":"Kenneth Kan <kenhkan@gmail.com>","version":"0.1.0","repo":"kenhkan/groups","dependencies":{"component/underscore":"*","noflo/noflo":"*"},"scripts":["components/ReadGroups.coffee","components/RemoveGroups.coffee","components/Regroup.coffee","components/Group.coffee","components/GroupZip.coffee","components/FilterByGroup.coffee","components/Objectify.coffee","components/ReadGroup.coffee","components/SendByGroup.coffee","components/CollectGroups.coffee","components/CollectObject.coffee","components/FirstGroup.coffee","components/MapGroup.coffee","components/MergeGroups.coffee","components/GroupByObjectKey.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"tags","components":{"ReadGroups":"components/ReadGroups.coffee","RemoveGroups":"components/RemoveGroups.coffee","Regroup":"components/Regroup.coffee","Group":"components/Group.coffee","GroupZip":"components/GroupZip.coffee","FilterByGroup":"components/FilterByGroup.coffee","Objectify":"components/Objectify.coffee","ReadGroup":"components/ReadGroup.coffee","SendByGroup":"components/SendByGroup.coffee","CollectGroups":"components/CollectGroups.coffee","CollectObject":"components/CollectObject.coffee","FirstGroup":"components/FirstGroup.coffee","MapGroup":"components/MapGroup.coffee","MergeGroups":"components/MergeGroups.coffee","GroupByObjectKey":"components/GroupByObjectKey.coffee"}}}');
});
require.register("noflo-noflo-groups/components/ReadGroups.js", function(exports, require, module){
var ReadGroups, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore');

ReadGroups = (function(_super) {
  __extends(ReadGroups, _super);

  function ReadGroups() {
    this.strip = false;
    this.threshold = Infinity;
    this.inPorts = {
      "in": new noflo.ArrayPort,
      strip: new noflo.Port,
      threshold: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port,
      group: new noflo.Port
    };
    this.inPorts.threshold.on('data', (function(_this) {
      return function(threshold) {
        return _this.threshold = parseInt(threshold);
      };
    })(this));
    this.inPorts.strip.on('data', (function(_this) {
      return function(strip) {
        return _this.strip = strip === 'true';
      };
    })(this));
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        _this.count = 0;
        return _this.groups = [];
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        var beginGroup;
        beginGroup = function() {
          _this.groups.push(group);
          if (_this.outPorts.out.isAttached()) {
            return _this.outPorts.out.beginGroup(group);
          }
        };
        if (_this.count >= _this.threshold) {
          return beginGroup(group);
        } else {
          _this.outPorts.group.send(group);
          if (!_this.strip) {
            beginGroup(group);
          }
          return _this.count++;
        }
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group) {
        if (group === _.last(_this.groups)) {
          _this.groups.pop();
          if (_this.outPorts.out.isAttached()) {
            return _this.outPorts.out.endGroup();
          }
        }
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.send(data);
        }
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        if (_this.outPorts.out.isAttached()) {
          _this.outPorts.out.disconnect();
        }
        return _this.outPorts.group.disconnect();
      };
    })(this));
  }

  return ReadGroups;

})(noflo.Component);

exports.getComponent = function() {
  return new ReadGroups;
};

});
require.register("noflo-noflo-groups/components/RemoveGroups.js", function(exports, require, module){
var RemoveGroups, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

RemoveGroups = (function(_super) {
  __extends(RemoveGroups, _super);

  RemoveGroups.prototype.description = "Remove a group given a string or a regex string";

  function RemoveGroups() {
    this.regexp = null;
    this.inPorts = {
      "in": new noflo.Port,
      regexp: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.regexp.on("data", (function(_this) {
      return function(regexp) {
        return _this.regexp = new RegExp(regexp);
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        if ((_this.regexp != null) && (group.match(_this.regexp) == null)) {
          return _this.outPorts.out.beginGroup(group);
        }
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        if ((_this.regexp != null) && (group.match(_this.regexp) == null)) {
          return _this.outPorts.out.endGroup();
        }
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return RemoveGroups;

})(noflo.Component);

exports.getComponent = function() {
  return new RemoveGroups;
};

});
require.register("noflo-noflo-groups/components/Regroup.js", function(exports, require, module){
var Regroup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

Regroup = (function(_super) {
  __extends(Regroup, _super);

  Regroup.prototype.description = "Forward all the data IPs, strip all groups, and replace them with groups from another connection";

  function Regroup() {
    this.groups = [];
    this.inPorts = {
      "in": new noflo.Port,
      group: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.group.on("connect", (function(_this) {
      return function() {
        return _this.groups = [];
      };
    })(this));
    this.inPorts.group.on("data", (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on("connect", (function(_this) {
      return function() {
        var group, _i, _len, _ref, _results;
        _ref = _this.groups;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _results.push(_this.outPorts.out.beginGroup(group));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        var group, _i, _len, _ref;
        _ref = _this.groups;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _this.outPorts.out.endGroup();
        }
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Regroup;

})(noflo.Component);

exports.getComponent = function() {
  return new Regroup;
};

});
require.register("noflo-noflo-groups/components/Group.js", function(exports, require, module){
var Group, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

Group = (function(_super) {
  __extends(Group, _super);

  function Group() {
    this.newGroups = [];
    this.inPorts = {
      "in": new noflo.Port,
      group: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on("connect", (function(_this) {
      return function() {
        var group, _i, _len, _ref, _results;
        _ref = _this.newGroups;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _results.push(_this.outPorts.out.beginGroup(group));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        var group, _i, _len, _ref;
        _ref = _this.newGroups;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _this.outPorts.out.endGroup();
        }
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.group.on("connect", (function(_this) {
      return function() {
        return _this.newGroups = [];
      };
    })(this));
    this.inPorts.group.on("data", (function(_this) {
      return function(group) {
        return _this.newGroups.push(group);
      };
    })(this));
  }

  return Group;

})(noflo.Component);

exports.getComponent = function() {
  return new Group;
};

});
require.register("noflo-noflo-groups/components/GroupZip.js", function(exports, require, module){
var GroupZip, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

GroupZip = (function(_super) {
  __extends(GroupZip, _super);

  function GroupZip() {
    this.newGroups = [];
    this.inPorts = {
      "in": new noflo.Port,
      group: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on("connect", (function(_this) {
      return function() {
        return _this.count = 0;
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        _this.outPorts.out.beginGroup(_this.newGroups[_this.count++]);
        _this.outPorts.out.send(data);
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.group.on("connect", (function(_this) {
      return function() {
        return _this.newGroups = [];
      };
    })(this));
    this.inPorts.group.on("data", (function(_this) {
      return function(group) {
        return _this.newGroups.push(group);
      };
    })(this));
  }

  return GroupZip;

})(noflo.Component);

exports.getComponent = function() {
  return new GroupZip;
};

});
require.register("noflo-noflo-groups/components/FilterByGroup.js", function(exports, require, module){
var FilterByGroup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

FilterByGroup = (function(_super) {
  __extends(FilterByGroup, _super);

  FilterByGroup.prototype.description = "Given a RegExp string, filter out groups that do not match and their children data packets/groups. Forward only the content of the matching group.";

  function FilterByGroup() {
    this.regexp = null;
    this.matchedLevel = null;
    this.inPorts = {
      "in": new noflo.Port,
      regexp: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port,
      group: new noflo.Port,
      empty: new noflo.Port
    };
    this.inPorts.regexp.on("data", (function(_this) {
      return function(regexp) {
        return _this.regexp = new RegExp(regexp);
      };
    })(this));
    this.inPorts["in"].on("connect", (function(_this) {
      return function() {
        _this.level = 0;
        return _this.hasContent = false;
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        if (_this.matchedLevel != null) {
          _this.outPorts.out.beginGroup(group);
        }
        _this.level++;
        if ((_this.matchedLevel == null) && (_this.regexp != null) && (group.match(_this.regexp) != null)) {
          _this.matchedLevel = _this.level;
          if (_this.outPorts.group.isAttached()) {
            return _this.outPorts.group.send(group);
          }
        }
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        if (_this.matchedLevel != null) {
          _this.hasContent = true;
          return _this.outPorts.out.send(data);
        }
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        if (_this.matchedLevel === _this.level) {
          _this.matchedLevel = null;
        }
        if (_this.matchedLevel != null) {
          _this.outPorts.out.endGroup();
        }
        return _this.level--;
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        if (!_this.hasContent && _this.outPorts.empty.isAttached()) {
          _this.outPorts.empty.send(null);
          _this.outPorts.empty.disconnect();
        }
        if (_this.outPorts.group.isAttached()) {
          _this.outPorts.group.disconnect();
        }
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return FilterByGroup;

})(noflo.Component);

exports.getComponent = function() {
  return new FilterByGroup;
};

});
require.register("noflo-noflo-groups/components/Objectify.js", function(exports, require, module){
var Objectify, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require("noflo");

_ = require("underscore");

Objectify = (function(_super) {
  __extends(Objectify, _super);

  Objectify.prototype.description = "specify a regexp string, use the first match as the key of an object containing the data";

  function Objectify() {
    this.regexp = null;
    this.match = null;
    this.inPorts = {
      "in": new noflo.Port,
      regexp: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts.regexp.on("data", (function(_this) {
      return function(regexp) {
        return _this.regexp = new RegExp(regexp);
      };
    })(this));
    this.inPorts["in"].on("begingroup", (function(_this) {
      return function(group) {
        if ((_this.regexp != null) && (group.match(_this.regexp) != null)) {
          _this.match = _.first(group.match(_this.regexp));
        }
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on("data", (function(_this) {
      return function(data) {
        var d;
        if (_this.match != null) {
          d = data;
          data = {};
          data[_this.match] = d;
        }
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on("endgroup", (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on("disconnect", (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Objectify;

})(noflo.Component);

exports.getComponent = function() {
  return new Objectify;
};

});
require.register("noflo-noflo-groups/components/ReadGroup.js", function(exports, require, module){
var ReadGroup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ReadGroup = (function(_super) {
  __extends(ReadGroup, _super);

  function ReadGroup() {
    this.groups = [];
    this.inPorts = {
      "in": new noflo.ArrayPort
    };
    this.outPorts = {
      out: new noflo.Port,
      group: new noflo.Port
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        _this.groups.push(group);
        _this.outPorts.group.beginGroup(group);
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.beginGroup(group);
        }
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.outPorts.out.isAttached()) {
          _this.outPorts.out.send(data);
        }
        if (!_this.groups.length) {
          return;
        }
        return _this.outPorts.group.send(_this.groups.join(':'));
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        _this.groups.pop();
        _this.outPorts.group.endGroup();
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.endGroup();
        }
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        _this.outPorts.out.disconnect();
        return _this.outPorts.group.disconnect();
      };
    })(this));
  }

  return ReadGroup;

})(noflo.Component);

exports.getComponent = function() {
  return new ReadGroup;
};

});
require.register("noflo-noflo-groups/components/SendByGroup.js", function(exports, require, module){
var SendByGroup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SendByGroup = (function(_super) {
  __extends(SendByGroup, _super);

  SendByGroup.prototype.description = 'Send packet held in "data" when receiving matching set of groups in "in"';

  SendByGroup.prototype.icon = 'share-square';

  function SendByGroup() {
    this.data = {};
    this.ungrouped = null;
    this.dataGroups = [];
    this.inGroups = [];
    this.inPorts = {
      "in": new noflo.Port('bang'),
      data: new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.ArrayPort('all')
    };
    this.inPorts.data.on('begingroup', (function(_this) {
      return function(group) {
        return _this.dataGroups.push(group);
      };
    })(this));
    this.inPorts.data.on('data', (function(_this) {
      return function(data) {
        if (!_this.dataGroups.length) {
          _this.ungrouped = data;
          return;
        }
        return _this.data[_this.groupId(_this.dataGroups)] = data;
      };
    })(this));
    this.inPorts.data.on('endgroup', (function(_this) {
      return function() {
        return _this.dataGroups.pop();
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.inGroups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        var id;
        if (!_this.inGroups.length) {
          if (_this.ungrouped !== null) {
            _this.send(_this.ungrouped);
          }
          return;
        }
        id = _this.groupId(_this.inGroups);
        if (!_this.data[id]) {
          return;
        }
        return _this.send(_this.data[id]);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.inGroups.pop();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  SendByGroup.prototype.groupId = function(groups) {
    return groups.join(':');
  };

  SendByGroup.prototype.send = function(data) {
    var group, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = this.inGroups;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      this.outPorts.out.beginGroup(group);
    }
    this.outPorts.out.send(data);
    _ref1 = this.inGroups;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      group = _ref1[_j];
      _results.push(this.outPorts.out.endGroup());
    }
    return _results;
  };

  return SendByGroup;

})(noflo.Component);

exports.getComponent = function() {
  return new SendByGroup;
};

});
require.register("noflo-noflo-groups/components/CollectGroups.js", function(exports, require, module){
var CollectGroups, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CollectGroups = (function(_super) {
  __extends(CollectGroups, _super);

  CollectGroups.prototype.description = 'Collect packets into object keyed by its groups';

  function CollectGroups() {
    this.data = {};
    this.groups = [];
    this.parents = [];
    this.inPorts = {
      "in": new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        return _this.data = {};
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        if (group === '$data') {
          _this.error('groups cannot be named \'$data\'');
          return;
        }
        _this.parents.push(_this.data);
        _this.groups.push(group);
        return _this.data = {};
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.setData(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        var data;
        data = _this.data;
        _this.data = _this.parents.pop();
        return _this.addChild(_this.data, _this.groups.pop(), data);
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        _this.outPorts.out.send(_this.data);
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  CollectGroups.prototype.addChild = function(parent, child, data) {
    if (!(child in parent)) {
      return parent[child] = data;
    }
    if (Array.isArray(parent[child])) {
      return parent[child].push(data);
    }
    return parent[child] = [parent[child], data];
  };

  CollectGroups.prototype.setData = function(data) {
    var _base;
    if ((_base = this.data).$data == null) {
      _base.$data = [];
    }
    return this.data.$data.push(data);
  };

  CollectGroups.prototype.error = function(msg) {
    if (this.outPorts.error.isAttached()) {
      this.outPorts.error.send(new Error(msg));
      this.outPorts.error.disconnect();
      return;
    }
    throw new Error(msg);
  };

  return CollectGroups;

})(noflo.Component);

exports.getComponent = function() {
  return new CollectGroups;
};

});
require.register("noflo-noflo-groups/components/CollectObject.js", function(exports, require, module){
var CollectObject, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CollectObject = (function(_super) {
  __extends(CollectObject, _super);

  CollectObject.prototype.description = 'Collect packets to an object identified by keys organized by connection';

  function CollectObject() {
    this.keys = [];
    this.allpackets = [];
    this.data = {};
    this.groups = {};
    this.inPorts = {
      keys: new noflo.ArrayPort('string'),
      allpackets: new noflo.ArrayPort('string'),
      collect: new noflo.ArrayPort('all'),
      release: new noflo.Port('bang'),
      clear: new noflo.Port('bang')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts.keys.on('data', (function(_this) {
      return function(key) {
        var keys, _i, _len, _results;
        keys = key.split(',');
        if (keys.length > 1) {
          _this.keys = [];
        }
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          key = keys[_i];
          _results.push(_this.keys.push(key));
        }
        return _results;
      };
    })(this));
    this.inPorts.allpackets.on('data', (function(_this) {
      return function(key) {
        var allpackets, _i, _len, _results;
        allpackets = key.split(',');
        if (allpackets.length > 1) {
          _this.keys = [];
        }
        _results = [];
        for (_i = 0, _len = allpackets.length; _i < _len; _i++) {
          key = allpackets[_i];
          _results.push(_this.allpackets.push(key));
        }
        return _results;
      };
    })(this));
    this.inPorts.collect.once('connect', (function(_this) {
      return function() {
        return _this.subscribeSockets();
      };
    })(this));
    this.inPorts.release.on('data', (function(_this) {
      return function() {
        return _this.release();
      };
    })(this));
    this.inPorts.release.on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.clear.on('data', (function(_this) {
      return function() {
        return _this.clear();
      };
    })(this));
  }

  CollectObject.prototype.release = function() {
    this.outPorts.out.send(this.data);
    return this.data = this.clone(this.data);
  };

  CollectObject.prototype.subscribeSockets = function() {
    return this.inPorts.collect.sockets.forEach((function(_this) {
      return function(socket, idx) {
        return _this.subscribeSocket(socket, idx);
      };
    })(this));
  };

  CollectObject.prototype.subscribeSocket = function(socket, id) {
    socket.on('begingroup', (function(_this) {
      return function(group) {
        if (!_this.groups[id]) {
          _this.groups[id] = [];
        }
        return _this.groups[id].push(group);
      };
    })(this));
    socket.on('data', (function(_this) {
      return function(data) {
        var groupId;
        if (!_this.keys[id]) {
          return;
        }
        groupId = _this.groupId(_this.groups[id]);
        if (!_this.data[groupId]) {
          _this.data[groupId] = {};
        }
        if (_this.allpackets.indexOf(_this.keys[id]) !== -1) {
          if (!_this.data[groupId][_this.keys[id]]) {
            _this.data[groupId][_this.keys[id]] = [];
          }
          _this.data[groupId][_this.keys[id]].push(data);
          return;
        }
        return _this.data[groupId][_this.keys[id]] = data;
      };
    })(this));
    return socket.on('endgroup', (function(_this) {
      return function() {
        if (!_this.groups[id]) {
          return;
        }
        return _this.groups[id].pop();
      };
    })(this));
  };

  CollectObject.prototype.groupId = function(groups) {
    if (!groups.length) {
      return 'ungrouped';
    }
    return groups[0];
  };

  CollectObject.prototype.clone = function(data) {
    var groupName, groupedData, name, newData, value;
    newData = {};
    for (groupName in data) {
      groupedData = data[groupName];
      newData[groupName] = {};
      for (name in groupedData) {
        value = groupedData[name];
        if (!groupedData.hasOwnProperty(name)) {
          continue;
        }
        newData[groupName][name] = value;
      }
    }
    return newData;
  };

  CollectObject.prototype.clear = function() {
    this.data = {};
    return this.groups = {};
  };

  return CollectObject;

})(noflo.Component);

exports.getComponent = function() {
  return new CollectObject;
};

});
require.register("noflo-noflo-groups/components/FirstGroup.js", function(exports, require, module){
var FirstGroup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

FirstGroup = (function(_super) {
  __extends(FirstGroup, _super);

  function FirstGroup() {
    this.depth = 0;
    this.inPorts = {
      "in": new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        if (_this.depth === 0) {
          _this.outPorts.out.beginGroup(group);
        }
        return _this.depth++;
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group) {
        _this.depth--;
        if (_this.depth === 0) {
          return _this.outPorts.out.endGroup();
        }
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        _this.depth = 0;
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return FirstGroup;

})(noflo.Component);

exports.getComponent = function() {
  return new FirstGroup;
};

});
require.register("noflo-noflo-groups/components/MapGroup.js", function(exports, require, module){
var MapGroup, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

MapGroup = (function(_super) {
  __extends(MapGroup, _super);

  function MapGroup() {
    this.map = {};
    this.regexps = {};
    this.inPorts = {
      map: new noflo.ArrayPort(),
      regexp: new noflo.ArrayPort(),
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts.map.on('data', (function(_this) {
      return function(data) {
        return _this.prepareMap(data);
      };
    })(this));
    this.inPorts.regexp.on('data', (function(_this) {
      return function(data) {
        return _this.prepareRegExp(data);
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.mapGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  MapGroup.prototype.prepareMap = function(map) {
    var mapParts;
    if (typeof map === 'object') {
      this.map = map;
      return;
    }
    mapParts = map.split('=');
    return this.map[mapParts[0]] = mapParts[1];
  };

  MapGroup.prototype.prepareRegExp = function(map) {
    var mapParts;
    mapParts = map.split('=');
    return this.regexps[mapParts[0]] = mapParts[1];
  };

  MapGroup.prototype.mapGroup = function(group) {
    var expression, matched, regexp, replacement, _ref;
    if (this.map[group]) {
      this.outPorts.out.beginGroup(this.map[group]);
      return;
    }
    _ref = this.regexps;
    for (expression in _ref) {
      replacement = _ref[expression];
      regexp = new RegExp(expression);
      matched = regexp.exec(group);
      if (!matched) {
        continue;
      }
      group = group.replace(regexp, replacement);
    }
    return this.outPorts.out.beginGroup(group);
  };

  return MapGroup;

})(noflo.Component);

exports.getComponent = function() {
  return new MapGroup;
};

});
require.register("noflo-noflo-groups/components/MergeGroups.js", function(exports, require, module){
var MergeGroups, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore')._;

MergeGroups = (function(_super) {
  __extends(MergeGroups, _super);

  function MergeGroups() {
    this.groups = {};
    this.data = {};
    this.inPorts = {
      "in": new noflo.ArrayPort
    };
    this.outPorts = {
      out: new noflo.ArrayPort
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group, socket) {
        return _this.addGroup(socket, group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data, socket) {
        _this.registerData(socket, data);
        return _this.checkBuffer(socket);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group, socket) {
        _this.checkBuffer(socket);
        return _this.removeGroup(socket);
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function(socket, socketId) {
        return _this.checkBuffer(socketId);
      };
    })(this));
  }

  MergeGroups.prototype.addGroup = function(socket, group) {
    if (!this.groups[socket]) {
      this.groups[socket] = [];
    }
    return this.groups[socket].push(group);
  };

  MergeGroups.prototype.removeGroup = function(socket) {
    return this.groups[socket].pop();
  };

  MergeGroups.prototype.groupId = function(socket) {
    if (!this.groups[socket]) {
      return null;
    }
    return this.groups[socket].join(':');
  };

  MergeGroups.prototype.registerData = function(socket, data) {
    var id;
    id = this.groupId(socket);
    if (!id) {
      return;
    }
    if (!this.data[id]) {
      this.data[id] = {};
    }
    return this.data[id][socket] = data;
  };

  MergeGroups.prototype.checkBuffer = function(socket) {
    var id, socketId, _i, _len, _ref;
    id = this.groupId(socket);
    if (!id) {
      return;
    }
    if (!this.data[id]) {
      return;
    }
    _ref = this.inPorts["in"].sockets;
    for (socketId = _i = 0, _len = _ref.length; _i < _len; socketId = ++_i) {
      socket = _ref[socketId];
      if (!this.data[id][socketId]) {
        return;
      }
    }
    this.outPorts.out.beginGroup(id);
    this.outPorts.out.send(this.data[id]);
    this.outPorts.out.endGroup();
    this.outPorts.out.disconnect();
    return delete this.data[id];
  };

  return MergeGroups;

})(noflo.Component);

exports.getComponent = function() {
  return new MergeGroups;
};

});
require.register("noflo-noflo-groups/components/GroupByObjectKey.js", function(exports, require, module){
var GroupByObjectKey, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GroupByObjectKey = (function(_super) {
  __extends(GroupByObjectKey, _super);

  function GroupByObjectKey() {
    this.data = [];
    this.key = null;
    this.inPorts = {
      "in": new noflo.Port(),
      key: new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        return _this.data = [];
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.key) {
          return _this.getKey(data);
        }
        return _this.data.push(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        var data, _i, _len, _ref;
        if (!_this.data.length) {
          _this.outPorts.out.disconnect();
          return;
        }
        if (!_this.key) {
          return;
        }
        _ref = _this.data;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          data = _ref[_i];
          _this.getKey(data);
        }
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts.key.on('data', (function(_this) {
      return function(data) {
        return _this.key = data;
      };
    })(this));
    this.inPorts.key.on('disconnect', (function(_this) {
      return function() {
        var data, _i, _len, _ref;
        if (!_this.data.length) {
          return;
        }
        _ref = _this.data;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          data = _ref[_i];
          _this.getKey(data);
        }
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  GroupByObjectKey.prototype.getKey = function(data) {
    var group;
    if (!this.key) {
      throw new Error('Key not defined');
    }
    if (typeof data !== 'object') {
      throw new Error('Data is not an object');
    }
    group = data[this.key];
    if (typeof data[this.key] !== 'string') {
      group = 'undefined';
    }
    if (typeof data[this.key] === 'boolean') {
      if (data[this.key]) {
        group = this.key;
      }
    }
    this.outPorts.out.beginGroup(group);
    this.outPorts.out.send(data);
    return this.outPorts.out.endGroup();
  };

  return GroupByObjectKey;

})(noflo.Component);

exports.getComponent = function() {
  return new GroupByObjectKey;
};

});
require.register("noflo-noflo-dom/index.js", function(exports, require, module){
/*
 * This file can be used for general library features that are exposed as CommonJS modules
 * that the components then utilize
 */

});
require.register("noflo-noflo-dom/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-dom","description":"Document Object Model components for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-dom","version":"0.0.1","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/AddClass.coffee","components/AppendChild.coffee","components/CreateElement.coffee","components/CreateFragment.coffee","components/GetAttribute.coffee","components/GetElement.coffee","components/HasClass.coffee","components/ReadHtml.coffee","components/RemoveElement.coffee","components/SetAttribute.coffee","components/WriteHtml.coffee","components/RemoveClass.coffee","components/RequestAnimationFrame.coffee","index.js"],"json":["component.json"],"noflo":{"icon":"html5","components":{"AddClass":"components/AddClass.coffee","AppendChild":"components/AppendChild.coffee","CreateElement":"components/CreateElement.coffee","CreateFragment":"components/CreateFragment.coffee","GetAttribute":"components/GetAttribute.coffee","GetElement":"components/GetElement.coffee","HasClass":"components/HasClass.coffee","WriteHtml":"components/WriteHtml.coffee","ReadHtml":"components/ReadHtml.coffee","RemoveElement":"components/RemoveElement.coffee","SetAttribute":"components/SetAttribute.coffee","RemoveClass":"components/RemoveClass.coffee","RequestAnimationFrame":"components/RequestAnimationFrame.coffee"}}}');
});
require.register("noflo-noflo-dom/components/AddClass.js", function(exports, require, module){
var AddClass, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AddClass = (function(_super) {
  __extends(AddClass, _super);

  AddClass.prototype.description = 'Add a class to an element';

  function AddClass() {
    this.element = null;
    this["class"] = null;
    this.inPorts = {
      element: new noflo.Port('object'),
      "class": new noflo.Port('string')
    };
    this.outPorts = {};
    this.inPorts.element.on('data', (function(_this) {
      return function(data) {
        _this.element = data;
        if (_this["class"]) {
          return _this.addClass();
        }
      };
    })(this));
    this.inPorts["class"].on('data', (function(_this) {
      return function(data) {
        _this["class"] = data;
        if (_this.element) {
          return _this.addClass();
        }
      };
    })(this));
  }

  AddClass.prototype.addClass = function() {
    return this.element.classList.add(this["class"]);
  };

  return AddClass;

})(noflo.Component);

exports.getComponent = function() {
  return new AddClass;
};

});
require.register("noflo-noflo-dom/components/AppendChild.js", function(exports, require, module){
var AppendChild, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AppendChild = (function(_super) {
  __extends(AppendChild, _super);

  AppendChild.prototype.description = 'Append elements as children of a parent element';

  function AppendChild() {
    this.parent = null;
    this.children = [];
    this.inPorts = {
      parent: new noflo.Port('object'),
      child: new noflo.Port('object')
    };
    this.outPorts = {};
    this.inPorts.parent.on('data', (function(_this) {
      return function(data) {
        _this.parent = data;
        if (_this.children.length) {
          return _this.append();
        }
      };
    })(this));
    this.inPorts.child.on('data', (function(_this) {
      return function(data) {
        if (!_this.parent) {
          _this.children.push(data);
          return;
        }
        return _this.parent.appendChild(data);
      };
    })(this));
  }

  AppendChild.prototype.append = function() {
    var child, _i, _len, _ref;
    _ref = this.children;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      this.parent.appendChild(child);
    }
    return this.children = [];
  };

  return AppendChild;

})(noflo.Component);

exports.getComponent = function() {
  return new AppendChild;
};

});
require.register("noflo-noflo-dom/components/CreateElement.js", function(exports, require, module){
var CreateElement, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CreateElement = (function(_super) {
  __extends(CreateElement, _super);

  CreateElement.prototype.description = 'Create a new DOM Element';

  function CreateElement() {
    this.tagName = null;
    this.container = null;
    this.inPorts = {
      tagname: new noflo.Port('string'),
      container: new noflo.Port('object')
    };
    this.outPorts = {
      element: new noflo.Port('object')
    };
    this.inPorts.tagname.on('data', (function(_this) {
      return function(tagName) {
        _this.tagName = tagName;
        return _this.createElement();
      };
    })(this));
    this.inPorts.tagname.on('disconnect', (function(_this) {
      return function() {
        if (!_this.inPorts.container.isAttached()) {
          return _this.outPorts.element.disconnect();
        }
      };
    })(this));
    this.inPorts.container.on('data', (function(_this) {
      return function(container) {
        _this.container = container;
        return _this.createElement();
      };
    })(this));
    this.inPorts.container.on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.element.disconnect();
      };
    })(this));
  }

  CreateElement.prototype.createElement = function() {
    var el;
    if (!this.tagName) {
      return;
    }
    if (this.inPorts.container.isAttached()) {
      if (!this.container) {
        return;
      }
    }
    el = document.createElement(this.tagName);
    if (this.container) {
      this.container.appendChild(el);
    }
    return this.outPorts.element.send(el);
  };

  return CreateElement;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateElement;
};

});
require.register("noflo-noflo-dom/components/CreateFragment.js", function(exports, require, module){
var CreateFragment, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CreateFragment = (function(_super) {
  __extends(CreateFragment, _super);

  CreateFragment.prototype.description = 'Create a new DOM DocumentFragment';

  function CreateFragment() {
    this.inPorts = {
      "in": new noflo.Port('bang')
    };
    this.outPorts = {
      fragment: new noflo.Port('object')
    };
    this.inPorts["in"].on('data', (function(_this) {
      return function() {
        return _this.outPorts.fragment.send(document.createDocumentFragment());
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.fragment.disconnect();
      };
    })(this));
  }

  return CreateFragment;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateFragment;
};

});
require.register("noflo-noflo-dom/components/GetAttribute.js", function(exports, require, module){
var GetAttribute, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetAttribute = (function(_super) {
  __extends(GetAttribute, _super);

  function GetAttribute() {
    this.attribute = null;
    this.element = null;
    this.inPorts = {
      element: new noflo.Port('object'),
      attribute: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(data) {
        _this.element = data;
        if (_this.attribute) {
          return _this.getAttribute();
        }
      };
    })(this));
    this.inPorts.attribute.on('data', (function(_this) {
      return function(data) {
        _this.attribute = data;
        if (_this.element) {
          return _this.getAttribute();
        }
      };
    })(this));
  }

  GetAttribute.prototype.getAttribute = function() {
    var value;
    value = this.element.getAttribute(this.attribute);
    this.outPorts.out.beginGroup(this.attribute);
    this.outPorts.out.send(value);
    this.outPorts.out.endGroup();
    return this.outPorts.out.disconnect();
  };

  return GetAttribute;

})(noflo.Component);

exports.getComponent = function() {
  return new GetAttribute;
};

});
require.register("noflo-noflo-dom/components/GetElement.js", function(exports, require, module){
var GetElement, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetElement = (function(_super) {
  __extends(GetElement, _super);

  GetElement.prototype.description = 'Get a DOM element matching a query';

  function GetElement() {
    this.container = null;
    this.inPorts = {
      "in": new noflo.Port('object'),
      selector: new noflo.Port('string')
    };
    this.outPorts = {
      element: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (typeof data.querySelector !== 'function') {
          _this.error('Given container doesn\'t support querySelectors');
          return;
        }
        return _this.container = data;
      };
    })(this));
    this.inPorts.selector.on('data', (function(_this) {
      return function(data) {
        return _this.select(data);
      };
    })(this));
  }

  GetElement.prototype.select = function(selector) {
    var el, element, _i, _len;
    if (this.container) {
      el = this.container.querySelectorAll(selector);
    } else {
      el = document.querySelectorAll(selector);
    }
    if (!el.length) {
      this.error("No element matching '" + selector + "' found");
      return;
    }
    for (_i = 0, _len = el.length; _i < _len; _i++) {
      element = el[_i];
      this.outPorts.element.send(element);
    }
    return this.outPorts.element.disconnect();
  };

  GetElement.prototype.error = function(msg) {
    if (this.outPorts.error.isAttached()) {
      this.outPorts.error.send(new Error(msg));
      this.outPorts.error.disconnect();
      return;
    }
    throw new Error(msg);
  };

  return GetElement;

})(noflo.Component);

exports.getComponent = function() {
  return new GetElement;
};

});
require.register("noflo-noflo-dom/components/HasClass.js", function(exports, require, module){
var HasClass, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

HasClass = (function(_super) {
  __extends(HasClass, _super);

  HasClass.prototype.description = 'Check if an element has a given class';

  function HasClass() {
    this.element = null;
    this["class"] = null;
    this.inPorts = {
      element: new noflo.Port('object'),
      "class": new noflo.Port('string')
    };
    this.outPorts = {
      element: new noflo.Port('object'),
      missed: new noflo.Port('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(data) {
        _this.element = data;
        if (_this["class"]) {
          return _this.checkClass();
        }
      };
    })(this));
    this.inPorts.element.on('disconnect', (function(_this) {
      return function() {
        _this.outPorts.element.disconnect();
        if (!_this.outPorts.missed.isAttached()) {
          return;
        }
        return _this.outPorts.missed.disconnect();
      };
    })(this));
    this.inPorts["class"].on('data', (function(_this) {
      return function(data) {
        _this["class"] = data;
        if (_this.element) {
          return _this.checkClass();
        }
      };
    })(this));
  }

  HasClass.prototype.checkClass = function() {
    if (this.element.classList.contains(this["class"])) {
      this.outPorts.element.send(this.element);
      return;
    }
    if (!this.outPorts.missed.isAttached()) {
      return;
    }
    return this.outPorts.missed.send(this.element);
  };

  return HasClass;

})(noflo.Component);

exports.getComponent = function() {
  return new HasClass;
};

});
require.register("noflo-noflo-dom/components/ReadHtml.js", function(exports, require, module){
var ReadHtml, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ReadHtml = (function(_super) {
  __extends(ReadHtml, _super);

  ReadHtml.prototype.description = 'Read HTML from an existing element';

  function ReadHtml() {
    this.inPorts = {
      container: new noflo.Port('object')
    };
    this.outPorts = {
      html: new noflo.Port('string')
    };
    this.inPorts.container.on('data', (function(_this) {
      return function(data) {
        _this.outPorts.html.send(data.innerHTML);
        return _this.outPorts.html.disconnect();
      };
    })(this));
  }

  return ReadHtml;

})(noflo.Component);

exports.getComponent = function() {
  return new ReadHtml;
};

});
require.register("noflo-noflo-dom/components/RemoveElement.js", function(exports, require, module){
var RemoveElement, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

RemoveElement = (function(_super) {
  __extends(RemoveElement, _super);

  RemoveElement.prototype.description = 'Remove an element from DOM';

  function RemoveElement() {
    this.inPorts = {
      element: new noflo.Port('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        if (!element.parentNode) {
          return;
        }
        return element.parentNode.removeChild(element);
      };
    })(this));
  }

  return RemoveElement;

})(noflo.Component);

exports.getComponent = function() {
  return new RemoveElement;
};

});
require.register("noflo-noflo-dom/components/SetAttribute.js", function(exports, require, module){
var SetAttribute, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SetAttribute = (function(_super) {
  __extends(SetAttribute, _super);

  function SetAttribute() {
    this.attribute = null;
    this.value = null;
    this.element = null;
    this.inPorts = {
      element: new noflo.Port('object'),
      attribute: new noflo.Port('string'),
      value: new noflo.Port('string')
    };
    this.outPorts = {
      element: new noflo.Port('object')
    };
    this.inPorts.element.on('data', (function(_this) {
      return function(element) {
        _this.element = element;
        if (_this.attribute && _this.value) {
          return _this.setAttribute();
        }
      };
    })(this));
    this.inPorts.attribute.on('data', (function(_this) {
      return function(attribute) {
        _this.attribute = attribute;
        if (_this.element && _this.value) {
          return _this.setAttribute();
        }
      };
    })(this));
    this.inPorts.value.on('data', (function(_this) {
      return function(value) {
        _this.value = _this.normalizeValue(value);
        if (_this.attribute && _this.element) {
          return _this.setAttribute();
        }
      };
    })(this));
  }

  SetAttribute.prototype.setAttribute = function() {
    this.element.setAttribute(this.attribute, this.value);
    this.value = null;
    if (this.outPorts.element.isAttached()) {
      this.outPorts.element.send(this.element);
      return this.outPorts.element.disconnect();
    }
  };

  SetAttribute.prototype.normalizeValue = function(value) {
    var key, newVal, val;
    if (typeof value === 'object') {
      if (toString.call(value) !== '[object Array]') {
        newVal = [];
        for (key in value) {
          val = value[key];
          newVal.push(val);
        }
        value = newVal;
      }
      return value.join(' ');
    }
    return value;
  };

  return SetAttribute;

})(noflo.Component);

exports.getComponent = function() {
  return new SetAttribute;
};

});
require.register("noflo-noflo-dom/components/WriteHtml.js", function(exports, require, module){
var WriteHtml, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

WriteHtml = (function(_super) {
  __extends(WriteHtml, _super);

  WriteHtml.prototype.description = 'Write HTML inside an existing element';

  function WriteHtml() {
    this.container = null;
    this.html = null;
    this.inPorts = {
      html: new noflo.Port('string'),
      container: new noflo.Port('object')
    };
    this.outPorts = {
      container: new noflo.Port('object')
    };
    this.inPorts.html.on('data', (function(_this) {
      return function(data) {
        _this.html = data;
        if (_this.container) {
          return _this.writeHtml();
        }
      };
    })(this));
    this.inPorts.container.on('data', (function(_this) {
      return function(data) {
        _this.container = data;
        if (_this.html !== null) {
          return _this.writeHtml();
        }
      };
    })(this));
  }

  WriteHtml.prototype.writeHtml = function() {
    this.container.innerHTML = this.html;
    this.html = null;
    if (this.outPorts.container.isAttached()) {
      this.outPorts.container.send(this.container);
      return this.outPorts.container.disconnect();
    }
  };

  return WriteHtml;

})(noflo.Component);

exports.getComponent = function() {
  return new WriteHtml;
};

});
require.register("noflo-noflo-dom/components/RemoveClass.js", function(exports, require, module){
var RemoveClass, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

RemoveClass = (function(_super) {
  __extends(RemoveClass, _super);

  RemoveClass.prototype.description = 'Remove a class from an element';

  function RemoveClass() {
    this.element = null;
    this["class"] = null;
    this.inPorts = {
      element: new noflo.Port('object'),
      "class": new noflo.Port('string')
    };
    this.outPorts = {};
    this.inPorts.element.on('data', (function(_this) {
      return function(data) {
        _this.element = data;
        if (_this["class"]) {
          return _this.removeClass();
        }
      };
    })(this));
    this.inPorts["class"].on('data', (function(_this) {
      return function(data) {
        _this["class"] = data;
        if (_this.element) {
          return _this.removeClass();
        }
      };
    })(this));
  }

  RemoveClass.prototype.removeClass = function() {
    return this.element.classList.remove(this["class"]);
  };

  return RemoveClass;

})(noflo.Component);

exports.getComponent = function() {
  return new RemoveClass;
};

});
require.register("noflo-noflo-dom/components/RequestAnimationFrame.js", function(exports, require, module){
var RequestAnimationFrame, noflo, requestAnimationFrame,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
  return window.setTimeout(function() {
    return callback(+new Date());
  }, 1000 / 60);
};

RequestAnimationFrame = (function(_super) {
  __extends(RequestAnimationFrame, _super);

  RequestAnimationFrame.prototype.description = 'Sends bangs that correspond with screen refresh rate.';

  RequestAnimationFrame.prototype.icon = 'film';

  function RequestAnimationFrame() {
    this.running = false;
    this.inPorts = {
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      out: new noflo.Port('bang')
    };
    this.inPorts.start.on('data', (function(_this) {
      return function(data) {
        _this.running = true;
        return _this.animate();
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function(data) {
        return _this.running = false;
      };
    })(this));
  }

  RequestAnimationFrame.prototype.animate = function() {
    if (this.running) {
      requestAnimationFrame(this.animate.bind(this));
      return this.outPorts.out.send(true);
    }
  };

  RequestAnimationFrame.prototype.shutdown = function() {
    return this.running = false;
  };

  return RequestAnimationFrame;

})(noflo.Component);

exports.getComponent = function() {
  return new RequestAnimationFrame;
};

});
require.register("noflo-noflo-core/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of core.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-core/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-core","description":"NoFlo Essentials","repo":"noflo/noflo-core","version":"0.1.0","author":{"name":"Henri Bergius","email":"henri.bergius@iki.fi"},"contributors":[{"name":"Kenneth Kan","email":"kenhkan@gmail.com"},{"name":"Ryan Shaw","email":"ryanshaw@unc.edu"}],"keywords":[],"dependencies":{"noflo/noflo":"*","component/underscore":"*"},"scripts":["components/Callback.coffee","components/DisconnectAfterPacket.coffee","components/Drop.coffee","components/Group.coffee","components/Kick.coffee","components/Merge.coffee","components/Output.coffee","components/Repeat.coffee","components/RepeatAsync.coffee","components/Split.coffee","components/RunInterval.coffee","components/RunTimeout.coffee","components/MakeFunction.coffee","index.js"],"json":["component.json"],"noflo":{"components":{"Callback":"components/Callback.coffee","DisconnectAfterPacket":"components/DisconnectAfterPacket.coffee","Drop":"components/Drop.coffee","Group":"components/Group.coffee","Kick":"components/Kick.coffee","Merge":"components/Merge.coffee","Output":"components/Output.coffee","Repeat":"components/Repeat.coffee","RepeatAsync":"components/RepeatAsync.coffee","Split":"components/Split.coffee","RunInterval":"components/RunInterval.coffee","RunTimeout":"components/RunTimeout.coffee","MakeFunction":"components/MakeFunction.coffee"}}}');
});
require.register("noflo-noflo-core/components/Callback.js", function(exports, require, module){
var Callback, noflo, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

_ = require('underscore')._;

Callback = (function(_super) {
  __extends(Callback, _super);

  Callback.prototype.description = 'This component calls a given callback function for each IP it receives.  The Callback component is typically used to connect NoFlo with external Node.js code.';

  Callback.prototype.icon = 'sign-out';

  function Callback() {
    this.callback = null;
    this.inPorts = {
      "in": new noflo.Port('all'),
      callback: new noflo.Port('function')
    };
    this.outPorts = {
      error: new noflo.Port('object')
    };
    this.inPorts.callback.on('data', (function(_this) {
      return function(data) {
        if (!_.isFunction(data)) {
          _this.error('The provided callback must be a function');
          return;
        }
        return _this.callback = data;
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (!_this.callback) {
          _this.error('No callback provided');
          return;
        }
        return _this.callback(data);
      };
    })(this));
  }

  Callback.prototype.error = function(msg) {
    if (this.outPorts.error.isAttached()) {
      this.outPorts.error.send(new Error(msg));
      this.outPorts.error.disconnect();
      return;
    }
    throw new Error(msg);
  };

  return Callback;

})(noflo.Component);

exports.getComponent = function() {
  return new Callback;
};

});
require.register("noflo-noflo-core/components/DisconnectAfterPacket.js", function(exports, require, module){
var DisconnectAfterPacket, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

DisconnectAfterPacket = (function(_super) {
  __extends(DisconnectAfterPacket, _super);

  DisconnectAfterPacket.prototype.description = 'Forwards any packets, but also sends a disconnect after each of them';

  DisconnectAfterPacket.prototype.icon = 'pause';

  function DisconnectAfterPacket() {
    this.inPorts = {
      "in": new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.Port('all')
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        _this.outPorts.out.send(data);
        return _this.outPorts.out.disconnect();
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
  }

  return DisconnectAfterPacket;

})(noflo.Component);

exports.getComponent = function() {
  return new DisconnectAfterPacket;
};

});
require.register("noflo-noflo-core/components/Drop.js", function(exports, require, module){
var Drop, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Drop = (function(_super) {
  __extends(Drop, _super);

  Drop.prototype.description = 'This component drops every packet it receives with no action';

  Drop.prototype.icon = 'trash-o';

  function Drop() {
    this.inPorts = {
      "in": new noflo.ArrayPort('all')
    };
    this.outPorts = {};
  }

  return Drop;

})(noflo.Component);

exports.getComponent = function() {
  return new Drop;
};

});
require.register("noflo-noflo-core/components/Group.js", function(exports, require, module){
var Group, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Group = (function(_super) {
  __extends(Group, _super);

  Group.prototype.description = 'Adds a set of groups around the packets received at each connection';

  Group.prototype.icon = 'tags';

  function Group() {
    this.groups = [];
    this.newGroups = [];
    this.threshold = null;
    this.inPorts = {
      "in": new noflo.ArrayPort('all'),
      group: new noflo.ArrayPort('string'),
      threshold: new noflo.Port('integer')
    };
    this.outPorts = {
      out: new noflo.Port('all')
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        var group, _i, _len, _ref, _results;
        _ref = _this.newGroups;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _results.push(_this.outPorts.out.beginGroup(group));
        }
        return _results;
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        var group, _i, _len, _ref;
        _ref = _this.newGroups;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          _this.outPorts.out.endGroup();
        }
        _this.outPorts.out.disconnect();
        return _this.groups = [];
      };
    })(this));
    this.inPorts.group.on('data', (function(_this) {
      return function(data) {
        var diff;
        if (_this.threshold) {
          diff = _this.newGroups.length - _this.threshold + 1;
          if (diff > 0) {
            _this.newGroups = _this.newGroups.slice(diff);
          }
        }
        return _this.newGroups.push(data);
      };
    })(this));
    this.inPorts.threshold.on('data', (function(_this) {
      return function(threshold) {
        _this.threshold = threshold;
      };
    })(this));
  }

  return Group;

})(noflo.Component);

exports.getComponent = function() {
  return new Group;
};

});
require.register("noflo-noflo-core/components/Kick.js", function(exports, require, module){
var Kick, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Kick = (function(_super) {
  __extends(Kick, _super);

  Kick.prototype.description = 'This component generates a single packet and sends it to the output port. Mostly usable for debugging, but can also be useful for starting up networks.';

  Kick.prototype.icon = 'share';

  function Kick() {
    this.data = {
      packet: null,
      group: []
    };
    this.groups = [];
    this.inPorts = {
      "in": new noflo.Port('bang'),
      data: new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.ArrayPort('all')
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function() {
        return _this.data.group = _this.groups.slice(0);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function(group) {
        return _this.groups.pop();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        _this.sendKick(_this.data);
        return _this.groups = [];
      };
    })(this));
    this.inPorts.data.on('data', (function(_this) {
      return function(data) {
        return _this.data.packet = data;
      };
    })(this));
  }

  Kick.prototype.sendKick = function(kick) {
    var group, _i, _j, _len, _len1, _ref, _ref1;
    _ref = kick.group;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      this.outPorts.out.beginGroup(group);
    }
    this.outPorts.out.send(kick.packet);
    _ref1 = kick.group;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      group = _ref1[_j];
      this.outPorts.out.endGroup();
    }
    return this.outPorts.out.disconnect();
  };

  return Kick;

})(noflo.Component);

exports.getComponent = function() {
  return new Kick;
};

});
require.register("noflo-noflo-core/components/Merge.js", function(exports, require, module){
var Merge, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Merge = (function(_super) {
  __extends(Merge, _super);

  Merge.prototype.description = 'This component receives data on multiple input ports and sends the same data out to the connected output port';

  Merge.prototype.icon = 'compress';

  function Merge() {
    this.inPorts = {
      "in": new noflo.ArrayPort('all')
    };
    this.outPorts = {
      out: new noflo.Port('all')
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        return _this.outPorts.out.connect();
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        var socket, _i, _len, _ref;
        _ref = _this.inPorts["in"].sockets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          socket = _ref[_i];
          if (socket.connected) {
            return;
          }
        }
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Merge;

})(noflo.Component);

exports.getComponent = function() {
  return new Merge;
};

});
require.register("noflo-noflo-core/components/Output.js", function(exports, require, module){
var Output, noflo, util,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

if (!noflo.isBrowser()) {
  util = require('util');
} else {
  util = {
    inspect: function(data) {
      return data;
    }
  };
}

Output = (function(_super) {
  __extends(Output, _super);

  Output.prototype.description = 'This component receives input on a single inport, and sends the data items directly to console.log';

  Output.prototype.icon = 'bug';

  function Output() {
    this.options = null;
    this.inPorts = {
      "in": new noflo.ArrayPort('all'),
      options: new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('all')
    };
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        _this.log(data);
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.send(data);
        }
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        if (_this.outPorts.out.isAttached()) {
          return _this.outPorts.out.disconnect();
        }
      };
    })(this));
    this.inPorts.options.on('data', (function(_this) {
      return function(data) {
        return _this.setOptions(data);
      };
    })(this));
  }

  Output.prototype.setOptions = function(options) {
    var key, value, _results;
    if (typeof options !== 'object') {
      throw new Error('Options is not an object');
    }
    if (this.options == null) {
      this.options = {};
    }
    _results = [];
    for (key in options) {
      if (!__hasProp.call(options, key)) continue;
      value = options[key];
      _results.push(this.options[key] = value);
    }
    return _results;
  };

  Output.prototype.log = function(data) {
    if (this.options != null) {
      return console.log(util.inspect(data, this.options.showHidden, this.options.depth, this.options.colors));
    } else {
      return console.log(data);
    }
  };

  return Output;

})(noflo.Component);

exports.getComponent = function() {
  return new Output();
};

});
require.register("noflo-noflo-core/components/Repeat.js", function(exports, require, module){
var Repeat, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Repeat = (function(_super) {
  __extends(Repeat, _super);

  Repeat.prototype.description = 'Forwards packets and metadata in the same way it receives them';

  Repeat.prototype.icon = 'forward';

  function Repeat() {
    this.inPorts = {
      "in": new noflo.Port()
    };
    this.outPorts = {
      out: new noflo.Port()
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        return _this.outPorts.out.connect();
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Repeat;

})(noflo.Component);

exports.getComponent = function() {
  return new Repeat();
};

});
require.register("noflo-noflo-core/components/RepeatAsync.js", function(exports, require, module){
var RepeatAsync, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

RepeatAsync = (function(_super) {
  __extends(RepeatAsync, _super);

  RepeatAsync.prototype.description = "Like 'Repeat', except repeat on next tick";

  RepeatAsync.prototype.icon = 'step-forward';

  function RepeatAsync() {
    this.groups = [];
    this.inPorts = {
      "in": new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.Port('all')
    };
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        var groups, later;
        groups = _this.groups;
        later = function() {
          var group, _i, _j, _len, _len1;
          for (_i = 0, _len = groups.length; _i < _len; _i++) {
            group = groups[_i];
            _this.outPorts.out.beginGroup(group);
          }
          _this.outPorts.out.send(data);
          for (_j = 0, _len1 = groups.length; _j < _len1; _j++) {
            group = groups[_j];
            _this.outPorts.out.endGroup();
          }
          return _this.outPorts.out.disconnect();
        };
        return setTimeout(later, 0);
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.groups = [];
      };
    })(this));
  }

  return RepeatAsync;

})(noflo.Component);

exports.getComponent = function() {
  return new RepeatAsync;
};

});
require.register("noflo-noflo-core/components/Split.js", function(exports, require, module){
var Split, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Split = (function(_super) {
  __extends(Split, _super);

  Split.prototype.description = 'This component receives data on a single input port and sends the same data out to all connected output ports';

  Split.prototype.icon = 'expand';

  function Split() {
    this.inPorts = {
      "in": new noflo.Port('all')
    };
    this.outPorts = {
      out: new noflo.ArrayPort('all')
    };
    this.inPorts["in"].on('connect', (function(_this) {
      return function() {
        return _this.outPorts.out.connect();
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.outPorts.out.beginGroup(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.outPorts.out.endGroup();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return Split;

})(noflo.Component);

exports.getComponent = function() {
  return new Split;
};

});
require.register("noflo-noflo-core/components/RunInterval.js", function(exports, require, module){
var RunInterval, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

RunInterval = (function(_super) {
  __extends(RunInterval, _super);

  RunInterval.prototype.description = 'Send a packet at the given interval';

  RunInterval.prototype.icon = 'clock-o';

  function RunInterval() {
    this.timer = null;
    this.interval = null;
    this.inPorts = {
      interval: new noflo.Port('number'),
      start: new noflo.Port('bang'),
      stop: new noflo.Port('bang')
    };
    this.outPorts = {
      out: new noflo.Port('bang')
    };
    this.inPorts.interval.on('data', (function(_this) {
      return function(interval) {
        _this.interval = interval;
        if (_this.timer != null) {
          clearInterval(_this.timer);
          return _this.timer = setInterval(function() {
            return _this.outPorts.out.send(true);
          }, _this.interval);
        }
      };
    })(this));
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        if (_this.timer != null) {
          clearInterval(_this.timer);
        }
        _this.outPorts.out.connect();
        return _this.timer = setInterval(function() {
          return _this.outPorts.out.send(true);
        }, _this.interval);
      };
    })(this));
    this.inPorts.stop.on('data', (function(_this) {
      return function() {
        if (!_this.timer) {
          return;
        }
        clearInterval(_this.timer);
        _this.timer = null;
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  RunInterval.prototype.shutdown = function() {
    if (this.timer != null) {
      return clearInterval(this.timer);
    }
  };

  return RunInterval;

})(noflo.Component);

exports.getComponent = function() {
  return new RunInterval;
};

});
require.register("noflo-noflo-core/components/RunTimeout.js", function(exports, require, module){
var RunTimeout, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

RunTimeout = (function(_super) {
  __extends(RunTimeout, _super);

  RunTimeout.prototype.description = 'Send a packet after the given time in ms';

  RunTimeout.prototype.icon = 'clock-o';

  function RunTimeout() {
    this.timer = null;
    this.time = null;
    this.inPorts = {
      time: new noflo.Port('number'),
      start: new noflo.Port('bang'),
      clear: new noflo.Port('bang')
    };
    this.outPorts = {
      out: new noflo.Port('bang')
    };
    this.inPorts.time.on('data', (function(_this) {
      return function(time) {
        _this.time = time;
        if (_this.timer != null) {
          clearTimeout(_this.timer);
          return _this.timer = setTimeout(function() {
            return _this.outPorts.out.send(true);
          }, _this.time);
        }
      };
    })(this));
    this.inPorts.start.on('data', (function(_this) {
      return function() {
        if (_this.timer != null) {
          clearTimeout(_this.timer);
        }
        _this.outPorts.out.connect();
        return _this.timer = setTimeout(function() {
          _this.outPorts.out.send(true);
          return _this.outPorts.out.disconnect();
        }, _this.time);
      };
    })(this));
    this.inPorts.clear.on('data', (function(_this) {
      return function() {
        if (!_this.timer) {
          return;
        }
        clearTimeout(_this.timer);
        _this.timer = null;
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  RunTimeout.prototype.shutdown = function() {
    if (this.timer != null) {
      return clearTimeout(this.timer);
    }
  };

  return RunTimeout;

})(noflo.Component);

exports.getComponent = function() {
  return new RunTimeout;
};

});
require.register("noflo-noflo-core/components/MakeFunction.js", function(exports, require, module){
var MakeFunction, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

MakeFunction = (function(_super) {
  __extends(MakeFunction, _super);

  MakeFunction.prototype.description = 'Evaluates a function each time data hits the "in" port and sends the return value to "out". Within the function "x" will be the variable from the in port. For example, to make a ^2 function input "return x*x;" to the function port.';

  MakeFunction.prototype.icon = 'code';

  function MakeFunction() {
    this.f = null;
    this.inPorts = {
      "in": new noflo.Port('all'),
      "function": new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('all'),
      "function": new noflo.Port('function'),
      error: new noflo.Port('object')
    };
    this.inPorts["function"].on('data', (function(_this) {
      return function(data) {
        var error;
        if (typeof data === "function") {
          _this.f = data;
        } else {
          try {
            _this.f = Function("x", data);
          } catch (_error) {
            error = _error;
            _this.error('Error creating function: ' + data);
          }
        }
        if (_this.f && _this.outPorts["function"].isAttached()) {
          return _this.outPorts["function"].send(_this.f);
        }
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        var error;
        if (!_this.f) {
          _this.error('No function defined');
          return;
        }
        try {
          return _this.outPorts.out.send(_this.f(data));
        } catch (_error) {
          error = _error;
          return _this.error('Error evaluating function.');
        }
      };
    })(this));
  }

  MakeFunction.prototype.error = function(msg) {
    if (this.outPorts.error.isAttached()) {
      this.outPorts.error.send(new Error(msg));
      this.outPorts.error.disconnect();
      return;
    }
    throw new Error(msg);
  };

  return MakeFunction;

})(noflo.Component);

exports.getComponent = function() {
  return new MakeFunction;
};

});
require.register("noflo-noflo-polymer/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-polymer.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-polymer/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-polymer","description":"Polymer wrapper component for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-polymer","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["lib/ComponentLoader.coffee","lib/PolymerComponent.coffee","index.js"],"files":["noflo-polymer/noflo-polymer.html"],"json":["component.json"],"noflo":{"loader":"lib/ComponentLoader"}}');
});
require.register("noflo-noflo-polymer/lib/ComponentLoader.js", function(exports, require, module){
var PolymerComponent, registerComponent;

PolymerComponent = require('./PolymerComponent');

registerComponent = function(loader, binding) {
  var bound, inPorts, name, outPorts;
  name = binding.getAttribute('name');
  inPorts = binding.getAttribute('inports').split(' ');
  outPorts = binding.getAttribute('outports').split(' ');
  bound = PolymerComponent(name, inPorts, outPorts);
  return loader.registerComponent('polymer', name, bound);
};

module.exports = function(loader) {
  var binding, bindings, _i, _len, _results;
  bindings = document.querySelectorAll('noflo-polymer');
  _results = [];
  for (_i = 0, _len = bindings.length; _i < _len; _i++) {
    binding = bindings[_i];
    _results.push(registerComponent(loader, binding));
  }
  return _results;
};

});
require.register("noflo-noflo-polymer/lib/PolymerComponent.js", function(exports, require, module){
var noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

module.exports = function(name, inports, outports) {
  var PolymerComponent;
  PolymerComponent = (function(_super) {
    __extends(PolymerComponent, _super);

    function PolymerComponent() {
      this.element = null;
      this.eventHandlers = {};
      this.inPorts = {
        selector: new noflo.Port('string'),
        element: new noflo.Port('object')
      };
      inports.forEach((function(_this) {
        return function(inport) {
          _this.inPorts[inport] = new noflo.ArrayPort('all');
          _this.inPorts[inport].on('connect', function() {
            var connected, socket, _i, _len, _ref;
            if (toString.call(_this.element[inport]) === '[object Array]') {
              connected = 0;
              _ref = _this.inPorts[inport].sockets;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                socket = _ref[_i];
                if (socket.isConnected()) {
                  connected++;
                }
              }
              if (connected !== 1) {
                return;
              }
              return _this.element[inport].splice(0, _this.element[inport].length);
            }
          });
          return _this.inPorts[inport].on('data', function(data) {
            if (typeof _this.element[inport] === 'function') {
              _this.element[inport](data);
              return;
            }
            if (toString.call(_this.element[inport]) === '[object Array]') {
              if (toString.call(data) === '[object Array]') {
                _this.element[inport] = data;
                return;
              }
              return _this.element[inport].push(data);
            } else {
              return _this.element[inport] = data;
            }
          });
        };
      })(this));
      this.outPorts = {
        element: new noflo.Port('object'),
        error: new noflo.Port('object')
      };
      outports.forEach((function(_this) {
        return function(outport) {
          _this.outPorts[outport] = new noflo.ArrayPort('all');
          return _this.eventHandlers[outport] = function(event) {
            if (!_this.outPorts[outport].isAttached()) {
              return;
            }
            return _this.outPorts[outport].send(event.detail);
          };
        };
      })(this));
      this.inPorts.selector.on('data', (function(_this) {
        return function(selector) {
          _this.element = document.querySelector(selector);
          if (!_this.element) {
            _this.error("No element matching '" + selector + "' found");
            return;
          }
          outports.forEach(function(outport) {
            if (outport === 'element') {
              return;
            }
            return _this.element.addEventListener(outport, _this.eventHandlers[outport], false);
          });
          if (_this.outPorts.element.isAttached()) {
            _this.outPorts.element.send(_this.element);
            return _this.outPorts.element.disconnect();
          }
        };
      })(this));
      this.inPorts.element.on('data', (function(_this) {
        return function(element) {
          _this.element = element;
          outports.forEach(function(outport) {
            if (outport === 'element') {
              return;
            }
            return _this.element.addEventListener(outport, _this.eventHandlers[outport], false);
          });
          if (_this.outPorts.element.isAttached()) {
            _this.outPorts.element.send(_this.element);
            return _this.outPorts.element.disconnect();
          }
        };
      })(this));
    }

    PolymerComponent.prototype.shutdown = function() {
      outports.forEach((function(_this) {
        return function(outport) {
          if (name === 'element') {
            return;
          }
          _this.element.removeEventListener(outport, _this.eventHandlers[outport], false);
          return _this.outPorts[outport].disconnect();
        };
      })(this));
      return this.element = null;
    };

    return PolymerComponent;

  })(noflo.Component);
  PolymerComponent.getComponent = function() {
    return new PolymerComponent;
  };
  return PolymerComponent;
};

});
require.register("noflo-noflo-indexeddb/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-indexeddb.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-indexeddb/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-indexeddb","description":"IndexedDB components for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-indexeddb","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/Open.coffee","components/Close.coffee","components/DeleteDatabase.coffee","components/CreateStore.coffee","components/CreateIndex.coffee","components/DeleteStore.coffee","components/UpgradeRouter.coffee","components/BeginTransaction.coffee","components/AbortTransaction.coffee","components/GetStore.coffee","components/GetIndex.coffee","components/Query.coffee","components/QueryOnly.coffee","components/QueryFrom.coffee","components/QueryTo.coffee","components/Put.coffee","components/Get.coffee","components/Delete.coffee","index.js"],"json":["component.json"],"files":["vendor/IndexedDBShim.min.js"],"noflo":{"icon":"bitbucket","components":{"Open":"components/Open.coffee","Close":"components/Close.coffee","DeleteDatabase":"components/DeleteDatabase.coffee","CreateStore":"components/CreateStore.coffee","CreateIndex":"components/CreateIndex.coffee","DeleteStore":"components/DeleteStore.coffee","UpgradeRouter":"components/UpgradeRouter.coffee","BeginTransaction":"components/BeginTransaction.coffee","AbortTransaction":"components/AbortTransaction.coffee","GetStore":"components/GetStore.coffee","GetIndex":"components/GetIndex.coffee","Query":"components/Query.coffee","QueryOnly":"components/QueryOnly.coffee","QueryFrom":"components/QueryFrom.coffee","QueryTo":"components/QueryTo.coffee","Put":"components/Put.coffee","Get":"components/Get.coffee","Delete":"components/Delete.coffee"}}}');
});
require.register("noflo-noflo-indexeddb/components/Open.js", function(exports, require, module){
var Open, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Open = (function(_super) {
  __extends(Open, _super);

  function Open() {
    this.name = null;
    this.version = null;
    this.inPorts = {
      name: new noflo.Port('name'),
      version: new noflo.Port('number')
    };
    this.outPorts = {
      upgrade: new noflo.Port('object'),
      db: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        _this.name = name;
        return _this.open();
      };
    })(this));
    this.inPorts.version.on('data', (function(_this) {
      return function(version) {
        _this.version = version;
        return _this.open();
      };
    })(this));
  }

  Open.prototype.open = function() {
    var req, version;
    if (!(this.name && this.version)) {
      return;
    }
    req = indexedDB.open(this.name, parseInt(this.version));
    this.name = null;
    version = this.version;
    this.version = null;
    req.onupgradeneeded = (function(_this) {
      return function(e) {
        _this.outPorts.upgrade.beginGroup(_this.name);
        _this.outPorts.upgrade.send({
          oldVersion: e.oldVersion,
          newVersion: version,
          db: e.target.result
        });
        _this.outPorts.upgrade.endGroup();
        return _this.outPorts.upgrade.disconnect();
      };
    })(this);
    req.onsuccess = (function(_this) {
      return function(e) {
        _this.outPorts.db.beginGroup(_this.name);
        _this.outPorts.db.send(e.target.result);
        _this.outPorts.db.endGroup();
        return _this.outPorts.db.disconnect();
      };
    })(this);
    return req.onerror = this.error.bind(this);
  };

  return Open;

})(noflo.Component);

exports.getComponent = function() {
  return new Open;
};

});
require.register("noflo-noflo-indexeddb/components/Close.js", function(exports, require, module){
var Close, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Close = (function(_super) {
  __extends(Close, _super);

  function Close() {
    this.inPorts = {
      db: new noflo.Port('object')
    };
    this.inPorts.db.on('data', function(db) {
      return db.close();
    });
  }

  return Close;

})(noflo.Component);

exports.getComponent = function() {
  return new Close;
};

});
require.register("noflo-noflo-indexeddb/components/DeleteDatabase.js", function(exports, require, module){
var DeleteDatabase, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

DeleteDatabase = (function(_super) {
  __extends(DeleteDatabase, _super);

  function DeleteDatabase() {
    this.inPorts = {
      name: new noflo.Port('string')
    };
    this.outPorts = {
      deleted: new noflo.Port('bang'),
      error: new noflo.Port('object')
    };
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        return _this.deleteDb(name);
      };
    })(this));
  }

  DeleteDatabase.prototype.deleteDb = function(name) {
    var req;
    req = indexedDB.deleteDatabase(name);
    req.onsuccess = (function(_this) {
      return function() {
        _this.outPorts.deleted.send(true);
        return _this.outPorts.deleted.disconnect();
      };
    })(this);
    return req.onerror = this.error;
  };

  return DeleteDatabase;

})(noflo.Component);

exports.getComponent = function() {
  return new DeleteDatabase;
};

});
require.register("noflo-noflo-indexeddb/components/CreateStore.js", function(exports, require, module){
var CreateStore, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CreateStore = (function(_super) {
  __extends(CreateStore, _super);

  function CreateStore() {
    this.name = null;
    this.db = null;
    this.keyPath = '';
    this.autoIncrement = false;
    this.inPorts = {
      name: new noflo.Port('name'),
      db: new noflo.Port('object'),
      keypath: new noflo.Port('name'),
      autoincrement: new noflo.Port('boolean')
    };
    this.outPorts = {
      store: new noflo.Port('object'),
      db: new noflo.Port('object'),
      error: new noflo.Port('error')
    };
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        _this.name = name;
        return _this.create();
      };
    })(this));
    this.inPorts.db.on('data', (function(_this) {
      return function(db) {
        _this.db = db;
        return _this.create();
      };
    })(this));
    this.inPorts.keypath.on('data', (function(_this) {
      return function(keyPath) {
        _this.keyPath = keyPath;
      };
    })(this));
    this.inPorts.autoincrement.on('data', (function(_this) {
      return function(autoIncrement) {
        _this.autoIncrement = autoIncrement;
      };
    })(this));
  }

  CreateStore.prototype.create = function() {
    var store;
    if (!(this.name && this.db)) {
      return;
    }
    this.db.transaction.onerror = this.error;
    store = this.db.createObjectStore(this.name, {
      keyPath: this.keyPath,
      autoIncrement: this.autoIncrement
    });
    if (store && this.outPorts.store.isAttached()) {
      this.outPorts.store.beginGroup(this.name);
      this.outPorts.store.send(store);
      this.outPorts.store.endGroup();
      this.outPorts.store.disconnect();
    }
    this.db.transaction.onerror = null;
    if (this.outPorts.db.isAttached()) {
      this.outPorts.db.send(this.db);
      this.outPorts.db.disconnect();
    }
    this.db = null;
    return this.name = null;
  };

  return CreateStore;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateStore;
};

});
require.register("noflo-noflo-indexeddb/components/CreateIndex.js", function(exports, require, module){
var CreateIndex, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CreateIndex = (function(_super) {
  __extends(CreateIndex, _super);

  function CreateIndex() {
    this.store = null;
    this.name = null;
    this.keyPath = null;
    this.unique = false;
    this.multiEntry = false;
    this.inPorts = {
      store: new noflo.Port('object'),
      name: new noflo.Port('string'),
      keypath: new noflo.Port('string'),
      unique: new noflo.Port('boolean'),
      multientry: new noflo.Port('boolean')
    };
    this.outPorts = {
      index: new noflo.Port('object'),
      store: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.store.on('data', (function(_this) {
      return function(store) {
        _this.store = store;
        return _this.create();
      };
    })(this));
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        _this.name = name;
        return _this.create();
      };
    })(this));
    this.inPorts.keypath.on('data', (function(_this) {
      return function(keyPath) {
        _this.keyPath = keyPath;
        return _this.create();
      };
    })(this));
    this.inPorts.unique.on('data', (function(_this) {
      return function(unique) {
        _this.unique = unique;
      };
    })(this));
    this.inPorts.multientry.on('data', (function(_this) {
      return function(multiEntry) {
        _this.multiEntry = multiEntry;
      };
    })(this));
  }

  CreateIndex.prototype.create = function() {
    var index;
    if (!(this.store && this.name && this.keyPath)) {
      return;
    }
    this.store.onerror = this.error.bind(this);
    index = this.store.createIndex(this.name, this.keyPath, {
      unique: this.unique,
      multiEntry: this.multiEntry
    });
    this.store.onerror = null;
    this.name = null;
    this.keyPath = null;
    if (this.outPorts.index.isAttached()) {
      this.outPorts.index.beginGroup(index.name);
      this.outPorts.index.send(index);
      this.outPorts.index.endGroup();
      this.outPorts.index.disconnect();
    }
    if (this.outPorts.store.isAttached()) {
      this.outPorts.store.send(this.store);
      this.outPorts.store.disconnect();
    }
    return this.store = null;
  };

  return CreateIndex;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateIndex;
};

});
require.register("noflo-noflo-indexeddb/components/DeleteStore.js", function(exports, require, module){
var DeleteStore, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

DeleteStore = (function(_super) {
  __extends(DeleteStore, _super);

  function DeleteStore() {
    this.name = null;
    this.db = null;
    this.inPorts = {
      name: new noflo.Port('name'),
      db: new noflo.Port('object')
    };
    this.outPorts = {
      db: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        _this.name = name;
        return _this.deleteStore();
      };
    })(this));
    this.inPorts.db.on('data', (function(_this) {
      return function(db) {
        _this.db = db;
        return _this.deleteStore();
      };
    })(this));
  }

  DeleteStore.prototype.deleteStore = function() {
    if (!(this.name && this.db)) {
      return;
    }
    this.db.transaction.onerror = this.error;
    this.db.deleteObjectStore(this.name);
    this.db.transaction.onerror = null;
    if (this.outPorts.db.isAttached()) {
      this.outPorts.db.send(this.db);
      this.outPorts.db.disconnect();
    }
    this.db = null;
    return this.name = null;
  };

  return DeleteStore;

})(noflo.Component);

exports.getComponent = function() {
  return new DeleteStore;
};

});
require.register("noflo-noflo-indexeddb/components/UpgradeRouter.js", function(exports, require, module){
var UpgradeRouter, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

UpgradeRouter = (function(_super) {
  __extends(UpgradeRouter, _super);

  function UpgradeRouter() {
    this.groups = [];
    this.inPorts = {
      upgrade: new noflo.Port('object')
    };
    this.outPorts = {
      versions: new noflo.ArrayPort('object'),
      missed: new noflo.Port('object')
    };
    this.inPorts.upgrade.on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts.upgrade.on('data', (function(_this) {
      return function(upgrade) {
        return _this.route(upgrade);
      };
    })(this));
    this.inPorts.upgrade.on('endgroup', (function(_this) {
      return function() {
        return _this.groups.pop();
      };
    })(this));
    this.inPorts.upgrade.on('disconnect', (function(_this) {
      return function() {
        return _this.groups = [];
      };
    })(this));
  }

  UpgradeRouter.prototype.route = function(upgrade) {
    var group, migration, upgraded, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
    upgraded = false;
    migration = 0;
    while (migration < upgrade.newVersion) {
      if (migration < upgrade.oldVersion) {
        migration++;
        continue;
      }
      if (!this.outPorts.versions.isAttached(migration)) {
        migration++;
        continue;
      }
      _ref = this.groups;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        group = _ref[_i];
        this.outPorts.versions.beginGroup(group, migration);
      }
      this.outPorts.versions.send(upgrade.db, migration);
      _ref1 = this.groups;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        group = _ref1[_j];
        this.outPorts.versions.endGroup(migration);
      }
      this.outPorts.versions.disconnect(migration);
      upgraded = true;
      migration++;
    }
    if (upgraded) {
      return;
    }
    if (!this.outPorts.missed.isAttached()) {
      return;
    }
    _ref2 = this.groups;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      group = _ref2[_k];
      this.outPorts.missed.beginGroup(group);
    }
    this.outPorts.missed.send(upgrade.db);
    _ref3 = this.groups;
    for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
      group = _ref3[_l];
      this.outPorts.missed.endGroup();
    }
    return this.outPorts.missed.disconnect();
  };

  return UpgradeRouter;

})(noflo.Component);

exports.getComponent = function() {
  return new UpgradeRouter;
};

});
require.register("noflo-noflo-indexeddb/components/BeginTransaction.js", function(exports, require, module){
var BeginTransaction, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

BeginTransaction = (function(_super) {
  __extends(BeginTransaction, _super);

  function BeginTransaction() {
    this.stores = null;
    this.db = null;
    this.mode = 'readwrite';
    this.inPorts = {
      stores: new noflo.Port('string'),
      db: new noflo.Port('object'),
      mode: new noflo.Port('string')
    };
    this.outPorts = {
      transaction: new noflo.Port('object'),
      db: new noflo.Port('object'),
      error: new noflo.Port('error'),
      complete: new noflo.Port('bang')
    };
    this.inPorts.stores.on('data', (function(_this) {
      return function(data) {
        _this.stores = data.split(',');
        return _this.begin();
      };
    })(this));
    this.inPorts.db.on('data', (function(_this) {
      return function(db) {
        _this.db = db;
        return _this.begin();
      };
    })(this));
    this.inPorts.mode.on('data', (function(_this) {
      return function(mode) {
        _this.mode = mode;
      };
    })(this));
  }

  BeginTransaction.prototype.begin = function() {
    var transaction;
    if (!(this.db && this.stores)) {
      return;
    }
    transaction = this.db.transaction(this.stores, this.mode);
    transaction.oncomplete = (function(_this) {
      return function() {
        if (_this.outPorts.complete.isAttached()) {
          _this.outPorts.complete.send(true);
          _this.outPorts.complete.disconnect();
        }
        transaction.onerror = null;
        return transaction.oncomplete = null;
      };
    })(this);
    transaction.onerror = this.error.bind(this);
    this.outPorts.transaction.send(transaction);
    this.outPorts.transaction.disconnect();
    if (this.outPorts.db.isAttached()) {
      this.outPorts.db.send(this.db);
      this.outPorts.db.disconnect();
    }
    return this.stores = null;
  };

  return BeginTransaction;

})(noflo.Component);

exports.getComponent = function() {
  return new BeginTransaction;
};

});
require.register("noflo-noflo-indexeddb/components/AbortTransaction.js", function(exports, require, module){
var AbortTransaction, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

AbortTransaction = (function(_super) {
  __extends(AbortTransaction, _super);

  function AbortTransaction() {
    this.inPorts = {
      transaction: new noflo.Port('object')
    };
    this.outPorts = {
      error: new noflo.Port('object')
    };
    this.inPorts.transaction.on('data', (function(_this) {
      return function(transaction) {
        transaction.onerror = _this.error.bind(_this);
        return transaction.abort();
      };
    })(this));
  }

  return AbortTransaction;

})(noflo.Component);

exports.getComponent = function() {
  return new AbortTransaction;
};

});
require.register("noflo-noflo-indexeddb/components/GetStore.js", function(exports, require, module){
var GetStore, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetStore = (function(_super) {
  __extends(GetStore, _super);

  function GetStore() {
    this.transaction = null;
    this.name = null;
    this.inPorts = {
      name: new noflo.Port('string'),
      transaction: new noflo.Port('object')
    };
    this.outPorts = {
      store: new noflo.Port('object'),
      transaction: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        _this.name = name;
        return _this.get();
      };
    })(this));
    this.inPorts.transaction.on('data', (function(_this) {
      return function(transaction) {
        _this.transaction = transaction;
        return _this.get();
      };
    })(this));
  }

  GetStore.prototype.get = function() {
    var store;
    if (!(this.name && this.transaction)) {
      return;
    }
    this.transaction.onerror = this.error;
    store = this.transaction.objectStore(this.name);
    this.transaction.onerror = null;
    this.outPorts.store.beginGroup(this.name);
    this.outPorts.store.send(store);
    this.outPorts.store.endGroup();
    this.outPorts.store.disconnect();
    if (this.outPorts.transaction.isAttached()) {
      this.outPorts.transaction.send(this.transaction);
      this.outPorts.transaction.disconnect();
    }
    this.transaction = null;
    return this.name = null;
  };

  return GetStore;

})(noflo.Component);

exports.getComponent = function() {
  return new GetStore;
};

});
require.register("noflo-noflo-indexeddb/components/GetIndex.js", function(exports, require, module){
var GetIndex, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GetIndex = (function(_super) {
  __extends(GetIndex, _super);

  function GetIndex() {
    this.store = null;
    this.name = null;
    this.inPorts = {
      store: new noflo.Port('object'),
      name: new noflo.Port('string')
    };
    this.outPorts = {
      index: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.store.on('data', (function(_this) {
      return function(store) {
        _this.store = store;
        return _this.get();
      };
    })(this));
    this.inPorts.name.on('data', (function(_this) {
      return function(name) {
        _this.name = name;
        return _this.get();
      };
    })(this));
  }

  GetIndex.prototype.get = function() {
    var index;
    if (!(this.store && this.name)) {
      return;
    }
    this.store.onerror = this.error;
    index = this.store.index(this.name);
    this.store.onerror = null;
    this.outPorts.index.beginGroup(this.name);
    this.outPorts.index.send(index);
    this.outPorts.index.endGroup();
    this.outPorts.index.disconnect();
    this.store = null;
    return this.name = null;
  };

  return GetIndex;

})(noflo.Component);

exports.getComponent = function() {
  return new GetIndex;
};

});
require.register("noflo-noflo-indexeddb/components/Query.js", function(exports, require, module){
var Query, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Query = (function(_super) {
  __extends(Query, _super);

  function Query() {
    this.step = __bind(this.step, this);
    this.store = null;
    this.range = null;
    this.all = false;
    this.inPorts = {
      store: new noflo.Port('object'),
      range: new noflo.Port('object'),
      all: new noflo.Port('bang')
    };
    this.outPorts = {
      item: new noflo.Port('all'),
      range: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.store.on('data', (function(_this) {
      return function(store) {
        _this.store = store;
        return _this.query();
      };
    })(this));
    this.inPorts.range.on('data', (function(_this) {
      return function(range) {
        _this.range = range;
        return _this.query();
      };
    })(this));
    this.inPorts.all.on('data', (function(_this) {
      return function() {
        _this.all = true;
        return _this.query();
      };
    })(this));
  }

  Query.prototype.query = function() {
    var req;
    if (!this.store) {
      return;
    }
    if (this.all) {
      req = this.store.openCursor();
      this.store = null;
      this.all = false;
      req.onsuccess = this.step;
      req.onerror = this.error;
      return;
    }
    if (this.range) {
      req = this.store.openCursor(this.range);
      this.store = null;
      if (this.outPorts.range.isAttached()) {
        this.outPorts.range.send(this.range);
        this.outPorts.range.disconnect();
      }
      this.range = null;
      req.onsuccess = this.step;
      return req.onerror = this.error;
    }
  };

  Query.prototype.step = function(e) {
    var cursor;
    cursor = e.target.result;
    if (!cursor) {
      this.outPorts.item.disconnect();
      return;
    }
    this.outPorts.item.beginGroup(cursor.key);
    this.outPorts.item.send(cursor.value);
    this.outPorts.item.endGroup();
    return cursor["continue"]();
  };

  return Query;

})(noflo.Component);

exports.getComponent = function() {
  return new Query;
};

});
require.register("noflo-noflo-indexeddb/components/QueryOnly.js", function(exports, require, module){
var QueryOnly, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

QueryOnly = (function(_super) {
  __extends(QueryOnly, _super);

  function QueryOnly() {
    this.inPorts = {
      value: new noflo.Port('all')
    };
    this.outPorts = {
      range: new noflo.Port('object')
    };
    this.inPorts.value.on('data', (function(_this) {
      return function(value) {
        _this.outPorts.range.send(IDBKeyRange.only(value));
        return _this.outPorts.range.disconnect();
      };
    })(this));
  }

  return QueryOnly;

})(noflo.Component);

exports.getComponent = function() {
  return new QueryOnly;
};

});
require.register("noflo-noflo-indexeddb/components/QueryFrom.js", function(exports, require, module){
var QueryFrom, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

QueryFrom = (function(_super) {
  __extends(QueryFrom, _super);

  function QueryFrom() {
    this.including = false;
    this.inPorts = {
      value: new noflo.Port('all'),
      including: new noflo.Port('boolean')
    };
    this.outPorts = {
      range: new noflo.Port('object')
    };
    this.inPorts.value.on('data', (function(_this) {
      return function(value) {
        _this.outPorts.range.send(IDBKeyRange.lowerBound(value, _this.including));
        return _this.outPorts.range.disconnect();
      };
    })(this));
    this.inPorts.including.on('data', (function(_this) {
      return function(including) {
        _this.including = including;
      };
    })(this));
  }

  return QueryFrom;

})(noflo.Component);

exports.getComponent = function() {
  return new QueryFrom;
};

});
require.register("noflo-noflo-indexeddb/components/QueryTo.js", function(exports, require, module){
var QueryTo, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

QueryTo = (function(_super) {
  __extends(QueryTo, _super);

  function QueryTo() {
    this.including = false;
    this.inPorts = {
      value: new noflo.Port('all'),
      including: new noflo.Port('boolean')
    };
    this.outPorts = {
      range: new noflo.Port('object')
    };
    this.inPorts.value.on('data', (function(_this) {
      return function(value) {
        _this.outPorts.range.send(IDBKeyRange.upperBound(value, _this.including));
        return _this.outPorts.range.disconnect();
      };
    })(this));
    this.inPorts.including.on('data', (function(_this) {
      return function(including) {
        _this.including = including;
      };
    })(this));
  }

  return QueryTo;

})(noflo.Component);

exports.getComponent = function() {
  return new QueryTo;
};

});
require.register("noflo-noflo-indexeddb/components/Put.js", function(exports, require, module){
var Put, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Put = (function(_super) {
  __extends(Put, _super);

  function Put() {
    this.store = null;
    this.value = null;
    this.inPorts = {
      store: new noflo.Port('object'),
      value: new noflo.Port('all')
    };
    this.outPorts = {
      store: new noflo.Port('object'),
      key: new noflo.Port('all'),
      error: new noflo.Port('object')
    };
    this.inPorts.store.on('data', (function(_this) {
      return function(store) {
        _this.store = store;
        return _this.put();
      };
    })(this));
    this.inPorts.value.on('data', (function(_this) {
      return function(value) {
        _this.value = value;
        return _this.put();
      };
    })(this));
  }

  Put.prototype.put = function() {
    var req;
    if (!(this.store && this.value)) {
      return;
    }
    req = this.store.put(this.value);
    this.value = null;
    if (this.outPorts.store.isAttached()) {
      this.outPorts.store.send(this.store);
      this.outPorts.store.disconnect();
    }
    this.store = null;
    req.onsuccess = (function(_this) {
      return function(e) {
        if (_this.outPorts.key.isAttached()) {
          _this.outPorts.key.send(e.target.result);
          return _this.outPorts.key.disconnect();
        }
      };
    })(this);
    return req.onerror = this.error.bind(this);
  };

  return Put;

})(noflo.Component);

exports.getComponent = function() {
  return new Put;
};

});
require.register("noflo-noflo-indexeddb/components/Get.js", function(exports, require, module){
var Get, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Get = (function(_super) {
  __extends(Get, _super);

  function Get() {
    this.store = null;
    this.key = null;
    this.inPorts = {
      store: new noflo.Port('object'),
      key: new noflo.Port('string')
    };
    this.outPorts = {
      store: new noflo.Port('object'),
      item: new noflo.Port('all'),
      error: new noflo.Port('object')
    };
    this.inPorts.store.on('data', (function(_this) {
      return function(store) {
        _this.store = store;
        return _this.get();
      };
    })(this));
    this.inPorts.key.on('data', (function(_this) {
      return function(key) {
        _this.key = key;
        return _this.get();
      };
    })(this));
  }

  Get.prototype.get = function() {
    var req;
    if (!(this.store && this.key)) {
      return;
    }
    req = this.store.get(this.key);
    if (this.outPorts.store.isAttached()) {
      this.outPorts.store.send(this.store);
      this.outPorts.store.disconnect();
    }
    this.store = null;
    req.onsuccess = (function(_this) {
      return function(e) {
        _this.outPorts.item.beginGroup(_this.key);
        _this.outPorts.item.send(e.target.result);
        _this.outPorts.item.endGroup();
        _this.outPorts.item.disconnect();
        return _this.key = null;
      };
    })(this);
    return req.onerror = this.error.bind(this);
  };

  return Get;

})(noflo.Component);

exports.getComponent = function() {
  return new Get;
};

});
require.register("noflo-noflo-indexeddb/components/Delete.js", function(exports, require, module){
var Delete, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Delete = (function(_super) {
  __extends(Delete, _super);

  function Delete() {
    this.store = null;
    this.key = null;
    this.inPorts = {
      store: new noflo.Port('object'),
      key: new noflo.Port('string')
    };
    this.outPorts = {
      store: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.store.on('data', (function(_this) {
      return function(store) {
        _this.store = store;
        return _this.get();
      };
    })(this));
    this.inPorts.key.on('data', (function(_this) {
      return function(key) {
        _this.key = key;
        return _this.get();
      };
    })(this));
  }

  Delete.prototype.get = function() {
    var req;
    if (!(this.store && this.key)) {
      return;
    }
    req = this.store["delete"](this.key);
    req.onsuccess = (function(_this) {
      return function(e) {
        if (_this.outPorts.store.isAttached()) {
          _this.outPorts.store.send(_this.store);
          _this.outPorts.store.disconnect();
        }
        _this.key = null;
        return _this.store = null;
      };
    })(this);
    return req.onerror = this.error;
  };

  return Delete;

})(noflo.Component);

exports.getComponent = function() {
  return new Delete;
};

});
require.register("component-reduce/index.js", function(exports, require, module){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
});
require.register("visionmedia-superagent/lib/client.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var path = req.path;

  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.path = path;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var res = new Response(self);
    if ('HEAD' == method) res.text = null;
    self.callback(null, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

});
require.register("bergie-octo/octo.js", function(exports, require, module){
/*!
 * octo.js
 * Copyright (c) 2012 Justin Palmer <justin@labratrevenge.com>
 * MIT Licensed
 */

(function() {

  if(typeof superagent === 'undefined' && require) {
    superagent = require('superagent');
    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
      btoa = require('btoa');
    }
  }

  var octo = {}

  // The main entry point for interacting with the GitHub API v3.
  //
  //      var gh = octo.api()
  //      gh.get('/events').on('success', function(events) {
  //        console.log(events);
  //      })
  //
  octo.api = function() {
    var host  = 'https://api.github.com',
        agent = superagent,
        limit,
        remaining,
        username,
        password,
        token

    function api() {}

    function pager(method, path, params) {
      var page    = 1,
          perpage = 30,
          hasnext = false,
          hasprev = false,
          headers = {},
          callbacks = {}

      var request = function() {
        var req = superagent[method](api.host() + path)

        var complete = function(res) {
          limit = ~~res.header['x-ratelimit-limit']
          remaining = ~~res.header['x-ratelimit-remaining']

          var link = res.header['link']
          hasnext = (/rel=\"next\"/i).test(link)
          hasprev = (/rel=\"next\"/).test(link)

          pager.trigger('end', res)
          if(res.ok)    pager.trigger('success', res)
          if(res.error) pager.trigger('error', res)
        }

        if(token) req.set('Authorization', 'token ' + token)

        if(!token && username && password)
          req.set('Authorization', 'Basic ' + btoa(username + ':' + password))

        req
          .set(headers)
          .query({page: page, per_page: perpage})
          .send(params)
          .end(complete)
      }

      // ### Paging
      // Each subsequent request for additional pages can easily share the same callbacks and properties.
      //
      //      var events = api.get('/events').on('end', function(response) {
      //        console.log(response.body);
      //        events.next()
      //        console.log(events.page());
      //      })
      //
      //      events()
      //
      function pager() { request() }

      // Sets or gets the current page
      //
      // Returns the pager
      pager.page = function(v) {
        if(!arguments.length) return page
        page = v

        return pager
      }

      // Sets or gets the items returned per page
      //
      // Returns the pager
      pager.perpage = function(v) {
        if(!arguments.length) return perpage
        perpage = v

        return pager
      }

      // Increments the page number by one and fires a requests for the next page
      //
      // Returns the pager
      pager.next = function() {
        page += 1
        request()

        return pager
      }

      // Decrements the page number by one and fires a request for the previous page
      //
      // Returns the pager
      pager.prev = function() {
        page -= 1
        request()

        return pager
      }

      // Determines if the server is reporting a next page of results
      pager.hasnext = function() {
        return hasnext;
      }

      // Determines if the server is reporting a previous page of results
      pager.hasprev = function() {
        return hasprev;
      }

      // Registers a callback for an event
      //
      //  Supported events:
      //
      // * `success` - Request was successful
      // * `error` - Request returned an error
      // * `end` - Request is complete
      //
      // Returns a pager
      pager.on = function(event, callback) {
        if (typeof callbacks[event] == 'undefined')
          callbacks[event] = []

        callbacks[event].push(callback)

        return pager
      }

      // Unregisters a previously registered callback
      pager.off = function(event, callback) {
        if (callbacks[event] instanceof Array) {
          var cbacks = callbacks[event], i = 0
          for (i; i < cbacks.length; i++) {
            if (cbacks[i] === callback) {
              cbacks.splice(i, 1)
              break
            }
          }
        }

        return pager
      }

      // Triggers a custom event
      pager.trigger = function(event, data) {
        if (callbacks[event] instanceof Array) {
          callbacks[event].forEach(function(callback) {
            callback.call(pager, data)
          })
        }

        return pager
      }

      // Sets a request header
      pager.set = function(key, val) {
        headers[key] = val
        return pager
      }

      return pager
    }

    // Sets or gets the GitHub API host
    // Uses https://api.github.com by default
    //
    //      var gh = octo.api().host('https://api.github.com')
    //
    // Returns the api
    api.host = function(val) {
      if(!arguments.length) return host
      host = val
      return api
    }

    // Initializes a GET request to GitHub API v3
    // Returns a pager
    api.get = function(path, params) {
      return new pager('get', path)
    }

    // Initializes a POST request to GitHub API v3
    // Returns a pager
    api.post = function(path, params) {
      return new pager('post', path, params)
    }

    // Initializes a PATCH request to GitHub API v3
    // Returns a pager
    api.patch = function(path, params) {
      return new pager('patch', path, params)
    }

    // Initializes a PUT request to GitHub API v3
    // Returns a pager
    api.put = function(path, params) {
      return new pager('put', path, params)
    }

    // Initializes a DELETE request to GitHub API v3
    // Returns a pager
    api.delete = function(path, params) {
      return new pager('delete', path, params)
    }

    // Returns the API rate limit as reported by GitHub
    api.limit = function() {
      return limit
    }

    // Returns the number of requests that can be made before the `limit` is reached
    api.remaining = function() {
      return remaining;
    }

    // Sets or gets the Basic Auth username
    // Returns the api
    api.username = function(v) {
      if(!arguments.length) return username;
      username = v

      return api
    }

    // Sets or gets the Basic Auth password
    // Returns the api
    api.password = function(v) {
      if(!arguments.length) return password;
      password = v

      return api
    }

    // Sets or gets an OAuth two token.  You can temporarily use Basic Auth to create a
    // GitHub Authorization which will grant you an OAuth token.  You can use this token in
    // your scripts
    // Returns the api
    api.token = function(v) {
      if(!arguments.length) return token;
      token = v

      return api
    }

    return api
  }

  if("undefined" != typeof exports)
    module.exports = octo
  else
    window.octo = octo

})()

});
require.register("noflo-noflo-github/index.js", function(exports, require, module){

});
require.register("noflo-noflo-github/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-github","description":"GitHub service components for the NoFlo flow-based programming environment","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-github","dependencies":{"noflo/noflo":"*","bergie/octo":"*"},"scripts":["index.js","components/CreateRepository.coffee","components/CreateOrgRepository.coffee","components/GetRepository.coffee","components/GetContents.coffee","components/GetCurrentUser.coffee","components/GetUser.coffee","components/GetStargazers.coffee","components/SetContents.coffee"],"json":["component.json"],"noflo":{"icon":"github","components":{"CreateRepository":"components/CreateRepository.coffee","CreateOrgRepository":"components/CreateOrgRepository.coffee","GetRepository":"components/GetRepository.coffee","GetContents":"components/GetContents.coffee","GetCurrentUser":"components/GetCurrentUser.coffee","GetUser":"components/GetUser.coffee","GetStargazers":"components/GetStargazers.coffee","SetContents":"components/SetContents.coffee"}}}');
});
require.register("noflo-noflo-github/components/CreateRepository.js", function(exports, require, module){
var CreateRepository, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

CreateRepository = (function(_super) {
  __extends(CreateRepository, _super);

  function CreateRepository() {
    this.token = null;
    this.inPorts = {
      "in": new noflo.Port('string'),
      token: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('object'),
      error: new noflo.Port('string')
    };
    this.inPorts.token.on('data', (function(_this) {
      return function(data) {
        return _this.token = data;
      };
    })(this));
    CreateRepository.__super__.constructor.call(this);
  }

  CreateRepository.prototype.doAsync = function(repo, callback) {
    var api, request;
    api = octo.api();
    if (!this.token) {
      callback(new Error('token required'));
      return;
    }
    api.token(this.token);
    request = api.post('/user/repos', {
      name: repo
    });
    request.on('success', (function(_this) {
      return function(res) {
        _this.outPorts.out.beginGroup(repo);
        _this.outPorts.out.send(res.body);
        _this.outPorts.out.endGroup();
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        _this.outPorts.out.disconnect();
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return CreateRepository;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new CreateRepository;
};

});
require.register("noflo-noflo-github/components/CreateOrgRepository.js", function(exports, require, module){
var CreateOrgRepository, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

CreateOrgRepository = (function(_super) {
  __extends(CreateOrgRepository, _super);

  function CreateOrgRepository() {
    this.token = null;
    this.organization = null;
    this.inPorts = {
      "in": new noflo.Port,
      org: new noflo.Port,
      token: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port,
      error: new noflo.Port
    };
    this.inPorts.org.on('data', (function(_this) {
      return function(data) {
        return _this.organization = data;
      };
    })(this));
    this.inPorts.token.on('data', (function(_this) {
      return function(data) {
        return _this.token = data;
      };
    })(this));
    CreateOrgRepository.__super__.constructor.call(this);
  }

  CreateOrgRepository.prototype.doAsync = function(repo, callback) {
    var api, request;
    api = octo.api();
    if (!this.organization) {
      callback(new Error('organization name required'));
      return;
    }
    if (!this.token) {
      callback(new Error('token required'));
      return;
    }
    api.token(this.token);
    request = api.post("/orgs/" + this.organization + "/repos", {
      name: repo
    });
    request.on('success', (function(_this) {
      return function(res) {
        _this.outPorts.out.beginGroup(repo);
        _this.outPorts.out.send(res.body);
        _this.outPorts.out.endGroup();
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        _this.outPorts.out.disconnect();
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return CreateOrgRepository;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new CreateOrgRepository;
};

});
require.register("noflo-noflo-github/components/GetRepository.js", function(exports, require, module){
var GetRepository, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

GetRepository = (function(_super) {
  __extends(GetRepository, _super);

  GetRepository.prototype.description = 'Get information about a repository';

  function GetRepository() {
    this.token = null;
    this.inPorts = {
      "in": new noflo.Port('string'),
      token: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.token.on('data', (function(_this) {
      return function(data) {
        return _this.token = data;
      };
    })(this));
    GetRepository.__super__.constructor.call(this);
  }

  GetRepository.prototype.doAsync = function(repo, callback) {
    var api, request;
    api = octo.api();
    if (this.token) {
      api.token(this.token);
    }
    request = api.get("/repos/" + repo);
    request.on('success', (function(_this) {
      return function(res) {
        _this.outPorts.out.beginGroup(repo);
        _this.outPorts.out.send(res.body);
        _this.outPorts.out.endGroup();
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        _this.outPorts.out.disconnect();
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return GetRepository;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new GetRepository;
};

});
require.register("noflo-noflo-github/components/GetContents.js", function(exports, require, module){
var GetContents, atob, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

if (!noflo.isBrowser()) {
  atob = require('atob');
} else {
  atob = window.atob;
}

GetContents = (function(_super) {
  __extends(GetContents, _super);

  GetContents.prototype.description = 'Get contents of a file or a directory';

  function GetContents() {
    this.token = null;
    this.repo = null;
    this.sendRepo = true;
    this.inPorts = {
      repository: new noflo.Port('string'),
      path: new noflo.Port('string'),
      token: new noflo.Port('string'),
      sendrepo: new noflo.Port('boolean')
    };
    this.outPorts = {
      out: new noflo.Port('string'),
      files: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.repository.on('data', (function(_this) {
      return function(data) {
        return _this.repo = data;
      };
    })(this));
    this.inPorts.sendrepo.on('data', (function(_this) {
      return function(sendRepo) {
        _this.sendRepo = sendRepo;
      };
    })(this));
    this.inPorts.token.on('data', (function(_this) {
      return function(data) {
        return _this.token = data;
      };
    })(this));
    GetContents.__super__.constructor.call(this, 'path');
  }

  GetContents.prototype.doAsync = function(path, callback) {
    var api, repo, request;
    api = octo.api();
    if (this.token) {
      api.token(this.token);
    }
    if (!this.repo) {
      callback(new Error('repository name required'));
    }
    repo = this.repo;
    request = api.get("/repos/" + repo + "/contents/" + path);
    request.on('success', (function(_this) {
      return function(res) {
        var file, _i, _len, _ref;
        if (!res.body.content) {
          if (toString.call(res.body) !== '[object Array]') {
            callback(new Error('content not found'));
            return;
          }
          if (!_this.outPorts.files.isAttached()) {
            callback(new Error('content not found'));
            return;
          }
          if (_this.sendRepo) {
            _this.outPorts.files.beginGroup(repo);
          }
          _ref = res.body;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            file = _ref[_i];
            _this.outPorts.files.send(file);
          }
          if (_this.sendRepo) {
            _this.outPorts.files.endGroup();
          }
          _this.outPorts.files.disconnect();
          callback();
          return;
        }
        if (_this.sendRepo) {
          _this.outPorts.out.beginGroup(repo);
        }
        _this.outPorts.out.beginGroup(path);
        _this.outPorts.out.send(atob(res.body.content.replace(/\s/g, '')));
        _this.outPorts.out.endGroup();
        if (_this.sendRepo) {
          _this.outPorts.out.endGroup();
        }
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        _this.outPorts.out.disconnect();
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return GetContents;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new GetContents;
};

});
require.register("noflo-noflo-github/components/GetCurrentUser.js", function(exports, require, module){
var GetCurrentUser, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

GetCurrentUser = (function(_super) {
  __extends(GetCurrentUser, _super);

  function GetCurrentUser() {
    this.token = null;
    this.inPorts = {
      token: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port,
      error: new noflo.Port
    };
    GetCurrentUser.__super__.constructor.call(this, 'token');
  }

  GetCurrentUser.prototype.doAsync = function(token, callback) {
    var api, request;
    api = octo.api();
    api.token(token);
    request = api.get("/user");
    request.on('success', (function(_this) {
      return function(res) {
        _this.outPorts.out.send(res.body);
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        _this.outPorts.out.disconnect();
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return GetCurrentUser;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new GetCurrentUser;
};

});
require.register("noflo-noflo-github/components/GetUser.js", function(exports, require, module){
var GetUser, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

GetUser = (function(_super) {
  __extends(GetUser, _super);

  function GetUser() {
    this.token = null;
    this.inPorts = {
      user: new noflo.Port,
      token: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port,
      error: new noflo.Port
    };
    this.inPorts.token.on('data', (function(_this) {
      return function(data) {
        return _this.token = data;
      };
    })(this));
    GetUser.__super__.constructor.call(this, 'user');
  }

  GetUser.prototype.doAsync = function(user, callback) {
    var api, request;
    api = octo.api();
    if (this.token) {
      api.token(this.token);
    }
    request = api.get("/users/" + user);
    request.on('success', (function(_this) {
      return function(res) {
        _this.outPorts.out.beginGroup(user);
        _this.outPorts.out.send(res.body);
        _this.outPorts.out.endGroup();
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        _this.outPorts.out.disconnect();
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return GetUser;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new GetUser;
};

});
require.register("noflo-noflo-github/components/GetStargazers.js", function(exports, require, module){
var GetStargazers, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

GetStargazers = (function(_super) {
  __extends(GetStargazers, _super);

  function GetStargazers() {
    this.token = null;
    this.inPorts = {
      repository: new noflo.Port,
      token: new noflo.Port
    };
    this.outPorts = {
      out: new noflo.Port,
      error: new noflo.Port
    };
    this.inPorts.token.on('data', (function(_this) {
      return function(data) {
        return _this.token = data;
      };
    })(this));
    GetStargazers.__super__.constructor.call(this, 'repository');
  }

  GetStargazers.prototype.doAsync = function(repository, callback) {
    var api, request;
    api = octo.api();
    if (this.token) {
      api.token(this.token);
    }
    request = api.get("/repos/" + repository + "/stargazers");
    request.on('success', (function(_this) {
      return function(res) {
        var user, _i, _len, _ref;
        _this.outPorts.out.beginGroup(repository);
        _ref = res.body;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          user = _ref[_i];
          _this.outPorts.out.send(user);
        }
        _this.outPorts.out.endGroup();
        if (request.hasnext()) {
          return request.next();
        }
        _this.outPorts.out.disconnect();
        return callback();
      };
    })(this));
    request.on('error', (function(_this) {
      return function(err) {
        return callback(err.body);
      };
    })(this));
    this.outPorts.out.connect();
    return request();
  };

  return GetStargazers;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new GetStargazers;
};

});
require.register("noflo-noflo-github/components/SetContents.js", function(exports, require, module){
var SetContents, btoa, noflo, octo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

octo = require('octo');

if (!noflo.isBrowser()) {
  btoa = require('btoa');
} else {
  btoa = window.btoa;
}

SetContents = (function(_super) {
  __extends(SetContents, _super);

  SetContents.prototype.description = 'Create or update a file in the repository';

  function SetContents() {
    this.token = null;
    this.message = null;
    this.repo = null;
    this.path = null;
    this.inPorts = {
      "in": new noflo.Port('string'),
      token: new noflo.Port('string'),
      message: new noflo.Port('string'),
      repository: new noflo.Port('string'),
      path: new noflo.Port('string')
    };
    this.outPorts = {
      out: new noflo.Port('object'),
      error: new noflo.Port('object')
    };
    this.inPorts.token.on('data', (function(_this) {
      return function(token) {
        _this.token = token;
      };
    })(this));
    this.inPorts.message.on('data', (function(_this) {
      return function(message) {
        _this.message = message;
      };
    })(this));
    this.inPorts.repository.on('data', (function(_this) {
      return function(repo) {
        _this.repo = repo;
      };
    })(this));
    this.inPorts.path.on('data', (function(_this) {
      return function(path) {
        _this.path = path;
      };
    })(this));
    SetContents.__super__.constructor.call(this, 'in');
  }

  SetContents.prototype.doAsync = function(contents, callback) {
    var api, message, path, repo, shaReq;
    if (!this.repo) {
      callback(new Error('repository name required'));
    }
    if (!this.path) {
      callback(new Error('file path required'));
    }
    if (!this.message) {
      this.message = '';
    }
    repo = this.repo;
    path = this.path;
    message = this.message;
    api = octo.api();
    if (this.token) {
      api.token(this.token);
    }
    shaReq = api.get("/repos/" + repo + "/contents/" + path);
    shaReq.on('success', (function(_this) {
      return function(shaRes) {
        var updateReq;
        updateReq = api.put("/repos/" + repo + "/contents/" + path, {
          path: path,
          message: message,
          content: btoa(contents),
          sha: shaRes.body.sha
        });
        updateReq.on('success', function(updateRes) {
          _this.outPorts.out.beginGroup(path);
          _this.outPorts.out.send(updateRes.sha);
          _this.outPorts.out.endGroup();
          _this.outPorts.out.disconnect();
          return callback();
        });
        updateReq.on('error', function(error) {
          _this.outPorts.out.disconnect();
          return callback(err.body);
        });
        return updateReq();
      };
    })(this));
    shaReq.on('error', (function(_this) {
      return function() {
        var createReq;
        createReq = api.put("/repos/" + repo + "/contents/" + path, {
          path: path,
          message: message,
          content: btoa(contents)
        });
        createReq.on('success', function(createRes) {
          _this.outPorts.out.beginGroup(path);
          _this.outPorts.out.send(createRes.sha);
          _this.outPorts.out.endGroup();
          _this.outPorts.out.disconnect();
          return callback();
        });
        createReq.on('error', function(error) {
          _this.outPorts.out.disconnect();
          return callback(err.body);
        });
        return createReq();
      };
    })(this));
    this.outPorts.out.connect();
    return shaReq();
  };

  return SetContents;

})(noflo.AsyncComponent);

exports.getComponent = function() {
  return new SetContents;
};

});
require.register("noflo-noflo-graph/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-graph.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-graph/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-graph","description":"NoFlo components for NoFlo Graph manipulation","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-graph","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/CreateGraph.coffee","components/ListenChanges.coffee","components/LoadGraph.coffee","components/LoadJson.coffee","components/SetPropertyValue.coffee","index.js"],"json":["component.json"],"noflo":{"components":{"CreateGraph":"components/CreateGraph.coffee","ListenChanges":"components/ListenChanges.coffee","LoadGraph":"components/LoadGraph.coffee","LoadJson":"components/LoadJson.coffee","SetPropertyValue":"components/SetPropertyValue.coffee"}}}');
});
require.register("noflo-noflo-graph/components/CreateGraph.js", function(exports, require, module){
var CreateGraph, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

CreateGraph = (function(_super) {
  __extends(CreateGraph, _super);

  CreateGraph.prototype.description = 'Create a NoFlo Graph instance';

  function CreateGraph() {
    this.inPorts = {
      details: new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts.details.on('data', (function(_this) {
      return function(details) {
        var graph;
        graph = new noflo.Graph(details.name);
        graph.setProperties(_this.normalizeProps(details));
        return _this.outPorts.out.send(graph);
      };
    })(this));
    this.inPorts.details.on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  CreateGraph.prototype.normalizeProps = function(details) {
    if (details.type) {
      details.environment = {
        runtime: details.type
      };
      delete details.type;
    }
    return details;
  };

  return CreateGraph;

})(noflo.Component);

exports.getComponent = function() {
  return new CreateGraph;
};

});
require.register("noflo-noflo-graph/components/ListenChanges.js", function(exports, require, module){
var noflo;

noflo = require('noflo');

exports.getComponent = function() {
  var c, listenTransactions, unsubscribe;
  c = new noflo.Component;
  c.description = 'Listen for finished change transctions on a graph';
  listenTransactions = function() {
    return c.outPorts.out.send(c.graph);
  };
  unsubscribe = function() {
    if (c.graph) {
      c.graph.removeListener('endTransaction', listenTransactions);
    }
    return c.outPorts.out.disconnect();
  };
  c.inPorts.add('in', function(event, payload) {
    if (event !== 'data') {
      return;
    }
    unsubscribe();
    c.graph = payload;
    return c.graph.on('endTransaction', listenTransactions);
  });
  c.outPorts.add('out');
  c.shutdown = unsubscribe;
  return c;
};

});
require.register("noflo-noflo-graph/components/LoadGraph.js", function(exports, require, module){
var LoadGraph, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

LoadGraph = (function(_super) {
  __extends(LoadGraph, _super);

  LoadGraph.prototype.description = 'Load a JSON or FBP string into a NoFlo graph';

  function LoadGraph() {
    this.inPorts = new noflo.InPorts({
      "in": {
        datatype: 'string',
        required: true
      }
    });
    this.outPorts = new noflo.OutPorts({
      out: {
        datatype: 'object',
        required: true
      },
      error: {
        datatype: 'object',
        required: 'false'
      }
    });
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return _this.toGraph(data);
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  LoadGraph.prototype.toGraph = function(data) {
    var e;
    if (data.indexOf('->') !== -1) {
      try {
        noflo.graph.loadFBP(data, (function(_this) {
          return function(graph) {
            return _this.outPorts.out.send(graph);
          };
        })(this));
      } catch (_error) {
        e = _error;
        this.outPorts.error.send(e);
        this.outPorts.error.disconnect();
      }
      return;
    }
    try {
      return noflo.graph.loadJSON(data, (function(_this) {
        return function(graph) {
          return _this.outPorts.out.send(graph);
        };
      })(this));
    } catch (_error) {
      e = _error;
      this.outPorts.error.send(e);
      return this.outPorts.error.disconnect();
    }
  };

  return LoadGraph;

})(noflo.Component);

exports.getComponent = function() {
  return new LoadGraph;
};

});
require.register("noflo-noflo-graph/components/LoadJson.js", function(exports, require, module){
var LoadJson, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

LoadJson = (function(_super) {
  __extends(LoadJson, _super);

  LoadJson.prototype.description = 'Convert a Graph JSON structure into a NoFlo Graph';

  function LoadJson() {
    this.inPorts = {
      "in": new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        return noflo.graph.loadJSON(data, function(graph) {
          if ((data.id && graph.properties.id !== data.id) || (data.project && graph.properties.project !== data.project)) {
            graph.setProperties({
              id: data.id,
              project: data.project
            });
          }
          return _this.outPorts.out.send(graph);
        });
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return LoadJson;

})(noflo.Component);

exports.getComponent = function() {
  return new LoadJson;
};

});
require.register("noflo-noflo-graph/components/SetPropertyValue.js", function(exports, require, module){
var SetPropertyValue, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SetPropertyValue = (function(_super) {
  __extends(SetPropertyValue, _super);

  function SetPropertyValue() {
    this.property = null;
    this.value = null;
    this.data = [];
    this.groups = [];
    this.keep = null;
    this.inPorts = {
      property: new noflo.Port('string'),
      value: new noflo.Port('all'),
      "in": new noflo.Port('object'),
      keep: new noflo.Port('boolean')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts.keep.on('data', (function(_this) {
      return function(keep) {
        return _this.keep = String(keep) === 'true';
      };
    })(this));
    this.inPorts.property.on('data', (function(_this) {
      return function(data) {
        _this.property = data;
        if (_this.value && _this.data.length) {
          return _this.addProperties();
        }
      };
    })(this));
    this.inPorts.value.on('data', (function(_this) {
      return function(data) {
        _this.value = data;
        if (_this.property && _this.data.length) {
          return _this.addProperties();
        }
      };
    })(this));
    this.inPorts["in"].on('begingroup', (function(_this) {
      return function(group) {
        return _this.groups.push(group);
      };
    })(this));
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (_this.property && _this.value) {
          _this.addProperty({
            data: data,
            group: _this.groups.slice(0)
          });
          return;
        }
        return _this.data.push({
          data: data,
          group: _this.groups.slice(0)
        });
      };
    })(this));
    this.inPorts["in"].on('endgroup', (function(_this) {
      return function() {
        return _this.groups.pop();
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        if (_this.property && _this.value) {
          _this.outPorts.out.disconnect();
        }
        if (!_this.keep) {
          return _this.value = null;
        }
      };
    })(this));
  }

  SetPropertyValue.prototype.addProperty = function(object) {
    var group, props, _i, _j, _len, _len1, _ref, _ref1, _results;
    props = {};
    props[this.property] = this.value;
    object.data.setProperties(props);
    _ref = object.group;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      this.outPorts.out.beginGroup(group);
    }
    this.outPorts.out.send(object.data);
    _ref1 = object.group;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      group = _ref1[_j];
      _results.push(this.outPorts.out.endGroup());
    }
    return _results;
  };

  SetPropertyValue.prototype.addProperties = function() {
    var object, _i, _len, _ref;
    _ref = this.data;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      object = _ref[_i];
      this.addProperty(object);
    }
    this.data = [];
    return this.outPorts.out.disconnect();
  };

  return SetPropertyValue;

})(noflo.Component);

exports.getComponent = function() {
  return new SetPropertyValue;
};

});
require.register("noflo-noflo-runtime/index.js", function(exports, require, module){
/*
 * This file can be used for general library features of noflo-runtime.
 *
 * The library features can be made available as CommonJS modules that the
 * components in this project utilize.
 */

});
require.register("noflo-noflo-runtime/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-runtime","description":"FBP Runtime handling components for NoFlo","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-runtime","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*","component/emitter":"*"},"scripts":["components/ConnectRuntime.coffee","components/ListenLibrary.coffee","components/SendGraphChanges.coffee","src/runtimes/base.coffee","src/runtimes/iframe.coffee","src/runtimes/websocket.coffee","index.js"],"json":["component.json"],"noflo":{"components":{"ConnectRuntime":"components/ConnectRuntime.coffee","ListenLibrary":"components/ListenLibrary.coffee","SendGraphChanges":"components/SendGraphChanges.coffee"}}}');
});
require.register("noflo-noflo-runtime/components/ConnectRuntime.js", function(exports, require, module){
var ConnectRuntime, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ConnectRuntime = (function(_super) {
  __extends(ConnectRuntime, _super);

  function ConnectRuntime() {
    this.element = null;
    this.inPorts = new noflo.InPorts({
      definition: {
        datatype: 'object',
        description: 'Runtime definition object',
        required: true
      },
      element: {
        datatype: 'object',
        description: 'DOM element to be set as Runtime parent element',
        required: false
      }
    });
    this.outPorts = new noflo.OutPorts({
      runtime: {
        datatype: 'object',
        description: 'FBP Runtime instance',
        required: true
      },
      error: {
        datatype: 'object',
        description: 'Runtime connection error',
        required: false
      }
    });
    this.inPorts.on('definition', 'data', (function(_this) {
      return function(data) {
        return _this.connect(data);
      };
    })(this));
    this.inPorts.on('element', 'data', (function(_this) {
      return function(element) {
        _this.element = element;
      };
    })(this));
  }

  ConnectRuntime.prototype.validate = function(definition) {
    if (!definition.protocol) {
      this.outPorts.error.send(new Error('Protocol definition required'));
      this.outPorts.error.disconnect();
      return false;
    }
    if (!definition.address) {
      this.outPorts.error.send(new Error('Address definition required'));
      this.outPorts.error.disconnect();
      return false;
    }
    return true;
  };

  ConnectRuntime.prototype.connect = function(definition) {
    var Runtime, e, rt;
    if (!this.validate(definition)) {
      return;
    }
    try {
      Runtime = require("/noflo-noflo-runtime/src/runtimes/" + definition.protocol);
    } catch (_error) {
      e = _error;
      this.outPorts.error.send(new Error("Protocol " + definition.protocol + " is not supported"));
      this.outPorts.error.disconnect();
      return;
    }
    rt = new Runtime(definition);
    if (this.element) {
      rt.setParentElement(this.element);
    }
    try {
      rt.connect();
    } catch (_error) {
      e = _error;
      this.outPorts.error.send(e);
      this.outPorts.error.disconnect();
      return;
    }
    this.outPorts.runtime.beginGroup(definition.id);
    this.outPorts.runtime.send(rt);
    this.outPorts.runtime.endGroup();
    return this.outPorts.runtime.disconnect();
  };

  return ConnectRuntime;

})(noflo.Component);

exports.getComponent = function() {
  return new ConnectRuntime;
};

});
require.register("noflo-noflo-runtime/components/ListenLibrary.js", function(exports, require, module){
var ListenLibrary, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

ListenLibrary = (function(_super) {
  __extends(ListenLibrary, _super);

  function ListenLibrary() {
    this.runtime = null;
    this.auto = true;
    this.inPorts = new noflo.InPorts({
      runtime: {
        datatype: 'object',
        description: 'FBP Runtime instance',
        required: true
      },
      list: {
        datatype: 'bang',
        description: 'Request a list of components from Runtime',
        required: false
      },
      auto: {
        datatype: 'boolean',
        description: 'Request a component list automatically on connection',
        required: false
      }
    });
    this.outPorts = new noflo.OutPorts({
      component: {
        datatype: 'object',
        description: 'Component definition received from runtime'
      },
      error: {
        datatype: 'object',
        required: false
      }
    });
    this.inPorts.on('runtime', 'data', (function(_this) {
      return function(runtime) {
        _this.runtime = runtime;
        return _this.subscribe(_this.runtime);
      };
    })(this));
    this.inPorts.on('list', 'data', (function(_this) {
      return function() {
        return _this.list();
      };
    })(this));
    this.inPorts.on('auto', 'data', (function(_this) {
      return function(data) {
        return _this.auto = String(data) === 'true';
      };
    })(this));
  }

  ListenLibrary.prototype.subscribe = function(runtime) {
    runtime.on('component', (function(_this) {
      return function(message) {
        var definition, port, _i, _j, _len, _len1, _ref, _ref1;
        if (runtime !== _this.runtime) {
          return;
        }
        if (message.payload.name === 'Graph' || message.payload.name === 'ReadDocument') {
          return;
        }
        definition = {
          name: message.payload.name,
          description: message.payload.description,
          icon: message.payload.icon,
          inports: [],
          outports: []
        };
        _ref = message.payload.inPorts;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          port = _ref[_i];
          definition.inports.push({
            name: port.id,
            type: port.type,
            array: port.array
          });
        }
        _ref1 = message.payload.outPorts;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          port = _ref1[_j];
          definition.outports.push({
            name: port.id,
            type: port.type,
            array: port.array
          });
        }
        _this.outPorts.component.beginGroup(runtime.id);
        _this.outPorts.component.send(definition);
        return _this.outPorts.component.endGroup();
      };
    })(this));
    runtime.on('disconnected', (function(_this) {
      return function() {
        if (runtime !== _this.runtime) {
          return;
        }
        return _this.outPorts.component.disconnect();
      };
    })(this));
    if (this.auto) {
      return this.list();
    }
  };

  ListenLibrary.prototype.list = function() {
    if (!this.runtime) {
      this.outPorts.error.send(new Error('No Runtime available'));
      this.outPorts.error.disconnect();
      return;
    }
    return this.runtime.sendComponent('list', '');
  };

  return ListenLibrary;

})(noflo.Component);

exports.getComponent = function() {
  return new ListenLibrary;
};

});
require.register("noflo-noflo-runtime/components/SendGraphChanges.js", function(exports, require, module){
var SendGraphChanges, noflo,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

SendGraphChanges = (function(_super) {
  __extends(SendGraphChanges, _super);

  function SendGraphChanges() {
    this.send = __bind(this.send, this);
    this.removeOutport = __bind(this.removeOutport, this);
    this.addOutport = __bind(this.addOutport, this);
    this.removeInport = __bind(this.removeInport, this);
    this.addInport = __bind(this.addInport, this);
    this.removeInitial = __bind(this.removeInitial, this);
    this.addInitial = __bind(this.addInitial, this);
    this.removeEdge = __bind(this.removeEdge, this);
    this.addEdge = __bind(this.addEdge, this);
    this.changeNode = __bind(this.changeNode, this);
    this.renameNode = __bind(this.renameNode, this);
    this.removeNode = __bind(this.removeNode, this);
    this.addNode = __bind(this.addNode, this);
    this.registerChange = __bind(this.registerChange, this);
    this.runtime = null;
    this.graph = null;
    this.changes = [];
    this.subscribed = false;
    this.inPorts = new noflo.InPorts({
      runtime: {
        datatype: 'object',
        description: 'FBP Runtime instance',
        required: true
      },
      graph: {
        datatype: 'object',
        description: 'Graph to listen to',
        required: true
      }
    });
    this.outPorts = new noflo.OutPorts({
      queued: {
        datatype: 'int',
        description: 'Number of changes in queue',
        required: false
      },
      sent: {
        datatype: 'bang',
        description: 'Notification that changes have been transmitted',
        required: false
      }
    });
    this.inPorts.on('runtime', 'data', (function(_this) {
      return function(runtime) {
        _this.runtime = runtime;
        _this.changes = [];
        return _this.subscribe();
      };
    })(this));
    this.inPorts.on('graph', 'data', (function(_this) {
      return function(graph) {
        if (_this.graph) {
          _this.unsubscribe();
        }
        _this.changes = [];
        _this.graph = graph;
        return _this.subscribe();
      };
    })(this));
  }

  SendGraphChanges.prototype.subscribe = function() {
    if (this.subscribed) {
      return;
    }
    if (!this.runtime || !this.graph) {
      return;
    }
    this.graph.on('endTransaction', this.send);
    this.graph.on('addNode', this.addNode);
    this.graph.on('removeNode', this.removeNode);
    this.graph.on('renameNode', this.renameNode);
    this.graph.on('addEdge', this.addEdge);
    this.graph.on('removeEdge', this.removeEdge);
    this.graph.on('addInitial', this.addInitial);
    this.graph.on('removeInitial', this.removeInitial);
    this.graph.on('addInport', this.addInport);
    this.graph.on('removeInport', this.removeInport);
    this.graph.on('addOutport', this.addOutport);
    this.graph.on('removeOutport', this.removeOutport);
    this.graph.on('changeNode', this.changeNode);
    return this.subscribed = true;
  };

  SendGraphChanges.prototype.unsubscribe = function() {
    if (!this.graph) {
      return;
    }
    this.graph.removeListener('endTransaction', this.send);
    this.graph.removeListener('addNode', this.addNode);
    this.graph.removeListener('removeNode', this.removeNode);
    this.graph.removeListener('renameNode', this.renameNode);
    this.graph.removeListener('addEdge', this.addEdge);
    this.graph.removeListener('removeEdge', this.removeEdge);
    this.graph.removeListener('addInitial', this.addInitial);
    this.graph.removeListener('removeInitial', this.removeInitial);
    this.graph.removeListener('addInport', this.addInport);
    this.graph.removeListener('removeInport', this.removeInport);
    this.graph.removeListener('addOutport', this.addOutport);
    this.graph.removeListener('removeOutport', this.removeOutport);
    this.graph.removeListener('changeNode', this.changeNode);
    this.subscribed = false;
    this.outPorts.sent.disconnect();
    return this.outPorts.queued.disconnect();
  };

  SendGraphChanges.prototype.registerChange = function(topic, payload) {
    this.changes.push({
      topic: topic,
      payload: payload
    });
    return this.outPorts.queued.send(this.changes.length);
  };

  SendGraphChanges.prototype.addNode = function(node) {
    return this.registerChange('addnode', {
      id: node.id,
      component: node.component,
      metadata: node.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.removeNode = function(node) {
    return this.registerChange('removenode', {
      id: node.id,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.renameNode = function(from, to) {
    return this.registerChange('renamenode', {
      from: from,
      to: to,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.changeNode = function(node) {
    return this.registerChange('changenode', {
      id: node.id,
      component: node.component,
      metadata: node.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.addEdge = function(edge) {
    return this.registerChange('addedge', {
      src: {
        node: edge.from.node,
        port: edge.from.port
      },
      tgt: {
        node: edge.to.node,
        port: edge.to.port
      },
      metadata: edge.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.removeEdge = function(edge) {
    return this.registerChange('removeedge', {
      src: {
        node: edge.from.node,
        port: edge.from.port
      },
      tgt: {
        node: edge.to.node,
        port: edge.to.port
      },
      metadata: edge.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.addInitial = function(iip) {
    return this.registerChange('addinitial', {
      src: {
        data: iip.from.data
      },
      tgt: {
        node: iip.to.node,
        port: iip.to.port
      },
      metadata: iip.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.removeInitial = function(iip) {
    return this.registerChange('removeinitial', {
      tgt: {
        node: iip.to.node,
        port: iip.to.port
      },
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.addInport = function(pub, priv) {
    return this.registerChange('addinport', {
      "public": pub,
      node: priv.process,
      port: priv.port,
      metadata: priv.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.removeInport = function(pub) {
    return this.registerChange('removeinport', {
      "public": pub,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.addOutport = function(pub, priv) {
    return this.registerChange('addoutport', {
      "public": pub,
      node: priv.process,
      port: priv.port,
      metadata: priv.metadata,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.removeOutport = function(pub) {
    return this.registerChange('removeoutport', {
      "public": pub,
      graph: this.graph.properties.id
    });
  };

  SendGraphChanges.prototype.send = function() {
    var change;
    if (!this.runtime) {
      return;
    }
    while (this.changes.length) {
      change = this.changes.shift();
      this.runtime.sendGraph(change.topic, change.payload);
    }
    if (this.graph) {
      this.outPorts.sent.beginGroup(this.graph.properties.id);
    }
    this.outPorts.sent.send(true);
    if (this.graph) {
      this.outPorts.sent.endGroup();
    }
    return this.outPorts.queued.send(this.changes.length);
  };

  SendGraphChanges.prototype.shutdown = function() {
    return this.unsubscribe();
  };

  return SendGraphChanges;

})(noflo.Component);

exports.getComponent = function() {
  return new SendGraphChanges;
};

});
require.register("noflo-noflo-runtime/src/runtimes/base.js", function(exports, require, module){
var BaseRuntime, EventEmitter,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('emitter');

BaseRuntime = (function(_super) {
  __extends(BaseRuntime, _super);

  function BaseRuntime(definition) {
    this.definition = definition;
    this.graph = null;
  }

  BaseRuntime.prototype.setMain = function(graph) {
    this.graph = graph;
  };

  BaseRuntime.prototype.getType = function() {
    return this.definition.protocol;
  };

  BaseRuntime.prototype.getAddress = function() {
    return this.definition.address;
  };

  BaseRuntime.prototype.connect = function() {};

  BaseRuntime.prototype.disconnect = function() {};

  BaseRuntime.prototype.reconnect = function() {
    this.disconnect();
    return this.connect();
  };

  BaseRuntime.prototype.start = function() {
    if (!this.graph) {
      throw new Error('No graph defined for execution');
    }
    return this.sendNetwork('start', {
      graph: this.graph.properties.id
    });
  };

  BaseRuntime.prototype.stop = function() {
    if (!this.graph) {
      throw new Error('No graph defined for execution');
    }
    return this.sendNetwork('stop', {
      graph: this.graph.properties.id
    });
  };

  BaseRuntime.prototype.setParentElement = function(parent) {};

  BaseRuntime.prototype.getElement = function() {};

  BaseRuntime.prototype.recvComponent = function(command, payload) {
    switch (command) {
      case 'error':
        return this.emit('network', {
          command: command,
          payload: payload
        });
      default:
        return this.emit('component', {
          command: command,
          payload: payload
        });
    }
  };

  BaseRuntime.prototype.recvGraph = function(command, payload) {
    return this.emit('graph', {
      command: command,
      payload: payload
    });
  };

  BaseRuntime.prototype.recvNetwork = function(command, payload) {
    switch (command) {
      case 'started':
        return this.emit('execution', {
          running: true,
          label: 'running'
        });
      case 'stopped':
        return this.emit('execution', {
          running: false,
          label: 'stopped'
        });
      case 'icon':
        return this.emit('icon', payload);
      default:
        return this.emit('network', {
          command: command,
          payload: payload
        });
    }
  };

  BaseRuntime.prototype.sendGraph = function(command, payload) {
    return this.send('graph', command, payload);
  };

  BaseRuntime.prototype.sendNetwork = function(command, payload) {
    return this.send('network', command, payload);
  };

  BaseRuntime.prototype.sendComponent = function(command, payload) {
    return this.send('component', command, payload);
  };

  BaseRuntime.prototype.send = function(protocol, command, payload) {};

  return BaseRuntime;

})(EventEmitter);

module.exports = BaseRuntime;

});
require.register("noflo-noflo-runtime/src/runtimes/iframe.js", function(exports, require, module){
var Base, IframeRuntime,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

IframeRuntime = (function(_super) {
  __extends(IframeRuntime, _super);

  function IframeRuntime(definition) {
    this.onMessage = __bind(this.onMessage, this);
    this.onLoaded = __bind(this.onLoaded, this);
    this.updateIframe = __bind(this.updateIframe, this);
    this.origin = window.location.origin;
    this.iframe = null;
    IframeRuntime.__super__.constructor.call(this, definition);
  }

  IframeRuntime.prototype.getElement = function() {
    return this.iframe;
  };

  IframeRuntime.prototype.setMain = function(graph) {
    if (this.graph) {
      this.graph.removeListener('changeProperties', this.updateIframe);
    }
    graph.on('changeProperties', this.updateIframe);
    return IframeRuntime.__super__.setMain.call(this, graph);
  };

  IframeRuntime.prototype.setParentElement = function(parent) {
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('sandbox', 'allow-scripts');
    return parent.appendChild(this.iframe);
  };

  IframeRuntime.prototype.connect = function() {
    if (!this.iframe) {
      throw new Exception('Unable to connect without a parent element');
    }
    this.iframe.addEventListener('load', this.onLoaded, false);
    this.emit('status', {
      online: false,
      label: 'connecting'
    });
    this.iframe.setAttribute('src', this.getAddress());
    this.iframe.id = 'preview-iframe';
    this.on('connected', this.updateIframe);
    return window.addEventListener('message', this.onMessage, false);
  };

  IframeRuntime.prototype.updateIframe = function() {
    var env;
    if (!this.iframe || !this.graph) {
      return;
    }
    env = this.graph.properties.environment;
    if (!env || !env.content) {
      return;
    }
    return this.send('iframe', 'setcontent', env.content);
  };

  IframeRuntime.prototype.disconnect = function() {
    this.iframe.removeEventListener('load', this.onLoaded, false);
    window.removeEventListener('message', this.onMessage, false);
    return this.emit('status', {
      online: false,
      label: 'disconnected'
    });
  };

  IframeRuntime.prototype.onLoaded = function() {
    this.emit('status', {
      online: true,
      label: 'connected'
    });
    return this.emit('connected');
  };

  IframeRuntime.prototype.send = function(protocol, command, payload) {
    var e, w;
    w = this.iframe.contentWindow;
    if (!w) {
      return;
    }
    try {
      if (w.location.href === 'about:blank') {
        return;
      }
      if (w.location.href.indexOf('chrome-extension://') !== -1) {
        throw new Error('Use * for IFRAME communications in a Chrome app');
      }
    } catch (_error) {
      e = _error;
      w.postMessage({
        protocol: protocol,
        command: command,
        payload: payload
      }, '*');
      return;
    }
    return w.postMessage({
      protocol: protocol,
      command: command,
      payload: payload
    }, w.location.href);
  };

  IframeRuntime.prototype.onMessage = function(message) {
    switch (message.data.protocol) {
      case 'graph':
        return this.recvGraph(message.data.command, message.data.payload);
      case 'network':
        return this.recvNetwork(message.data.command, message.data.payload);
      case 'component':
        return this.recvComponent(message.data.command, message.data.payload);
    }
  };

  return IframeRuntime;

})(Base);

module.exports = IframeRuntime;

});
require.register("noflo-noflo-runtime/src/runtimes/websocket.js", function(exports, require, module){
var Base, WebSocketRuntime,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Base = require('./base');

WebSocketRuntime = (function(_super) {
  __extends(WebSocketRuntime, _super);

  function WebSocketRuntime(definition) {
    this.handleMessage = __bind(this.handleMessage, this);
    this.handleError = __bind(this.handleError, this);
    this.connecting = false;
    this.connection = null;
    this.protocol = 'noflo';
    this.buffer = [];
    WebSocketRuntime.__super__.constructor.call(this, definition);
  }

  WebSocketRuntime.prototype.getElement = function() {
    var console;
    console = document.createElement('pre');
    this.on('network', function(message) {
      if (message.command !== 'output') {
        return;
      }
      console.innerHTML = "" + console.innerHTML + message.payload.message + "\n";
      return console.scrollTop = console.scrollHeight;
    });
    this.on('disconnected', function() {
      return console.innerHTML = '';
    });
    return console;
  };

  WebSocketRuntime.prototype.connect = function() {
    if (this.connection || this.connecting) {
      return;
    }
    this.connection = new WebSocket(this.getAddress());
    this.connection.addEventListener('open', (function(_this) {
      return function() {
        _this.connecting = false;
        _this.emit('status', {
          online: true,
          label: 'connected'
        });
        _this.emit('connected');
        return _this.flush();
      };
    })(this), false);
    this.connection.addEventListener('message', this.handleMessage, false);
    this.connection.addEventListener('error', this.handleError, false);
    this.connection.addEventListener('close', (function(_this) {
      return function() {
        _this.connection = null;
        _this.emit('status', {
          online: false,
          label: 'disconnected'
        });
        return _this.emit('disconnected');
      };
    })(this), false);
    return this.connecting = true;
  };

  WebSocketRuntime.prototype.disconnect = function() {
    if (!this.connection) {
      return;
    }
    this.connecting = false;
    return this.connection.close();
  };

  WebSocketRuntime.prototype.send = function(protocol, command, payload) {
    if (this.connecting) {
      this.buffer.push({
        protocol: protocol,
        command: command,
        payload: payload
      });
      return;
    }
    if (!this.connection) {
      return;
    }
    return this.connection.send(JSON.stringify({
      protocol: protocol,
      command: command,
      payload: payload
    }));
  };

  WebSocketRuntime.prototype.handleError = function(error) {
    this.connection = null;
    return this.connecting = false;
  };

  WebSocketRuntime.prototype.handleMessage = function(message) {
    var reader, that;
    that = this;
    reader = new FileReader;
    reader.addEventListener("loadend", function(e) {
      var contents, msg;
      contents = e.target.result;
      msg = JSON.parse(contents);
      switch (msg.protocol) {
        case 'graph':
          return that.recvGraph(msg.command, msg.payload);
        case 'network':
          return that.recvNetwork(msg.command, msg.payload);
        case 'component':
          return that.recvComponent(msg.command, msg.payload);
      }
    });
    return reader.readAsText(message.data);
  };

  WebSocketRuntime.prototype.flush = function() {
    var item, _i, _len, _ref;
    _ref = this.buffer;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      this.send(item.protocol, item.command, item.payload);
    }
    return this.buffer = [];
  };

  return WebSocketRuntime;

})(Base);

module.exports = WebSocketRuntime;

});
require.register("the-grid-flowhub-registry/index.js", function(exports, require, module){
var superagent = require('superagent');
var defaults = {
  host: 'https://api.flowhub.io'
};

exports.Runtime = function (runtime, options) {
  if (typeof runtime !== 'object') {
    throw new Error('Runtime options expected');
  }
  if (!runtime.id) {
    throw new Error('Runtime requires an UUID');
  }

  this.runtime = runtime;
  this.options = {};
  Object.keys(defaults).forEach(function (name) {
    this.options[name] = defaults[name];
  }.bind(this));

  if (options) {
    Object.keys(options).forEach(function (name) {
      this.options[name] = options[name];
    }.bind(this));
  }
};

exports.Runtime.prototype.register = function (callback) {
  if (!this.runtime.user) {
    throw new Error('Runtime registration requires a user UUID');
  }
  if (!this.runtime.address) {
    throw new Error('Runtime registration requires an address URL');
  }
  if (!this.runtime.protocol) {
    throw new Error('Runtime registration requires a protocol');
  }
  if (!this.runtime.type) {
    throw new Error('Runtime registration requires a type');
  }
  superagent.put(this.options.host + '/runtimes/' + this.runtime.id)
  .send(this.runtime)
  .end(callback);
};

exports.Runtime.prototype.ping = function (callback) {
  superagent.post(this.options.host + '/runtimes/' + this.runtime.id)
  .send({})
  .end(function (err, res) {
    if (callback) {
      callback(err);
    }
  });
};

exports.Runtime.prototype.get = function (token, callback) {
  if (!token) {
    throw new Error('API token required for fetching');
  }
  superagent.get(this.options.host + '/runtimes/' + this.runtime.id)
  .set('Authorization', 'Bearer ' + token)
  .end(function (err, res) {
    if (err) {
      callback(err);
      return;
    }
    Object.keys(res.body).forEach(function (name) {
      if (name == 'seen' || name == 'registered') {
        this.runtime[name] = new Date(res.body[name]);
        return;
      }
      this.runtime[name] = res.body[name];
    }.bind(this));
    callback(null, this.runtime);
  }.bind(this));
};


exports.Runtime.prototype.del = function (token, callback) {
  if (!token) {
    throw new Error('API token required for deletion');
  }
  superagent.del(this.options.host + '/runtimes/' + this.runtime.id)
  .set('Authorization', 'Bearer ' + token)
  .end(callback);
};

exports.list = function (token, options, callback) {
  if (!token) {
    throw new Error('API token required for fetching');
  }
  if (!callback) {
    callback = options;
    options = {};
  }

  Object.keys(defaults).forEach(function (name) {
    if (options[name]) {
      return;
    }
    options[name] = defaults[name];
  }.bind(this));

  superagent.get(options.host + '/runtimes/')
  .set('Authorization', 'Bearer ' + token)
  .end(function (err, res) {
    if (err) {
      callback(err);
      return;
    }
    var results = [];
    res.body.forEach(function (result) {
      result.registered = new Date(result.registered);
      result.seen = new Date(result.seen);
      results.push(new exports.Runtime(result, options));
    });
    callback(null, results);
  });
};

});
require.register("gjohnson-uuid/index.js", function(exports, require, module){

/**
 * Taken straight from jed's gist: https://gist.github.com/982883
 *
 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 * where each x is replaced with a random hexadecimal digit from 0 to f, and
 * y is replaced with a random hexadecimal digit from 8 to b.
 */

module.exports = function uuid(a){
  return a           // if the placeholder was passed, return
    ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a/4         // 8 to 11
      ).toString(16) // in hexadecimal
    : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
        /[018]/g,    // zeroes, ones, and eights with
        uuid         // random hex digits
      )
};
});
require.register("noflo-ui/index.js", function(exports, require, module){

});
require.register("noflo-ui/component.json", function(exports, require, module){
module.exports = JSON.parse('{"name":"noflo-ui","description":"NoFlo Development Environment","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-ui","version":"0.1.0","keywords":["fbp","noflo","graph","visual","dataflow"],"dependencies":{"noflo/noflo":"*","noflo/noflo-strings":"*","noflo/noflo-ajax":"*","noflo/noflo-localstorage":"*","noflo/noflo-interaction":"*","noflo/noflo-objects":"*","noflo/noflo-groups":"*","noflo/noflo-dom":"*","noflo/noflo-core":"*","noflo/noflo-polymer":"*","noflo/noflo-indexeddb":"*","noflo/noflo-github":"*","noflo/noflo-graph":"*","noflo/noflo-runtime":"*","the-grid/flowhub-registry":"*","gjohnson/uuid":"*"},"noflo":{"components":{"ConnectRuntime":"components/ConnectRuntime.coffee","GenerateId":"components/GenerateId.coffee","IgnoreExamples":"components/IgnoreExamples.coffee","Router":"components/Router.coffee","MigrateLocalStorage":"components/MigrateLocalStorage.coffee","MakePath":"components/MakePath.coffee"}},"main":"index.js","scripts":["index.js","components/ConnectRuntime.coffee","components/GenerateId.coffee","components/IgnoreExamples.coffee","components/Router.coffee","components/MigrateLocalStorage.coffee","components/MakePath.coffee","src/JournalStore.coffee"],"json":["component.json"],"files":["css/noflo-ui.css","preview/iframe.html","preview/package.json","preview/component.json","index.html","noflo.ico","app/noflo-200.png","examples.json"]}');
});
require.register("noflo-ui/components/ConnectRuntime.js", function(exports, require, module){
var ConnectRuntime, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

noflo = require('noflo');

ConnectRuntime = (function(_super) {
  __extends(ConnectRuntime, _super);

  function ConnectRuntime() {
    this.editor = null;
    this.runtime = null;
    this.connected = false;
    this.project = null;
    this.example = null;
    this.inPorts = {
      editor: new noflo.Port('object'),
      project: new noflo.Port('object'),
      newgraph: new noflo.Port('object'),
      example: new noflo.Port('object'),
      runtime: new noflo.Port('object')
    };
    this.outPorts = {
      editor: new noflo.Port('object'),
      packet: new noflo.Port('object')
    };
    this.inPorts.editor.on('data', (function(_this) {
      return function(editor) {
        _this.editor = editor;
        _this.connect(_this.editor, _this.runtime);
        if (_this.outPorts.editor.isAttached()) {
          _this.outPorts.editor.send(_this.editor);
          return _this.outPorts.editor.disconnect();
        }
      };
    })(this));
    this.inPorts.project.on('data', (function(_this) {
      return function(project) {
        _this.project = project;
        return _this.example = null;
      };
    })(this));
    this.inPorts.newgraph.on('data', (function(_this) {
      return function(data) {
        return _this.sendGraph(_this.runtime, data);
      };
    })(this));
    this.inPorts.example.on('data', (function(_this) {
      return function(example) {
        _this.example = example;
        return _this.sendGraph(_this.runtime, _this.example);
      };
    })(this));
    this.inPorts.runtime.on('connect', (function(_this) {
      return function() {
        return _this.runtime = null;
      };
    })(this));
    this.inPorts.runtime.on('data', (function(_this) {
      return function(runtime) {
        if (_this.runtime) {
          _this.runtime.stop();
        }
        _this.runtime = runtime;
        return _this.connect(_this.editor, _this.runtime);
      };
    })(this));
  }

  ConnectRuntime.prototype.sendProject = function(runtime, project) {
    var component, graph, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (project.components) {
      _ref = project.components;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        component = _ref[_i];
        this.sendComponent(runtime, component);
      }
    }
    if (project.graphs) {
      _ref1 = project.graphs;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        graph = _ref1[_j];
        _results.push(this.sendGraph(runtime, graph));
      }
      return _results;
    }
  };

  ConnectRuntime.prototype.sendComponent = function(runtime, component) {
    if (!component.code) {
      return;
    }
    return runtime.sendComponent('source', {
      name: component.name,
      language: component.language,
      library: component.project,
      code: component.code,
      tests: component.tests
    });
  };

  ConnectRuntime.prototype.sendGraph = function(runtime, graph) {
    var edge, iip, node, priv, pub, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _results;
    if (graph.properties.environment.type && graph.properties.environment.type !== this.runtime.definition.type) {
      return;
    }
    runtime.sendGraph('clear', {
      id: graph.properties.id,
      name: graph.name,
      library: graph.properties.project,
      main: this.project && graph.properties.id === this.project.main
    });
    _ref = graph.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      runtime.sendGraph('addnode', {
        id: node.id,
        component: node.component,
        metadata: node.metadata,
        graph: graph.properties.id
      });
    }
    _ref1 = graph.edges;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      edge = _ref1[_j];
      runtime.sendGraph('addedge', {
        src: {
          node: edge.from.node,
          port: edge.from.port
        },
        tgt: {
          node: edge.to.node,
          port: edge.to.port
        },
        metadata: edge.metadata,
        graph: graph.properties.id
      });
    }
    _ref2 = graph.initializers;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      iip = _ref2[_k];
      runtime.sendGraph('addinitial', {
        src: {
          data: iip.from.data
        },
        tgt: {
          node: iip.to.node,
          port: iip.to.port
        },
        metadata: iip.metadata,
        graph: graph.properties.id
      });
    }
    if (graph.inports) {
      _ref3 = graph.inports;
      for (pub in _ref3) {
        priv = _ref3[pub];
        runtime.sendGraph('addinport', {
          "public": pub,
          node: priv.process,
          port: priv.port,
          graph: graph.properties.id
        });
      }
    }
    if (graph.outports) {
      _ref4 = graph.outports;
      _results = [];
      for (pub in _ref4) {
        priv = _ref4[pub];
        _results.push(runtime.sendGraph('addoutport', {
          "public": pub,
          node: priv.process,
          port: priv.port,
          graph: graph.properties.id
        }));
      }
      return _results;
    }
  };

  ConnectRuntime.prototype.convertNode = function(id, node) {
    var data;
    data = node.toJSON();
    data.graph = id;
    return data;
  };

  ConnectRuntime.prototype.convertEdge = function(id, edge) {
    var data, edgeData;
    data = edge.toJSON();
    return edgeData = {
      src: {
        node: data.src.process,
        port: data.src.port
      },
      tgt: {
        node: data.tgt.process,
        port: data.tgt.port
      },
      graph: id
    };
  };

  ConnectRuntime.prototype.convertInitial = function(id, iip) {
    var data, iipData;
    data = iip.toJSON();
    return iipData = {
      src: {
        data: data.data
      },
      tgt: {
        node: data.tgt.process,
        port: data.tgt.port
      },
      graph: id
    };
  };

  ConnectRuntime.prototype.convertBang = function(id, bang) {
    var iipData;
    return iipData = {
      src: {
        data: true
      },
      tgt: {
        node: bang.process,
        port: bang.port
      },
      graph: id
    };
  };

  ConnectRuntime.prototype.connect = function(editor, runtime) {
    var edges;
    if (!(editor && runtime)) {
      return;
    }
    this.connected = false;
    runtime.once('connected', (function(_this) {
      return function() {
        var def, name, _ref, _results;
        _ref = editor.$.graph.library;
        _results = [];
        for (name in _ref) {
          def = _ref[name];
          _results.push(delete editor.$.graph.library[name]);
        }
        return _results;
      };
    })(this));
    runtime.on('connected', (function(_this) {
      return function() {
        _this.connected = true;
        runtime.sendComponent('list', '');
        if (_this.project) {
          _this.sendProject(_this.runtime, _this.project);
        }
        if (_this.example) {
          return _this.sendGraph(_this.runtime, _this.example);
        }
      };
    })(this));
    runtime.on('disconnected', (function(_this) {
      return function() {
        return _this.connected = false;
      };
    })(this));
    runtime.on('component', function(message) {
      var definition, port, _i, _j, _len, _len1, _ref, _ref1;
      if (message.payload.name === 'Graph' || message.payload.name === 'ReadDocument') {
        return;
      }
      definition = {
        name: message.payload.name,
        description: message.payload.description,
        icon: message.payload.icon,
        subgraph: message.payload.subgraph || false,
        inports: [],
        outports: []
      };
      _ref = message.payload.inPorts;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        port = _ref[_i];
        definition.inports.push({
          name: port.id,
          type: port.type,
          required: port.required,
          description: port.description,
          addressable: port.addressable
        });
      }
      _ref1 = message.payload.outPorts;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        port = _ref1[_j];
        definition.outports.push({
          name: port.id,
          type: port.type,
          required: port.required,
          description: port.description,
          addressable: port.addressable
        });
      }
      return editor.registerComponent(definition);
    });
    edges = {};
    runtime.on('network', (function(_this) {
      return function(_arg) {
        var command, payload;
        command = _arg.command, payload = _arg.payload;
        if (command === 'error') {
          return;
        }
        if (!payload.id) {
          return;
        }
        return _this.outPorts.packet.send({
          edge: payload.id,
          type: command,
          group: payload.group != null ? payload.group : '',
          data: payload.data != null ? payload.data : '',
          subgraph: payload.subgraph != null ? payload.subgraph : ''
        });
      };
    })(this));
    runtime.on('icon', (function(_this) {
      return function(_arg) {
        var icon, id;
        id = _arg.id, icon = _arg.icon;
        if (!editor.updateIcon) {
          return;
        }
        return editor.updateIcon(id, icon);
      };
    })(this));
    return runtime.on('graph', (function(_this) {
      return function(_arg) {
        var command, graph, graphId, payload, _ref;
        command = _arg.command, payload = _arg.payload;
        if (command === 'clear') {
          graph = new noflo.Graph(payload.name);
          graph.setProperties({
            id: payload.id,
            project: _this.project.type,
            environment: {
              type: payload.library
            }
          });
          if (_ref = graph.properties.id, __indexOf.call(_this.project.graphs.map(function(g) {
            return g.properties.id;
          }), _ref) < 0) {
            _this.project.graphs.push(graph);
          }
        }
        if (command === 'addnode') {
          graphId = payload.graph;
          if (editor.graph.properties.id === graphId) {
            editor.graph.addNode(payload.id, payload.component, payload.metadata);
          }
        }
        if (command === 'addedge') {
          graphId = payload.graph;
          if (editor.graph.properties.id === graphId) {
            return editor.graph.addEdge(payload.src.node, payload.src.port, payload.tgt.node, payload.src.port, payload.metadata);
          }
        }
      };
    })(this));
  };

  return ConnectRuntime;

})(noflo.Component);

exports.getComponent = function() {
  return new ConnectRuntime;
};

});
require.register("noflo-ui/components/GenerateId.js", function(exports, require, module){
var GenerateId, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

GenerateId = (function(_super) {
  __extends(GenerateId, _super);

  function GenerateId() {
    this.inPorts = {
      start: new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('string')
    };
    this.inPorts.start.on('data', (function(_this) {
      return function(data) {
        var id;
        id = _this.randomString();
        if (data.id) {
          id = data.id;
        }
        if (data.properties && data.properties.id) {
          id = data.properties.id;
        }
        _this.outPorts.out.send(id);
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  GenerateId.prototype.randomString = function(num) {
    if (num == null) {
      num = 60466176;
    }
    num = Math.floor(Math.random() * num);
    return num.toString(36);
  };

  return GenerateId;

})(noflo.Component);

exports.getComponent = function() {
  return new GenerateId;
};

});
require.register("noflo-ui/components/IgnoreExamples.js", function(exports, require, module){
var IgnoreExamples, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

IgnoreExamples = (function(_super) {
  __extends(IgnoreExamples, _super);

  function IgnoreExamples() {
    this.inPorts = {
      "in": new noflo.Port('object')
    };
    this.outPorts = {
      out: new noflo.Port('object')
    };
    this.inPorts["in"].on('data', (function(_this) {
      return function(data) {
        if (window.location.hash.substr(1, 8) === 'example/') {
          return;
        }
        return _this.outPorts.out.send(data);
      };
    })(this));
    this.inPorts["in"].on('disconnect', (function(_this) {
      return function() {
        return _this.outPorts.out.disconnect();
      };
    })(this));
  }

  return IgnoreExamples;

})(noflo.Component);

exports.getComponent = function() {
  return new IgnoreExamples;
};

});
require.register("noflo-ui/components/Router.js", function(exports, require, module){
var Router, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

Router = (function(_super) {
  __extends(Router, _super);

  function Router() {
    this.inPorts = {
      url: new noflo.ArrayPort('string')
    };
    this.outPorts = {
      route: new noflo.ArrayPort('bang'),
      main: new noflo.Port('string'),
      project: new noflo.Port('string'),
      graph: new noflo.Port('string'),
      component: new noflo.Port('string'),
      example: new noflo.Port('string'),
      missed: new noflo.Port('string')
    };
    this.inPorts.url.on('data', (function(_this) {
      return function(url) {
        var graph, matched, _i, _len, _ref;
        matched = _this.matchUrl(url);
        if (_this.outPorts.route.isAttached()) {
          _this.outPorts.route.send(matched);
          _this.outPorts.route.disconnect();
        }
        if (!matched) {
          if (_this.outPorts.missed.isAttached()) {
            _this.outPorts.missed.send(url);
            _this.outPorts.missed.disconnect();
            return;
          }
        }
        switch (matched.route) {
          case 'main':
            if (!_this.outPorts.main.isAttached()) {
              return;
            }
            _this.outPorts.main.send(true);
            _this.outPorts.main.disconnect();
            break;
          case 'graph':
            if (matched.project && _this.outPorts.project.isAttached()) {
              _this.outPorts.project.send(matched.project);
              _this.outPorts.project.disconnect();
            }
            if (!_this.outPorts.graph.isAttached()) {
              return;
            }
            _ref = matched.graphs;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              graph = _ref[_i];
              _this.outPorts.graph.send(graph);
            }
            _this.outPorts.graph.disconnect();
            break;
          case 'component':
            if (matched.project && _this.outPorts.project.isAttached()) {
              _this.outPorts.project.send(matched.project);
              _this.outPorts.project.disconnect();
            }
            if (_this.outPorts.component.isAttached()) {
              _this.outPorts.component.send(matched.component);
            }
            break;
          case 'example':
            if (!_this.outPorts.example.isAttached()) {
              return;
            }
            _this.outPorts.example.send(matched.graphs[0]);
            return _this.outPorts.example.disconnect();
        }
      };
    })(this));
  }

  Router.prototype.matchUrl = function(url) {
    var parts, remainder, routeData;
    routeData = {
      route: ''
    };
    if (url === '') {
      routeData.route = 'main';
      return routeData;
    }
    if (url.substr(0, 8) === 'project/') {
      remainder = url.substr(8);
      parts = remainder.split('/');
      routeData.project = parts.shift();
      if (parts[0] === 'component' && parts.length === 2) {
        routeData.route = 'component';
        routeData.component = parts[1];
        return routeData;
      }
      routeData.route = 'graph';
      routeData.graph = parts.shift();
      routeData.nodes = parts;
      return routeData;
    }
    if (url.substr(0, 8) === 'example/') {
      routeData.route = 'example';
      routeData.graphs = [url.substr(8)];
      return routeData;
    }
    return null;
  };

  return Router;

})(noflo.Component);

exports.getComponent = function() {
  return new Router;
};

});
require.register("noflo-ui/components/MigrateLocalStorage.js", function(exports, require, module){
var MigrateLocalStorage, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

MigrateLocalStorage = (function(_super) {
  __extends(MigrateLocalStorage, _super);

  function MigrateLocalStorage() {
    this.inPorts = {
      graphstore: new noflo.Port('object')
    };
    this.inPorts.graphstore.on('data', (function(_this) {
      return function(store) {
        return _this.migrateGraphs(store);
      };
    })(this));
  }

  MigrateLocalStorage.prototype.getGraphs = function() {
    var graph, graphIds, graphs, id, ids, _i, _len;
    graphIds = localStorage.getItem('noflo-ui-graphs');
    graphs = [];
    if (!graphIds) {
      return graphs;
    }
    ids = graphIds.split(',');
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      graph = this.getGraph(id);
      if (!graph) {
        continue;
      }
      graphs.push(graph);
    }
    return graphs;
  };

  MigrateLocalStorage.prototype.getGraph = function(id) {
    var graph, json;
    json = localStorage.getItem(id);
    if (!json) {
      return;
    }
    graph = JSON.parse(json);
    graph.id = id;
    graph.project = '';
    return graph;
  };

  MigrateLocalStorage.prototype.migrateGraphs = function(store) {
    var e, graphs, succeeded, success;
    try {
      localStorage;
    } catch (_error) {
      e = _error;
      return;
    }
    graphs = this.getGraphs();
    if (graphs.length === 0) {
      return;
    }
    succeeded = 0;
    success = (function(_this) {
      return function() {
        succeeded++;
        if (succeeded !== graphs.length) {

        }
      };
    })(this);
    return graphs.forEach(function(graph) {
      var req;
      req = store.put(graph);
      return req.onsuccess = success;
    });
  };

  return MigrateLocalStorage;

})(noflo.Component);

exports.getComponent = function() {
  return new MigrateLocalStorage;
};

});
require.register("noflo-ui/components/MakePath.js", function(exports, require, module){
var noflo;

noflo = require('noflo');

exports.getComponent = function() {
  var c;
  c = new noflo.Component;
  c.inPorts.add('in', function(event, payload) {
    var path;
    if (event !== 'data') {
      return;
    }
    if (payload.properties) {
      path = "graphs/" + payload.properties.id + ".json";
    }
    if (payload.code && payload.language) {
      switch (payload.language) {
        case 'coffeescript':
          path = "components/" + payload.name + ".coffee";
          break;
        case 'javascript':
          path = "components/" + payload.name + ".js";
      }
    }
    c.outPorts.out.send(path);
    return c.outPorts.out.disconnect();
  });
  c.outPorts.add('out');
  return c;
};

});
require.register("noflo-ui/src/JournalStore.js", function(exports, require, module){
var IDBJournalStore, noflo,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

noflo = require('noflo');

IDBJournalStore = (function(_super) {
  __extends(IDBJournalStore, _super);

  function IDBJournalStore(graph, db) {
    this.db = db;
    IDBJournalStore.__super__.constructor.call(this, graph);
    this.transactions = [];
  }

  IDBJournalStore.prototype.genKey = function(revId) {
    return "" + this.graph.properties.id + "_" + revId;
  };

  IDBJournalStore.prototype.putTransaction = function(revId, entries) {
    var req, store, trans;
    IDBJournalStore.__super__.putTransaction.call(this, revId, entries);
    trans = this.db.transaction(['journals'], 'readwrite');
    store = trans.objectStore('journals');
    req = store.add({
      id: this.genKey(revId),
      graph: this.graph.properties.id,
      revId: revId,
      entries: entries
    });
    return this.transactions[revId] = entries;
  };

  IDBJournalStore.prototype.fetchTransaction = function(revId) {
    return this.transactions[revId];
  };

  IDBJournalStore.prototype.init = function(cb) {
    var idx, store, trans;
    trans = this.db.transaction(['journals']);
    store = trans.objectStore('journals');
    idx = store.index('graph');
    return idx.openCursor().onsuccess = (function(_this) {
      return function(event) {
        var cursor;
        cursor = event.target.result;
        if (!cursor) {
          return cb();
        }
        _this.transactions[cursor.value.revId] = cursor.value.entries;
        if (cursor.value.revId > _this.lastRevision) {
          _this.lastRevision = cursor.value.revId;
        }
        return cursor["continue"]();
      };
    })(this);
  };

  return IDBJournalStore;

})(noflo.journal.JournalStore);

exports.IDBJournalStore = IDBJournalStore;

});


















require.alias("noflo-noflo/component.json", "noflo-ui/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-ui/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-ui/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-ui/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-ui/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-ui/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-ui/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-ui/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-ui/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-ui/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-ui/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-ui/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-ui/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-ui/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-ui/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-ui/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-ui/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-ui/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-ui/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-ui/deps/noflo/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-strings/index.js", "noflo-ui/deps/noflo-strings/index.js");
require.alias("noflo-noflo-strings/component.json", "noflo-ui/deps/noflo-strings/component.json");
require.alias("noflo-noflo-strings/components/CompileString.js", "noflo-ui/deps/noflo-strings/components/CompileString.js");
require.alias("noflo-noflo-strings/components/Filter.js", "noflo-ui/deps/noflo-strings/components/Filter.js");
require.alias("noflo-noflo-strings/components/SendString.js", "noflo-ui/deps/noflo-strings/components/SendString.js");
require.alias("noflo-noflo-strings/components/SplitStr.js", "noflo-ui/deps/noflo-strings/components/SplitStr.js");
require.alias("noflo-noflo-strings/components/StringTemplate.js", "noflo-ui/deps/noflo-strings/components/StringTemplate.js");
require.alias("noflo-noflo-strings/components/Replace.js", "noflo-ui/deps/noflo-strings/components/Replace.js");
require.alias("noflo-noflo-strings/components/Jsonify.js", "noflo-ui/deps/noflo-strings/components/Jsonify.js");
require.alias("noflo-noflo-strings/components/ParseJson.js", "noflo-ui/deps/noflo-strings/components/ParseJson.js");
require.alias("noflo-noflo-strings/index.js", "noflo-strings/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-strings/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-strings/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-strings/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-strings/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-strings/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-strings/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-strings/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-strings/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-strings/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-strings/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-strings/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-strings/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-strings/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-strings/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-strings/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-strings/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-strings/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-strings/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-strings/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-strings/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("component-underscore/index.js", "noflo-noflo-strings/deps/underscore/index.js");

require.alias("noflo-noflo-ajax/index.js", "noflo-ui/deps/noflo-ajax/index.js");
require.alias("noflo-noflo-ajax/component.json", "noflo-ui/deps/noflo-ajax/component.json");
require.alias("noflo-noflo-ajax/components/Get.js", "noflo-ui/deps/noflo-ajax/components/Get.js");
require.alias("noflo-noflo-ajax/components/GetJsonP.js", "noflo-ui/deps/noflo-ajax/components/GetJsonP.js");
require.alias("noflo-noflo-ajax/index.js", "noflo-ajax/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-ajax/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-ajax/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-ajax/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-ajax/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-ajax/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-ajax/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-ajax/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-ajax/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-ajax/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-ajax/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-ajax/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-ajax/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-ajax/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-ajax/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-ajax/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-ajax/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-ajax/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-ajax/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-ajax/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-ajax/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-localstorage/index.js", "noflo-ui/deps/noflo-localstorage/index.js");
require.alias("noflo-noflo-localstorage/component.json", "noflo-ui/deps/noflo-localstorage/component.json");
require.alias("noflo-noflo-localstorage/components/GetItem.js", "noflo-ui/deps/noflo-localstorage/components/GetItem.js");
require.alias("noflo-noflo-localstorage/components/ListenRemoteChanges.js", "noflo-ui/deps/noflo-localstorage/components/ListenRemoteChanges.js");
require.alias("noflo-noflo-localstorage/components/ListAdd.js", "noflo-ui/deps/noflo-localstorage/components/ListAdd.js");
require.alias("noflo-noflo-localstorage/components/ListGet.js", "noflo-ui/deps/noflo-localstorage/components/ListGet.js");
require.alias("noflo-noflo-localstorage/components/ListRemove.js", "noflo-ui/deps/noflo-localstorage/components/ListRemove.js");
require.alias("noflo-noflo-localstorage/components/RemoveItem.js", "noflo-ui/deps/noflo-localstorage/components/RemoveItem.js");
require.alias("noflo-noflo-localstorage/components/SetItem.js", "noflo-ui/deps/noflo-localstorage/components/SetItem.js");
require.alias("noflo-noflo-localstorage/index.js", "noflo-localstorage/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-localstorage/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-localstorage/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-localstorage/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-localstorage/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-localstorage/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-localstorage/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-localstorage/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-localstorage/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-localstorage/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-localstorage/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-localstorage/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-localstorage/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-localstorage/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-interaction/index.js", "noflo-ui/deps/noflo-interaction/index.js");
require.alias("noflo-noflo-interaction/component.json", "noflo-ui/deps/noflo-interaction/component.json");
require.alias("noflo-noflo-interaction/components/ListenChange.js", "noflo-ui/deps/noflo-interaction/components/ListenChange.js");
require.alias("noflo-noflo-interaction/components/ListenDrag.js", "noflo-ui/deps/noflo-interaction/components/ListenDrag.js");
require.alias("noflo-noflo-interaction/components/ListenHash.js", "noflo-ui/deps/noflo-interaction/components/ListenHash.js");
require.alias("noflo-noflo-interaction/components/ListenKeyboard.js", "noflo-ui/deps/noflo-interaction/components/ListenKeyboard.js");
require.alias("noflo-noflo-interaction/components/ListenKeyboardShortcuts.js", "noflo-ui/deps/noflo-interaction/components/ListenKeyboardShortcuts.js");
require.alias("noflo-noflo-interaction/components/ListenMouse.js", "noflo-ui/deps/noflo-interaction/components/ListenMouse.js");
require.alias("noflo-noflo-interaction/components/ListenPointer.js", "noflo-ui/deps/noflo-interaction/components/ListenPointer.js");
require.alias("noflo-noflo-interaction/components/ListenResize.js", "noflo-ui/deps/noflo-interaction/components/ListenResize.js");
require.alias("noflo-noflo-interaction/components/ListenScroll.js", "noflo-ui/deps/noflo-interaction/components/ListenScroll.js");
require.alias("noflo-noflo-interaction/components/ListenSpeech.js", "noflo-ui/deps/noflo-interaction/components/ListenSpeech.js");
require.alias("noflo-noflo-interaction/components/ListenTouch.js", "noflo-ui/deps/noflo-interaction/components/ListenTouch.js");
require.alias("noflo-noflo-interaction/components/SetHash.js", "noflo-ui/deps/noflo-interaction/components/SetHash.js");
require.alias("noflo-noflo-interaction/components/ReadCoordinates.js", "noflo-ui/deps/noflo-interaction/components/ReadCoordinates.js");
require.alias("noflo-noflo-interaction/index.js", "noflo-interaction/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-interaction/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-interaction/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-interaction/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-interaction/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-interaction/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-interaction/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-interaction/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-interaction/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-interaction/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-interaction/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-interaction/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-interaction/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-interaction/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-interaction/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-interaction/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-interaction/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-interaction/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-interaction/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-interaction/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-interaction/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-objects/index.js", "noflo-ui/deps/noflo-objects/index.js");
require.alias("noflo-noflo-objects/component.json", "noflo-ui/deps/noflo-objects/component.json");
require.alias("noflo-noflo-objects/components/Extend.js", "noflo-ui/deps/noflo-objects/components/Extend.js");
require.alias("noflo-noflo-objects/components/MergeObjects.js", "noflo-ui/deps/noflo-objects/components/MergeObjects.js");
require.alias("noflo-noflo-objects/components/SplitObject.js", "noflo-ui/deps/noflo-objects/components/SplitObject.js");
require.alias("noflo-noflo-objects/components/ReplaceKey.js", "noflo-ui/deps/noflo-objects/components/ReplaceKey.js");
require.alias("noflo-noflo-objects/components/Keys.js", "noflo-ui/deps/noflo-objects/components/Keys.js");
require.alias("noflo-noflo-objects/components/Size.js", "noflo-ui/deps/noflo-objects/components/Size.js");
require.alias("noflo-noflo-objects/components/Values.js", "noflo-ui/deps/noflo-objects/components/Values.js");
require.alias("noflo-noflo-objects/components/Join.js", "noflo-ui/deps/noflo-objects/components/Join.js");
require.alias("noflo-noflo-objects/components/ExtractProperty.js", "noflo-ui/deps/noflo-objects/components/ExtractProperty.js");
require.alias("noflo-noflo-objects/components/InsertProperty.js", "noflo-ui/deps/noflo-objects/components/InsertProperty.js");
require.alias("noflo-noflo-objects/components/SliceArray.js", "noflo-ui/deps/noflo-objects/components/SliceArray.js");
require.alias("noflo-noflo-objects/components/SplitArray.js", "noflo-ui/deps/noflo-objects/components/SplitArray.js");
require.alias("noflo-noflo-objects/components/FilterPropertyValue.js", "noflo-ui/deps/noflo-objects/components/FilterPropertyValue.js");
require.alias("noflo-noflo-objects/components/FlattenObject.js", "noflo-ui/deps/noflo-objects/components/FlattenObject.js");
require.alias("noflo-noflo-objects/components/MapProperty.js", "noflo-ui/deps/noflo-objects/components/MapProperty.js");
require.alias("noflo-noflo-objects/components/RemoveProperty.js", "noflo-ui/deps/noflo-objects/components/RemoveProperty.js");
require.alias("noflo-noflo-objects/components/MapPropertyValue.js", "noflo-ui/deps/noflo-objects/components/MapPropertyValue.js");
require.alias("noflo-noflo-objects/components/GetObjectKey.js", "noflo-ui/deps/noflo-objects/components/GetObjectKey.js");
require.alias("noflo-noflo-objects/components/UniqueArray.js", "noflo-ui/deps/noflo-objects/components/UniqueArray.js");
require.alias("noflo-noflo-objects/components/SetProperty.js", "noflo-ui/deps/noflo-objects/components/SetProperty.js");
require.alias("noflo-noflo-objects/components/SimplifyObject.js", "noflo-ui/deps/noflo-objects/components/SimplifyObject.js");
require.alias("noflo-noflo-objects/components/DuplicateProperty.js", "noflo-ui/deps/noflo-objects/components/DuplicateProperty.js");
require.alias("noflo-noflo-objects/components/CreateObject.js", "noflo-ui/deps/noflo-objects/components/CreateObject.js");
require.alias("noflo-noflo-objects/components/CreateDate.js", "noflo-ui/deps/noflo-objects/components/CreateDate.js");
require.alias("noflo-noflo-objects/components/SetPropertyValue.js", "noflo-ui/deps/noflo-objects/components/SetPropertyValue.js");
require.alias("noflo-noflo-objects/components/CallMethod.js", "noflo-ui/deps/noflo-objects/components/CallMethod.js");
require.alias("noflo-noflo-objects/index.js", "noflo-objects/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-objects/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-objects/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-objects/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-objects/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-objects/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-objects/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-objects/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-objects/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-objects/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-objects/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-objects/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-objects/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-objects/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-objects/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-objects/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-objects/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-objects/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-objects/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-objects/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-objects/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("component-underscore/index.js", "noflo-noflo-objects/deps/underscore/index.js");

require.alias("noflo-noflo-groups/index.js", "noflo-ui/deps/noflo-groups/index.js");
require.alias("noflo-noflo-groups/component.json", "noflo-ui/deps/noflo-groups/component.json");
require.alias("noflo-noflo-groups/components/ReadGroups.js", "noflo-ui/deps/noflo-groups/components/ReadGroups.js");
require.alias("noflo-noflo-groups/components/RemoveGroups.js", "noflo-ui/deps/noflo-groups/components/RemoveGroups.js");
require.alias("noflo-noflo-groups/components/Regroup.js", "noflo-ui/deps/noflo-groups/components/Regroup.js");
require.alias("noflo-noflo-groups/components/Group.js", "noflo-ui/deps/noflo-groups/components/Group.js");
require.alias("noflo-noflo-groups/components/GroupZip.js", "noflo-ui/deps/noflo-groups/components/GroupZip.js");
require.alias("noflo-noflo-groups/components/FilterByGroup.js", "noflo-ui/deps/noflo-groups/components/FilterByGroup.js");
require.alias("noflo-noflo-groups/components/Objectify.js", "noflo-ui/deps/noflo-groups/components/Objectify.js");
require.alias("noflo-noflo-groups/components/ReadGroup.js", "noflo-ui/deps/noflo-groups/components/ReadGroup.js");
require.alias("noflo-noflo-groups/components/SendByGroup.js", "noflo-ui/deps/noflo-groups/components/SendByGroup.js");
require.alias("noflo-noflo-groups/components/CollectGroups.js", "noflo-ui/deps/noflo-groups/components/CollectGroups.js");
require.alias("noflo-noflo-groups/components/CollectObject.js", "noflo-ui/deps/noflo-groups/components/CollectObject.js");
require.alias("noflo-noflo-groups/components/FirstGroup.js", "noflo-ui/deps/noflo-groups/components/FirstGroup.js");
require.alias("noflo-noflo-groups/components/MapGroup.js", "noflo-ui/deps/noflo-groups/components/MapGroup.js");
require.alias("noflo-noflo-groups/components/MergeGroups.js", "noflo-ui/deps/noflo-groups/components/MergeGroups.js");
require.alias("noflo-noflo-groups/components/GroupByObjectKey.js", "noflo-ui/deps/noflo-groups/components/GroupByObjectKey.js");
require.alias("noflo-noflo-groups/index.js", "noflo-groups/index.js");
require.alias("component-underscore/index.js", "noflo-noflo-groups/deps/underscore/index.js");

require.alias("noflo-noflo/component.json", "noflo-noflo-groups/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-groups/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-groups/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-groups/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-groups/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-groups/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-groups/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-groups/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-groups/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-groups/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-groups/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-groups/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-groups/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-groups/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-groups/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-groups/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-groups/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-groups/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-groups/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-groups/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-dom/index.js", "noflo-ui/deps/noflo-dom/index.js");
require.alias("noflo-noflo-dom/component.json", "noflo-ui/deps/noflo-dom/component.json");
require.alias("noflo-noflo-dom/components/AddClass.js", "noflo-ui/deps/noflo-dom/components/AddClass.js");
require.alias("noflo-noflo-dom/components/AppendChild.js", "noflo-ui/deps/noflo-dom/components/AppendChild.js");
require.alias("noflo-noflo-dom/components/CreateElement.js", "noflo-ui/deps/noflo-dom/components/CreateElement.js");
require.alias("noflo-noflo-dom/components/CreateFragment.js", "noflo-ui/deps/noflo-dom/components/CreateFragment.js");
require.alias("noflo-noflo-dom/components/GetAttribute.js", "noflo-ui/deps/noflo-dom/components/GetAttribute.js");
require.alias("noflo-noflo-dom/components/GetElement.js", "noflo-ui/deps/noflo-dom/components/GetElement.js");
require.alias("noflo-noflo-dom/components/HasClass.js", "noflo-ui/deps/noflo-dom/components/HasClass.js");
require.alias("noflo-noflo-dom/components/ReadHtml.js", "noflo-ui/deps/noflo-dom/components/ReadHtml.js");
require.alias("noflo-noflo-dom/components/RemoveElement.js", "noflo-ui/deps/noflo-dom/components/RemoveElement.js");
require.alias("noflo-noflo-dom/components/SetAttribute.js", "noflo-ui/deps/noflo-dom/components/SetAttribute.js");
require.alias("noflo-noflo-dom/components/WriteHtml.js", "noflo-ui/deps/noflo-dom/components/WriteHtml.js");
require.alias("noflo-noflo-dom/components/RemoveClass.js", "noflo-ui/deps/noflo-dom/components/RemoveClass.js");
require.alias("noflo-noflo-dom/components/RequestAnimationFrame.js", "noflo-ui/deps/noflo-dom/components/RequestAnimationFrame.js");
require.alias("noflo-noflo-dom/index.js", "noflo-dom/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-dom/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-dom/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-dom/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-dom/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-dom/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-dom/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-dom/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-dom/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-dom/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-dom/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-dom/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-dom/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-dom/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-dom/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-dom/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-dom/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-dom/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-dom/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-dom/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-dom/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-core/index.js", "noflo-ui/deps/noflo-core/index.js");
require.alias("noflo-noflo-core/component.json", "noflo-ui/deps/noflo-core/component.json");
require.alias("noflo-noflo-core/components/Callback.js", "noflo-ui/deps/noflo-core/components/Callback.js");
require.alias("noflo-noflo-core/components/DisconnectAfterPacket.js", "noflo-ui/deps/noflo-core/components/DisconnectAfterPacket.js");
require.alias("noflo-noflo-core/components/Drop.js", "noflo-ui/deps/noflo-core/components/Drop.js");
require.alias("noflo-noflo-core/components/Group.js", "noflo-ui/deps/noflo-core/components/Group.js");
require.alias("noflo-noflo-core/components/Kick.js", "noflo-ui/deps/noflo-core/components/Kick.js");
require.alias("noflo-noflo-core/components/Merge.js", "noflo-ui/deps/noflo-core/components/Merge.js");
require.alias("noflo-noflo-core/components/Output.js", "noflo-ui/deps/noflo-core/components/Output.js");
require.alias("noflo-noflo-core/components/Repeat.js", "noflo-ui/deps/noflo-core/components/Repeat.js");
require.alias("noflo-noflo-core/components/RepeatAsync.js", "noflo-ui/deps/noflo-core/components/RepeatAsync.js");
require.alias("noflo-noflo-core/components/Split.js", "noflo-ui/deps/noflo-core/components/Split.js");
require.alias("noflo-noflo-core/components/RunInterval.js", "noflo-ui/deps/noflo-core/components/RunInterval.js");
require.alias("noflo-noflo-core/components/RunTimeout.js", "noflo-ui/deps/noflo-core/components/RunTimeout.js");
require.alias("noflo-noflo-core/components/MakeFunction.js", "noflo-ui/deps/noflo-core/components/MakeFunction.js");
require.alias("noflo-noflo-core/index.js", "noflo-core/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-core/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-core/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-core/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-core/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-core/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-core/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-core/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-core/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-core/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-core/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-core/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-core/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-core/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-core/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-core/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-core/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-core/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-core/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-core/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-core/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("component-underscore/index.js", "noflo-noflo-core/deps/underscore/index.js");

require.alias("noflo-noflo-polymer/index.js", "noflo-ui/deps/noflo-polymer/index.js");
require.alias("noflo-noflo-polymer/component.json", "noflo-ui/deps/noflo-polymer/component.json");
require.alias("noflo-noflo-polymer/lib/ComponentLoader.js", "noflo-ui/deps/noflo-polymer/lib/ComponentLoader.js");
require.alias("noflo-noflo-polymer/lib/PolymerComponent.js", "noflo-ui/deps/noflo-polymer/lib/PolymerComponent.js");
require.alias("noflo-noflo-polymer/index.js", "noflo-polymer/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-polymer/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-polymer/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-polymer/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-polymer/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-polymer/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-polymer/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-polymer/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-polymer/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-polymer/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-polymer/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-polymer/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-polymer/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-polymer/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-polymer/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-polymer/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-polymer/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-polymer/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-polymer/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-polymer/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-polymer/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-indexeddb/index.js", "noflo-ui/deps/noflo-indexeddb/index.js");
require.alias("noflo-noflo-indexeddb/component.json", "noflo-ui/deps/noflo-indexeddb/component.json");
require.alias("noflo-noflo-indexeddb/components/Open.js", "noflo-ui/deps/noflo-indexeddb/components/Open.js");
require.alias("noflo-noflo-indexeddb/components/Close.js", "noflo-ui/deps/noflo-indexeddb/components/Close.js");
require.alias("noflo-noflo-indexeddb/components/DeleteDatabase.js", "noflo-ui/deps/noflo-indexeddb/components/DeleteDatabase.js");
require.alias("noflo-noflo-indexeddb/components/CreateStore.js", "noflo-ui/deps/noflo-indexeddb/components/CreateStore.js");
require.alias("noflo-noflo-indexeddb/components/CreateIndex.js", "noflo-ui/deps/noflo-indexeddb/components/CreateIndex.js");
require.alias("noflo-noflo-indexeddb/components/DeleteStore.js", "noflo-ui/deps/noflo-indexeddb/components/DeleteStore.js");
require.alias("noflo-noflo-indexeddb/components/UpgradeRouter.js", "noflo-ui/deps/noflo-indexeddb/components/UpgradeRouter.js");
require.alias("noflo-noflo-indexeddb/components/BeginTransaction.js", "noflo-ui/deps/noflo-indexeddb/components/BeginTransaction.js");
require.alias("noflo-noflo-indexeddb/components/AbortTransaction.js", "noflo-ui/deps/noflo-indexeddb/components/AbortTransaction.js");
require.alias("noflo-noflo-indexeddb/components/GetStore.js", "noflo-ui/deps/noflo-indexeddb/components/GetStore.js");
require.alias("noflo-noflo-indexeddb/components/GetIndex.js", "noflo-ui/deps/noflo-indexeddb/components/GetIndex.js");
require.alias("noflo-noflo-indexeddb/components/Query.js", "noflo-ui/deps/noflo-indexeddb/components/Query.js");
require.alias("noflo-noflo-indexeddb/components/QueryOnly.js", "noflo-ui/deps/noflo-indexeddb/components/QueryOnly.js");
require.alias("noflo-noflo-indexeddb/components/QueryFrom.js", "noflo-ui/deps/noflo-indexeddb/components/QueryFrom.js");
require.alias("noflo-noflo-indexeddb/components/QueryTo.js", "noflo-ui/deps/noflo-indexeddb/components/QueryTo.js");
require.alias("noflo-noflo-indexeddb/components/Put.js", "noflo-ui/deps/noflo-indexeddb/components/Put.js");
require.alias("noflo-noflo-indexeddb/components/Get.js", "noflo-ui/deps/noflo-indexeddb/components/Get.js");
require.alias("noflo-noflo-indexeddb/components/Delete.js", "noflo-ui/deps/noflo-indexeddb/components/Delete.js");
require.alias("noflo-noflo-indexeddb/index.js", "noflo-indexeddb/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-indexeddb/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-indexeddb/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-indexeddb/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-indexeddb/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-github/index.js", "noflo-ui/deps/noflo-github/index.js");
require.alias("noflo-noflo-github/component.json", "noflo-ui/deps/noflo-github/component.json");
require.alias("noflo-noflo-github/components/CreateRepository.js", "noflo-ui/deps/noflo-github/components/CreateRepository.js");
require.alias("noflo-noflo-github/components/CreateOrgRepository.js", "noflo-ui/deps/noflo-github/components/CreateOrgRepository.js");
require.alias("noflo-noflo-github/components/GetRepository.js", "noflo-ui/deps/noflo-github/components/GetRepository.js");
require.alias("noflo-noflo-github/components/GetContents.js", "noflo-ui/deps/noflo-github/components/GetContents.js");
require.alias("noflo-noflo-github/components/GetCurrentUser.js", "noflo-ui/deps/noflo-github/components/GetCurrentUser.js");
require.alias("noflo-noflo-github/components/GetUser.js", "noflo-ui/deps/noflo-github/components/GetUser.js");
require.alias("noflo-noflo-github/components/GetStargazers.js", "noflo-ui/deps/noflo-github/components/GetStargazers.js");
require.alias("noflo-noflo-github/components/SetContents.js", "noflo-ui/deps/noflo-github/components/SetContents.js");
require.alias("noflo-noflo-github/index.js", "noflo-github/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-github/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-github/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-github/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-github/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-github/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-github/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-github/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-github/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-github/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-github/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-github/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-github/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-github/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-github/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-github/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-github/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-github/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-github/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-github/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-github/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("bergie-octo/octo.js", "noflo-noflo-github/deps/octo/octo.js");
require.alias("bergie-octo/octo.js", "noflo-noflo-github/deps/octo/index.js");
require.alias("visionmedia-superagent/lib/client.js", "bergie-octo/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "bergie-octo/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");

require.alias("component-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("bergie-octo/octo.js", "bergie-octo/index.js");
require.alias("noflo-noflo-graph/index.js", "noflo-ui/deps/noflo-graph/index.js");
require.alias("noflo-noflo-graph/component.json", "noflo-ui/deps/noflo-graph/component.json");
require.alias("noflo-noflo-graph/components/CreateGraph.js", "noflo-ui/deps/noflo-graph/components/CreateGraph.js");
require.alias("noflo-noflo-graph/components/ListenChanges.js", "noflo-ui/deps/noflo-graph/components/ListenChanges.js");
require.alias("noflo-noflo-graph/components/LoadGraph.js", "noflo-ui/deps/noflo-graph/components/LoadGraph.js");
require.alias("noflo-noflo-graph/components/LoadJson.js", "noflo-ui/deps/noflo-graph/components/LoadJson.js");
require.alias("noflo-noflo-graph/components/SetPropertyValue.js", "noflo-ui/deps/noflo-graph/components/SetPropertyValue.js");
require.alias("noflo-noflo-graph/index.js", "noflo-graph/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-graph/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-graph/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-graph/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-graph/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-graph/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-graph/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-graph/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-graph/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-graph/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-graph/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-graph/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-graph/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-graph/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-graph/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-graph/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-graph/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-graph/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-graph/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-graph/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-graph/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo-runtime/index.js", "noflo-ui/deps/noflo-runtime/index.js");
require.alias("noflo-noflo-runtime/component.json", "noflo-ui/deps/noflo-runtime/component.json");
require.alias("noflo-noflo-runtime/components/ConnectRuntime.js", "noflo-ui/deps/noflo-runtime/components/ConnectRuntime.js");
require.alias("noflo-noflo-runtime/components/ListenLibrary.js", "noflo-ui/deps/noflo-runtime/components/ListenLibrary.js");
require.alias("noflo-noflo-runtime/components/SendGraphChanges.js", "noflo-ui/deps/noflo-runtime/components/SendGraphChanges.js");
require.alias("noflo-noflo-runtime/src/runtimes/base.js", "noflo-ui/deps/noflo-runtime/src/runtimes/base.js");
require.alias("noflo-noflo-runtime/src/runtimes/iframe.js", "noflo-ui/deps/noflo-runtime/src/runtimes/iframe.js");
require.alias("noflo-noflo-runtime/src/runtimes/websocket.js", "noflo-ui/deps/noflo-runtime/src/runtimes/websocket.js");
require.alias("noflo-noflo-runtime/index.js", "noflo-runtime/index.js");
require.alias("noflo-noflo/component.json", "noflo-noflo-runtime/deps/noflo/component.json");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-noflo-runtime/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/InternalSocket.js", "noflo-noflo-runtime/deps/noflo/src/lib/InternalSocket.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-noflo-runtime/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/InPort.js", "noflo-noflo-runtime/deps/noflo/src/lib/InPort.js");
require.alias("noflo-noflo/src/lib/OutPort.js", "noflo-noflo-runtime/deps/noflo/src/lib/OutPort.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-noflo-runtime/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-noflo-runtime/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/ArrayPort.js", "noflo-noflo-runtime/deps/noflo/src/lib/ArrayPort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-noflo-runtime/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/AsyncComponent.js", "noflo-noflo-runtime/deps/noflo/src/lib/AsyncComponent.js");
require.alias("noflo-noflo/src/lib/LoggingComponent.js", "noflo-noflo-runtime/deps/noflo/src/lib/LoggingComponent.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-noflo-runtime/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-runtime/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/Network.js", "noflo-noflo-runtime/deps/noflo/src/lib/Network.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-noflo-runtime/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Journal.js", "noflo-noflo-runtime/deps/noflo/src/lib/Journal.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-noflo-runtime/deps/noflo/src/lib/Utils.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-noflo-runtime/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo-runtime/deps/noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo/deps/emitter/index.js");

require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");

require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/lib/fbp.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-noflo/deps/fbp/index.js");
require.alias("noflo-fbp/lib/fbp.js", "noflo-fbp/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("component-emitter/index.js", "noflo-noflo-runtime/deps/emitter/index.js");

require.alias("the-grid-flowhub-registry/index.js", "noflo-ui/deps/flowhub-registry/index.js");
require.alias("the-grid-flowhub-registry/index.js", "flowhub-registry/index.js");
require.alias("visionmedia-superagent/lib/client.js", "the-grid-flowhub-registry/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "the-grid-flowhub-registry/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");

require.alias("component-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("gjohnson-uuid/index.js", "noflo-ui/deps/uuid/index.js");
require.alias("gjohnson-uuid/index.js", "uuid/index.js");

require.alias("noflo-ui/index.js", "noflo-ui/index.js");