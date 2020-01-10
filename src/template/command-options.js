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
    throw error('OPTION_VALIDATE_ERROR', key, value, err.message)
  }

  if (!passed) {
    throw error('OPTION_VALIDATE_FAIL', key, value)
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
    validate = RETURN_TRUE
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
      validate: wrapValidator(validate)
    }

    for (const n of names) {
      this._options[n] = schema
      this._optionList.push(n)
    }
  }
}
