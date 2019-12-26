const {
  RETURN_TRUE,
  splitKeyValue
} = require('./util')
const error = require('./error')

const getDuplicateKey = (keys, obj) => {
  for (const key of keys) {
    if (key in obj) {
      return key
    }
  }
}

class Options {
  constructor (options) {
    this._store = options
    this._keyList = []
    this._schema = Object.create(null)
  }

  add (name, {
    alias = [],
    message = name,
    validate = RETURN_TRUE
  } = {}) {
    const names = alias.concat(name)
    const duplicateKey = getDuplicateKey(names, this._schema)
    if (duplicateKey) {
      throw error('DUPLICATE_OPTION', duplicateKey)
    }

    const schema = {
      message,
      validate
    }

    for (const n of names) {
      this._schema[n] = schema
      this._keyList.push(n)
    }
  }

  _parse (args) {
    const keyList = [].concat(this._keyList)
    const parsed = Object.create(null)
    const unnamed = []

    const {length} = args
    let i = 0
    while (keyList.length > 0 && i < length) {
      const {key, value} = splitKeyValue(args[i ++])
      if (!key) {
        unnamed.push(value)
        continue
      }

      const index = keyList.indexOf(key)
      if (index === - 1) {
        throw error('COMMAND_UNKNOWN_OPTION', key)
      }

      parsed[key] = value
      keyList.splice(index, 1)
    }

    // Abandon extra args
    let fulfilled = true

    const unnamedLength = unnamed.length
    const keyListLength = keyList.length

    if (unnamedLength > keyListLength) {
      unnamed.length = keyListLength
    } else if (unnamedLength < keyListLength) {
      fulfilled = false
    }

    unnamed.forEach((value, ii) => {
      parsed[keyList[ii]] = value
    })

    return {
      parsed,
      fulfilled
    }
  }

  async _setOptions (args) {
    const {parsed, fulfilled} = this._parse(args)
    const tasks = []

    for (const [key, value] of Object.entries(parsed)) {
      const {validate} = this._schema[key]
      if (validate) {
        tasks.push(async () => {
          const passed = await validate(value)
          if (!passed) {
            throw error('COMMAND_INVALID_OPTION', key, value)
          }
        })
      }
    }

    await Promise.all(tasks)

    Object.assign(this._store, parsed)
    return fulfilled
  }

  _getNextKeyNeedsToUpdate () {
    for (const key of Object.keys(this._schema)) {
      if (key in this._store) {
        return key
      }
    }
  }

  async _updateOptions ([value]) {
    const key = this._getNextKeyNeedsToUpdate()
    const {validate} = this._schema[key]

    if (validate) {
      const passed = await validate(value)
      if (!passed) {
        throw error('COMMAND_INVALID_OPTION', key, value)
      }
    }

    this._store[key] = value
    return this.fulfilled()
  }

  // Returns
  // - true if fulfilled
  // - false otherwise
  update (args, initial) {
    if (!initial) {
      return this._setOptions(args)
    }

    return this._updateOptions(args)
  }

  fulfilled () {
    return Object.keys(this._schema).length === Object.keys(this._store).length
  }
}

module.exports = {
  Options
}
