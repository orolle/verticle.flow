noflo = require 'noflo'

class Open extends noflo.Component
  constructor: ->
    @name = null
    @version = null
    @inPorts =
      name: new noflo.Port 'name'
      version: new noflo.Port 'number'
    @outPorts =
      upgrade: new noflo.Port 'object'
      db: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.name.on 'data', (@name) =>
      do @open
    @inPorts.version.on 'data', (@version) =>
      do @open

  open: ->
    return unless @name and @version
    req = indexedDB.open @name, parseInt @version
    @name = null
    version = @version
    @version = null
    req.onupgradeneeded = (e) =>
      @outPorts.upgrade.beginGroup @name
      @outPorts.upgrade.send
        oldVersion: e.oldVersion
        newVersion: version
        db: e.target.result
      @outPorts.upgrade.endGroup()
      @outPorts.upgrade.disconnect()
    req.onsuccess = (e) =>
      @outPorts.db.beginGroup @name
      @outPorts.db.send e.target.result
      @outPorts.db.endGroup()
      @outPorts.db.disconnect()
    req.onerror = @error.bind @

exports.getComponent = -> new Open
