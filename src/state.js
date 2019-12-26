const CommandManager = require('./command-manager')
const Flags = require('./flags')
const {
  ensureObject,

  FLAGS,
  COMMANDS,
  STATES
} = require('./common')

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
    ensureObject(state, COMMANDS)

    // root state has no parentId
    if (parentId) {
      template[parentId][STATES][id] = state
    }

    this.#flags = new Flags(flags)
    this.#cm = new CommandManager({
      template,
      parentId
    })

    // this.id could not be changed
    Object.defineProperty(this, 'id', {
      get () {
        return id
      }
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
