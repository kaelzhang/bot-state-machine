const {
  defineCommands
} = require('./redis-lua')


module.exports = class RedisSyncer {
  constructor (redis, {
    lockExpire = 3000,
  } = {}) {
    defineCommands(redis)

    this._redis = redis
    this._lockExpire = lockExpire
  }

  //
  async _getLock (lockKey) {
    const result = await this._redis.set(
      lockKey, '1', 'NX', 'EX', `${this._lockExpire}`
    )

    return result === 'OK'
  }

  // Returns `true` if the lock is owned by the current session
  async _ownLock (lockKey) {

  }

  async read ({
    chatId,
    lockKey,
    storeKey
  }) {

  }

  async lock ({
    chatId,
    store,
    lockKey,
    storeKey
  }) {

  }

  async refreshLock ({
    lockKey
  }) {

  }

  async unlock ({
    chatId,
    store,
    lockKey,
    storeKey
  }) {

  }


}
