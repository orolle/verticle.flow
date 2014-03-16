noflo = require 'noflo'

class DeclareVariable extends noflo.Component
  description: 'Declare a variable into a Finite Domain solving space'
  constructor: ->
    @variable = null
    @domain = null
    @inPorts =
      space: new noflo.Port 'object'
      variable: new noflo.Port 'string'
      domain: new noflo.Port 'array'
    @outPorts =
      space: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.variable.on 'data', (@variable) =>
    @inPorts.domain.on 'data', (domain) =>
      if typeof domain is 'string'
        @domain = JSON.parse domain
      else
        @domain = domain
    @inPorts.space.on 'data', (space) =>
      unless @variable
        @error new Error 'No variable defined'
        return
      @declareVar space
      @outPorts.space.send space
    @inPorts.space.on 'disconnect', =>
      @outPorts.space.disconnect()

  declareVar: (space) ->
    space.decl @variable, @domain
    @domain = null

exports.getComponent = -> new DeclareVariable
