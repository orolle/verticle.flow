noflo = require 'noflo'

class SendByGroup extends noflo.Component
  description: 'Send packet held in "data" when receiving
  matching set of groups in "in"'
  icon: 'share-square'

  constructor: ->
    @data = {}
    @ungrouped = null
    @dataGroups = []
    @inGroups = []

    @inPorts =
      in: new noflo.Port 'bang'
      data: new noflo.Port 'all'

    @outPorts =
      out: new noflo.ArrayPort 'all'

    @inPorts.data.on 'begingroup', (group) =>
      @dataGroups.push group
    @inPorts.data.on 'data', (data) =>
      unless @dataGroups.length
        @ungrouped = data
        return
      @data[@groupId(@dataGroups)] = data
    @inPorts.data.on 'endgroup', =>
      @dataGroups.pop()

    @inPorts.in.on 'begingroup', (group) =>
      @inGroups.push group
    @inPorts.in.on 'data', (data) =>
      unless @inGroups.length
        @send @ungrouped if @ungrouped isnt null
        return
      id = @groupId @inGroups
      unless @data[id]
        return
      @send @data[id]
    @inPorts.in.on 'endgroup', =>
      @inGroups.pop()
    @inPorts.in.on 'disconnect', =>
      @outPorts.out.disconnect()

  groupId: (groups) ->
    groups.join ':'

  send: (data) ->
    for group in @inGroups
      @outPorts.out.beginGroup group
    @outPorts.out.send data
    for group in @inGroups
      @outPorts.out.endGroup()

exports.getComponent = -> new SendByGroup
