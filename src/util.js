const error = require('./error')

const create = () => Object.create(null)

const ensureObject = (host, key) =>
  host[key] || (host[key] = create())

const DELIMITER = '.'
const STATE_PREFIX = '$'
const ROOT_STATE_ID = STATE_PREFIX
const COMMAND_PREFIX = '$$'
// const OPTION_PREFIX = '$$$'

const createId = prefix => (name, parentId) =>
  parentId
    ? parentId + DELIMITER + prefix + name
    : prefix + name

const stateId = createId(STATE_PREFIX)
const commandId = createId(COMMAND_PREFIX)
// const optionId = createId(OPTION_PREFIX)

const REGEX_INVALID_ID = /[$.\s]/

const checkId = id => {
  if (!id || typeof id !== 'string') {
    throw error('INVALID_ID')
  }

  if (REGEX_INVALID_ID.test(id) || id.startsWith('_')) {
    throw error('ILLEGAL_ID')
  }
}

const COMMAND = 'command'
const STATE = 'state'

// const getType = id => {
//   if (id.startsWith(COMMAND_PREFIX)) {
//     return COMMAND
//   }

//   if (id.startsWith(STATE_PREFIX)) {
//     return STATE
//   }
// }

module.exports = {
  create,
  ensureObject,

  // DELIMITER,
  STATE_PREFIX,
  ROOT_STATE_ID,
  // COMMAND_PREFIX,
  // OPTION_PREFIX,

  stateId,
  commandId,
  // optionId,

  checkId,

  COMMAND,
  STATE,
  // getType
}
