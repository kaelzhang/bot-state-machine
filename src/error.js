const {Errors} = require('err-object')

const {E, TE, error} = new Errors({
  messagePrefix: '[bot-sm] '
})

E('UNKNOWN_OPTION', 'unknown option "%s"')

E('FLAG_NOT_DEFINED', 'flag "%s" is not defined')

E('NOT_OWN_LOCK', 'the current thread does not own the lock')

E('UNKNOWN_COMMAND', 'unknown command "%s"')

E('LOCK_FAIL', 'fail to lock')

TE('INVALID_RETURN_STATE',
  'the return state of a command should either be a State or undefined')

E('COMMAND_FINDER_ERROR', 'fails to find default command')

E('INVALID_RETURN_COMMAND',
  'command finder must return a command of the current state')

E('COMMAND_TIMEOUT', 'command action timed out')

E('COMMAND_ERROR', 'command fails to run, reason: %s')

E('DUPLICATE_COMMAND', 'command "%s" is already defined')

E('DUPLICATE_OPTION', 'option "%s" is already defined')

E('DUPLICATE_FLAG', 'flag "%s" is already defined')

E('STATE_ON_GLOBAL_COMMAND', 'sub states are not allowed in global command')

E('OPTION_ON_GLOBAL_COMMAND', 'options are not allowed in global command')

E('CONDITION_ON_GLOBAL_COMMAND', 'condition is not allowed in global command')

E('STATE_UNREACHABLE', `only the following states are reachable:
- the current state
- sub states of the command
- parent states of the current state`)

const must = 'id must be a non-empty string, and not contains whitespaces, `$` or `.`, and should not start with `_`'

TE('INVALID_COMMAND_ID', `command ${must}`)

TE('INVALID_STATE_ID', `state ${must}`)

TE('INVALID_OPTION_SETTER', 'the value setter of option "%s" must be a function')

E('NON_DEFAULT_OPTION_FOLLOWS_DEFAULT', 'non-default option "%s" follows default option "%s"')

E('OPTION_TIMEOUT', 'option "%s" takes too long to parse')

E('OPTION_PROCESS_ERROR', 'option "%s" fails to process')

E('OPTIONS_NOT_FULFILLED', 'options are not enough, missing %j')

E('DUPLICATE_GIVEN_OPTION', 'the given option "%s=%s" is duplicated')

module.exports = error
