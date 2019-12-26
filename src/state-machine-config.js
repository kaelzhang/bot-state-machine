// const {format} = require('util')

const State = require('./state')
const CommandManager = require('./command-manager')
const Options = require('./options')
const Agent = require('./agent')
// const error = require('./error')
const {
  // split,
  create,
  ROOT_STATE_ID,
  // COMMAND,
  // STATE,

  // STATES,

  // CONDITIONED, UPDATE_OPTIONS, FULFILLED
} = require('./util')


// The default formatter is util.format
// const DEFAULT_FORMATTER = format
// const DEFAULT_JOINER = said => said.join('\n')

// StateMachine is controlled by administrators
// But State and Command might be controlled by 3rd party modules
module.exports = class StateMachineConfig {
  constructor (options) {
    this.options = new Options(options)

    const template = this._template = create()

    this._cm = new CommandManager({
      template,
      global: true
    })

    this._rootState = null
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

  agent () {
    return new Agent(this._template, this._options)
  }
}
