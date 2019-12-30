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
  .option('stock')
  .condition(function condition ({foo}) {
    t.is(foo, false)
    this.say('passed')
    return true
  })
  .action(function action ({options, flags}) {
    t.deepEqual(options.stock, 'TSLA')
    t.deepEqual(flags, {foo: false})
    this.say(`buy ${options.stock}`)
  })

  t.is(await sm.chat().input('buy TSLA'), 'passed\nbuy TSLA')
  t.is(await sm.chat().input('buy stock=TSLA'), 'passed\nbuy TSLA')
  t.is(await sm.chat().input('buy TSLA haha'), 'passed\nbuy TSLA')
  t.is(await sm.chat().input('buyTSLA'), 'passed\nbuy TSLA')
})
