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
  [(err, t) => {
    t.is(err.code, 'OPTION_VALIDATION_ERROR')
    t.deepEqual(err.args, ['bar', 'baz', 'foo'])
  }, {
    setup (root) {
      root.command('foo')
      .option('bar', {
        async validate () {
          await delay(10)
          throw new Error('foo')
        }
      })
    },
    input: 'foo baz'
  }],
  [(err, t) => {
    t.is(err.code, 'OPTION_VALIDATION_NOT_PASS')
    t.deepEqual(err.args, ['bar', 'baz'])
  }, {
    setup (root) {
      root.command('foo')
      .option('bar', {
        validate () {
          return false
        }
      })
    },
    input: 'foo baz'
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
