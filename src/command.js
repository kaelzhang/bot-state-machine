const {State} = require('./state')
const error = require('./error')

const {
  ensureObject,
  stateId, commandId,
  checkId,
  COMMAND
} = require('./util')

const RETURN_TRUE = () => true

const PARSE_OPTIONS = Symbol('parse-options')

// If a command has sub states or has unsolved options,
// it can not intercept into the process of another executing command,
// No command can intercept into an executing command which has sub states
class Command {
  #id
  // #store
  // #map
  // #stateMap
  // #hooks

  #context
  #global

  #options

  constructor ({
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
    const options = ensureObject(command, 'options')
    this.#options = options

    this.#id = id
    // this.#store = store
    // this.#map = map
    // this.#stateMap = stateMap
    // this.#hooks = hooks
    this.#context = context
    this.#global = global

    this._validator = RETURN_TRUE
  }

  // returns state
  state (name) {
    checkId(name)
    const id = stateId(name, this.#id)

    const state = new State({
      id,
      // store: this.#store,
      // map: this.#stateMap,
      // stateMap: this.#stateMap
      context: this.#context
    })

    return state
  }

  condition (validator) {
    this._validator = validator
    return this
  }

  option (name, {
    alias,
    message,
    validate
  }) {
    if (this.#global) {
      throw error('OPTIONS_ON_GLOBAL_COMMAND')
    }


  }

  [PARSE_OPTIONS] (args) {

  }

  action (executor) {

  }

  catch (onError) {

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
