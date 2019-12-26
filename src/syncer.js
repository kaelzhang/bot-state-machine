class RedisSyncer {
  constructor (redis, {
    prefix = 'bot-sm'
  } = {}) {
    this._redis = redis
    this._prefix = prefix
  }

  async lock ({
    key,
    id,
    store,
    distinctId
  }) {

  }

  async unlock ({
    key,
    id,
    store,
    distinctId
  }) {

  }

  async refreshLock ({
    key,
    distinctId
  }) {

  }
}

class SimpleMemorySyncer {
  constructor () {
    this._storage = Object.create(null)
  }

  lock (id) {
    return {
      success: true,
      lockedBy: id
    }
  }

  refreshLock () {

  }
}

class NOOP {
  constructor () {

  }
}

module.exports = {
  RedisSyncer,
  NOOP
}
