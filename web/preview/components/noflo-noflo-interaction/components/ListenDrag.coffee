noflo = require 'noflo'

class ListenDrag extends noflo.Component
  description: 'Listen to drag events on a DOM element'
  constructor: ->
    @inPorts =
      element: new noflo.Port 'object'
    @outPorts =
      start: new noflo.ArrayPort 'object'
      movex: new noflo.ArrayPort 'number'
      movey: new noflo.ArrayPort 'number'
      end: new noflo.ArrayPort 'object'

    @inPorts.element.on 'data', (element) =>
      @subscribe element

  subscribe: (element) ->
    element.addEventListener 'dragstart', @dragstart, false
    element.addEventListener 'drag', @dragmove, false
    element.addEventListener 'dragend', @dragend, false

  dragstart: (event) =>
    event.preventDefault()
    event.stopPropagation()

    @outPorts.start.send event
    @outPorts.start.disconnect()

  dragmove: (event) =>
    event.preventDefault()
    event.stopPropagation()
    @outPorts.movex.send event.clientX
    @outPorts.movey.send event.clientY

  dragend: (event) =>
    event.preventDefault()
    event.stopPropagation()

    @outPorts.movex.disconnect() if @outPorts.movex.isConnected()
    @outPorts.movey.disconnect() if @outPorts.movey.isConnected()

    @outPorts.end.send event
    @outPorts.end.disconnect()

exports.getComponent = -> new ListenDrag
