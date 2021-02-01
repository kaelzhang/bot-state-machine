const test = require('ava')
const delay = require('delay')

const {run} = require('./common')

const NOOP = () => {}

const ERRORS = [
  [['COMMAND_ERROR', 'FLAG_NOT_DEFINED'], {
    setup (root) {
      root.command('foo')
      .action(async function () {
        this.setFlag('bar', 1)
      })
    },
    input: 'foo'
  }],
  [['COMMAND_ERROR', 'FLAG_NOT_DEFINED'], {
    setup (root) {
      root.command('foo')
      .action(async function () {
        this.setFlag('bar', 1)
      })
      .catch(err => {
        throw err
      })
    },
    input: 'foo'
  }],
  ['UNKNOWN_OPTION', {
    setup (root) {
      root.command('foo')
    },
    input: 'foo bar=1'
  }],
  ['OPTIONS_NOT_FULFILLED', {
    setup (root) {
      root.command('foo')
      .option('bar')
    },
    input: 'foo'
  }],
  ['UNKNOWN_COMMAND', {
    setup () {
    },
    input: 'foo'
  }],
  ['INVALID_RETURN_STATE', {
    setup (root) {
      root.command('cancel')
      .action(() => '$')
    },
    input: 'cancel'
  }],
  ['DUPLICATE_COMMAND', {
    setup (root) {
      root.command('foo')
      root.command('foo')
    }
  }],
  ['DUPLICATE_OPTION', {
    setup (root) {
      root.command('foo')
      .option('bar')
      .option('bar')
    }
  }],
  ['DUPLICATE_FLAG', {
    setup (root) {
      root
      .flag('foo')
      .flag('foo')
    }
  }],
  ['STATE_ON_GLOBAL_COMMAND', {
    setup (_, sm) {
      sm.command('cancel')
      .state('foo')
    }
  }],
  ['OPTION_ON_GLOBAL_COMMAND', {
    setup (_, sm) {
      sm.command('cancel')
      .option('foo')
    }
  }],
  ['CONDITION_ON_GLOBAL_COMMAND', {
    setup (_, sm) {
      sm.command('cancel')
      .condition(NOOP)
    }
  }],
  ['INVALID_COMMAND_ID', {
    setup (root) {
      root.command(1)
    }
  }],
  ['INVALID_COMMAND_ID', {
    setup (root) {
      root.command('$foo')
    }
  }],
  ['INVALID_STATE_ID', {
    setup (root) {
      root.command('foo')
      .state(1)
    }
  }],
  ['INVALID_STATE_ID', {
    setup (root) {
      root.command('foo')
      .state('$foo')
    }
  }],
  ['NON_DEFAULT_OPTION_FOLLOWS_DEFAULT', {
    setup (root) {
      root.command('foo')
      .option('a', {
        default: 1
      })
      .option('b')
    }
  }],
  ['INVALID_OPTION_SETTER', {
    setup (root) {
      root.command('foo')
      .option('a', {
        set: 1
      })
    }
  }],
  [(err, t) => {
    t.is(err.code, 'DUPLICATE_GIVEN_OPTION')
    t.deepEqual(err.args, ['bar', '2'])
  }, {
    setup (root) {
      root.command('foo')
      .option('bar')
    },
    input: 'foo bar=1 bar=2'
  }],
  [(err, t) => {
    t.is(err.code, 'OPTION_PROCESS_ERROR')
    t.deepEqual(err.args, ['bar'])
  }, {
    setup (root) {
      root.command('foo')
      .option('bar', {
        set () {
          throw new RangeError('invalid')
        }
      })
    },
    input: 'foo baz'
  }],
  [(err, t) => {
    t.is(err.code, 'OPTIONS_NOT_FULFILLED')
    t.deepEqual(err.args, [['baz']])
  }, {
    setup (root) {
      root.command('foo')
      .option('bar')
      .option('baz')
    },
    input: 'foo a'
  }],
  [(err, t) => {
    t.is(err.code, 'OPTION_TIMEOUT')
    t.deepEqual(err.args, ['bar'])
  }, {
    optionTimeout: 10,
    setup (root) {
      root.command('foo')
      .option('bar', {
        async set () {
          await delay(30)
          throw new RangeError('invalid')
        }
      })
    },
    input: 'foo a'
  }],
  [(err, t) => {
    t.is(err.code, 'OPTION_PROCESS_ERROR')
    t.deepEqual(err.args, ['bar'])
  }, {
    // no timeout, and there will be another error
    optionTimeout: 0,
    setup (root) {
      root.command('foo')
      .option('bar', {
        async set () {
          await delay(30)
          throw new RangeError('invalid')
        }
      })
    },
    input: 'foo a'
  }],
  [(err, t) => {
    t.is(err.code, 'OPTION_PROCESS_ERROR')
    t.deepEqual(err.args, ['bar'])
    t.deepEqual(err.originalError.message, 'required')
  }, {
    setup (root) {
      root.command('foo')
      .option('bar', {
        default () {
          throw Error('required')
        }
      })
    },
    input: 'foo'
  }]
]

ERRORS.forEach(([code, ...args], i) => {
  test(`${i}: error: ${code}`, async t => {
    try {
      await run(...args)
    } catch (err) {
      if (Array.isArray(code)) {
        t.is(err.code, code[0])
        t.is(err.originalError.code, code[1])
      } else if (typeof code === 'function') {
        code(err, t)
      } else {
        t.is(err.code, code)
      }

      return
    }

    t.fail('should fail')
  })
})
