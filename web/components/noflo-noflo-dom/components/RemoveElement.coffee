noflo = require 'noflo'

class RemoveElement extends noflo.Component
  description: 'Remove an element from DOM'
  constructor: ->
    @inPorts =
      element: new noflo.Port 'object'
    @inPorts.element.on 'data', (element) =>
      return unless element.parentNode
      element.parentNode.removeChild element

exports.getComponent = -> new RemoveElement
