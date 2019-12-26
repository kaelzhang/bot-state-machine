// const {format} = require('util')

const {State} = require('./state')
const {CommandManager} = require('./command')
const error = require('./error')
// const {
//   split,
//   create,
//   ROOT_STATE_ID,
//   COMMAND,
//   STATE,

//   STATES,

//   CONDITIONED, UPDATE_OPTIONS, FULFILLED
// } = require('./util')
const {SimpleMemorySyncer} = require('./syncer')

// The default formatter is util.format
// const DEFAULT_FORMATTER = format
// const DEFAULT_JOINER = said => said.join('\n')

// StateMachine is controlled by administrators
// But State and Command might be controlled by plugins
class StateMachineConfig {
  constructor ({
    syncer = new SimpleMemorySyncer(),
    // nonExactMatch = false
  } = {}) {
    const template = this._template = create()
    this._syncer = syncer
    // this._nonExactMatch = nonExactMatch

    this._cm = new CommandManager({
      template,
      // hooks,
      global: true
    })

    // this._formatter = DEFAULT_FORMATTER
    // this._joiner = DEFAULT_JOINER
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

  // save (dataSaver) {
  //   this._dataSaver = dataSaver
  //   return this
  // }

  // async _save () {
  //   const save = this._dataSaver
  //   return save(this._store)
  // }

  // _say (...things) {
  //   this._sayBuffer.push(things)
  // }

  // format (formatter) {
  //   this._formatter = formatter
  //   return this
  // }

  // join (joiner) {
  //   this._joiner = joiner
  //   return this
  // }
}

module.exports = {
  StateMachineConfig
}
