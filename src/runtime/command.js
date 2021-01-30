const {
  splitKeyValue,
  // STATE,
  OPTION_LIST, OPTIONS
} = require('../common')
const error = require('../error')


const parse = async (command, args, flags) => {
  const keyList = [].concat(command[OPTION_LIST])
  const parsed = Object.create(null)
  const unnamed = []

  const {length} = args
  let i = 0
  while (i < length) {
    const {key, value} = splitKeyValue(args[i ++])
    if (!key) {
      unnamed.push(value)
      continue
    }

    const index = keyList.indexOf(key)
    if (index === - 1) {
      throw error('UNKNOWN_OPTION', key)
    }

    parsed[key] = value
    keyList.splice(index, 1)
  }

  const unnamedLength = unnamed.length
  const keyListLength = keyList.length

  let rest = []

  if (unnamedLength > keyListLength) {
    // We just abandon redundant argument
    rest = unnamed.splice(keyListLength)
  }

  for (const value of unnamed) {
    parsed[keyList.shift()] = value
  }

  if (keyList.length) {
    throw error('OPTIONS_NOT_FULFILLED', keyList)
  }

  parsed._ = rest

  const tasks = []
  const options = command[OPTIONS]

  for (const key of command[OPTION_LIST]) {
    const {set} = options[key]

    // There is always an validator
    tasks.push(set(parsed[key], key, flags))
  }

  // Validate
  await Promise.all(tasks)

  return parsed
}


module.exports = parse
