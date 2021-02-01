const {
  isFunction
} = require('core-util-is')
const makeArray = require('make-array')

const {
  create,
  JUST_RETURN,
  OPTIONS, OPTION_LIST,

  returnValue
} = require('../common')
const error = require('../error')


const getDuplicateKey = (keys, obj) => {
  for (const key of keys) {
    if (key in obj) {
      return key
    }
  }
}


const isHasDefault = config => 'default' in config


const wrapDefault = defaults => isFunction(defaults)
  ? defaults
  : returnValue(defaults)


const checkSetter = (setter, optionName) => {
  if (!setter) {
    return JUST_RETURN
  }

  if (isFunction(setter)) {
    return setter
  }

  throw error('INVALID_OPTION_SETTER', optionName, setter)
}


module.exports = class Options {
  constructor (command) {
    this._options = command[OPTIONS] = create()
    this._optionList = command[OPTION_LIST] = new Set()
  }

  _checkDefaultOption (name) {
    for (const key of this._optionList) {
      const schema = this._options[key]

      if (isHasDefault(schema)) {
        // `bot-state-machine` provides a python-like argument system,
        // so, a non-default option should not follow a default option.
        // For example:

        // ```py
        // def func(foo=1, bar):
        //                 ^
        //   return foo + bar
        // ```
        throw error('NON_DEFAULT_OPTION_FOLLOWS_DEFAULT', name, key)
      }
    }
  }

  add (name, config = {}) {
    const {
      alias = [],
      message = name,
      // message = name,
      set
    } = config

    const hasDefault = isHasDefault(config)

    const names = makeArray(alias).concat(name)
    const duplicateKey = getDuplicateKey(names, this._options)

    if (duplicateKey) {
      throw error('DUPLICATE_OPTION', duplicateKey)
    }

    const schema = {
      // So all aliases could easily get the primary name
      name,
      message,
      set: checkSetter(set)
    }

    if (hasDefault) {
      schema.default = wrapDefault(config.default)
    } else {
      this._checkDefaultOption(name)
    }

    for (const n of names) {
      this._options[n] = schema
    }

    // Only primary option names are in the list
    this._optionList.add(name)
  }
}
