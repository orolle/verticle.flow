noflo = require 'noflo'

class RemoveItem extends noflo.Component
  constructor: ->
    @inPorts =
      key: new noflo.Port 'string'
    @outPorts =
      item: new noflo.Port 'string'

    @inPorts.key.on 'data', (data) =>
      localStorage.removeItem data
      @outPorts.item.beginGroup data
      @outPorts.item.send null
      @outPorts.item.endGroup()
      @outPorts.item.disconnect()

exports.getComponent = -> new RemoveItem
