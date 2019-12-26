const {State} = require('./state')
const error = require('./error')
const {Options} = require('./options')

const {
  ensureObject, create,
  stateId, commandId,
  checkId,
  COMMAND,

  COMMANDS,
  STATES,
  OPTIONS,
  FLAGS,

  CONDITIONED,
  UPDATE_OPTIONS,
  FULFILLED,
  RUN,

  RETURN_TRUE,
  NOOP
} = require('./util')

// If a command has sub states or has unsolved options,
// it can not intercept into the process of another executing command,
// No command can intercept into an executing command which has sub states
class Command {
  #contextId
  #id
  // #store
  // #map
  // #stateMap
  // #hooks

  #context
  #global

  #options

  constructor ({
    contextId,
    id,
    // store,
    // map,
    // stateMap,
    // hooks,
    context,
    global
  }) {
    const {
      idMap,
      store
    } = context

    idMap.set(id, {
      type: COMMAND,
      target: this
    })

    const command = ensureObject(store, id)
    const options = ensureObject(command, OPTIONS)
    ensureObject(command, STATES)

    store[contextId][COMMANDS][id] = command

    this.#contextId = contextId
    this.#id = id
    // this.#store = store
    // this.#map = map
    // this.#stateMap = stateMap
    // this.#hooks = hooks
    this.#context = context
    this.#global = global

    this._condition = RETURN_TRUE
    this._onError = null
    this._executor = NOOP

    this.#options = new Options(options)
  }

  // returns state
  state (name) {
    if (this.#global) {
      throw error('STATE_ON_GLOBAL_COMMAND')
    }

    checkId(name)
    const id = stateId(name, this.#id)

    const state = new State({
      contextId: this.#id,
      id,
      // store: this.#store,
      // map: this.#stateMap,
      // stateMap: this.#stateMap
      context: this.#context
    })

    return state
  }

  condition (condition) {
    this._condition = condition
    return this
  }

  option (name, opts) {
    if (this.#global) {
      throw error('OPTIONS_ON_GLOBAL_COMMAND')
    }

    this.#options.add(name, opts)
    return this
  }

  async [CONDITIONED] () {
    const condition = this._condition
    // Should not call with this._condition,
    //   or this object will be populated
    return condition({
      ...this.#context.store[this.#contextId].flags
    })
  }

  // Update a current option
  async [UPDATE_OPTIONS] (args) {
    const {
      store: {
        [this.#id]: store
      }
    } = this.#context

    const fulfilled = await this.#options.update(
      args,
      store.ff !== false
    )

    if (fulfilled) {
      delete store.ff
    } else {
      store.ff = false
    }

    // return fulfilled
  }

  [FULFILLED] () {
    return this.#this.options.fulfilled()
  }

  async [RUN] () {
    const {
      [this.#id]: command,
      [this.#contextId]: state
    } = this.#context.store

    const {
      [OPTIONS]: options
    } = command
    command[OPTIONS] = create()

    const {
      [FLAGS]: flags
    } = state

    const action = this._executor

    try {
      return await action({
        options,
        flags: {
          ...flags
        }
      })
    } catch (err) {
      const onError = this._onError
      if (onError) {
        return onError(err)
      }

      throw err
    }
  }

  action (executor) {
    this._executor = executor
    return this
  }

  catch (onError) {
    this._onError = onError
    return this
  }
}

class CommandManager {
  // #store
  // #map
  // #stateMap
  #context
  #contextId
  #global

  constructor ({
    // store,
    // map,
    // stateMap,
    // hooks,
    context,
    contextId,
    global = false
  }) {
    // this.#store = store
    // this.#map = map
    // this.#stateMap = stateMap
    // this.#hooks = hooks
    this.#context = context
    this.#contextId = contextId
    this.#global = global
    this._commands = Object.create(null)
  }

  _checkDuplicate (names) {
    for (const name of names) {
      if (name in this._commands) {
        throw error('DUPLICATE_COMMAND')
      }
    }
  }

  add (names) {
    const [name] = names
    checkId(name)

    this._checkDuplicate(names)

    const id = commandId(name, this.#contextId)

    const command = new Command({
      id,
      context: this.#context,
      contextId: this.#contextId,
      // store: this.#store,
      // map: this.#map,
      // stateMap: this.#stateMap,
      // hooks: this.#hooks,
      global: this.#global
    })

    for (const n of names) {
      this._commands[n] = {
        id,
        command
      }
    }

    return command
  }

  search (name, exact) {
    const instant = this._commands[name]

    // Returns the exact match
    if (instant) {
      return {
        matched: name,
        ...instant
      }
    }

    if (exact) {
      return
    }
    // Else, try to find the longest match

    let longest
    let l = 0

    for (const n of Object.keys(this._commands)) {
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
        matched: longest,
        ...this._commands[longest]
      }
    }
  }
}

module.exports = {
  CommandManager
}
