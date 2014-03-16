noflo = require 'noflo'

class CreateFragment extends noflo.Component
  description: 'Create a new DOM DocumentFragment'
  constructor: ->
    @inPorts =
      in: new noflo.Port 'bang'
    @outPorts =
      fragment: new noflo.Port 'object'

    @inPorts.in.on 'data', =>
      @outPorts.fragment.send document.createDocumentFragment()
    @inPorts.in.on 'disconnect', =>
      @outPorts.fragment.disconnect()

exports.getComponent = -> new CreateFragment
