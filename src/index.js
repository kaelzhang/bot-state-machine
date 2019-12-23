const split = require('split-string')
const {format} = require('util')

const {State} = require('./state')
const {CommandManager} = require('./command')
const error = require('./error')
const {
  create,
  ROOT_STATE_ID,
  COMMAND,
  STATE
} = require('./util')

// The default formatter is util.format
const DEFAULT_FORMATTER = format
const DEFAULT_JOINER = said => said.join('\n')

// StateMachine is controlled by administrators
// But State and Command might be controlled by plugins
class StateMachine {
  constructor (store = create()) {
    this._store = store
    this._map = new WeakMap()

    this._cm = new CommandManager({
      store,
      map: this._map,
      // hooks,
      global: true
    })

    this._formatter = DEFAULT_FORMATTER
    this._joiner = DEFAULT_JOINER
    this._rootState = null
  }

  rootState () {
    if (this._rootState) {
      throw error('ROOT_STATE_EXISTS')
    }

    const state = new State({
      id: ROOT_STATE_ID,
      hooks: this._hooks,
      store: this._store
    })

    this._rootState = state

    return state
  }

  command (...names) {
    return this._cm.add(names)
  }

  save (dataSaver) {
    this._dataSaver = dataSaver
    return this
  }

  async _save () {
    const save = this._dataSaver
    return save(this._store)
  }

  _say (...things) {
    this._sayBuffer.push(things)
  }

  format (formatter) {
    this._formatter = formatter
    return this
  }

  join (joiner) {
    this._joiner = joiner
    return this
  }

  _getCurrentState () {
    const {current} = this._store
    const {
      type,
      target
    } = this._map.get(current) || {
      type: STATE,
      target: this._rootState
    }

    return {
      id: current,
      type,
      target
    }
  }

  _searchCommand () {

  }

  globalCommand (names) {
    return this._cm.add(names)
  }

  async _runCommand ({
    id, command, options = []
  }) {
    this._store.say = []

    // TODO

    const output = Promise.all(this._store.say.map(this._formatter))
    .then(this._joiner)

    delete this._store.say

    return output
  }

  async input (stringCommand) {
    if (!this._rootState) {
      throw error('ROOT_STATE_NOT_FOUND')
    }

    const [name, ...options] = split(stringCommand, {
      separator: ' '
    })

    // Options are not allowed in global command
    // so we only need exact search
    const globalCommand = this._cm.search(name, true)

    if (globalCommand) {
      return this._runCommand(globalCommand)
    }

    const {
      id,
      type,
      target
    } = this._getCurrentState()

    if (type === COMMAND) {
      return this._runCommand({
        id,
        command: target,
        options
      })
    }
    // Else STATE

    const result = target.search(name, true)

    if (result) {
      const {
        id: commandId,
        command
      } = result

      return this._runCommand({
        id: commandId,
        command,
        options
      })
    }

    const nonExactResult = target.search(name)
    if (nonExactResult) {
      const {
        matched,
        id: commandId,
        command
      } = nonExactResult

      return this._runCommand({
        id: commandId,
        command,
        options: [name.slice(matched.length), ...options]
      })
    }

    throw error('UNKNOWN_COMMAND', stringCommand)
  }
}

module.exports = {
  StateMachine
}
