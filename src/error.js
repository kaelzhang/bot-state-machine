const {Errors} = require('err-object')

const {E, error} = new Errors({
  messagePrefix: '[bot-sm] '
})

E('COMMAND_UNKNOWN_OPTION', 'unknown option "%s"')

E('OPTIONS_NOT_FULFILLED', 'options are not enough, missing %j')

E('FLAG_NOT_DEFINED', 'flag "%s" is not defined')

E('NOT_OWN_LOCK', 'the current thread does not own the lock')

E('UNKNOWN_COMMAND', 'unknown command "%s"')

E('LOCK_FAIL', 'fail to lock')

module.exports = error
