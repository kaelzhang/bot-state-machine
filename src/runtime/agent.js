const uuid = require('uuid/v4')

const {
  split, splitKeyValue,
  // create,
  ROOT_STATE_ID,
  STATE, OPTIONS, OPTION_LIST
} = require('../common')
const error = require('../error')
const State = require('../template/state')

const parse = (command, args) => {
  const keyList = [].concat(command[OPTION_LIST])
  const parsed = Object.create(null)
  const unnamed = []

  const {length} = args
  let i = 0
  while (keyList.length > 0 && i < length) {
    const {key, value} = splitKeyValue(args[i ++])
    if (!key) {
      unnamed.push(value)
      continue
    }

    const index = keyList.indexOf(key)
    if (index === - 1) {
      throw error('COMMAND_UNKNOWN_OPTION', key)
    }

    parsed[key] = value
    keyList.splice(index, 1)
  }

  const unnamedLength = unnamed.length
  const keyListLength = keyList.length

  if (unnamedLength > keyListLength) {
    // We just abandon redundant argument
    unnamed.length = keyListLength
  }

  for (const value of unnamed) {
    parsed[keyList.shift()] = value
  }

  if (keyList.length) {
    throw error('OPTIONS_NOT_FULFILLED', keyList)
  }

  return parsed
}

module.exports = class Agent {
  constructor (template, options) {
    this._template = template
    this._options = options

    // This is the uuid for the current task
    // A single audience can create many tasks
    this._uuid = uuid()
    this._store = null
    this._output = []
  }

  async _readStore () {
    const {
      success,
      store
    } = await this._options.syncer.read({
      uuid: this._uuid,
      lockKey: this._options.lockKey,
      storeKey: this._options.storeKey
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

    // TODO: #1
    // The current command is not fulfilled
    // return this._processCommandInput(commandString)
  }

  _searchCommand (name, {
    exact = true,
    global = false
  } = {}) {
    const {commands} = global
      ? this._template
      : this._current

    const exactMatch = commands[name]

    // Returns the exact match
    if (exactMatch) {
      return this._template[exactMatch]
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
      return this._template[commands[longest]]
    }
  }

  async _processStateInput (commandString) {
    const [name, ...args] = split(commandString, {
      separator: ' '
    })

    const match = this._searchCommand(name, {global: true})
      || this._searchCommand(name)
      || this._options.nonExactMatch
        && this._searchCommand(name, {exact: false})

    if (match) {
      // Run global command
      return this._runCommand(match, args)
    }

    throw error('UNKNOWN_COMMAND', commandString)
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

    // TODO: context
    return condition(this._getCommandFlags(command))
  }

  // async _updateCommandOptions (command, args) {
  //   // TODO
  // }

  // _isCommandFulfilled (command) {
  //   return true
  // }


  async _runAction (command, options) {
    const {
      action,
      catch: onError
    } = command

    if (!action) {
      // If no action,
      //  then the command should just make the state machine go to
      //  the root state
      return
    }

    try {
      // TODO: timeout, lock refresh, context
      await action({
        options,
        flags: this._getCommandFlags(command)
      })
    } catch (err) {
      if (!onError) {
        // TODO: say
        return
      }

      // TODO: handle errors in onError
      return onError(err)
    }
  }

  _setState (state) {
    const id = state instanceof State
      ? state.id
      : ROOT_STATE_ID

    this._store.current = id

    // TODO: clean data
  }

  async _runCommand (command, args = []) {
    // Do not meet the condition
    const conditioned = await this._testCommandCondition(command)
    if (!conditioned) {
      return
    }

    const options = parse(command, args)

    const state = this._runAction(command, options)

    this._setState(state)
    const {
      success
    } = await this._options.syncer.unlock({
      uuid: this._uuid,
      store: this._store,
      lockKey: this._options.lockKey,
      storeKey: this._options.storeKey
    })


    // TODO: #1
    // if (args.length > 0) {
    //   await this._updateCommandOptions(command, args)
    // }

    // TODO: #1 support command without fulfilled options
    // if (!this._isCommandFulfilled(command)) {
    //   return
    // }

    // await this._run(command, args)

    // const output = Promise.all(this._output.map(this._formatter))
    // .then(this._joiner)

    // this._output.length = 0

    // return output
  }
}
