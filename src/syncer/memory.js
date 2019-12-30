// Only used for single instance
module.exports = class SimpleMemorySyncer {
  constructor ({
    lockExpire = 3000,
    // storeExpire = 10 * 1000 * 60
  } = {}) {
    this._storage = Object.create(null)
    this._lockExpire = lockExpire
    // this._storeExpire = storeExpire

    this._expireTimer = Object.create(null)
  }

  _has (key) {
    return key in this._storage
  }

  _get (key) {
    return this._storage[key]
  }

  _canOwn (lockKey, chatId) {
    // If there is no lock, we could just update it
    return !this._has(lockKey)
      // And if we own the lock
      || this._get(lockKey) === chatId
  }

  _clearTimer (lockKey) {
    if (this._expireTimer[lockKey]) {
      clearTimeout(this._expireTimer[lockKey])
      delete this._expireTimer[lockKey]
    }
  }

  // We use setTimeout to expire a lock in MemorySyncer
  _setTimer (lockKey) {
    if (this._expireTimer[lockKey]) {
      clearTimeout(this._expireTimer[lockKey])
    }

    this._expireTimer[lockKey] = setTimeout(() => {
      delete this._storage[lockKey]
    }, this._lockExpire)
  }

  read ({
    // univeral unique id to distinguish every task
    chatId,
    // user id
    lockKey,
    storeKey
  }) {
    if (!this._canOwn(lockKey, chatId)) {
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
    chatId,
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

    this._storage[lockKey] = chatId
    // TODO: make the lock expire

    this._storage[storeKey] = store

    this._setTimer(lockKey)

    return {
      success: true
    }
  }

  // Refresh the expire time of a lock.
  // A lock must expire,
  //  or the lock might not be released due to unexpected failure.
  // But a lock might expire before the command
  refreshLock ({
    // We do not need chatId for MemorySyncer
    // chatId,
    lockKey
  }) {
    this._setTimer(lockKey)
  }

  // Unlock (if necessary and own the lock) and update the store
  unlock ({
    chatId,
    store,
    lockKey,
    storeKey
  }) {
    if (!this._canOwn(lockKey, chatId)) {
      return {
        success: false
      }
    }

    delete this._storage[lockKey]
    this._storage[storeKey] = store
    this._clearTimer(lockKey)

    return {
      success: true
    }
  }
}
