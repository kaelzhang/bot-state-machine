const test = require('ava')

const {
  createBot,
  run
} = require('./fixture')


test('lock conflict', async t => {
  await run(
    t,
    createBot(true),
    createBot(true),
    createBot(true)
  )
})
