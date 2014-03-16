noflo = require 'noflo'

class ListenChange extends noflo.Component
  description: 'Listen to mouse events on a DOM element'
  constructor: ->
    @inPorts =
      element: new noflo.Port 'object'
    @outPorts =
      value: new noflo.ArrayPort 'all'

    @inPorts.element.on 'data', (element) =>
      @subscribe element

  subscribe: (element) ->
    element.addEventListener 'change', @change, false

  change: (event) =>
    return unless @outPorts.value.sockets.length
    event.preventDefault()
    event.stopPropagation()

    @outPorts.value.send event.target.value
    @outPorts.value.disconnect()

exports.getComponent = -> new ListenChange
