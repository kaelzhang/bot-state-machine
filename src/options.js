const {RETURN_TRUE} = require('./util')
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
    this._optionList = []
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
    }
  }

  parse (args) {

  }

  // Returns
  // - true if fulfilled
  // - false otherwise
  update (args, initial) {
    if (!initial) {

    }
  }
}

module.exports = {
  Options
}
