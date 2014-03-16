noflo = require 'noflo'

class Close extends noflo.Component
  constructor: ->
    @inPorts =
      db: new noflo.Port 'object'

    @inPorts.db.on 'data', (db) ->
      db.close()

exports.getComponent = -> new Close
