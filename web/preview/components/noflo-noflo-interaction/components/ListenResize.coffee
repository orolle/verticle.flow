noflo = require 'noflo'

class ListenResize extends noflo.Component
  description: 'Listen to window resize events'
  icon: 'desktop'

  constructor: ->
    @inPorts =
      start: new noflo.Port 'bang'
      stop: new noflo.Port 'bang'
    @outPorts =
      width: new noflo.Port 'number'
      height: new noflo.Port 'number'

    @inPorts.start.on 'data', =>
      @sendSize()
      @subscribe()

    @inPorts.stop.on 'data', =>
      @unsubscribe()

  subscribe: ->
    window.addEventListener 'resize', @sendSize, false
  unsubscribe: ->
    window.removeEventListener 'resize', @sendSize, false

  sendSize: =>
    if @outPorts.width.isAttached()
      @outPorts.width.send window.innerWidth
      @outPorts.width.disconnect()
    if @outPorts.height.isAttached()
      @outPorts.height.send window.innerHeight
      @outPorts.height.disconnect()

  shutdown: ->
    @unsubscribe()

exports.getComponent = -> new ListenResize
