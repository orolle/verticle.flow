noflo = require 'noflo'

class GetAttribute extends noflo.Component
  constructor: ->
    @attribute = null
    @element = null
    @inPorts =
      element: new noflo.Port 'object'
      attribute: new noflo.Port 'string'
    @outPorts =
      out: new noflo.Port 'string'

    @inPorts.element.on 'data', (data) =>
      @element = data
      do @getAttribute if @attribute

    @inPorts.attribute.on 'data', (data) =>
      @attribute = data
      do @getAttribute if @element

  getAttribute: ->
    value = @element.getAttribute @attribute
    @outPorts.out.beginGroup @attribute
    @outPorts.out.send value
    @outPorts.out.endGroup()
    @outPorts.out.disconnect()

exports.getComponent = -> new GetAttribute
