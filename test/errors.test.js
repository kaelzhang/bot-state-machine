const test = require('ava')
// const delay = require('delay')
// const uuid = require('uuid/v4')
// const log = require('util').debuglog('bot-state-machine')
const {run} = require('./common')

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
  ['COMMAND_UNKNOWN_OPTION', {
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
  }]
]

ERRORS.forEach(([code, ...args], i) => {
  test(`${i}: error: ${code}`, async t => {
    await t.throwsAsync(() => run(...args), {
      code
    })
  })
})
