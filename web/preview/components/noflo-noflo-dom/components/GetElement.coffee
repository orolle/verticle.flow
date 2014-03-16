noflo = require 'noflo'

class GetElement extends noflo.Component
  description: 'Get a DOM element matching a query'
  constructor: ->
    @container = null

    @inPorts =
      in: new noflo.Port 'object'
      selector: new noflo.Port 'string'
    @outPorts =
      element: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.in.on 'data', (data) =>
      unless typeof data.querySelector is 'function'
        @error 'Given container doesn\'t support querySelectors'
        return
      @container = data

    @inPorts.selector.on 'data', (data) =>
      @select data

  select: (selector) ->
    if @container
      el = @container.querySelectorAll selector
    else
      el = document.querySelectorAll selector
    unless el.length
      @error "No element matching '#{selector}' found"
      return
    @outPorts.element.send element for element in el
    @outPorts.element.disconnect()

  error: (msg) ->
    if @outPorts.error.isAttached()
      @outPorts.error.send new Error msg
      @outPorts.error.disconnect()
      return
    throw new Error msg

exports.getComponent = -> new GetElement
