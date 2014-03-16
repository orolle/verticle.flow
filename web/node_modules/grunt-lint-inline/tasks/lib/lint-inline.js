'use strict';

var grunt = require('grunt')
  , jshint = require('grunt-contrib-jshint/tasks/lib/jshint').init(grunt)
  , Tempfile = require('temporary/lib/file')
  , jshintReporter = jshint.reporter;

function removeHTML(src, patterns, replacement) {
  var lines = src.split('\n')
    , relevant = false;

  lines.forEach(function(line, i) {
    var starts = (/<script/i).test(line)
      , stops = (/<\/script/i).test(line);

    if (starts && !(starts && stops)) {
      var type = line.match(/<script[^>]*type=['"]?([^\s"']*)[^>]*>/i);
      relevant = (type === null || type[1] === 'text/javascript');
      lines[i] = '';
    } else if (stops) {
      relevant = false;
    }

    if (!relevant) {
      lines[i] = '';
    }
  });

  return patterns.reduce(function(content, regex){
    return content.replace(regex, replacement);
  }, lines.join('\n'));
}

function createTemporaryFiles(files, patterns, replacement) {
  var map = {};
  files.forEach(function (filepath, index) {
    var source = grunt.file.read(filepath);
    source = removeHTML(source, patterns, replacement);
    if (/^\s*$/.test(source)) return; // Skip files without JavaScript.

    var temporary = new Tempfile();
    temporary.writeFileSync(source);
    map[temporary.path] = { filepath: filepath, file: temporary };
  });

  return map;
}

exports.wrapReporter = function wrapReporter(jshint, options, files, patterns, replacement) {
  var mapTemporary = createTemporaryFiles(files, patterns || [], replacement);
  var tempFiles = Object.keys(mapTemporary);

  // Reattach original reporter so selectReporter defaults to it on multiple
  // executions.
  jshint.reporter = jshintReporter;
  var customReporter = jshint.selectReporter(options);

  // Remove possible custom reporters so jshints own selectReport wont use
  // them, lintinline takes care of delegating them if they are specified.
  ['reporter', 'jslint-reporter', 'checkstyle-reporter', 'show-non-errors'].forEach(function (reporter) {
    delete options[reporter];
  });

  jshint.reporter = function(results, data) {
    results.forEach(function (result, index) {
      var temp = result.file;
      // Change the filepath from the temporary file to the real file path.
      results[index].file = mapTemporary[temp].filepath;
    });
    data.forEach(function (item, index) {
      var temp = item.file;
      data[index].file = mapTemporary[temp].filepath;
    });
    // Clean up
    Object.keys(mapTemporary).forEach(function (temp) {
      mapTemporary[temp].file.unlinkSync();
    });
    // Delegate to the custom reporter or the default jshint reporter.
    customReporter(results, data);
  };

  return tempFiles;
};
