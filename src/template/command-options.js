const {
  create,
  RETURN_TRUE,
  OPTIONS, OPTION_LIST
} = require('../common')
const error = require('../error')

const getDuplicateKey = (keys, obj) => {
  for (const key of keys) {
    if (key in obj) {
      return key
    }
  }
}

const wrapValidator = validator => async (value, key) => {
  let passed

  try {
    passed = await validator(value, key)
  } catch (err) {
    throw error('OPTION_VALIDATION_ERROR', key, value, err.message)
  }

  if (!passed) {
    throw error('OPTION_VALIDATION_NOT_PASS', key, value)
  }

  return passed
}

module.exports = class Options {
  constructor (command) {
    this._options = command[OPTIONS] = create()
    this._optionList = command[OPTION_LIST] = []
  }

  add (name, {
    alias = [],
    // message = name,
    validate
  } = {}) {
    alias = Array.from(alias)

    const names = alias.concat(name)
    const duplicateKey = getDuplicateKey(names, this._options)

    if (duplicateKey) {
      throw error('DUPLICATE_OPTION', duplicateKey)
    }

    const schema = {
      // TODO: #1
      // message,
      validate: validate
        ? wrapValidator(validate)
        : RETURN_TRUE
    }

    for (const n of names) {
      this._options[n] = schema
      this._optionList.push(n)
    }
  }
}
