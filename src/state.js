const EE = require('events')
const {inherits} = require('util')
const {CommandManager} = require('./command')
const error = require('./error')
const {
  create, ensureObject, stateId,
  COMMAND_PREFIX
} = require('./util')

const SEARCH = Symbol('search')
const ACTIVATE = Symbol('activate')
const DEACTIVATE = Symbol('deactivate')

const NOOP = () => {}

class Flags {
  constructor (store) {
    this._store = store
    this._flags = create()
  }

  add (name, value, change = NOOP) {
    if (name in this._flags) {
      throw error('DUPLICATE_FLAG', name)
    }

    this._store[name] = value

    this._flags[name] = {
      change
    }
  }

  set (name, newValue) {
    const flag = this._flags[name]
    if (!flag) {
      throw error('FLAG_NOT_FOUND')
    }

    const {
      [name]: value
    } = this._store

    if (value === newValue) {
      return
    }

    const {
      change
    } = flag

    if (change) {
      change(newValue, value)
    }

    this._store[name] = value
  }
}

class State {
  constructor ({
    rootState,
    // only store non-configuration data in dataStore
    store,
    id
  } = {}) {
    this._id = id
    this._rootState = rootState
    this._store = store

    this._activate = false

    const state = ensureObject(store, id)
    const flags = ensureObject(state, 'flags')

    this._flags = new Flags(flags)
    this._cm = new CommandManager(state)
  }

  flag (name, initialValue, onchange) {
    this._flags.add(name, initialValue, onchange)
    return this
  }

  setFlag (name, value) {
    this._flags.set(name, value)
  }

  _say (...things) {
    this._rootState.say(...things)
  }

  say (...things) {
    if (this._activate) {
      this._say(...things)
    }
  }

  command (...names) {
    return this._cm.add(names)
  }

  [SEARCH] (commandName) {
    if (true) {

    }
  }

  [ACTIVATE] () {
    this._activate = true
  }

  [DEACTIVATE] () {
    this._activate = false
  }
}

const isCharCodeNeedSspace = code => code < 126
const joinTwo = (s1, s2) => isCharCodeNeedSspace(s1.charCodeAt(s1.length - 1))
  || isCharCodeNeedSspace(s2.charCodeAt(0))
  ? `${s1} ${s2}`
  : s1 + s2

const DEFAULT_FORMATTER = strings => strings.reduce(joinTwo)
const DEFAULT_JOINER = said => said.join('\n')

const createInitStore = () => {
  const store = create()
  store.states = create()
  return store
}

class RootState extends State {
  constructor (dataStore = createInitStore()) {
    super({
      rootState: null,
      dataStore,
      id: stateId('root')
    })

    this._globalCm = new CommandManager()
    this._sayBuffer = []
    this._formatter = DEFAULT_FORMATTER
    this._joiner = DEFAULT_JOINER
    this._activate = true
  }

  _say (...things) {
    this._sayBuffer.push(things)
  }

  format (formatter) {
    this._formatter = formatter
    return this
  }

  join (joiner) {
    this._joiner = joiner
    return this
  }

  _getCurrentState () {

  }

  busy (onbusy) {

  }

  _searchCommand () {

  }

  globalCommand (names) {
    return this._globalCm.add(names)
  }

  async _runCommand ({
    command,
    options
  }) {

  }

  async input (command) {



    this._sayBuffer.length = 0

    await this._runCommand({
      command,
      options
    })

    return Promise.all(this._sayBuffer.map(this._formatter))
    .then(this._joiner)
  }
}

module.exports = {
  RootState
}
