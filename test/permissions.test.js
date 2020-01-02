const test = require('ava')
const {StateMachine} = require('../src')

test('basic', async t => {
  const sm = new StateMachine({
    nonExactMatch: true
  })

  sm.command('cancel')

  const root = sm.rootState()

  const Sell = root.command('sell')
  const Buy = root.command('buy')
  const BuyState = Buy.state('state')

  Buy.action(() => BuyState)

  const Back = BuyState.command('back')
  .action(() => root)

  t.is(await sm.chat('bob').input('sell'), '')

  const options = {
    commands: [
      Buy,
      // Recursive
      Back,

      // invalid
      null,
      // invalid, state will be omitted
      BuyState.id,
      // invalid
      'not-exists'
    ]
  }

  t.is(await sm.chat('roger', options).input('buy'), '')

  await t.throwsAsync(
    () => sm.chat('roger', options).input('sell'), {
      code: 'UNKNOWN_COMMAND'
    }
  )

  await t.throwsAsync(() => sm.chat('tom', {
    commands: [Sell.id]
  }).input('buy'), {
    code: 'UNKNOWN_COMMAND'
  })
})
