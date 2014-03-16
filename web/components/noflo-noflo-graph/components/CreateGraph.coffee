noflo = require 'noflo'

class CreateGraph extends noflo.Component
  description: 'Create a NoFlo Graph instance'
  constructor: ->
    @inPorts =
      details: new noflo.Port 'object'
    @outPorts =
      out: new noflo.Port 'object'

    @inPorts.details.on 'data', (details) =>
      graph = new noflo.Graph details.name
      graph.setProperties @normalizeProps details
      @outPorts.out.send graph
    @inPorts.details.on 'disconnect', =>
      @outPorts.out.disconnect()

  normalizeProps: (details) ->
    if details.type
      details.environment =
        runtime: details.type
      delete details.type
    details

exports.getComponent = -> new CreateGraph
