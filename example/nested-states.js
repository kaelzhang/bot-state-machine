const {StateMachine} = require('..')

const sm = module.exports = new StateMachine({
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

const CommandTrade = root.command('trade')
.condition(function ({tradeUnlocked}) {
  if (!tradeUnlocked) {
    this.say('trading is locked')
  }

  return tradeUnlocked
})
.action(() => StateTrade)

const StateTrade = CommandTrade.state('trade')

const fakeBuyStock = (stock, say) => {
  say(`buy ${stock}`)
}

const fakeSellStock = async (stock, say) => {
  say(`sell ${stock}`)
  throw new Error('network error')
}

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

StateTrade.command('buy', 'purchase')
.option('stock')
.action(async function ({options, flags}) {
  await fakeBuyStock(options.stock, this.say)
  return StateTrade
})
