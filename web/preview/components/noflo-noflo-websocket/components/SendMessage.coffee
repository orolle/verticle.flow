noflo = require 'noflo'

class SendMessage extends noflo.Component
  constructor: ->
    @connection = null
    @buffer = []
    @inPorts =
      connection: new noflo.Port 'object'
      string: new noflo.Port 'string'
    @outPorts = {}

    @inPorts.connection.on 'data', (@connection) =>
      do @clearBuffer if @buffer.length

    @inPorts.string.on 'data', (data) =>
      return @send data if @connection
      @buffer.push data

  send: (message) ->
    if noflo.isBrowser()
      @connection.send message
      return
    @connection.sendUTF message

  clearBuffer: ->
    @send message for message in @buffer
    @buffer = []

exports.getComponent = -> new SendMessage
