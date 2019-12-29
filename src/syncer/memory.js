// Only used for single instance
module.exports = class SimpleMemorySyncer {
  constructor ({
    lockExpire = 10 * 1000
  } = {}) {
    this._storage = Object.create(null)
    this._lockExpire = lockExpire
    this._expireTimer = null
  }

  _has (key) {
    return key in this._storage
  }

  _get (key) {
    return this._storage[key]
  }

  _canOwn (lockKey, uuid) {
    // If there is no lock, we could just update it
    return !this._has(lockKey)
      // And if we own the lock
      || this._get(lockKey) === uuid
  }

  read ({
    // univeral unique id to distinguish every task
    uuid,
    // user id
    lockKey,
    storeKey
  }) {
    if (!this._canOwn(lockKey, uuid)) {
      return {
        success: false
      }
    }

    return {
      success: true,
      store: this._get(storeKey) || {}
    }
  }

  // Lock and update the store
  // @returns Boolean
  lock ({
    uuid,
    store,
    lockKey,
    storeKey
  }) {
    // We should only create a lock when there is no lock
    if (this._has(lockKey)) {
      return {
        success: false
      }
    }

    this._storage[lockKey] = uuid
    // TODO: make the lock expire

    this._storage[storeKey] = store

    return {
      success: true
    }
  }

  // Refresh the expire time of a lock.
  // A lock must expire,
  //  or the lock might not be released due to unexpected failure.
  // But a lock might expire before the command
  refreshLock ({
    uuid,
    lockKey
  }) {
    // TODO
  }

  // Unlock and update the store
  unlock ({
    uuid,
    store,
    lockKey,
    storeKey
  }) {
    if (!this._canOwn(lockKey, uuid)) {
      return {
        success: false
      }
    }

    delete this._storage[lockKey]
    this._storage[storeKey] = store

    return {
      success: true
    }
  }
}
