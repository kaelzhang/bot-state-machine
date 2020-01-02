const uuid = require('uuid/v4')

const State = require('./template/state')
const CommandManager = require('./template/command-manager')
const Chat = require('./runtime/chat')
const Options = require('./runtime/options')
const {
  create,
  ROOT_STATE_ID,
} = require('./common')

// Decouple the cirular dependency
// CM -> C -> S -> CM
// =>
// CM -> C -> S + S.CM
State.CommandManager = CommandManager

// StateMachine is controlled by administrators
// But State and Command might be controlled by 3rd party modules
module.exports = class StateMachine {
  constructor (options) {
    const template = this._template = create()

    this._cm = new CommandManager({
      template,
      global: true
    })

    this._options = new Options(options)
    this._rootState = null
  }

  rootState () {
    if (this._rootState) {
      return this._rootState
    }

    return this._rootState = new State({
      id: ROOT_STATE_ID,
      template: this._template
    })
  }

  command (...names) {
    return this._cm.add(names)
  }

  chat (distinctId = uuid(), {
    // Array<string|Command|any>
    commands
  } = {}) {
    return new Chat(this._template, this._options.create(distinctId), {
      commands
    })
  }
}
