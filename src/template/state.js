const Flags = require('./flags')
const {
  ensureObject,
  FLAGS, STATES,
  STATE
} = require('../common')

module.exports = class State {
  #cm
  #flags
  #state

  constructor ({
    parentId,
    id,
    template
  }) {
    const state = ensureObject(template, id)
    this.#state = state

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
    Object.defineProperties(this, {
      id: {
        get () {
          return id
        }
      },

      // Prevent users from creating State instance themselves，
      //  or getting the State class
      constructor: {}
    })
  }

  flag (name, defaultValue, onchange) {
    this.#flags.add(name, defaultValue, onchange)
    return this
  }

  command (...names) {
    return this.#cm.add(names)
  }

  default (commandFinder) {
    this.#state.default = commandFinder
    return this
  }
}
