noflo = require 'noflo'
FD = require 'fdjs'

class Solve extends noflo.AsyncComponent
  description: 'Solve a Finite Domain solving space'
  constructor: ->
    @variables = null
    @distribution = 'fail_first'
    @search = 'depth_first'

    @inPorts =
      space: new noflo.Port 'object'
      variables: new noflo.Port 'array'
      distribution: new noflo.Port 'string'
      search: new noflo.Port 'string'

    @outPorts =
      solution: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.variables.on 'data', (variables) =>
      if typeof variables is 'string'
        @variables = variables.split ','
      else
        @variables = variables

    @inPorts.distribution.on 'data', (distribution) =>
      unless FD.distribute[distribution]
        @error new Error "Finite Domain distribution strategy #{distribution} not found"
        return
      @distribution = distribution
    @inPorts.search.on 'data', (search) =>
      unless FD.search[search]
        @error new Error "Finite Domain search strategy #{search} not found"
        return
      @search = search

    super 'space', 'solution'

  doAsync: (space, callback) ->
    unless @variables
      @error new Error 'No variables to solve provided'
    FD.distribute[@distribution] space, @variables

    step = (state) =>
      FD.search[@search] state
      if state.space.is_solved()
        @outPorts.solution.send state.space.solution()
      if state.more
        # Next solving round
        setTimeout ->
          step state
        , 0
        return
      # We've sent all the solutions out
      @outPorts.solution.disconnect()

    initialState =
      space: space
      more: yes
    step initialState

exports.getComponent = -> new Solve
