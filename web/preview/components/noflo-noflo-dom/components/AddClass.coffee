noflo = require 'noflo'

class AddClass extends noflo.Component
  description: 'Add a class to an element'
  constructor: ->
    @element = null
    @class = null
    @inPorts =
      element: new noflo.Port 'object'
      class: new noflo.Port 'string'
    @outPorts = {}

    @inPorts.element.on 'data', (data) =>
      @element = data
      do @addClass if @class
    @inPorts.class.on 'data', (data) =>
      @class = data
      do @addClass if @element

  addClass: ->
    @element.classList.add @class

exports.getComponent = -> new AddClass
