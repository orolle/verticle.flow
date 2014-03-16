noflo = require 'noflo'

class MoveElement extends noflo.Component
  description: 'Change the coordinates of a DOM element'
  icon: 'arrows'
  constructor: ->
    @element = null
    @inPorts =
      element: new noflo.Port 'object'
      point: new noflo.Port 'object'
      x: new noflo.Port 'number'
      y: new noflo.Port 'number'
      z: new noflo.Port 'number'

    @inPorts.element.on 'data', (element) =>
      @element = element
    @inPorts.point.on 'data', (point) =>
      @setPosition 'left', "#{point.x}px"
      @setPosition 'top', "#{point.y}px"
    @inPorts.x.on 'data', (x) =>
      @setPosition 'left', "#{x}px"
    @inPorts.y.on 'data', (y) =>
      @setPosition 'top', "#{y}px"
    @inPorts.z.on 'data', (z) =>
      @setPosition 'zIndex', z

  setPosition: (attr, value) ->
    @element.style.position = 'absolute'
    @element.style[attr] = value

exports.getComponent = -> new MoveElement
