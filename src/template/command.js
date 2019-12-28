const State = require('./state')
const error = require('../error')
const Options = require('./command-options')

const {
  ensureObject,
  stateId, checkId,
  STATES,
  COMMAND
} = require('../common')

// If a command has sub states or has unsolved options,
// it can not intercept into the process of another executing command,
// No command can intercept into an executing command which has sub states
module.exports = class Command {
  #parentId
  #id
  #template
  #global

  #options
  #command

  constructor ({
    parentId,
    id,
    // store,
    // map,
    // stateMap,
    // hooks,
    template,
    global
  }) {
    const command = ensureObject(template, id)
    ensureObject(command, STATES)

    // Verbose
    command.id = id
    command.type = COMMAND

    // global command has no parentId
    if (parentId) {
      command.parentId = parentId
    }

    this.#parentId = parentId
    this.#id = id
    this.#template = template
    this.#global = global

    this.#options = new Options(command)
    this.#command = command
  }

  // returns state
  state (name) {
    if (this.#global) {
      throw error('STATE_ON_GLOBAL_COMMAND')
    }

    checkId(name)
    const id = stateId(name, this.#id)

    const state = new State({
      parentId: this.#id,
      id,
      template: this.#template
    })

    return state
  }

  option (name, opts) {
    if (this.#global) {
      throw error('OPTIONS_ON_GLOBAL_COMMAND')
    }

    this.#options.add(name, opts)
    return this
  }

  condition (condition) {
    this.#command.condition = condition
    return this
  }

  action (action) {
    this.#command.action = action
    return this
  }

  catch (onError) {
    this.#command.catch = onError
    return this
  }
}