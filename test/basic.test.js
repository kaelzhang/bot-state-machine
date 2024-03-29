const test = require('ava')
const {StateMachine} = require('../src')

test('basic', async t => {
  const sm = new StateMachine({
    nonExactMatch: true
  })

  sm.rootState()

  const root = sm.rootState()
  .flag('foo', false)

  root.command('sell')
  .action(function () {
    this.say('sell')
  })

  root.command('buy')
  .option('stock', {
    validate: () => true
  })
  .condition(function condition ({foo}) {
    t.is(foo, false)
    this.say('passed')
    return true
  })
  .action(function action ({options, flags, distinctId}) {
    t.is(distinctId, 'bob')
    t.deepEqual(options.stock, 'TSLA')
    t.deepEqual(flags, {foo: false})
    this.say(`buy ${options.stock}`)

    if (this.context) {
      t.is(this.context.foo, 'bar')
    }
  })

  t.is(await sm.chat('bob').input('buy TSLA'), 'passed\nbuy TSLA')
  t.is(await sm.chat('bob', {
    context: {
      foo: 'bar'
    }
  }).input('buy TSLA'), 'passed\nbuy TSLA')

  t.is(await sm.chat('bob').input('buy stock=TSLA'), 'passed\nbuy TSLA')
  t.is(await sm.chat('bob').input('buy TSLA haha'), 'passed\nbuy TSLA')
  t.is(await sm.chat('bob').input('buyTSLA'), 'passed\nbuy TSLA')
})
