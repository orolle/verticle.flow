noflo = require 'noflo'

class SetAttribute extends noflo.Component
  constructor: ->
    @attribute = null
    @value = null
    @element = null

    @inPorts =
      element: new noflo.Port 'object'
      attribute: new noflo.Port 'string'
      value: new noflo.Port 'string'
    @outPorts =
      element: new noflo.Port 'object'

    @inPorts.element.on 'data', (@element) =>
      do @setAttribute if @attribute and @value
    @inPorts.attribute.on 'data', (@attribute) =>
      do @setAttribute if @element and @value
    @inPorts.value.on 'data', (value) =>
      @value = @normalizeValue value
      do @setAttribute if @attribute and @element

  setAttribute: ->
    @element.setAttribute @attribute, @value
    @value = null

    if @outPorts.element.isAttached()
      @outPorts.element.send @element
      @outPorts.element.disconnect()

  normalizeValue: (value) ->
    if typeof value is 'object'
      unless toString.call(value) is '[object Array]'
        newVal = []
        newVal.push val for key, val of value
        value = newVal
      return value.join ' '
    return value

exports.getComponent = -> new SetAttribute
