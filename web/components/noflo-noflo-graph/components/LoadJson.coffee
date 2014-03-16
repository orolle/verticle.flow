noflo = require 'noflo'

class LoadJson extends noflo.Component
  description: 'Convert a Graph JSON structure into a NoFlo Graph'
  constructor: ->
    @inPorts =
      in: new noflo.Port 'object'
    @outPorts =
      out: new noflo.Port 'object'

    @inPorts.in.on 'data', (data) =>
      noflo.graph.loadJSON data, (graph) =>
        if (data.id and graph.properties.id isnt data.id) or (data.project and graph.properties.project isnt data.project)
          graph.setProperties
            id: data.id
            project: data.project
        @outPorts.out.send graph

    @inPorts.in.on 'disconnect', =>
      @outPorts.out.disconnect()

exports.getComponent = -> new LoadJson
