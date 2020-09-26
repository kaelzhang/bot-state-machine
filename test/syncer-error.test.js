const test = require('ava')
const {
  StateMachine,
  SimpleMemorySyncer
} = require('../src')


class ErrorMemorySyncer extends SimpleMemorySyncer {
  lock () {
    throw new Error('fails to lock')
  }
}


test('lock fail due to an syncer error', async t => {
  const sm = new StateMachine({
    syncer: new ErrorMemorySyncer()
  })

  sm.rootState()

  const root = sm.rootState()

  root.command('foo')
  .action(function () {
    this.say('foo')
  })

  await t.throwsAsync(() => sm.chat('bob').input('foo'), {
    code: 'LOCK_FAIL'
  })
})
