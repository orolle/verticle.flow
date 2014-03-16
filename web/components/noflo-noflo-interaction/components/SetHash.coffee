noflo = require 'noflo'

class SetHash extends noflo.Component
  constructor: ->
    @inPorts =
      hash: new noflo.ArrayPort 'string'
    @outPorts =
      out: new noflo.Port 'string'

    @inPorts.hash.on 'data', (data) =>
      window.location.hash = "##{data}"
      @outPorts.out.send data if @outPorts.out.isAttached()

    @inPorts.hash.on 'disconnect', =>
      @outPorts.out.disconnect() if @outPorts.out.isAttached()

exports.getComponent = -> new SetHash
