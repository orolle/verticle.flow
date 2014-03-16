noflo = require 'noflo'

class RemoveClass extends noflo.Component
  description: 'Remove a class from an element'
  constructor: ->
    @element = null
    @class = null
    @inPorts =
      element: new noflo.Port 'object'
      class: new noflo.Port 'string'
    @outPorts = {}

    @inPorts.element.on 'data', (data) =>
      @element = data
      do @removeClass if @class
    @inPorts.class.on 'data', (data) =>
      @class = data
      do @removeClass if @element

  removeClass: ->
    @element.classList.remove @class

exports.getComponent = -> new RemoveClass
