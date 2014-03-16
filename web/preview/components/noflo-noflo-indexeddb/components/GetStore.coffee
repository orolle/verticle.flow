noflo = require 'noflo'

class GetStore extends noflo.Component
  constructor: ->
    @transaction = null
    @name = null

    @inPorts =
      name: new noflo.Port 'string'
      transaction: new noflo.Port 'object'
    @outPorts =
      store: new noflo.Port 'object'
      transaction: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.name.on 'data', (@name) =>
      do @get
    @inPorts.transaction.on 'data', (@transaction) =>
      do @get

  get: ->
    return unless @name and @transaction
    @transaction.onerror = @error
    store = @transaction.objectStore @name
    @transaction.onerror = null
    @outPorts.store.beginGroup @name
    @outPorts.store.send store
    @outPorts.store.endGroup()
    @outPorts.store.disconnect()

    if @outPorts.transaction.isAttached()
      @outPorts.transaction.send @transaction
      @outPorts.transaction.disconnect()
    @transaction = null
    @name = null

exports.getComponent = -> new GetStore
