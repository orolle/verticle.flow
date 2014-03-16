noflo = require 'noflo'

class QueryOnly extends noflo.Component
  constructor: ->
    @inPorts =
      value: new noflo.Port 'all'
    @outPorts =
      range: new noflo.Port 'object'

    @inPorts.value.on 'data', (value) =>
      @outPorts.range.send IDBKeyRange.only value
      @outPorts.range.disconnect()

exports.getComponent = -> new QueryOnly
