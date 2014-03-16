noflo = require 'noflo'

class CollectGroups extends noflo.Component
  description: 'Collect packets into object keyed by its groups'
  constructor: ->
    # Working variable for incoming IPs
    @data = {}
    # Breadcrumb of incoming groups
    @groups = []
    # Breadcrumb of each level of IPs as partitioned by groups
    @parents = []

    @inPorts =
      in: new noflo.Port 'all'
    @outPorts =
      out: new noflo.Port 'object'
      error: new noflo.Port 'object'

    @inPorts.in.on 'connect', =>
      # Make sure working memory is clean
      @data = {}

    @inPorts.in.on 'begingroup', (group) =>
      # We use the attribute name `$data` to indicate data IPs in the outgoing
      # structure, so no `$data` please
      if group is '$data'
        @error 'groups cannot be named \'$data\''
        return
      # Save whatever in the working memory right now into its own level
      @parents.push @data
      # Save the current group
      @groups.push group
      # Clear working memory for new level
      @data = {}

    @inPorts.in.on 'data', (data) =>
      @setData data

    @inPorts.in.on 'endgroup', =>
      # Temporarily save working memory. Yes, you read me right! This is the
      # working memory of working memory. :)
      data = @data
      # Take out the previous level
      @data = @parents.pop()
      # Take the working memory (`data`) and put it into the previous level
      # (`@data`) by a group name (`@groups.pop()`)
      @addChild @data, @groups.pop(), data

      # NOTE: it may sound odd that collating into working memory (`@data`)
      # works. It does because this is ending a group (i.e. level). If what
      # follows is a disconnect, then it flushes the working memory, which is
      # the entire data structure anyway. If what follows is a new group, the
      # working memory is pushed into the level breadcrumbs (`@parents`)
      # anyway. If it's a data IP, it's saved into the `$data` attribute, not
      # affecting the data structure.

    @inPorts.in.on 'disconnect', =>
      # Flush everything down the drain
      @outPorts.out.send @data
      @outPorts.out.disconnect()

  # Put whatever in the working memory (`data`) into the last level (`parent`)
  # by the group (`child`)
  addChild: (parent, child, data) ->
    # If `child` (i.e. the group) doesn't exist, simply put working memory in
    # as-is
    return parent[child] = data unless child of parent
    # *OR*, if it's already an array, append to it
    return parent[child].push data if Array.isArray parent[child]
    # *OR*, if something already exists in place but isn't appendable, make it
    # so by having whatever in it as the first element of the array
    parent[child] = [ parent[child], data ]

  setData: (data) ->
    # Initialize our data IPs storage as an array if it doesn't exist
    @data.$data ?= []
    # Save the IP
    @data.$data.push data

  # Error handling
  error: (msg) ->
    if @outPorts.error.isAttached()
      @outPorts.error.send new Error msg
      @outPorts.error.disconnect()
      return
    throw new Error msg

exports.getComponent = -> new CollectGroups
