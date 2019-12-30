const uuid = require('uuid/v4')
const delay = require('delay')
const log = require('util').debuglog('bot-state-machine')

const {
  split, splitKeyValue,
  create, ensureObject,
  ROOT_STATE_ID,
  STATE, OPTION_LIST,
  NOOP
} = require('../common')
const error = require('../error')
const State = require('../template/state')

const parse = (command, args) => {
  const keyList = [].concat(command[OPTION_LIST])
  const parsed = Object.create(null)
  const unnamed = []

  const {length} = args
  let i = 0
  while (i < length) {
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

  let rest = []

  if (unnamedLength > keyListLength) {
    // We just abandon redundant argument
    rest = unnamed.splice(keyListLength)
  }

  for (const value of unnamed) {
    parsed[keyList.shift()] = value
  }

  if (keyList.length) {
    throw error('OPTIONS_NOT_FULFILLED', keyList)
  }

  parsed._ = rest

  return parsed
}

const sanitizeState = state => state instanceof State
  ? state.id
  : ROOT_STATE_ID

const runSyncer = async fn => {
  let success

  try {
    ({success} = await fn())
  } catch (err) {
    success = false
  }

  return success
}

const alwaysRunAfter = async (after, fn) => {
  try {
    await fn()
  } catch (err) {
    // Run after() even if fn() rejects
    await after()
    throw err
  }

  await after()
}

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
    // this._locked = false

    this._output = []

    const say = (...args) => {
      this._output.push(args)
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

    if (!(key in flags)) {
      throw error('FLAG_NOT_DEFINED', key)
    }

    const {
      default: defaultValue,
      change
    } = flags[key]

    const values = ensureObject(this._store, parentId)
    const oldValue = key in values
      ? values[key]
      : defaultValue

    // Just set the new value
    values[key] = value

    if (value === oldValue) {
      return
    }

    try {
      change.call(this._stateContext, value, oldValue)
    } catch (err) {
      // do nothing
    }
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

  async _processInput (commandString) {
    log('input: %s', commandString)

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

  async input (commandString) {
    try {
      await this._processInput(commandString)
    } catch (err) {
      err.output = this._generateOutput()
      throw err
    }

    return this._generateOutput()
  }

  _searchCommand (commandString, {
    exact = true,
    global = false
  } = {}) {
    const [name, ...args] = split(commandString, ' ')

    const {commands} = global
      ? this._template
      : this._current

    const exactMatch = commands[name]

    // Returns the exact match
    if (exactMatch) {
      return {
        command: this._template[exactMatch],
        args
      }
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
      return {
        command: this._template[commands[longest]],
        args: [name.slice(longest.length), ...args]
      }
    }
  }

  _generateOutput () {
    const {
      format,
      join
    } = this._options

    const output = join(this._output.map(slices => format(...slices)))

    this._output.length = 0
    return output
  }

  async _processStateInput (commandString) {
    const match = this._searchCommand(commandString, {global: true})
      || this._searchCommand(commandString)
      || this._options.nonExactMatch
        && this._searchCommand(commandString, {exact: false})

    if (!match) {
      throw error('UNKNOWN_COMMAND', commandString)
    }

    const {
      command,
      args
    } = match

    this._currentCommand = command
    this._currentAction = command.action

    // Run global command
    await this._runCommand(args)
  }

  _getCommandFlags () {
    const {parentId} = this._currentCommand
    const values = create()
    if (!parentId) {
      return values
    }

    const {flags} = this._template[parentId]
    const stored = this._store[parentId] || create()

    for (const [key, config] of Object.entries(flags)) {
      values[key] = key in stored
        ? stored[key]
        : config.default
    }

    return values
  }

  async _testCommandCondition () {
    const {condition} = this._currentCommand
    if (!condition) {
      return true
    }

    return condition.call(this._stateContext, this._getCommandFlags())
  }

  async _lock () {
    const {
      syncer,
      lockKey,
      storeKey
    } = this._options

    const success = await runSyncer(
      () => syncer.lock({
        uuid: this._uuid,
        store: this._store,
        lockKey,
        storeKey
      })
    )

    if (!success) {
      throw error('LOCK_FAIL')
    }

    // this._locked = true
  }

  async _unlock () {
    const {
      syncer,
      lockKey,
      storeKey
    } = this._options

    const success = await runSyncer(
      () => syncer.unlock({
        uuid: this._uuid,
        store: this._store,
        lockKey,
        storeKey
      })
    )

    if (!success) {
      // log the failure
    }
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

  _runCommandFn (fn, ...args) {
    return this._currentCommand.parentId
      ? fn.apply(this._commandContext, args)
      : fn(...args)
  }

  // We should swallow all command errors
  // Returns `string`
  async _runAndHandleAction (options) {
    let actionErr
    let state

    const argument = {
      options,
      flags: this._getCommandFlags()
    }

    try {
      state = await this._runCommandFn(this._currentAction, argument)
    } catch (err) {
      actionErr = err
    }

    if (!actionErr) {
      this._clearRefreshTimer()
      return sanitizeState(state)
    }

    const {
      catch: onError
    } = this._currentCommand

    if (!onError) {
      this._clearRefreshTimer()

      throw actionErr
    }

    let onErrorState
    let onErrorErr

    try {
      onErrorState = await this._runCommandFn(onError, actionErr, argument)
    } catch (err) {
      onErrorErr = err
    }

    this._clearRefreshTimer()

    if (!onErrorErr) {
      return sanitizeState(onErrorState)
    }

    throw onErrorErr
  }

  async _runAction (options) {
    if (!this._currentAction) {
      // If no action,
      //  then the command should just make the state machine go to
      //  the root state
      return ROOT_STATE_ID
    }

    this._scheduleRefreshTimer()

    const {actionTimeout} = this._options

    const timeout = delay(actionTimeout).then(() => {
      this._clearRefreshTimer()
      this._handleActionTimeout()
      return this._currentCommand.parentId
    })

    return Promise.race([
      timeout,
      this._runAndHandleAction(options)
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

    if (this._currentAction) {
      // Gain the lock
      await this._lock()
    }

    await alwaysRunAfter(
      // We always need to unlock and update the store,
      // But in edge cases,
      //  another thread might take control of the lock,
      //  which will cause unlock failture, but is ok
      () => this._unlock(),
      async () => {
        const state = await this._runAction(options)
        this._setState(state)
      }
    )

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
