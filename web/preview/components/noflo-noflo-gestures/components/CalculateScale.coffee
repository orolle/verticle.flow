noflo = require 'noflo'

class CalculateScale extends noflo.Component
  description: 'Calculate the scale based on gestural movement'
  constructor: ->
    @inPorts =
      in: new noflo.Port 'object'
    @outPorts =
      scale: new noflo.Port 'number'

    @inPorts.in.on 'data', (gesture) =>
      @outPorts.scale.send @calculateScale gesture
    @inPorts.in.on 'disconnect', =>
      @outPorts.scale.disconnect()

  calculateScale: (gesture) ->
    if Object.keys(gesture).length is 1
      # Single touch, send the starting point as center
      return 1
    startPoints = []
    movePoints = []
    for id, touch of gesture
      if touch.startpoint
        startPoints.push touch.startpoint
      if touch.movepoint
        movePoints.push touch.movepoint
    if startPoints.length < 2 or movePoints.length < 2
      return 1
    scale = @calculateDistance(movePoints[0], movePoints[1]) /
      @calculateDistance(startPoints[0], startPoints[1])
    scale

  calculateDistance: (origin, destination) ->
    deltaX = destination.x - origin.x
    deltaY = destination.y - origin.y
    origin = null
    destination = null
    distance = Math.sqrt Math.pow(deltaX, 2) + Math.pow(deltaY, 2)
    return distance

exports.getComponent = -> new CalculateScale
