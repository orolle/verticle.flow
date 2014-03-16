var needle = require("needle"),
    wrapNeedle = require("../util/wrap-needle"),
    read = require("read");

function responseHandler(name, taskRefs, success, error) {
  error = error || taskRefs.done;

  return function (err, resp, body) {
    if (!err && (resp.statusCode >= 200 && resp.statusCode < 400)) {
      taskRefs.log.ok(name + " successful (HTTP " + resp.statusCode + ")");
      success(resp, body);
    } else if (err) {
      taskRefs.log.fail(name + " failed:");
      taskRefs.log.error("Message: " + err);
      error(new Error(err));
    } else {
      taskRefs.log.fail(name + " failed (HTTP " + resp.statusCode + ")");
      taskRefs.log.error("Message: " + body.error);
      error(new Error(body.error));
    }
  }
}

function start(taskRefs) {
  var uploadHandler = responseHandler("Upload", taskRefs, function () {
    if (taskRefs.options.download) downloadApps(taskRefs, taskRefs.done);
    else taskRefs.done();
  });

  taskRefs.needle = wrapNeedle("https://build.phonegap.com", taskRefs.options);

  if (taskRefs.options.keys) {
    unlockKeys(taskRefs, uploadZip.bind(null, taskRefs, uploadHandler));
  } else {
    uploadZip(taskRefs, uploadHandler);
  }
}

function unlockKeys(taskRefs, callback) {
  taskRefs.needle.get('/api/v1/apps/' + taskRefs.options.appId, null,
      responseHandler("Get keys", taskRefs, function (response, body) {
        var keys = body.keys,
            platformsUnlockable = Object.keys(taskRefs.options.keys),
            numUnlockable = platformsUnlockable.length;

        function unlocked() {
          if (--numUnlockable === 0) callback();
        }

        platformsUnlockable.forEach(function (platform) {
          var buildInfo = keys[platform];

          if (buildInfo) {
            taskRefs.needle.put(keys[platform].link, { data: taskRefs.options.keys[platform] }, null,
                responseHandler("Unlocking " + platform, taskRefs, unlocked, unlocked));
          } else {
            taskRefs.log.warn("No key attached to app for " + platform);
            unlocked();
          }
        });
      })
  );
}

function uploadZip(taskRefs, callback) {
  var config = { },
      data;

  if (taskRefs.options.isRepository) {
    data = { data: { pull: true } };
  } else {
    data = { file: { file: taskRefs.options.archive, content_type: "application/zip" }};
    config.multipart = true;
  }

  taskRefs.log.ok("Starting upload");
  taskRefs.needle.put('/api/v1/apps/' + taskRefs.options.appId, data, config, callback);
}

function downloadApps(taskRefs, callback) {
  var platformsToDownload = Object.keys(taskRefs.options.download),
      numToDownload = platformsToDownload.length,
      timeoutId;

  function completed() {
    if (--numToDownload === 0) {
      clearTimeout(timeoutId);
      callback();
    }
  }

  function ready(platform, status, url) {
    platformsToDownload.splice(platformsToDownload.indexOf(platform), 1);
    if (status === 'complete') {
      taskRefs.needle.get(url, null,
          responseHandler("Getting download location for " + platform, taskRefs, function (response, data) {
            taskRefs.log.ok("Downloading " + platform + " app");
            needle.get(data.location, null,
                function (err, response, data) {
                  taskRefs.log.ok("Downloaded " + platform + " app");
                  require('fs').writeFile(taskRefs.options.download[platform], data, completed);
                }
            );
          }, completed)
      );
    } else {
      taskRefs.log.error('Build failed for ' + platform + ': ' + status);
      completed();
    }
  }

  function check() {
    taskRefs.needle.get('/api/v1/apps/' + taskRefs.options.appId, null,
        responseHandler("Checking build status", taskRefs, function (response, data) {
          platformsToDownload.forEach(function (platform) {
            if (data.status[platform] !== 'pending') {
              ready(platform, data.status[platform], data.download[platform]);
            }
          });

          timeoutId = setTimeout(check, taskRefs.options.pollRate);
        })
    );
  }

  timeoutId = setTimeout(check, taskRefs.options.pollRate);
}

module.exports = function (grunt) {
  grunt.registerMultiTask("phonegap-build", "Creates a ZIP archive and uploads it to build.phonegap.com to create a new build", function (args) {
    var opts = this.options({
      timeout: 60000,
      pollRate: 15000
    });

    if (!grunt.file.exists(opts.archive)) {
      grunt.log.fail("Archive at " + opts.archive + " does not exist! Forgot to run 'zip' task before? Did 'zip' succeed?");
      return false;
    }

    var done = this.async(),
        taskRefs = {
          log: grunt.log, options: opts, done: done,
          needle: null /* wrapped version added in start */
        };

    if (!opts.user.password && !opts.user.token) {
      read({ prompt: 'Password: ', silent: true }, function (er, password) {
        opts.user.password = password;
        start(taskRefs);
      });
    } else {
      start(taskRefs);
    }
  });
}
