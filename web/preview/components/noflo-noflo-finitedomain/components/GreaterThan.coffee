noflo = require 'noflo'

class GreaterThan extends noflo.Component
  description: 'Declare that a variable must be greater than another variable'
  constructor: ->
    @varA = null
    @varB = null

    @inPorts =
      space: new noflo.Port 'object'
      greater: new noflo.Port 'string'
      than: new noflo.Port 'string'
    @outPorts =
      space: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.greater.on 'data', (@varA) =>
    @inPorts.than.on 'data', (@varB) =>
    @inPorts.space.on 'data', (space) =>
      if !@varA or !@varB
        @error new Error 'No variables defined'
        return
      space.gt @varA, @varB
      @outPorts.space.send space
    @inPorts.space.on 'disconnect', =>
      @outPorts.space.disconnect()

exports.getComponent = -> new GreaterThan
