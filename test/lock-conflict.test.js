const test = require('ava')

const {
  createBot,
  run
} = require('./fixture')


test('lock conflict', async t => {
  const sm = createBot()
  await run(t, sm, sm, sm)
})
