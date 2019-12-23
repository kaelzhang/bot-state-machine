const error = require('./error')

const create = () => Object.create(null)

const ensureObject = (host, key) =>
  host[key] || (host[key] = create())

const STATE_PREFIX = '$'
const COMMAND_PREFIX = '$$'
const OPTION_PREFIX = '$$$'

const stateId = name => STATE_PREFIX + name
const commandId = name => COMMAND_PREFIX + name
const optionId = name => OPTION_PREFIX + name

const REGEX_TEST_DOLLAR = /[$.]/

const checkId = id => {
  if (!id || typeof id !== 'string') {
    throw error('INVALID_ID')
  }

  if (REGEX_TEST_DOLLAR.test(id)) {
    throw error('ILLEGAL_ID')
  }
}

module.exports = {
  create,
  ensureObject,

  stateId,
  commandId,
  optionId,

  STATE_PREFIX,
  COMMAND_PREFIX,
  OPTION_PREFIX,

  checkId
}
