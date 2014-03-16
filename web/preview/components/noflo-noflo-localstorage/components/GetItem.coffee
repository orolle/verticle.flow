noflo = require 'noflo'

class GetItem extends noflo.Component
  constructor: ->
    @inPorts =
      key: new noflo.Port 'string'
    @outPorts =
      item: new noflo.Port 'string'
      error: new noflo.Port 'object'

    @inPorts.key.on 'data', (data) =>
      value = localStorage.getItem data
      unless value
        if @outPorts.error.isAttached()
          @outPorts.error.send new Error "#{data} not found"
          @outPorts.error.disconnect()
        return
      @outPorts.item.beginGroup data
      @outPorts.item.send value
      @outPorts.item.endGroup()
    @inPorts.key.on 'disconnect', =>
      @outPorts.item.disconnect()

exports.getComponent = -> new GetItem
