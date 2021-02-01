const splitString = require('split-string')
const error = require('./error')

const create = () => Object.create(null)

const ensureObject = (host, key) =>
  host[key] || (host[key] = create())


const UNDEFINED = undefined
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

const returnValue = value => () => value


module.exports = {
  create,
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
  STATES: 'states',
  FLAGS: 'flags',

  OPTIONS: 'options',
  OPTION_LIST: 'optionList',

  split,
  splitKeyValue,

  returnValue
}
