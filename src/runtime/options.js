const util = require('util')

const SimpleMemorySyncer = require('../syncer/memory')
const {create} = require('../common')

const createKey = key =>
  distinctId => `bot-sm:${key}:${distinctId}`

const createLockKey = createKey('lock')
const createStoreKey = createKey('store')

const DEFAULT_FORMATTER = util.format
const DEFAULT_JOINER = said => said.join('\n')

module.exports = class Options {
  constructor ({
    syncer = new SimpleMemorySyncer(
      // lockExpire = 3000,
    ),
    lockKey = createLockKey,
    storeKey = createStoreKey,
    actionTimeout = 5000,
    // Should less than Syncer::lockExpire
    lockRefreshInterval = 1000,
    nonExactMatch = false,
    format = DEFAULT_FORMATTER,
    join = DEFAULT_JOINER
  } = {}) {
    this.options = {
      syncer,
      actionTimeout,
      nonExactMatch,
      lockRefreshInterval,
      format,
      join
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
