const error = require('./error')
const {
  checkId
} = require('./common')

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
