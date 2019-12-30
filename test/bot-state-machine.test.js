const test = require('ava')
const delay = require('delay')
// const uuid = require('uuid/v4')
// const log = require('util').debuglog('bot-state-machine')
const {StateMachine} = require('..')

test('basic', async t => {
  const sm = new StateMachine({
    nonExactMatch: true
  })

  const root = sm.rootState()
  .flag('foo', false)

  root.command('sell')
  .action(function () {
    this.say('sell')
  })

  root.command('buy')
  .option('stock')
  .condition(function condition ({foo}) {
    t.is(foo, false)
    this.say('passed')
    return true
  })
  .action(function action ({options, flags}) {
    t.deepEqual(options, {stock: 'TSLA'})
    t.deepEqual(flags, {foo: false})
    this.say(`buy ${options.stock}`)
  })

  t.is(await sm.agent().input('buy TSLA'), 'passed\nbuy TSLA')
  t.is(await sm.agent().input('buy stock=TSLA'), 'passed\nbuy TSLA')
  t.is(await sm.agent().input('buy TSLA haha'), 'passed\nbuy TSLA')
  t.is(await sm.agent().input('buyTSLA'), 'passed\nbuy TSLA')
})

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

  const foo = sm.agent('bob').input('foo')
  .then(message => {
    t.is(message, 'foo')
  })

  const bar = sm.agent('bob').input('bar')
  .then(
    msg => {
      t.fail(`should fail, but get "${msg}"`)
    },

    err => {
      t.pass(err.code, 'LOCK_FAIL')
    }
  )

  const baz = delay(50).then(
    () => sm.agent('bob').input('bar')
  ).then(
    msg => {
      t.fail(`should fail, but get "${msg}"`)
    },

    err => {
      t.pass(err.code, 'NOT_OWN_LOCK')
    }
  )

  await Promise.all([foo, bar])

  const bar2 = await sm.agent('bob').input('bar')
  t.is(bar2, 'bar', 'foo should unlock after executing')
})
