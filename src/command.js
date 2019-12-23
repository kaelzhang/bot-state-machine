const split = require('split-string')
const error = require('./error')
const {
  ensureObject, commandId
} = require('./util')

const RETURN_TRUE = () => true

const PARSE_OPTIONS = Symbol('parse-options')

// If a command has sub states or has unsolved options,
// it can not intercept into the process of another executing command,
// No command can intercept into an executing command which has sub states
class Command {
  constructor (name) {
    this._validator = RETURN_TRUE
  }

  alias (...aliases) {

  }

  // returns state
  state (name) {

  }

  global () {

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

  }

  [PARSE_OPTIONS] (args) {

  }

  action (executor) {

  }

  catch (onError) {

  }
}

class CommandManager {
  constructor (store) {
    this._store = store
    this._commands = Object.create(null)
  }

  _check (names) {
    for (const name of names) {
      if (name in this._commands) {
        throw error('DUPLICATE_COMMAND')
      }
    }
  }

  add (names) {
    this._check(names)
    const [name] = names

    const id = commandId(name)
    const commandStore = ensureObject(this._store, id)

    const command = new Command(commandStore)

    for (const n of names) {
      this._commands[n] = command
    }

    return command
  }

  search (name) {
    return this._commands[name]
  }

  parse (input) {
    const splitted = split(input, {
      separator: ' '
    })

    if (true) {

    }
  }
}

module.exports = {
  CommandManager
}
