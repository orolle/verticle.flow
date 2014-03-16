noflo = require 'noflo'

class CreateIndex extends noflo.Component
  constructor: ->
    @store = null
    @name = null
    @keyPath = null
    @unique = false
    @multiEntry = false
    @inPorts =
      store: new noflo.Port 'object'
      name: new noflo.Port 'string'
      keypath: new noflo.Port 'string'
      unique: new noflo.Port 'boolean'
      multientry: new noflo.Port 'boolean'
    @outPorts =
      index: new noflo.Port 'object'
      store: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.store.on 'data', (@store) =>
      do @create
    @inPorts.name.on 'data', (@name) =>
      do @create
    @inPorts.keypath.on 'data', (@keyPath) =>
      do @create
    @inPorts.unique.on 'data', (@unique) =>
    @inPorts.multientry.on 'data', (@multiEntry) =>

  create: ->
    return unless @store and @name and @keyPath
    @store.onerror = @error.bind @
    index = @store.createIndex @name, @keyPath,
      unique: @unique
      multiEntry: @multiEntry
    @store.onerror = null
    @name = null
    @keyPath = null
    if @outPorts.index.isAttached()
      @outPorts.index.beginGroup index.name
      @outPorts.index.send index
      @outPorts.index.endGroup()
      @outPorts.index.disconnect()
    if @outPorts.store.isAttached()
      @outPorts.store.send @store
      @outPorts.store.disconnect()
    @store = null

exports.getComponent = -> new CreateIndex
