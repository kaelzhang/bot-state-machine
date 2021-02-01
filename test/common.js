const {StateMachine} = require('..')

const run = async ({
  setup,
  input,
  distinctId,
  ...options
}) => {
  const sm = new StateMachine(options)

  const root = sm.rootState()

  setup(root, sm)

  return sm.chat(distinctId).input(input)
}

module.exports = {
  run
}
