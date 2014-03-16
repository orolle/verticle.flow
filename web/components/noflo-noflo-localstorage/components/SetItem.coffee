noflo = require 'noflo'

class SetItem extends noflo.Component
  constructor: ->
    @key = null
    @value = null
    @inPorts =
      key: new noflo.Port 'string'
      value: new noflo.Port 'string'
    @outPorts =
      item: new noflo.Port 'string'

    @inPorts.key.on 'data', (data) =>
      return unless data
      @key = data
      do @setItem if @value
    @inPorts.value.on 'data', (data) =>
      @value = data
      do @setItem if @key

  setItem: ->
    localStorage.setItem @key, @value
    if @outPorts.item.isAttached()
      @outPorts.item.beginGroup @key
      @outPorts.item.send @value
      @outPorts.item.endGroup()
      @outPorts.item.disconnect()

    @key = null
    @value = null

exports.getComponent = -> new SetItem
