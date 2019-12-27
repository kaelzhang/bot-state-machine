const uuid = require('uuid/v4')

const {
  create
} = require('./common')
const error = require('./error')

const createKey = key =>
  distinctId => `bot-sm:${key}:${distinctId}`

const createLockKey = createKey('lock')
const createStoreKey = createKey('store')

module.exports = class Agent {
  constructor (template, syncer, {
    // DistinctId for the audience
    distinctId = uuid(),
    lockKey = createLockKey,
    storeKey = createStoreKey
  }) {
    this._template = template
    this._syncer = syncer

    // This is the uuid for the current task
    // A single audience can create many tasks
    this._uuid = uuid

    this._lockKey = lockKey(distinctId)
    this._storeKey = storeKey(distinctId)
    this._store = null
  }

  async input (message) {
    const {
      success,
      store
    } = await this._syncer.read({
      uuid: this._uuid,
      lockKey: this._lockKey,
      storeKey: this._storeKey
    })

    if (!success) {
      throw error('NOT_OWN_LOCK')
    }

    this._store = store
  }
}
