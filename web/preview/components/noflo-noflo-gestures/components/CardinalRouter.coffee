noflo = require 'noflo'

class CardinalRouter extends noflo.Component
  description: 'Route values based on their cardinal directions'
  icon: 'compass'
  constructor: ->
    @inPorts =
      degrees: new noflo.Port 'number'
    @outPorts =
      e: new noflo.Port 'number'
      s: new noflo.Port 'number'
      w: new noflo.Port 'number'
      n: new noflo.Port 'number'

    headings = [
      'e'
      's'
      'w'
      'n'
    ]

    @inPorts.degrees.on 'data', (degrees) =>
      index = degrees - 45
      if index < 0
        index = index + 360
      index = parseInt index / 90
      heading = headings[index]
      return unless @outPorts[heading].isAttached()
      @outPorts[heading].send degrees
      @outPorts[heading].disconnect()

exports.getComponent = -> new CardinalRouter
