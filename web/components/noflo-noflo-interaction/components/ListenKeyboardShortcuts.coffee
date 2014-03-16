noflo = require 'noflo'

class ListenKeyboardShortcuts extends noflo.Component
  description: 'Listen for keyboard shortcuts and route them'
  icon: 'keyboard-o'
  constructor: ->
    @keys = []
    @ignoreInput = true
    @inPorts =
      keys: new noflo.Port 'string'
      ignoreinput: new noflo.Port 'boolean'
      stop: new noflo.Port 'bang'
    @outPorts =
      shortcut: new noflo.ArrayPort 'bang'
      missed: new noflo.Port 'integer'

    @inPorts.keys.on 'data', (data) =>
      @keys = @normalizeKeys data
      do @subscribe

    @inPorts.ignoreinput.on 'data', (data) =>
      @ignoreInput = String(data) is 'true'

    @inPorts.stop.on 'data', =>
      do @unsubscribe

  subscribe: ->
    document.addEventListener 'keydown', @keypress, false

  unsubscribe: ->
    document.removeEventListener 'keydown', @keypress, false

  normalizeKeys: (data) ->
    keys = data.split ','
    
    # We allow some common keyboard shortcuts to be passed as strings
    for key, index in keys
      switch key
        when '-' then keys[index] = 189
        when '=' then keys[index] = 187
        when '0' then keys[index] = 48
        when 'a' then keys[index] = 65
        when 'x' then keys[index] = 88
        when 'c' then keys[index] = 67
        when 'v' then keys[index] = 86
        when 'z' then keys[index] = 90
        when 'r' then keys[index] = 82
        when 's' then keys[index] = 83
    keys

  validateTarget: (event) ->
    return true unless @ignoreInput
    return false if event.target.tagName is 'TEXTAREA'
    return false if event.target.tagName is 'INPUT'
    return false if String(event.target.contentEditable) is 'true'
    true

  keypress: (event) =>
    return unless event.ctrlKey or event.metaKey
    return unless @validateTarget event

    route = @keys.indexOf event.keyCode
    if route is -1
      if @outPorts.missed.isAttached()
        @outPorts.missed.send event.keyCode
        @outPorts.missed.disconnect()
      return

    event.preventDefault()
    event.stopPropagation()
    @outPorts.shortcut.send event.keyCode, route
    @outPorts.shortcut.disconnect()

  shutdown: ->
    do @unsubscribe

exports.getComponent = -> new ListenKeyboardShortcuts
