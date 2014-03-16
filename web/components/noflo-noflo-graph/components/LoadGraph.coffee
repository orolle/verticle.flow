noflo = require 'noflo'

class LoadGraph extends noflo.Component
  description: 'Load a JSON or FBP string into a NoFlo graph'
  constructor: ->
    @inPorts = new noflo.InPorts
      in:
        datatype: 'string'
        required: true
    @outPorts = new noflo.OutPorts
      out:
        datatype: 'object'
        required: true
      error:
        datatype: 'object'
        required: 'false'

    @inPorts.in.on 'data', (data) =>
      @toGraph data

    @inPorts.in.on 'disconnect', =>
      @outPorts.out.disconnect()

  toGraph: (data) ->
    if data.indexOf('->') isnt -1
      try
        noflo.graph.loadFBP data, (graph) =>
          @outPorts.out.send graph
      catch e
        @outPorts.error.send e
        @outPorts.error.disconnect()
      return
    try
      noflo.graph.loadJSON data, (graph) =>
        @outPorts.out.send graph
    catch e
      @outPorts.error.send e
      @outPorts.error.disconnect()

exports.getComponent = -> new LoadGraph
