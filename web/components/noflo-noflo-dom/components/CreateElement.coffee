noflo = require 'noflo'

class CreateElement extends noflo.Component
  description: 'Create a new DOM Element'
  constructor: ->
    @tagName = null
    @container = null
    @inPorts =
      tagname: new noflo.Port 'string'
      container: new noflo.Port 'object'
    @outPorts =
      element: new noflo.Port 'object'

    @inPorts.tagname.on 'data', (@tagName) =>
      do @createElement
    @inPorts.tagname.on 'disconnect', =>
      unless @inPorts.container.isAttached()
        @outPorts.element.disconnect()
    @inPorts.container.on 'data', (@container) =>
      do @createElement
    @inPorts.container.on 'disconnect', =>
      @outPorts.element.disconnect()

  createElement: ->
    return unless @tagName
    if @inPorts.container.isAttached()
      return unless @container
    el = document.createElement @tagName
    if @container
      @container.appendChild el
    @outPorts.element.send el

exports.getComponent = -> new CreateElement
