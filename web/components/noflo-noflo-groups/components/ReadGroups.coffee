noflo = require 'noflo'
_ = require 'underscore'

class ReadGroups extends noflo.Component
  constructor: ->
    @strip = false
    @threshold = Infinity

    @inPorts =
      in: new noflo.ArrayPort
      strip: new noflo.Port
      threshold: new noflo.Port
    @outPorts =
      out: new noflo.Port
      group: new noflo.Port

    @inPorts.threshold.on 'data', (threshold) =>
      @threshold = parseInt threshold
    @inPorts.strip.on 'data', (strip) =>
      @strip = strip is 'true'

    @inPorts.in.on 'connect', =>
      @count = 0
      @groups = []

    @inPorts.in.on 'begingroup', (group) =>
      beginGroup = =>
        @groups.push group
        @outPorts.out.beginGroup group if @outPorts.out.isAttached()

      # Just forward if we're past the threshold
      if @count >= @threshold
        beginGroup group

      # Otherwise send a copy to port GROUP
      else
        @outPorts.group.send group
        beginGroup group unless @strip
        @count++

    @inPorts.in.on 'endgroup', (group) =>
      if group is _.last @groups
        @groups.pop()
        @outPorts.out.endGroup() if @outPorts.out.isAttached()

    @inPorts.in.on 'data', (data) =>
      @outPorts.out.send data if @outPorts.out.isAttached()

    @inPorts.in.on 'disconnect', =>
      @outPorts.out.disconnect() if @outPorts.out.isAttached()
      @outPorts.group.disconnect()

exports.getComponent = -> new ReadGroups
