const {SimpleMemorySyncer} = require('./syncer')
const {create} = require('../common')

const createKey = key =>
  distinctId => `bot-sm:${key}:${distinctId}`

const createLockKey = createKey('lock')
const createStoreKey = createKey('store')

module.exports = class Options {
  constructor ({
    syncer = new SimpleMemorySyncer(),
    lockKey = createLockKey,
    storeKey = createStoreKey,
    commandTimeout = 5000,
    nonExactMatch = false
  } = {}) {
    this.options = {
      syncer,
      commandTimeout,
      nonExactMatch,
    }

    this.lockKey = lockKey
    this.storeKey = storeKey
  }

  create (distinctId) {
    const options = Object.assign(create(), this.options)
    options.lockKey = this.lockKey(distinctId)
    options.storeKey = this.storeKey(distinctId)

    return options
  }
}
