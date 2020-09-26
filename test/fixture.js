const Redis = require('ioredis')
const delay = require('delay')

const {
  StateMachine,
  RedisSyncer
} = require('..')


const createBot = withRedis => {
  const options = {}

  if (withRedis) {
    options.syncer = new RedisSyncer(
      new Redis(6379, '127.0.0.1')
    )
  }

  const sm = new StateMachine(options)

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

  return sm
}


const run = async (t, bot1, bot2, bot3) => {
  const foo = bot1.chat('bob').input('foo')
  .then(message => {
    t.is(message, 'foo')
  })

  const bar = bot2.chat('bob').input('bar')
  .then(
    msg => {
      t.fail(`bar: should fail, but get "${msg}"`)
    },

    err => {
      t.is(err.code, 'LOCK_FAIL')
    }
  )

  const baz = delay(100).then(
    () => bot3.chat('bob').input('bar')
  ).then(
    msg => {
      t.fail(`baz: should fail, but get "${msg}"`)
    },

    err => {
      t.is(err.code, 'NOT_OWN_LOCK')
    }
  )

  await Promise.all([foo, bar, baz])

  const bar2 = await bot2.chat('bob').input('bar')

  t.is(bar2, 'bar', 'foo should unlock after executing')
}


module.exports = {
  createBot,
  run
}
