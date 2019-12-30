const {StateMachine} = require('..')

const run = async ({
  setup,
  input,
  distinctId
}, options) => {
  const sm = new StateMachine(options)

  const root = sm.rootState()

  setup(root)

  return sm.agent(distinctId).input(input)
}

module.exports = {
  run
}
