/**
 * Module dependencies
 */
var path = require("path");

/**
 * Expose plugin
 */
module.exports = function(options) {
  options = options || {};
  var property = options.property || "json";

  function build(builder) {
    builder.hook('before scripts', function(pkg){

      var files = pkg.config[property];
      if (!files) return;

      var jsonFiles = [];

      files.forEach(function(file){
        var ext = path.extname(file);
        if (ext != ".json") return;

        jsonFiles.push(file);

        var json = require(pkg.path(file));

        var js = "module.exports = JSON.parse('"+JSON.stringify(json).replace(/'/g, "\\'")+"');";

        pkg.addFile('scripts', file, js);
      });

      jsonFiles.forEach(function(file) {
        pkg.removeFile(property, file);
      });
    });
  };

  // If consumed directly though `component build --use component-json`
  return 'function' === typeof options.hook
    ? build(options)
    : build;
};
