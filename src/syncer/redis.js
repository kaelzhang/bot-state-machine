module.exports = class RedisSyncer {
  constructor (redis, {
    prefix = 'bot-sm'
  } = {}) {
    this._redis = redis
    this._prefix = prefix
  }

  async read ({
    uuid,
    id,
    distinctId
  }) {

  }

  async lock ({
    uuid,
    id,
    store,
    distinctId
  }) {

  }

  async unlock ({
    uuid,
    id,
    store,
    distinctId
  }) {

  }

  async refreshLock ({
    uuid,
    distinctId
  }) {

  }
}
