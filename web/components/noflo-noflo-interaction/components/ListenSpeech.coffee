noflo = require 'noflo'

class ListenSpeech extends noflo.Component
  description: 'Listen for user\'s microphone and recognize phrases'
  constructor: ->
    @recognition = false
    @sent = []
    @inPorts =
      start: new noflo.Port 'bang'
      stop: new noflo.Port 'bang'
    @outPorts =
      result: new noflo.Port 'string'
      error: new noflo.Port 'object'

    @inPorts.start.on 'data', =>
      @startListening()
    @inPorts.stop.on 'data', =>
      @stopListening()

  startListening: ->
    unless window.webkitSpeechRecognition
      @handleError new Error 'Speech recognition support not available'
    @recognition = new window.webkitSpeechRecognition
    @recognition.continuous = true
    @recognition.start()
    @outPorts.result.connect()
    @recognition.onresult = @handleResult
    @recognition.onerror = @handleError

  handleResult: (event) =>
    for result, idx in event.results
      continue unless result.isFinal
      if @sent.indexOf(idx) isnt -1
        continue
      @outPorts.result.send result[0].transcript
      @sent.push idx

  handleError: (error) =>
    if @outPorts.error.isAttached()
      @outPorts.error.send error
      @outPorts.error.disconnect()
      return
    throw error

  stopListening: ->
    return unless @recognition
    @outPorts.result.disconnect()
    @recognition.stop()
    @recognition = null
    @sent = []

  shutdown: ->
    @stopListening()

exports.getComponent = -> new ListenSpeech
