noflo = require 'noflo'

class ListenKeyboard extends noflo.Component
  description: 'Listen for key presses on a given DOM element'
  icon: 'keyboard-o'
  constructor: ->
    @elements = []
    @inPorts =
      element: new noflo.Port 'object'
      stop: new noflo.Port 'object'
    @outPorts =
      keypress: new noflo.Port 'integer'

    @inPorts.element.on 'data', (element) =>
      @subscribe element

    @inPorts.stop.on 'data', (element) =>
      @unsubscribe element

  subscribe: (element) ->
    element.addEventListener 'keypress', @keypress, false
    @elements.push element

  unsubscribe: (element) ->
    if -1 is @elements.indexOf element
      return
    element.removeEventListener 'keypress', @keypress, false
    @elements.splice @elements.indexOf(element), 1

  keypress: (event) =>
    return unless @outPorts.keypress.isAttached()

    @outPorts.keypress.send event.keyCode
    @outPorts.keypress.disconnect()

  shutdown: ->
    for element in @elements
      @unsubscribe element

exports.getComponent = -> new ListenKeyboard
