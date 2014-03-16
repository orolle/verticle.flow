noflo = require 'noflo'

class Delete extends noflo.Component
  constructor: ->
    @store = null
    @key = null

    @inPorts =
      store: new noflo.Port 'object'
      key: new noflo.Port 'string'
    @outPorts =
      store: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.store.on 'data', (@store) =>
      do @get
    @inPorts.key.on 'data', (@key) =>
      do @get

  get: ->
    return unless @store and @key
    req = @store.delete @key
    req.onsuccess = (e) =>
      if @outPorts.store.isAttached()
        @outPorts.store.send @store
        @outPorts.store.disconnect()
      @key = null
      @store = null
    req.onerror = @error

exports.getComponent = -> new Delete
