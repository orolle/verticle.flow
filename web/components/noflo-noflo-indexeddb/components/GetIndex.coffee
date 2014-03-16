noflo = require 'noflo'

class GetIndex extends noflo.Component
  constructor: ->
    @store = null
    @name = null

    @inPorts =
      store: new noflo.Port 'object'
      name: new noflo.Port 'string'
    @outPorts =
      index: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.store.on 'data', (@store) =>
      do @get
    @inPorts.name.on 'data', (@name) =>
      do @get

  get: ->
    return unless @store and @name
    @store.onerror = @error
    index = @store.index @name
    @store.onerror = null

    @outPorts.index.beginGroup @name
    @outPorts.index.send index
    @outPorts.index.endGroup()
    @outPorts.index.disconnect()

    @store = null
    @name = null

exports.getComponent = -> new GetIndex
