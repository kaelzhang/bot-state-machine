module.exports = class Agent {
  constructor (template, options) {
    this._template = template
    this._options = options
  }


}

_getCurrentState () {
  const {current} = this._store
  const {
    type,
    target
  } = this._idMap.get(current) || {
    type: STATE,
    target: this._rootState
  }

  return {
    id: current,
    type,
    target
  }
}

_commandHasStates (id) {
  const command = this._store[id]
  return Object.keys(command[STATES]).length > 0
}

async _runCommand ({
  id, command, args = []
}) {
  this._store.say = []

  await this._run(id, command, args)

  const output = Promise.all(this._store.say.map(this._formatter))
  .then(this._joiner)

  delete this._store.say

  return output
}

async _run (id, command, args) {
  // Do not meet the condition
  const conditioned = await command[CONDITIONED]()
  if (!conditioned) {
    return
  }

  if (args.length > 0) {
    await command[UPDATE_OPTIONS](args)
  }

  // still not fulfilled
  if (!command[FULFILLED]()) {
    return
  }

  const hasSubStates = this._commandHasStates(id)
  const locked = await this._syncer.lock(id)
}

async input (stringCommand) {
  if (!this._rootState) {
    throw error('ROOT_STATE_NOT_FOUND')
  }

  const [name, ...args] = split(stringCommand, {
    separator: ' '
  })

  // Options are not allowed in global command
  // so we only need exact search
  const globalCommand = this._cm.search(name, true)

  if (globalCommand) {
    // Run a global command.
    // We allow global command to run at any time.
    return this._runCommand(globalCommand)
  }

  const {
    id,
    type,
    target
  } = this._getCurrentState()

  if (type === COMMAND) {
    // Resume an unfulfilled command
    //   which we don't provide enough options.
    // TODO: edge case
    // And the command might still be executing,
    //   and the task will be rejected by lock
    return this._runCommand({
      id,
      command: target,
      args: [stringCommand]
    })
  }
  // Else there is no unfinished command,
  //   we will search matched command within the current state

  const result = target.search(name, true)

  if (result) {
    const {
      id: commandId,
      command
    } = result

    // The exact match
    return this._runCommand({
      id: commandId,
      command,
      args
    })
  }

  if (this._nonExactMatch) {
    const nonExactResult = target.search(name)
    if (nonExactResult) {
      const {
        matched,
        id: commandId,
        command
      } = nonExactResult

      return this._runCommand({
        id: commandId,
        command,
        args: [name.slice(matched.length), ...args]
      })
    }
  }

  throw error('UNKNOWN_COMMAND', stringCommand)
}
