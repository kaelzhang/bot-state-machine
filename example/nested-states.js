const {StateMachine} = require('..')

const sm = module.exports = new StateMachine({
  // nonExactMatch is very useful for some languages
  //  which don't have whitespaces
  nonExactMatch: true
})

// It is a global command
sm.command('cancel')
// The command has no action which means
//  this command will make the state machine go to the root state

const root = sm.rootState()
.flag(
  'tradeUnlocked',
  false,
  // onchange
  function (tradeUnlocked) {
    this.say(
      tradeUnlocked
        ? 'trading is unlocked'
        : 'trading turned off'
    )
  }
)

root.command('unlock')
.condition(function ({tradeUnlocked}) {
  if (tradeUnlocked) {
    this.say('trading is already unlocked')
  }

  return !tradeUnlocked
})
.action(function () {
  this.setFlag('tradeUnlocked', true)
})

root.command('lock')
.action(function () {
  this.setFlag('tradeUnlocked', false)
})

const CommandTrade = root.command('trade')
.condition(function ({tradeUnlocked}) {
  if (!tradeUnlocked) {
    this.say('trading is locked')
  }

  return tradeUnlocked
})
.action(() => StateTrade)

const StateTrade = CommandTrade.state('trade')
.flag('divine', false)

const fakeBuyStock = (stock, say) => {
  say(`buy ${stock}`)
}

const fakeSellStock = async (stock, say) => {
  say(`sell ${stock}`)
  throw new Error('network error')
}

// `buyTSLA` will match command `buy`,
//   because nonExactMatch is on.
// But `buyall` will not match command `buy`,
//   because there is an exact match command `buyall`

// `purchase` is an alias of `buy`

// The following input will match the command:
// - buy TSLA
// - buy TSLA hahaha
// - buyTSLA
// - purchase TSLA
// - purchase TSLA hahaha
// - purchaseTSLA
// - 买入特斯拉
// - 买入 特斯拉
StateTrade.command('buy', 'purchase', '买入')
.option('stock')
.action(async function ({options, flags}) {
  await fakeBuyStock(options.stock, this.say)
  return StateTrade
})

// The following input will match the command:
// - buyallTSLA
// - buyallTSLA hahaha
// - buyallTSLAhahaha
// - 全仓买入特斯拉
// - 全仓买入特斯拉吧
// But the following input will not match
// - buyall TSLA
// - 全仓买入 特斯拉
StateTrade.command('buyallTSLA', '全仓买入特斯拉')
.action(async function () {
  this.say(`buyallTSLA`)
  return StateTrade
})

// The following input will match the command:
// - buyall TSLA
// - buyall TSLA hahaha
// - 全仓买入 特斯拉
StateTrade.command('buyall', '全仓买入')
.option('stock')
.action(async function ({options}) {
  this.say(`buyall ${options.stock}`)
  return StateTrade
})

StateTrade.command('sell')
.action(async function ({options}) {
  // Show the usage of options._
  await fakeSellStock(options._[0], this.say)
})
.catch(function () {
  // We must avoid this,
  // all errors from a command must be handled, or it is a bug of a command.
  // However, bot-sm will handle the situation
  throw new Error('failed to sell')
})

StateTrade.command('sellall')
.action(async function () {
  this.say('failed to sell')
  throw new Error('error, failed to sell')
})
.catch(() => StateTrade)

StateTrade.command('imyourdaddy')
.action(async function () {
  this.setFlag('divine', true)
  this.say('divine shield on')
  return StateTrade
})
