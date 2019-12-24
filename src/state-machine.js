const split = require('split-string')
const {format} = require('util')

const {State} = require('./state')
const {CommandManager} = require('./command')
const error = require('./error')
const {
  create,
  ROOT_STATE_ID,
  COMMAND,
  STATE,

  STATES,

  CONDITIONED, UPDATE_OPTIONS
} = require('./util')
const {SimpleMemorySyncer} = require('./syncer')

// The default formatter is util.format
const DEFAULT_FORMATTER = format
const DEFAULT_JOINER = said => said.join('\n')

// StateMachine is controlled by administrators
// But State and Command might be controlled by plugins
class StateMachine {
  constructor ({
    store = create(),
    syncer = new SimpleMemorySyncer(),
    nonExactMatch = false
  } = {}) {
    this._store = store
    this._syncer = syncer
    this._nonExactMatch = nonExactMatch

    this._idMap = new WeakMap()
    this._stateMap = new WeakMap()

    this._cm = new CommandManager({
      context: {
        store,
        idMap: this._idMap,
        stateMap: this._stateMap
      },
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
    } = this._idMap.get(current) || {
      type: STATE,
      target: this._rootState
    }

    return {
      id: current,
      type,
      target
    }
  }

  _commandHasStates (id) {
    const command = this._store[id]
    return Object.keys(command[STATES]).length > 0
  }

  async _runCommand ({
    id, command, args = []
  }) {
    this._store.say = []

    await this._run(id, command, args)

    const output = Promise.all(this._store.say.map(this._formatter))
    .then(this._joiner)

    delete this._store.say

    return output
  }

  async _run (id, command, args) {
    const conditioned = await command[CONDITIONED]()
    if (!conditioned) {
      return
    }

    if (args.length > 0) {
      command[UPDATE_OPTIONS](args)
    }

    const hasSubStates = this._commandHasStates(id)
    const locked = await this._syncer.lock(id)
  }

  async input (stringCommand) {
    if (!this._rootState) {
      throw error('ROOT_STATE_NOT_FOUND')
    }

    const [name, ...args] = split(stringCommand, {
      separator: ' '
    })

    // Options are not allowed in global command
    // so we only need exact search
    const globalCommand = this._cm.search(name, true)

    if (globalCommand) {
      // Run a global command.
      // We allow global command to run at any time.
      return this._runCommand(globalCommand)
    }

    const {
      id,
      type,
      target
    } = this._getCurrentState()

    if (type === COMMAND) {
      // Resume an unfulfilled command
      //   which we don't provide enough options.
      // TODO: edge case
      // And the command might still be executing,
      //   and the task will be rejected by lock
      return this._runCommand({
        id,
        command: target,
        args: [stringCommand]
      })
    }
    // Else there is no unfinished command,
    //   we will search matched command within the current state

    const result = target.search(name, true)

    if (result) {
      const {
        id: commandId,
        command
      } = result

      // The exact match
      return this._runCommand({
        id: commandId,
        command,
        args
      })
    }

    if (this._nonExactMatch) {
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
          args: [name.slice(matched.length), ...args]
        })
      }
    }

    throw error('UNKNOWN_COMMAND', stringCommand)
  }
}

module.exports = {
  StateMachine
}
