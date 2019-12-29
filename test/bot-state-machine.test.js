const test = require('ava')
// const log = require('util').debuglog('bot-state-machine')
const {StateMachine} = require('..')

test('basic', async t => {
  const sm = new StateMachine()

  sm.rootState()
  .command('foo')
  .action(function action () {
    this.say('foo')
  })

  const output = await sm.agent().input('foo')

  t.is(output, 'foo')
})
