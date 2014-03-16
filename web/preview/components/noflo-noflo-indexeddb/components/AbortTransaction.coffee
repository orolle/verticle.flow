noflo = require 'noflo'

class AbortTransaction extends noflo.Component
  constructor: ->
    @inPorts =
      transaction: new noflo.Port 'object'
    @outPorts =
      error: new noflo.Port 'object'

    @inPorts.transaction.on 'data', (transaction) =>
      transaction.onerror = @error.bind @
      transaction.abort()

exports.getComponent = -> new AbortTransaction
