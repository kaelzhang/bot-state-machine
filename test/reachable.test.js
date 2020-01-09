const test = require('ava')
const log = require('util').debuglog('bot-state-machine')
const {StateMachine} = require('../src')

test('basic', async t => {
  const sm = new StateMachine()

  sm.command('root')
  sm.command('back')
  .action(({state}) => state.parent)

  const ROOT = sm.rootState()

  // ROOT -- AC0 --> AS0 -- AC1 --> ROOT
  const AC0 = ROOT.command('AC0')
  const AS0 = AC0.state('AS0')

  AS0.command('AC1')

  // root -- BC0 --> BS0 -- BC1 --> BS1
  // -- BC20 --> parent
  // -- BC21 --> ROOT
  // -- BC22 --> AS0 (error)
  // -- BC23 --> BS0
  // -- BC24 --> current
  const BC0 = ROOT.command('BC0')
  const BS0 = BC0.state('BS0')

  BC0.action(() => BS0)

  const BC1 = BS0.command('BC1')
  const BS1 = BC1.state('BS1')

  BC1.action(() => BS1)

  BS1.command('BC20')
  .action(({state}) => state.parent)

  BS1.command('BC21')
  .action(() => {})

  BS1.command('BC22')
  .action(() => AS0)

  BS1.command('BC23')
  .action(() => BS0)

  BS1.command('BC24')
  .action(({state}) => state)

  const input = msg => sm.chat('bob').input(msg)

  const gotoBS1 = async () => {
    await input('BC0')
    await input('BC1')
  }

  await gotoBS1()     // BS1

  log('>> BC20')
  await input('BC20') // BS0
  await input('BC1')  // BS1

  log('>> BC21')
  await input('BC21') // ROOT
  await gotoBS1()     // BS1

  log('>> BC22')
  await t.throwsAsync(() => input('BC22'), {
    code: 'STATE_UNREACHABLE'
  })

  log('>> BC23')
  await input('BC23') // BS0
  await input('BC1')  // BS1

  log('>> BC24')
  await input('BC24') // BS1

  log('>> root')
  await input('root') // ROOT
  await gotoBS1()     // BS1

  log('>> back')
  await input('back') // BS0
  await input('BC1')  // BS1

  t.pass()
})
