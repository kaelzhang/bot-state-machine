const {CommandManager} = require('./command')
const error = require('./error')
const {
  ensureObject, create,
  STATE,

  FLAGS,
  COMMANDS,
  STATES
} = require('./common')

module.exports = class State {

  #id
  #template

  #cm
  #flags

  constructor ({
    parentId,
    id,
    template
  }) {
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

  command (...names) {
    return this.#cm.add(names)
  }

  search (name, exact) {
    return this.#cm.search(name, exact)
  }
}
