class RedisSyncer {
  constructor (redis, {}) {
    this._redis = redis
  }

  async lock (id) {

  }

  async unlock () {

  }

  async read () {

  }

  async write () {

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
