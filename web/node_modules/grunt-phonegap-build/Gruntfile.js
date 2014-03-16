module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    testacularServer: {
      unit: {
        configFile: "testacular.conf.js"
      }
    },
  });

  // Load local tasks.
  grunt.loadNpmTasks('grunt-testacular');

  // Load local tasks.
  grunt.loadTasks('tasks');

  // Default task.
  grunt.registerTask('default', 'testacularServer');
  grunt.registerTask('test', 'testacularServer');
};
