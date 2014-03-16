noflo = require 'noflo'

class QueryTo extends noflo.Component
  constructor: ->
    @including = false
    @inPorts =
      value: new noflo.Port 'all'
      including: new noflo.Port 'boolean'
    @outPorts =
      range: new noflo.Port 'object'

    @inPorts.value.on 'data', (value) =>
      @outPorts.range.send IDBKeyRange.upperBound value, @including
      @outPorts.range.disconnect()
    @inPorts.including.on 'data', (@including) =>

exports.getComponent = -> new QueryTo
