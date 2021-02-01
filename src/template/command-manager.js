const error = require('../error')
const {
  ensureObject, createSet,
  COMMANDS, COMMAND, COMMAND_SET,
  checkId, commandId
} = require('../common')
const Command = require('./command')

module.exports = class CommandManager {
  #template
  #parentId
  #global
  #commands
  #commandSet

  constructor ({
    template,
    parentId,
    global = false
  }) {
    this.#template = template
    this.#parentId = parentId
    this.#global = global

    const host = parentId
      ? template[parentId]
      : template

    this.#commands = ensureObject(host, COMMANDS)
    this.#commandSet = ensureObject(host, COMMAND_SET, createSet)
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

    this.#commandSet.add(id)

    return new Command({
      parentId: this.#parentId,
      id,
      template: this.#template,
      global: this.#global
    })
  }
}
