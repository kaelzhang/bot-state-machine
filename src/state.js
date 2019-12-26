const {CommandManager} = require('./command')
const error = require('./error')
const {
  ensureObject, create,
  STATE,

  FLAGS,
  COMMANDS,
  STATES
} = require('./util')

const NOOP = () => {}

class Flags {
  constructor (store) {
    this._store = store
    this._flags = create()
  }

  add (name, value, change = NOOP) {
    if (name in this._flags) {
      throw error('DUPLICATE_FLAG', name)
    }

    this._store[name] = value

    this._flags[name] = {
      change
    }
  }

  set (name, newValue) {
    const flag = this._flags[name]
    if (!flag) {
      throw error('FLAG_NOT_FOUND')
    }

    const {
      [name]: value
    } = this._store

    if (value === newValue) {
      return
    }

    const {
      change
    } = flag

    if (change) {
      change(newValue, value)
    }

    this._store[name] = value
  }
}

class State {
  #id
  // We do not allow State to get access to data store
  // #store
  // #map
  // #stateMap
  #context

  #cm
  #flags

  constructor ({
    contextId,
    id,
    // hooks,
    // only store non-configuration data in dataStore
    context
  } = {}) {
    const {
      idMap,
      stateMap,
      store
    } = context

    idMap.set(id, {
      type: STATE,
      target: this
    })

    stateMap.set(this, id)

    this.#id = id
    // this.#store = store
    // this.#map = map
    // this.#hooks = hooks

    const state = ensureObject(store, id)
    const flags = ensureObject(state, FLAGS)
    ensureObject(state, COMMANDS)

    store[contextId][STATES][id] = state

    this.#flags = new Flags(flags)
    this.#cm = new CommandManager({
      context,
      // hooks,
      contextId: id
    })
  }

  flag (name, initialValue, onchange) {
    this.#flags.add(name, initialValue, onchange)
    return this
  }

  setFlag (name, value) {
    this.#flags.set(name, value)
  }

  say (...things) {
    const {say} = this.#context.store
    say.push(things)
  }

  command (...names) {
    return this.#cm.add(names)
  }

  search (name, exact) {
    return this.#cm.search(name, exact)
  }
}

module.exports = {
  State
}
