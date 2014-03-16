noflo = require 'noflo'

class AppendChild extends noflo.Component
  description: 'Append elements as children of a parent element'
  constructor: ->
    @parent = null
    @children = []
    @inPorts =
      parent: new noflo.Port 'object'
      child: new noflo.Port 'object'
    @outPorts = {}

    @inPorts.parent.on 'data', (data) =>
      @parent = data
      do @append if @children.length

    @inPorts.child.on 'data', (data) =>
      unless @parent
        @children.push data
        return
      @parent.appendChild data

  append: ->
    for child in @children
      @parent.appendChild child
    @children = []

exports.getComponent = -> new AppendChild
