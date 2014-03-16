noflo = require 'noflo'

class Get extends noflo.Component
  constructor: ->
    @store = null
    @key = null

    @inPorts =
      store: new noflo.Port 'object'
      key: new noflo.Port 'string'
    @outPorts =
      store: new noflo.Port 'object'
      item: new noflo.Port 'all'
      error: new noflo.Port 'object'

    @inPorts.store.on 'data', (@store) =>
      do @get
    @inPorts.key.on 'data', (@key) =>
      do @get

  get: ->
    return unless @store and @key
    req = @store.get @key
    if @outPorts.store.isAttached()
      @outPorts.store.send @store
      @outPorts.store.disconnect()
    @store = null
    req.onsuccess = (e) =>
      @outPorts.item.beginGroup @key
      @outPorts.item.send e.target.result
      @outPorts.item.endGroup()
      @outPorts.item.disconnect()
      @key = null
    req.onerror = @error.bind @

exports.getComponent = -> new Get
