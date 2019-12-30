const test = require('ava')
// const delay = require('delay')
// const uuid = require('uuid/v4')
// const log = require('util').debuglog('bot-state-machine')

test('integrated', async t => {
  const sm = require('../example/nested-states')

  // await t.throwsAsync(() => )
  t.is(await sm.agent('bob').input('trade'), 'trading is locked')

  // Command buy only available in StateTrade
  await t.throwsAsync(
    () => sm.agent('bob').input('buy'), {
      code: 'UNKNOWN_COMMAND'
    }
  )

  // unlock flag
  t.is(await sm.agent('bob').input('unlock'), 'trading is unlocked')

  // Still unavailable
  await t.throwsAsync(
    () => sm.agent('bob').input('buy'), {
      code: 'UNKNOWN_COMMAND'
    }
  )

  // Go to StateTrade
  t.is(await sm.agent('bob').input('trade'), '')

  // Command unlock only available in root state
  await t.throwsAsync(
    () => sm.agent('bob').input('unlock'), {
      code: 'UNKNOWN_COMMAND'
    }
  )

  // global command cancel
  t.is(await sm.agent('bob').input('cancel'), '')

  // Go to StateTrade
  t.is(await sm.agent('bob').input('trade'), '')

  t.is(await sm.agent('bob').input('buy TSLA'), 'buy TSLA')

  let hasSellErr = false

  try {
    await sm.agent('bob').input('sell TSLA')
  } catch (err) {
    t.is(err.message, 'failed to sell')
    t.is(err.output, 'sell TSLA')
    hasSellErr = true
  }

  if (!hasSellErr) {
    t.fail('sell should fail')
  }
})
