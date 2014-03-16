noflo = require 'noflo'

class ListenScroll extends noflo.Component
  description: 'Listen to scroll events on the browser window'
  constructor: ->
    @inPorts =
      start: new noflo.Port 'bang'
      stop: new noflo.Port 'bang'
    @outPorts =
      top: new noflo.Port 'number'
      bottom: new noflo.Port 'number'
      left: new noflo.Port 'number'
      right: new noflo.Port 'number'

    @inPorts.start.on 'data', =>
      @subscribe()

    @inPorts.stop.on 'data', =>
      @unsubscribe()

  subscribe: ->
    window.addEventListener 'scroll', @scroll, false

  unsubscribe: ->
    window.removeEventListenr 'scroll', @scroll, false

  scroll: (event) =>
    top = window.scrollY
    left = window.scrollX
    if @outPorts.top.isAttached()
      @outPorts.top.send top
      @outPorts.top.disconnect()
    if @outPorts.bottom.isAttached()
      bottom = top + window.innerHeight
      @outPorts.bottom.send bottom
      @outPorts.bottom.disconnect()
    if @outPorts.left.isAttached()
      @outPorts.left.send left
      @outPorts.left.disconnect()
    if @outPorts.right.isAttached()
      right = left + window.innerWidth
      @outPorts.right.send right
      @outPorts.right.disconnect()

  shutdown: ->
    @unsubscribe()

exports.getComponent = -> new ListenScroll
