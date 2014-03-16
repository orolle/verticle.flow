noflo = require 'noflo'

class CollectObject extends noflo.Component
  description: 'Collect packets to an object identified by keys organized
  by connection'

  constructor: ->
    @keys = []
    @allpackets = []
    @data = {}
    @groups = {}

    @inPorts =
      keys: new noflo.ArrayPort 'string'
      allpackets: new noflo.ArrayPort 'string'
      collect: new noflo.ArrayPort 'all'
      release: new noflo.Port 'bang'
      clear: new noflo.Port 'bang'
    @outPorts =
      out: new noflo.Port 'object'

    @inPorts.keys.on 'data', (key) =>
      keys = key.split ','
      if keys.length > 1
        @keys = []
      for key in keys
        @keys.push key

    @inPorts.allpackets.on 'data', (key) =>
      allpackets = key.split ','
      if allpackets.length > 1
        @keys = []
      for key in allpackets
        @allpackets.push key

    @inPorts.collect.once 'connect', =>
      @subscribeSockets()

    @inPorts.release.on 'data', =>
      do @release
    @inPorts.release.on 'disconnect', =>
      @outPorts.out.disconnect()
    @inPorts.clear.on 'data', =>
      do @clear

  release: ->
    @outPorts.out.send @data
    @data = @clone @data

  subscribeSockets: ->
    # Subscribe to sockets individually
    @inPorts.collect.sockets.forEach (socket, idx) =>
      @subscribeSocket socket, idx

  subscribeSocket: (socket, id) ->
    socket.on 'begingroup', (group) =>
      unless @groups[id]
        @groups[id] = []
      @groups[id].push group
    socket.on 'data', (data) =>
      return unless @keys[id]
      groupId = @groupId @groups[id]
      unless @data[groupId]
        @data[groupId] = {}
      if @allpackets.indexOf(@keys[id]) isnt -1
        unless @data[groupId][@keys[id]]
          @data[groupId][@keys[id]] = []
        @data[groupId][@keys[id]].push data
        return
      @data[groupId][@keys[id]] = data
    socket.on 'endgroup', =>
      return unless @groups[id]
      @groups[id].pop()

  groupId: (groups) ->
    unless groups.length
      return 'ungrouped'
    groups[0]

  clone: (data) ->
    newData = {}
    for groupName, groupedData of data
      newData[groupName] = {}
      for name, value of groupedData
        continue unless groupedData.hasOwnProperty name
        newData[groupName][name] = value
    newData

  clear: ->
    @data = {}
    @groups = {}

exports.getComponent = -> new CollectObject
