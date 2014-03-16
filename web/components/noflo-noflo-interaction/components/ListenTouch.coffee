noflo = require 'noflo'

class ListenTouch extends noflo.Component
  description: 'Listen to touch events on a DOM element'
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
    element.addEventListener 'touchstart', @touchstart, false
    element.addEventListener 'touchmove', @touchmove, false
    element.addEventListener 'touchend', @touchend, false

  touchstart: (event) =>
    event.preventDefault()
    event.stopPropagation()

    return unless event.changedTouches
    return unless event.changedTouches.length

    for touch, idx in event.changedTouches
      @outPorts.start.beginGroup idx
      @outPorts.start.send event
      @outPorts.start.endGroup()

    @outPorts.start.disconnect()

  touchmove: (event) =>
    event.preventDefault()
    event.stopPropagation()

    return unless event.changedTouches
    return unless event.changedTouches.length

    for touch, idx in event.changedTouches
      @outPorts.movex.beginGroup idx
      @outPorts.movex.send touch.pageX
      @outPorts.movex.endGroup()
      @outPorts.movey.beginGroup idx
      @outPorts.movey.send touch.pageY
      @outPorts.movey.endGroup()

  touchend: (event) =>
    event.preventDefault()
    event.stopPropagation()

    return unless event.changedTouches
    return unless event.changedTouches.length

    @outPorts.movex.disconnect() if @outPorts.movex.isConnected()
    @outPorts.movey.disconnect() if @outPorts.movey.isConnected()

    for touch, idx in event.changedTouches
      @outPorts.end.beginGroup idx
      @outPorts.end.send event
      @outPorts.end.endGroup()

    @outPorts.end.disconnect()

exports.getComponent = -> new ListenTouch
