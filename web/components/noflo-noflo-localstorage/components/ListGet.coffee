noflo = require 'noflo'

class ListGet extends noflo.Component
  constructor: ->
    @inPorts =
      key: new noflo.Port 'string'
    @outPorts =
      items: new noflo.Port 'string'
      error: new noflo.Port 'object'
    @inPorts.key.on 'data', (data) =>
      value = localStorage.getItem data
      unless value
        if @outPorts.error.isAttached()
          @outPorts.error.send new Error "#{data} not found"
          @outPorts.error.disconnect()
        return
      vals = value.split ','
      @outPorts.items.beginGroup data
      @outPorts.items.send val for val in vals
      @outPorts.items.endGroup()
    @inPorts.key.on 'disconnect', =>
      @outPorts.items.disconnect()

exports.getComponent = -> new ListGet
