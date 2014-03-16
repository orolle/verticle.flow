noflo = require 'noflo'

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Listen for finished change transctions on a graph'

  listenTransactions = ->
    c.outPorts.out.send c.graph

  unsubscribe = ->
    c.graph.removeListener 'endTransaction', listenTransactions if c.graph
    c.outPorts.out.disconnect()

  c.inPorts.add 'in', (event, payload) ->
    return unless event is 'data'
    # Stop listening to the previous one
    do unsubscribe

    # Start listening to the new one
    c.graph = payload
    c.graph.on 'endTransaction', listenTransactions

  c.outPorts.add 'out'

  c.shutdown = unsubscribe

  c
