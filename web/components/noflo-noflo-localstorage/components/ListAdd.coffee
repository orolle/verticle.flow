noflo = require 'noflo'

class ListAdd extends noflo.Component
  constructor: ->
    @listKey = null
    @key = null
    @inPorts =
      list: new noflo.Port 'string'
      key: new noflo.Port 'string'
    @outPorts =
      key: new noflo.Port 'string'

    @inPorts.list.on 'data', (@listKey) =>
      do @add
    @inPorts.key.on 'data', (@key) =>
      do @add

  add: ->
    return unless @listKey and @key
    list = localStorage.getItem @listKey
    if list
      items = list.split ','
    else
      items = []
    if items.indexOf(@key) is -1
      items.push @key
      localStorage.setItem @listKey, items.join ','
    if @outPorts.key.isAttached()
      @outPorts.key.send @key
      @outPorts.key.disconnect()
    @key = null

exports.getComponent = -> new ListAdd
