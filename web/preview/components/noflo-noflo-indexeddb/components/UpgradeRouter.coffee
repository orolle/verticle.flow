noflo = require 'noflo'

class UpgradeRouter extends noflo.Component
  constructor: ->
    @groups = []
    @inPorts =
      upgrade: new noflo.Port 'object'
    @outPorts =
      versions: new noflo.ArrayPort 'object'
      missed: new noflo.Port 'object'

    @inPorts.upgrade.on 'begingroup', (group) =>
      @groups.push group
    @inPorts.upgrade.on 'data', (upgrade) =>
      @route upgrade
    @inPorts.upgrade.on 'endgroup', =>
      @groups.pop()
    @inPorts.upgrade.on 'disconnect', =>
      @groups = []

  route: (upgrade) ->
    upgraded = false
    migration = 0
    while migration < upgrade.newVersion
      if migration < upgrade.oldVersion
        migration++
        continue
      unless @outPorts.versions.isAttached migration
        migration++
        continue
      @outPorts.versions.beginGroup group, migration for group in @groups
      @outPorts.versions.send upgrade.db, migration
      @outPorts.versions.endGroup migration for group in @groups
      @outPorts.versions.disconnect migration
      upgraded = true
      migration++
    return if upgraded
    return unless @outPorts.missed.isAttached()
    @outPorts.missed.beginGroup group for group in @groups
    @outPorts.missed.send upgrade.db
    @outPorts.missed.endGroup() for group in @groups
    @outPorts.missed.disconnect()

exports.getComponent = -> new UpgradeRouter
