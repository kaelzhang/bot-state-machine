const test = require('ava')
// const delay = require('delay')
// const uuid = require('uuid/v4')
// const log = require('util').debuglog('bot-state-machine')
const {run} = require('./common')

const NOOP = () => {}

const ERRORS = [
  ['FLAG_NOT_DEFINED', {
    setup (root) {
      root.command('foo')
      .action(async function () {
        this.setFlag('bar', 1)
      })
    },
    input: 'foo'
  }],
  ['FLAG_NOT_DEFINED', {
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
  }]
]

ERRORS.forEach(([code, ...args], i) => {
  test(`${i}: error: ${code}`, async t => {
    await t.throwsAsync(() => run(...args), {
      code
    })
  })
})
