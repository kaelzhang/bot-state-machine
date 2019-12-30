const test = require('ava')
const delay = require('delay')
const {StateMachine} = require('../src')

test('lock conflict', async t => {
  const sm = new StateMachine()

  const root = sm.rootState()

  root.command('foo')
  .action(async function () {
    await delay(300)
    this.say('foo')
  })

  root.command('bar')
  .action(async function () {
    await delay(300)
    this.say('bar')
  })

  const foo = sm.chat('bob').input('foo')
  .then(message => {
    t.is(message, 'foo')
  })

  const bar = sm.chat('bob').input('bar')
  .then(
    msg => {
      t.fail(`bar: should fail, but get "${msg}"`)
    },

    err => {
      t.pass(err.code, 'LOCK_FAIL')
    }
  )

  const baz = delay(100).then(
    () => sm.chat('bob').input('bar')
  ).then(
    msg => {
      t.fail(`baz: should fail, but get "${msg}"`)
    },

    err => {
      t.pass(err.code, 'NOT_OWN_LOCK')
    }
  )

  await Promise.all([foo, bar, baz])

  const bar2 = await sm.chat('bob').input('bar')
  t.is(bar2, 'bar', 'foo should unlock after executing')
})
