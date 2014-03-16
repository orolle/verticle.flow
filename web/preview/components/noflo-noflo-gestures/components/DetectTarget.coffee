noflo = require 'noflo'

class DetectTarget extends noflo.Component
  describe: 'Verify that the gesture target has the right properties'
  constructor: ->
    @target = null
    @key = 'current'
    @inPorts =
      in: new noflo.Port 'object'
      key: new noflo.Port 'string'
      target: new noflo.Port 'string'
      clear: new noflo.Port 'bang'
    @outPorts =
      pass: new noflo.Port 'object'
      fail: new noflo.Port 'object'
      target: new noflo.Port 'object'

    @inPorts.target.on 'data', (data) =>
      parts = data.split '='
      @target = {} unless @target
      @target[parts[0]] = parts[1]

    @inPorts.key.on 'data', (@key) =>

    @inPorts.clear.on 'data', =>
      @target = null

    @inPorts.in.on 'data', (data) =>
      if Object.keys(data).length > 1
        passed = true
        for touch, element of data
          unless @detectTarget element
            passed = false
        if passed
          if @outPorts.target.isAttached()
            @outPorts.target.send data[Object.keys(data)[0]][@key]
          @outPorts.pass.send data
        else
          @outPorts.fail.send data
        return
      if @detectTarget data[Object.keys(data)[0]]
        if @outPorts.target.isAttached()
          @outPorts.target.send data[Object.keys(data)[0]][@key]
        @outPorts.pass.send data
      else
        @outPorts.fail.send data
    @inPorts.in.on 'disconnect', =>
      @outPorts.pass.disconnect()
      @outPorts.fail.disconnect()
      if @outPorts.target.isAttached()
        @outPorts.target.disconnect()

  detectTarget: (element) ->
    return false unless element[@key]
    for key, value of @target
      unless element[@key][key] is value
        return false
    true

exports.getComponent = -> new DetectTarget
