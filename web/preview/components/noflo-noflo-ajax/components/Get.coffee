noflo = require 'noflo'

class Get extends noflo.AsyncComponent
  constructor: ->
    @inPorts =
      url: new noflo.Port 'string'
    @outPorts =
      out: new noflo.Port 'string'
      error: new noflo.Port 'object'

    super 'url'

  doAsync: (url, callback) ->
    req = new XMLHttpRequest
    req.onreadystatechange = =>
      if req.readyState is 4
        if req.status is 200
          @outPorts.out.beginGroup url
          @outPorts.out.send req.responseText
          @outPorts.out.endGroup()
          @outPorts.out.disconnect()
          callback()
        else
          callback new Error "Error loading #{url}"
    req.open 'GET', url, true
    req.send null

exports.getComponent = -> new Get
