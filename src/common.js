const splitString = require('split-string')
const error = require('./error')

const create = () => Object.create(null)

const ensureObject = (host, key) =>
  host[key] || (host[key] = create())

const DELIMITER = '.'
const STATE_PREFIX = '$'
const COMMAND_PREFIX = '$$'

const createId = prefix => (name, parentId) =>
  parentId
    ? parentId + DELIMITER + prefix + name
    : prefix + name

const stateId = createId(STATE_PREFIX)
const commandId = createId(COMMAND_PREFIX)

const REGEX_INVALID_ID = /[$.\s]/

const checkId = id => {
  if (!id || typeof id !== 'string') {
    throw error('INVALID_ID')
  }

  if (REGEX_INVALID_ID.test(id) || id.startsWith('_')) {
    throw error('ILLEGAL_ID')
  }
}

const split = (s, separator) =>
  splitString(s, {separator})

// 'foo=bar baz' ->
// [{key: 'foo', value: 'bar'}, {value: 'baz'}]
const splitKeyValue = s => {
  const [key, ...values] = split(s, '=')
  return values.length
    // foo=bar
    ? {
      key,
      value: values.join('=')
    }
    // No key
    : {
      key: '',
      value: key
    }
}

module.exports = {
  create,
  ensureObject,

  NOOP: () => {},

  // // DELIMITER,
  // STATE_PREFIX,
  ROOT_STATE_ID: STATE_PREFIX,
  // // COMMAND_PREFIX,
  // // OPTION_PREFIX,

  stateId,
  commandId,

  checkId,

  COMMAND: 'command',
  STATE: 'state',

  // // So that JSON.stringify will abandon this key
  COMMANDS: 'commands',
  STATES: 'states',
  FLAGS: 'flags',

  OPTIONS: 'options',
  OPTION_LIST: 'optionList',
  // // getType


  // RUN: Symbol('run'),
  // CONDITIONED: Symbol('conditioned'),
  // UPDATE_OPTIONS: Symbol('update-options'),
  // FULFILLED: Symbol('fulfilled'),

  // RETURN_TRUE: () => true,
  // NOOP: () => {},

  split,
  splitKeyValue
}
