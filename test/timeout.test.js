const test = require('ava')
const delay = require('delay')
const {
  StateMachine,
  SimpleMemorySyncer
} = require('..')

const createSM = lockRefreshInterval => {
  const sm = new StateMachine({
    syncer: new SimpleMemorySyncer({
      lockExpire: 200
    }),
    lockRefreshInterval,
    actionTimeout: 3000
  })

  const root = sm.rootState()

  root.command('foo')
  .option('delay')
  .action(async function ({options}) {
    await delay(parseInt(options.delay, 10))
    this.say('foo')
  })

  return sm
}

test('timeout', async t => {
  const sm = createSM(100)

  await Promise.all([
    sm.agent('bob').input('foo 1000').then(output => {
      t.is(output, 'foo')
    }),

    // larger than lockExpire
    delay(300)
    .then(() => sm.agent('bob').input('foo 0'))
    .then(
      () => {
        t.fail('should fail')
      },
      err => {
        t.is(err.code, 'NOT_OWN_LOCK')
      }
    )
  ])

  await t.throwsAsync(() => sm.agent('bob').input('foo 4000'), {
    code: 'COMMAND_ACTION_TIMEOUT'
  })
})

test('refreshInterval not enough', async t => {
  const sm = createSM(300)

  await Promise.all([
    sm.agent('bob').input('foo 1000').then(output => {
      t.is(output, 'foo')
    }),

    // larger than lockExpire
    delay(300)
    .then(() => sm.agent('bob').input('foo 0'))
    .then(output => {
      t.is(output, 'foo')
    })
  ])
})
