const test = require('ava')
const delay = require('delay')
// const uuid = require('uuid/v4')
// const log = require('util').debuglog('bot-state-machine')
const {StateMachine} = require('..')

test('basic', async t => {
  const sm = require('../example/nested-states')

  // await t.throwsAsync(() => )
  t.is(await sm.agent('bob').input('trade'), 'trading is locked')
})
