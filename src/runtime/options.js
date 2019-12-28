const {SimpleMemorySyncer} = require('./syncer')

const createKey = key =>
  distinctId => `bot-sm:${key}:${distinctId}`

const createLockKey = createKey('lock')
const createStoreKey = createKey('store')

module.exports = class Options {
  constructor ({
    syncer = new SimpleMemorySyncer(),
    lockKey = createLockKey,
    storeKey = createStoreKey
  } = {}) {
    this.syncer = syncer
    this.lockKey = lockKey
    this.storeKey = storeKey
  }
}
