noflo = require 'noflo'

class BeginTransaction extends noflo.Component
  constructor: ->
    @stores = null
    @db = null
    @mode = 'readwrite'

    @inPorts =
      stores: new noflo.Port 'string'
      db: new noflo.Port 'object'
      mode: new noflo.Port 'string'
    @outPorts =
      transaction: new noflo.Port 'object'
      db: new noflo.Port 'object'
      error: new noflo.Port 'error'
      complete: new noflo.Port 'bang'

    @inPorts.stores.on 'data', (data) =>
      @stores = data.split ','
      do @begin
    @inPorts.db.on 'data', (@db) =>
      do @begin
    @inPorts.mode.on 'data', (@mode) =>

  begin: ->
    return unless @db and @stores
    transaction = @db.transaction @stores, @mode
    transaction.oncomplete = =>
      if @outPorts.complete.isAttached()
        @outPorts.complete.send true
        @outPorts.complete.disconnect()
      transaction.onerror = null
      transaction.oncomplete = null
    transaction.onerror = @error.bind @
    @outPorts.transaction.send transaction
    @outPorts.transaction.disconnect()

    if @outPorts.db.isAttached()
      @outPorts.db.send @db
      @outPorts.db.disconnect()
    @stores = null

exports.getComponent = -> new BeginTransaction
