const splitString = require('split-string')
const error = require('./error')

const create = () => Object.create(null)
const createSet = () => new Set()

const ensureObject = (host, key, creator = create) =>
  host[key] || (host[key] = creator())


const UNDEFINED = undefined
const DELIMITER = '.'
const STATE_PREFIX = '$'
const COMMAND_PREFIX = '$$'
const WHITESPACE = ' '

const createId = prefix => (name, parentId) =>
  parentId
    ? parentId + DELIMITER + prefix + name
    : prefix + name

const stateId = createId(STATE_PREFIX)
const commandId = createId(COMMAND_PREFIX)

const REGEX_INVALID_ID = /[$.\s]/

const checkId = (id, type) => {
  if (
    typeof id !== 'string'
    || !id
    || REGEX_INVALID_ID.test(id)
    || id.startsWith('_')
  ) {
    throw error(`INVALID_${type.toUpperCase()}_ID`, id)
  }
}

const split = (s, separator = WHITESPACE) =>
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

const returnValue = value => () => value


module.exports = {
  create,
  createSet,
  ensureObject,

  NOOP: () => {},
  JUST_RETURN: v => v,

  ROOT_STATE_ID: STATE_PREFIX,

  stateId,
  commandId,

  checkId,

  UNDEFINED,

  COMMAND: 'command',
  STATE: 'state',

  COMMANDS: 'commands',
  COMMAND_SET: 'commandSet',

  STATES: 'states',
  FLAGS: 'flags',

  OPTIONS: 'options',
  OPTION_SET: 'optionSet',

  split,
  splitKeyValue,

  returnValue
}
