const error = require('../error')
const {
  checkId, commandId
} = require('../common')
const Command = require('./command')

module.exports = class CommandManager {
  #template
  #parentId
  #global

  constructor ({
    template,
    parentId,
    global = false
  }) {
    this.#template = template
    this.#parentId = parentId
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

    const id = commandId(name, this.#parentId)

    const command = new Command({
      parentId: this.#parentId,
      id,
      template: this.#template,
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
}
