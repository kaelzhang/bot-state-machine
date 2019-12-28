// class RedisSyncer {
//   constructor (redis, {
//     prefix = 'bot-sm'
//   } = {}) {
//     this._redis = redis
//     this._prefix = prefix
//   }

//   async read ({
//     uuid,
//     id,
//     distinctId
//   }) {

//   }

//   async lock ({
//     uuid,
//     id,
//     store,
//     distinctId
//   }) {

//   }

//   async unlock ({
//     uuid,
//     id,
//     store,
//     distinctId
//   }) {

//   }

//   async refreshLock ({
//     uuid,
//     distinctId
//   }) {

//   }
// }



// Only used for single instance
class SimpleMemorySyncer {
  constructor ({
    lockExpire = 10 * 1000
  } = {}) {
    this._storage = Object.create(null)
    this._lockExpire = lockExpire
    this._expelTimer = null
  }

  _has (key) {
    return key in this._storage
  }

  _get (key) {
    return this._storage[key]
  }

  read ({
    // univeral unique id to distinguish every task
    uuid,
    // user id
    lockkey,
    storeKey
  }) {
    if (this._has(lockKey) && this._get(lockKey) !== uuid) {
      return {
        success: false
      }
    }

    return {
      success: true,
      store: this._get(storeKey) || {}
    }
  }

  // @returns Boolean
  lock ({
    uuid,
    // State id or command id of bot-state-machine
    id,
    store,
    distinctId
  }) {
    const
    this._storage
  }

  refreshLock () {

  }
}

module.exports = {
  SimpleMemorySyncer
}
