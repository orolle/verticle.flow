noflo = require 'noflo'

class ListRemove extends noflo.Component
  constructor: ->
    @listKey = null
    @key = null
    @inPorts =
      list: new noflo.Port 'string'
      key: new noflo.Port 'string'
    @outPorts =
      key: new noflo.Port 'string'

    @inPorts.list.on 'data', (@listKey) =>
      do @remove
    @inPorts.key.on 'data', (@key) =>
      do @remove

  remove: ->
    return unless @listKey and @key
    list = localStorage.getItem @listKey
    if list
      items = list.split ','
      if items.indexOf(@key) isnt -1
        items.splice items.indexOf(@key), 1
        localStorage.setItem @listKey, items.join ','
    if @outPorts.key.isAttached()
      @outPorts.key.send @key
      @outPorts.key.disconnect()
    @key = null

exports.getComponent = -> new ListRemove
