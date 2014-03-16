noflo = require 'noflo'

class CalculateCenter extends noflo.Component
  description: 'Calculate the center point for a gesture'
  constructor: ->
    @inPorts =
      in: new noflo.Port 'object'
    @outPorts =
      center: new noflo.Port 'object'

    @inPorts.in.on 'data', (gesture) =>
      @outPorts.center.send @calculateCenter gesture
    @inPorts.in.on 'disconnect', =>
      @outPorts.center.disconnect()

  calculateCenter: (gesture) ->
    if Object.keys(gesture).length is 1
      # Single touch, send the starting point as center
      return gesture.startpoint
    startX = []
    startY = []
    for id, touch of gesture
      continue unless touch
      continue unless touch.startpoint
      startX.push touch.startpoint.x
      startY.push touch.startpoint.y
    center =
      x: Math.min.apply(Math, startX) + Math.max.apply(Math, startX) / 2
      y: Math.min.apply(Math, startY) + Math.max.apply(Math, startY) / 2

exports.getComponent = -> new CalculateCenter
