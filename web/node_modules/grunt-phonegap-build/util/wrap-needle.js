var needle = require("needle");

function mapMerge(map1, map2) {
  if (map1 && map2) {
    Object.keys(map2).forEach(function (key) {
      if (map1[key] === undefined) {
        map1[key] = map2[key];
      }
    });
  }

  return map1 ? map1 : map2;
}

module.exports = function wrapNeedle(baseUrl, options) {
  var config = {
        username: options.user.email,
        password: options.user.password,
        timeout: options.timeout
      },
      query = options.user.token ? '?auth_token=' + options.user.token : '',
      wrapped = { };

  Object.keys(needle).forEach(function (property) {
    var needleFn = needle[property];

    if (typeof needleFn === 'function') {
      wrapped[property] = function () {
        var configIndex = needleFn.length - 2,
            args = Array.prototype.slice.call(arguments);

        args[0] = baseUrl + args[0] + query;
        args[configIndex] = mapMerge(args[configIndex], config);

        needleFn.apply(needle, args);
      }
    }
  });

  return wrapped;
};

