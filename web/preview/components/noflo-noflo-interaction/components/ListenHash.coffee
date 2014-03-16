noflo = require 'noflo'

class ListenHash extends noflo.Component
  description: 'Listen for hash changes in browser\'s URL bar'
  constructor: ->
    @inPorts =
      start: new noflo.Port 'bang'
      stop: new noflo.Port 'bang'
    @outPorts =
      initial: new noflo.Port 'string'
      change: new noflo.Port 'string'

    @inPorts.start.on 'data', =>
      @subscribe()

    @inPorts.stop.on 'data', =>
      @unsubscribe()

  subscribe: ->
    window.addEventListener 'hashchange', @hashChange, false

    if @outPorts.initial.isAttached()
      initialHash = window.location.hash.substr 1
      @outPorts.initial.send initialHash
      @outPorts.initial.disconnect()

  unsubscribe: ->
    window.removeEventListener 'hashchange', @hashChange, false
    @outPorts.change.disconnect()

  hashChange: (event) =>
    oldHash = event.oldURL.split('#')[1]
    newHash = event.newURL.split('#')[1]
    newHash = '' unless newHash
    @outPorts.change.beginGroup oldHash if oldHash
    @outPorts.change.send newHash
    @outPorts.change.endGroup oldHash if oldHash

  shutdown: ->
    @unsubscribe()

exports.getComponent = -> new ListenHash
