noflo = require 'noflo'

class ListenPointer extends noflo.Component
  description: 'Listen to pointer events on a DOM element'
  constructor: ->
    @action = 'none'
    @capture = false
    @propagate = false
    @elements = []

    @inPorts =
      element: new noflo.Port 'object'
      action: new noflo.Port 'string'
      capture: new noflo.Port 'boolean'
      propagate: new noflo.Port 'boolean'
    @outPorts =
      down: new noflo.Port 'object'
      up: new noflo.Port 'object'
      cancel: new noflo.Port 'object'
      move: new noflo.Port 'object'
      over: new noflo.Port 'object'
      out: new noflo.Port 'object'
      enter: new noflo.Port 'object'
      leave: new noflo.Port 'object'

    @inPorts.element.on 'data', (element) =>
      @subscribe element

    @inPorts.action.on 'data', (@action) =>
    @inPorts.capture.on 'data', (@capture) =>
    @inPorts.propagate.on 'data', (@propagate) =>

  subscribe: (element) ->
    if element.setAttribute
      element.setAttribute 'touch-action', @action

    element.addEventListener 'pointerdown', @pointerDown, @capture
    element.addEventListener 'pointerup', @pointerUp, @capture
    element.addEventListener 'pointercancel', @pointerCancel, @capture
    element.addEventListener 'pointermove', @pointerMove, @capture
    element.addEventListener 'pointerover', @pointerOver, @capture
    element.addEventListener 'pointerout', @pointerOut, @capture
    element.addEventListener 'pointerenter', @pointerEnter, @capture
    element.addEventListener 'pointerleave', @pointerLeave, @capture
    @elements.push element

  unsubscribe: (element) ->
    if element.removeAttribute
      element.removeAttribute 'touch-action'

    element.removeEventListener 'pointerdown', @pointerDown, @capture
    element.removeEventListener 'pointerup', @pointerUp, @capture
    element.removeEventListener 'pointercancel', @pointerCancel, @capture
    element.removeEventListener 'pointermove', @pointerMove, @capture
    element.removeEventListener 'pointerover', @pointerOver, @capture
    element.removeEventListener 'pointerout', @pointerOut, @capture
    element.removeEventListener 'pointerenter', @pointerEnter, @capture
    element.removeEventListener 'pointerleave', @pointerLeave, @capture

    for name, port of @outPorts
      continue unless port.isAttached()
      port.disconnect()

  shutdown: ->
    @unsubscribe element for element in @elements
    @elements = []

  pointerDown: (event) =>
    @handle event, 'down'
  pointerUp: (event) =>
    @handle event, 'up'
  pointerCancel: (event) =>
    @handle event, 'cancel'
  pointerMove: (event) =>
    @handle event, 'move'
  pointerOver: (event) =>
    @handle event, 'over'
  pointerOut: (event) =>
    @handle event, 'out'
  pointerEnter: (event) =>
    @handle event, 'enter'
  pointerLeave: (event) =>
    @handle event, 'leave'

  handle: (event, type) ->
    event.preventDefault()
    event.stopPropagation() unless @propagate

    unless @outPorts[type].isAttached()
      return
    @outPorts[type].beginGroup event.pointerId
    @outPorts[type].send event
    @outPorts[type].endGroup()

    # End of interaction, send EOTs
    if type is 'up' or type is 'cancel' or type is 'leave'
      for name, port of @outPorts
        continue unless port.isAttached()
        port.disconnect()

exports.getComponent = -> new ListenPointer
