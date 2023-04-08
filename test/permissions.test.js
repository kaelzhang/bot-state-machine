const test = require('ava')
const {StateMachine} = require('../src')

test('basic', async t => {
  const sm = new StateMachine({
    nonExactMatch: true
  })

  sm.command('cancel')

  const root = sm.rootState()

  const Sell = root.command('sell')
  .action(function () {
    this.say('sell')
  })

  const Buy = root.command('buy')
  const BuyState = Buy.state('state')

  root.default(input => {
    if (input === 'unknown') {
      return Sell
    }
  })

  Buy.action(() => BuyState)

  const Back = BuyState.command('back')
  .action(() => root)

  t.is(await sm.chat('bob').input('sell'), 'sell')

  t.is(await sm.chat('bob').input('unknown'), 'sell')

  const options = {
    commands: [
      Buy,
      // Recursive
      Back,

      // invalid
      null,
      // invalid, state will be omitted
      BuyState.id,

      // TODO: whether should throw?
      // invalid
      'not-exists'
    ]
  }

  t.is(await sm.chat('roger', options).input('buy'), '')

  await sm.chat('roger', options).input('back')

  await t.throwsAsync(
    () => sm.chat('roger', options).input('sell'), {
      code: 'UNKNOWN_COMMAND'
    }
  )

  // Command finder -> sell
  await t.throwsAsync(
    () => sm.chat('roger', options).input('unknown'), {
      code: 'UNKNOWN_COMMAND'
    }
  )

  await t.throwsAsync(() => sm.chat('tom', {
    commands: [Sell.id]
  }).input('buy'), {
    code: 'UNKNOWN_COMMAND'
  })
})
