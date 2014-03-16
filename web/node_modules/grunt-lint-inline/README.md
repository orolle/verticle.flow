grunt-lint-inline [![Build Status](https://travis-ci.org/oxyc/grunt-lint-inline.png?branch=master)](https://travis-ci.org/oxyc/grunt-lint-inline)
=================

Grunt task for linting inline JavaScript.

## Getting started

This plugin requires Grunt `~0.4.0`

```
npm install grunt-lint-inline --save-dev
```

```javascript
grunt.loadNpmTasks('grunt-lint-inline');
```

## Usage

The task leverages [grunt-contrib-jshint][1] by wrapping around it and removing all code not within `<script>`-tags.

JSHint options will be read exactly the same as the JSHint task.

```javascript
grunt.initConfig({
  inlinelint: {
    html: ['**/*.html'],
    php: ['**/*.php']
  }
});
```

### Additional Options

#### patterns

Type: `Array`
Default: `[]`

Enable pattern replacement by sending in an array of RegExp-objects. Replacement are done inside the script tags and matches are replaced with provided replacement or defaults to an empty string.

```javascript
grunt.initConfig({
  inlinelint: {
	cshtml: {
		src: ['**/*.html'],
		options: {
			patterns: [
				/([\"|\']?)@\w[\w\.\(\)]+/g
			],
			replacement: ''
		}
	}
  }
});
```

## License

MIT

[1]: https://github.com/gruntjs/grunt-contrib-jshint
