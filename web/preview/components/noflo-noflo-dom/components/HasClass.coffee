noflo = require 'noflo'

class HasClass extends noflo.Component
  description: 'Check if an element has a given class'
  constructor: ->
    @element = null
    @class = null
    @inPorts =
      element: new noflo.Port 'object'
      class: new noflo.Port 'string'
    @outPorts =
      element: new noflo.Port 'object'
      missed: new noflo.Port 'object'

    @inPorts.element.on 'data', (data) =>
      @element = data
      do @checkClass if @class
    @inPorts.element.on 'disconnect', =>
      @outPorts.element.disconnect()
      return unless @outPorts.missed.isAttached()
      @outPorts.missed.disconnect()
    @inPorts.class.on 'data', (data) =>
      @class = data
      do @checkClass if @element

  checkClass: ->
    if @element.classList.contains @class
      @outPorts.element.send @element
      return
    return unless @outPorts.missed.isAttached()
    @outPorts.missed.send @element

exports.getComponent = -> new HasClass
