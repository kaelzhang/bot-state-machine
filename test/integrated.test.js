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

  // Flag tradeUnlocked will not change,
  //  so there will be no onchange callback
  t.is(await sm.agent('bob').input('lock'), '')

  // unlock flag
  t.is(await sm.agent('bob').input('unlock'), 'trading is unlocked')
  t.is(await sm.agent('bob').input('unlock'), 'trading is already unlocked')

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
  t.is(await sm.agent('bob').input('取消'), '')

  // Go to StateTrade
  t.is(await sm.agent('bob').input('trade'), '')

  t.is(await sm.agent('bob').input('buy TSLA'), 'buy TSLA')
  t.is(await sm.agent('bob').input('sellall'), 'failed to sell')

  t.is(await sm.agent('bob').input('买入特斯拉'), 'buy 特斯拉')
  t.is(await sm.agent('bob').input('purchase TSLA'), 'buy TSLA')
  t.is(await sm.agent('bob').input('buy stock=TSLA'), 'buy TSLA')
  t.is(await sm.agent('bob').input('buy stock=TSLA haha'), 'buy TSLA')
  t.is(await sm.agent('bob').input('buy TSLA haha'), 'buy TSLA')
  t.is(await sm.agent('bob').input('buyallTSLA'), 'buyallTSLA')
  t.is(await sm.agent('bob').input('buyallTSLAhahaha'), 'buyallTSLA')
  t.is(await sm.agent('bob').input('全仓买入特斯拉'), 'buyallTSLA')
  t.is(await sm.agent('bob').input('全仓买入特斯拉吧'), 'buyallTSLA')
  t.is(await sm.agent('bob').input('buyall TSLA'), 'buyall TSLA')
  t.is(await sm.agent('bob').input('全仓买入 特斯拉'), 'buyall 特斯拉')

  t.is(await sm.agent('bob').input('imyourdaddy'), 'divine shield on')

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

  // Back to root state
  t.is(await sm.agent('bob').input('cancel'), '')

  await t.throwsAsync(
    () => sm.agent('bob').input('buy'), {
      code: 'UNKNOWN_COMMAND'
    }
  )
})
