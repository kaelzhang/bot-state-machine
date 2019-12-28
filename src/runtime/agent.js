const uuid = require('uuid/v4')

const {
  split,
  // create,
  ROOT_STATE_ID,
  STATE
} = require('../template/common')
const error = require('../error')

module.exports = class Agent {
  constructor (template, distinctId, options) {
    this._template = template
    this._syncer = options.syncer

    // This is the uuid for the current task
    // A single audience can create many tasks
    this._uuid = uuid()

    this._lockKey = options.lockKey(distinctId)
    this._storeKey = options.storeKey(distinctId)
    this._store = null
    this._output = []
  }

  async _readStore () {
    const {
      success,
      store
    } = await this._syncer.read({
      uuid: this._uuid,
      lockKey: this._lockKey,
      storeKey: this._storeKey
    })

    if (!success) {
      // If the current thread do not own the lock,
      // which means another command is still executing,
      // then it will fail, even for global commands
      throw error('NOT_OWN_LOCK')
    }

    return store
  }

  async input (commandString) {
    const store = this._store = await this._readStore()

    const {current} = store

    this._current = current && (
      // There might be old stale data if the template upgrade
      current in this._template
    )
      ? this._template[current]
      : this._template[ROOT_STATE_ID]

    if (this._current.type === STATE) {
      return this._processStateInput(commandString)
    }

    // The current command is not fulfilled
    return this._processCommandInput(commandString)
  }

  _searchCommand (name, {
    exact = false,
    global = false
  }) {
    const {commands} = global
      ? this._template
      : this._current

    const exactMatch = commands[name]

    // Returns the exact match
    if (exactMatch) {
      return exactMatch
    }

    if (exact) {
      return
    }
    // Else, try to find the longest match

    let longest
    let l = 0

    for (const n of Object.keys(commands)) {
      if (!name.startsWith(n)) {
        continue
      }

      const {length} = n
      if (length > l) {
        l = length
        longest = n
      }
    }

    if (longest) {
      return commands[longest]
    }
  }

  async _processStateInput (commandString) {
    const [name, ...args] = split(commandString, {
      separator: ' '
    })

    const globalMatched = this._searchCommand(name, {
      global: true
    })

    if (globalMatched) {
      return this._runCommand(globalMatched, args)
    }
  }

  _getCommandFlags (command) {
    const {parentId} = command

    return this._store[parentId] || {}
  }

  async _testCommandCondition (command) {
    const {condition} = command
    if (!condition) {
      return true
    }

    return condition(this._getCommandFlags(command))
  }

  async _updateCommandOptions (command, args) {

  }

  async _runCommand (command, args = []) {
    // Do not meet the condition
    const conditioned = await this._testCommandCondition(command)
    if (!conditioned) {
      return
    }

    if (args.length > 0) {
      await this._updateCommandOptions(command, args)
    }

    // await this._run(command, args)

    // const output = Promise.all(this._output.map(this._formatter))
    // .then(this._joiner)

    // this._output.length = 0

    // return output
  }
}
