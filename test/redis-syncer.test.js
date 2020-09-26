const test = require('ava')


const {
  createBot,
  run,
  createRedis,
  createOptions
} = require('./fixture')


test.serial('lock conflict', async t => {
  await run(
    t,
    createBot(createOptions()),
    createBot(createOptions()),
    createBot(createOptions())
  )
})


test.serial('lock conflict, shared redis instance', async t => {
  const redis = createRedis()

  await run(
    t,
    createBot(createOptions(redis)),
    createBot(createOptions(redis)),
    createBot(createOptions(redis))
  )
})
