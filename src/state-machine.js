// const {format} = require('util')

const State = require('./state')
const CommandManager = require('./command-manager')
const Agent = require('./agent')
const {SimpleMemorySyncer} = require('./syncer')
const {
  create,
  ROOT_STATE_ID,
} = require('./common')

// StateMachine is controlled by administrators
// But State and Command might be controlled by 3rd party modules
module.exports = class StateMachine {
  constructor ({
    syncer = new SimpleMemorySyncer(),
  }) {
    const template = this._template = create()

    this._cm = new CommandManager({
      template,
      global: true
    })

    this._rootState = null
    this._syncer = syncer
  }

  rootState () {
    if (this._rootState) {
      return this._rootState
    }

    return this._rootState = new State({
      id: ROOT_STATE_ID,
      template: this._template
    })
  }

  command (...names) {
    return this._cm.add(names)
  }

  agent (options) {
    return new Agent(this._template, this._syncer, options)
  }
}
