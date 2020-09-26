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

  async read ({
    chatId,
    lockKey,
    storeKey
  }) {
    const [result, store] = await this._redis.read(
      lockKey,
      storeKey,
      chatId
    )

    if (result === 'NOT_OK') {
      return {
        success: false
      }
    }

    return {
      success: true,
      store: JSON.parse(store)
    }
  }

  async lock ({
    chatId,
    store,
    lockKey,
    storeKey
  }) {
    const result = await this._redis.lock(
      lockKey,
      storeKey,
      chatId,
      store,
      this._lockExpire
    )

    return {
      success: result === 'OK'
    }
  }

  async refreshLock ({
    lockKey
  }) {
    await this._redis.refreshLock(
      lockKey,
      this._lockExpire
    )
  }

  async unlock ({
    chatId,
    store,
    lockKey,
    storeKey
  }) {
    const result = await this._redis.unlock(
      lockKey,
      storeKey,
      chatId,
      JSON.stringify(store)
    )

    return {
      success: result === 'OK'
    }
  }
}
