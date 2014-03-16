component-json
==============

Component plugin for requiring JSON files

Usage
-----

```js
var json = require("component-json");

builder.use(json());

```

```js
// my-app.js

var component = require("./component.json");

console.log(component.version);
```

```json
// component.json
{
  ...
  "json": [
    "component.json"
  ]
  ...
}

```

Or use directly with `component-build`

```
$ npm install component-json
$ component build --use component-json
```
