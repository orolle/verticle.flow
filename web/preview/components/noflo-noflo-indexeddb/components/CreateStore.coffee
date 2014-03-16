noflo = require 'noflo'

class CreateStore extends noflo.Component
  constructor: ->
    @name = null
    @db = null
    @keyPath = ''
    @autoIncrement = false

    @inPorts =
      name: new noflo.Port 'name'
      db: new noflo.Port 'object'
      keypath: new noflo.Port 'name'
      autoincrement: new noflo.Port 'boolean'
    @outPorts =
      store: new noflo.Port 'object'
      db: new noflo.Port 'object'
      error: new noflo.Port 'error'

    @inPorts.name.on 'data', (@name) =>
      do @create
    @inPorts.db.on 'data', (@db) =>
      do @create
    @inPorts.keypath.on 'data', (@keyPath) =>
    @inPorts.autoincrement.on 'data', (@autoIncrement) =>

  create: ->
    return unless @name and @db
    @db.transaction.onerror = @error
    store = @db.createObjectStore @name,
      keyPath: @keyPath
      autoIncrement: @autoIncrement
    if store and @outPorts.store.isAttached()
      @outPorts.store.beginGroup @name
      @outPorts.store.send store
      @outPorts.store.endGroup()
      @outPorts.store.disconnect()
    @db.transaction.onerror = null
    if @outPorts.db.isAttached()
      @outPorts.db.send @db
      @outPorts.db.disconnect()
    @db = null
    @name = null

exports.getComponent = -> new CreateStore
