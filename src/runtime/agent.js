const uuid = require('uuid/v4')
const delay = require('delay')

const {
  split, splitKeyValue,
  create, ensureObject,
  ROOT_STATE_ID,
  STATE, OPTION_LIST
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

const sanitizeState = state => state instanceof State
  ? state.id
  : ROOT_STATE_ID

module.exports = class Agent {
  constructor (template, options) {
    this._template = template
    this._options = options

    // This is the uuid for the current task
    // A single audience can create many tasks
    this._uuid = uuid()

    this._store = null
    this._currentCommand = null
    this._currentAction = null
    this._locked = false

    this._output = []

    const say = (...args) => {
      this._output.push(...args)
    }

    const setFlag = (key, value) => {
      this._setFlag(key, value)
    }

    this._commandContext = {
      say,
      setFlag
    }

    this._stateContext = {
      say
    }
  }

  _setFlag (key, value) {
    const {parentId} = this._currentCommand
    const {flags} = this._template[parentId]

    if (key in flags) {
      ensureObject(this._store, parentId)[key] = value
      return
    }

    throw error('FLAG_NOT_DEFINED', key)
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

  _generateOutput () {
    const {
      format,
      join
    } = this._options

    const output = join(this._output.map(format))

    this._output.length = 0
    return output
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
      this._currentCommand = match
      this._currentAction = match.action

      // Run global command
      await this._runCommand(args)
      return this._generateOutput()
    }

    throw error('UNKNOWN_COMMAND', commandString)
  }

  _getCommandFlags () {
    const {parentId} = this._currentCommand

    // TODO: default value
    return this._store[parentId] || {}
  }

  async _testCommandCondition () {
    const {condition} = this._currentCommand
    if (!condition) {
      return true
    }

    // TODO: context
    return condition(this._getCommandFlags())
  }

  // async _updateCommandOptions (command, args) {
  //   // TODO
  // }

  // _isCommandFulfilled (command) {
  //   return true
  // }

  async _lock () {
    let success

    const {
      syncer,
      lockKey,
      storeKey
    } = this._options.syncer

    try {
      ({success} = await syncer.lock({
        uuid: this._uuid,
        store: this._store,
        lockKey,
        storeKey
      }))
    } catch (err) {
      success = false
    }

    if (!success) {
      throw error('LOCK_FAIL')
    }

    this._locked = true
  }

  async _refreshLock () {
    const {
      syncer,
      lockKey
    } = this._options.syncer

    await syncer.refreshLock({
      uuid: this._uuid,
      lockKey
    })
  }

  _scheduleRefreshTimer () {
    const {lockRefreshInterval} = this._options

    // The lock refresh timer is used to prevent the lock
    //  being expired before the action executed.
    this._lockRefreshTimer = setInterval(async () => {
      try {
        await this._refreshLock()
      } catch (err) {
        // Do nothing
        // If we fails to refresh the lock, then
        // - if no other command gains the lock, lucky!
        // - if another command gains the lock,
        //    then the current lock will fail to unlock and set the store,
        //    which is ok, however.
      }
    }, lockRefreshInterval)
  }

  _clearRefreshTimer () {
    clearInterval(this._lockRefreshTimer)
    this._lockRefreshTimer = null
  }

  // We should swallow all command errors
  // Returns `string`
  async _runAndHandleAction (action, options) {
    const command = this._currentCommand

    let actionErr
    let state

    const argument = {
      options,
      flags: this._getCommandFlags(command)
    }

    try {
      state = command.parentId
        ? await action.call(this._commandContext, argument)
        : await action(argument)
    } catch (err) {
      actionErr = err
    }

    if (!actionErr) {
      this._clearRefreshTimer()
      return sanitizeState(state)
    }

    const {
      catch: onError
    } = command

    if (!onError) {
      this._clearRefreshTimer()

      throw error('UNCAUGHT_ACTION_ERROR', actionErr)
    }

    let onErrorState
    let onErrorErr

    try {
      onErrorState = await onError(actionErr, argument)
    } catch (err) {
      onErrorErr = err
    }

    this._clearRefreshTimer()

    if (!onErrorErr) {
      return sanitizeState(onErrorState)
    }

    throw error('UNCAUGHT_CATCH_ERROR', onErrorErr)
  }

  async _runAction (action, options) {
    this._scheduleRefreshTimer()

    const {actionTimeout} = this._options

    const timeout = delay(actionTimeout).then(() => {
      this._clearRefreshTimer()
      this._handleActionTimeout()
      return this._currentCommand.parentId
    })

    return Promise.race([
      timeout(),
      this._runAndHandleAction(action, options)
    ])
  }

  // - internal `boolean` whether the state is provided by bot-state-machine
  _setState (current) {
    let preset = this._template[current]

    // Something wrong that the state id is invalid
    if (!preset) {
      return
    }

    const keep = create()
    keep[current] = true

    let id = preset.parentId

    while (id) {
      keep[id] = true
      preset = this._template[id]
      id = preset.parentId
    }

    for (const key of Object.keys(this._store)) {
      if (!keep[key] && key !== 'current') {
        // Clean store
        delete this._store[key]
      }
    }

    this._store.current = current
  }

  async _runCommand (args = []) {
    // Do not meet the condition
    const conditioned = await this._testCommandCondition()
    if (!conditioned) {
      return
    }

    const options = parse(this._currentCommand, args)

    if (!this._currentAction) {
      // If no action,
      //  then the command should just make the state machine go to
      //  the root state
      return
    }

    // Gain the lock
    await this._lock()

    const state = await this._runAction(action, options)

    this._setState(state)

    // If the command has no action, we still need to update the store,
    // but in edge cases, another thread take control of the lock, but is ok
    const {
      success
    } = await this._options.syncer.unlock({
      uuid: this._uuid,
      store: this._store,
      lockKey: this._options.lockKey,
      storeKey: this._options.storeKey
    })

    if (!success) {
      // log the failure
    }


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
