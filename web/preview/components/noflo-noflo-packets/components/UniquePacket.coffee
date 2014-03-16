noflo = require 'noflo'

class UniquePacket extends noflo.Component
  constructor: ->
    @seen = []
    @groups = []

    @inPorts =
      in: new noflo.Port 'all'
      clear: new noflo.Port 'bang'
    @outPorts =
      out: new noflo.Port 'all'
      duplicate: new noflo.Port 'all'

    @inPorts.in.on 'begingroup', (group) =>
      @groups.push group
    @inPorts.in.on 'data', (data) =>
      unless @unique data
        return unless @outPorts.duplicate.isAttached()
        @outPorts.duplicate.send data
        return
      for group in @groups
        @outPorts.out.beginGroup group
      @outPorts.out.send data
      for group in @groups
        @outPorts.out.endGroup()
    @inPorts.in.on 'endgroup', =>
      @groups.pop()
    @inPorts.in.on 'disconnect', =>
      @outPorts.out.disconnect()
      return unless @outPorts.duplicate.isAttached()
      @outPorts.duplicate.disconnect()

    @inPorts.clear.on 'data', =>
      @seen = []
      @groups = []

  unique: (packet) ->
    return false unless @seen.indexOf(packet) is -1
    @seen.push packet
    return true

exports.getComponent = -> new UniquePacket
