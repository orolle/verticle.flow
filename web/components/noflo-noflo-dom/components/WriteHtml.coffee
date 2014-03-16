noflo = require 'noflo'

class WriteHtml extends noflo.Component
  description: 'Write HTML inside an existing element'
  constructor: ->
    @container = null
    @html = null

    @inPorts =
      html: new noflo.Port 'string'
      container: new noflo.Port 'object'
    @outPorts =
      container: new noflo.Port 'object'

    @inPorts.html.on 'data', (data) =>
      @html = data
      do @writeHtml if @container
    @inPorts.container.on 'data', (data) =>
      @container = data
      do @writeHtml unless @html is null

  writeHtml: ->
    @container.innerHTML = @html
    @html = null

    if @outPorts.container.isAttached()
      @outPorts.container.send @container
      @outPorts.container.disconnect()

exports.getComponent = -> new WriteHtml
