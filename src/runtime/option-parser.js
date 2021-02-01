const delay = require('delay')

const {
  splitKeyValue,
  // STATE,
  OPTION_SET, OPTIONS,

  UNDEFINED
} = require('../common')
const error = require('../error')


const errorWrapper = async (promise, key) => {
  try {
    return await promise
  } catch (e) {
    const err = error('OPTION_PROCESS_ERROR', key)
    err.originalError = e
    throw err
  }
}


const timeoutWrapper = (promise, key, timeout) => {
  if (!timeout) {
    return promise
  }

  const timeoutPromise = delay(timeout).then(
    () => Promise.reject(error('OPTION_TIMEOUT', key))
  )

  return Promise.race([
    timeoutPromise,
    promise
  ])
}


module.exports = class Parser {
  constructor (
    commandPreset,
    timeout
  ) {
    this._optionSet = commandPreset[OPTION_SET]
    this._options = commandPreset[OPTIONS]
    this._timeout = timeout
  }

  async _processKey (
    key,
    rawValue,
    flags,
    parsed,
    // An array to collect unfulfilled keys
    unfulfilled
  ) {
    const preset = this._options[key]

    let value = rawValue

    if (rawValue === UNDEFINED) {
      const defaults = preset.default

      if (defaults) {
        value = await errorWrapper(
          defaults(key, flags),
          key
        )
      } else {
        unfulfilled.push(key)
        return
      }
    }

    const setter = preset.set
    parsed[preset.name] = await setter(value, key, flags)
  }

  async parse (args, flags) {
    // For example:
    // optionSet: ['stock', 'position']
    // args: stock=TSLA all

    const keyList = new Set(this._optionSet)
    const rawParsed = []
    const unnamed = []

    for (const arg of args) {
      const {key, value} = splitKeyValue(arg)
      if (!key) {
        unnamed.push(value)
        continue
      }

      const preset = this._options[key]

      if (!preset) {
        throw error('UNKNOWN_OPTION', key)
      }

      rawParsed.push([key, value])

      const {name} = preset
      if (!keyList.has(name)) {
        throw error('DUPLICATE_GIVEN_OPTION', key, value)
      }

      keyList.delete(preset.name)
    }

    // rawParsed => {stock: 'TSLA'}
    // unnamed => ['all']
    // keyList => ['position']

    const unnamedLength = unnamed.length
    const keyListLength = keyList.size

    let rest = []

    if (unnamedLength > keyListLength) {
      // The rest arguments are longer than unmatched keys
      rest = unnamed.splice(keyListLength)
    }

    // now unnamed.length <= keyList.length

    for (const key of keyList) {
      // If unnamed.length is less than keyList.length
      // then the value will be `undefined`,
      // which indicates it is a default value
      rawParsed.push([key, unnamed.shift()])
    }

    const parsed = Object.create(null)
    const unfulfilled = []
    const tasks = []

    for (const [key, value] of rawParsed) {
      tasks.push(
        timeoutWrapper(
          errorWrapper(
            this._processKey(key, value, flags, parsed, unfulfilled),
            key
          ),
          key,
          this._timeout
        )
      )
    }

    await Promise.all(tasks)

    if (unfulfilled.length) {
      throw error('OPTIONS_NOT_FULFILLED', unfulfilled)
    }

    parsed._ = rest

    return parsed
  }
}
