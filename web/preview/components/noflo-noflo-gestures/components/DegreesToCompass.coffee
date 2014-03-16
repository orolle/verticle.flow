noflo = require 'noflo'

class DegreesToCompass extends noflo.Component
  description: 'Convert a heading in degrees to a compass direction, e.g. N, SW'
  icon: 'compass'
  constructor: ->
    @inPorts =
      degrees: new noflo.Port 'number'
    @outPorts =
      heading: new noflo.Port 'string'

    headings = [
      'NE'
      'E'
      'SE'
      'S'
      'SW'
      'W'
      'NW'
      'N'
    ]

    @inPorts.degrees.on 'data', (degrees) =>
      index = degrees - 22.5
      if index < 0
        index = index + 360
      index = parseInt index / 45
      @outPorts.heading.send headings[index]
    @inPorts.degrees.on 'disconnect', =>
      @outPorts.heading.disconnect()

exports.getComponent = -> new DegreesToCompass
