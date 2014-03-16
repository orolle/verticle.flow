noflo = require 'noflo'

class DeleteStore extends noflo.Component
  constructor: ->
    @name = null
    @db = null

    @inPorts =
      name: new noflo.Port 'name'
      db: new noflo.Port 'object'
    @outPorts =
      db: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.name.on 'data', (@name) =>
      do @deleteStore
    @inPorts.db.on 'data', (@db) =>
      do @deleteStore

  deleteStore: ->
    return unless @name and @db
    @db.transaction.onerror = @error
    @db.deleteObjectStore @name
    @db.transaction.onerror = null
    if @outPorts.db.isAttached()
      @outPorts.db.send @db
      @outPorts.db.disconnect()
    @db = null
    @name = null

exports.getComponent = -> new DeleteStore
