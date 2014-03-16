noflo = require 'noflo'

class DegreesToCardinal extends noflo.Component
  description: 'Convert a heading in degrees to a cardinal direction, e.g. N, S'
  icon: 'compass'
  constructor: ->
    @inPorts =
      degrees: new noflo.Port 'number'
    @outPorts =
      heading: new noflo.Port 'string'

    headings = [
      'E'
      'S'
      'W'
      'N'
    ]

    @inPorts.degrees.on 'data', (degrees) =>
      index = degrees - 45
      if index < 0
        index = index + 360
      index = parseInt index / 90
      @outPorts.heading.send headings[index]
    @inPorts.degrees.on 'disconnect', =>
      @outPorts.heading.disconnect()

exports.getComponent = -> new DegreesToCardinal
