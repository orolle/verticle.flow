noflo = require 'noflo'

class DetectScratch extends noflo.Component
  constructor: ->
    @minturns = 3
    @distance = 20
    @minSpeed = 0
    @prevPoint = null
    @prevAngle = null
    @prevTime = null
    @speedChecked = false
    @turns = 0
    @inPorts =
      in: new noflo.Port 'object'
      distance: new noflo.Port 'number'
      speed: new noflo.Port 'number'
    @outPorts =
      pass: new noflo.Port 'object'
      fail: new noflo.Port 'object'

    @inPorts.in.on 'data', (data) =>
      if Object.keys(data).length > 1
        # Ignore multi-touch
        @outPorts.fail.send data
        return
      @detect data
    @inPorts.in.on 'disconnect', (data) =>
      @outPorts.pass.disconnect()
      @outPorts.fail.disconnect()
    @inPorts.distance.on 'data', (@distance) =>
    @inPorts.speed.on 'data', (@minSpeed) =>

  detect: (gesture) ->
    touch = gesture[Object.keys(gesture)[0]]
    if touch.endpoint
      do @reset
      @outPorts.fail.send gesture
      return
    unless @prevPoint
      @prevPoint = touch.startpoint
      @prevTime = new Date
      return
    distance = @calculateDistance @prevPoint, touch.movepoint
    if distance < @distance
      return
    time = new Date
    unless @speedChecked
      elapsed = time.getTime() - @prevTime.getTime()
      speed = distance / elapsed
      if speed < @minSpeed
        do @reset
        @outPorts.fail.send gesture
        return
      @speedChecked = true

    angle = @calculateAngle @prevPoint, touch.movepoint
    unless @prevAngle
      @prevAngle = angle
      return

    turn = Math.abs @angleChange @prevAngle, angle
    @prevPoint = touch.movepoint
    @prevAngle = angle
    return unless turn > 130
    @prevTime = time
    @turns++
    if @turns >= @minturns
      do @reset
      @outPorts.pass.send gesture

  calculateDistance: (origin, destination) ->
    deltaX = destination.x - origin.x
    deltaY = destination.y - origin.y
    distance = Math.sqrt Math.pow(deltaX, 2) + Math.pow(deltaY, 2)
    return distance

  calculateAngle: (origin, destination) ->
    deltaX = destination.x - origin.x
    deltaY = destination.y - origin.y
    angle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI) + 90
    angle = angle + 360 if angle < 0
    return angle

  angleChange: (previous, current) ->
    difference = current - previous
    while difference < -180
      difference += 360
    while difference > 180
      difference -= 360
    difference

  reset: ->
    @turns = 0
    @prevPoint = null
    @prevAngle = null
    @prevTime = null
    @speedChecked = false

exports.getComponent = -> new DetectScratch
