const Flags = require('./flags')
const {
  ensureObject,
  FLAGS, STATES,
  STATE
} = require('../common')

module.exports = class State {
  #cm
  #flags

  constructor ({
    parentId,
    id,
    template
  }) {
    const state = ensureObject(template, id)
    const flags = ensureObject(state, FLAGS)

    // Verbose
    state.id = id
    state.type = STATE

    // root state has no parentId
    if (parentId) {
      state.parentId = parentId
      template[parentId][STATES][id] = state
    }

    this.#flags = new Flags(flags)
    this.#cm = new State.CommandManager({
      template,
      parentId: id
    })

    // this.id should never be changed by users
    Object.defineProperty(this, 'id', {
      get () {
        return id
      }
    })
  }

  flag (name, defaultValue, onchange) {
    this.#flags.add(name, defaultValue, onchange)
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
