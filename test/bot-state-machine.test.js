const test = require('ava')
// const log = require('util').debuglog('bot-state-machine')
const {StateMachine} = require('..')

test('basic', async t => {
  const sm = new StateMachine()

  sm.rootState()
  .flag('foo', false)
  .command('foo')
  .condition(function condition ({foo}) {
    t.is(foo, false)
    this.say('passed')
    return true
  })
  .action(function action ({options, flags}) {
    t.deepEqual(options, {})
    t.deepEqual(flags, {foo: false})
    this.say('foo')
  })

  const output = await sm.agent().input('foo')

  t.is(output, 'passed\nfoo')
})
