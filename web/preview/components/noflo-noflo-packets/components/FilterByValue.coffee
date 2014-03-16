noflo = require("noflo")

class FilterByValue extends noflo.Component

  description: "Filter packets based on their value"

  constructor: ->
    @filterValue = null

    @inPorts =
      in: new noflo.Port
      filtervalue: new noflo.Port
    @outPorts =
      lower: new noflo.Port
      higher: new noflo.Port
      equal: new noflo.Port

    @inPorts.filtervalue.on 'data', (data) =>
      @filterValue = data

    @inPorts.in.on 'data', (data) =>
      if data < @filterValue
        @outPorts.lower.send data
      else if data > @filterValue
        @outPorts.higher.send data
      else if data == @filterValue
        @outPorts.equal.send data

    @inPorts.in.on 'disconnect', =>
      if @outPorts.lower.isConnected()
        @outPorts.lower.disconnect()

      if @outPorts.higher.isConnected()
        @outPorts.higher.disconnect()

      if @outPorts.equal.isConnected()
        @outPorts.equal.disconnect()

exports.getComponent = -> new FilterByValue
