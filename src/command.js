const State = require('./state')
const error = require('./error')
const Options = require('./command-options')

const {
  ensureObject,

  stateId, checkId,
  // COMMAND,

  COMMANDS,
  STATES,
  OPTIONS,
  // FLAGS,

  // CONDITIONED,
  // UPDATE_OPTIONS,
  // FULFILLED,
  // RUN,

  // RETURN_TRUE,
  // NOOP
} = require('./common')

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
    const options = ensureObject(command, OPTIONS)
    ensureObject(command, STATES)

    template[parentId][COMMANDS][id] = command

    this.#parentId = parentId
    this.#id = id
    this.#template = template
    this.#global = global

    this.#options = new Options(options)
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

  // async [CONDITIONED] () {
  //   const condition = this._condition
  //   // Should not call with this._condition,
  //   //   or this object will be populated
  //   return condition({
  //     ...this.#context.store[this.#contextId].flags
  //   })
  // }

  // // Update a current option
  // async [UPDATE_OPTIONS] (args) {
  //   const {
  //     store: {
  //       [this.#id]: store
  //     }
  //   } = this.#context

  //   const fulfilled = await this.#options.update(
  //     args,
  //     store.ff !== false
  //   )

  //   if (fulfilled) {
  //     delete store.ff
  //   } else {
  //     store.ff = false
  //   }

  //   // return fulfilled
  // }

  // [FULFILLED] () {
  //   return this.#this.options.fulfilled()
  // }

  // async [RUN] () {
  //   const {
  //     [this.#id]: command,
  //     [this.#contextId]: state
  //   } = this.#context.store

  //   const {
  //     [OPTIONS]: options
  //   } = command
  //   command[OPTIONS] = create()

  //   const {
  //     [FLAGS]: flags
  //   } = state

  //   const action = this._executor

  //   try {
  //     return await action({
  //       options,
  //       flags: {
  //         ...flags
  //       }
  //     })
  //   } catch (err) {
  //     const onError = this._onError
  //     if (onError) {
  //       return onError(err)
  //     }

  //     throw err
  //   }
  // }

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
