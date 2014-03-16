noflo = require 'noflo'

class ListenChanges extends noflo.Component
  constructor: ->
    @listening = false
    @inPorts =
      start: new noflo.Port 'bang'
      stop: new noflo.Port 'bang'
    @outPorts =
      changed: new noflo.Port 'string'
      removed: new noflo.Port 'string'

    listener = (event) =>
      if event.newValue is null and @outPorts.removed.isAttached()
        @outPorts.removed.beginGroup event.key
        @outPorts.removed.send null
        @outPorts.removed.endGroup()
        return
      @outPorts.changed.beginGroup event.key
      @outPorts.changed.send event.newValue
      @outPorts.changed.endGroup()

    @inPorts.start.on 'data', =>
      return if @listening
      window.addEventListener 'storage', listener, false
      @listening = true
    @inPorts.stop.on 'data', =>
      return unless @listening
      window.removeEventListener 'storage', listener, false
      @listening = false
      @outPorts.changed.disconnect()
      @outPorts.removed.disconnect()

exports.getComponent = -> new ListenChanges
