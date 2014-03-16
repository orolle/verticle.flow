noflo = require 'noflo'

class ReadCoordinates extends noflo.Component
  description: 'Read the coordinates from a DOM event'
  constructor: ->
    @inPorts =
      event: new noflo.Port 'object'
    @outPorts =
      screen: new noflo.Port 'object'
      client: new noflo.Port 'object'
      page: new noflo.Port 'object'

    @inPorts.event.on 'begingroup', (group) =>
      @outPorts.screen.beginGroup group if @outPorts.screen.isAttached()
      @outPorts.client.beginGroup group if @outPorts.client.isAttached()
      @outPorts.page.beginGroup group if @outPorts.page.isAttached()
    @inPorts.event.on 'data', (data) =>
      @read data
    @inPorts.event.on 'endgroup', =>
      @outPorts.screen.endGroup() if @outPorts.screen.isAttached()
      @outPorts.client.endGroup() if @outPorts.client.isAttached()
      @outPorts.page.endGroup() if @outPorts.page.isAttached()
    @inPorts.event.on 'disconnect', =>
      @outPorts.screen.disconnect() if @outPorts.screen.isAttached()
      @outPorts.client.disconnect() if @outPorts.client.isAttached()
      @outPorts.page.disconnect() if @outPorts.page.isAttached()

  read: (event) ->
    return unless event
    if @outPorts.screen.isAttached() and event.screenX isnt undefined
      @outPorts.screen.send
        x: event.screenX
        y: event.screenY
    if @outPorts.client.isAttached() and event.clientX isnt undefined
      @outPorts.client.send
        x: event.clientX
        y: event.clientY
    if @outPorts.page.isAttached() and event.pageX isnt undefined
      @outPorts.page.send
        x: event.pageX
        y: event.pageY

exports.getComponent = -> new ReadCoordinates
