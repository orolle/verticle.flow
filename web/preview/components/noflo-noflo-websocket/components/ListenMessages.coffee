noflo = require 'noflo'

class ListenMessages extends noflo.Component
  constructor: ->
    @inPorts =
      connection: new noflo.Port 'object'
    @outPorts =
      string: new noflo.Port 'string'
      binary: new noflo.Port 'binary'

    @inPorts.connection.on 'data', (data) =>
      @subscribe data

  subscribe: (connection) ->
    if noflo.isBrowser()
      return unless @outPorts.string.isAttached()
      connection.addEventListener 'message', (message) =>
        @outPorts.string.send message.data
      , false
      connection.addEventListener 'close', (message) =>
        @outPorts.string.disconnect()
      , false
      return
    connection.on 'message', (message) =>
      if message.type is 'utf8' and @outPorts.string.isAttached()
        @outPorts.string.send message.utf8Data
        return
      if message.type is 'binary' and @outPorts.binary.isAttached()
        @outPorts.binary.send message.binaryData
        return

    connection.on 'close', =>
      @outPorts.string.disconnect() if @outPorts.string.isAttached()
      @outPorts.binary.disconnect() if @outPorts.binary.isAttached()

exports.getComponent = -> new ListenMessages
