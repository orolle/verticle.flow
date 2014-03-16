noflo = require 'noflo'

class DeleteDatabase extends noflo.Component
  constructor: ->
    @inPorts =
      name: new noflo.Port 'string'
    @outPorts =
      deleted: new noflo.Port 'bang'
      error: new noflo.Port 'object'

    @inPorts.name.on 'data', (name) =>
      @deleteDb name

  deleteDb: (name) ->
    req = indexedDB.deleteDatabase name
    req.onsuccess = =>
      @outPorts.deleted.send true
      @outPorts.deleted.disconnect()
    req.onerror = @error

exports.getComponent = -> new DeleteDatabase
