const error = require('../error')
const {
  ensureObject,
  COMMANDS, COMMAND,
  checkId, commandId
} = require('../common')
const Command = require('./command')

module.exports = class CommandManager {
  #template
  #parentId
  #global
  #commands

  constructor ({
    template,
    parentId,
    global = false
  }) {
    this.#template = template
    this.#parentId = parentId
    this.#global = global

    this.#commands = ensureObject(
      parentId
        ? template[parentId]
        : template,
      COMMANDS)
  }

  _checkDuplicate (names) {
    for (const name of names) {
      if (name in this.#commands) {
        throw error('DUPLICATE_COMMAND', name)
      }
    }
  }

  add (names) {
    const [name] = names
    checkId(name, COMMAND)

    this._checkDuplicate(names)

    const id = commandId(name, this.#parentId)

    for (const n of names) {
      this.#commands[n] = id
    }

    return new Command({
      parentId: this.#parentId,
      id,
      template: this.#template,
      global: this.#global
    })
  }
}
