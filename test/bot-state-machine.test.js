const test = require('ava')
const delay = require('delay')
// const uuid = require('uuid/v4')
// const log = require('util').debuglog('bot-state-machine')
const {StateMachine} = require('..')

test('basic', async t => {
  const sm = new StateMachine()

  sm.rootState()
  .flag('foo', false)
  .command('buy')
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

  const output = await sm.agent().input('buy TSLA')

  t.is(output, 'passed\nbuy TSLA')
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
      console.log(err)
      t.pass()
    }
  )

  await Promise.all([foo, bar])
})
